import { useState } from 'react';
import { 
  Globe, 
  Plus, 
  Copy, 
  Check, 
  RefreshCw, 
  Trash2, 
  Server,
  Zap
} from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

const initialMockEndpoints = [
  {
    id: 'ep_101',
    subdomain: 'stripe-demo',
    destination_url: 'http://localhost:3000/api/webhooks/stripe',
    public_url: 'http://localhost:8080/ingest/stripe-demo',
    secret: 'whsec_demo_secret_key_12345',
    is_active: true,
    created_at: '2026-10-15T10:00:00Z',
  },
  {
    id: 'ep_102',
    subdomain: 'github-demo',
    destination_url: 'http://localhost:3000/api/webhooks/github',
    public_url: 'http://localhost:8080/ingest/github-demo',
    secret: 'whsec_github_secret_key_67890',
    is_active: true,
    created_at: '2026-10-18T14:30:00Z',
  },
];

export default function EndpointsPage() {
  const [endpoints, setEndpoints] = useState(initialMockEndpoints);
  const [copiedId, setCopiedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [destinationUrl, setDestinationUrl] = useState('http://localhost:3000/api/webhooks');
  const [customSubdomain, setCustomSubdomain] = useState('');

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateEndpoint = (e) => {
    e.preventDefault();
    const subdomain = customSubdomain.trim().toLowerCase() || `tunnel-${Math.random().toString(36).substring(2, 8)}`;
    const newEp = {
      id: `ep_${Date.now()}`,
      subdomain,
      destination_url: destinationUrl,
      public_url: `http://localhost:8080/ingest/${subdomain}`,
      secret: `whsec_${Math.random().toString(36).substring(2, 18)}`,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    setEndpoints((prev) => [newEp, ...prev]);
    setIsModalOpen(false);
    setCustomSubdomain('');
  };

  const handleRotate = (id) => {
    const newSubdomain = `tunnel-${Math.random().toString(36).substring(2, 8)}`;
    setEndpoints((prev) =>
      prev.map((ep) =>
        ep.id === id
          ? {
              ...ep,
              subdomain: newSubdomain,
              public_url: `http://localhost:8080/ingest/${newSubdomain}`,
              secret: `whsec_${Math.random().toString(36).substring(2, 18)}`,
            }
          : ep
      )
    );
  };

  const handleDelete = (id) => {
    setEndpoints((prev) => prev.filter((ep) => ep.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-relay-purple-light" />
            Active Webhook Endpoints
          </h1>
          <p className="text-relay-subtext text-sm mt-1">
            Provision and manage public ingest tunnels and local forwarding destinations.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-relay-purple hover:bg-relay-purple-dark text-white text-xs font-bold rounded-xl shadow-lg shadow-relay-purple/20 transition-all focus:outline-none focus:ring-2 focus:ring-relay-purple-light"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Endpoint</span>
        </button>
      </div>

      {/* Endpoints List Table or Empty State */}
      {endpoints.length === 0 ? (
        <EmptyState
          variant="no-endpoints"
          title="No Active Webhook Tunnels"
          message="Provision a unique relay subdomain to start routing webhooks to your local environment."
          actionText="Provision First Endpoint"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-relay-subtext">
              <thead className="bg-relay-dark/80 text-relay-muted uppercase font-mono tracking-wider border-b border-relay-border/60">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Subdomain</th>
                  <th className="py-3.5 px-4 font-semibold">Public Ingestion URL</th>
                  <th className="py-3.5 px-4 font-semibold">Local Destination</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-relay-border/40 font-mono">
                {endpoints.map((ep) => (
                  <tr key={ep.id} className="hover:bg-relay-card-hover/60 transition-colors">
                    <td className="py-4 px-4 font-bold text-white">
                      <span className="flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-relay-purple-light" />
                        {ep.subdomain}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-relay-purple-light max-w-[260px] truncate">{ep.public_url}</span>
                        <button
                          onClick={() => handleCopy(ep.public_url, ep.id)}
                          className="p-1 text-relay-muted hover:text-white transition-colors"
                          title="Copy Public Ingest URL"
                        >
                          {copiedId === ep.id ? <Check className="w-3.5 h-3.5 text-relay-green" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-300 font-sans truncate max-w-[200px]">
                      {ep.destination_url}
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-relay-green/15 text-relay-green border border-relay-green/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-relay-green animate-pulse"></span>
                        Active
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleRotate(ep.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-sans text-relay-subtext hover:text-white bg-relay-dark border border-relay-border rounded-lg transition-colors"
                        title="Rotate subdomain and secret"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>

                      <button
                        onClick={() => handleDelete(ep.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-sans text-rose-400 hover:text-rose-200 bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors"
                        title="Delete Endpoint"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Provision Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 space-y-5 border-relay-purple/30">
            <div className="flex items-center justify-between border-b border-relay-border pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-relay-purple-light" />
                Provision Webhook Tunnel
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-relay-muted hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEndpoint} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-relay-subtext font-semibold mb-1">
                  Custom Subdomain (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. stripe-demo"
                  value={customSubdomain}
                  onChange={(e) => setCustomSubdomain(e.target.value)}
                  className="w-full bg-relay-dark border border-relay-border rounded-lg px-3 py-2 text-white placeholder-relay-muted focus:outline-none focus:ring-2 focus:ring-relay-purple-light"
                />
              </div>

              <div>
                <label className="block text-relay-subtext font-semibold mb-1">
                  Local Destination Forwarding URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="http://localhost:3000/api/webhooks"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  className="w-full bg-relay-dark border border-relay-border rounded-lg px-3 py-2 text-white placeholder-relay-muted focus:outline-none focus:ring-2 focus:ring-relay-purple-light"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-relay-dark hover:bg-relay-card border border-relay-border text-slate-300 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-relay-purple hover:bg-relay-purple-dark text-white font-bold rounded-lg shadow-md transition-all"
                >
                  Create Endpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
