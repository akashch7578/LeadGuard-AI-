import React, { useState } from 'react';
import {
  Trash2,
  CheckCircle2,
  DollarSign,
  Search,
  Filter,
  Phone,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { AdSet, AutonomousActionLog, Currency, Industry, LeadItem, formatCurrency } from '../utils/stopLossEngine';
import { INDUSTRY_CONFIGS } from '../data/industryData';

interface SalesTriageTabProps {
  leads: LeadItem[];
  setLeads: React.Dispatch<React.SetStateAction<LeadItem[]>>;
  ads: AdSet[];
  setAds: React.Dispatch<React.SetStateAction<AdSet[]>>;
  currency: Currency;
  selectedIndustry: Industry;
  setActionLogs: React.Dispatch<React.SetStateAction<AutonomousActionLog[]>>;
}

export const SalesTriageTab: React.FC<SalesTriageTabProps> = ({
  leads,
  setLeads,
  ads,
  setAds,
  currency,
  selectedIndustry,
  setActionLogs,
}) => {
  const config = INDUSTRY_CONFIGS[selectedIndustry];
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING_TRIAGE' | 'QUALIFIED' | 'CLOSED_WON' | 'JUNK_DISMISSED'>('ALL');
  const [dealModalLead, setDealModalLead] = useState<LeadItem | null>(null);
  const [dealInputVal, setDealInputVal] = useState<number>(
    currency === 'USD' ? config.syntheticClosedDealValueUSD : config.syntheticClosedDealValueINR
  );
  const [recentToast, setRecentToast] = useState<{ message: string; type: 'junk' | 'qual' | 'won' } | null>(null);

  const showToast = (message: string, type: 'junk' | 'qual' | 'won') => {
    setRecentToast({ message, type });
    setTimeout(() => setRecentToast(null), 3500);
  };

  // 1. Junk / Wrong Number Action
  const handleMarkJunk = (lead: LeadItem) => {
    // Increment source ad kill counter & junk rate
    setAds((prev) =>
      prev.map((ad) => {
        if (ad.id === lead.adId) {
          const nextKillCount = ad.killCounter + 1;
          const nextJunkRate = Math.min(99.9, ((ad.rawLeads - ad.qualifiedLeads + 1) / Math.max(1, ad.rawLeads)) * 100);
          return {
            ...ad,
            killCounter: nextKillCount,
            junkRate: nextJunkRate,
          };
        }
        return ad;
      })
    );

    // Update lead status
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: 'JUNK_DISMISSED', feedbackNotes: 'Flagged as junk by sales rep' } : l))
    );

    // Add log to Tab 1
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const log: AutonomousActionLog = {
      id: `junk_${Date.now()}`,
      timestamp: now,
      type: 'KILL_COUNTER_INC',
      adId: lead.adId,
      adName: lead.adName,
      message: `SALES FEEDBACK: 🗑️ Junk lead dismissed for "${lead.name}". Source ad "${lead.adName}" Kill Counter incremented. CAPI zero-attribution logged.`,
      badgeText: 'KILL COUNTER +1',
      badgeColor: 'crimson',
    };
    setActionLogs((logs) => [log, ...logs]);

    showToast(`Marked ${lead.name} as Junk. Ad "${lead.adName}" Kill Counter incremented!`, 'junk');
  };

  // 2. Qualified / In Discussion Action
  const handleMarkQualified = (lead: LeadItem) => {
    // Increment qualified count on source ad
    setAds((prev) =>
      prev.map((ad) => {
        if (ad.id === lead.adId) {
          const nextQual = ad.qualifiedLeads + 1;
          const nextJunk = Math.max(0, ((ad.rawLeads - nextQual) / Math.max(1, ad.rawLeads)) * 100);
          return {
            ...ad,
            qualifiedLeads: nextQual,
            junkRate: nextJunk,
          };
        }
        return ad;
      })
    );

    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: 'QUALIFIED', feedbackNotes: 'Verified qualified by sales rep' } : l))
    );

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const log: AutonomousActionLog = {
      id: `qual_${Date.now()}`,
      timestamp: now,
      type: 'CAPI_FIRED',
      adId: lead.adId,
      adName: lead.adName,
      message: `SALES FEEDBACK: 🔥 Verified qualified buyer "${lead.name}". Mid-funnel CAPI Qualified_Lead event fired back to ${lead.clickId.slice(0, 15)}...`,
      badgeText: 'CAPI FIRED',
      badgeColor: 'emerald',
      savingsOrRevenueImpact: currency === 'USD' ? config.syntheticQualifiedLeadValueUSD : config.syntheticQualifiedLeadValueINR,
    };
    setActionLogs((logs) => [log, ...logs]);

    showToast(`Verified ${lead.name} as Qualified. CAPI Qualified_Lead event transmitted to ad platform!`, 'qual');
  };

  // 3. Deal Closed Action
  const handleConfirmDealClosed = () => {
    if (!dealModalLead) return;

    const value = Number(dealInputVal) || (currency === 'USD' ? 5000 : 500000);

    // Update ad pipeline and ROAS
    setAds((prev) =>
      prev.map((ad) => {
        if (ad.id === dealModalLead.adId) {
          return {
            ...ad,
            realizedPipeline: ad.realizedPipeline + value,
            status: 'HIGH-INTENT WINNER',
          };
        }
        return ad;
      })
    );

    setLeads((prev) =>
      prev.map((l) =>
        l.id === dealModalLead.id
          ? {
              ...l,
              status: 'CLOSED_WON',
              dealValue: value,
              feedbackNotes: `Closed Won: ${formatCurrency(value, currency)} revenue credited.`,
            }
          : l
      )
    );

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const log: AutonomousActionLog = {
      id: `won_${Date.now()}`,
      timestamp: now,
      type: 'DEAL_WON',
      adId: dealModalLead.adId,
      adName: dealModalLead.adName,
      message: `DEAL CLOSED WON! 💰 ${dealModalLead.name} converted with ${formatCurrency(value, currency)} revenue. Purchase CAPI event fired!`,
      badgeText: 'CLOSED WON',
      badgeColor: 'emerald',
      savingsOrRevenueImpact: value,
    };
    setActionLogs((logs) => [log, ...logs]);

    showToast(`Deal Closed! ${formatCurrency(value, currency)} added to realized pipeline for ${dealModalLead.adName}.`, 'won');
    setDealModalLead(null);
  };

  const filteredLeads = leads.filter((l) => {
    const matchesFilter = filterStatus === 'ALL' ? true : l.status === filterStatus;
    const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone.includes(searchQuery) ||
      l.adName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.requirement.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast banner */}
      {recentToast && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between shadow-lg transition-all animate-in fade-in duration-200 ${
            recentToast.type === 'junk'
              ? 'bg-red-950/80 border-red-700 text-red-200'
              : recentToast.type === 'qual'
              ? 'bg-indigo-950/80 border-indigo-700 text-indigo-200'
              : 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{recentToast.message}</span>
          </div>
          <span className="font-mono text-[10px] uppercase font-bold opacity-75">CAPI Synced</span>
        </div>
      )}

      {/* Explanatory Header */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">
                1-Click Sales Feedback Loop (Zero-CRM Friction)
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                Live Sales Triage
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              Sales reps hate complex CRM update forms. With 1 click, your sales team directly trains ad algorithms:
              flagging junk immediately increases that ad's kill counter in Tab 1, while marking qualified fires Conversions API (CAPI) events.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-[#0B0F19] px-3 py-2 rounded-lg border border-[#1E293B]">
            <span>Pending Triage:</span>
            <span className="text-amber-400 font-bold">
              {leads.filter((l) => l.status === 'PENDING_TRIAGE').length}
            </span>
            <span className="mx-1 text-slate-600">|</span>
            <span>Qualified:</span>
            <span className="text-emerald-400 font-bold">
              {leads.filter((l) => l.status === 'QUALIFIED' || l.status === 'CLOSED_WON').length}
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="pt-3 border-t border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name, phone, or ad creative..."
              className="w-full bg-[#0B0F19] border border-[#1E293B] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Filter Status Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" />
              Filter:
            </span>
            {(['ALL', 'PENDING_TRIAGE', 'QUALIFIED', 'CLOSED_WON', 'JUNK_DISMISSED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterStatus === st
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-[#0B0F19] text-slate-400 hover:text-slate-200 border border-[#1E293B]'
                }`}
              >
                {st === 'ALL'
                  ? 'All Leads'
                  : st === 'PENDING_TRIAGE'
                  ? 'Pending Triage'
                  : st === 'QUALIFIED'
                  ? 'Qualified'
                  : st === 'CLOSED_WON'
                  ? 'Closed Won'
                  : 'Dismissed Junk'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-3">
        {filteredLeads.length === 0 ? (
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-8 text-center text-slate-500 text-xs">
            No leads found matching your search or filter criteria.
          </div>
        ) : (
          filteredLeads.map((lead) => {
            const isJunk = lead.status === 'JUNK_DISMISSED';
            const isQualified = lead.status === 'QUALIFIED';
            const isWon = lead.status === 'CLOSED_WON';

            return (
              <div
                key={lead.id}
                className={`p-4 rounded-xl border transition-all ${
                  isWon
                    ? 'bg-emerald-950/20 border-emerald-800/60'
                    : isQualified
                    ? 'bg-indigo-950/20 border-indigo-800/50'
                    : isJunk
                    ? 'bg-slate-900/40 border-slate-800 opacity-60'
                    : 'bg-[#111827] border-[#1E293B] hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Lead Details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-white">{lead.name}</span>
                      <span className="text-slate-400 text-xs font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {lead.phone}
                      </span>
                      <span className="text-slate-500 text-[11px] font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lead.timestamp}
                      </span>

                      {/* Intent score badge */}
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          lead.intentScore >= 70
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : lead.intentScore >= 40
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        Score: {lead.intentScore}/100
                      </span>

                      {/* Status badge */}
                      {isWon && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 border border-emerald-700">
                          🏆 CLOSED WON ({formatCurrency(lead.dealValue || 0, currency)})
                        </span>
                      )}
                      {isQualified && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-900 text-indigo-200 border border-indigo-700">
                          🔥 QUALIFIED IN DISCUSSION
                        </span>
                      )}
                      {isJunk && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                          🗑️ JUNK DISMISSED
                        </span>
                      )}
                    </div>

                    {/* Source Ad Attribution */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-400">Source Ad:</span>
                      <span className="font-mono text-indigo-300 font-semibold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                        {lead.adName}
                      </span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        {lead.clickId}
                      </span>
                    </div>

                    {/* AI Qualifier Summary */}
                    <div className="bg-[#0B0F19] p-2.5 rounded-lg border border-[#1E293B] text-xs text-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Extracted Budget:</span>
                        <span className="font-mono text-white font-medium">{lead.extractedBudget}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">Requirement / Notes:</span>
                        <span className="text-slate-300">{lead.requirement}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3 ONE-CLICK ACTION BUTTONS */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                    {/* Action 1: Junk / Wrong Number */}
                    <button
                      type="button"
                      onClick={() => handleMarkJunk(lead)}
                      disabled={isJunk}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isJunk
                          ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-50'
                          : 'bg-red-950/80 hover:bg-red-900/90 text-red-200 border-red-800 hover:border-red-700 active:scale-95'
                      }`}
                      title="Mark as junk. Increments source ad Kill Counter in Tab 1"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span>1. Junk / Wrong #</span>
                    </button>

                    {/* Action 2: Qualified / In Discussion */}
                    <button
                      type="button"
                      onClick={() => handleMarkQualified(lead)}
                      disabled={isQualified || isWon}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isQualified || isWon
                          ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-50'
                          : 'bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-200 border-indigo-800 hover:border-indigo-700 active:scale-95'
                      }`}
                      title="Verify as qualified. Fires mid-funnel Qualified_Lead CAPI event."
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>2. Qualified / Discussion</span>
                    </button>

                    {/* Action 3: Deal Closed (Enter Value) */}
                    <button
                      type="button"
                      onClick={() => setDealModalLead(lead)}
                      disabled={isWon}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isWon
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800 cursor-not-allowed opacity-75'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm active:scale-95'
                      }`}
                      title="Record closed deal revenue. Fires Purchase CAPI event."
                    >
                      <DollarSign className="w-3.5 h-3.5 text-emerald-200" />
                      <span>3. Deal Closed Won</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* QUICK MODAL: Enter Closed Deal Value */}
      {dealModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#111827] border border-emerald-500/40 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Record Closed Deal & Fire Purchase CAPI</h3>
              </div>
              <button
                type="button"
                onClick={() => setDealModalLead(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <p>
                Lead: <strong className="text-white">{dealModalLead.name}</strong> ({dealModalLead.phone})
              </p>
              <p>
                Source Ad: <span className="font-mono text-indigo-400">{dealModalLead.adName}</span>
              </p>
              <p className="text-slate-400 text-[11px]">
                Entering actual deal value will immediately update Tab 1 Realized Pipeline & ROAS metrics,
                and fire a real-time <code className="text-emerald-400 font-mono">Purchase</code> event to Meta/Google.
              </p>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Closed Revenue Amount ({currency}):
              </label>
              <div className="flex items-center bg-[#0B0F19] border border-[#1E293B] rounded-lg px-3 py-2 text-white font-mono text-sm focus-within:border-emerald-500">
                <span className="text-slate-500 mr-2">{currency === 'INR' ? '₹' : '$'}</span>
                <input
                  type="number"
                  value={dealInputVal}
                  onChange={(e) => setDealInputVal(Number(e.target.value))}
                  className="w-full bg-transparent focus:outline-none text-white font-mono"
                  autoFocus
                />
              </div>
            </div>

            {/* Preset quick buttons */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Quick:</span>
              <button
                type="button"
                onClick={() => setDealInputVal(currency === 'USD' ? 2500 : 250000)}
                className="px-2 py-1 rounded bg-[#0B0F19] hover:bg-slate-800 text-slate-300 border border-[#1E293B]"
              >
                {currency === 'INR' ? '₹2.5L' : '$2.5k'}
              </button>
              <button
                type="button"
                onClick={() => setDealInputVal(currency === 'USD' ? 5000 : 500000)}
                className="px-2 py-1 rounded bg-[#0B0F19] hover:bg-slate-800 text-slate-300 border border-[#1E293B]"
              >
                {currency === 'INR' ? '₹5.0L' : '$5k'}
              </button>
              <button
                type="button"
                onClick={() => setDealInputVal(currency === 'USD' ? 10000 : 1000000)}
                className="px-2 py-1 rounded bg-[#0B0F19] hover:bg-slate-800 text-slate-300 border border-[#1E293B]"
              >
                {currency === 'INR' ? '₹10L' : '$10k'}
              </button>
            </div>

            <div className="pt-3 border-t border-[#1E293B] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDealModalLead(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDealClosed}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
              >
                <span>Confirm & Fire Purchase CAPI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
