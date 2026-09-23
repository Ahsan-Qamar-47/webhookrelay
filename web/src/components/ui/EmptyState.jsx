import { Inbox } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon = Inbox, 
  title = 'No Webhook Events Found', 
  message = 'No incoming webhook requests recorded yet. Start your local tunnel or trigger a test webhook.',
  actionText,
  onAction 
}) {
  return (
    <div className="glass-panel p-12 text-center flex flex-col items-center justify-center space-y-4" role="region" aria-label={title}>
      <div className="w-14 h-14 rounded-2xl bg-relay-purple/15 border border-relay-purple/30 flex items-center justify-center text-relay-purple-light shadow-lg">
        <Icon className="w-7 h-7" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
        <p className="text-xs text-relay-subtext leading-relaxed">{message}</p>
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
