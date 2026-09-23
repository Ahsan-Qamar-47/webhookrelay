import { useState } from 'react';
import { X, GitCompare, Search } from 'lucide-react';
import JsonDiff from './JsonDiff';

export default function CompareModal({ 
  isOpen, 
  onClose, 
  currentEvent, 
  availableEvents = [], 
  onSelectTargetEvent,
  targetEvent
}) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredEvents = availableEvents.filter(
    (evt) => evt.id !== currentEvent?.id && (
      evt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.source || evt.provider || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.path || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border-relay-border shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 border-b border-relay-border flex items-center justify-between bg-relay-dark/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-relay-purple/20 flex items-center justify-center text-relay-purple-light">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Compare Event Payload</h2>
              <p className="text-xs text-relay-subtext">
                Comparing <span className="font-mono text-relay-purple-light">{currentEvent?.id}</span> against target event payload.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-relay-muted hover:text-white hover:bg-relay-card transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Event Quick Selector Bar */}
        <div className="p-4 bg-relay-card/60 border-b border-relay-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-relay-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search target event to compare..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-relay-dark border border-relay-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-relay-muted focus:outline-none focus:border-relay-purple"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-relay-muted font-sans">Active Target:</span>
            <select
              value={targetEvent?.id || ''}
              onChange={(e) => onSelectTargetEvent?.(e.target.value)}
              className="bg-relay-dark border border-relay-border rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-relay-purple"
            >
              <option value="" disabled>Select event...</option>
              {filteredEvents.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.id} ({evt.method} {evt.source || evt.provider})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Body / Diff Container */}
        <div className="flex-1 overflow-y-auto p-4 bg-relay-dark/40">
          <JsonDiff
            leftEvent={currentEvent}
            rightEvent={targetEvent || filteredEvents[0]}
            availableEvents={filteredEvents}
            onSelectCompareEvent={onSelectTargetEvent}
          />
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-relay-dark border-t border-relay-border flex items-center justify-between text-xs text-relay-muted">
          <span>Press ESC or click close to dismiss window</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-relay-card border border-relay-border rounded-lg text-white font-medium hover:bg-relay-card-hover transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
