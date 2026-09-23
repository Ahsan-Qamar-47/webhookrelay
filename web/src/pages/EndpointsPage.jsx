import { Globe, Server } from 'lucide-react';

export default function EndpointsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Globe className="w-6 h-6 text-relay-purple-light" />
            Active Endpoints
          </h1>
          <p className="text-relay-subtext text-sm mt-1">
            Manage your local target endpoints and tunneling destinations.
          </p>
        </div>
      </div>

      <div className="glass-panel p-8 text-center text-relay-muted">
        <Server className="w-12 h-12 mx-auto text-relay-purple/40 mb-3" />
        <h3 className="text-lg font-semibold text-slate-300">Target Endpoint Manager</h3>
        <p className="text-sm text-relay-subtext max-w-md mx-auto mt-1">
          Registered tunnels pointing to http://localhost:3000 and custom dev ports.
        </p>
      </div>
    </div>
  );
}
