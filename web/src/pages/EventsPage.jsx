import { Activity } from 'lucide-react';

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-relay-purple-light" />
            Events Log
          </h1>
          <p className="text-relay-subtext text-sm mt-1">
            Real-time feed of all incoming HTTP webhook requests routed through relay.
          </p>
        </div>
      </div>

      <div className="glass-panel p-8 text-center text-relay-muted">
        <Activity className="w-12 h-12 mx-auto text-relay-purple/40 mb-3 animate-pulse" />
        <h3 className="text-lg font-semibold text-slate-300">Live Inspector Feed Active</h3>
        <p className="text-sm text-relay-subtext max-w-md mx-auto mt-1">
          Detailed payload, headers, and diff inspector view configured for upcoming module.
        </p>
      </div>
    </div>
  );
}
