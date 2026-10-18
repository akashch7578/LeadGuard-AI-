import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Bot,
  Copy,
  Check,
  PhoneCall,
  CheckCircle2,
  Code,
  Zap,
  Clock,
  Keyboard,
  Globe,
  Smartphone,
  TrendingUp,
} from 'lucide-react';
import { Currency, Industry, buildCapiPayload } from '../utils/stopLossEngine';
import { CurrencyDisplay, RupeeIcon } from './CurrencyDisplay';
import { INDUSTRY_CONFIGS } from '../data/industryData';
import { SignalPipelineVisualizer } from './SignalPipelineVisualizer';

interface SimulatorTabProps {
  selectedIndustry: Industry;
  currency: Currency;
}

interface ChatMessage {
  id: string;
  sender: 'lead' | 'ai';
  text: string;
  timestamp: string;
}

interface SignalEvaluation {
  intentScore: number;
  extractedBudget: string;
  extractedTimeline: string;
  requirement: string;
  leadStatus: 'qualified' | 'junk' | 'evaluating';
  reasoning: string;
  phoneVerified: boolean;
  otpStatus: 'VERIFIED' | 'PENDING' | 'INVALID';
  recommendedPixelAction: 'FIRE_CAPI' | 'BLOCK' | 'HOLD';
  syntheticConversionValue: number;
  predictedCloseProbability: number;
  day1PredictiveCapiValue: number;
  telemetryVerdict: 'HUMAN_DELIBERATION' | 'SUSPICIOUS_AUTOFILL' | 'BOT_FARM';
}

interface TelemetryMetrics {
  formDurationSec: number;
  keystrokes: number;
  ipReputationScore: number;
  ipType: string;
  whatsappAccountStatus: string;
  isAutofill: boolean;
}

export const SimulatorTab: React.FC<SimulatorTabProps> = ({ selectedIndustry, currency }) => {
  const config = INDUSTRY_CONFIGS[selectedIndustry];
  const defaultAd = config.adsINR[0];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: `Hello! Welcome to ${config.whatsappBrandTitle}. To ensure we connect you with the appropriate director, could you share your budget range and target timeline?`,
      timestamp: '12:04 PM',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [activePayloadTab, setActivePayloadTab] = useState<'meta' | 'google'>('meta');

  // Behavioral Telemetry State (V2.0 Upgrade 2)
  const [telemetry, setTelemetry] = useState<TelemetryMetrics>({
    formDurationSec: 18.4,
    keystrokes: 42,
    ipReputationScore: 94,
    ipType: 'Residential Fiber (Airtel Broadband)',
    whatsappAccountStatus: 'Active WhatsApp Profile (Photo & Status Verified)',
    isAutofill: false,
  });

  const [signalEvaluation, setSignalEvaluation] = useState<SignalEvaluation>({
    intentScore: 50,
    extractedBudget: 'Awaiting buyer confirmation',
    extractedTimeline: 'Evaluating',
    requirement: config.tagline,
    leadStatus: 'evaluating',
    reasoning: 'Conversation initiated. Waiting for qualification hurdles.',
    phoneVerified: true,
    otpStatus: 'PENDING',
    recommendedPixelAction: 'HOLD',
    syntheticConversionValue: currency === 'USD' ? 120 : 8000,
    predictedCloseProbability: 35,
    day1PredictiveCapiValue: currency === 'USD' ? 175 : 17500,
    telemetryVerdict: 'HUMAN_DELIBERATION',
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendLeadMessage = async (userText: string, forcedTelemetry?: Partial<TelemetryMetrics>) => {
    if (!userText.trim() || isLoading) return;

    const currentTelemetry = { ...telemetry, ...forcedTelemetry };
    if (forcedTelemetry) {
      setTelemetry(currentTelemetry);
    }

    const userMsg: ChatMessage = {
      id: `lead_${Date.now()}`,
      sender: 'lead',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const payloadMessages = [...messages, userMsg].map((m) => ({
        role: m.sender === 'lead' ? 'user' : 'assistant',
        content: m.text,
      }));

      const response = await fetch('/api/gemini/qualify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          industry: selectedIndustry,
          currency,
          adContext: {
            adName: defaultAd.name,
            adId: defaultAd.id,
            clickId: 'fbclid_IwAR3x9kL4mOpQ8_leadguard_sim',
          },
          telemetry: currentTelemetry,
        }),
      });

      const data = await response.json();

      if (data && data.whatsappReply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            sender: 'ai',
            text: data.whatsappReply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        setSignalEvaluation({
          intentScore: data.intentScore ?? 50,
          extractedBudget: data.extractedBudget || 'N/A',
          extractedTimeline: data.extractedTimeline || 'N/A',
          requirement: data.requirement || 'N/A',
          leadStatus: data.leadStatus || 'evaluating',
          reasoning: data.reasoning || '',
          phoneVerified: data.phoneVerified ?? true,
          otpStatus: data.otpStatus || 'PENDING',
          recommendedPixelAction: data.recommendedPixelAction || 'HOLD',
          syntheticConversionValue: data.syntheticConversionValue || (currency === 'USD' ? 150 : 10000),
          predictedCloseProbability: data.predictedCloseProbability ?? (data.intentScore >= 70 ? 82 : 5),
          day1PredictiveCapiValue: data.day1PredictiveCapiValue ?? (data.intentScore >= 70 ? (currency === 'USD' ? 4100 : 205000) : 0),
          telemetryVerdict: data.telemetryVerdict || (currentTelemetry.isAutofill ? 'SUSPICIOUS_AUTOFILL' : 'HUMAN_DELIBERATION'),
        });
      }
    } catch (err) {
      console.error('Failed to qualify lead via Gemini:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateJunk = () => {
    sendLeadMessage(config.sampleJunkPrompt, {
      formDurationSec: 1.1,
      keystrokes: 0,
      ipReputationScore: 22,
      ipType: 'Datacenter / Known Bot Proxy ASN',
      whatsappAccountStatus: 'Unregistered Number / Inactive Burner SIM',
      isAutofill: true,
    });
  };

  const handleSimulateHighIntent = () => {
    sendLeadMessage(config.sampleHighIntentPrompt, {
      formDurationSec: 26.5,
      keystrokes: 58,
      ipReputationScore: 98,
      ipType: 'Residential Static IP (Verified Enterprise ISP)',
      whatsappAccountStatus: 'Active Business Profile (Verified DP & About)',
      isAutofill: false,
    });
  };

  const sampleLead = {
    name: 'Ananya Sharma',
    phone: '+91 98201 99120',
    clickId: activePayloadTab === 'meta' ? 'fbclid_IwAR3x9kL4mOpQ8_leadguard_sim' : 'gclid_Cj0KCQjwmv8xBhCPARIsA',
    intentScore: signalEvaluation.intentScore,
  };

  const currentPayload = buildCapiPayload(
    sampleLead,
    { id: defaultAd.id, name: defaultAd.name },
    signalEvaluation.intentScore >= 60 ? 'Qualified_Lead' : 'Lead_Blocked',
    signalEvaluation.day1PredictiveCapiValue || signalEvaluation.syntheticConversionValue,
    currency,
    { formDurationSec: telemetry.formDurationSec, keystrokes: telemetry.keystrokes }
  );

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(currentPayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-[#111827] to-indigo-950/60 border border-indigo-500/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              Behavioral Telemetry & "7-Day CAPI Clock" Predictor (v2.0)
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-900/60 text-indigo-300 border border-indigo-700 font-semibold">
              PRE-PIXEL SIGNAL CONDITIONER
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Detects the <strong className="text-white">Meta Autofill Trap</strong> (&lt;2s submissions with zero keystrokes).
            Solves Meta's 7-day attribution blindness by firing an instant <strong>Day-1 Synthetic Predictive CAPI Value</strong> based on close probability.
          </p>
        </div>

        {/* Demo Quick Test Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSimulateJunk}
            disabled={isLoading}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-950/80 hover:bg-red-900/80 text-red-200 border border-red-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <Bot className="w-3.5 h-3.5 text-red-400" />
            <span>🤖 Simulate Junk + Autofill Trap</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateHighIntent}
            disabled={isLoading}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>💎 Simulate High-Intent Buyer Lead</span>
          </button>
        </div>
      </div>

      {/* Live Pipeline Flow Visualizer */}
      <SignalPipelineVisualizer
        lastEvent={
          signalEvaluation.recommendedPixelAction === 'FIRE_CAPI'
            ? { type: 'FIRED', label: 'CAPI Qualified Lead Signal Emitted', timestamp: 'Just now' }
            : signalEvaluation.recommendedPixelAction === 'BLOCK'
            ? { type: 'BLOCKED', label: 'Pixel Starvation: Blocked Autofill / Junk Lead', timestamp: 'Just now' }
            : undefined
        }
      />

      {/* Split Screen Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: WhatsApp Chat Simulator (5 cols) */}
        <div className="lg:col-span-5 bg-[#0B0F19] border border-[#1E293B] rounded-xl overflow-hidden flex flex-col h-[700px] shadow-lg">
          {/* Captured Ad Attribution Header */}
          <div className="bg-[#111827] border-b border-[#1E293B] px-4 py-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2 truncate">
              <span className="text-indigo-400 font-bold">INCOMING AD CLICK:</span>
              <span className="text-slate-300 truncate">{defaultAd.name}</span>
            </div>
            <div className="shrink-0 flex items-center gap-1.5">
              <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">fbclid: IwAR3x9kL4...</span>
            </div>
          </div>

          {/* WhatsApp Header Bar */}
          <div className="bg-[#162238] border-b border-[#1E293B] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-lg shadow-sm">
                {config.whatsappAvatarEmoji}
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{config.whatsappBrandTitle}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LeadGuard AI Verified Business Desk
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="p-2 rounded-full bg-slate-800/60 border border-slate-700">
                <PhoneCall className="w-3.5 h-3.5 text-slate-300" />
              </span>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#070A12] bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="text-center my-2">
              <span className="text-[10px] text-slate-400 bg-[#111827] px-3 py-1 rounded-md border border-[#1E293B]">
                🔒 Signal intercept active: Pixel fired ONLY after intent qualification
              </span>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'lead' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${
                    msg.sender === 'lead'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-[#172136] text-slate-200 border border-[#22304d] rounded-bl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                      msg.sender === 'lead' ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    <span>✓✓</span>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 bg-[#172136] border border-[#22304d] rounded-2xl rounded-bl-none px-4 py-2 max-w-[120px]">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendLeadMessage(inputMessage);
            }}
            className="p-3 bg-[#111827] border-t border-[#1E293B] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type message as lead (e.g. state budget, timeline, or request discount)..."
              disabled={isLoading}
              className="flex-1 bg-[#0B0F19] border border-[#1E293B] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Send WhatsApp message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* RIGHT PANEL: Behavioral Telemetry & Predictive CAPI Firewall (7 cols) */}
        <div className="lg:col-span-7 bg-[#111827] border border-[#1E293B] rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  CAPI Signal Firewall & Behavioral Telemetry
                </h3>
              </div>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#0B0F19] text-indigo-300 border border-[#1E293B]">
                Active Quarantine
              </span>
            </div>

            {/* UPGRADE 2.1: PRE-CLICK & FORM BEHAVIORAL TELEMETRY CARD */}
            <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 font-mono">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  PRE-CLICK & FORM TELEMETRY RADAR
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    telemetry.isAutofill
                      ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}
                >
                  {telemetry.isAutofill ? '⚠️ ACCIDENTAL AUTOFILL TRAP' : '✓ HUMAN TYPING VERIFIED'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {/* Duration */}
                <div className="bg-[#111827] p-2 rounded border border-[#1E293B]">
                  <span className="text-[10px] text-slate-500 block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Form Duration:
                  </span>
                  <span className={`font-bold ${telemetry.formDurationSec < 2.0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {telemetry.formDurationSec}s
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    {telemetry.formDurationSec < 2.0 ? 'Instant Tap' : 'Deliberate'}
                  </span>
                </div>

                {/* Keystrokes */}
                <div className="bg-[#111827] p-2 rounded border border-[#1E293B]">
                  <span className="text-[10px] text-slate-500 block flex items-center gap-1">
                    <Keyboard className="w-3 h-3 text-slate-400" />
                    Keystrokes:
                  </span>
                  <span className={`font-bold ${telemetry.keystrokes === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {telemetry.keystrokes} Keys
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    {telemetry.keystrokes === 0 ? '0 Typed' : 'Organic'}
                  </span>
                </div>

                {/* IP Reputation */}
                <div className="bg-[#111827] p-2 rounded border border-[#1E293B]">
                  <span className="text-[10px] text-slate-500 block flex items-center gap-1">
                    <Globe className="w-3 h-3 text-slate-400" />
                    IP Trust Score:
                  </span>
                  <span className={`font-bold ${telemetry.ipReputationScore < 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {telemetry.ipReputationScore}/100
                  </span>
                  <span className="text-[9px] text-slate-500 block truncate" title={telemetry.ipType}>
                    {telemetry.ipReputationScore < 50 ? 'Datacenter' : 'Residential'}
                  </span>
                </div>

                {/* WhatsApp Status */}
                <div className="bg-[#111827] p-2 rounded border border-[#1E293B]">
                  <span className="text-[10px] text-slate-500 block flex items-center gap-1">
                    <PhoneCall className="w-3 h-3 text-slate-400" />
                    WA Profile:
                  </span>
                  <span className={`font-bold ${telemetry.isAutofill ? 'text-red-400' : 'text-emerald-400'}`}>
                    {telemetry.isAutofill ? 'Burner' : 'Verified'}
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    {telemetry.isAutofill ? 'No Pic' : 'Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* UPGRADE 2.2: 7-DAY ATTRIBUTION WINDOW PREDICTIVE VALUE CALCULATOR */}
            <div className="bg-gradient-to-r from-emerald-950/20 via-[#0B0F19] to-indigo-950/20 border border-emerald-800/40 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  7-DAY ATTRIBUTION WINDOW PREDICTIVE CAPI VALUE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                  SOLVES 30-DAY SALES LAG
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                High-ticket deals take 30+ days to close, completely missing Meta & Google's 7-day conversion window.
                LeadGuard computes a <strong>Day-1 Synthetic Value</strong> ({signalEvaluation.predictedCloseProbability}% close probability × average deal size) to feed the algorithm within 5 minutes of ad click!
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1 text-xs font-mono">
                <div className="bg-[#111827] p-2.5 rounded border border-[#1E293B] flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Predicted 30-Day Close Prob:</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {signalEvaluation.predictedCloseProbability}%
                  </span>
                </div>
                <div className="bg-[#111827] p-2.5 rounded border border-[#1E293B] flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Instant Day-1 CAPI Value:</span>
                  <span className="text-sm font-bold text-white">
                    <CurrencyDisplay amount={signalEvaluation.day1PredictiveCapiValue} currency={currency} />
                  </span>
                </div>
              </div>
            </div>

            {/* Score Gauge & Status Header */}
            <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Lead Intent Score</div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span
                      className={`text-3xl font-extrabold font-mono ${
                        signalEvaluation.intentScore >= 70
                          ? 'text-emerald-400'
                          : signalEvaluation.intentScore >= 45
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}
                    >
                      {signalEvaluation.intentScore}
                    </span>
                    <span className="text-slate-400 text-sm font-mono">/ 100</span>
                    <span
                      className={`text-xs font-mono font-bold uppercase px-2 py-0.5 rounded ml-2 ${
                        signalEvaluation.intentScore >= 70
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : signalEvaluation.intentScore >= 45
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-red-950 text-red-300 border border-red-800'
                      }`}
                    >
                      {signalEvaluation.leadStatus}
                    </span>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-[#1E293B] sm:pl-4">
                  <div className="text-[11px] text-slate-400 font-mono">OTP Phone Status:</div>
                  <div className="flex items-center gap-1.5 mt-1 font-mono text-xs">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        signalEvaluation.otpStatus === 'VERIFIED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : signalEvaluation.otpStatus === 'PENDING'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}
                    >
                      OTP: {signalEvaluation.otpStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      signalEvaluation.intentScore >= 70
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                        : signalEvaluation.intentScore >= 45
                        ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                        : 'bg-gradient-to-r from-red-600 to-red-500'
                    }`}
                    style={{ width: `${signalEvaluation.intentScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* CONDITIONAL PIXEL DECISION BOX */}
            {signalEvaluation.intentScore < 60 ? (
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-800/60 text-red-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-red-400 text-sm">
                  <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
                  <span>🚫 PIXEL SIGNAL BLOCKED (CAPI SUPPRESSED)</span>
                </div>
                <p className="text-xs text-red-200/90 leading-relaxed">
                  Meta & Google will receive <strong className="text-white">0 conversion credit</strong> for Ad ID{' '}
                  <span className="font-mono text-white underline">{defaultAd.id}</span>.
                  The algorithmic feedback loop is severed, starving this bleeder ad placement of future budget.
                </p>
                <div className="text-[11px] font-mono text-red-300/80 bg-red-950/60 px-2 py-1 rounded border border-red-900/60">
                  Reason: {signalEvaluation.reasoning}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>✅ CAPI QUALIFIED_LEAD EVENT FIRED</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-white bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-700">
                    Predictive Value: <CurrencyDisplay amount={signalEvaluation.day1PredictiveCapiValue} currency={currency} />
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  Ad algorithm credited with a verified high-LTV conversion event. Lookalike audiences will now optimize for qualified buyers with confirmed budget.
                </p>
                <div className="text-[11px] font-mono text-emerald-300/80 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-900/60">
                  Signal Logic: {signalEvaluation.reasoning}
                </div>
              </div>
            )}
          </div>

          {/* CAPI JSON Payload Inspector */}
          <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-[#162032] border-b border-[#1E293B] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                <button
                  type="button"
                  onClick={() => setActivePayloadTab('meta')}
                  className={`px-2 py-1 rounded font-mono text-xs transition-colors cursor-pointer ${
                    activePayloadTab === 'meta'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Meta CAPI (Graph API v21.0)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePayloadTab('google')}
                  className={`px-2 py-1 rounded font-mono text-xs transition-colors cursor-pointer ${
                    activePayloadTab === 'google'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Google Ads Offline v17 (gclid)
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyPayload}
                className="flex items-center gap-1 text-[11px] font-mono text-slate-300 hover:text-white bg-slate-800 px-2 py-1 rounded transition-colors cursor-pointer"
              >
                {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPayload ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-36 bg-[#070A12]">
              <pre>{JSON.stringify(currentPayload, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
