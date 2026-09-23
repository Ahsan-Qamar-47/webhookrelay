import { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';

export default function HeadersViewer({ headers = {} }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const headerEntries = Object.entries(headers || {});

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
    <div className="glass-panel overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-relay-border/80 flex items-center justify-between">
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
              headerEntries.map(([key, value]) => (
                <tr key={key} className="hover:bg-relay-card-hover/40 transition-colors group">
                  <td className="py-3 px-4 text-relay-purple-light font-bold truncate">
                    {key}
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
