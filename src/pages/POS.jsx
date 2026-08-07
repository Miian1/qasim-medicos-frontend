import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, X, CheckCircle, Printer,
  User, CreditCard, Banknote, Smartphone, Wallet, ScanLine, Tag, Percent,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { medicineAPI, customerAPI, saleAPI } from '../api/index.js';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { useAuthStore } from '../store/auth.js';
import { formatCurrency, classNames, debounce, printElement } from '../utils/format.js';

export default function POS() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [hasPrescription, setHasPrescription] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successSale, setSuccessSale] = useState(null);
  const searchRef = useRef(null);

  // Debounced search
  const doSearch = debounce(async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await medicineAPI.search(q, 20);
      setResults(res.data.medicines || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, 250);

  useEffect(() => {
    doSearch(search);
  }, [search]);

  // Keyboard shortcut: focus search
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const addToCart = (medicine) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.medicine === medicine._id);
      if (existing) {
        if (existing.quantity >= medicine.stock) {
          toast.error(`Only ${medicine.stock} in stock`);
          return prev;
        }
        return prev.map((c) =>
          c.medicine === medicine._id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      if (medicine.stock <= 0) {
        toast.error(`${medicine.name} is out of stock`);
        return prev;
      }
      return [
        ...prev,
        {
          medicine: medicine._id,
          name: medicine.name,
          price: medicine.sellingPrice,
          stock: medicine.stock,
          quantity: 1,
          discount: medicine.discount || 0,
          taxRate: medicine.taxRate || 0,
          isPrescriptionRequired: medicine.isPrescriptionRequired,
        },
      ];
    });
    setSearch('');
    setResults([]);
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.medicine !== id) return c;
          const newQty = c.quantity + delta;
          if (newQty > c.stock) {
            toast.error(`Only ${c.stock} in stock`);
            return c;
          }
          return { ...c, quantity: newQty };
        })
        .filter((c) => c.quantity > 0)
    );
  };

  const setQty = (id, qty) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.medicine !== id) return c;
        const v = Math.max(0, Math.min(qty, c.stock));
        return { ...c, quantity: v };
      }).filter((c) => c.quantity > 0)
    );
  };

  const removeItem = (id) => setCart((prev) => prev.filter((c) => c.medicine !== id));

  const clearCart = () => {
    setCart([]);
    setCustomer(null);
    setDiscountPercent(0);
    setPaidAmount('');
    setNotes('');
    setHasPrescription(false);
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, c) => sum + c.price * c.quantity * (1 - c.discount / 100), 0),
    [cart]
  );
  const tax = useMemo(
    () => cart.reduce((sum, c) => sum + (c.price * c.quantity * (1 - c.discount / 100)) * (c.taxRate / 100), 0),
    [cart]
  );
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = Math.max(0, subtotal + tax - discountAmount);
  const paid = Number(paidAmount) || total;
  const change = Math.max(0, paid - total);

  const searchCustomers = debounce(async (q) => {
    if (!q.trim()) {
      setCustomerResults([]);
      return;
    }
    try {
      const res = await customerAPI.list({ search: q, limit: 5 });
      setCustomerResults(res.data.docs || []);
    } catch {
      setCustomerResults([]);
    }
  }, 250);

  useEffect(() => {
    searchCustomers(customerSearch);
  }, [customerSearch]);

  const requiresPrescription = cart.some((c) => c.isPrescriptionRequired);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (requiresPrescription && !hasPrescription) {
      toast.error('This sale includes prescription medicines. Please check "Has prescription"');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer: customer?._id || null,
        customerName: customer?.name || 'Walk-in Customer',
        customerPhone: customer?.phone || '',
        items: cart.map((c) => ({
          medicine: c.medicine,
          quantity: c.quantity,
        })),
        discountPercent,
        paymentMethod,
        paidAmount: paid,
        notes,
        hasPrescription,
      };
      const res = await saleAPI.create(payload);
      setSuccessSale(res.data.sale);
      clearCart();
      toast.success('Sale completed!');
    } catch (err) {
      toast.error(err.message || 'Failed to complete sale');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 h-[calc(100vh-9rem)] lg:h-[calc(100vh-7rem)]">
        {/* Left: Search & products */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          <div className="card p-4">
            <div className="relative">
              <Search size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Scan barcode or search medicine... (press / to focus)"
                className="input pl-11 pr-4 py-3 text-base"
                autoFocus
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Spinner size={18} />
                </div>
              )}
            </div>
          </div>

          <div className="card flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-line flex items-center justify-between">
              <h3 className="font-semibold text-ink">
                {search ? `Search results (${results.length})` : 'Quick Add'}
              </h3>
              {!search && <p className="text-xs text-muted">Start typing to search medicines</p>}
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {search && results.length === 0 && !searching ? (
                <EmptyState icon={Search} title="No medicines found" message={`No matches for "${search}"`} />
              ) : !search ? (
                <EmptyState icon={ScanLine} title="Search to add items" message="Type a medicine name or scan a barcode to start a sale." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {results.map((m) => (
                    <button
                      key={m._id}
                      onClick={() => addToCart(m)}
                      disabled={m.stock <= 0}
                      className="flex items-center gap-3 p-3 rounded-lg border border-line hover:border-primary hover:bg-primary/5 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <Plus size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{m.name}</p>
                        <p className="text-xs text-muted">{m.brand} • {formatCurrency(m.sellingPrice)}</p>
                      </div>
                      <div className="text-right">
                        <p className={classNames(
                          'text-xs font-semibold',
                          m.stock <= 5 ? 'text-danger' : m.stock <= 10 ? 'text-warning' : 'text-success'
                        )}>
                          {m.stock} left
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Cart */}
        <div className="card flex flex-col min-h-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-primary" />
              <h3 className="font-semibold text-ink">Cart ({cart.length})</h3>
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-danger hover:underline">Clear all</button>
            )}
          </div>

          {/* Customer */}
          <div className="px-4 py-3 border-b border-line">
            {customer ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">
                    <User size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{customer.name}</p>
                    <p className="text-xs text-muted truncate">{customer.phone}</p>
                  </div>
                </div>
                <button onClick={() => setCustomer(null)} className="text-muted hover:text-danger">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowCustomerSearch(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted border border-dashed border-line rounded-lg hover:border-primary hover:text-primary"
                >
                  <User size={16} /> Add customer (optional)
                </button>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-3">
            {cart.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="Cart is empty" message="Add medicines to start a sale" />
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {cart.map((item) => (
                    <motion.div
                      key={item.medicine}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-2 p-2 rounded-lg bg-bg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{item.name}</p>
                        <p className="text-xs text-muted">{formatCurrency(item.price)} each</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(item.medicine, -1)}
                          className="w-7 h-7 rounded-md bg-card border border-line flex items-center justify-center hover:border-primary"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => setQty(item.medicine, Number(e.target.value))}
                          className="w-10 text-center text-sm border-0 bg-transparent focus:outline-none"
                        />
                        <button
                          onClick={() => updateQty(item.medicine, 1)}
                          className="w-7 h-7 rounded-md bg-card border border-line flex items-center justify-center hover:border-primary"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-ink w-16 text-right">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      <button onClick={() => removeItem(item.medicine)} className="text-muted hover:text-danger">
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Totals & checkout */}
          {cart.length > 0 && (
            <div className="border-t border-line p-4 space-y-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between text-muted">
                    <span>Tax</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-muted">
                  <span className="flex items-center gap-1"><Percent size={12} /> Discount</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                      className="w-12 text-right border border-line rounded px-1 py-0.5 text-xs"
                      min="0"
                      max="100"
                    />
                    <span className="text-xs">%</span>
                  </div>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount amount</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-line">
                  <span className="font-semibold text-ink">Total</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <p className="text-xs text-muted mb-1.5">Payment method</p>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { value: 'cash', icon: Banknote, label: 'Cash' },
                    { value: 'card', icon: CreditCard, label: 'Card' },
                    { value: 'mobile', icon: Smartphone, label: 'Mobile' },
                    { value: 'credit', icon: Wallet, label: 'Credit' },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.value}
                        onClick={() => setPaymentMethod(m.value)}
                        className={classNames(
                          'flex flex-col items-center gap-1 py-2 rounded-md border text-xs',
                          paymentMethod === m.value
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-line text-muted hover:border-primary'
                        )}
                      >
                        <Icon size={16} />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Paid amount */}
              <div>
                <p className="text-xs text-muted mb-1.5">Amount paid</p>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder={total.toFixed(2)}
                  className="input py-2 text-sm"
                />
                {change > 0 && (
                  <p className="text-xs text-success mt-1">Change: {formatCurrency(change)}</p>
                )}
              </div>

              {/* Prescription */}
              {requiresPrescription && (
                <label className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-warning/5 rounded-md">
                  <input
                    type="checkbox"
                    checked={hasPrescription}
                    onChange={(e) => setHasPrescription(e.target.checked)}
                    className="rounded border-line text-warning focus:ring-warning"
                  />
                  <span className="text-warning">Prescription verified</span>
                </label>
              )}

              <Button onClick={handleCheckout} loading={submitting} size="lg" className="w-full">
                {!submitting && <CheckCircle size={18} />}
                Complete Sale • {formatCurrency(total)}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Customer search modal */}
      <Modal isOpen={showCustomerSearch} onClose={() => setShowCustomerSearch(false)} title="Select customer" size="sm">
        <Input
          placeholder="Search by name, phone, or email..."
          value={customerSearch}
          onChange={(e) => setCustomerSearch(e.target.value)}
          icon={<Search size={18} />}
          autoFocus
        />
        <div className="mt-3 space-y-1 max-h-72 overflow-y-auto">
          {customerSearch && customerResults.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">No customers found</p>
          ) : (
            customerResults.map((c) => (
              <button
                key={c._id}
                onClick={() => {
                  setCustomer(c);
                  setShowCustomerSearch(false);
                  setCustomerSearch('');
                }}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-bg text-left"
              >
                <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-sm font-semibold">
                  {c.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{c.name}</p>
                  <p className="text-xs text-muted">{c.phone}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </Modal>

      {/* Success modal */}
      <Modal
        isOpen={!!successSale}
        onClose={() => setSuccessSale(null)}
        title="Sale Completed"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setSuccessSale(null)}>New Sale</Button>
            <Button onClick={() => navigate(`/sales/${successSale._id}`)}>View Invoice</Button>
          </>
        }
      >
        <div className="text-center py-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle size={32} />
          </motion.div>
          <h3 className="text-lg font-bold text-ink">{formatCurrency(successSale?.total)}</h3>
          <p className="text-sm text-muted mt-1">Invoice {successSale?.invoiceNumber}</p>
          {successSale?.change > 0 && (
            <p className="text-sm text-success mt-2">Change to give: {formatCurrency(successSale.change)}</p>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
