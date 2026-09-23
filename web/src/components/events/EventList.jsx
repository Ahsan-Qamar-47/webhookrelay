import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Zap
} from 'lucide-react';

export default function EventList({ 
  events = [], 
  totalCount = 0,
  page = 1,
  limit = 10,
  onPageChange,
  methodFilter = '',
  onMethodChange,
  sourceSearch = '',
  onSourceSearchChange,
  newEventCount = 0,
  autoRefresh = true,
  onToggleAutoRefresh,
  onFlushNewEvents,
  isLoading = false
}) {
  const navigate = useNavigate();
  const [replayingId, setReplayingId] = useState(null);

  const handleRowClick = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const handleReplayClick = (e, eventId) => {
    e.stopPropagation();
    setReplayingId(eventId);
    setTimeout(() => setReplayingId(null), 1000);
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

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
    <div className="space-y-4">
      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Source / Provider */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-relay-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by source or payload..."
              value={sourceSearch}
              onChange={(e) => onSourceSearchChange?.(e.target.value)}
              className="w-full bg-relay-dark border border-relay-border rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-relay-muted focus:outline-none focus:border-relay-purple"
            />
          </div>

          {/* HTTP Method Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-relay-muted" />
            <select
              value={methodFilter}
              onChange={(e) => onMethodChange?.(e.target.value)}
              className="bg-relay-dark border border-relay-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-relay-purple"
            >
              <option value="">All Methods</option>
              <option value="POST">POST</option>
              <option value="GET">GET</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </div>

        {/* Real-time Streaming & Auto-Refresh Toggle */}
        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-relay-border/80 pt-3 md:pt-0 md:pl-4">
          <button
            onClick={onToggleAutoRefresh}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              autoRefresh
                ? 'bg-relay-green/15 text-relay-green border-relay-green/30'
                : 'bg-relay-card text-relay-subtext border-relay-border'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin-slow text-relay-green' : ''}`} />
            <span>{autoRefresh ? 'Auto-Stream ON' : 'Auto-Stream OFF'}</span>
          </button>
        </div>
      </div>

      {/* New Events Pending Banner */}
      {newEventCount > 0 && !autoRefresh && (
        <button
          onClick={onFlushNewEvents}
          className="w-full bg-gradient-to-r from-relay-purple/20 via-relay-purple/30 to-relay-purple/20 border border-relay-purple/40 rounded-xl p-3 flex items-center justify-center gap-2 text-xs text-relay-purple-light font-semibold hover:brightness-125 transition-all shadow-md"
        >
          <Zap className="w-4 h-4 text-relay-purple-light animate-bounce" />
          <span>{newEventCount} new incoming webhooks received — Click to view</span>
        </button>
      )}

      {/* Event List Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-relay-subtext">
            <thead className="bg-relay-dark/80 text-relay-muted uppercase font-mono tracking-wider border-b border-relay-border/60">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Event ID</th>
                <th className="py-3.5 px-4 font-semibold">Method</th>
                <th className="py-3.5 px-4 font-semibold">Target Path</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Source</th>
                <th className="py-3.5 px-4 font-semibold">Latency</th>
                <th className="py-3.5 px-4 font-semibold">Received</th>
                <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-relay-border/40 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-relay-muted">
                    <Activity className="w-8 h-8 animate-spin mx-auto text-relay-purple-light mb-2" />
                    <span>Loading event history...</span>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-relay-muted">
                    <Activity className="w-8 h-8 mx-auto text-relay-muted/40 mb-2" />
                    <span>No events matched the selected filter query.</span>
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr
                    key={event.id}
                    onClick={() => handleRowClick(event.id)}
                    className="hover:bg-relay-card-hover/60 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-bold text-white group-hover:text-relay-purple-light">
                      {event.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getMethodBadgeClass(event.method)}`}>
                        {event.method}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-200 max-w-[220px] truncate font-sans font-medium">
                      {event.path}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border inline-flex items-center gap-1 ${getStatusBadgeClass(event.status)}`}>
                        {event.status < 400 ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {event.status} {event.statusText || 'OK'}
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
                        onClick={(e) => handleReplayClick(e, event.id)}
                        disabled={replayingId === event.id}
                        className="inline-flex items-center gap-1 text-xs font-sans font-medium text-relay-purple-light hover:text-white bg-relay-purple/10 hover:bg-relay-purple/20 px-2.5 py-1 rounded-md transition-colors"
                        title="Replay webhook payload"
                      >
                        <Play className={`w-3 h-3 ${replayingId === event.id ? 'animate-spin' : ''}`} />
                        <span>{replayingId === event.id ? 'Replaying' : 'Replay'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-relay-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-relay-subtext">
          <div>
            Showing <span className="font-bold text-white">{events.length}</span> of{' '}
            <span className="font-bold text-white">{totalCount}</span> total events (Page {page} of {totalPages})
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-relay-border bg-relay-dark hover:bg-relay-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-mono font-semibold text-white">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-relay-border bg-relay-dark hover:bg-relay-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
