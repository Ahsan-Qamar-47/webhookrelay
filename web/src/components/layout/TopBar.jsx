import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';

export default function TopBar() {
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const defaultIngestUrl = 'http://localhost:8080/ingest/dev-tunnel-99';

  const handleCopy = () => {
    navigator.clipboard.writeText(defaultIngestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBreadcrumbName = (pathname) => {
    if (pathname === '/') return 'Dashboard';
    if (pathname.startsWith('/events/')) return 'Events / Details';
    if (pathname === '/events') return 'Events Log';
    if (pathname === '/endpoints') return 'Active Endpoints';
    if (pathname === '/settings') return 'Settings';
    return 'Workspace';
  };

  return (
    <header className="h-16 border-b border-relay-border bg-relay-dark/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-relay-muted font-medium">Relay</span>
        <span className="text-relay-border">/</span>
        <span className="text-white font-semibold">{getBreadcrumbName(location.pathname)}</span>
      </div>

      {/* TopBar Actions & Quick Ingest URL */}
      <div className="flex items-center gap-3">
        {/* Quick Ingest Copy Pill */}
        <div className="hidden md:flex items-center bg-relay-card border border-relay-border rounded-lg p-1 pl-3 text-xs font-mono text-relay-subtext gap-2">
          <span className="text-relay-purple-light font-semibold">Ingest URL:</span>
          <span className="text-slate-300 truncate max-w-[220px]">{defaultIngestUrl}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 bg-relay-purple/20 hover:bg-relay-purple/30 text-relay-purple-light hover:text-white px-2.5 py-1 rounded-md transition-colors text-xs font-sans font-medium"
            title="Copy Ingest URL"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-relay-green" />
                <span className="text-relay-green">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-3 border-l border-relay-border/80">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-relay-border flex items-center justify-center text-relay-purple-light font-bold text-xs">
            DEV
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-semibold text-white">Developer</span>
            <span className="text-[10px] text-relay-muted">Local Session</span>
          </div>
        </div>
      </div>
    </header>
  );
}
