import { useState } from 'react';
import { JsonView, darkStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import { Copy, Check, Code, Eye, FileCode } from 'lucide-react';

export default function JsonViewer({ payload }) {
  const [isRaw, setIsRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  const isObject = typeof payload === 'object' && payload !== null;

  const formattedJsonString = isObject
    ? JSON.stringify(payload, null, 2)
    : String(payload || '');

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel overflow-hidden">
      {/* Action Bar */}
      <div className="p-4 border-b border-relay-border/80 flex flex-wrap items-center justify-between gap-3 bg-relay-dark/60">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-relay-purple-light" />
          <h3 className="text-sm font-bold text-white">Payload Body</h3>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-relay-purple/15 text-relay-purple-light border border-relay-purple/30">
            {isObject ? 'JSON' : 'RAW TEXT'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Raw / Pretty Toggle */}
          <button
            onClick={() => setIsRaw(!isRaw)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-relay-card border border-relay-border rounded-lg text-xs font-semibold text-relay-subtext hover:text-white transition-colors"
          >
            {isRaw ? <Eye className="w-3.5 h-3.5 text-relay-purple-light" /> : <FileCode className="w-3.5 h-3.5 text-relay-purple-light" />}
            <span>{isRaw ? 'Pretty Tree' : 'Raw Text'}</span>
          </button>

          {/* Copy JSON Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-relay-purple/20 hover:bg-relay-purple/30 border border-relay-purple/40 rounded-lg text-xs font-semibold text-relay-purple-light hover:text-white transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-relay-green" />
                <span className="text-relay-green">Copied JSON</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Viewer Content */}
      <div className="p-4 overflow-x-auto bg-[#080B11] font-mono text-xs text-slate-200 min-h-[160px]">
        {isRaw || !isObject ? (
          <pre className="whitespace-pre-wrap break-all leading-relaxed text-slate-300 font-mono">
            {formattedJsonString}
          </pre>
        ) : (
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
        )}
      </div>
    </div>
  );
}
