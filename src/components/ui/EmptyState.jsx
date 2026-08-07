import { motion } from 'framer-motion';
import { Inbox, Search, AlertCircle, WifiOff } from 'lucide-react';
import Button from './Button.jsx';

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', message, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-bg flex items-center justify-center text-muted mb-4">
        <Icon size={28} />
      </div>
      <h3 className="font-semibold text-ink mb-1">{title}</h3>
      {message && <p className="text-sm text-muted max-w-sm">{message}</p>}
      {action && actionLabel && (
        <Button onClick={action} className="mt-5" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center text-danger mb-4"
      >
        <AlertCircle size={28} />
      </motion.div>
      <h3 className="font-semibold text-ink mb-1">Oops!</h3>
      <p className="text-sm text-muted max-w-sm">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-5">
          Try again
        </Button>
      )}
    </div>
  );
}

export function NoResults({ message = 'No results found', onReset, resetLabel = 'Clear filters' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-14 h-14 rounded-full bg-bg flex items-center justify-center text-muted mb-3">
        <Search size={24} />
      </div>
      <p className="text-sm text-muted">{message}</p>
      {onReset && (
        <button onClick={onReset} className="mt-3 text-sm text-primary hover:underline">
          {resetLabel}
        </button>
      )}
    </div>
  );
}

export function OfflineBanner() {
  return (
    <div className="bg-warning/10 text-warning px-4 py-2 text-sm flex items-center justify-center gap-2">
      <WifiOff size={16} />
      You're offline. Some features may be unavailable.
    </div>
  );
}

export default EmptyState;
