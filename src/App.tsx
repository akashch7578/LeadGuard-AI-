/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardTab } from './components/DashboardTab';
import { SimulatorTab } from './components/SimulatorTab';
import { SalesTriageTab } from './components/SalesTriageTab';
import { AuditorTab } from './components/AuditorTab';
import {
  AdSet,
  AutonomousActionLog,
  Currency,
  Industry,
  LeadItem,
  StopLossRules,
} from './utils/stopLossEngine';
import { INDUSTRY_CONFIGS } from './data/industryData';
import { ShieldCheck, Zap, Lock, Bell } from 'lucide-react';
import { TerminalStreamBar, TerminalLog } from './components/TerminalStreamBar';

export default function App() {
  const [currency, setCurrency] = useState<Currency>('INR');
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>('Real Estate Developer');
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'simulator' | 'sales' | 'auditor'>('dashboard');

  // Developer live telemetry and event stream state
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([
    {
      id: 'log_1',
      timestamp: '12:00:01 PM',
      category: 'RULE_ENGINE',
      message: '[json-rules-engine] Initialized 5 autonomous stop-loss rules for ' + selectedIndustry,
    },
    {
      id: 'log_2',
      timestamp: '12:00:15 PM',
      category: 'CAPI',
      message: '[Meta CAPI v21.0] Graph API connected. Starvation armed for unverified leads.',
    },
    {
      id: 'log_3',
      timestamp: '12:00:22 PM',
      category: 'TELEMETRY',
      message: '[Autofill Guard] Keystroke dynamic analysis armed: <2.0s duration triggers flag.',
    },
    {
      id: 'log_4',
      timestamp: '12:01:05 PM',
      category: 'WEBHOOK',
      message: '[Webhook Daemon] Listening on /api/webhooks/lead-capture for fbclid/gclid tracking.',
    },
  ]);

  // Stop loss rules state
  const [rules, setRules] = useState<StopLossRules>({
    ruleA_enabled: true,
    ruleA_spendThreshold: 3000,
    ruleB_enabled: true,
    ruleB_minRawLeads: 15,
    ruleB_junkRateThreshold: 80,
    ruleC_autoReallocate: true,
    learningPhaseSafeMode: true,
    qualificationLagGraceHours: 6,
  });

  // Current industry config
  const industryConfig = INDUSTRY_CONFIGS[selectedIndustry];

  // Ads state
  const [ads, setAds] = useState<AdSet[]>(() => {
    return currency === 'USD' ? industryConfig.adsUSD : industryConfig.adsINR;
  });

  // Leads state
  const [leads, setLeads] = useState<LeadItem[]>(() => {
    return industryConfig.initialLeads;
  });

  // Autonomous Action Logs state
  const [actionLogs, setActionLogs] = useState<AutonomousActionLog[]>([
    {
      id: 'init_1',
      timestamp: '12:00:15 PM',
      type: 'PAUSE_BLEEDER',
      adId: 'ad_re_1',
      adName: 'Reel_Hook_Discount_V1',
      message: 'AUTONOMOUS STOP-LOSS: Ad paused. 99% junk rate detected with zero pipeline.',
      savingsOrRevenueImpact: 90000,
      badgeText: 'PAUSED BLEEDER',
      badgeColor: 'crimson',
    },
    {
      id: 'init_2',
      timestamp: '12:00:16 PM',
      type: 'REALLOCATE_BUDGET',
      adId: 'ad_re_4',
      adName: 'Founder_Authority_CaseStudy_V3',
      message: 'BUDGET AUTO-REALLOCATED: Shifted freed budget to top CPQL winner.',
      savingsOrRevenueImpact: 90000,
      badgeText: 'BUDGET BOOST',
      badgeColor: 'emerald',
    },
    {
      id: 'init_3',
      timestamp: '12:14:02 PM',
      type: 'CAPI_BLOCKED',
      adId: 'ad_re_1',
      adName: 'Reel_Hook_Discount_V1',
      message: 'CAPI SIGNAL SUPPRESSED: Blocked pixel event for student window-shopper lead.',
      badgeText: 'SIGNAL BLOCKED',
      badgeColor: 'crimson',
    },
  ]);

  // Sync ads and leads when industry changes
  useEffect(() => {
    const config = INDUSTRY_CONFIGS[selectedIndustry];
    setAds(currency === 'USD' ? config.adsUSD : config.adsINR);
    setLeads(config.initialLeads);
  }, [selectedIndustry]);

  // Adjust rules and ads scale when currency changes
  const handleCurrencyChange = (newCurrency: Currency) => {
    if (newCurrency === currency) return;
    setCurrency(newCurrency);

    setRules((prev) => ({
      ...prev,
      ruleA_spendThreshold: newCurrency === 'USD' ? 50 : 3000,
    }));

    const config = INDUSTRY_CONFIGS[selectedIndustry];
    const sourcePresets = newCurrency === 'USD' ? config.adsUSD : config.adsINR;

    // Preserve paused status and kill counter from current ads
    setAds((currentAds) =>
      sourcePresets.map((presetAd) => {
        const existing = currentAds.find((a) => a.id === presetAd.id);
        if (existing) {
          return {
            ...presetAd,
            isPaused: existing.isPaused,
            status: existing.status,
            killCounter: existing.killCounter,
          };
        }
        return presetAd;
      })
    );
  };

  // Reset defaults handler
  const handleResetDefaults = () => {
    const config = INDUSTRY_CONFIGS[selectedIndustry];
    setAds(currency === 'USD' ? config.adsUSD : config.adsINR);
    setRules({
      ruleA_enabled: true,
      ruleA_spendThreshold: currency === 'USD' ? 50 : 3000,
      ruleB_enabled: true,
      ruleB_minRawLeads: 15,
      ruleB_junkRateThreshold: 80,
      ruleC_autoReallocate: true,
      learningPhaseSafeMode: true,
      qualificationLagGraceHours: 6,
    });
    setLeads(config.initialLeads);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '1') setCurrentTab('dashboard');
      if (e.key === '2') setCurrentTab('simulator');
      if (e.key === '3') setCurrentTab('sales');
      if (e.key === '4') setCurrentTab('auditor');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeBleederCount = ads.filter((ad) => !ad.isPaused && ad.junkRate >= 80).length;

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans relative overflow-x-hidden pb-12">
      {/* Ambient Radial Mesh Gradient Glows */}
      <div className="absolute top-0 left-1/4 w-[650px] h-[320px] bg-indigo-600/[0.08] blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-24 right-1/4 w-[500px] h-[280px] bg-emerald-500/[0.05] blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Global Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currency={currency}
        setCurrency={handleCurrencyChange}
        selectedIndustry={selectedIndustry}
        setSelectedIndustry={setSelectedIndustry}
        activeBleederCount={activeBleederCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardTab
            ads={ads}
            setAds={setAds}
            rules={rules}
            setRules={setRules}
            currency={currency}
            actionLogs={actionLogs}
            setActionLogs={setActionLogs}
            onResetDefaults={handleResetDefaults}
            leads={leads}
          />
        )}

        {currentTab === 'simulator' && (
          <SimulatorTab
            selectedIndustry={selectedIndustry}
            currency={currency}
          />
        )}

        {currentTab === 'sales' && (
          <SalesTriageTab
            leads={leads}
            setLeads={setLeads}
            ads={ads}
            setAds={setAds}
            currency={currency}
            selectedIndustry={selectedIndustry}
            setActionLogs={setActionLogs}
          />
        )}

        {currentTab === 'auditor' && (
          <AuditorTab
            ads={ads}
            industry={selectedIndustry}
            currency={currency}
            stopLossRules={rules}
          />
        )}
      </main>

      {/* Enterprise Dark Mode Footer */}
      <footer className="border-t border-[#1E293B] bg-[#0B0F19]/90 backdrop-blur-md py-5 mt-10 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">LeadGuard AI Enterprise</span>
            <span className="text-slate-500">|</span>
            <span>Meta Conversions API & Google Offline Conversion Engine</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              CAPI Firewall Active
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-indigo-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              Autonomous Daemon v2.4
            </span>
          </div>
        </div>
      </footer>

      {/* Developer Live Telemetry & API Event Stream */}
      <TerminalStreamBar
        logs={terminalLogs}
        onClearLogs={() => setTerminalLogs([])}
      />
    </div>
  );
}
