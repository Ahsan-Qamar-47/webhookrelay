import { Inbox, Radio, WifiOff, Zap, Plus, ArrowRight } from 'lucide-react';

export default function EmptyState({ 
  variant = 'default', // 'default' | 'no-events' | 'no-endpoints' | 'cli-disconnected' | 'tier-exhausted'
  title, 
  message,
  actionText,
  onAction 
}) {
  if (variant === 'no-events') {
    return (
      <div className="glass-panel p-12 text-center flex flex-col items-center justify-center space-y-4" role="region" aria-label="Waiting for first webhook">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-relay-purple/15 border border-relay-purple/30 text-relay-purple-light shadow-lg">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-2xl bg-relay-purple/30 opacity-75"></span>
          <Radio className="w-8 h-8 text-relay-purple-light animate-pulse" />
        </div>

        <div className="space-y-1.5 max-w-sm">
          <h3 className="text-base font-bold text-white tracking-tight">{title || 'Waiting for first webhook...'}</h3>
          <p className="text-xs text-relay-subtext leading-relaxed">
            {message || 'Send a POST/GET request to your provisioned relay ingest URL or fire a test webhook.'}
          </p>
        </div>

        {actionText && onAction && (
          <button
            onClick={onAction}
            className="mt-2 px-4 py-2 bg-relay-purple hover:bg-relay-purple-dark text-white text-xs font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-relay-purple-light flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{actionText}</span>
          </button>
        )}
      </div>
    );
  }

  if (variant === 'cli-disconnected') {
    return (
      <div className="glass-panel p-6 bg-amber-500/10 border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 text-amber-300 font-sans text-xs">
        <div className="flex items-start gap-3">
          <WifiOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-slate-200">{title || 'CLI Tunnel Agent Disconnected'}</p>
            <p className="text-amber-300/80">
              {message || 'Run `relay connect --token <token>` in your terminal to resume forwarding webhooks to localhost.'}
            </p>
          </div>
        </div>

        {actionText && onAction && (
          <button
            onClick={onAction}
            className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-semibold rounded-lg shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {actionText}
          </button>
        )}
      </div>
    );
  }

  if (variant === 'tier-exhausted') {
    return (
      <div className="glass-panel p-8 text-center flex flex-col items-center justify-center space-y-4 border-relay-purple/40 bg-gradient-to-b from-relay-purple/10 to-transparent">
        <div className="w-14 h-14 rounded-2xl bg-relay-purple/20 border border-relay-purple/40 flex items-center justify-center text-relay-purple-light shadow-lg">
          <Zap className="w-7 h-7 text-relay-purple-light" />
        </div>

        <div className="space-y-1.5 max-w-sm">
          <h3 className="text-base font-bold text-white tracking-tight">{title || 'Monthly Event Cap Reached'}</h3>
          <p className="text-xs text-relay-subtext leading-relaxed">
            {message || 'You have processed 10,000 webhooks this month on the Developer plan. Upgrade to Team tier for unlimited throughput.'}
          </p>
        </div>

        <button
          onClick={onAction}
          className="mt-2 px-5 py-2.5 bg-gradient-to-r from-relay-purple to-relay-purple-dark hover:brightness-110 text-white text-xs font-bold rounded-xl shadow-lg shadow-relay-purple/30 transition-all flex items-center gap-1.5"
        >
          <span>{actionText || 'Upgrade Subscription Plan'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (variant === 'no-endpoints') {
    return (
      <div className="glass-panel p-12 text-center flex flex-col items-center justify-center space-y-4" role="region" aria-label="No Endpoints Provisioned">
        <div className="w-14 h-14 rounded-2xl bg-relay-purple/15 border border-relay-purple/30 flex items-center justify-center text-relay-purple-light shadow-lg">
          <Plus className="w-7 h-7" />
        </div>

        <div className="space-y-1.5 max-w-sm">
          <h3 className="text-base font-bold text-white tracking-tight">{title || 'No Webhook Endpoints Provisioned'}</h3>
          <p className="text-xs text-relay-subtext leading-relaxed">
            {message || 'Provision a unique relay subdomain to start routing webhooks to your local environment.'}
          </p>
        </div>

        {actionText && onAction && (
          <button
            onClick={onAction}
            className="mt-2 px-5 py-2.5 bg-relay-purple hover:bg-relay-purple-dark text-white text-xs font-bold rounded-xl shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-relay-purple-light flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{actionText}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="glass-panel p-12 text-center flex flex-col items-center justify-center space-y-4" role="region" aria-label={title || 'No Data'}>
      <div className="w-14 h-14 rounded-2xl bg-relay-purple/15 border border-relay-purple/30 flex items-center justify-center text-relay-purple-light shadow-lg">
        <Inbox className="w-7 h-7" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-base font-bold text-white tracking-tight">{title || 'No Webhook Events Found'}</h3>
        <p className="text-xs text-relay-subtext leading-relaxed">{message || 'No incoming webhook requests recorded yet.'}</p>
      </div>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-relay-purple hover:bg-relay-purple-dark text-white text-xs font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-relay-purple-light"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
