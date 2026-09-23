import { useState } from 'react';
import { Terminal, Copy, Check, Sliders } from 'lucide-react';

export default function QueryParams({ queryParams = {}, event }) {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const queryEntries = Object.entries(queryParams || {});

  const generateCurlCommand = () => {
    const method = event?.method || 'POST';
    const path = event?.path || '/api/webhooks/incoming';
    const baseUrl = 'http://localhost:8080';
    const fullUrl = `${baseUrl}${path}`;

    const headersList = Object.entries(event?.headers || {})
      .map(([k, v]) => `-H "${k}: ${v}"`)
      .join(' ');

    let bodyFlag = '';
    if (event?.payload && Object.keys(event.payload).length > 0) {
      bodyFlag = `-d '${JSON.stringify(event.payload)}'`;
    }

    return `curl -X ${method} "${fullUrl}" ${headersList} ${bodyFlag}`.trim();
  };

  const handleCopyCurl = () => {
    const curlCmd = generateCurlCommand();
    navigator.clipboard.writeText(curlCmd);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleCopyPair = (key, value) => {
    navigator.clipboard.writeText(`${key}=${value}`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="glass-panel overflow-hidden space-y-4 p-4">
      {/* Action Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-relay-border/80 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-relay-purple-light" />
          <h3 className="text-sm font-bold text-white">URL Query Parameters ({queryEntries.length})</h3>
        </div>

        {/* Copy as cURL Button */}
        <button
          onClick={handleCopyCurl}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-relay-purple/20 to-relay-purple-dark/20 hover:brightness-125 border border-relay-purple/40 rounded-lg text-xs font-semibold text-relay-purple-light hover:text-white transition-all shadow-sm"
        >
          {copiedCurl ? (
            <>
              <Check className="w-3.5 h-3.5 text-relay-green" />
              <span className="text-relay-green">cURL Command Copied!</span>
            </>
          ) : (
            <>
              <Terminal className="w-3.5 h-3.5" />
              <span>Copy as cURL</span>
            </>
          )}
        </button>
      </div>

      {/* Query Parameters Table */}
      <div className="overflow-x-auto rounded-lg border border-relay-border/60">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-relay-dark/80 text-relay-muted uppercase tracking-wider border-b border-relay-border/60">
            <tr>
              <th className="py-3 px-4 font-semibold w-1/3">Parameter Key</th>
              <th className="py-3 px-4 font-semibold">Value</th>
              <th className="py-3 px-4 text-right font-semibold w-24">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-relay-border/40">
            {queryEntries.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-6 text-center text-relay-muted font-sans text-xs">
                  No URL query parameters detected for this request.
                </td>
              </tr>
            ) : (
              queryEntries.map(([key, value]) => (
                <tr key={key} className="hover:bg-relay-card-hover/40 transition-colors">
                  <td className="py-2.5 px-4 text-amber-400 font-bold">
                    {key}
                  </td>
                  <td className="py-2.5 px-4 text-slate-200 break-all">
                    {String(value)}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => handleCopyPair(key, value)}
                      className="p-1 rounded bg-relay-dark border border-relay-border hover:border-relay-purple text-relay-muted hover:text-white transition-colors"
                      title={`Copy ${key}=${value}`}
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
