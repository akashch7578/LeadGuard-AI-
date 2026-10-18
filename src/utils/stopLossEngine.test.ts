import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMetrics,
  evaluateStopLoss,
  runStopLossSweep,
  formatCurrency,
  buildCapiPayload,
  calculateWaterfallSpend,
  calculateDay1PredictiveValue,
  parseAdsCsv,
} from './stopLossEngine.ts';
import type { AdSet, StopLossRules } from './stopLossEngine.ts';

const mockAds: AdSet[] = [
  {
    id: 'ad_1',
    name: 'Reel_Hook_Discount_V1',
    platform: 'Meta Ads',
    headline: '50% OFF Flash Sale',
    spend: 42000,
    rawLeads: 210,
    qualifiedLeads: 2,
    junkRate: 99.0,
    realizedPipeline: 0,
    dailyBudget: 3000,
    status: 'CRITICAL BLEEDER',
    isPaused: false,
    killCounter: 12,
    targetAudience: 'Broad 18-65',
    creativeType: 'Reels Video',
    learningPhase: 'LEARNING',
    learningEvents: { current: 32, target: 50 },
    autofillRisk: 92,
  },
  {
    id: 'ad_2',
    name: 'Founder_Authority_CaseStudy_V3',
    platform: 'Meta Ads',
    headline: 'Case Study Breakdown',
    spend: 18000,
    rawLeads: 36,
    qualifiedLeads: 24,
    junkRate: 33.3,
    realizedPipeline: 360000,
    dailyBudget: 1500,
    status: 'HIGH-INTENT WINNER',
    isPaused: false,
    killCounter: 0,
    targetAudience: 'Decision Makers',
    creativeType: 'Founder Video',
    learningPhase: 'ACTIVE',
    learningEvents: { current: 50, target: 50 },
    autofillRisk: 4,
  },
];

const mockRules: StopLossRules = {
  ruleA_enabled: true,
  ruleA_spendThreshold: 3000,
  ruleB_enabled: true,
  ruleB_minRawLeads: 15,
  ruleB_junkRateThreshold: 80,
  ruleC_autoReallocate: true,
  learningPhaseSafeMode: true,
  qualificationLagGraceHours: 12,
};

test('formatCurrency handles INR and USD appropriately', () => {
  assert.equal(formatCurrency(42000, 'INR'), '₹42,000');
  assert.equal(formatCurrency(360000, 'INR', true), '₹3.6L');
  assert.equal(formatCurrency(500, 'USD'), '$500');
  assert.equal(formatCurrency(4500, 'USD', true), '$4.5k');
});

test('Learning-Phase Safe Mode applies 15% throttle instead of hard-pausing learning ad', () => {
  // ad_1 is in LEARNING phase with safe mode ON
  const evaluation = evaluateStopLoss(mockAds[0], mockRules);
  assert.equal(evaluation.shouldPause, false);
  assert.equal(evaluation.shouldThrottle, true);
  assert.equal(evaluation.ruleType, 'SAFE_MODE_THROTTLE');
});

test('When Safe Mode is OFF, ad is hard paused as bleeder', () => {
  const hardRules: StopLossRules = { ...mockRules, learningPhaseSafeMode: false };
  const evaluation = evaluateStopLoss(mockAds[0], hardRules);
  assert.equal(evaluation.shouldPause, true);
  assert.equal(evaluation.shouldThrottle, false);
  assert.equal(evaluation.ruleType, 'RULE_B_JUNK_GUARD');
});

test('calculateWaterfallSpend segments spend accurately', () => {
  const waterfall = calculateWaterfallSpend(mockAds);
  assert.equal(waterfall.totalSpend, 60000);
  assert.equal(waterfall.productiveSpend, 18000); // ad_2
  assert.equal(waterfall.autofillLeak, 42000); // ad_1 with 92% autofill risk
});

test('calculateDay1PredictiveValue computes 7-day predictive attribution', () => {
  const res = calculateDay1PredictiveValue(90, 200000, 95);
  assert.ok(res.predictedCloseRate > 50);
  assert.ok(res.day1SyntheticValue > 100000);
});

test('parseAdsCsv parses CSV strings into valid AdSet records', () => {
  const csv = `Campaign Name,Spend,Raw Leads,Qualified Leads,Daily Budget\n"Summer_Reel_Promo",12000,100,3,1000\n"Executive_Webinar",8000,20,15,800`;
  const result = parseAdsCsv(csv);
  assert.equal(result.errors.length, 0);
  assert.equal(result.ads.length, 2);
  assert.equal(result.ads[0].spend, 12000);
  assert.equal(result.ads[0].status, 'CRITICAL BLEEDER');
  assert.equal(result.ads[1].status, 'HEALTHY PERFORMER');
});
