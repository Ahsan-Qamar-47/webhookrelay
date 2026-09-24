import { useState, useMemo } from 'react';
import { JsonView, darkStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import { Copy, Check, Code, Eye, FileCode, Binary, ShieldAlert } from 'lucide-react';

/**
 * Format string as Hexadecimal byte dump with ASCII column
 */
function formatHexDump(str = '') {
  try {
    const bytes = new TextEncoder().encode(typeof str === 'object' ? JSON.stringify(str, null, 2) : String(str));
    const lines = [];
    const chunkSize = 16;

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = Array.from(bytes.slice(i, i + chunkSize));
      const offset = i.toString(16).padStart(8, '0');
      const hex = chunk.map((b) => b.toString(16).padStart(2, '0')).join(' ').padEnd(47, ' ');
      const ascii = chunk.map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('');

      lines.push(`${offset}  ${hex}  |${ascii}|`);
    }

    return lines.join('\n') || '00000000  00  ||';
  } catch (err) {
    return `Hex format error: ${err.message}`;
  }
}

/**
 * Base64 encode helper
 */
function toBase64(str = '') {
  try {
    const text = typeof str === 'object' ? JSON.stringify(str, null, 2) : String(str);
    return btoa(unescape(encodeURIComponent(text)));
  } catch (err) {
    return `Base64 encode error: ${err.message}`;
  }
}

export default function JsonViewer({ payload, headers = {} }) {
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'raw' | 'hex' | 'base64'
  const [copied, setCopied] = useState(false);

  const isObject = typeof payload === 'object' && payload !== null;

  const formattedJsonString = useMemo(() => {
    return isObject ? JSON.stringify(payload, null, 2) : String(payload || '');
  }, [payload, isObject]);

  // Content-Type auto-detection
  const contentType = useMemo(() => {
    const ctHeader = Object.entries(headers || {}).find(([k]) => k.toLowerCase() === 'content-type')?.[1] || '';
    if (ctHeader) return ctHeader.split(';')[0];
    if (isObject) return 'application/json';
    if (formattedJsonString.startsWith('<') && formattedJsonString.endsWith('>')) return 'text/xml';
    if (formattedJsonString.includes('=')) return 'application/x-www-form-urlencoded';
    return 'text/plain';
  }, [headers, isObject, formattedJsonString]);

  const hexDumpText = useMemo(() => formatHexDump(payload), [payload]);
  const base64Text = useMemo(() => toBase64(payload), [payload]);

  const handleCopy = () => {
    const copyText = viewMode === 'hex' ? hexDumpText : viewMode === 'base64' ? base64Text : formattedJsonString;
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel overflow-hidden">
      {/* Action & Mode Bar */}
      <div className="p-4 border-b border-relay-border/80 flex flex-wrap items-center justify-between gap-3 bg-relay-dark/60">
        <div className="flex flex-wrap items-center gap-2">
          <Code className="w-4 h-4 text-relay-purple-light" />
          <h3 className="text-sm font-bold text-white">Payload Inspector</h3>
          <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-relay-purple/15 text-relay-purple-light border border-relay-purple/30">
            {contentType}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Tabs */}
          <div className="flex items-center bg-relay-dark border border-relay-border rounded-lg p-0.5 text-xs font-mono">
            {isObject && (
              <button
                onClick={() => setViewMode('tree')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  viewMode === 'tree' ? 'bg-relay-purple/25 text-relay-purple-light border border-relay-purple/30' : 'text-relay-subtext hover:text-white'
                }`}
              >
                <Eye className="w-3 h-3 inline mr-1" />
                Pretty Tree
              </button>
            )}
            <button
              onClick={() => setViewMode('raw')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'raw' ? 'bg-relay-purple/25 text-relay-purple-light border border-relay-purple/30' : 'text-relay-subtext hover:text-white'
              }`}
            >
              <FileCode className="w-3 h-3 inline mr-1" />
              Raw Text
            </button>
            <button
              onClick={() => setViewMode('hex')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'hex' ? 'bg-relay-purple/25 text-relay-purple-light border border-relay-purple/30' : 'text-relay-subtext hover:text-white'
              }`}
            >
              <Binary className="w-3 h-3 inline mr-1" />
              Hex View
            </button>
            <button
              onClick={() => setViewMode('base64')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'base64' ? 'bg-relay-purple/25 text-relay-purple-light border border-relay-purple/30' : 'text-relay-subtext hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3 h-3 inline mr-1" />
              Base64
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-relay-purple/20 hover:bg-relay-purple/30 border border-relay-purple/40 rounded-lg text-xs font-semibold text-relay-purple-light hover:text-white transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-relay-green" />
                <span className="text-relay-green">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Payload</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Viewer Content */}
      <div className="p-4 overflow-x-auto bg-[#080B11] font-mono text-xs text-slate-200 min-h-[180px]">
        {viewMode === 'tree' && isObject ? (
          <div className="json-tree-container">
            <JsonView
              data={payload}
              shouldExpandNode={() => true}
              style={{
                ...darkStyles,
                container: 'font-mono text-xs leading-relaxed',
                label: 'text-relay-purple-light font-semibold',
                valueString: 'text-emerald-400',
                valueNumber: 'text-amber-400',
                valueBoolean: 'text-rose-400',
                valueNull: 'text-slate-500 italic',
              }}
            />
          </div>
        ) : viewMode === 'hex' ? (
          <pre className="whitespace-pre text-emerald-400 font-mono text-[11px] leading-relaxed select-all">
            {hexDumpText}
          </pre>
        ) : viewMode === 'base64' ? (
          <div className="space-y-3">
            <div>
              <p className="text-relay-muted text-[10px] uppercase tracking-wider mb-1 font-sans">Base64 Encoded Payload</p>
              <pre className="whitespace-pre-wrap break-all text-amber-300 font-mono text-xs bg-relay-dark/80 p-3 rounded-lg border border-relay-border/60">
                {base64Text}
              </pre>
            </div>
            <div>
              <p className="text-relay-muted text-[10px] uppercase tracking-wider mb-1 font-sans">Decoded Plaintext</p>
              <pre className="whitespace-pre-wrap break-all text-slate-300 font-mono text-xs bg-relay-dark/80 p-3 rounded-lg border border-relay-border/60">
                {formattedJsonString}
              </pre>
            </div>
          </div>
        ) : (
          <pre className="whitespace-pre-wrap break-all leading-relaxed text-slate-300 font-mono">
            {formattedJsonString}
          </pre>
        )}
      </div>
    </div>
  );
}
