import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { useAuthStore } from './store/auth.js';
import { settingsAPI } from './api/index.js';
import { setCurrencyConfig } from './utils/format.js';
import { LoadingPage } from './components/ui/Spinner.jsx';

// Lazy load pages for code-splitting
const Login = lazy(() => import('./pages/Login.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const POS = lazy(() => import('./pages/POS.jsx'));
const Medicines = lazy(() => import('./pages/Medicines.jsx'));
const MedicineForm = lazy(() => import('./pages/MedicineForm.jsx'));
const MedicineDetail = lazy(() => import('./pages/MedicineDetail.jsx'));
const Categories = lazy(() => import('./pages/Categories.jsx'));
const Suppliers = lazy(() => import('./pages/Suppliers.jsx'));
const Customers = lazy(() => import('./pages/Customers.jsx'));
const Sales = lazy(() => import('./pages/Sales.jsx'));
const SaleDetail = lazy(() => import('./pages/SaleDetail.jsx'));
const Purchases = lazy(() => import('./pages/Purchases.jsx'));
const PurchaseForm = lazy(() => import('./pages/PurchaseForm.jsx'));
const Inventory = lazy(() => import('./pages/Inventory.jsx'));
const Expenses = lazy(() => import('./pages/Expenses.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));
const Users = lazy(() => import('./pages/Users.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

export default function App() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      settingsAPI.get().then((res) => {
        if (res.data.settings?.currency) {
          setCurrencyConfig(res.data.settings.currency);
        }
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#0F172A',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22C55E', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
      <Suspense fallback={<LoadingPage />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/pos" element={<ProtectedRoute roles={['owner', 'manager', 'cashier']}><POS /></ProtectedRoute>} />
          <Route path="/medicines" element={<ProtectedRoute><Medicines /></ProtectedRoute>} />
          <Route path="/medicines/new" element={<ProtectedRoute roles={['owner', 'manager']}><MedicineForm /></ProtectedRoute>} />
          <Route path="/medicines/:id/edit" element={<ProtectedRoute roles={['owner', 'manager']}><MedicineForm /></ProtectedRoute>} />
          <Route path="/medicines/:id" element={<ProtectedRoute><MedicineDetail /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute roles={['owner', 'manager']}><Categories /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute roles={['owner', 'manager']}><Suppliers /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
          <Route path="/sales/:id" element={<ProtectedRoute><SaleDetail /></ProtectedRoute>} />
          <Route path="/purchases" element={<ProtectedRoute roles={['owner', 'manager']}><Purchases /></ProtectedRoute>} />
          <Route path="/purchases/new" element={<ProtectedRoute roles={['owner', 'manager']}><PurchaseForm /></ProtectedRoute>} />
          <Route path="/purchases/:id" element={<ProtectedRoute roles={['owner', 'manager']}><PurchaseForm /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute roles={['owner', 'manager']}><Inventory /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute roles={['owner', 'manager']}><Expenses /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute roles={['owner', 'manager']}><Reports /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={['owner']}><Users /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute roles={['owner', 'manager']}><Settings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
