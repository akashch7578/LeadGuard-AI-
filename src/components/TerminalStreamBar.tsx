import React, { useState } from 'react';
import {
  Terminal,
  ChevronUp,
  ChevronDown,
  Trash2,
  Copy,
  Check,
  Filter,
  Zap,
} from 'lucide-react';

export interface TerminalLog {
  id: string;
  timestamp: string;
  category: 'CAPI' | 'RULE_ENGINE' | 'TELEMETRY' | 'WEBHOOK';
  message: string;
  payload?: any;
}

interface TerminalStreamBarProps {
  logs: TerminalLog[];
  onClearLogs: () => void;
}

export const TerminalStreamBar: React.FC<TerminalStreamBarProps> = ({ logs, onClearLogs }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'CAPI' | 'RULE_ENGINE' | 'TELEMETRY' | 'WEBHOOK'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredLogs = logs.filter((l) => (selectedCategory === 'ALL' ? true : l.category === selectedCategory));

  const handleCopyLog = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <aside
      aria-label="Developer Telemetry Console"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#07090E]/95 backdrop-blur-md border-t border-[#1E293B] shadow-[0_-10px_25px_rgba(0,0,0,0.6)] transition-all duration-300"
    >
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>⚡ Live Telemetry & API Event Stream</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              {logs.length} Events
            </span>
          </button>

          {/* Quick single preview line when collapsed */}
          {!isExpanded && logs.length > 0 && (
            <span className="text-slate-400 text-[11px] truncate max-w-md hidden md:inline">
              <span className="text-emerald-400">[{logs[0].timestamp}]</span> {logs[0].message}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isExpanded && (
            <div className="flex items-center gap-1 mr-2 hidden sm:flex">
              {(['ALL', 'RULE_ENGINE', 'CAPI', 'TELEMETRY', 'WEBHOOK'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#111827] text-slate-400 hover:text-slate-200 border border-[#1E293B]'
                  }`}
                >
                  {cat === 'RULE_ENGINE' ? 'Rules Engine' : cat}
                </button>
              ))}

              <button
                type="button"
                onClick={onClearLogs}
                className="p-1 rounded text-slate-500 hover:text-red-400 cursor-pointer ml-1"
                title="Clear terminal stream"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded bg-[#111827] text-slate-400 hover:text-white border border-[#1E293B] cursor-pointer"
            aria-label={isExpanded ? 'Minimize Terminal' : 'Expand Terminal'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Logs Body */}
      {isExpanded && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 pt-1 border-t border-[#1E293B]/60">
          <div className="bg-[#05070B] border border-[#1E293B] rounded-lg p-3 max-h-56 overflow-y-auto font-mono text-[11px] space-y-1.5 shadow-inner">
            {filteredLogs.length === 0 ? (
              <div className="text-slate-500 text-center py-4 text-xs">
                Terminal idle. Trigger a Stop-Loss Sweep, WhatsApp test, or Sales Rep action to see real-time SDK events.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between gap-3 p-1.5 rounded hover:bg-[#111827]/60 transition-colors group"
                >
                  <div className="flex items-start gap-2 text-slate-300 flex-1">
                    <span className="text-slate-500 select-none">[{log.timestamp}]</span>
                    <span
                      className={`px-1 rounded text-[10px] font-bold ${
                        log.category === 'RULE_ENGINE'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : log.category === 'CAPI'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : log.category === 'TELEMETRY'
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {log.category}
                    </span>
                    <span className="leading-tight">{log.message}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyLog(log.id, `[${log.timestamp}] [${log.category}] ${log.message}`)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white p-0.5 rounded cursor-pointer transition-opacity"
                    title="Copy log entry"
                  >
                    {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
