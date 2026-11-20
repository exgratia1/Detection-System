import { useState, useMemo } from "react";
import { useSystemState } from "../context/SystemStateContext";
import { 
  ShieldAlert, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  CheckCircle,
  Lock,
  Ban
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const { transactions, alerts, cases, rules, blacklistedUsers } = useSystemState();
  const navigate = useNavigate();
  const [hoveredDataIndex, setHoveredDataIndex] = useState<number | null>(null);

  // Calculate stats
  const activeAlerts = alerts.filter(a => a.status === "Active" || a.status === "Investigating");
  const activeAlertsCount = activeAlerts.length;

  const blockedTxns = transactions.filter(t => t.status === "blocked");
  const blockedVolume = blockedTxns.reduce((sum, t) => sum + t.amount, 0);

  const totalTxnCount = transactions.length;
  const flaggedOrBlockedCount = transactions.filter(t => t.status !== "passed").length;
  const fraudRate = totalTxnCount > 0 ? (flaggedOrBlockedCount / totalTxnCount) * 100 : 0;

  const activeCases = cases.filter(c => c.status === "Open" || c.status === "In Progress");
  const activeCasesCount = activeCases.length;

  // Chart 1: Fraud Volatility Trend (Mock 24h data for custom SVG chart)
  const trendData = [
    { hour: "08:00", volume: 14500000, fraud: 1200000 },
    { hour: "10:00", volume: 18900000, fraud: 800000 },
    { hour: "12:00", volume: 24500000, fraud: 3950000 }, // Spike
    { hour: "14:00", volume: 21000000, fraud: 1500000 },
    { hour: "16:00", volume: 28400000, fraud: 2900000 },
    { hour: "18:00", volume: 32000000, fraud: 4200000 },
    { hour: "20:00", volume: 19500000, fraud: 1100000 },
  ];

  // Map values to coordinates for a 500x150 SVG viewport
  const maxVal = 35000000;
  const mapY = (val: number) => 130 - (val / maxVal) * 100; // 30px top pad, 20px bottom pad
  const mapX = (idx: number) => 30 + idx * 73; // 30px left pad, 30px right pad

  // Generate SVG path for volume
  const volumePathPoints = trendData.map((d, i) => `${mapX(i)},${mapY(d.volume)}`).join(" L ");
  const volumeAreaPoints = `30,130 L ${volumePathPoints} L ${mapX(trendData.length - 1)},130 Z`;

  // Generate SVG path for fraud
  const fraudPathPoints = trendData.map((d, i) => `${mapX(i)},${mapY(d.fraud * 5)}`).join(" L "); // Multiply by 5 for visual scaling
  const fraudAreaPoints = `30,130 L ${fraudPathPoints} L ${mapX(trendData.length - 1)},130 Z`;

  // Chart 2: Alerts by Rule Category (Donut chart calculation)
  const categoryCounts = rules.reduce((acc, r) => {
    acc[r.name] = r.triggersCount;
    return acc;
  }, {} as Record<string, number>);

  const totalTriggers = Object.values(categoryCounts).reduce((a, b) => a + b, 0) || 1;

  // Custom colors for rules
  const ruleColors = [
    "stroke-indigo-500 text-indigo-500",
    "stroke-rose-500 text-rose-500",
    "stroke-amber-500 text-amber-500",
    "stroke-emerald-500 text-emerald-500"
  ];
  const ruleBgColors = [
    "bg-indigo-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-emerald-500"
  ];

  // Donut chart calculations: Radius=35, Center=50,50, Circumference=~219.9
  const radius = 35;
  const circ = 2 * Math.PI * radius;

  // Pre-compute donut offsets to avoid mutation inside render loop (satisfies immutability lints)
  const donutOffsets = useMemo(() => {
    const offsets: number[] = [];
    let sum = 0;
    for (const rule of rules) {
      const pct = (rule.triggersCount / totalTriggers) * 100;
      offsets.push(sum);
      sum += pct;
    }
    return offsets;
  }, [rules, totalTriggers]);

  return (
    <div className="space-y-8">
      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1 */}
        <div 
          onClick={() => navigate("/alerts")}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Alerts</p>
              <h3 className="text-3xl font-bold text-white mt-1.5">{activeAlertsCount}</h3>
            </div>
            <div className="p-2.5 bg-red-950/40 text-red-400 rounded-lg group-hover:bg-red-900/40 transition-colors">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs mt-4 text-red-400">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+2 new in last 10m</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-red-500/80" />
        </div>

        {/* KPI 2 */}
        <div 
          onClick={() => navigate("/live")}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Blocked Volume</p>
              <h3 className="text-3xl font-bold text-white mt-1.5">₦{blockedVolume.toLocaleString()}</h3>
            </div>
            <div className="p-2.5 bg-slate-850 text-slate-300 rounded-lg group-hover:bg-slate-800 transition-colors">
              <Lock className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs mt-4 text-slate-400">
            <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
              <ArrowDownRight className="h-3 w-3" /> -12%
            </span>
            <span>vs previous 24h</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-500/80" />
        </div>

        {/* KPI 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Fraud Volatility Rate</p>
              <h3 className="text-3xl font-bold text-white mt-1.5">{fraudRate.toFixed(1)}%</h3>
            </div>
            <div className="p-2.5 bg-amber-950/40 text-amber-400 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs mt-4 text-amber-400">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Close to critical threshold (1.5%)</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-amber-500/80" />
        </div>

        {/* KPI 4 */}
        <div 
          onClick={() => navigate("/investigations")}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Investigations</p>
              <h3 className="text-3xl font-bold text-white mt-1.5">{activeCasesCount} <span className="text-sm font-normal text-slate-400">active</span></h3>
            </div>
            <div className="p-2.5 bg-purple-950/40 text-purple-400 rounded-lg group-hover:bg-purple-900/40 transition-colors">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs mt-4 text-purple-400">
            <CheckCircle className="h-3.5 w-3.5 text-purple-400" />
            <span>2 cases resolved today</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-purple-500/80" />
        </div>
      </div>

      {/* Watchlist & Enforcement Banner */}
      {blacklistedUsers.length > 0 && (
        <div 
          onClick={() => navigate("/settings")}
          className="bg-slate-900 border border-slate-800 hover:border-red-500/40 rounded-xl p-3.5 px-4 flex items-center justify-between cursor-pointer transition group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-950/40 border border-red-900/40 rounded-lg text-red-400 flex-shrink-0">
              <Ban className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white group-hover:text-red-300 transition-colors">
                Enforced Watchlist: {blacklistedUsers.length} Blacklisted {blacklistedUsers.length === 1 ? "Entity" : "Entities"}
              </span>
              <p className="text-[11px] text-slate-400">
                Automated 99% threat interception and immediate blocking enabled for all flagged accounts.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform">
            <span>Manage Watchlist</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Volatility Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Fraud Volatility & Volume Trend</h3>
                <p className="text-xs text-slate-400 mt-0.5">Real-time transaction volume vs. escalated risk (scaled 5x)</p>
              </div>
              <div className="flex gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Total Vol</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" /> Risk Spike</span>
              </div>
            </div>

            {/* Custom SVG Graph */}
            <div className="relative mt-6 h-56 w-full bg-slate-950/30 border border-slate-800/40 rounded-xl p-2">
              <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="fraudGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line x1="30" y1="30" x2="470" y2="30" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="30" y1="80" x2="470" y2="80" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="30" y1="130" x2="470" y2="130" stroke="#334155" strokeWidth="1" />

                {/* Volume Area & Line */}
                <polygon points={volumeAreaPoints} fill="url(#volGrad)" />
                <path d={`M ${volumePathPoints}`} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />

                {/* Fraud Area & Line */}
                <polygon points={fraudAreaPoints} fill="url(#fraudGrad)" />
                <path d={`M ${fraudPathPoints}`} fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />

                {/* Data point dots & interactive hovers */}
                {trendData.map((d, i) => (
                  <g key={i} className="cursor-pointer">
                    <circle
                      cx={mapX(i)}
                      cy={mapY(d.volume)}
                      r={hoveredDataIndex === i ? "6" : "3.5"}
                      className="fill-indigo-400 stroke-slate-900 stroke-2 transition-all duration-150"
                    />
                    <circle
                      cx={mapX(i)}
                      cy={mapY(d.fraud * 5)}
                      r={hoveredDataIndex === i ? "6" : "3.5"}
                      className="fill-rose-400 stroke-slate-900 stroke-2 transition-all duration-150"
                    />
                    {/* Invisible hover capture column */}
                    <rect
                      x={mapX(i) - 25}
                      y="10"
                      width="50"
                      height="125"
                      fill="transparent"
                      onMouseEnter={() => setHoveredDataIndex(i)}
                      onMouseLeave={() => setHoveredDataIndex(null)}
                    />
                  </g>
                ))}
              </svg>

              {/* Tooltip Overlay */}
              {hoveredDataIndex !== null && (
                <div 
                  className="absolute z-10 bg-slate-900/95 border border-slate-700/60 p-2.5 rounded-lg text-xs shadow-xl backdrop-blur-sm transition-all duration-200 pointer-events-none"
                  style={{
                    left: `${(mapX(hoveredDataIndex) / 500) * 100 - 12}%`,
                    top: "10px"
                  }}
                >
                  <p className="font-bold text-white mb-1">Hour: {trendData[hoveredDataIndex].hour}</p>
                  <p className="text-indigo-300">Vol: ₦{trendData[hoveredDataIndex].volume.toLocaleString()}</p>
                  <p className="text-rose-300">Fraud: ₦{trendData[hoveredDataIndex].fraud.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Time axis legends */}
          <div className="flex justify-between text-slate-500 text-xs px-8 mt-2">
            {trendData.map((d, i) => (
              <span key={i} className={hoveredDataIndex === i ? "text-white font-semibold" : ""}>
                {d.hour}
              </span>
            ))}
          </div>
        </div>

        {/* Rule Category Donut Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Alerts by Rule Type</h3>
            <p className="text-xs text-slate-400 mt-0.5">Performance triggers of fraud check sets</p>
          </div>

          <div className="flex flex-col items-center justify-center my-6">
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="#1e293b"
                  strokeWidth="10"
                />

                {rules.map((rule, idx) => {
                  const pct = (rule.triggersCount / totalTriggers) * 100;
                  const strokeDashoffset = circ - (pct * circ) / 100;
                  const strokeDasharray = circ;
                  const currentOffsetVal = donutOffsets[idx];

                  return (
                    <circle
                      key={rule.id}
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      className={`${ruleColors[idx % 4]} transition-all duration-300 hover:stroke-width-12`}
                      strokeWidth="10"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      style={{
                        strokeDashoffset: strokeDashoffset,
                        transform: `rotate(${(currentOffsetVal * 360) / 100}deg)`,
                        transformOrigin: "50px 50px"
                      }}
                    />
                  );
                })}
              </svg>
              {/* Central text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{totalTriggers}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Triggers</span>
              </div>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="space-y-2">
            {rules.map((rule, idx) => {
              const pct = ((rule.triggersCount / totalTriggers) * 100).toFixed(0);
              return (
                <div key={rule.id} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${ruleBgColors[idx % 4]}`} />
                    <span className="text-slate-300 truncate max-w-[150px]">{rule.name}</span>
                  </div>
                  <div className="flex gap-2 text-right">
                    <span className="font-semibold text-white">{rule.triggersCount}</span>
                    <span className="text-slate-400 font-normal">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Alerts & Incident Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent High-Risk Incidents */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Recent Security Incidents</h3>
            <button 
              onClick={() => navigate("/alerts")} 
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
            >
              View all alerts <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {alerts.slice(0, 4).map((alert) => {
              const severityColor = 
                alert.severity === "critical" 
                  ? "bg-red-500/20 text-red-400 border-red-500/30" 
                  : "bg-amber-500/20 text-amber-400 border-amber-500/30";

              return (
                <div key={alert.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between hover:bg-slate-800/20 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold border ${severityColor}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{alert.id}</span>
                        <span className="text-slate-500 text-xs">•</span>
                        <span className="text-slate-400 text-xs">{alert.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 font-medium">{alert.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white text-sm">{alert.amount}</div>
                    <button 
                      onClick={() => navigate("/alerts")} 
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold mt-1 transition"
                    >
                      Investigate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Operations Log */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">System Activity</h3>
              <button 
                onClick={() => navigate("/audit")}
                className="text-xs font-semibold text-slate-400 hover:text-slate-300 transition"
              >
                Audit Log
              </button>
            </div>

            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {transactions.slice(0, 5).map((txn) => {
                const isBlacklisted = blacklistedUsers.some((b) => b.userId === txn.userId) || txn.ruleTriggers.includes("RULE-BLACKLIST");
                const statusColor = 
                  txn.status === "blocked" 
                    ? "text-red-400" 
                    : txn.status === "flagged" 
                      ? "text-amber-400" 
                      : "text-emerald-400";

                return (
                  <div key={txn.id} className="flex gap-3 text-xs items-start">
                    <div className="mt-1">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>{txn.category} of ₦{txn.amount.toLocaleString()}</span>
                        {isBlacklisted && (
                          <span className="text-[9px] font-bold bg-red-950/60 border border-red-900/80 text-red-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Ban className="h-2.5 w-2.5 text-red-400" /> BANNED
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        User: {txn.userId} • {txn.location}
                      </div>
                      <span className={`inline-block text-[10px] font-bold mt-1 ${statusColor}`}>
                        {txn.status.toUpperCase()} (Risk: {txn.riskScore}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live Simulation Feed
            </span>
            <span>Refreshes every 6s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
