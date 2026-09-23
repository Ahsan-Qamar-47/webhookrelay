import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({ 
  title = 'Connection or Request Error', 
  message = 'Failed to load event telemetry from the relay server. Please verify gateway connectivity.',
  onRetry 
}) {
  return (
    <div className="glass-panel p-8 border-l-4 border-l-rose-500 text-center flex flex-col items-center space-y-3" role="alert" aria-live="assertive">
      <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <div className="space-y-1 max-w-md">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <p className="text-xs text-relay-subtext">{message}</p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-relay-card hover:bg-relay-card-hover border border-relay-border rounded-lg text-xs font-semibold text-slate-200 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Request</span>
        </button>
      )}
    </div>
  );
}
