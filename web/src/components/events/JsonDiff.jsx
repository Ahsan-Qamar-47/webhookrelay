import { useState, useMemo } from 'react';
import { diffJson } from 'diff';
import { 
  GitCompare, 
  Columns, 
  AlignJustify, 
  CheckCircle2, 
  Plus, 
  Minus, 
  ArrowRight
} from 'lucide-react';

export function computeJsonDiff(leftPayload = {}, rightPayload = {}) {
  try {
    const leftObj = typeof leftPayload === 'string' ? JSON.parse(leftPayload) : leftPayload;
    const rightObj = typeof rightPayload === 'string' ? JSON.parse(rightPayload) : rightPayload;
    
    const chunks = diffJson(leftObj, rightObj);
    
    let additions = 0;
    let deletions = 0;
    const lines = [];

    let leftLineNo = 1;
    let rightLineNo = 1;

    chunks.forEach((chunk) => {
      const splitLines = chunk.value.replace(/\n$/, '').split('\n');
      splitLines.forEach((lineText) => {
        if (chunk.added) {
          additions += 1;
          lines.push({
            type: 'added',
            leftLine: null,
            rightLine: rightLineNo++,
            text: lineText,
          });
        } else if (chunk.removed) {
          deletions += 1;
          lines.push({
            type: 'removed',
            leftLine: leftLineNo++,
            rightLine: null,
            text: lineText,
          });
        } else {
          lines.push({
            type: 'unchanged',
            leftLine: leftLineNo++,
            rightLine: rightLineNo++,
            text: lineText,
          });
        }
      });
    });

    return {
      lines,
      additions,
      deletions,
      isIdentical: additions === 0 && deletions === 0,
    };
  } catch (err) {
    return {
      lines: [],
      additions: 0,
      deletions: 0,
      isIdentical: false,
      error: err.message,
    };
  }
}

export default function JsonDiff({ 
  leftEvent, 
  rightEvent, 
  availableEvents = [], 
  onSelectCompareEvent,
  initialViewMode = 'side-by-side'
}) {
  const [viewMode, setViewMode] = useState(initialViewMode); // 'side-by-side' | 'unified'

  const diffResult = useMemo(() => {
    return computeJsonDiff(leftEvent?.payload || {}, rightEvent?.payload || {});
  }, [leftEvent, rightEvent]);

  // Group lines for Side-by-Side view
  const sideBySideRows = useMemo(() => {
    const rows = [];
    const { lines } = diffResult;
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.type === 'removed' && i + 1 < lines.length && lines[i + 1].type === 'added') {
        rows.push({
          left: lines[i],
          right: lines[i + 1],
        });
        i += 2;
      } else if (line.type === 'removed') {
        rows.push({
          left: line,
          right: null,
        });
        i += 1;
      } else if (line.type === 'added') {
        rows.push({
          left: null,
          right: line,
        });
        i += 1;
      } else {
        rows.push({
          left: line,
          right: line,
        });
        i += 1;
      }
    }
    return rows;
  }, [diffResult]);

  return (
    <div className="glass-panel overflow-hidden space-y-0">
      {/* Top Toolbar */}
      <div className="p-4 border-b border-relay-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-relay-dark/60">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-relay-purple-light" />
            <h3 className="text-sm font-bold text-white">JSON Payload Diff</h3>
          </div>

          {/* Diff Summary Badges */}
          {diffResult.isIdentical ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded bg-relay-green/15 text-relay-green border border-relay-green/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Payloads Identical (No Diff)
            </span>
          ) : (
            <div className="flex items-center gap-2 text-xs font-mono font-semibold">
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Plus className="w-3 h-3" /> +{diffResult.additions} additions
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                <Minus className="w-3 h-3" /> -{diffResult.deletions} deletions
              </span>
            </div>
          )}
        </div>

        {/* View Mode Toggle & Selector */}
        <div className="flex items-center gap-3">
          {/* Target Event Selector */}
          {availableEvents.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-relay-muted font-sans font-medium">Compare against:</span>
              <select
                value={rightEvent?.id || ''}
                onChange={(e) => onSelectCompareEvent?.(e.target.value)}
                className="bg-relay-dark border border-relay-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-relay-purple"
              >
                {availableEvents.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.id} ({evt.method} {evt.source || evt.provider})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Side-by-Side vs Unified Toggle Buttons */}
          <div className="flex items-center bg-relay-dark border border-relay-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'side-by-side'
                  ? 'bg-relay-purple/20 text-relay-purple-light font-semibold'
                  : 'text-relay-subtext hover:text-white'
              }`}
              title="Side-by-side comparison"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'unified'
                  ? 'bg-relay-purple/20 text-relay-purple-light font-semibold'
                  : 'text-relay-subtext hover:text-white'
              }`}
              title="Unified inline comparison"
            >
              <AlignJustify className="w-3.5 h-3.5" />
              <span>Unified</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Comparison Info Banner */}
      <div className="px-4 py-2 bg-relay-dark/80 border-b border-relay-border/60 text-xs font-mono flex items-center justify-between text-relay-subtext">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Original ({leftEvent?.id || 'Base'}):</span>
          <span className="text-relay-purple-light">{leftEvent?.method || 'POST'} {leftEvent?.path || '/api/webhooks/incoming'}</span>
        </div>
        <ArrowRight className="w-4 h-4 text-relay-muted hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Compared Against ({rightEvent?.id || 'Target'}):</span>
          <span className="text-relay-purple-light">{rightEvent?.method || 'POST'} {rightEvent?.path || '/api/webhooks/incoming'}</span>
        </div>
      </div>

      {/* Diff Output Area */}
      <div className="bg-[#080B11] font-mono text-xs overflow-x-auto min-h-[220px]">
        {diffResult.error ? (
          <div className="p-6 text-center text-rose-400">
            Failed to parse JSON for comparison: {diffResult.error}
          </div>
        ) : viewMode === 'unified' ? (
          /* UNIFIED / INLINE VIEW */
          <table className="w-full text-left border-collapse">
            <tbody>
              {diffResult.lines.map((line, idx) => {
                let bgClass = 'hover:bg-slate-900/50';
                let textClass = 'text-slate-300';
                let sign = ' ';

                if (line.type === 'added') {
                  bgClass = 'bg-emerald-500/15 hover:bg-emerald-500/25';
                  textClass = 'text-emerald-300 font-semibold';
                  sign = '+';
                } else if (line.type === 'removed') {
                  bgClass = 'bg-rose-500/15 hover:bg-rose-500/25';
                  textClass = 'text-rose-300 font-semibold';
                  sign = '-';
                }

                return (
                  <tr key={idx} className={`${bgClass} transition-colors leading-relaxed`}>
                    <td className="w-10 select-none text-right px-2 py-0.5 text-slate-600 border-r border-relay-border/40">
                      {line.leftLine || ''}
                    </td>
                    <td className="w-10 select-none text-right px-2 py-0.5 text-slate-600 border-r border-relay-border/40">
                      {line.rightLine || ''}
                    </td>
                    <td className="w-6 select-none text-center font-bold px-1 text-slate-500">
                      {sign}
                    </td>
                    <td className={`px-3 py-0.5 whitespace-pre break-all ${textClass}`}>
                      {line.text}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          /* SIDE-BY-SIDE VIEW */
          <div className="grid grid-cols-2 divide-x divide-relay-border/60">
            {/* Left Original Column */}
            <table className="w-full text-left border-collapse">
              <tbody>
                {sideBySideRows.map((row, idx) => {
                  const left = row.left;
                  const isRemoved = left?.type === 'removed';
                  const bgClass = isRemoved
                    ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-semibold'
                    : 'text-slate-300 hover:bg-slate-900/50';

                  return (
                    <tr key={idx} className={`${bgClass} transition-colors leading-relaxed`}>
                      <td className="w-10 select-none text-right px-2 py-0.5 text-slate-600 border-r border-relay-border/40">
                        {left?.leftLine || ''}
                      </td>
                      <td className="px-3 py-0.5 whitespace-pre break-all">
                        {left ? left.text : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Right Target Column */}
            <table className="w-full text-left border-collapse">
              <tbody>
                {sideBySideRows.map((row, idx) => {
                  const right = row.right;
                  const isAdded = right?.type === 'added';
                  const bgClass = isAdded
                    ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-semibold'
                    : 'text-slate-300 hover:bg-slate-900/50';

                  return (
                    <tr key={idx} className={`${bgClass} transition-colors leading-relaxed`}>
                      <td className="w-10 select-none text-right px-2 py-0.5 text-slate-600 border-r border-relay-border/40">
                        {right?.rightLine || ''}
                      </td>
                      <td className="px-3 py-0.5 whitespace-pre break-all">
                        {right ? right.text : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
