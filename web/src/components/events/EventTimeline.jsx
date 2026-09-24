import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import SourceBadge from './SourceBadge';

export default function EventTimeline({ events = [], activeEventId = null }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [hoveredEvent, setHoveredEvent] = useState(null);

  const handlePrefetch = (eventId) => {
    if (!eventId) return;
    queryClient.prefetchQuery({
      queryKey: ['event', eventId],
      queryFn: async () => {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) throw new Error('Failed to fetch event detail');
        return res.json();
      },
      staleTime: 30000,
    });
  };

  if (!events || events.length === 0) {
    return null;
  }

  // Sort events chronologically (oldest to newest for horizontal timeline)
  const sortedEvents = [...events].slice(0, 15).reverse();

  const getStatusColor = (status) => {
    const code = Number(status || 200);
    if (code >= 200 && code < 300) return { bg: 'bg-emerald-500', glow: 'shadow-emerald-500/50', border: 'border-emerald-400' };
    if (code >= 400 && code < 500) return { bg: 'bg-amber-500', glow: 'shadow-amber-500/50', border: 'border-amber-400' };
    return { bg: 'bg-rose-500', glow: 'shadow-rose-500/50', border: 'border-rose-400' };
  };

  return (
    <div className="glass-panel p-4 space-y-3 font-sans">
      <div className="flex items-center justify-between border-b border-relay-border/60 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-relay-purple-light" />
          <h3 className="text-xs font-bold text-white tracking-tight uppercase">Event Ingestion Timeline</h3>
          <span className="text-[10px] font-mono font-semibold text-relay-muted">({events.length} events)</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 2xx Success
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> 4xx Client Err
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> 5xx Server Err
          </span>
        </div>
      </div>

      {/* Horizontal Timeline Track */}
      <div className="relative py-4 px-2 flex items-center justify-between overflow-x-auto min-h-[70px]">
        {/* Connecting Track Line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-relay-border/80 z-0"></div>

        {/* Timeline Dots */}
        {sortedEvents.map((evt) => {
          const colors = getStatusColor(evt.status || evt.response_status);
          const isActive = evt.id === activeEventId;

          return (
            <div
              key={evt.id}
              className="relative z-10 group"
              onMouseEnter={() => {
                setHoveredEvent(evt);
                handlePrefetch(evt.id);
              }}
              onMouseLeave={() => setHoveredEvent(null)}
            >
              <button
                onClick={() => navigate(`/events/${evt.id}`)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-relay-purple-light ${colors.bg} ${colors.border} ${
                  isActive ? 'ring-4 ring-relay-purple/60 scale-125 shadow-lg ' + colors.glow : 'shadow-md'
                }`}
                title={`Event ${evt.id} - ${evt.method} ${evt.path || ''}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              </button>

              {/* Hover Tooltip Popup */}
              {hoveredEvent?.id === evt.id && (
                <div className="absolute bottom-9 left-1/2 -translate-x-1/2 z-30 w-56 p-3 bg-relay-dark border border-relay-border rounded-xl shadow-2xl space-y-1.5 pointer-events-none text-left">
                  <div className="flex items-center justify-between border-b border-relay-border/60 pb-1 font-mono text-[10px]">
                    <span className="font-bold text-white truncate max-w-[120px]">{evt.id}</span>
                    <span className="text-relay-muted">{evt.timestamp || 'Just now'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                    <span className="font-mono text-relay-purple-light font-bold">{evt.method}</span>
                    <span className="truncate">{evt.path || '/ingest/dev-tunnel'}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <SourceBadge source={evt.source || evt.provider} size="xs" />
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                      (evt.status || 200) < 400 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}>
                      {evt.status || 200} OK
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
