import React from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Clock,
  Layers,
  Code,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AdSet, Currency, LeadItem, formatCurrency } from '../utils/stopLossEngine';
import { CurrencyDisplay, RupeeIcon } from './CurrencyDisplay';

interface AdForensicsDrawerProps {
  ad: AdSet | null;
  onClose: () => void;
  currency: Currency;
  leads: LeadItem[];
  onTogglePause: (id: string) => void;
}

export const AdForensicsDrawer: React.FC<AdForensicsDrawerProps> = ({
  ad,
  onClose,
  currency,
  leads,
  onTogglePause,
}) => {
  if (!ad) return null;

  const adLeads = leads.filter((l) => l.adId === ad.id);
  const rawCpl = ad.rawLeads > 0 ? ad.spend / ad.rawLeads : 0;
  const cpql = ad.qualifiedLeads > 0 ? ad.spend / ad.qualifiedLeads : 0;
  const isBleeder = ad.junkRate >= 80;

  // Hourly burn distribution simulation (24h)
  const hourlyDecay = [
    { hour: '00:00', spend: Math.round(ad.spend * 0.02), qual: 0 },
    { hour: '04:00', spend: Math.round(ad.spend * 0.05), qual: 0 },
    { hour: '08:00', spend: Math.round(ad.spend * 0.12), qual: isBleeder ? 0 : 2 },
    { hour: '12:00', spend: Math.round(ad.spend * 0.28), qual: isBleeder ? 1 : 6 },
    { hour: '16:00', spend: Math.round(ad.spend * 0.26), qual: isBleeder ? 0 : 8 },
    { hour: '20:00', spend: Math.round(ad.spend * 0.20), qual: isBleeder ? 1 : 7 },
    { hour: '23:59', spend: Math.round(ad.spend * 0.07), qual: 0 },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#0B0F19] border-l border-[#1E293B] h-full overflow-y-auto flex flex-col shadow-2xl p-6 space-y-6">
        {/* Drawer Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#1E293B]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                {ad.platform}
              </span>
              <span className="font-mono text-xs text-slate-400">{ad.id}</span>
              {ad.isPaused ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  PAUSED
                </span>
              ) : isBleeder ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 animate-pulse">
                  CRITICAL BLEEDER
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  HIGH-INTENT WINNER
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">{ad.name}</h2>
            <p className="text-xs text-slate-400 italic">"{ad.headline}"</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#111827] text-slate-400 hover:text-white border border-[#1E293B] cursor-pointer"
            aria-label="Close Ad Forensics Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Quick Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className="bg-[#111827] p-2.5 rounded-lg border border-[#1E293B]">
            <span className="text-slate-500 text-[10px] block">Spend</span>
            <span className="font-bold text-white text-sm">
              <CurrencyDisplay amount={ad.spend} currency={currency} />
            </span>
          </div>
          <div className="bg-[#111827] p-2.5 rounded-lg border border-[#1E293B]">
            <span className="text-slate-500 text-[10px] block">Raw Leads</span>
            <span className="font-bold text-indigo-300 text-sm">{ad.rawLeads}</span>
            <span className="text-[9px] text-slate-500 block">
              CPL <CurrencyDisplay amount={rawCpl} currency={currency} compact={true} />
            </span>
          </div>
          <div className="bg-[#111827] p-2.5 rounded-lg border border-[#1E293B]">
            <span className="text-slate-500 text-[10px] block">Qualified Leads</span>
            <span className={`font-bold text-sm ${ad.qualifiedLeads > 10 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {ad.qualifiedLeads}
            </span>
            <span className="text-[9px] text-slate-500 block">
              CPQL <CurrencyDisplay amount={cpql} currency={currency} compact={true} />
            </span>
          </div>
          <div className="bg-[#111827] p-2.5 rounded-lg border border-[#1E293B]">
            <span className="text-slate-500 text-[10px] block">Junk Rate</span>
            <span className={`font-bold text-sm ${ad.junkRate >= 80 ? 'text-red-400' : 'text-emerald-400'}`}>
              {ad.junkRate.toFixed(1)}%
            </span>
            <span className="text-[9px] text-slate-500 block">{ad.autofillRisk}% Autofill</span>
          </div>
        </div>

        {/* Ad Creative & Audience Meta Card */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 space-y-3 text-xs">
          <div className="font-bold text-white flex items-center gap-2 text-xs">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Creative Angle & Targeting Profile</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span>Creative Format:</span>
              <span className="font-mono text-white font-semibold">{ad.creativeType}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Target Audience:</span>
              <span className="font-mono text-indigo-300">{ad.targetAudience}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Learning Phase:</span>
              <span className="font-mono text-amber-300">
                {ad.learningPhase} ({ad.learningEvents.current}/{ad.learningEvents.target} events)
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Avg Form Fill Latency:</span>
              <span className={`font-mono font-bold ${ad.autofillRisk >= 80 ? 'text-red-400' : 'text-emerald-400'}`}>
                {ad.avgLeadSubmissionTimeSec || (ad.autofillRisk >= 80 ? 1.1 : 24.2)}s
              </span>
            </div>
          </div>
        </div>

        {/* Hourly Spend vs Quality Decay Chart */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5 font-mono">
              <Clock className="w-4 h-4 text-indigo-400" />
              HOURLY SPEND & QUALITY DECAY
            </span>
            <span className="text-[10px] font-mono text-slate-500">24h Normalized</span>
          </div>

          <div className="space-y-2">
            {hourlyDecay.map((h, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[11px] font-mono">
                <span className="w-12 text-slate-500 text-right">{h.hour}</span>
                <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden flex">
                  <div
                    className="bg-indigo-500/80 h-2"
                    style={{ width: `${(h.spend / (ad.spend * 0.3)) * 100}%` }}
                  ></div>
                </div>
                <span className="w-16 text-slate-400 text-right">
                  <CurrencyDisplay amount={h.spend} currency={currency} compact={true} />
                </span>
                <span className={`w-12 text-right ${h.qual > 0 ? 'text-emerald-400 font-bold' : 'text-slate-600'}`}>
                  {h.qual} qual
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* json-rules-engine Evaluation Tree */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5 font-mono">
              <Code className="w-4 h-4 text-emerald-400" />
              JSON-RULES-ENGINE EVALUATION TREE
            </span>
            <span className="text-[10px] font-mono text-indigo-300">CacheControl Engine</span>
          </div>

          <div className="p-3 rounded-lg bg-[#07090E] border border-[#1E293B] text-[11px] font-mono text-slate-300 space-y-2">
            <div className="flex items-center justify-between">
              <span>Rule A (Ghost Lead: Spend &gt; Cap AND Qual == 0):</span>
              <span className={ad.spend > 3000 && ad.qualifiedLeads === 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                {ad.spend > 3000 && ad.qualifiedLeads === 0 ? 'TRUE (BREACH)' : 'FALSE (PASS)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Rule B (Junk Rate: Raw &gt;= 15 AND Junk &gt; 80%):</span>
              <span className={ad.rawLeads >= 15 && ad.junkRate >= 80 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                {ad.rawLeads >= 15 && ad.junkRate >= 80 ? 'TRUE (BREACH)' : 'FALSE (PASS)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Learning Phase Guard:</span>
              <span className={ad.learningPhase === 'LEARNING' ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                {ad.learningPhase === 'LEARNING' ? 'SAFE MODE THROTTLE 15%' : 'N/A (ACTIVE)'}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Leads from this Ad */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 space-y-3 text-xs">
          <div className="font-bold text-white flex items-center justify-between">
            <span>Recent Leads Attributed to this Creative ({adLeads.length})</span>
          </div>

          {adLeads.length === 0 ? (
            <div className="text-center py-4 text-slate-500 text-[11px]">
              No leads currently in queue for this campaign.
            </div>
          ) : (
            <div className="space-y-2">
              {adLeads.map((l) => (
                <div key={l.id} className="p-2.5 rounded-lg bg-[#07090E] border border-[#1E293B] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{l.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{l.phone}</div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        l.intentScore >= 70
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}
                    >
                      {l.intentScore}/100
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{l.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onTogglePause(ad.id)}
            className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              ad.isPaused
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {ad.isPaused ? (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Resume Campaign</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Pause Bleeder Campaign</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-lg bg-[#111827] text-slate-300 hover:text-white border border-[#1E293B] text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
