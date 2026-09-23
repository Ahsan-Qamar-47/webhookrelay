import { useState, useEffect } from 'react';
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
  Zap,
  Keyboard
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
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard Navigation: j (down), k (up), Enter (inspect)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger when typing inside inputs
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(events.length - 1, prev + 1));
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Enter' && events[selectedIndex]) {
        e.preventDefault();
        navigate(`/events/${events[selectedIndex].id}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [events, selectedIndex, navigate]);

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
    <div className="space-y-4" role="region" aria-label="Webhook Events Inspector Feed">
      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Source / Provider */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-relay-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Filter events by source or payload"
              placeholder="Search by source or payload... (j/k to navigate)"
              value={sourceSearch}
              onChange={(e) => onSourceSearchChange?.(e.target.value)}
              className="w-full bg-relay-dark border border-relay-border rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-relay-muted focus:outline-none focus:ring-2 focus:ring-relay-purple-light"
            />
          </div>

          {/* HTTP Method Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-relay-muted" />
            <select
              aria-label="Filter by HTTP Method"
              value={methodFilter}
              onChange={(e) => onMethodChange?.(e.target.value)}
              className="bg-relay-dark border border-relay-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-relay-purple-light"
            >
              <option value="">All Methods</option>
              <option value="POST">POST</option>
              <option value="GET">GET</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </div>

        {/* Shortcuts Hint & Auto-Refresh Toggle */}
        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-relay-border/80 pt-3 md:pt-0 md:pl-4">
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-relay-muted font-mono bg-relay-dark border border-relay-border px-2.5 py-1 rounded-md">
            <Keyboard className="w-3.5 h-3.5 text-relay-purple-light" />
            <span><kbd className="text-white font-bold">J</kbd>/<kbd className="text-white font-bold">K</kbd> navigate</span>
          </div>

          <button
            onClick={onToggleAutoRefresh}
            aria-label={autoRefresh ? 'Disable live auto-stream' : 'Enable live auto-stream'}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border focus:outline-none focus:ring-2 focus:ring-relay-purple-light ${
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
          aria-label={`Flush ${newEventCount} new incoming webhooks`}
          className="w-full bg-gradient-to-r from-relay-purple/20 via-relay-purple/30 to-relay-purple/20 border border-relay-purple/40 rounded-xl p-3 flex items-center justify-center gap-2 text-xs text-relay-purple-light font-semibold hover:brightness-125 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-relay-purple-light"
        >
          <Zap className="w-4 h-4 text-relay-purple-light animate-bounce" />
          <span>{newEventCount} new incoming webhooks received — Click to view</span>
        </button>
      )}

      {/* Event List Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-relay-subtext" role="table" aria-label="Webhook events table">
            <thead className="bg-relay-dark/80 text-relay-muted uppercase font-mono tracking-wider border-b border-relay-border/60">
              <tr role="row">
                <th className="py-3.5 px-4 font-semibold" role="columnheader">Event ID</th>
                <th className="py-3.5 px-4 font-semibold" role="columnheader">Method</th>
                <th className="py-3.5 px-4 font-semibold" role="columnheader">Target Path</th>
                <th className="py-3.5 px-4 font-semibold" role="columnheader">Status</th>
                <th className="py-3.5 px-4 font-semibold" role="columnheader">Source</th>
                <th className="py-3.5 px-4 font-semibold" role="columnheader">Latency</th>
                <th className="py-3.5 px-4 font-semibold" role="columnheader">Received</th>
                <th className="py-3.5 px-4 text-right font-semibold" role="columnheader">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-relay-border/40 font-mono">
              {isLoading ? (
                <tr role="row">
                  <td colSpan="8" className="py-12 text-center text-relay-muted">
                    <Activity className="w-8 h-8 animate-spin mx-auto text-relay-purple-light mb-2" />
                    <span>Loading event history...</span>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr role="row">
                  <td colSpan="8" className="py-12 text-center text-relay-muted">
                    <Activity className="w-8 h-8 mx-auto text-relay-muted/40 mb-2" />
                    <span>No events matched the selected filter query.</span>
                  </td>
                </tr>
              ) : (
                events.map((event, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <tr
                      key={event.id}
                      role="row"
                      tabIndex={0}
                      aria-selected={isSelected}
                      onClick={() => {
                        setSelectedIndex(idx);
                        handleRowClick(event.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRowClick(event.id);
                      }}
                      className={`cursor-pointer transition-colors group focus:outline-none focus:ring-2 focus:ring-relay-purple-light ${
                        isSelected
                          ? 'bg-relay-purple/20 border-l-4 border-l-relay-purple'
                          : 'hover:bg-relay-card-hover/60'
                      }`}
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
                          aria-label={`Replay payload for event ${event.id}`}
                          className="inline-flex items-center gap-1 text-xs font-sans font-medium text-relay-purple-light hover:text-white bg-relay-purple/10 hover:bg-relay-purple/20 px-2.5 py-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-relay-purple-light"
                          title="Replay webhook payload"
                        >
                          <Play className={`w-3 h-3 ${replayingId === event.id ? 'animate-spin' : ''}`} />
                          <span>{replayingId === event.id ? 'Replaying' : 'Replay'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
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
              aria-label="Previous Page"
              className="p-1.5 rounded-lg border border-relay-border bg-relay-dark hover:bg-relay-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-relay-purple-light"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-mono font-semibold text-white">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              aria-label="Next Page"
              className="p-1.5 rounded-lg border border-relay-border bg-relay-dark hover:bg-relay-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-relay-purple-light"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
