import React, { useState } from 'react';
import {
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Zap,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';

interface SignalPipelineVisualizerProps {
  lastEvent?: {
    type: 'FIRED' | 'BLOCKED';
    label: string;
    timestamp: string;
  };
}

export const SignalPipelineVisualizer: React.FC<SignalPipelineVisualizerProps> = ({ lastEvent }) => {
  const [activeSignal, setActiveSignal] = useState<'idle' | 'green' | 'red'>('idle');
  const [pulseStage, setPulseStage] = useState<number>(0);

  const triggerSimulatedPulse = (type: 'green' | 'red') => {
    setActiveSignal(type);
    setPulseStage(1);

    const step1 = setTimeout(() => setPulseStage(2), 600);
    const step2 = setTimeout(() => setPulseStage(3), 1300);
    const step3 = setTimeout(() => setPulseStage(4), 2000);
    const finish = setTimeout(() => {
      setActiveSignal('idle');
      setPulseStage(0);
    }, 3800);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      clearTimeout(finish);
    };
  };

  return (
    <div className="glass-panel rounded-xl p-4 sm:p-5 relative overflow-hidden space-y-3.5 border border-[#1E293B]">
      {/* Ambient background glow */}
      <div className="absolute -top-12 -left-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1E293B]/80 gap-2 relative z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-2">
              Autonomous Signal Firewall Pipeline
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                LIVE TRAFFIC DISPATCHER
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Pre-pixel signal quarantine: inspects telemetry & qualifies intent before firing conversion attribution.
            </p>
          </div>
        </div>

        {/* Action simulator test buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => triggerSimulatedPulse('green')}
            disabled={activeSignal !== 'idle'}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Simulate high-intent traffic passing all 4 gates to fire CAPI"
          >
            <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
            <span>Test Qualified Flow</span>
          </button>

          <button
            type="button"
            onClick={() => triggerSimulatedPulse('red')}
            disabled={activeSignal !== 'idle'}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-red-950/70 hover:bg-red-900/80 text-red-300 border border-red-800/80 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Simulate autofill/junk traffic being stopped and starved of attribution"
          >
            <ShieldAlert className="w-3 h-3 text-red-400" />
            <span>Test Junk Block Flow</span>
          </button>
        </div>
      </div>

      {/* 4-Node Live Flow Diagram */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative z-10">
        {/* Node 1: Ad Click */}
        <div
          className={`p-3.5 rounded-xl border transition-all duration-300 relative ${
            pulseStage === 1
              ? activeSignal === 'green'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                : 'bg-red-950/40 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
              : 'bg-[#0B0F19]/90 border-[#1E293B]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase">Gate 1</span>
            <MousePointerClick className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xs font-bold text-white mt-1.5">1. Ad Click Ingestion</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Captures fbclid & gclid</div>
          <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono pt-2 border-t border-[#1E293B]">
            <span className="text-slate-500">Latency:</span>
            <span className="text-indigo-300 font-bold">12ms</span>
          </div>
          {pulseStage === 1 && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeSignal === 'green' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${activeSignal === 'green' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </span>
          )}
        </div>

        {/* Node 2: Telemetry Guard */}
        <div
          className={`p-3.5 rounded-xl border transition-all duration-300 relative ${
            pulseStage === 2
              ? activeSignal === 'green'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                : 'bg-red-950/40 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
              : 'bg-[#0B0F19]/90 border-[#1E293B]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase">Gate 2</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xs font-bold text-white mt-1.5">2. Autofill & Bot Radar</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Keystroke & &lt;2s duration</div>
          <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono pt-2 border-t border-[#1E293B]">
            <span className="text-slate-500">ThumbmarkJS:</span>
            <span className={pulseStage === 2 && activeSignal === 'red' ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
              {pulseStage === 2 && activeSignal === 'red' ? '0 Keys (Autofill)' : 'Clean ASN'}
            </span>
          </div>
          {pulseStage === 2 && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeSignal === 'green' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${activeSignal === 'green' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </span>
          )}
        </div>

        {/* Node 3: Gemini WhatsApp Qualifier */}
        <div
          className={`p-3.5 rounded-xl border transition-all duration-300 relative ${
            pulseStage === 3
              ? activeSignal === 'green'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                : 'bg-red-950/40 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
              : 'bg-[#0B0F19]/90 border-[#1E293B]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase">Gate 3</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xs font-bold text-white mt-1.5">3. Gemini AI Qualifier</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Budget, timeline & OTP test</div>
          <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono pt-2 border-t border-[#1E293B]">
            <span className="text-slate-500">Threshold:</span>
            <span className="text-indigo-300 font-bold">Score ≥ 60</span>
          </div>
          {pulseStage === 3 && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeSignal === 'green' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${activeSignal === 'green' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </span>
          )}
        </div>

        {/* Node 4: CAPI Conversion Gate */}
        <div
          className={`p-3.5 rounded-xl border transition-all duration-300 relative ${
            pulseStage === 4
              ? activeSignal === 'green'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                : 'bg-red-950/40 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
              : 'bg-[#0B0F19]/90 border-[#1E293B]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase">Gate 4</span>
            {pulseStage === 4 ? (
              activeSignal === 'green' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 animate-pulse" />
              )
            ) : (
              <Zap className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="text-xs font-bold text-white mt-1.5">4. CAPI Conversion Gate</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {pulseStage === 4 && activeSignal === 'red' ? '🚫 BLOCKED (₹0 CAPI)' : 'Meta & Google Offline'}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono pt-2 border-t border-[#1E293B]">
            <span className="text-slate-500">Action:</span>
            <span
              className={`font-bold ${
                pulseStage === 4 && activeSignal === 'red'
                  ? 'text-red-400'
                  : 'text-emerald-400'
              }`}
            >
              {pulseStage === 4 && activeSignal === 'red' ? 'ZERO ATTRIBUTION' : 'SYNTHETIC CAPI FIRED'}
            </span>
          </div>
          {pulseStage === 4 && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeSignal === 'green' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${activeSignal === 'green' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
