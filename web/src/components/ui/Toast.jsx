import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer({ toasts = [], onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold backdrop-blur-md animate-slideUp transition-all ${
              isSuccess
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : isError
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-relay-card/90 border-relay-purple/40 text-relay-purple-light'
            }`}
            role="status"
            aria-live="polite"
          >
            {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {isError && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {!isSuccess && !isError && <Info className="w-4 h-4 text-relay-purple-light shrink-0" />}

            <span className="flex-1">{toast.message}</span>

            <button
              onClick={() => onDismiss?.(toast.id)}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
