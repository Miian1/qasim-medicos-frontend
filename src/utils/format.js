// Currency formatter based on settings
let currencyConfig = {
  code: 'PKR',
  symbol: 'Rs',
  position: 'before',
};

export function setCurrencyConfig(config = {}) {
  currencyConfig = { ...currencyConfig, ...config };
}

export function formatCurrency(amount, options = {}) {
  const num = Number(amount || 0);
  const { decimals = 2, showSymbol = true } = options;
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  if (!showSymbol) return formatted;
  return currencyConfig.position === 'before'
    ? `${currencyConfig.symbol} ${formatted}`
    : `${formatted} ${currencyConfig.symbol}`;
}

export function formatNumber(num) {
  return Number(num || 0).toLocaleString('en-US');
}

export function formatDate(date, format = 'medium') {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d)) return '—';
  const opts = {
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    short: { month: 'short', day: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  };
  return d.toLocaleDateString('en-US', opts[format] || opts.medium);
}

export function formatRelativeTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(d, 'short');
}

export function daysUntil(date) {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function downloadCSV(data, filename = 'export.csv') {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => {
        const v = row[h];
        if (v === null || v === undefined) return '';
        const s = String(v).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printElement(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const win = window.open('', '', 'width=800,height=600');
  win.document.write(`
    <html>
      <head>
        <title>Print</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 24px; color: #0F172A; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #E2E8F0; }
          th { background: #F8FAFC; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
        </style>
      </head>
      <body>${el.innerHTML}</body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 250);
}
