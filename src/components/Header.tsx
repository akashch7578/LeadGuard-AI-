import React from 'react';
import { ShieldAlert, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { Currency, Industry } from '../utils/stopLossEngine';
import { INDUSTRY_CONFIGS } from '../data/industryData';
import { RupeeIcon } from './CurrencyDisplay';

interface HeaderProps {
  currentTab: 'dashboard' | 'simulator' | 'sales' | 'auditor';
  setCurrentTab: (tab: 'dashboard' | 'simulator' | 'sales' | 'auditor') => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  selectedIndustry: Industry;
  setSelectedIndustry: (ind: Industry) => void;
  activeBleederCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  currency,
  setCurrency,
  selectedIndustry,
  setSelectedIndustry,
  activeBleederCount,
}) => {
  const industries: Industry[] = [
    'Real Estate Developer',
    'Bridal, Makeup & Aesthetic Clinic',
    'EdTech & High-Ticket Coaching',
    'B2B SaaS & Agency',
  ];

  return (
    <header className="border-b border-[#1E293B] bg-[#0E1526]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with branding & global controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3.5 gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  LeadGuard <span className="text-indigo-400 font-mono text-sm px-1.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30">AI</span>
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  <Zap className="w-3 h-3 mr-1 text-emerald-400" />
                  FIREWALL ARMED
                </span>
                {activeBleederCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-red-950/60 text-red-400 border border-red-800/40 animate-pulse">
                    <ShieldAlert className="w-3 h-3 mr-1 text-red-400" />
                    {activeBleederCount} BLEEDERS DETECTED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Autonomous Ad Stop-Loss & CAPI Signal Conditioning Engine
              </p>
            </div>
          </div>

          {/* Global Controls: Currency Toggle & Industry Presets */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Currency Switcher */}
            <div className="flex items-center bg-[#111827] border border-[#1E293B] rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                  currency === 'INR'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-label="Switch to Indian Rupee"
              >
                <RupeeIcon />
                <span>INR</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  currency === 'USD'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-label="Switch to US Dollar"
              >
                $ USD
              </button>
            </div>

            {/* Industry Preset Selector */}
            <div className="flex items-center gap-2 bg-[#111827] border border-[#1E293B] rounded-lg px-3 py-1 text-xs">
              <span className="text-slate-400 font-medium hidden sm:inline">Industry Preset:</span>
              <select
                aria-label="Select Industry Preset"
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value as Industry)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer border-none py-0.5"
              >
                {industries.map((ind) => (
                  <option key={ind} value={ind} className="bg-[#111827] text-slate-200">
                    {ind}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Industry sub-banner */}
        <div className="py-1.5 px-3 mb-2 rounded bg-indigo-950/30 border border-indigo-900/40 flex flex-wrap items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-indigo-400 font-semibold">{INDUSTRY_CONFIGS[selectedIndustry].whatsappAvatarEmoji} {selectedIndustry}:</span>
            <span className="text-slate-400">{INDUSTRY_CONFIGS[selectedIndustry].tagline}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            High-Ticket Benchmark: <span className="text-indigo-300">{INDUSTRY_CONFIGS[selectedIndustry].ticketSizeLabel}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 border-t border-[#1E293B] pt-2 overflow-x-auto pb-1" aria-label="LeadGuard Navigation Tabs">
          <button
            type="button"
            onClick={() => setCurrentTab('dashboard')}
            className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentTab === 'dashboard'
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Zap className="w-4 h-4" />
            1. Autonomous Stop-Loss Center
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('simulator')}
            className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentTab === 'simulator'
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            2. AI WhatsApp & CAPI Simulator
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('sales')}
            className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentTab === 'sales'
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            3. 1-Click Sales Feedback Loop
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('auditor')}
            className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentTab === 'auditor'
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            4. Gemini Ad Forensics & Auditor
          </button>
        </nav>
      </div>
    </header>
  );
};
