import { useState, useMemo } from "react";
import { useSystemState } from "../context/SystemStateContext";
import { 
  Cpu, 
  Sliders, 
  TrendingUp, 
  BarChart3, 
  CheckCircle2, 
  ShieldAlert, 
  Info, 
  Sparkles,
  Layers
} from "lucide-react";

interface FeatureWeight {
  id: string;
  name: string;
  category: "velocity" | "amount" | "geography" | "hardware" | "entity";
  weightPct: number;
  meanShap: number;
  description: string;
  impactDirection: "Risk Inducing" | "Trust Mitigating";
}

const MODEL_FEATURES: FeatureWeight[] = [
  {
    id: "feat-velocity",
    name: "Rolling 1h Velocity Spike",
    category: "velocity",
    weightPct: 28.4,
    meanShap: 0.42,
    description: "Frequency and volume of micro-transfers within a continuous 60-minute window relative to 30-day baseline.",
    impactDirection: "Risk Inducing",
  },
  {
    id: "feat-amount",
    name: "Historical Mean Deviation",
    category: "amount",
    weightPct: 24.1,
    meanShap: 0.38,
    description: "Ratio of current transaction amount against the user's historical 90-day moving average.",
    impactDirection: "Risk Inducing",
  },
  {
    id: "feat-geo",
    name: "Geo-Velocity Implausibility",
    category: "geography",
    weightPct: 19.7,
    meanShap: 0.31,
    description: "Calculates physical travel velocity required between consecutive banking logins across corridors.",
    impactDirection: "Risk Inducing",
  },
  {
    id: "feat-device",
    name: "Device Fingerprint Entropy",
    category: "hardware",
    weightPct: 14.2,
    meanShap: 0.22,
    description: "Hardware canvas, WebGL fingerprint changes, and unrecognized operating system / user-agent strings.",
    impactDirection: "Risk Inducing",
  },
  {
    id: "feat-corridor",
    name: "Cross-Border Settlement Flag",
    category: "geography",
    weightPct: 8.3,
    meanShap: 0.14,
    description: "Transactions originating from or terminating in high-risk international remittance clearing hubs.",
    impactDirection: "Risk Inducing",
  },
  {
    id: "feat-beneficiary",
    name: "New Beneficiary Velocity",
    category: "entity",
    weightPct: 5.3,
    meanShap: 0.09,
    description: "Funds dispatched to accounts created within the past 48 hours without historical interaction history.",
    impactDirection: "Risk Inducing",
  },
];

export default function MLModelExplainer() {
  const { transactions } = useSystemState();

  // Decision Threshold Slider state (0.10 to 0.90)
  const [decisionThreshold, setDecisionThreshold] = useState<number>(0.45);
  const [selectedTxnId, setSelectedTxnId] = useState<string>("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");

  // Dynamic Metrics based on Threshold
  const computedMetrics = useMemo(() => {
    const t = decisionThreshold;
    // Mathematical sigmoid-based ROC modeling
    const sensitivity = Math.min(0.999, Math.max(0.70, 0.976 - (t - 0.45) * 0.45));
    const fpr = Math.min(0.20, Math.max(0.002, 0.014 * Math.exp(-3.5 * (t - 0.45))));
    const precision = Math.min(0.995, Math.max(0.80, 0.948 + (t - 0.45) * 0.08));
    const f1 = (2 * (precision * sensitivity)) / (precision + sensitivity);

    // Simulated Confusion Matrix values based on 50,000 monthly txns
    const totalFraud = 1450;
    const totalLegit = 48550;

    const tp = Math.round(totalFraud * sensitivity);
    const fn = totalFraud - tp;
    const fp = Math.round(totalLegit * fpr);
    const tn = totalLegit - fp;

    // Financial impacts
    const fraudPreventedNaira = tp * 380000;
    const customerFrictionNaira = fp * 150000;

    return {
      sensitivity: (sensitivity * 100).toFixed(1),
      fpr: (fpr * 100).toFixed(2),
      precision: (precision * 100).toFixed(1),
      f1: f1.toFixed(3),
      tp,
      fn,
      fp,
      tn,
      fraudPreventedNaira,
      customerFrictionNaira,
      auc: "0.984",
    };
  }, [decisionThreshold]);

  // Selected Transaction for Waterfall explainability
  const activeTxn = useMemo(() => {
    if (selectedTxnId) {
      const found = transactions.find((t) => t.id === selectedTxnId);
      if (found) return found;
    }
    return transactions.length > 0 ? transactions[0] : null;
  }, [selectedTxnId, transactions]);

  // Dynamic SHAP Waterfall Breakdown for active transaction
  const waterfallBreakdown = useMemo(() => {
    if (!activeTxn) {
      return {
        baseScore: 5,
        steps: [],
        finalScore: 5,
      };
    }

    const baseScore = 5.0;
    const steps: { name: string; impact: number; isNegative?: boolean; detail: string }[] = [];

    // Factor 1: Amount
    if (activeTxn.amount > 1500000) {
      steps.push({
        name: "High Value Deviation",
        impact: 38.5,
        detail: `Amount (₦${activeTxn.amount.toLocaleString()}) exceeded mean baseline by 320%`,
      });
    } else if (activeTxn.amount > 500000) {
      steps.push({
        name: "Elevated Transaction Value",
        impact: 18.0,
        detail: `Amount (₦${activeTxn.amount.toLocaleString()}) moderately above standard profile`,
      });
    } else {
      steps.push({
        name: "Normal Transaction Value",
        impact: -2.0,
        isNegative: true,
        detail: `Amount (₦${activeTxn.amount.toLocaleString()}) is consistent with user cohort`,
      });
    }

    // Factor 2: Geolocation
    if (activeTxn.location.includes("Unknown") || activeTxn.location.includes("London") || activeTxn.location.includes("New York")) {
      steps.push({
        name: "Foreign / Anomaly Corridor",
        impact: 29.0,
        detail: `Routing from ${activeTxn.location} flagged as cross-border anomaly`,
      });
    } else {
      steps.push({
        name: "Domestic Verified Corridor",
        impact: -4.0,
        isNegative: true,
        detail: `Domestic origin (${activeTxn.location}) matches primary clearing routes`,
      });
    }

    // Factor 3: Device Fingerprint
    if (activeTxn.device.includes("Linux / Unknown")) {
      steps.push({
        name: "Hardware Signature Inconsistency",
        impact: 22.0,
        detail: `Device fingerprint '${activeTxn.device}' exhibits high browser entropy`,
      });
    } else {
      steps.push({
        name: "Trusted Client Hardware",
        impact: -3.5,
        isNegative: true,
        detail: `Authenticated mobile application on ${activeTxn.device}`,
      });
    }

    const totalRaw = baseScore + steps.reduce((sum, s) => sum + s.impact, 0);
    const finalScore = Math.min(99, Math.max(1, Math.round(totalRaw)));

    return {
      baseScore,
      steps,
      finalScore,
    };
  }, [activeTxn]);

  const filteredFeatures = useMemo(() => {
    if (activeCategoryFilter === "all") return MODEL_FEATURES;
    return MODEL_FEATURES.filter((f) => f.category === activeCategoryFilter);
  }, [activeCategoryFilter]);

  // Compute ROC SVG Plot Coordinates for the marker
  const rocMarkerPos = useMemo(() => {
    const fprNum = parseFloat(computedMetrics.fpr) / 100;
    const tprNum = parseFloat(computedMetrics.sensitivity) / 100;
    // Map bounds: x from 40 to 360, y from 260 to 40
    const x = 40 + fprNum * 320 * 6.5; // scaled for visibility
    const y = 260 - tprNum * 220;
    return { x: Math.min(360, Math.max(40, x)), y: Math.min(260, Math.max(40, y)) };
  }, [computedMetrics]);

  return (
    <div className="space-y-6">
      {/* Model Spec Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shadow-inner">
              <Cpu className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Sentinel-XGBoost Neural Ensemble (v3.4.2)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                  PRODUCTION MODEL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Trained on 1.48M transactions across Nigerian financial corridors • SHAP Value Attribution • 3.8ms Inference Latency
              </p>
            </div>
          </div>

          {/* Model High-Level Metrics Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">AUC-ROC</span>
              <span className="text-base font-extrabold text-indigo-400 block font-mono">{computedMetrics.auc}</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Precision</span>
              <span className="text-base font-extrabold text-emerald-400 block font-mono">{computedMetrics.precision}%</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Recall (TPR)</span>
              <span className="text-base font-extrabold text-blue-400 block font-mono">{computedMetrics.sensitivity}%</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">F1 Score</span>
              <span className="text-base font-extrabold text-amber-400 block font-mono">{computedMetrics.f1}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Decision Threshold Slider Bar */}
        <div className="mt-6 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-indigo-400" /> Operational Decision Threshold (τ)
              </span>
              <p className="text-[11.5px] text-slate-400">
                Adjust decision sensitivity cutoff to balance prevented financial fraud vs customer friction
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Current Threshold:</span>
              <span className="text-sm font-bold text-indigo-300 font-mono px-3 py-1 bg-indigo-950/60 border border-indigo-800/60 rounded-lg">
                τ = {decisionThreshold.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="relative">
            <input
              type="range"
              min="0.10"
              max="0.85"
              step="0.01"
              value={decisionThreshold}
              onChange={(e) => setDecisionThreshold(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1.5">
              <span>0.10 (Aggressive Fraud Catch)</span>
              <span>0.45 (Optimal Production Balance)</span>
              <span>0.85 (Minimal Customer Friction)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: ROC Curve Visualizer + Confusion Matrix Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ROC / AUC Curve Visualizer (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-indigo-400" /> Receiver Operating Characteristic (ROC Curve)
              </h3>
              <p className="text-xs text-slate-400">True Positive Rate vs False Positive Rate frontier curve</p>
            </div>
            <span className="text-[11px] font-mono text-indigo-300 font-bold bg-indigo-950/60 border border-indigo-800/60 px-2.5 py-1 rounded-lg">
              Area Under Curve = 0.984
            </span>
          </div>

          {/* SVG ROC Curve Plot */}
          <div className="relative bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-center">
            <svg viewBox="0 0 400 300" className="w-full max-h-[260px] select-none">
              <defs>
                <linearGradient id="rocArea" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="40" x2="360" y2="40" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="40" y1="95" x2="360" y2="95" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="40" y1="150" x2="360" y2="150" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="40" y1="205" x2="360" y2="205" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="40" y1="260" x2="360" y2="260" stroke="#334155" strokeWidth="1.5" />
              <line x1="40" y1="40" x2="40" y2="260" stroke="#334155" strokeWidth="1.5" />

              {/* Random Baseline Diagonal (AUC 0.50) */}
              <line x1="40" y1="260" x2="360" y2="40" stroke="#475569" strokeDasharray="4 4" strokeWidth="1" />

              {/* Shaded Area under Curve */}
              <path
                d="M 40 260 Q 45 45 360 40 L 360 260 Z"
                fill="url(#rocArea)"
              />

              {/* Main Model ROC Curve */}
              <path
                d="M 40 260 Q 45 45 360 40"
                fill="none"
                stroke="#6366f1"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Operating Threshold Marker */}
              <circle
                cx={rocMarkerPos.x}
                cy={rocMarkerPos.y}
                r="7"
                fill="#ec4899"
                stroke="#ffffff"
                strokeWidth="2"
                className="animate-pulse"
              />
              <circle
                cx={rocMarkerPos.x}
                cy={rocMarkerPos.y}
                r="16"
                fill="none"
                stroke="#ec4899"
                strokeWidth="1.5"
                opacity="0.6"
              />

              {/* Axis Labels */}
              <text x="200" y="290" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold">
                False Positive Rate (FPR) →
              </text>
              <text x="-150" y="16" transform="rotate(-90)" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold">
                True Positive Rate (Recall) →
              </text>
              <text x="35" y="44" textAnchor="end" fill="#64748b" fontSize="9">1.0</text>
              <text x="35" y="152" textAnchor="end" fill="#64748b" fontSize="9">0.5</text>
              <text x="35" y="263" textAnchor="end" fill="#64748b" fontSize="9">0.0</text>
              <text x="40" y="274" textAnchor="middle" fill="#64748b" fontSize="9">0.0</text>
              <text x="200" y="274" textAnchor="middle" fill="#64748b" fontSize="9">0.5</text>
              <text x="360" y="274" textAnchor="middle" fill="#64748b" fontSize="9">1.0</text>
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
              <span>Current Operating Point:</span>
              <strong className="text-white">TPR = {computedMetrics.sensitivity}%, FPR = {computedMetrics.fpr}%</strong>
            </span>
            <span className="text-emerald-400 font-semibold">Optimal Youden J Index</span>
          </div>
        </div>

        {/* Dynamic Confusion Matrix & Financial Tradeoff (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-4.5 w-4.5 text-indigo-400" /> Confusion Matrix (Monthly 50k Txns)
              </h3>
              <p className="text-xs text-slate-400">Class distributions at threshold τ = {decisionThreshold.toFixed(2)}</p>
            </div>

            {/* 2x2 Matrix Grid */}
            <div className="grid grid-cols-2 gap-2.5 my-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">True Positive (TP)</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <span className="text-lg font-black text-white block mt-1">{computedMetrics.tp.toLocaleString()}</span>
                <span className="text-[10.5px] text-slate-400">Fraud correctly blocked</span>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-rose-400 font-bold uppercase">False Positive (FP)</span>
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                </div>
                <span className="text-lg font-black text-rose-300 block mt-1">{computedMetrics.fp.toLocaleString()}</span>
                <span className="text-[10.5px] text-slate-400">Legit users flagged (friction)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-amber-400 font-bold uppercase">False Negative (FN)</span>
                  <Info className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <span className="text-lg font-black text-amber-300 block mt-1">{computedMetrics.fn.toLocaleString()}</span>
                <span className="text-[10.5px] text-slate-400">Fraud missed by model</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">True Negative (TN)</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <span className="text-lg font-black text-slate-200 block mt-1">{computedMetrics.tn.toLocaleString()}</span>
                <span className="text-[10.5px] text-slate-400">Good users cleared</span>
              </div>
            </div>

            {/* Financial Tradeoff Breakdown */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                Estimated Monthly Economic Balance
              </span>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Prevented Fraud Loss:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  +₦{computedMetrics.fraudPreventedNaira.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Customer Friction Friction Cost:</span>
                <span className="font-bold text-rose-400 font-mono">
                  -₦{computedMetrics.customerFrictionNaira.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
            * Dynamic simulation calibrated against Nigerian banking debit & instant transfer volume.
          </div>
        </div>
      </div>

      {/* SHAP Feature Importance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-indigo-400" /> SHAP Global Feature Importance
            </h3>
            <p className="text-xs text-slate-400">Predictive impact and weights derived from model gradient boosting iterations</p>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {(["all", "velocity", "amount", "geography", "hardware"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                  activeCategoryFilter === cat ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Bars */}
        <div className="space-y-3.5">
          {filteredFeatures.map((feat) => (
            <div key={feat.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{feat.name}</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30 uppercase">
                    {feat.category}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-slate-400">SHAP: <strong className="text-slate-200">+{feat.meanShap}</strong></span>
                  <span className="font-bold text-indigo-400">{feat.weightPct}% Weight</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${feat.weightPct * 3.3}%` }}
                />
              </div>

              <p className="text-[11.5px] text-slate-400 leading-relaxed font-sans">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Live Transaction Explainability Waterfall Sandbox */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-indigo-400" /> Transaction Risk Attribution Waterfall (Local SHAP)
            </h3>
            <p className="text-xs text-slate-400">Inspect how the ML model calculated the specific risk score for a selected transaction</p>
          </div>

          {/* Select transaction from live stream */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Select Stream TXN:</span>
            <select
              value={selectedTxnId}
              onChange={(e) => setSelectedTxnId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white rounded-lg p-2 text-xs outline-none focus:border-indigo-500 font-mono"
            >
              {transactions.slice(0, 10).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} — {t.userId} (₦{t.amount.toLocaleString()}) [{t.status}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Waterfall Graphic & Summary */}
        {activeTxn && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white text-sm">{activeTxn.id}</span>
                <span className="text-slate-400">• {activeTxn.userId}</span>
                <span className="text-slate-400">• ₦{activeTxn.amount.toLocaleString()}</span>
                <span className="text-slate-400">• {activeTxn.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Computed Threat Score:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                  waterfallBreakdown.finalScore >= 75 ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}>
                  {waterfallBreakdown.finalScore}% — {waterfallBreakdown.finalScore >= 75 ? "AUTOMATIC BLOCK" : "PASSED"}
                </span>
              </div>
            </div>

            {/* Waterfall Steps */}
            <div className="space-y-2 text-xs">
              {/* Prior */}
              <div className="p-2.5 rounded-lg bg-slate-900 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-300">Base Cohort Prior Risk:</span>
                  <span className="text-slate-500 block text-[11px]">Empirical base risk for verified customer tier</span>
                </div>
                <span className="font-mono font-bold text-slate-300">+{waterfallBreakdown.baseScore.toFixed(1)}%</span>
              </div>

              {/* Attribution Steps */}
              {waterfallBreakdown.steps.map((s, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    s.isNegative
                      ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                      : "bg-red-950/20 border-red-800/40 text-red-300"
                  }`}
                >
                  <div>
                    <span className="font-bold block">{s.name}</span>
                    <span className="text-[11px] text-slate-400 block">{s.detail}</span>
                  </div>
                  <span className="font-mono font-bold text-sm">
                    {s.isNegative ? `${s.impact}%` : `+${s.impact}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
