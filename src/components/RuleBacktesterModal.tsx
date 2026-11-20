import { useState, useMemo } from "react";
import { useSystemState, type FraudRule } from "../context/SystemStateContext";
import { 
  FlaskConical, 
  X, 
  CheckCircle2, 
  Sliders, 
  TrendingUp, 
  Check
} from "lucide-react";

interface RuleBacktesterModalProps {
  rule: FraudRule | null;
  onClose: () => void;
}

export default function RuleBacktesterModal({ rule, onClose }: RuleBacktesterModalProps) {
  const { transactions, updateRuleThreshold } = useSystemState();

  const [proposedValue, setProposedValue] = useState<string>(() => {
    if (!rule) return "500000";
    return String(rule.parameterValue);
  });

  const [isDeploySuccess, setIsDeploySuccess] = useState(false);

  // Compute Delta between Current Rule vs Proposed Rule
  const backtestResults = useMemo(() => {
    if (!rule) return null;

    const parsedProposed = parseFloat(proposedValue) || 0;
    const currentVal = typeof rule.parameterValue === "number" ? rule.parameterValue : parseFloat(String(rule.parameterValue)) || 0;

    let baselineFlags = 0;
    let baselineVolume = 0;
    let simulatedFlags = 0;
    let simulatedVolume = 0;
    const flippedTxns: { id: string; user: string; amount: number; oldStatus: string; newStatus: string; deltaScore: number }[] = [];

    transactions.forEach(t => {
      // Evaluate current rule condition
      let currentTriggered = false;
      let proposedTriggered = false;

      if (rule.type === "threshold") {
        currentTriggered = t.amount > currentVal;
        proposedTriggered = t.amount > parsedProposed;
      } else if (rule.type === "velocity") {
        // Simulated velocity trigger
        currentTriggered = t.ruleTriggers.includes(rule.id);
        proposedTriggered = t.ruleTriggers.includes(rule.id) || t.amount > 800000;
      } else if (rule.type === "geolocation") {
        const whitelisted = String(proposedValue).split(",");
        currentTriggered = t.ruleTriggers.includes(rule.id);
        proposedTriggered = t.location.includes("Unknown") || (t.location.includes("London") && !whitelisted.includes("GB"));
      } else {
        currentTriggered = t.ruleTriggers.includes(rule.id);
        proposedTriggered = currentTriggered;
      }

      if (currentTriggered) {
        baselineFlags += 1;
        baselineVolume += t.amount;
      }

      if (proposedTriggered) {
        simulatedFlags += 1;
        simulatedVolume += t.amount;
      }

      // Check if status changed
      if (!currentTriggered && proposedTriggered) {
        flippedTxns.push({
          id: t.id,
          user: t.userId,
          amount: t.amount,
          oldStatus: t.status,
          newStatus: "flagged",
          deltaScore: +35,
        });
      } else if (currentTriggered && !proposedTriggered) {
        flippedTxns.push({
          id: t.id,
          user: t.userId,
          amount: t.amount,
          oldStatus: t.status,
          newStatus: "passed",
          deltaScore: -35,
        });
      }
    });

    const netFlagDelta = simulatedFlags - baselineFlags;
    const netVolumeDelta = simulatedVolume - baselineVolume;
    const estimatedPreventedLoss = Math.max(0, netVolumeDelta * 0.45);
    const estimatedFrictionCost = Math.max(0, netFlagDelta * 45000);

    return {
      totalCorpus: transactions.length,
      baselineFlags,
      baselineVolume,
      simulatedFlags,
      simulatedVolume,
      netFlagDelta,
      netVolumeDelta,
      estimatedPreventedLoss,
      estimatedFrictionCost,
      flippedTxns,
    };
  }, [rule, proposedValue, transactions]);

  if (!rule || !backtestResults) return null;

  const handleDeployToProduction = () => {
    const parsed = parseFloat(proposedValue);
    const finalVal = isNaN(parsed) ? proposedValue : parsed;
    updateRuleThreshold(rule.id, finalVal);
    setIsDeploySuccess(true);
    setTimeout(() => {
      setIsDeploySuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden flex flex-col justify-between max-h-[90vh]">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Historic Policy Backtest & Impact Simulator
                  </h3>
                  <span className="px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-bold">
                    CORPUS: {backtestResults.totalCorpus} TXNS
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evaluate threshold modifications against historic transaction data before live deployment
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {isDeploySuccess && (
            <div className="my-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>Policy threshold updated and deployed live into production simulator!</span>
            </div>
          )}

          {/* Target Rule & Proposed Modifier */}
          <div className="my-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <span className="text-slate-400 text-[11px] block">Target Safeguard Rule:</span>
                <span className="font-bold text-white text-sm">{rule.name} ({rule.id})</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-500">Current Threshold:</span>
                <span className="text-slate-300 font-bold px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">
                  {String(rule.parameterValue)}
                </span>
              </div>
            </div>

            {/* Input adjustment */}
            <div className="pt-2 border-t border-slate-850 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <label className="text-slate-300 font-bold flex items-center gap-1.5 whitespace-nowrap">
                <Sliders className="h-3.5 w-3.5 text-indigo-400" /> Proposed Parameter:
              </label>
              <input
                type={rule.type === "threshold" || rule.type === "velocity" ? "number" : "text"}
                value={proposedValue}
                onChange={(e) => setProposedValue(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono outline-none focus:border-indigo-500 text-xs"
              />
              {rule.type === "threshold" && (
                <div className="flex gap-1">
                  {[250000, 500000, 1000000, 2000000].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setProposedValue(String(v))}
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-[10px] font-mono"
                    >
                      ₦{(v / 1000).toLocaleString()}k
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Delta Comparison Scorecards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Flagged Volume</span>
              <span className="text-sm font-bold text-white block mt-0.5">
                ₦{backtestResults.simulatedVolume.toLocaleString()}
              </span>
              <span className={`text-[10px] font-mono font-bold block ${
                backtestResults.netVolumeDelta > 0 ? "text-red-400" : "text-emerald-400"
              }`}>
                {backtestResults.netVolumeDelta >= 0 ? `+₦${backtestResults.netVolumeDelta.toLocaleString()}` : `-₦${Math.abs(backtestResults.netVolumeDelta).toLocaleString()}`}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Triggered Interceptions</span>
              <span className="text-sm font-bold text-white block mt-0.5">
                {backtestResults.simulatedFlags} txns
              </span>
              <span className={`text-[10px] font-mono font-bold block ${
                backtestResults.netFlagDelta >= 0 ? "text-amber-400" : "text-slate-400"
              }`}>
                {backtestResults.netFlagDelta >= 0 ? `+${backtestResults.netFlagDelta} net` : `${backtestResults.netFlagDelta} net`}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/40">
              <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Prevented Fraud Loss</span>
              <span className="text-sm font-bold text-emerald-300 block mt-0.5">
                ₦{backtestResults.estimatedPreventedLoss.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-500 block">Simulated Savings</span>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/40">
              <span className="text-[10px] text-rose-400 uppercase font-semibold block">Friction Cost</span>
              <span className="text-sm font-bold text-rose-300 block mt-0.5">
                ₦{backtestResults.estimatedFrictionCost.toLocaleString()}
              </span>
              <span className="text-[10px] text-rose-500 block">False Positive Review</span>
            </div>
          </div>

          {/* Transactions that Flip Status */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-indigo-400" /> Flipped Transactions Under Proposed Rule ({backtestResults.flippedTxns.length})
            </span>

            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {backtestResults.flippedTxns.length > 0 ? (
                backtestResults.flippedTxns.slice(0, 8).map(tx => (
                  <div
                    key={tx.id}
                    className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-white">{tx.id}</span>
                      <span className="text-slate-400 ml-2">₦{tx.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-400">
                        {tx.oldStatus}
                      </span>
                      <span className="text-slate-500">→</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                        tx.newStatus === "flagged" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-emerald-500/20 text-emerald-300"
                      }`}>
                        {tx.newStatus}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800/60 text-center text-slate-500 text-xs">
                  No historical transactions flipped status under this parameter.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-4 mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDeployToProduction}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-950/50"
          >
            <Check className="h-4 w-4" />
            <span>Deploy Rule Parameter to Production</span>
          </button>
        </div>
      </div>
    </div>
  );
}
