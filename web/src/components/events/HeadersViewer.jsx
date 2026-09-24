import { useState, useMemo } from 'react';
import { Copy, Check, FileText, ShieldCheck, Search, Code, Terminal, Lock, HardDrive, Cpu } from 'lucide-react';

export default function HeadersViewer({ headers = {}, event = {} }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedFetch, setCopiedFetch] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');

  const headerEntries = Object.entries(headers || {});
  const hasStripeSig = headerEntries.some(([k]) => k.toLowerCase() === 'stripe-signature');

  // Filter entries based on search input
  const filteredEntries = useMemo(() => {
    if (!headerSearch.trim()) return headerEntries;
    const query = headerSearch.toLowerCase();
    return headerEntries.filter(([k, v]) => 
      k.toLowerCase().includes(query) || String(v).toLowerCase().includes(query)
    );
  }, [headerEntries, headerSearch]);

  // Group headers into categories
  const groupedHeaders = useMemo(() => {
    const authKeys = ['authorization', 'stripe-signature', 'x-hub-signature', 'x-hub-signature-256', 'x-slack-signature', 'x-api-key', 'cookie', 'bearer'];
    const transferKeys = ['content-type', 'content-length', 'accept', 'user-agent', 'host', 'origin', 'referer', 'x-forwarded-for', 'x-request-id'];

    const auth = [];
    const transfer = [];
    const custom = [];

    filteredEntries.forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (authKeys.some((k) => lowerKey.includes(k))) {
        auth.push([key, value]);
      } else if (transferKeys.some((k) => lowerKey === k)) {
        transfer.push([key, value]);
      } else {
        custom.push([key, value]);
      }
    });

    return { auth, transfer, custom };
  }, [filteredEntries]);

  const handleCopyPair = (key, value) => {
    navigator.clipboard.writeText(`${key}: ${value}`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = () => {
    const formatted = headerEntries.map(([k, v]) => `${k}: ${v}`).join('\n');
    navigator.clipboard.writeText(formatted);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyAsCurl = () => {
    const method = event.method || 'POST';
    const targetUrl = `http://localhost:8080${event.path || '/ingest/dev-tunnel'}`;
    const headerFlags = headerEntries.map(([k, v]) => `-H "${k}: ${v}"`).join(' \\\n  ');
    const bodyPayload = typeof event.payload === 'object' ? JSON.stringify(event.payload) : String(event.payload || '');
    const dataFlag = bodyPayload ? ` \\\n  -d '${bodyPayload.replace(/'/g, "'\\''")}'` : '';

    const curlCmd = `curl -X ${method} "${targetUrl}" \\\n  ${headerFlags}${dataFlag}`;
    navigator.clipboard.writeText(curlCmd);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleCopyAsFetch = () => {
    const method = event.method || 'POST';
    const targetUrl = `http://localhost:8080${event.path || '/ingest/dev-tunnel'}`;
    const headersObj = {};
    headerEntries.forEach(([k, v]) => { headersObj[k] = String(v); });

    const fetchSnippet = `fetch('${targetUrl}', {
  method: '${method}',
  headers: ${JSON.stringify(headersObj, null, 4)},
  body: ${typeof event.payload === 'object' ? JSON.stringify(event.payload, null, 4) : JSON.stringify(event.payload || '')}
})
.then(res => res.json())
.then(data => console.log(data));`;

    navigator.clipboard.writeText(fetchSnippet);
    setCopiedFetch(true);
    setTimeout(() => setCopiedFetch(false), 2000);
  };

  const renderHeaderTableGroup = (title, entries, IconComponent) => {
    if (entries.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="px-4 py-1.5 bg-relay-dark/90 border-y border-relay-border/60 text-[11px] font-mono font-bold text-relay-muted uppercase tracking-wider flex items-center gap-1.5">
          <IconComponent className="w-3.5 h-3.5 text-relay-purple-light" />
          <span>{title} ({entries.length})</span>
        </div>
        <table className="w-full text-left text-xs font-mono">
          <tbody className="divide-y divide-relay-border/30">
            {entries.map(([key, value]) => {
              const isSig = key.toLowerCase() === 'stripe-signature';
              return (
                <tr 
                  key={key} 
                  className={`transition-colors group ${
                    isSig ? 'bg-emerald-500/10 hover:bg-emerald-500/15' : 'hover:bg-relay-card-hover/40'
                  }`}
                >
                  <td className="py-2.5 px-4 font-bold w-1/3 truncate flex items-center gap-1.5">
                    <span className={isSig ? 'text-emerald-300' : 'text-relay-purple-light'}>
                      {key}
                    </span>
                    {isSig && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        PRESERVED
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-slate-200 break-all select-all font-mono">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </td>
                  <td className="py-2.5 px-4 text-right w-16">
                    <button
                      onClick={() => handleCopyPair(key, value)}
                      className="p-1 rounded bg-relay-dark border border-relay-border hover:border-relay-purple text-relay-muted hover:text-white transition-colors"
                      title={`Copy ${key}`}
                    >
                      {copiedKey === key ? (
                        <Check className="w-3.5 h-3.5 text-relay-green" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="glass-panel overflow-hidden space-y-0">
      {/* Header & Controls Bar */}
      <div className="p-4 border-b border-relay-border/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-relay-dark/60">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-relay-purple-light" />
          <h3 className="text-sm font-bold text-white">HTTP Request Headers ({headerEntries.length})</h3>
        </div>

        {/* Filter Input & Action Snippet Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Header Search */}
          <div className="relative min-w-[160px]">
            <Search className="w-3.5 h-3.5 text-relay-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter headers..."
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              className="w-full bg-relay-dark border border-relay-border rounded-lg pl-8 pr-2 py-1 text-xs text-white placeholder-relay-muted focus:outline-none focus:ring-1 focus:ring-relay-purple-light"
            />
          </div>

          {/* Copy cURL Button */}
          <button
            onClick={handleCopyAsCurl}
            className="flex items-center gap-1 px-2.5 py-1 bg-relay-purple/20 hover:bg-relay-purple/30 border border-relay-purple/40 text-relay-purple-light hover:text-white rounded-lg text-xs font-semibold transition-colors"
            title="Copy executable cURL command string"
          >
            {copiedCurl ? <Check className="w-3.5 h-3.5 text-relay-green" /> : <Terminal className="w-3.5 h-3.5" />}
            <span>{copiedCurl ? 'Copied cURL!' : 'Copy cURL'}</span>
          </button>

          {/* Copy Fetch Button */}
          <button
            onClick={handleCopyAsFetch}
            className="flex items-center gap-1 px-2.5 py-1 bg-relay-dark hover:bg-relay-card border border-relay-border text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
            title="Copy JavaScript fetch code snippet"
          >
            {copiedFetch ? <Check className="w-3.5 h-3.5 text-relay-green" /> : <Code className="w-3.5 h-3.5 text-relay-purple-light" />}
            <span>{copiedFetch ? 'Copied Fetch!' : 'Copy fetch'}</span>
          </button>

          {/* Copy All Headers */}
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1 px-2.5 py-1 bg-relay-dark border border-relay-border rounded-lg text-xs font-semibold text-relay-subtext hover:text-white transition-colors"
            title="Copy raw key-value headers list"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-relay-green" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAll ? 'Copied All' : 'Copy All'}</span>
          </button>
        </div>
      </div>

      {/* Signature Preservation Banner */}
      {hasStripeSig && (
        <div className="bg-emerald-950/40 border-b border-emerald-500/20 px-4 py-2.5 flex items-center gap-2.5 text-xs text-emerald-300 font-sans">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="font-semibold text-emerald-200">Stripe-Signature header preserved verbatim:</strong> Signature validation occurs inside your local app SDK (<code className="font-mono text-emerald-300 bg-emerald-900/50 px-1 py-0.5 rounded">stripe.webhooks.constructEvent</code>).
          </span>
        </div>
      )}

      {/* Categorized Headers Groups */}
      <div className="overflow-x-auto divide-y divide-relay-border/40">
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-relay-muted font-sans text-xs">
            No headers matched the search filter "{headerSearch}".
          </div>
        ) : (
          <>
            {renderHeaderTableGroup('Authentication & Security Headers', groupedHeaders.auth, Lock)}
            {renderHeaderTableGroup('Content & Transfer Headers', groupedHeaders.transfer, HardDrive)}
            {renderHeaderTableGroup('Custom & Provider Headers', groupedHeaders.custom, Cpu)}
          </>
        )}
      </div>
    </div>
  );
}
