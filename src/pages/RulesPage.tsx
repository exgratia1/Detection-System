import { useState, useMemo } from "react";
import { useSystemState } from "../context/SystemStateContext";
import type { FraudRule } from "../context/SystemStateContext";
import MLModelExplainer from "../components/MLModelExplainer";
import RuleBacktesterModal from "../components/RuleBacktesterModal";
import { 
  ShieldCheck, 
  Settings, 
  Plus, 
  Check, 
  X, 
  Info, 
  Layers, 
  Sliders,
  FlaskConical,
  ShieldAlert,
  Cpu
} from "lucide-react";

export default function RulesPage() {
  const { rules, toggleRule, updateRuleThreshold, createRule, blacklistedUsers, isEmergencyLockdown } = useSystemState();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"rules" | "models">("rules");

  // Local states
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [backtestingRule, setBacktestingRule] = useState<FraudRule | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  
  // Custom ML Model parameters
  const [mlThresholds, setMlThresholds] = useState(() => {
    try {
      const saved = localStorage.getItem("fds_ml_thresholds");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      randomForest: 82,
      xgboost: 75,
      deepNeuralNetwork: 88,
    };
  });
  const [mlSavedToast, setMlSavedToast] = useState(false);

  // Sandbox testing state
  const [sandboxTxn, setSandboxTxn] = useState({
    userId: "user_4910",
    amount: 1850000,
    location: "Unknown IP (VPN)",
    device: "Linux / Unknown User Agent",
  });

  const sandboxEvaluation = useMemo(() => {
    const triggered: { id: string; name: string; reason: string; points: number }[] = [];
    let score = 15; // base nominal risk

    // 1. Emergency lockdown check
    if (isEmergencyLockdown && sandboxTxn.amount >= 250000) {
      triggered.push({
        id: "RULE-SOS-LOCKDOWN",
        name: "Emergency Circuit Breaker Interception",
        reason: "Transaction exceeded ₦250,000 during active DEFCON 1 Emergency Lockdown.",
        points: 99,
      });
      score = 99;
    }

    // 2. Blacklist check
    const isBanned = blacklistedUsers.some((b) => b.userId === sandboxTxn.userId);
    if (isBanned) {
      triggered.push({
        id: "RULE-BLACKLIST",
        name: "Restricted Watchlist Enforcement",
        reason: `Target User ${sandboxTxn.userId} is actively banned across system records.`,
        points: 99,
      });
      score = 99;
    }

    // 3. Rule 1: High-Value Threshold
    const r1 = rules.find((r) => r.id === "RULE-1");
    if (r1?.isActive && sandboxTxn.amount > (r1.parameterValue as number)) {
      triggered.push({
        id: "RULE-1",
        name: r1.name,
        reason: `Amount ₦${sandboxTxn.amount.toLocaleString()} exceeds threshold limit of ₦${Number(r1.parameterValue).toLocaleString()}.`,
        points: 45,
      });
      score += 45;
    }

    // 4. Rule 3: Geolocation Anomaly
    const r3 = rules.find((r) => r.id === "RULE-3");
    if (r3?.isActive) {
      const whitelisted = (r3.parameterValue as string).split(",");
      const isSuspicious =
        sandboxTxn.location.includes("Unknown") ||
        (sandboxTxn.location.includes("London") && !whitelisted.includes("GB")) ||
        (sandboxTxn.location.includes("New York") && !whitelisted.includes("US")) ||
        (sandboxTxn.location.includes("Germany") && !whitelisted.includes("DE"));

      if (isSuspicious) {
        triggered.push({
          id: "RULE-3",
          name: r3.name,
          reason: `Routing origin '${sandboxTxn.location}' violates geographic safety corridors.`,
          points: 35,
        });
        score += 35;
      }
    }

    // 5. Rule 4: Device check
    const r4 = rules.find((r) => r.id === "RULE-4");
    if (r4?.isActive && sandboxTxn.device.includes("Linux / Unknown")) {
      triggered.push({
        id: "RULE-4",
        name: r4.name,
        reason: "Unrecognized hardware signature / spoofed Linux user-agent.",
        points: 20,
      });
      score += 20;
    }

    // Cap score at 99
    score = Math.min(score, 99);

    let status: "passed" | "flagged" | "blocked" = "passed";
    if (score >= 75) status = "blocked";
    else if (score >= 45) status = "flagged";

    return {
      triggered,
      score,
      status,
    };
  }, [sandboxTxn, rules, blacklistedUsers, isEmergencyLockdown]);

  // Wizard form state
  const [wizardStep, setWizardStep] = useState(1);
  const [newRuleData, setNewRuleData] = useState({
    name: "",
    description: "",
    type: "threshold" as FraudRule["type"],
    parameterValue: "",
    action: "flag" as "flag" | "block" | "review",
  });

  const handleEditStart = (rule: FraudRule) => {
    setEditingRuleId(rule.id);
    setEditValue(String(rule.parameterValue));
  };

  const handleEditSave = (ruleId: string) => {
    const parsed = parseFloat(editValue);
    const finalValue = isNaN(parsed) ? editValue : parsed;
    updateRuleThreshold(ruleId, finalValue);
    setEditingRuleId(null);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(newRuleData.parameterValue);
    const finalValue = isNaN(parsed) ? newRuleData.parameterValue : parsed;

    createRule({
      name: newRuleData.name,
      description: newRuleData.description,
      type: newRuleData.type,
      parameterValue: finalValue,
      isActive: true,
    });

    // Reset Form
    setIsAddingRule(false);
    setWizardStep(1);
    setNewRuleData({
      name: "",
      description: "",
      type: "threshold",
      parameterValue: "",
      action: "flag",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Rules & Scoring Models</h1>
          <p className="mt-1 text-slate-400 text-sm">
            Configure system rules, thresholds, and ML model sensitivity thresholds
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddingRule(true)}
            className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-md transition-all"
          >
            <Plus className="h-4 w-4" /> Create Fraud Rule
          </button>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("rules")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "rules"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/50"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Active Policy Rules & Sandbox</span>
        </button>

        <button
          onClick={() => setActiveTab("models")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "models"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/50"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850"
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>ML Ensemble & SHAP Explainability</span>
          <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 text-[10px] font-mono border border-indigo-700/50">
            v3.4
          </span>
        </button>
      </div>

      {/* Tab 1: Policies & Sandbox */}
      {activeTab === "rules" && (
        <div className="space-y-8 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Rules Inventory List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" /> Active Policy Rules Catalog
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Toggling rules immediately changes real-time simulator evaluations</p>
          </div>

          <div className="space-y-4">
            {rules.map((rule) => {
              const isEditing = editingRuleId === rule.id;
              
              return (
                <div 
                  key={rule.id}
                  className={`p-4 rounded-xl border transition-all ${
                    rule.isActive 
                      ? "bg-slate-950/40 border-slate-800" 
                      : "bg-slate-950/10 border-slate-900/60 opacity-60"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-indigo-400 bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-900/30">
                          {rule.id}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          Type: {rule.type}
                        </span>
                      </div>
                      <h4 className="font-bold text-white mt-1.5 text-sm">
                        {rule.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {rule.description}
                      </p>
                    </div>

                    {/* Active Switch Toggle */}
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                        rule.isActive ? "bg-indigo-600" : "bg-slate-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                          rule.isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Threshold Parameter Editing */}
                  <div className="mt-4 pt-3 border-t border-slate-850 flex flex-wrap justify-between items-center gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span>Threshold value:</span>
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-white outline-none focus:border-indigo-500"
                          />
                          <button
                            onClick={() => handleEditSave(rule.id)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white p-1 rounded transition"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <span 
                          onClick={() => handleEditStart(rule)}
                          className="font-bold text-white hover:text-indigo-400 transition cursor-pointer underline decoration-dotted"
                        >
                          {typeof rule.parameterValue === "number" && rule.type === "threshold"
                            ? `₦${rule.parameterValue.toLocaleString()}`
                            : String(rule.parameterValue)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setBacktestingRule(rule)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/50 px-2 py-0.5 rounded transition"
                        title="Run Historic Backtest against buffered transaction corpus"
                      >
                        <FlaskConical className="h-3 w-3" />
                        <span>Backtest</span>
                      </button>

                      <div className="text-slate-500 text-[11px] font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Triggered: <strong className="text-slate-300">{rule.triggersCount} times</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Machine Learning Models Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-indigo-400" /> ML Scoring Models
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Tune thresholds for anomaly scoring algorithms</p>
            </div>

            {/* Model Sliders */}
            <div className="space-y-5">
              
              {/* Slider 1 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-white">RandomForest Anomaly Model</span>
                  <span className="text-indigo-400 font-bold">score &gt;= {mlThresholds.randomForest}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={mlThresholds.randomForest}
                  onChange={(e) => setMlThresholds({ ...mlThresholds, randomForest: parseInt(e.target.value) })}
                  className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Sensitive (Lower)</span>
                  <span>Strict (Higher)</span>
                </div>
              </div>

              {/* Slider 2 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-white">XGBoost Behavior Classifier</span>
                  <span className="text-indigo-400 font-bold">score &gt;= {mlThresholds.xgboost}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={mlThresholds.xgboost}
                  onChange={(e) => setMlThresholds({ ...mlThresholds, xgboost: parseInt(e.target.value) })}
                  className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Sensitive</span>
                  <span>Strict</span>
                </div>
              </div>

              {/* Slider 3 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-white">DeepNeuralNetwork Anomaly Model</span>
                  <span className="text-indigo-400 font-bold">score &gt;= {mlThresholds.deepNeuralNetwork}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={mlThresholds.deepNeuralNetwork}
                  onChange={(e) => setMlThresholds({ ...mlThresholds, deepNeuralNetwork: parseInt(e.target.value) })}
                  className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Sensitive</span>
                  <span>Strict</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem("fds_ml_thresholds", JSON.stringify(mlThresholds));
                    setMlSavedToast(true);
                    setTimeout(() => setMlSavedToast(false), 2500);
                  } catch {
                    // ignore
                  }
                }}
                className="w-full mt-4 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition shadow-md flex items-center justify-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" /> Save Scoring Sensitivity
              </button>

              {mlSavedToast && (
                <div className="mt-2 text-center text-xs text-emerald-400 font-semibold animate-in fade-in duration-200">
                  ML scoring thresholds saved successfully.
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-950/65 border border-slate-800 p-3 rounded-lg mt-6 text-xs">
            <h4 className="font-bold text-slate-300 flex items-center gap-1"><Info className="h-3.5 w-3.5 text-indigo-400" /> Operational Note</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              ML classifiers score all transactions between 0% and 100%. Scores exceeding the active thresholds are routed to the Alerts inbox.
            </p>
          </div>
        </div>
      </div>

      {/* Live Rule Evaluation Sandbox & Policy Tester */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-indigo-400" /> Interactive Rule Evaluation Sandbox
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate and stress-test custom transaction parameters against all active rules, blacklists, and lockdown thresholds in real-time.
            </p>
          </div>
          <span className="text-xs text-indigo-400 bg-indigo-950/40 border border-indigo-800/60 px-3 py-1 rounded-full font-semibold self-start sm:self-auto">
            Live Sandbox Active
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* Inputs Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* User ID */}
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold">Test User / Account</label>
                <input
                  type="text"
                  value={sandboxTxn.userId}
                  onChange={(e) => setSandboxTxn({ ...sandboxTxn, userId: e.target.value })}
                  placeholder="e.g. user_4910"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-slate-400 font-semibold">Amount (₦ NGN)</label>
                  <div className="flex gap-1.5">
                    {[50000, 500000, 2000000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setSandboxTxn({ ...sandboxTxn, amount: preset })}
                        className="text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 px-1.5 py-0.5 rounded transition"
                      >
                        ₦{(preset / 1000).toLocaleString()}k
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  value={sandboxTxn.amount}
                  onChange={(e) => setSandboxTxn({ ...sandboxTxn, amount: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Location */}
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold">Origin Network / Geolocation</label>
                <select
                  value={sandboxTxn.location}
                  onChange={(e) => setSandboxTxn({ ...sandboxTxn, location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                >
                  <option value="Lagos, Nigeria">Lagos, Nigeria (Approved)</option>
                  <option value="Abuja, Nigeria">Abuja, Nigeria (Approved)</option>
                  <option value="London, UK">London, UK (Cross-border)</option>
                  <option value="New York, USA">New York, USA (Cross-border)</option>
                  <option value="Unknown IP (Proxy)">Unknown IP (Proxy Corridor)</option>
                  <option value="Unknown IP (VPN)">Unknown IP (VPN Node)</option>
                </select>
              </div>

              {/* Device */}
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold">Device & Platform Fingerprint</label>
                <select
                  value={sandboxTxn.device}
                  onChange={(e) => setSandboxTxn({ ...sandboxTxn, device: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                >
                  <option value="Chrome / Windows 11">Chrome / Windows 11 (Standard)</option>
                  <option value="Safari / iPhone 15 Pro">Safari / iPhone 15 Pro (Mobile)</option>
                  <option value="FDS Android App v3.2">FDS Android App v3.2 (App Signed)</option>
                  <option value="Linux / Unknown User Agent">Linux / Unknown User Agent (Suspicious)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Outcome Result Card */}
          <div className="lg:col-span-5 bg-slate-950/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Simulated Decision</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  sandboxEvaluation.status === "blocked"
                    ? "bg-red-500/20 text-red-300 border-red-500/40"
                    : sandboxEvaluation.status === "flagged"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                }`}>
                  {sandboxEvaluation.status === "blocked"
                    ? "AUTOMATICALLY BLOCKED"
                    : sandboxEvaluation.status === "flagged"
                    ? "FLAGGED FOR REVIEW"
                    : "CLEARED / PASSED"}
                </span>
              </div>

              {/* Risk Meter */}
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Total Computed Risk:</span>
                  <span className={`font-black text-sm ${
                    sandboxEvaluation.score >= 75
                      ? "text-red-400"
                      : sandboxEvaluation.score >= 45
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}>
                    {sandboxEvaluation.score}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      sandboxEvaluation.score >= 75
                        ? "bg-red-500"
                        : sandboxEvaluation.score >= 45
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${sandboxEvaluation.score}%` }}
                  />
                </div>
              </div>

              {/* Triggered Rules List */}
              <div className="mt-4 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 block">Triggered Safeguards:</span>
                {sandboxEvaluation.triggered.length === 0 ? (
                  <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/30 text-emerald-300 rounded-lg text-[11px]">
                    No policy thresholds breached. Clean transaction profile.
                  </div>
                ) : (
                  sandboxEvaluation.triggered.map((trig) => (
                    <div key={trig.id} className="p-2 bg-slate-900 border border-slate-800 rounded-lg flex items-start gap-2 text-[11px]">
                      <ShieldAlert className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block">{trig.name} ({trig.id})</span>
                        <span className="text-slate-400 text-[10px] leading-tight block">{trig.reason}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex justify-between">
              <span>Dynamic simulation output</span>
              <span>Based on live system rules</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

      {/* Tab 2: Machine Learning & Feature Attribution */}
      {activeTab === "models" && (
        <div className="animate-in fade-in duration-150">
          <MLModelExplainer />
        </div>
      )}

      {/* Create Rule Wizard Modal */}
      {isAddingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsAddingRule(false)}
          />
          
          {/* Form Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 z-10 animate-in zoom-in-95 duration-200 relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="h-4.5 w-4.5 text-indigo-400" /> Create Policy Rule
              </h3>
              <button
                onClick={() => setIsAddingRule(false)}
                className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Wizard Steps indicator */}
            <div className="flex items-center justify-between text-xs mb-5 border-b border-slate-850 pb-2 text-slate-400 font-bold">
              <span className={wizardStep === 1 ? "text-indigo-400" : ""}>Step 1: Description</span>
              <span className={wizardStep === 2 ? "text-indigo-400" : ""}>Step 2: Criteria</span>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              {wizardStep === 1 ? (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Rule Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cross-Border IP Anomaly"
                      value={newRuleData.name}
                      onChange={(e) => setNewRuleData({ ...newRuleData, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Description</label>
                    <textarea
                      required
                      placeholder="Explain what parameters trigger this rule..."
                      value={newRuleData.description}
                      onChange={(e) => setNewRuleData({ ...newRuleData, description: e.target.value })}
                      className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!newRuleData.name || !newRuleData.description}
                    onClick={() => setWizardStep(2)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg disabled:bg-slate-800 disabled:text-slate-600 transition"
                  >
                    Next Step
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Condition Type</label>
                    <select
                      value={newRuleData.type}
                      onChange={(e) => setNewRuleData({ ...newRuleData, type: e.target.value as FraudRule["type"] })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                    >
                      <option value="threshold">High Transaction Amount (₦)</option>
                      <option value="velocity">Frequency Velocity Limit (txns/min)</option>
                      <option value="geolocation">Geolocation Whitelist (ISO Codes)</option>
                      <option value="device">Suspicious Device Fingerprints</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Trigger Threshold Value</label>
                    <input
                      type="text"
                      required
                      placeholder={
                        newRuleData.type === "threshold" 
                          ? "e.g. 1500000" 
                          : newRuleData.type === "velocity" 
                            ? "e.g. 3" 
                            : newRuleData.type === "geolocation" 
                              ? "e.g. NG,US,GB" 
                              : "e.g. Browser Discrepancy"
                      }
                      value={newRuleData.parameterValue}
                      onChange={(e) => setNewRuleData({ ...newRuleData, parameterValue: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">System Escalation Action</label>
                    <select
                      value={newRuleData.action}
                      onChange={(e) => setNewRuleData({ ...newRuleData, action: e.target.value as "flag" | "block" | "review" })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                    >
                      <option value="flag">Flag & Audit (Medium Risk)</option>
                      <option value="block">Block immediately (High Risk)</option>
                      <option value="review">Queue for Manual Analyst Review</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-2 rounded-lg transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={!newRuleData.parameterValue}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg disabled:bg-slate-800 disabled:text-slate-600 transition shadow-md"
                    >
                      Create Policy Rule
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
      {/* Historic Policy Backtester Modal */}
      {backtestingRule && (
        <RuleBacktesterModal
          rule={backtestingRule}
          onClose={() => setBacktestingRule(null)}
        />
      )}
    </div>
  );
}
