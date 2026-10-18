import React, { useState } from 'react';
import {
  Zap,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Sliders,
  DollarSign,
  Activity,
  CheckCircle,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  Shield,
  Gauge,
  Search,
} from 'lucide-react';
import {
  AdSet,
  AutonomousActionLog,
  Currency,
  LeadItem,
  StopLossRules,
  calculateMetrics,
  formatCurrency,
  runStopLossSweep,
} from '../utils/stopLossEngine';
import { CurrencyDisplay, RupeeIcon } from './CurrencyDisplay';
import { CROSS_NETWORK_ARBITRAGE } from '../data/industryData';
import { SignalPipelineVisualizer } from './SignalPipelineVisualizer';
import { AdForensicsDrawer } from './AdForensicsDrawer';

interface DashboardTabProps {
  ads: AdSet[];
  setAds: React.Dispatch<React.SetStateAction<AdSet[]>>;
  rules: StopLossRules;
  setRules: React.Dispatch<React.SetStateAction<StopLossRules>>;
  currency: Currency;
  actionLogs: AutonomousActionLog[];
  setActionLogs: React.Dispatch<React.SetStateAction<AutonomousActionLog[]>>;
  onResetDefaults: () => void;
  leads?: LeadItem[];
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  ads,
  setAds,
  rules,
  setRules,
  currency,
  actionLogs,
  setActionLogs,
  onResetDefaults,
  leads = [],
}) => {
  const [isSweeping, setIsSweeping] = useState(false);
  const [selectedAdForDrawer, setSelectedAdForDrawer] = useState<AdSet | null>(null);
  const [sweepResult, setSweepResult] = useState<{
    swept: boolean;
    pausedCount: number;
    throttledCount: number;
    freedBudget: number;
    winnerName?: string;
  } | null>(null);

  const metrics = calculateMetrics(ads);
  const arbitrageData = CROSS_NETWORK_ARBITRAGE[currency];

  const getSparklinePoints = (ad: AdSet): string => {
    const isBleeder = ad.junkRate >= 80;
    const isWinner = ad.qualifiedLeads >= 20;
    const multipliers = isBleeder
      ? [0.6, 0.7, 0.75, 0.9, 1.1, 1.3, 1.5]
      : isWinner
      ? [1.4, 1.3, 1.1, 0.95, 0.85, 0.8, 0.75]
      : [1.0, 1.08, 0.95, 1.04, 0.96, 1.0, 1.01];

    const maxVal = Math.max(...multipliers);
    const minVal = Math.min(...multipliers);
    const range = maxVal - minVal || 1;
    return multipliers
      .map((m, idx) => {
        const x = idx * 9;
        const y = Math.round(13 - ((m - minVal) / range) * 10);
        return `${x},${y}`;
      })
      .join(' ');
  };

  const handleRunSweep = () => {
    setIsSweeping(true);
    setSweepResult(null);

    setTimeout(() => {
      const result = runStopLossSweep(ads, rules, currency);
      setAds(result.updatedAds);
      setActionLogs((prev) => [...result.actionLogs, ...prev]);

      const newlyPaused = result.updatedAds.filter((a, idx) => a.isPaused && !ads[idx].isPaused).length;
      const newlyThrottled = result.updatedAds.filter((a, idx) => a.isThrottled && !ads[idx].isThrottled).length;

      setSweepResult({
        swept: true,
        pausedCount: newlyPaused,
        throttledCount: newlyThrottled,
        freedBudget: result.totalFreedDailyBudget,
        winnerName: result.reallocatedTo,
      });

      setIsSweeping(false);
    }, 1200);
  };

  const handleToggleAdPause = (id: string) => {
    setAds((prev) =>
      prev.map((ad) => {
        if (ad.id === id) {
          const nextPaused = !ad.isPaused;
          const nextStatus = nextPaused
            ? 'PAUSED'
            : ad.junkRate >= 80
            ? 'CRITICAL BLEEDER'
            : ad.qualifiedLeads >= 20
            ? 'HIGH-INTENT WINNER'
            : 'HEALTHY PERFORMER';

          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const newLog: AutonomousActionLog = {
            id: `manual_${Date.now()}`,
            timestamp: now,
            type: nextPaused ? 'PAUSE_BLEEDER' : 'REALLOCATE_BUDGET',
            adId: ad.id,
            adName: ad.name,
            message: nextPaused
              ? `MANUAL OVERRIDE: Ad paused by media buyer. Wasted spend stopped.`
              : `MANUAL OVERRIDE: Ad resumed. Active traffic restored.`,
            savingsOrRevenueImpact: nextPaused ? ad.dailyBudget * 30 : 0,
            badgeText: nextPaused ? 'MANUAL PAUSE' : 'RESUMED',
            badgeColor: nextPaused ? 'amber' : 'indigo',
          };
          setActionLogs((logs) => [newLog, ...logs]);

          return {
            ...ad,
            isPaused: nextPaused,
            status: nextStatus,
          };
        }
        return ad;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* 0. LIVE SIGNAL FIREWALL PIPELINE VISUALIZER */}
      <SignalPipelineVisualizer />

      {/* 1. TOP KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Spend */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Monthly Ad Spend</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            <CurrencyDisplay amount={metrics.totalSpend} currency={currency} />
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-400">
            <span className="font-mono text-indigo-400 mr-1.5">{metrics.activeAdsCount} active</span> / {ads.length} total ad sets
          </div>
          <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-indigo-500 to-blue-500 opacity-60"></div>
        </div>

        {/* Card 2: Null-Return Wasted Spend Detected */}
        <div className="bg-[#111827] border border-red-900/40 rounded-xl p-4 shadow-sm relative overflow-hidden bg-gradient-to-b from-red-950/20 to-transparent">
          <div className="flex items-center justify-between text-red-300 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
              "Null-Return" Wasted Spend
            </span>
            <span className="text-[10px] font-mono bg-red-950 px-1.5 py-0.5 rounded border border-red-800 text-red-300">
              {metrics.totalSpend > 0 ? ((metrics.wastedSpend / metrics.totalSpend) * 100).toFixed(0) : 0}% LEAK
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-red-400">
            <CurrencyDisplay amount={metrics.wastedSpend} currency={currency} />
          </div>
          <div className="mt-1 text-xs text-slate-300 flex items-center">
            <TrendingDown className="w-3.5 h-3.5 text-red-400 mr-1" />
            Trapped in zero-pipeline bleeders
          </div>
          <div className="absolute top-0 right-0 h-1 w-full bg-red-500"></div>
        </div>

        {/* Card 3: Raw Leads vs. AI-Qualified */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Raw vs. Verified Leads</span>
            <span className="font-mono text-xs text-emerald-400 font-semibold">
              {metrics.totalRawLeads > 0 ? (((metrics.totalRawLeads - metrics.totalQualifiedLeads) / metrics.totalRawLeads) * 100).toFixed(0) : 0}% Junk
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {metrics.totalQualifiedLeads}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {metrics.totalRawLeads} raw platform leads
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-1.5"
              style={{
                width: `${metrics.totalRawLeads > 0 ? (metrics.totalQualifiedLeads / metrics.totalRawLeads) * 100 : 0}%`,
              }}
              title="Qualified leads"
            ></div>
            <div
              className="bg-red-500/80 h-1.5"
              style={{
                width: `${metrics.totalRawLeads > 0 ? ((metrics.totalRawLeads - metrics.totalQualifiedLeads) / metrics.totalRawLeads) * 100 : 0}%`,
              }}
              title="Junk / Unresponsive leads"
            ></div>
          </div>
          <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-indigo-500 opacity-60"></div>
        </div>

        {/* Card 4: Raw CPL vs True CPQL */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Raw CPL vs True CPQL</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            <CurrencyDisplay amount={metrics.cpql} currency={currency} compact={true} suffix="/qual" />
          </div>
          <div className="mt-1 text-xs text-slate-400 flex items-center justify-between font-mono">
            <span>Platform CPL: <CurrencyDisplay amount={metrics.rawCpl} currency={currency} compact={true} /></span>
            <span className="text-red-400">
              ({metrics.rawCpl > 0 ? (metrics.cpql / metrics.rawCpl).toFixed(1) : 1}x true cost)
            </span>
          </div>
          <div className="absolute top-0 right-0 h-1 w-full bg-amber-500 opacity-60"></div>
        </div>

        {/* Card 5: Realized Pipeline Revenue */}
        <div className="bg-[#111827] border border-emerald-900/40 rounded-xl p-4 shadow-sm relative overflow-hidden bg-gradient-to-b from-emerald-950/20 to-transparent">
          <div className="flex items-center justify-between text-emerald-300 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Realized Pipeline
            </span>
            <span className="text-[10px] font-mono bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800 text-emerald-300">
              ROAS: {metrics.totalSpend > 0 ? (metrics.totalRealizedPipeline / metrics.totalSpend).toFixed(1) : 0}x
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            <CurrencyDisplay amount={metrics.totalRealizedPipeline} currency={currency} />
          </div>
          <div className="mt-1 text-xs text-slate-300 flex items-center">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mr-1" />
            Verified pipeline from winner ads
          </div>
          <div className="absolute top-0 right-0 h-1 w-full bg-emerald-500"></div>
        </div>
      </div>

      {/* UPGRADE 1.1: CROSS-NETWORK ARBITRAGE & COMPETITOR RULE TRAP BANNER */}
      <div className="bg-[#111827] border border-indigo-900/50 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1E293B] gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
              Cross-Network CPL vs. True CPQL Arbitrage Matrix
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
              COMPETITOR BLIND SPOT SOLVER
            </span>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Revealing the <span className="text-red-400 font-bold">Revealbot / Madgicx Raw CPL Trap</span>
          </div>
        </div>

        {/* 4-Channel Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {arbitrageData.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-lg border flex flex-col justify-between space-y-2.5 transition-all ${
                item.isTrapWinner
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-200'
                  : 'bg-red-950/25 border-red-800/60 text-red-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono text-xs">{item.channel}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      item.isTrapWinner
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-red-950 text-red-400 border border-red-800'
                    }`}
                  >
                    {item.qualRate}% Qual Rate
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-[#0B0F19] p-2 rounded border border-[#1E293B]">
                    <span className="text-slate-400 text-[10px] block">Raw CPL:</span>
                    <span className="font-bold text-indigo-300">
                      <CurrencyDisplay amount={item.cpl} currency={currency} />
                    </span>
                  </div>
                  <div className={`p-2 rounded border ${item.isTrapWinner ? 'bg-emerald-950/40 border-emerald-800' : 'bg-red-950/40 border-red-800'}`}>
                    <span className="text-slate-400 text-[10px] block">True CPQL:</span>
                    <span className={`font-bold ${item.isTrapWinner ? 'text-emerald-400' : 'text-red-400'}`}>
                      <CurrencyDisplay amount={item.trueCpql} currency={currency} compact={true} />
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#1E293B]/80 space-y-1.5 text-[11px]">
                <div className="text-slate-400 flex items-center justify-between">
                  <span>Legacy Rule Engine:</span>
                  <span className={`font-mono font-bold ${!item.isTrapWinner ? 'text-emerald-400' : 'text-red-400'}`}>
                    {item.legacyRuleVerdict}
                  </span>
                </div>
                <div className="text-slate-300 flex items-center justify-between">
                  <span>LeadGuard Engine:</span>
                  <span className={`font-mono font-bold ${item.isTrapWinner ? 'text-emerald-400' : 'text-red-400'}`}>
                    {item.leadguardVerdict}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight pt-1 italic">
                  {item.competitorTrapWarning}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Competitor Rule Trap Callout */}
        <div className="p-3.5 rounded-lg bg-[#0B0F19] border border-amber-900/40 text-xs text-amber-200/90 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-300">
              The "Competitor Rule Engine Trap" Explained:
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Legacy rule engines (Revealbot, Madgicx, native Meta automated rules) make automated decisions on <strong>front-end CPL</strong>.
              When a Google Search campaign costs <span className="font-mono text-white">₹650 ($8.00) CPL</span>, a legacy rule mistakenly pauses it as "overpriced"—failing to see that 46% of those leads are ready buyers.
              Simultaneously, it scales a <span className="font-mono text-white">₹120 ($1.50) Meta Instant Form ad</span> with a 98% junk rate, dumping thousands of dollars into bogus autofill submissions.
              LeadGuard AI measures and stops loss strictly based on <strong>True CPQL & Realized Pipeline</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 2. CONFIGURABLE STOP-LOSS RULES BAR (ENHANCED WITH LEARNING PHASE SAFE MODE & GRACE WINDOW) */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1E293B] gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
              Autonomous Stop-Loss Rule Guardrails (v2.0)
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
              REAL-TIME CAPI DAEMON
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetDefaults}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 bg-[#0B0F19] border border-[#1E293B] rounded-lg transition-colors cursor-pointer"
              title="Reset ad set numbers to original benchmark"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Benchmark Defaults
            </button>
          </div>
        </div>

        {/* 5 Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 text-xs">
          {/* Rule A */}
          <div className={`p-3.5 rounded-lg border transition-all ${
            rules.ruleA_enabled
              ? 'bg-red-950/20 border-red-800/40 text-slate-200'
              : 'bg-[#0B0F19] border-[#1E293B] text-slate-500 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-red-400 flex items-center gap-1 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                Rule A: Ghost Lead Kill
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.ruleA_enabled}
                  onChange={(e) => setRules((r) => ({ ...r, ruleA_enabled: e.target.checked }))}
                  className="sr-only peer"
                  aria-label="Toggle Rule A Ghost Lead Kill Switch"
                />
                <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
            <p className="text-slate-400 text-[10px] leading-tight mb-2.5">
              Pause if spend &gt; threshold & verified pipeline = 0.
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-mono">Limit:</span>
              <div className="flex items-center bg-[#0B0F19] border border-[#1E293B] rounded px-1.5 py-0.5 font-mono text-white text-xs">
                <span>{currency === 'INR' ? <RupeeIcon /> : '$'}</span>
                <input
                  type="number"
                  value={rules.ruleA_spendThreshold}
                  onChange={(e) => setRules((r) => ({ ...r, ruleA_spendThreshold: Math.max(10, Number(e.target.value)) }))}
                  className="w-14 bg-transparent text-right text-white focus:outline-none ml-1 text-xs"
                  aria-label="Rule A Spend Threshold"
                />
              </div>
            </div>
          </div>

          {/* Rule B */}
          <div className={`p-3.5 rounded-lg border transition-all ${
            rules.ruleB_enabled
              ? 'bg-amber-950/20 border-amber-800/40 text-slate-200'
              : 'bg-[#0B0F19] border-[#1E293B] text-slate-500 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-amber-400 flex items-center gap-1 text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Rule B: Junk Guard
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.ruleB_enabled}
                  onChange={(e) => setRules((r) => ({ ...r, ruleB_enabled: e.target.checked }))}
                  className="sr-only peer"
                  aria-label="Toggle Rule B Junk Rate Guard"
                />
                <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
            <p className="text-slate-400 text-[10px] leading-tight mb-2.5">
              Auto-pause if raw leads ≥ cap & junk rate breaches limit.
            </p>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-mono">≥</span>
                <input
                  type="number"
                  value={rules.ruleB_minRawLeads}
                  onChange={(e) => setRules((r) => ({ ...r, ruleB_minRawLeads: Math.max(5, Number(e.target.value)) }))}
                  className="w-10 bg-[#0B0F19] border border-[#1E293B] rounded px-1 py-0.5 text-center text-white font-mono text-[11px] focus:outline-none"
                  aria-label="Rule B Minimum Raw Leads"
                />
              </div>
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] text-slate-400 font-mono">&gt;</span>
                <input
                  type="number"
                  value={rules.ruleB_junkRateThreshold}
                  onChange={(e) => setRules((r) => ({ ...r, ruleB_junkRateThreshold: Math.min(99, Math.max(50, Number(e.target.value))) }))}
                  className="w-10 bg-[#0B0F19] border border-[#1E293B] rounded px-1 py-0.5 text-center text-amber-300 font-mono text-[11px] focus:outline-none"
                  aria-label="Rule B Junk Rate Threshold"
                />
                <span className="text-amber-400 font-mono">%</span>
              </div>
            </div>
          </div>

          {/* Rule C */}
          <div className={`p-3.5 rounded-lg border transition-all ${
            rules.ruleC_autoReallocate
              ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-200'
              : 'bg-[#0B0F19] border-[#1E293B] text-slate-500 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-emerald-400 flex items-center gap-1 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Rule C: Auto-Reallocate
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.ruleC_autoReallocate}
                  onChange={(e) => setRules((r) => ({ ...r, ruleC_autoReallocate: e.target.checked }))}
                  className="sr-only peer"
                  aria-label="Toggle Rule C Auto-Reallocate"
                />
                <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            <p className="text-slate-400 text-[10px] leading-tight mb-2.5">
              Siphon 100% of freed budget into lowest true CPQL winner.
            </p>
            <div className="text-[10px] font-mono text-emerald-300 bg-[#0B0F19] px-2 py-0.5 rounded border border-emerald-900/40 text-center font-bold">
              100% Shift to Winner
            </div>
          </div>

          {/* V2.0 Rule D: Learning-Phase Safe Mode */}
          <div className={`p-3.5 rounded-lg border transition-all ${
            rules.learningPhaseSafeMode
              ? 'bg-indigo-950/30 border-indigo-500/50 text-slate-200'
              : 'bg-[#0B0F19] border-[#1E293B] text-slate-500 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-indigo-300 flex items-center gap-1 text-[11px]">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                Learning Safe Mode
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.learningPhaseSafeMode}
                  onChange={(e) => setRules((r) => ({ ...r, learningPhaseSafeMode: e.target.checked }))}
                  className="sr-only peer"
                  aria-label="Toggle Learning-Phase Safe Mode"
                />
                <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <p className="text-slate-400 text-[10px] leading-tight mb-2.5">
              Prevents algorithm reset. Applies 15% throttle + CAPI starvation.
            </p>
            <div className="text-[10px] font-mono text-indigo-300 bg-[#0B0F19] px-2 py-0.5 rounded border border-indigo-900/60 text-center font-bold">
              Protects 50-Event Phase
            </div>
          </div>

          {/* V2.0 Rule E: Qualification-Lag Grace Window */}
          <div className="p-3.5 rounded-lg border bg-[#0B0F19] border-[#1E293B] text-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-300 flex items-center gap-1 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Lag Grace Window
              </span>
              <span className="font-mono text-indigo-400 font-bold text-xs">
                {rules.qualificationLagGraceHours}h
              </span>
            </div>
            <p className="text-slate-400 text-[10px] leading-tight mb-2">
              Waits for WhatsApp/Sales call verification before CPQL score.
            </p>
            <input
              type="range"
              min="2"
              max="48"
              step="2"
              value={rules.qualificationLagGraceHours}
              onChange={(e) => setRules((r) => ({ ...r, qualificationLagGraceHours: Number(e.target.value) }))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              aria-label="Qualification Lag Grace Window Hours"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
              <span>2h (Fast)</span>
              <span>24h</span>
              <span>48h (High-Ticket)</span>
            </div>
          </div>
        </div>
      </div>

      {/* SWEEP TRIGGER BANNER & SWEEP FEEDBACK */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-indigo-950/50 via-[#111827] to-indigo-950/50 border border-indigo-500/30 rounded-xl p-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" />
              Autonomous Ad Stop-Loss Sweep Engine (v2.0)
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              Safe Mode Enabled
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Execute algorithmic scan. Protects learning-phase ad sets with 15% throttling while hard-pausing chronic bleeders and siphoning daily budget into top POAS winners.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunSweep}
          disabled={isSweeping}
          className={`px-5 py-3 rounded-lg font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg ${
            isSweeping
              ? 'bg-slate-700 text-slate-300 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:shadow-indigo-500/50 cursor-pointer active:scale-95'
          }`}
        >
          {isSweeping ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Scanning Platform APIs & Telemetry...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>⚡ Run Autonomous Stop-Loss Sweep</span>
            </>
          )}
        </button>
      </div>

      {/* Sweep summary callout if just executed */}
      {sweepResult && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">
                Autonomous Stop-Loss Sweep Completed!
              </div>
              <div className="text-xs text-emerald-300 mt-0.5">
                {sweepResult.throttledCount > 0 && (
                  <span className="text-amber-300 font-semibold mr-1.5">
                    Throttled {sweepResult.throttledCount} learning ads (-15%) safely.
                  </span>
                )}
                Paused {sweepResult.pausedCount} bleeders. Reallocated{' '}
                <span className="font-mono font-bold text-white">
                  +<CurrencyDisplay amount={sweepResult.freedBudget} currency={currency} suffix="/day" />
                </span>{' '}
                {sweepResult.winnerName ? (
                  <>
                    to top winner <span className="font-mono text-emerald-300 underline font-semibold">{sweepResult.winnerName}</span>.
                  </>
                ) : (
                  'to high-intent winners.'
                )}
              </div>
            </div>
          </div>
          <div className="text-right sm:border-l sm:border-emerald-800/60 sm:pl-4">
            <div className="text-[11px] text-emerald-400 uppercase font-mono">Projected Monthly Savings</div>
            <div className="text-lg font-bold font-mono text-white">
              <CurrencyDisplay amount={sweepResult.freedBudget * 30} currency={currency} />
            </div>
          </div>
        </div>
      )}

      {/* 3. INTERACTIVE AD PERFORMANCE TABLE (WITH LEARNING PHASE & AUTOFILL TELEMETRY RISK) */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Active Ad Sets, Learning Status & Telemetry Risk
              <span className="text-xs font-mono font-normal text-slate-400">
                ({ads.length} Ad Sets Monitored)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Learning-Phase Safe Mode and Autofill Risk metrics protect Meta algorithm integrity while isolating toxic lead forms.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Bleeder (Junk &gt; 80%)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Verified Winner
            </span>
          </div>
        </div>

        {/* Table container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0B0F19]/80 text-slate-400 border-b border-[#1E293B] font-mono">
                <th className="py-3 px-3.5 font-semibold">Ad Set & Creative</th>
                <th className="py-3 px-2.5 font-semibold">Learning Phase</th>
                <th className="py-3 px-2.5 font-semibold text-center">Autofill Risk</th>
                <th className="py-3 px-2.5 font-semibold">Status</th>
                <th className="py-3 px-2.5 font-semibold text-right">Spend</th>
                <th className="py-3 px-2.5 font-semibold text-right">Raw</th>
                <th className="py-3 px-2.5 font-semibold text-right text-indigo-300">Raw CPL</th>
                <th className="py-3 px-2.5 font-semibold text-right text-emerald-300">Qual</th>
                <th className="py-3 px-2.5 font-semibold text-right">Junk %</th>
                <th className="py-3 px-2.5 font-semibold text-right text-amber-300">True CPQL</th>
                <th className="py-3 px-2.5 font-semibold text-right text-emerald-400">Pipeline</th>
                <th className="py-3 px-2.5 font-semibold text-right">Budget</th>
                <th className="py-3 px-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {ads.map((ad) => {
                const isBleeder = ad.junkRate >= 80 && ad.realizedPipeline === 0;
                const isWinner = ad.qualifiedLeads >= 20;
                const rawCpl = ad.rawLeads > 0 ? ad.spend / ad.rawLeads : 0;
                const cpql = ad.qualifiedLeads > 0 ? ad.spend / ad.qualifiedLeads : 0;

                return (
                  <tr
                    key={ad.id}
                    className={`transition-colors ${
                      ad.isPaused
                        ? 'bg-slate-900/40 opacity-70 hover:opacity-90'
                        : isBleeder
                        ? 'bg-red-950/15 hover:bg-red-950/25'
                        : isWinner
                        ? 'bg-emerald-950/15 hover:bg-emerald-950/25'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Ad Set & Tracking Info */}
                    <td className="py-3 px-3.5 max-w-[200px]">
                      <button
                        type="button"
                        onClick={() => setSelectedAdForDrawer(ad)}
                        className="text-left font-bold text-white text-xs truncate hover:text-indigo-300 flex items-center gap-1.5 group cursor-pointer w-full"
                        title="Click to inspect Ad Forensics & spend decay"
                      >
                        <span className="truncate">{ad.name}</span>
                        <Search className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <div className="text-slate-400 text-[10px] truncate mt-0.5" title={ad.headline}>
                        "{ad.headline}"
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="font-mono text-[9px] text-indigo-300 bg-indigo-950/60 px-1 py-0.2 rounded border border-indigo-800/40">
                          {ad.platform}
                        </span>
                        <span className="font-mono text-[9px] text-slate-400 bg-slate-800 px-1 rounded">
                          {ad.id}
                        </span>
                        {ad.killCounter > 0 && (
                          <span
                            className="font-mono text-[9px] text-red-300 bg-red-950 px-1 rounded border border-red-800"
                            title="Sales team flagged junk counter"
                          >
                            🗑️ {ad.killCounter} Flags
                          </span>
                        )}
                      </div>
                    </td>

                    {/* V2.0 Column 1: Learning Phase Status */}
                    <td className="py-3 px-2.5 whitespace-nowrap">
                      {ad.learningPhase === 'ACTIVE' ? (
                        <div className="space-y-0.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            ✓ ACTIVE (50/50)
                          </span>
                          <div className="text-[9px] font-mono text-slate-500">Exited Learning</div>
                        </div>
                      ) : ad.learningPhase === 'LEARNING' ? (
                        <div className="space-y-0.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                            ⏳ LEARNING ({ad.learningEvents.current}/{ad.learningEvents.target})
                          </span>
                          <div className="w-16 bg-slate-800 rounded-full h-1 mt-0.5">
                            <div
                              className="bg-amber-400 h-1 rounded-full"
                              style={{ width: `${(ad.learningEvents.current / ad.learningEvents.target) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-800">
                          ⚠️ LEARNING LIMITED
                        </span>
                      )}
                    </td>

                    {/* V2.0 Column 2: Autofill / Telemetry Risk */}
                    <td className="py-3 px-2.5 text-center whitespace-nowrap">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            ad.autofillRisk >= 80
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : ad.autofillRisk >= 40
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}
                        >
                          {ad.autofillRisk}% Risk
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                          avg {ad.avgLeadSubmissionTimeSec || (ad.autofillRisk >= 80 ? 1.1 : 24.2)}s
                        </span>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-2.5 whitespace-nowrap">
                      {ad.isPaused ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          ⏸️ PAUSED
                        </span>
                      ) : ad.status === 'THROTTLED_SAFE_MODE' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          🛡️ THROTTLED (-15%)
                        </span>
                      ) : isBleeder ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-800 animate-pulse">
                          CRITICAL BLEEDER
                        </span>
                      ) : isWinner ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          HIGH-INTENT WINNER
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-950 text-indigo-300 border border-indigo-800">
                          HEALTHY
                        </span>
                      )}
                    </td>

                    {/* Spend */}
                    <td className="py-3 px-2.5 text-right font-mono font-medium text-white whitespace-nowrap">
                      <CurrencyDisplay amount={ad.spend} currency={currency} />
                    </td>

                    {/* Raw Leads with Segmented Progress Bar */}
                    <td className="py-3 px-2.5 text-right font-mono text-slate-300 whitespace-nowrap">
                      <div>{ad.rawLeads}</div>
                      <div
                        className="w-16 bg-slate-800 rounded-full h-1.5 flex overflow-hidden ml-auto mt-1"
                        title={`${ad.qualifiedLeads} Qualified vs ${Math.max(0, ad.rawLeads - ad.qualifiedLeads)} Junk Leads`}
                      >
                        <div
                          className="bg-emerald-500 h-full"
                          style={{ width: `${(ad.qualifiedLeads / Math.max(1, ad.rawLeads)) * 100}%` }}
                        ></div>
                        <div
                          className="bg-red-500 h-full"
                          style={{ width: `${(Math.max(0, ad.rawLeads - ad.qualifiedLeads) / Math.max(1, ad.rawLeads)) * 100}%` }}
                        ></div>
                      </div>
                    </td>

                    {/* Raw CPL (Deceptive) */}
                    <td className="py-3 px-2.5 text-right font-mono whitespace-nowrap">
                      <span className="text-indigo-300 font-semibold">
                        <CurrencyDisplay amount={rawCpl} currency={currency} compact={true} />
                      </span>
                    </td>

                    {/* Qualified Leads */}
                    <td className="py-3 px-2.5 text-right font-mono whitespace-nowrap">
                      <span className={`font-bold ${ad.qualifiedLeads > 10 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {ad.qualifiedLeads}
                      </span>
                    </td>

                    {/* Junk Rate */}
                    <td className="py-3 px-2.5 text-right font-mono whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          ad.junkRate >= 80
                            ? 'text-red-400 font-bold'
                            : ad.junkRate <= 35
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {ad.junkRate.toFixed(1)}%
                      </span>
                    </td>

                    {/* True CPQL with 7-Day Sparkline */}
                    <td className="py-3 px-2.5 text-right font-mono whitespace-nowrap">
                      <span className={`font-bold ${cpql > 5000 || (currency === 'USD' && cpql > 100) ? 'text-red-400' : 'text-slate-200'}`}>
                        {cpql > 0 ? <CurrencyDisplay amount={cpql} currency={currency} compact={true} /> : '∞ (N/A)'}
                      </span>
                      <div className="flex justify-end mt-0.5" title="7-day CPQL trajectory mini-sparkline">
                        <svg className="w-14 h-3.5 opacity-85" viewBox="0 0 54 14">
                          <polyline
                            fill="none"
                            stroke={isBleeder ? '#EF4444' : isWinner ? '#10B981' : '#6366F1'}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={getSparklinePoints(ad)}
                          />
                        </svg>
                      </div>
                    </td>

                    {/* Realized Pipeline */}
                    <td className="py-3 px-2.5 text-right font-mono whitespace-nowrap">
                      <span className={`font-bold ${ad.realizedPipeline > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <CurrencyDisplay amount={ad.realizedPipeline} currency={currency} />
                      </span>
                    </td>

                    {/* Daily Budget */}
                    <td className="py-3 px-2.5 text-right font-mono whitespace-nowrap text-white font-medium">
                      <CurrencyDisplay amount={ad.dailyBudget} currency={currency} suffix="/d" />
                    </td>

                    {/* Stop-Loss & Forensics Actions */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleAdPause(ad.id)}
                          className={`px-2 py-1 text-xs font-semibold rounded border transition-all cursor-pointer ${
                            ad.isPaused
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'
                              : isBleeder
                              ? 'bg-red-600 hover:bg-red-500 text-white border-red-500 shadow-sm'
                              : 'bg-[#0B0F19] hover:bg-slate-800 text-slate-300 border-[#1E293B]'
                          }`}
                          title={ad.isPaused ? 'Resume Ad Set' : 'Manually Pause Ad Set'}
                        >
                          {ad.isPaused ? '▶️ Resume' : isBleeder ? '🛑 Kill' : 'Pause'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedAdForDrawer(ad)}
                          className="p-1 rounded bg-[#0B0F19] hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border border-[#1E293B] cursor-pointer"
                          title="Open Ad Forensics Drawer"
                        >
                          <Search className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. AUTONOMOUS ACTION FEED & PROJECTED SAVINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Action Feed (2 Cols) */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1E293B] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Autonomous Stop-Loss & CAPI Audit Log
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Live Real-Time Daemon Stream
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {actionLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No autonomous actions logged yet. Run the Stop-Loss Sweep or triage leads in Tab 3 to see live daemon executions.
              </div>
            ) : (
              actionLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-[#0B0F19] border border-[#1E293B] text-xs flex items-start justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          log.badgeColor === 'crimson'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : log.badgeColor === 'emerald'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : log.badgeColor === 'amber'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        }`}
                      >
                        {log.badgeText}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">{log.timestamp}</span>
                      <span className="text-indigo-400 font-mono text-[11px] font-medium">{log.adName}</span>
                    </div>
                    <p className="text-slate-300 text-xs">{log.message}</p>
                  </div>

                  {log.savingsOrRevenueImpact && log.savingsOrRevenueImpact > 0 && (
                    <div className="text-right whitespace-nowrap">
                      <span className="font-mono text-emerald-400 font-bold">
                        +<CurrencyDisplay amount={log.savingsOrRevenueImpact} currency={currency} />
                      </span>
                      <div className="text-[10px] text-slate-500 font-mono">Monthly Impact</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Projected Monthly Savings Card */}
        <div className="bg-gradient-to-br from-[#111827] via-[#111827] to-emerald-950/30 border border-emerald-800/40 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Algorithm Protection Impact
              </span>
              <span className="font-mono text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                MONTHLY RECURRING
              </span>
            </div>

            <div className="mt-4">
              <div className="text-xs text-slate-400">Projected Monthly Wasted Spend Saved:</div>
              <div className="text-3xl font-extrabold font-mono text-white mt-1">
                <CurrencyDisplay amount={metrics.projectedMonthlySavings} currency={currency} />
              </div>
              <div className="text-xs text-emerald-300 mt-2 leading-relaxed">
                By starving bleeder ads of positive CAPI feedback, Meta's algorithm shifts delivery towards high-LTV buyers instead of freebie seekers.
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1E293B] space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Paused Bleeders Daily Budget:</span>
                <span className="font-mono font-bold text-red-400">
                  <CurrencyDisplay amount={metrics.projectedMonthlySavings / 30} currency={currency} suffix="/day" />
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Reallocated to Top Winners:</span>
                <span className="font-mono font-bold text-emerald-400">
                  <CurrencyDisplay amount={metrics.projectedMonthlySavings / 30} currency={currency} suffix="/day" />
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>CAPI Signal Suppression Rate:</span>
                <span className="font-mono font-bold text-indigo-400">
                  {metrics.overallJunkRate.toFixed(1)}% blocked
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-[#0B0F19] p-3 rounded-lg border border-[#1E293B] text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>LeadGuard CAPI Firewall is actively policing all incoming click IDs (`fbclid` & `gclid`).</span>
          </div>
        </div>
      </div>

      {/* 5. SLIDE-OVER AD FORENSICS DRAWER */}
      <AdForensicsDrawer
        ad={selectedAdForDrawer}
        onClose={() => setSelectedAdForDrawer(null)}
        currency={currency}
        leads={leads}
        onTogglePause={handleToggleAdPause}
      />
    </div>
  );
};
