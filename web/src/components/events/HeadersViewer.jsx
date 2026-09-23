import { useState } from 'react';
import { Copy, Check, FileText, ShieldCheck } from 'lucide-react';

export default function HeadersViewer({ headers = {} }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const headerEntries = Object.entries(headers || {});
  const hasStripeSig = headerEntries.some(([k]) => k.toLowerCase() === 'stripe-signature');

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

  return (
    <div className="glass-panel overflow-hidden space-y-0">
      {/* Header Bar */}
      <div className="p-4 border-b border-relay-border/80 flex items-center justify-between bg-relay-dark/60">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-relay-purple-light" />
          <h3 className="text-sm font-bold text-white">HTTP Request Headers ({headerEntries.length})</h3>
        </div>

        <button
          onClick={handleCopyAll}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-relay-dark border border-relay-border rounded-lg text-xs font-semibold text-relay-subtext hover:text-white transition-colors"
        >
          {copiedAll ? (
            <>
              <Check className="w-3.5 h-3.5 text-relay-green" />
              <span className="text-relay-green">Copied All Headers</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy All Headers</span>
            </>
          )}
        </button>
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

      {/* Headers Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-relay-dark/80 text-relay-muted uppercase tracking-wider border-b border-relay-border/60">
            <tr>
              <th className="py-3 px-4 font-semibold w-1/3">Header Key</th>
              <th className="py-3 px-4 font-semibold">Header Value</th>
              <th className="py-3 px-4 text-right font-semibold w-24">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-relay-border/40">
            {headerEntries.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-8 text-center text-relay-muted font-sans text-xs">
                  No custom headers detected for this request envelope.
                </td>
              </tr>
            ) : (
              headerEntries.map(([key, value]) => {
                const isSig = key.toLowerCase() === 'stripe-signature';
                return (
                  <tr 
                    key={key} 
                    className={`transition-colors group ${
                      isSig ? 'bg-emerald-500/10 hover:bg-emerald-500/15' : 'hover:bg-relay-card-hover/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-bold truncate flex items-center gap-1.5">
                      <span className={isSig ? 'text-emerald-300' : 'text-relay-purple-light'}>
                        {key}
                      </span>
                      {isSig && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          PRESERVED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-200 break-all select-all">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </td>
                    <td className="py-3 px-4 text-right">
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
