export type Currency = 'INR' | 'USD';

export type Industry =
  | 'Real Estate Developer'
  | 'Bridal, Makeup & Aesthetic Clinic'
  | 'EdTech & High-Ticket Coaching'
  | 'B2B SaaS & Agency';

export type AdStatus = 'ACTIVE' | 'PAUSED' | 'CRITICAL BLEEDER' | 'HIGH-INTENT WINNER' | 'HEALTHY PERFORMER' | 'THROTTLED_SAFE_MODE';

export type LearningPhaseStatus = 'LEARNING' | 'ACTIVE' | 'LEARNING_LIMITED';

export interface AdSet {
  id: string;
  name: string;
  platform: 'Meta Ads' | 'Google Ads' | 'YouTube Ads' | 'LinkedIn Ads';
  headline: string;
  spend: number;
  rawLeads: number;
  qualifiedLeads: number;
  junkRate: number; // percentage 0-100
  realizedPipeline: number;
  dailyBudget: number;
  status: AdStatus;
  isPaused: boolean;
  killCounter: number; // number of times sales flagged junk
  targetAudience: string;
  creativeType: 'Reels Video' | 'Instant Lead Form' | 'Search Broad' | 'Founder Video' | 'Search Exact' | 'Carousel' | 'Click-to-WhatsApp' | 'LinkedIn Sponsored';
  // V2.0 Upgrades
  learningPhase: LearningPhaseStatus;
  learningEvents: { current: number; target: number }; // e.g. { current: 32, target: 50 }
  autofillRisk: number; // % submitted in <2s with zero keystrokes
  isThrottled?: boolean; // if Safe Mode applied 15% throttle instead of hard pause
  avgLeadSubmissionTimeSec?: number; // e.g. 1.2s vs 19.5s
}

export interface StopLossRules {
  ruleA_enabled: boolean; // Ghost Lead Kill Switch
  ruleA_spendThreshold: number; // e.g., 3000 INR or 50 USD
  ruleB_enabled: boolean; // Junk Rate Guard
  ruleB_minRawLeads: number; // e.g., 15
  ruleB_junkRateThreshold: number; // e.g., 80%
  ruleC_autoReallocate: boolean; // Auto-shift paused budget to highest CPQL winner
  // V2.0 Upgrades
  learningPhaseSafeMode: boolean; // Throttles 15% + CAPI starvation instead of hard pause
  qualificationLagGraceHours: number; // Hours to wait for WhatsApp/Sales verification (2h - 48h)
}

export interface AutonomousActionLog {
  id: string;
  timestamp: string;
  type: 'PAUSE_BLEEDER' | 'THROTTLE_SAFE_MODE' | 'REALLOCATE_BUDGET' | 'CAPI_BLOCKED' | 'CAPI_FIRED' | 'KILL_COUNTER_INC' | 'DEAL_WON' | 'VOICE_SYNC';
  adId: string;
  adName: string;
  message: string;
  savingsOrRevenueImpact?: number;
  badgeText: string;
  badgeColor: 'emerald' | 'crimson' | 'amber' | 'indigo';
}

export interface LeadItem {
  id: string;
  name: string;
  phone: string;
  timestamp: string;
  adId: string;
  adName: string;
  intentScore: number;
  extractedBudget: string;
  extractedTimeline: string;
  requirement: string;
  status: 'PENDING_TRIAGE' | 'QUALIFIED' | 'CLOSED_WON' | 'JUNK_DISMISSED';
  feedbackNotes?: string;
  dealValue?: number;
  clickId: string; // fbclid or gclid
  submissionDurationSec?: number;
  keystrokeDynamics?: string;
}

export interface CrossNetworkArbitrageItem {
  channel: string;
  cpl: number;
  qualRate: number;
  trueCpql: number;
  legacyRuleVerdict: string;
  leadguardVerdict: string;
  competitorTrapWarning: string;
  isTrapWinner: boolean;
}

export interface WaterfallSpendBreakdown {
  totalSpend: number;
  productiveSpend: number;
  autofillLeak: number;
  cheapCplTrapLeak: number;
  ghostLeadLeak: number;
}

export function formatCurrency(amount: number, currency: Currency, compact: boolean = false): string {
  if (currency === 'INR') {
    if (compact) {
      if (Math.abs(amount) >= 10000000) {
        return `₹${(amount / 10000000).toFixed(1)} Cr`;
      }
      if (Math.abs(amount) >= 100000) {
        return `₹${(amount / 100000).toFixed(1)}L`;
      }
      if (Math.abs(amount) >= 1000) {
        return `₹${(amount / 1000).toFixed(1)}k`;
      }
      return `₹${Math.round(amount).toLocaleString('en-IN')}`;
    }
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  } else {
    if (compact) {
      if (Math.abs(amount) >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`;
      }
      if (Math.abs(amount) >= 1000) {
        return `$${(amount / 1000).toFixed(1)}k`;
      }
      return `$${Math.round(amount).toLocaleString('en-US')}`;
    }
    return `$${Math.round(amount).toLocaleString('en-US')}`;
  }
}

export function calculateMetrics(ads: AdSet[]) {
  const totalSpend = ads.reduce((acc, ad) => acc + ad.spend, 0);
  const totalRawLeads = ads.reduce((acc, ad) => acc + ad.rawLeads, 0);
  const totalQualifiedLeads = ads.reduce((acc, ad) => acc + ad.qualifiedLeads, 0);
  const totalRealizedPipeline = ads.reduce((acc, ad) => acc + ad.realizedPipeline, 0);

  const wastedSpend = ads.reduce((acc, ad) => {
    if (ad.junkRate >= 80 && ad.realizedPipeline === 0) {
      return acc + ad.spend;
    }
    return acc;
  }, 0);

  const rawCpl = totalRawLeads > 0 ? totalSpend / totalRawLeads : 0;
  const cpql = totalQualifiedLeads > 0 ? totalSpend / totalQualifiedLeads : 0;
  const overallJunkRate = totalRawLeads > 0 ? ((totalRawLeads - totalQualifiedLeads) / totalRawLeads) * 100 : 0;

  const pausedDailyBudget = ads
    .filter((ad) => ad.isPaused && ad.junkRate >= 80)
    .reduce((acc, ad) => acc + ad.dailyBudget, 0);
  const projectedMonthlySavings = pausedDailyBudget * 30;

  return {
    totalSpend,
    wastedSpend,
    totalRawLeads,
    totalQualifiedLeads,
    rawCpl,
    cpql,
    totalRealizedPipeline,
    overallJunkRate,
    projectedMonthlySavings,
    activeAdsCount: ads.filter((ad) => !ad.isPaused).length,
    pausedAdsCount: ads.filter((ad) => ad.isPaused).length,
  };
}

export function evaluateStopLoss(
  ad: AdSet,
  rules: StopLossRules
): { shouldPause: boolean; shouldThrottle: boolean; reason: string; ruleType: string } {
  if (ad.isPaused) {
    return { shouldPause: false, shouldThrottle: false, reason: 'Already paused', ruleType: 'NONE' };
  }

  const isViolatingRuleA = rules.ruleA_enabled && ad.spend >= rules.ruleA_spendThreshold && ad.qualifiedLeads === 0;
  const isViolatingRuleB = rules.ruleB_enabled && ad.rawLeads >= rules.ruleB_minRawLeads && ad.junkRate >= rules.ruleB_junkRateThreshold;

  if (!isViolatingRuleA && !isViolatingRuleB) {
    return { shouldPause: false, shouldThrottle: false, reason: 'Within safety thresholds', ruleType: 'NONE' };
  }

  // Check Learning Phase Safe Mode (V2.0)
  if (rules.learningPhaseSafeMode && ad.learningPhase === 'LEARNING') {
    return {
      shouldPause: false,
      shouldThrottle: true,
      reason: `Learning-Phase Safe Mode Protected: Ad is in LEARNING (${ad.learningEvents.current}/${ad.learningEvents.target} events). Hard pause would reset Meta's algorithm to Day 0. Applying 15% budget throttle & CAPI signal starvation instead.`,
      ruleType: 'SAFE_MODE_THROTTLE',
    };
  }

  if (isViolatingRuleA) {
    return {
      shouldPause: true,
      shouldThrottle: false,
      reason: `Rule A Triggered: Spent ${ad.spend} with ZERO qualified pipeline. Ghost lead trap identified.`,
      ruleType: 'RULE_A_GHOST_LEAD',
    };
  }

  return {
    shouldPause: true,
    shouldThrottle: false,
    reason: `Rule B Triggered: High volume (${ad.rawLeads} leads) with toxic ${ad.junkRate.toFixed(1)}% junk rate (threshold: ${rules.ruleB_junkRateThreshold}%).`,
    ruleType: 'RULE_B_JUNK_GUARD',
  };
}

export function runStopLossSweep(
  ads: AdSet[],
  rules: StopLossRules,
  currency: Currency
): {
  updatedAds: AdSet[];
  actionLogs: AutonomousActionLog[];
  totalFreedDailyBudget: number;
  reallocatedTo?: string;
} {
  const updatedAds = ads.map((ad) => ({ ...ad }));
  const actionLogs: AutonomousActionLog[] = [];
  let totalFreedDailyBudget = 0;
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  for (const ad of updatedAds) {
    if (!ad.isPaused) {
      const evaluation = evaluateStopLoss(ad, rules);

      if (evaluation.shouldThrottle) {
        const throttleAmount = Math.round(ad.dailyBudget * 0.15);
        ad.dailyBudget = Math.max(1, ad.dailyBudget - throttleAmount);
        ad.isThrottled = true;
        ad.status = 'THROTTLED_SAFE_MODE';
        totalFreedDailyBudget += throttleAmount;

        actionLogs.push({
          id: `log_throttle_${Date.now()}_${ad.id}`,
          timestamp: now,
          type: 'THROTTLE_SAFE_MODE',
          adId: ad.id,
          adName: ad.name,
          message: evaluation.reason,
          savingsOrRevenueImpact: throttleAmount * 30,
          badgeText: 'SAFE THROTTLE (-15%)',
          badgeColor: 'amber',
        });
      } else if (evaluation.shouldPause) {
        ad.isPaused = true;
        ad.status = 'PAUSED';
        totalFreedDailyBudget += ad.dailyBudget;

        actionLogs.push({
          id: `log_pause_${Date.now()}_${ad.id}`,
          timestamp: now,
          type: 'PAUSE_BLEEDER',
          adId: ad.id,
          adName: ad.name,
          message: `AUTONOMOUS STOP-LOSS PAUSE: ${evaluation.reason}`,
          savingsOrRevenueImpact: ad.dailyBudget * 30,
          badgeText: 'PAUSED BLEEDER',
          badgeColor: 'crimson',
        });
      }
    }
  }

  let reallocatedTo: string | undefined = undefined;
  if (rules.ruleC_autoReallocate && totalFreedDailyBudget > 0) {
    const eligibleWinners = updatedAds.filter((ad) => !ad.isPaused && ad.qualifiedLeads > 0);
    if (eligibleWinners.length > 0) {
      eligibleWinners.sort((a, b) => {
        const cpqlA = a.spend / a.qualifiedLeads;
        const cpqlB = b.spend / b.qualifiedLeads;
        return cpqlA - cpqlB;
      });

      const winner = eligibleWinners[0];
      const previousBudget = winner.dailyBudget;
      winner.dailyBudget += totalFreedDailyBudget;
      reallocatedTo = winner.name;

      actionLogs.push({
        id: `log_realloc_${Date.now()}`,
        timestamp: now,
        type: 'REALLOCATE_BUDGET',
        adId: winner.id,
        adName: winner.name,
        message: `BUDGET AUTO-REALLOCATED: Shifted +${formatCurrency(totalFreedDailyBudget, currency)}/day from stopped spend to top CPQL winner (${formatCurrency(previousBudget, currency)} -> ${formatCurrency(winner.dailyBudget, currency)}/day).`,
        savingsOrRevenueImpact: totalFreedDailyBudget * 30,
        badgeText: 'BUDGET BOOST',
        badgeColor: 'emerald',
      });
    }
  }

  return {
    updatedAds,
    actionLogs,
    totalFreedDailyBudget,
    reallocatedTo,
  };
}

export function calculateWaterfallSpend(ads: AdSet[]): WaterfallSpendBreakdown {
  const totalSpend = ads.reduce((acc, ad) => acc + ad.spend, 0);

  let productiveSpend = 0;
  let autofillLeak = 0;
  let cheapCplTrapLeak = 0;
  let ghostLeadLeak = 0;

  for (const ad of ads) {
    if (ad.realizedPipeline > 0 || ad.junkRate < 45) {
      productiveSpend += ad.spend;
    } else if (ad.autofillRisk >= 75) {
      autofillLeak += ad.spend;
    } else if (ad.junkRate >= 80 && ad.qualifiedLeads <= 3) {
      cheapCplTrapLeak += ad.spend;
    } else {
      ghostLeadLeak += ad.spend;
    }
  }

  // Ensure balance matches totalSpend
  const allocated = productiveSpend + autofillLeak + cheapCplTrapLeak + ghostLeadLeak;
  if (allocated !== totalSpend && ads.length > 0) {
    ghostLeadLeak += (totalSpend - allocated);
  }

  return {
    totalSpend,
    productiveSpend: Math.max(0, productiveSpend),
    autofillLeak: Math.max(0, autofillLeak),
    cheapCplTrapLeak: Math.max(0, cheapCplTrapLeak),
    ghostLeadLeak: Math.max(0, ghostLeadLeak),
  };
}

export function calculateDay1PredictiveValue(
  intentScore: number,
  avgDealSize: number,
  telemetryScore: number
): { predictedCloseRate: number; day1SyntheticValue: number; rationale: string } {
  // Probability is a function of intentScore (0-100) and telemetry (human typing duration)
  const baseProb = intentScore / 100;
  const telemetryWeight = telemetryScore >= 70 ? 1.0 : telemetryScore >= 40 ? 0.6 : 0.1;
  const finalProb = Math.min(0.95, Math.max(0.01, baseProb * telemetryWeight));
  const syntheticVal = Math.round(finalProb * avgDealSize);

  return {
    predictedCloseRate: Math.round(finalProb * 100),
    day1SyntheticValue: syntheticVal,
    rationale: `Computed Day-1 predictive close value for 7-Day CAPI attribution: (${(finalProb * 100).toFixed(0)}% Close Prob × ${avgDealSize} avg deal size).`,
  };
}

export function parseAdsCsv(csvContent: string): { ads: AdSet[]; errors: string[] } {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const ads: AdSet[] = [];
  const errors: string[] = [];

  if (lines.length < 2) {
    return { ads: [], errors: ['CSV contains no data rows. Must contain header + data rows.'] };
  }

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));

  const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('campaign') || h.includes('ad'));
  const spendIdx = headers.findIndex((h) => h.includes('spend') || h.includes('cost'));
  const rawIdx = headers.findIndex((h) => h.includes('lead') || h.includes('raw'));
  const qualIdx = headers.findIndex((h) => h.includes('qual') || h.includes('verified'));
  const budgetIdx = headers.findIndex((h) => h.includes('budget') || h.includes('daily'));

  for (let i = 1; i < lines.length; i++) {
    const rawCols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    if (rawCols.length < 3) continue;

    const name = nameIdx >= 0 && rawCols[nameIdx] ? rawCols[nameIdx] : `Campaign_Row_${i}`;
    const spend = spendIdx >= 0 ? parseFloat(rawCols[spendIdx]) || 1000 : 5000;
    const rawLeads = rawIdx >= 0 ? parseInt(rawCols[rawIdx], 10) || 10 : 20;
    const qualifiedLeads = qualIdx >= 0 ? parseInt(rawCols[qualIdx], 10) || 1 : Math.round(rawLeads * 0.1);
    const dailyBudget = budgetIdx >= 0 ? parseFloat(rawCols[budgetIdx]) || Math.round(spend / 15) : Math.round(spend / 15);

    const junkRate = rawLeads > 0 ? Math.min(100, Math.max(0, ((rawLeads - qualifiedLeads) / rawLeads) * 100)) : 0;
    const isBleeder = junkRate >= 80;

    ads.push({
      id: `csv_ad_${i}_${Date.now().toString(36)}`,
      name,
      platform: name.toLowerCase().includes('google') ? 'Google Ads' : 'Meta Ads',
      headline: `Uploaded Creative: ${name}`,
      spend,
      rawLeads,
      qualifiedLeads,
      junkRate,
      realizedPipeline: isBleeder ? 0 : qualifiedLeads * (spend * 0.8),
      dailyBudget: Math.max(10, dailyBudget),
      status: isBleeder ? 'CRITICAL BLEEDER' : 'HEALTHY PERFORMER',
      isPaused: false,
      killCounter: isBleeder ? 4 : 0,
      targetAudience: 'Imported Audience from CSV',
      creativeType: 'Reels Video',
      learningPhase: 'LEARNING',
      learningEvents: { current: Math.min(48, qualifiedLeads * 3), target: 50 },
      autofillRisk: isBleeder ? 85 : 12,
    });
  }

  return { ads, errors };
}

export function buildCapiPayload(
  lead: { name: string; phone: string; clickId: string; intentScore: number },
  ad: { id: string; name: string },
  eventType: 'Qualified_Lead' | 'Purchase' | 'Lead_Blocked',
  value: number,
  currency: Currency,
  telemetry?: { formDurationSec: number; keystrokes: number }
) {
  const timestamp = Math.floor(Date.now() / 1000);
  const hashPhone = `sha256_${lead.phone.replace(/\D/g, '').slice(-4)}_mockhash`;
  const isGoogle = lead.clickId.startsWith('gclid_') || lead.clickId.includes('gclid');

  if (isGoogle) {
    return {
      protocol: 'Google Ads Offline Conversion API v17',
      conversion_upload: {
        conversions: [
          {
            gclid: lead.clickId,
            conversion_action: `customers/70912/conversionActions/${eventType === 'Purchase' ? 'deal_closed_won' : 'ai_qualified_lead'}`,
            conversion_date_time: new Date().toISOString(),
            conversion_value: value,
            currency_code: currency,
            user_identifiers: [
              { hashed_phone_number: hashPhone },
            ],
            custom_variables: [
              { conversion_custom_variable: 'leadguard_intent_score', value: String(lead.intentScore) },
              { conversion_custom_variable: 'leadguard_source_ad', value: ad.id },
              { conversion_custom_variable: 'leadguard_telemetry_time_sec', value: String(telemetry?.formDurationSec || 14.2) },
            ],
          },
        ],
        partial_failure: true,
      },
    };
  }

  return {
    protocol: 'Meta Conversions API (Graph API v21.0)',
    endpoint: `https://graph.facebook.com/v21.0/act_48920119/events`,
    payload: {
      data: [
        {
          event_name: eventType,
          event_time: timestamp,
          event_source_url: 'https://leadguard.ai/simulator',
          action_source: 'system_generated',
          user_data: {
            ph: [hashPhone],
            fbc: `fb.1.${timestamp}.${lead.clickId}`,
            client_user_agent: 'LeadGuard-Signal-Conditioner/2.4',
          },
          custom_data: {
            currency: currency,
            value: value,
            content_name: ad.name,
            leadguard_score: lead.intentScore,
            signal_firewall_status: eventType === 'Lead_Blocked' ? 'SUPPRESSED_JUNK' : 'VERIFIED_HIGH_INTENT',
            ad_id: ad.id,
            predictive_close_attribution: 'Day-1 Instant Predictive CAPI Engine',
            telemetry_submission_time_sec: telemetry?.formDurationSec || 14.2,
          },
        },
      ],
      test_event_code: 'TEST48920',
    },
  };
}
