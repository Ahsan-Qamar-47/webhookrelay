import { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Globe, 
  Play, 
  Copy, 
  Check 
} from 'lucide-react';

export default function EventHeader({ event, onReplay }) {
  const [isReplaying, setIsReplaying] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleReplayClick = () => {
    setIsReplaying(true);
    onReplay?.(event?.id);
    setTimeout(() => setIsReplaying(false), 1000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(event?.id || '');
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getMethodBadgeClass = (method) => {
    switch (method) {
      case 'POST':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'GET':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'DELETE':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status >= 200 && status < 300) {
      return 'bg-relay-green/15 text-relay-green border-relay-green/30';
    }
    if (status >= 400 && status < 500) {
      return 'bg-relay-amber/15 text-relay-amber border-relay-amber/30';
    }
    return 'bg-relay-red/15 text-relay-red border-relay-red/30';
  };

  return (
    <div className="glass-panel p-6 space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-md text-xs font-mono font-bold border ${getMethodBadgeClass(event?.method || 'POST')}`}>
            {event?.method || 'POST'}
          </span>

          <h1 className="text-lg md:text-xl font-mono font-bold text-white tracking-tight truncate max-w-lg">
            {event?.path || '/api/webhooks/incoming'}
          </h1>

          <button
            onClick={handleCopyId}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-relay-dark border border-relay-border rounded-md text-xs text-relay-subtext hover:text-white transition-colors font-mono"
            title="Copy Event ID"
          >
            {copiedId ? <Check className="w-3.5 h-3.5 text-relay-green" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{event?.id || 'evt_sample'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReplayClick}
            disabled={isReplaying}
            className="flex items-center gap-2 bg-gradient-to-r from-relay-purple to-relay-purple-dark hover:brightness-110 text-white font-medium px-4 py-2 rounded-lg text-xs shadow-md shadow-relay-purple/20 transition-all"
          >
            <Play className={`w-3.5 h-3.5 ${isReplaying ? 'animate-spin' : ''}`} />
            <span>{isReplaying ? 'Replaying...' : 'Replay Webhook'}</span>
          </button>
        </div>
      </div>

      {/* Metadata Badges & Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-relay-border/60 text-xs font-mono">
        <div>
          <span className="text-relay-muted block text-[10px] uppercase tracking-wider mb-1 font-sans">Source Provider</span>
          <span className="text-slate-200 font-semibold flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-relay-purple-light" />
            {event?.source || event?.provider || 'Stripe / invoice.paid'}
          </span>
        </div>

        <div>
          <span className="text-relay-muted block text-[10px] uppercase tracking-wider mb-1 font-sans">Response Status</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${getStatusBadgeClass(event?.status || event?.response_status || 200)}`}>
            {(event?.status || event?.response_status || 200) < 400 ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            {event?.status || event?.response_status || 200} OK
          </span>
        </div>

        <div>
          <span className="text-relay-muted block text-[10px] uppercase tracking-wider mb-1 font-sans">IP Address</span>
          <span className="text-slate-300 font-medium">
            {event?.ip_address || event?.ip || '192.168.1.1'}
          </span>
        </div>

        <div>
          <span className="text-relay-muted block text-[10px] uppercase tracking-wider mb-1 font-sans">Received Timestamp</span>
          <span className="text-slate-300 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-relay-muted" />
            {event?.received_at ? new Date(event.received_at).toLocaleTimeString() : event?.timestamp || 'Just now'}
          </span>
        </div>
      </div>
    </div>
  );
}
