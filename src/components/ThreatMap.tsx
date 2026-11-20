/* eslint-disable react-refresh/only-export-components */
import { useState, useMemo } from "react";
import { useSystemState, type Transaction } from "../context/SystemStateContext";
import { 
  Globe, 
  Activity, 
  MapPin, 
  ChevronRight,
  Maximize2,
  Minimize2,
  Filter
} from "lucide-react";

export interface GeoNode {
  id: string;
  name: string;
  shortName: string;
  x: number;
  y: number;
  type: "domestic" | "cross-border";
  country: string;
  coordinates: string;
}

export const GEO_NODES: GeoNode[] = [
  // Domestic Nigerian Hubs
  { id: "LOS", name: "Lagos Financial Center", shortName: "Lagos", x: 310, y: 310, type: "domestic", country: "Nigeria", coordinates: "6.5244° N, 3.3792° E" },
  { id: "ABV", name: "Abuja Central Clearing", shortName: "Abuja", x: 380, y: 250, type: "domestic", country: "Nigeria", coordinates: "9.0765° N, 7.3986° E" },
  { id: "PHC", name: "Port Harcourt Energy Node", shortName: "Port Harcourt", x: 375, y: 360, type: "domestic", country: "Nigeria", coordinates: "4.8156° N, 7.0498° E" },
  { id: "KAN", name: "Kano Commercial Gateway", shortName: "Kano", x: 410, y: 170, type: "domestic", country: "Nigeria", coordinates: "12.0022° N, 8.5920° E" },
  { id: "ENU", name: "Enugu Regional Gateway", shortName: "Enugu", x: 415, y: 325, type: "domestic", country: "Nigeria", coordinates: "6.4584° N, 7.5464° E" },

  // International Remittance & Clearing Hubs
  { id: "LON", name: "London FX Corridor (UK)", shortName: "London", x: 240, y: 70, type: "cross-border", country: "United Kingdom", coordinates: "51.5074° N, 0.1278° W" },
  { id: "NYC", name: "New York USD Clearing (US)", shortName: "New York", x: 90, y: 110, type: "cross-border", country: "United States", coordinates: "40.7128° N, 74.0060° W" },
  { id: "FRA", name: "Frankfurt SEPA Hub (EU)", shortName: "Frankfurt", x: 320, y: 65, type: "cross-border", country: "Germany", coordinates: "50.1109° N, 8.6821° E" },
  { id: "DXB", name: "Dubai DIFC Settlement (UAE)", shortName: "Dubai", x: 530, y: 150, type: "cross-border", country: "United Arab Emirates", coordinates: "25.2048° N, 55.2708° E" },
  { id: "SIN", name: "Singapore APAC Corridor", shortName: "Singapore", x: 670, y: 250, type: "cross-border", country: "Singapore", coordinates: "1.3521° N, 103.8198° E" },
];

interface CorridorArc {
  from: string;
  to: string;
  curveOffset: number;
}

const CORRIDORS: CorridorArc[] = [
  // Cross-Border Inbound/Outbound
  { from: "LON", to: "LOS", curveOffset: -30 },
  { from: "NYC", to: "LOS", curveOffset: 45 },
  { from: "FRA", to: "LOS", curveOffset: 25 },
  { from: "DXB", to: "LOS", curveOffset: -35 },
  { from: "SIN", to: "LOS", curveOffset: -50 },
  // Domestic Inter-Bank Mesh
  { from: "LOS", to: "ABV", curveOffset: 15 },
  { from: "ABV", to: "KAN", curveOffset: -10 },
  { from: "LOS", to: "PHC", curveOffset: 20 },
  { from: "ABV", to: "ENU", curveOffset: -12 },
  { from: "PHC", to: "ENU", curveOffset: 10 },
];

export default function ThreatMap() {
  const { transactions, isEmergencyLockdown } = useSystemState();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("LOS");
  const [filterType, setFilterType] = useState<"all" | "flagged" | "domestic" | "cross-border">("all");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Map transactions to nodes by city keywords
  const nodeStats = useMemo(() => {
    const stats: Record<string, {
      totalTransactions: number;
      flaggedCount: number;
      blockedCount: number;
      totalVolumeNaira: number;
      maxRisk: number;
      recentTxns: Transaction[];
    }> = {};

    GEO_NODES.forEach((n) => {
      stats[n.id] = {
        totalTransactions: 0,
        flaggedCount: 0,
        blockedCount: 0,
        totalVolumeNaira: 0,
        maxRisk: 0,
        recentTxns: [],
      };
    });

    transactions.forEach((tx) => {
      const loc = tx.location.toLowerCase();
      let matchedNodeId: string | null = null;

      if (loc.includes("lagos")) matchedNodeId = "LOS";
      else if (loc.includes("abuja")) matchedNodeId = "ABV";
      else if (loc.includes("port harcourt")) matchedNodeId = "PHC";
      else if (loc.includes("kano")) matchedNodeId = "KAN";
      else if (loc.includes("enugu")) matchedNodeId = "ENU";
      else if (loc.includes("london")) matchedNodeId = "LON";
      else if (loc.includes("new york")) matchedNodeId = "NYC";
      else if (loc.includes("germany") || loc.includes("frankfurt")) matchedNodeId = "FRA";
      else if (loc.includes("dubai") || loc.includes("uae")) matchedNodeId = "DXB";
      else if (loc.includes("singapore")) matchedNodeId = "SIN";
      else matchedNodeId = "LOS"; // default routing hub

      if (matchedNodeId && stats[matchedNodeId]) {
        const entry = stats[matchedNodeId];
        entry.totalTransactions += 1;
        entry.totalVolumeNaira += tx.amount;
        if (tx.status === "blocked") entry.blockedCount += 1;
        if (tx.status === "flagged") entry.flaggedCount += 1;
        if (tx.riskScore > entry.maxRisk) entry.maxRisk = tx.riskScore;
        entry.recentTxns.push(tx);
      }
    });

    return stats;
  }, [transactions]);

  const selectedNode = GEO_NODES.find((n) => n.id === selectedNodeId) || GEO_NODES[0];
  const selectedNodeStat = nodeStats[selectedNode.id];

  const filteredCorridors = useMemo(() => {
    return CORRIDORS.filter((corridor) => {
      const fromNode = GEO_NODES.find((n) => n.id === corridor.from);
      const toNode = GEO_NODES.find((n) => n.id === corridor.to);
      if (!fromNode || !toNode) return false;

      if (filterType === "domestic") {
        return fromNode.type === "domestic" && toNode.type === "domestic";
      }
      if (filterType === "cross-border") {
        return fromNode.type === "cross-border" || toNode.type === "cross-border";
      }
      if (filterType === "flagged") {
        const fromStat = nodeStats[fromNode.id];
        const toStat = nodeStats[toNode.id];
        return (fromStat && (fromStat.flaggedCount > 0 || fromStat.blockedCount > 0)) ||
               (toStat && (toStat.flaggedCount > 0 || toStat.blockedCount > 0));
      }
      return true;
    });
  }, [filterType, nodeStats]);

  const renderPathD = (from: GeoNode, to: GeoNode, offset: number) => {
    const midX = (from.x + to.x) / 2 + offset;
    const midY = (from.y + to.y) / 2 - Math.abs(offset * 0.7);
    return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
      isExpanded ? "fixed inset-4 z-50 bg-slate-950/98 backdrop-blur-xl flex flex-col" : "relative"
    }`}>
      {/* Header telemetry bar */}
      <div className="p-4 sm:px-6 border-b border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Globe className="h-5 w-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Geographic Threat & Banking Corridors
              </h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isEmergencyLockdown 
                  ? "bg-red-500/20 border-red-500/40 text-red-300 animate-pulse"
                  : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isEmergencyLockdown ? "bg-red-400" : "bg-emerald-400"}`} />
                {isEmergencyLockdown ? "DEFCON 1 INTERCEPTING" : "CORRIDORS MONITORED"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-time spatial tracking across Nigerian domestic clearing nodes & international remittance hubs
            </p>
          </div>
        </div>

        {/* Filter controls & Expand */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-500 ml-1.5 mr-1" />
            {(["all", "flagged", "domestic", "cross-border"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterType(mode)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  filterType === mode
                    ? "bg-indigo-600 text-white font-semibold shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {mode === "all" ? "All Corridors" : mode === "flagged" ? "Threats Only" : mode === "domestic" ? "Domestic" : "Cross-Border"}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
            title={isExpanded ? "Collapse View" : "Fullscreen Radar View"}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Map Body: Canvas + Node Inspector */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-0 ${isExpanded ? "flex-1 overflow-hidden" : ""}`}>
        {/* SVG Telemetry Map (8 columns) */}
        <div className="lg:col-span-8 relative bg-slate-950 p-4 min-h-[380px] sm:min-h-[460px] flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
          {/* Cybernetic grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

          {/* Coordinate radar rings overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-[500px] h-[500px] rounded-full border border-indigo-500/20" />
            <div className="w-[320px] h-[320px] rounded-full border border-indigo-500/30" />
            <div className="w-[160px] h-[160px] rounded-full border border-indigo-500/40" />
          </div>

          <svg
            viewBox="0 0 760 480"
            className="w-full h-full max-h-[500px] select-none"
            style={{ filter: "drop-shadow(0 0 20px rgba(0,0,0,0.8))" }}
          >
            <defs>
              <linearGradient id="domesticArc" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="crossBorderArc" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="threatArc" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.9" />
              </linearGradient>

              {/* Glowing filters */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Stylized Continental Silhouettes / Region Landmarks */}
            <g opacity="0.15" fill="#334155" stroke="#475569" strokeWidth="1">
              {/* West Africa Region Outline */}
              <path d="M 280 220 Q 350 210 440 230 Q 470 290 440 370 Q 380 430 330 420 Q 270 380 260 310 Z" />
              {/* Europe Region Placeholder */}
              <path d="M 200 40 Q 300 30 380 60 Q 360 120 280 120 Q 210 100 200 40 Z" />
              {/* North America Placeholder */}
              <path d="M 40 80 Q 120 60 140 130 Q 110 180 50 160 Z" />
              {/* Middle East Placeholder */}
              <path d="M 490 120 Q 560 110 570 180 Q 510 200 480 160 Z" />
              {/* Southeast Asia Placeholder */}
              <path d="M 630 210 Q 710 220 700 290 Q 640 300 620 250 Z" />
            </g>

            {/* Render Corridor Arcs with live packet animations */}
            {filteredCorridors.map((c, i) => {
              const from = GEO_NODES.find((n) => n.id === c.from);
              const to = GEO_NODES.find((n) => n.id === c.to);
              if (!from || !to) return null;

              const fromStat = nodeStats[from.id];
              const toStat = nodeStats[to.id];
              const hasCritical = (fromStat && fromStat.blockedCount > 0) || (toStat && toStat.blockedCount > 0);
              const hasFlagged = (fromStat && fromStat.flaggedCount > 0) || (toStat && toStat.flaggedCount > 0);
              const isCrossBorder = from.type === "cross-border" || to.type === "cross-border";

              const pathD = renderPathD(from, to, c.curveOffset);
              const strokeColor = hasCritical
                ? "url(#threatArc)"
                : hasFlagged
                ? "#f59e0b"
                : isCrossBorder
                ? "url(#crossBorderArc)"
                : "url(#domesticArc)";

              return (
                <g key={`corridor-${i}`} className="group cursor-pointer">
                  {/* Background faint path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={hasCritical ? "#ef4444" : hasFlagged ? "#f59e0b" : "#475569"}
                    strokeWidth={hasCritical ? 2.5 : 1.2}
                    strokeOpacity={hasCritical ? 0.6 : 0.25}
                    strokeDasharray={isCrossBorder ? "4,4" : undefined}
                  />

                  {/* Dynamic pulse arc */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={hasCritical ? 3 : 2}
                    strokeOpacity={0.8}
                    strokeDasharray="8, 120"
                    strokeLinecap="round"
                    filter="url(#glow)"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="128"
                      to="0"
                      dur={hasCritical ? "1.8s" : "3.5s"}
                      repeatCount="indefinite"
                    />
                  </path>
                </g>
              );
            })}

            {/* Render Node Points & Ripple Beacons */}
            {GEO_NODES.map((node) => {
              const stats = nodeStats[node.id];
              const isSelected = selectedNodeId === node.id;
              const hasBlocked = stats && stats.blockedCount > 0;
              const hasFlagged = stats && stats.flaggedCount > 0;

              let nodeColor = "#10b981"; // emerald default
              if (hasBlocked || isEmergencyLockdown) nodeColor = "#ef4444"; // red
              else if (hasFlagged) nodeColor = "#f59e0b"; // amber

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className="cursor-pointer group"
                >
                  {/* Outer Ripple for Threat Nodes */}
                  {(hasBlocked || isSelected) && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isSelected ? 18 : 14}
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth="1.5"
                      opacity="0.8"
                    >
                      <animate
                        attributeName="r"
                        from="8"
                        to={isSelected ? "26" : "20"}
                        dur="1.8s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.8"
                        to="0"
                        dur="1.8s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Core Node Circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 8 : 6}
                    fill={nodeColor}
                    filter="url(#glow)"
                    className="transition-all duration-200 group-hover:scale-125"
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 4 : 2.5}
                    fill="#ffffff"
                  />

                  {/* Node Label Text */}
                  <text
                    x={node.x}
                    y={node.y - 12}
                    textAnchor="middle"
                    fill={isSelected ? "#ffffff" : "#94a3b8"}
                    fontSize={isSelected ? "11" : "9.5"}
                    fontWeight={isSelected ? "bold" : "600"}
                    className="select-none pointer-events-none drop-shadow"
                  >
                    {node.shortName}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + 16}
                    textAnchor="middle"
                    fill={hasBlocked ? "#f87171" : "#64748b"}
                    fontSize="8"
                    fontWeight="500"
                    className="select-none pointer-events-none"
                  >
                    {stats ? `₦${(stats.totalVolumeNaira / 1_000_000).toFixed(1)}M` : ""}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Quick Map Legend */}
          <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 backdrop-blur-md text-[11px] text-slate-300 space-y-1 shadow-lg pointer-events-none">
            <span className="font-bold text-[10px] text-slate-400 block uppercase tracking-wider mb-1">
              Corridor Telemetry
            </span>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
              <span>Normal Traffic</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500" />
              <span>Flagged Anomalies</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500" />
              <span>Intercepted / Blocked</span>
            </div>
          </div>
        </div>

        {/* Selected Node Inspector Drawer (4 columns) */}
        <div className="lg:col-span-4 p-5 bg-slate-900/60 flex flex-col justify-between space-y-4">
          <div>
            {/* Node Info Header */}
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider">
                  {selectedNode.type === "domestic" ? "Nigerian Clearing Hub" : "International Remittance Node"}
                </span>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-indigo-400" />
                  {selectedNode.coordinates}
                </span>
              </div>
              <h4 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2">
                {selectedNode.name}
              </h4>
              <p className="text-xs text-slate-400">{selectedNode.country}</p>
            </div>

            {/* Metric Grid for Selected Node */}
            <div className="grid grid-cols-2 gap-2.5 my-4">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10.5px] text-slate-400 block font-medium">Processed Volume</span>
                <span className="text-sm font-bold text-white block mt-0.5">
                  ₦{selectedNodeStat?.totalVolumeNaira.toLocaleString() || 0}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10.5px] text-slate-400 block font-medium">Peak Risk Index</span>
                <span className={`text-sm font-bold block mt-0.5 ${
                  (selectedNodeStat?.maxRisk || 0) >= 75 ? "text-red-400" : (selectedNodeStat?.maxRisk || 0) >= 45 ? "text-amber-400" : "text-emerald-400"
                }`}>
                  {selectedNodeStat?.maxRisk || 0}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10.5px] text-slate-400 block font-medium">Flagged Transactions</span>
                <span className="text-sm font-bold text-amber-300 block mt-0.5">
                  {selectedNodeStat?.flaggedCount || 0}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10.5px] text-slate-400 block font-medium">Intercepted Blocks</span>
                <span className="text-sm font-bold text-red-400 block mt-0.5">
                  {selectedNodeStat?.blockedCount || 0}
                </span>
              </div>
            </div>

            {/* Intercepted Transactions in this corridor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-indigo-400" /> Corridor Stream
                </span>
                <span className="text-[10px] text-slate-500">
                  {selectedNodeStat?.recentTxns.length || 0} recent events
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {selectedNodeStat && selectedNodeStat.recentTxns.length > 0 ? (
                  selectedNodeStat.recentTxns.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition"
                    >
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-300 font-semibold">{tx.id}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            tx.status === "blocked"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : tx.status === "flagged"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                        <span className="text-[10.5px] text-slate-400 block truncate">{tx.userId} • {tx.device}</span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="font-bold text-white text-xs block">₦{tx.amount.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500">Risk: {tx.riskScore}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-500">
                    No active transactions originating from this corridor yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                const searchEvent = new CustomEvent("fds:open-command-palette", {
                  detail: { initialQuery: selectedNode.shortName }
                });
                window.dispatchEvent(searchEvent);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md"
            >
              <span>Search Corridor Records in Command Hub</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
