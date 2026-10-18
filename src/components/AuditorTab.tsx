import React, { useState } from 'react';
import {
  Sparkles,
  ShieldAlert,
  Copy,
  Check,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { AdSet, Currency, Industry, StopLossRules, formatCurrency } from '../utils/stopLossEngine';

interface AuditorTabProps {
  ads: AdSet[];
  industry: Industry;
  currency: Currency;
  stopLossRules: StopLossRules;
}

interface AdAutopsy {
  adName: string;
  severity: string;
  rootCause: string;
  recommendedImmediateAction: string;
}

interface ReplacementHook {
  frameworkName: string;
  hookHeadline: string;
  primaryText: string;
  qualifyingFilterMechanism: string;
  targetPersona: string;
  expectedCplShift: string;
  expectedCpqlShift: string;
}

interface AuditResult {
  totalWastedSpend: number;
  currency: string;
  executiveDiagnosis: string;
  algorithmicFlawExplanation: string;
  adAutopsies: AdAutopsy[];
  replacementHooks: ReplacementHook[];
  stopLossStrategicRoadmap: string[];
}

export const AuditorTab: React.FC<AuditorTabProps> = ({ ads, industry, currency, stopLossRules }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customSpend, setCustomSpend] = useState<number>(currency === 'USD' ? 2500 : 200000);
  const [customRawLeads, setCustomRawLeads] = useState<number>(450);
  const [customQualLeads, setCustomQualLeads] = useState<number>(10);

  const runAudit = async () => {
    setIsLoading(true);

    try {
      const activePayloadAds = customMode
        ? [
            {
              id: 'custom_ad_1',
              name: 'Custom_User_Campaign_V1',
              spend: customSpend,
              rawLeads: customRawLeads,
              qualifiedLeads: customQualLeads,
              junkRate: ((customRawLeads - customQualLeads) / customRawLeads) * 100,
              realizedPipeline: 0,
              headline: 'Flash Discount Coupon Lead Form',
              creativeType: 'Reels Video',
            },
            ...ads.slice(3),
          ]
        : ads;

      const response = await fetch('/api/gemini/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ads: activePayloadAds,
          industry,
          currency,
          stopLossRules,
        }),
      });

      const data = await response.json();
      if (data && data.executiveDiagnosis) {
        setAuditResult(data);
      }
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyHook = (hook: ReplacementHook, index: number) => {
    const text = `HOOK HEADLINE:\n${hook.hookHeadline}\n\nPRIMARY TEXT:\n${hook.primaryText}\n\nQUALIFYING FILTER:\n${hook.qualifyingFilterMechanism}\n\nTARGET PERSONA:\n${hook.targetPersona}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-950/70 via-[#111827] to-amber-950/40 border border-indigo-500/30 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Gemini Ad Forensics & Wasted Spend Auditor
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
                AI Deep Attribution
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Examine the root psychological cause behind the "Cheap Lead Trap". Gemini analyzes your active campaigns,
              diagnoses algorithmic delivery poisoning, and writes high-intent ad hook replacements designed to filter out freebie seekers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => setCustomMode(!customMode)}
              className="text-xs font-mono text-slate-400 hover:text-slate-200 bg-[#0B0F19] px-3 py-2 rounded-lg border border-[#1E293B] flex items-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto justify-center"
            >
              <Sliders className="w-3.5 h-3.5" />
              {customMode ? 'Using Custom Metrics' : 'Audit Custom Metrics'}
            </button>

            <button
              type="button"
              onClick={runAudit}
              disabled={isLoading}
              className={`px-5 py-2.5 rounded-lg font-bold text-xs sm:text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg w-full sm:w-auto cursor-pointer active:scale-95 ${
                isLoading
                  ? 'bg-slate-700 text-slate-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:shadow-indigo-500/40'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Auditing Campaign Data...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>🔍 Run Gemini Deep Audit on Current Ad Account</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Custom metrics drawer if opened */}
        {customMode && (
          <div className="p-4 rounded-lg bg-[#0B0F19] border border-[#1E293B] space-y-3 text-xs animate-in fade-in">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Simulate Your Own Custom Ad Account Metrics:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Total Ad Spend ({currency}):</label>
                <input
                  type="number"
                  value={customSpend}
                  onChange={(e) => setCustomSpend(Number(e.target.value))}
                  className="w-full bg-[#111827] border border-[#1E293B] rounded px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Raw Platform Leads:</label>
                <input
                  type="number"
                  value={customRawLeads}
                  onChange={(e) => setCustomRawLeads(Number(e.target.value))}
                  className="w-full bg-[#111827] border border-[#1E293B] rounded px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">True Qualified Leads:</label>
                <input
                  type="number"
                  value={customQualLeads}
                  onChange={(e) => setCustomQualLeads(Number(e.target.value))}
                  className="w-full bg-[#111827] border border-[#1E293B] rounded px-3 py-1.5 text-emerald-400 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Simulated Junk Rate:{' '}
              <span className="text-red-400 font-bold">
                {(((customRawLeads - customQualLeads) / customRawLeads) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* If not yet audited, show ready state teaser */}
      {!auditResult && !isLoading && (
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-10 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-indigo-400" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">Ad Forensics Ready to Execute</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Click <strong className="text-white">"Run Gemini Deep Audit"</strong> to generate a complete financial
              leakage diagnosis, creative autopsy for bleeder ads, and 3 production-ready ad hooks engineered for {industry}.
            </p>
          </div>
          <button
            type="button"
            onClick={runAudit}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Start Forensics Now
          </button>
        </div>
      )}

      {/* Loading state skeleton */}
      {isLoading && (
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-8 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-800 rounded w-1/3"></div>
          <div className="h-24 bg-slate-800/60 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-40 bg-slate-800/40 rounded"></div>
            <div className="h-40 bg-slate-800/40 rounded"></div>
            <div className="h-40 bg-slate-800/40 rounded"></div>
          </div>
        </div>
      )}

      {/* AUDIT RESULTS PRESENTATION */}
      {auditResult && !isLoading && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* 1. FINANCIAL TRIAGE BANNER */}
          <div className="p-5 rounded-xl bg-red-950/30 border border-red-800/60 text-red-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-red-900/40 border border-red-700/60 text-red-400 shrink-0">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Critical Algorithmic Bleed Detected</h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                    CHEAP LEAD TRAP
                  </span>
                </div>
                <p className="text-xs text-red-200/90 leading-relaxed max-w-2xl">
                  {auditResult.executiveDiagnosis}
                </p>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-red-800/60 sm:pl-6 shrink-0">
              <div className="text-xs text-red-400 font-mono uppercase font-semibold">Leaking Ad Spend</div>
              <div className="text-3xl font-extrabold font-mono text-white mt-0.5">
                {auditResult.currency}
                {auditResult.totalWastedSpend.toLocaleString()}
              </div>
              <div className="text-[11px] text-red-300 font-mono mt-1">
                Zero Realized Pipeline
              </div>
            </div>
          </div>

          {/* 2. ALGORITHMIC FLAW BREAKDOWN & AD AUTOPSIES */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1E293B]">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Why Standard Ad Platforms Deliver Cheap, Unresponsive Leads
              </h3>
            </div>

            <div className="p-4 rounded-lg bg-[#0B0F19] border border-[#1E293B] text-xs text-slate-300 leading-relaxed">
              <p>{auditResult.algorithmicFlawExplanation}</p>
            </div>

            {/* Bleeder Ad Autopsies */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold font-mono uppercase text-slate-400 tracking-wider">
                Creative Autopsy: Individual Bleeder Breakdowns
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {auditResult.adAutopsies.map((autopsy, i) => (
                  <div key={i} className="p-4 rounded-lg bg-[#0B0F19] border border-red-900/30 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white font-mono text-xs">{autopsy.adName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                        {autopsy.severity}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      <strong className="text-slate-300">Root Cause:</strong> {autopsy.rootCause}
                    </p>
                    <div className="pt-2 border-t border-[#1E293B] text-[11px] text-amber-300">
                      <strong>Fix:</strong> {autopsy.recommendedImmediateAction}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. READY-TO-LAUNCH HIGH-INTENT AD HOOK & COPY REPLACEMENTS */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1E293B] gap-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  3 Ready-to-Launch High-Intent Ad Hook Replacements
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Filters Window Shoppers Upfront
              </span>
            </div>

            <p className="text-xs text-slate-400">
              These copy angles intentionally induce healthy friction. Raw CPL may increase slightly, but your Cost Per Qualified Lead (CPQL) drops precipitously.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {auditResult.replacementHooks.map((hook, idx) => (
                <div
                  key={idx}
                  className="bg-[#0B0F19] border border-emerald-900/40 rounded-xl p-4 flex flex-col justify-between space-y-4 hover:border-emerald-600/50 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        Hook #{idx + 1}: {hook.frameworkName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyHook(hook, idx)}
                        className="flex items-center gap-1 text-[11px] font-mono text-slate-300 hover:text-white bg-slate-800 px-2 py-1 rounded transition-colors cursor-pointer"
                        title="Copy ad hook and copy to clipboard"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Headline */}
                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-500">Headline Hook:</div>
                      <div className="text-sm font-bold text-white mt-0.5 leading-snug">
                        "{hook.hookHeadline}"
                      </div>
                    </div>

                    {/* Primary Text */}
                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-500">Primary Ad Copy:</div>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed bg-[#111827] p-2.5 rounded border border-[#1E293B]">
                        {hook.primaryText}
                      </p>
                    </div>

                    {/* Qualifying Mechanism */}
                    <div className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-300 block mb-0.5">Pre-Qualification Mechanism:</span>
                      <span className="text-[11px]">{hook.qualifyingFilterMechanism}</span>
                    </div>

                    <div className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-300 block mb-0.5">Target Persona:</span>
                      <span className="text-[11px] font-mono text-indigo-300">{hook.targetPersona}</span>
                    </div>
                  </div>

                  {/* Expected metric impact chips */}
                  <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">{hook.expectedCplShift}</span>
                    <span className="text-emerald-400 font-bold">{hook.expectedCpqlShift}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. STRATEGIC STOP-LOSS ROADMAP */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1E293B]">
              <CheckCircle className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                LeadGuard AI Strategic Stop-Loss Roadmap
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {auditResult.stopLossStrategicRoadmap.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#0B0F19] border border-[#1E293B] flex items-start gap-2.5 text-slate-300"
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-950 text-indigo-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
