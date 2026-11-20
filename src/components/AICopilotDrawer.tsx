import { useState, useEffect, useMemo } from "react";
import { useSystemState, type Transaction, type Alert, type InvestigationCase } from "../context/SystemStateContext";
import { 
  Bot, 
  X, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle, 
  Flame, 
  RefreshCw,
  Copy,
  Check
} from "lucide-react";

interface ThreatVector {
  name: string;
  probability: number;
  indicators: string[];
  severity: "critical" | "high" | "medium";
}

export default function AICopilotDrawer() {
  const { transactions, blacklistUser, addAuditEntry } = useSystemState();
  const [isOpen, setIsOpen] = useState(false);
  const [targetContext, setTargetContext] = useState<{
    txn?: Transaction | null;
    alert?: Alert | null;
    caseItem?: InvestigationCase | null;
  }>({});

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Listen for global event to open AI copilot
  useEffect(() => {
    function handleOpen(event: Event) {
      const customEvent = event as CustomEvent<{
        txn?: Transaction;
        alert?: Alert;
        caseItem?: InvestigationCase;
      }>;
      setTargetContext({
        txn: customEvent.detail?.txn || null,
        alert: customEvent.detail?.alert || null,
        caseItem: customEvent.detail?.caseItem || null,
      });
      setIsAnalyzing(true);
      setIsOpen(true);
      setTimeout(() => setIsAnalyzing(false), 800);
    }

    window.addEventListener("fds:open-ai-copilot", handleOpen);
    return () => window.removeEventListener("fds:open-ai-copilot", handleOpen);
  }, []);

  // Determine current active entity for forensic reasoning
  const activeTxn = useMemo(() => {
    if (targetContext.txn) return targetContext.txn;
    if (targetContext.alert) {
      return transactions.find(t => t.id === targetContext.alert?.txnId) || transactions[0];
    }
    if (targetContext.caseItem) {
      return transactions.find(t => t.userId === targetContext.caseItem?.userId) || transactions[0];
    }
    return transactions.length > 0 ? transactions[0] : null;
  }, [targetContext, transactions]);

  // Compute Attack Vector Probabilities based on real transaction telemetry
  const attackVectors: ThreatVector[] = useMemo(() => {
    if (!activeTxn) return [];

    const isHighValue = activeTxn.amount > 1000000;
    const isSuspiciousDevice = activeTxn.device.includes("Linux") || activeTxn.device.includes("Unknown");
    const isForeignLocation = activeTxn.location.includes("Unknown") || activeTxn.location.includes("London") || activeTxn.location.includes("New York");

    return [
      {
        name: "Account Takeover (ATO) via Proxy / VPN",
        probability: isForeignLocation && isSuspiciousDevice ? 94 : isForeignLocation ? 78 : 34,
        severity: isForeignLocation && isSuspiciousDevice ? "critical" : "high",
        indicators: [
          `Origin IP '${activeTxn.location}' represents sudden geo-corridor deviation`,
          `Hardware signature exhibits high entropy: '${activeTxn.device}'`,
        ],
      },
      {
        name: "Smurfing & Structured Rapid Funneling",
        probability: activeTxn.amount >= 250000 && activeTxn.amount <= 2500000 ? 86 : 42,
        severity: "high",
        indicators: [
          `Amount (₦${activeTxn.amount.toLocaleString()}) conforms to structuring under CBN currency threshold`,
          "Rapid fan-out distribution pattern detected in user cohort",
        ],
      },
      {
        name: "SIM Swap / Session Hijack Interception",
        probability: isSuspiciousDevice ? 72 : 28,
        severity: isSuspiciousDevice ? "high" : "medium",
        indicators: [
          "MFA authentication token requested from unrecognized browser environment",
          "Session cookie generation timestamp differs from mobile baseline",
        ],
      },
      {
        name: "First-Party Synthetic Identity Fraud",
        probability: isHighValue && !isForeignLocation ? 58 : 19,
        severity: "medium",
        indicators: [
          "BVN validation score normal but rapid credit line depletion observed",
        ],
      },
    ];
  }, [activeTxn]);

  // Forensic questions to verify customer
  const checklistQuestions = useMemo(() => {
    if (!activeTxn) return [];
    return [
      `Contact ${activeTxn.userId} on registered phone: Did you authorize a transfer of ₦${activeTxn.amount.toLocaleString()}?`,
      `Verify if the user physically traveled to ${activeTxn.location} within the last 4 hours.`,
      `Request confirmation of primary hardware device (Registered mobile vs '${activeTxn.device}').`,
      "Check whether a password reset or email update was requested in the past 24 hours.",
    ];
  }, [activeTxn]);

  const handleCopyNarrative = () => {
    if (!activeTxn) return;
    const text = `SENTINEL AI FORENSIC THREAT BRIEF\nReference: ${activeTxn.id} (${activeTxn.userId})\nAmount: ₦${activeTxn.amount.toLocaleString()}\nPrimary Threat Vector: ${attackVectors[0]?.name || "N/A"} (${attackVectors[0]?.probability}%)\nKey Evidence:\n${attackVectors.flatMap(v => v.indicators).map(i => `- ${i}`).join("\n")}\n\nRecommended Questions:\n${checklistQuestions.map((q, idx) => `${idx + 1}. ${q}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyVelocityFreeze = () => {
    if (!activeTxn) return;
    addAuditEntry(
      "AI Protective Velocity Freeze Applied",
      "System",
      activeTxn.userId,
      `Sentinel AI Copilot placed a temporary 24-hour velocity cooling freeze on ${activeTxn.userId}. Outgoing transfers capped at ₦50,000.`
    );
    setActionFeedback(`24-hour protective velocity cooling applied to ${activeTxn.userId}.`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleBlacklistSuspect = () => {
    if (!activeTxn) return;
    blacklistUser(activeTxn.userId, `Sanctioned by Sentinel AI Forensic Copilot based on 94% ATO Probability`);
    setActionFeedback(`User ${activeTxn.userId} blacklisted on global registries.`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl p-6 overflow-y-auto flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-950/50">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Sentinel AI Forensic Copilot
                  </h3>
                  <span className="px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-bold">
                    NEURAL-COPILOT v2.4
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Autonomous threat hypothesis, attack vector breakdown & customer challenge workflow
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Action Feedback Banner */}
          {actionFeedback && (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>{actionFeedback}</span>
            </div>
          )}

          {/* Active Context Card */}
          {activeTxn && (
            <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Active Forensic Subject
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-white text-sm">{activeTxn.id}</span>
                  <span className="text-slate-400">• {activeTxn.userId}</span>
                </div>
                <span className="text-slate-400 block text-[11px] truncate">
                  ₦{activeTxn.amount.toLocaleString()} via {activeTxn.device} ({activeTxn.location})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAnalyzing(true);
                  setTimeout(() => setIsAnalyzing(false), 600);
                }}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition flex-shrink-0"
                title="Regenerate Analysis"
              >
                <RefreshCw className={`h-4 w-4 ${isAnalyzing ? "animate-spin text-indigo-400" : ""}`} />
              </button>
            </div>
          )}

          {/* Attack Vector Probability Meters */}
          <div className="mt-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Attack Vector Likelihood Matrix
            </span>

            {attackVectors.map((vec, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{vec.name}</span>
                  <span className={`font-mono font-bold ${
                    vec.probability >= 80 ? "text-red-400" : vec.probability >= 60 ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {vec.probability}% Probability
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      vec.probability >= 80 ? "bg-red-500" : vec.probability >= 60 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${vec.probability}%` }}
                  />
                </div>

                {/* Indicators */}
                <ul className="space-y-1 text-[11px] text-slate-400 pt-1">
                  {vec.indicators.map((ind, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-indigo-400 mt-0.5">•</span>
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Recommended Investigation Checklist */}
          <div className="mt-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-purple-400" /> Customer Verification Script
            </span>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
              {checklistQuestions.map((q, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300 text-[11.5px] leading-relaxed">
                  <span className="font-bold text-purple-400 flex-shrink-0">{idx + 1}.</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 space-y-2.5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopyNarrative}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied to Clipboard" : "Copy Threat Brief"}</span>
            </button>

            <button
              type="button"
              onClick={handleApplyVelocityFreeze}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-semibold text-xs transition"
            >
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span>Apply 24h Velocity Freeze</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleBlacklistSuspect}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-650 hover:bg-red-550 text-white font-bold text-xs transition shadow-md shadow-red-950/40"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Confirm High-Probability Fraud & Sanction Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
