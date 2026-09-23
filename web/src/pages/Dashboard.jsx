import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  Globe, 
  RotateCw, 
  Copy, 
  Check, 
  Terminal, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Play
} from 'lucide-react';

const mockRecentEvents = [
  {
    id: 'evt_1092',
    timestamp: '10s ago',
    method: 'POST',
    path: '/api/webhooks/stripe',
    status: 200,
    statusText: 'OK',
    latency: '18ms',
    source: 'Stripe / invoice.paid',
  },
  {
    id: 'evt_1091',
    timestamp: '45s ago',
    method: 'POST',
    path: '/api/webhooks/github',
    status: 200,
    statusText: 'OK',
    latency: '24ms',
    source: 'GitHub / push',
  },
  {
    id: 'evt_1090',
    timestamp: '2m ago',
    method: 'GET',
    path: '/api/healthcheck',
    status: 200,
    statusText: 'OK',
    latency: '12ms',
    source: 'Ping Health Monitor',
  },
  {
    id: 'evt_1089',
    timestamp: '5m ago',
    method: 'POST',
    path: '/api/webhooks/shopify',
    status: 500,
    statusText: 'Internal Error',
    latency: '142ms',
    source: 'Shopify / order.created',
  },
  {
    id: 'evt_1088',
    timestamp: '8m ago',
    method: 'PUT',
    path: '/api/users/sync',
    status: 200,
    statusText: 'OK',
    latency: '31ms',
    source: 'Auth0 / user.updated',
  },
  {
    id: 'evt_1087',
    timestamp: '12m ago',
    method: 'POST',
    path: '/api/webhooks/stripe',
    status: 200,
    statusText: 'OK',
    latency: '22ms',
    source: 'Stripe / payment_intent.succeeded',
  },
  {
    id: 'evt_1086',
    timestamp: '18m ago',
    method: 'DELETE',
    path: '/api/subscriptions/cancel',
    status: 404,
    statusText: 'Not Found',
    latency: '15ms',
    source: 'Custom Client',
  },
  {
    id: 'evt_1085',
    timestamp: '25m ago',
    method: 'POST',
    path: '/api/webhooks/github',
    status: 200,
    statusText: 'OK',
    latency: '29ms',
    source: 'GitHub / pull_request.opened',
  },
  {
    id: 'evt_1084',
    timestamp: '32m ago',
    method: 'POST',
    path: '/api/webhooks/twilio',
    status: 200,
    statusText: 'OK',
    latency: '19ms',
    source: 'Twilio / sms.received',
  },
  {
    id: 'evt_1083',
    timestamp: '40m ago',
    method: 'POST',
    path: '/api/webhooks/stripe',
    status: 200,
    statusText: 'OK',
    latency: '21ms',
    source: 'Stripe / customer.subscription.created',
  },
];

export default function Dashboard() {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCliCmd, setCopiedCliCmd] = useState(false);
  const [replayingId, setReplayingId] = useState(null);

  const ingestUrl = 'http://localhost:8080/ingest/dev-tunnel-99';
  const cliCommand = 'relay connect --to http://localhost:3000';

  const copyToClipboard = (text, setCopiedState) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const handleReplay = (id) => {
    setReplayingId(id);
    setTimeout(() => setReplayingId(null), 1000);
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
      return 'bg-relay-green/10 text-relay-green border-relay-green/20';
    }
    if (status >= 400 && status < 500) {
      return 'bg-relay-amber/10 text-relay-amber border-relay-amber/20';
    }
    return 'bg-relay-red/10 text-relay-red border-relay-red/20';
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Dashboard
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-relay-purple/20 text-relay-purple-light border border-relay-purple/30">
              Live Gateway
            </span>
          </h1>
          <p className="text-relay-subtext text-sm mt-1">
            Overview of real-time webhooks, active local tunnels, and inspection telemetry.
          </p>
        </div>

        {/* Copy Ingest URL Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => copyToClipboard(ingestUrl, setCopiedUrl)}
            className="flex items-center gap-2 bg-gradient-to-r from-relay-purple to-relay-purple-dark hover:brightness-110 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-relay-purple/25 transition-all text-sm"
          >
            {copiedUrl ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Endpoint URL Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Ingest Endpoint URL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Stat Card 1 */}
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-relay-muted uppercase tracking-wider">
              Events Today
            </span>
            <div className="w-9 h-9 rounded-lg bg-relay-purple/15 flex items-center justify-center text-relay-purple-light">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">1,248</span>
            <span className="text-xs font-semibold text-relay-green flex items-center">
              +14% <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <span className="text-[11px] text-relay-muted mt-1 block">
            Sub-second payload delivery
          </span>
        </div>

        {/* Stat Card 2 */}
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-relay-muted uppercase tracking-wider">
              Active Endpoints
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">3 Tunnels</span>
            <span className="text-xs font-medium text-emerald-400 font-mono">100% UP</span>
          </div>
          <span className="text-[11px] text-relay-muted mt-1 block">
            Local port 3000, 5000, 8080
          </span>
        </div>

        {/* Stat Card 3 */}
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-relay-muted uppercase tracking-wider">
              Total Replays
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
              <RotateCw className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">342</span>
            <span className="text-xs font-medium text-relay-subtext">This week</span>
          </div>
          <span className="text-[11px] text-relay-muted mt-1 block">
            Single-click payload re-trigger
          </span>
        </div>

        {/* Stat Card 4 */}
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-relay-muted uppercase tracking-wider">
              Avg Relay Latency
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">18ms</span>
            <span className="text-xs font-semibold text-relay-green">p95 &lt; 50ms</span>
          </div>
          <span className="text-[11px] text-relay-muted mt-1 block">
            WebSocket streaming active
          </span>
        </div>
      </div>

      {/* Quick Start Guide Section */}
      <div className="glass-panel p-6 border-l-4 border-l-relay-purple">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-relay-purple-light" />
              <h2 className="text-lg font-bold text-white">Quick Start: Connect Local Tunnel</h2>
            </div>
            <p className="text-sm text-relay-subtext max-w-2xl">
              Run the Webhook Relay CLI in your terminal to proxy incoming webhooks to your localhost application server in real-time.
            </p>
          </div>

          <div className="bg-relay-dark border border-relay-border/80 rounded-xl p-3 flex items-center justify-between gap-4 font-mono text-xs text-slate-200 min-w-0">
            <div className="flex items-center gap-2 truncate">
              <span className="text-relay-purple-light select-none">$</span>
              <span className="truncate">{cliCommand}</span>
            </div>
            <button
              onClick={() => copyToClipboard(cliCommand, setCopiedCliCmd)}
              className="p-1.5 hover:bg-relay-card rounded-md text-relay-subtext hover:text-white transition-colors shrink-0"
              title="Copy CLI command"
            >
              {copiedCliCmd ? <Check className="w-4 h-4 text-relay-green" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Events List Section (Top 10) */}
      <div className="glass-panel overflow-hidden">
        {/* Table Header / Action Bar */}
        <div className="p-5 border-b border-relay-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-relay-purple-light" />
              Recent Webhook Events
            </h2>
            <p className="text-xs text-relay-subtext mt-0.5">
              Top 10 real-time request envelopes logged across active tunnels.
            </p>
          </div>

          <Link
            to="/events"
            className="text-xs font-semibold text-relay-purple-light hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>View All Events</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-relay-subtext">
            <thead className="bg-relay-dark/60 text-relay-muted uppercase font-mono tracking-wider border-b border-relay-border/60">
              <tr>
                <th className="py-3 px-4 font-semibold">Event ID</th>
                <th className="py-3 px-4 font-semibold">Method</th>
                <th className="py-3 px-4 font-semibold">Target Path</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Source</th>
                <th className="py-3 px-4 font-semibold">Latency</th>
                <th className="py-3 px-4 font-semibold">Time</th>
                <th className="py-3 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-relay-border/40 font-mono">
              {mockRecentEvents.map((event) => (
                <tr 
                  key={event.id}
                  className="hover:bg-relay-card-hover/50 transition-colors group"
                >
                  <td className="py-3.5 px-4 font-bold text-white">
                    <Link to={`/events/${event.id}`} className="hover:text-relay-purple-light hover:underline">
                      {event.id}
                    </Link>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getMethodBadgeClass(event.method)}`}>
                      {event.method}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-200 max-w-[200px] truncate font-sans font-medium">
                    {event.path}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border inline-flex items-center gap-1 ${getStatusBadgeClass(event.status)}`}>
                      {event.status < 400 ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {event.status} {event.statusText}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 font-sans text-xs">
                    {event.source}
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 text-xs">
                    {event.latency}
                  </td>

                  <td className="py-3.5 px-4 text-relay-muted text-xs font-sans">
                    {event.timestamp}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleReplay(event.id)}
                      disabled={replayingId === event.id}
                      className="inline-flex items-center gap-1 text-xs font-sans font-medium text-relay-purple-light hover:text-white bg-relay-purple/10 hover:bg-relay-purple/20 px-2.5 py-1 rounded-md transition-colors"
                      title="Replay payload to local endpoint"
                    >
                      <Play className={`w-3 h-3 ${replayingId === event.id ? 'animate-spin' : ''}`} />
                      <span>{replayingId === event.id ? 'Replaying...' : 'Replay'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
