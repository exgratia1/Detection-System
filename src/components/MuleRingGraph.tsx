/* eslint-disable react-refresh/only-export-components */
import { useState, useMemo } from "react";
import { useSystemState } from "../context/SystemStateContext";
import { 
  Network, 
  Smartphone, 
  Ban, 
  CheckCircle2 
} from "lucide-react";

export interface RingNode {
  id: string;
  label: string;
  sublabel: string;
  type: "root" | "mule" | "device" | "beneficiary";
  x: number;
  y: number;
  volumeNaira: number;
  riskScore: number;
  deviceFingerprint?: string;
  status: "active" | "flagged" | "blacklisted";
}

export interface RingLink {
  source: string;
  target: string;
  amountNaira: number;
  txnCount: number;
  relationship: "funneled_to" | "hardware_login" | "settlement_payout";
}

// Preset syndicate scenario based around a high-risk smurfing ring
export const DEFAULT_RING_NODES: RingNode[] = [
  // Root Syndicate Orchestrator
  { id: "root-1", label: "user_8492 (Orchestrator)", sublabel: "Primary Smurfing Source", type: "root", x: 380, y: 220, volumeNaira: 14500000, riskScore: 98, deviceFingerprint: "DEV-MAC-8A9F", status: "flagged" },

  // Shared Hardware Anchor
  { id: "dev-1", label: "Device_SHA256_8a9f", sublabel: "Hardware ID: MacBook Pro (Lagos)", type: "device", x: 250, y: 140, volumeNaira: 0, riskScore: 92, deviceFingerprint: "DEV-MAC-8A9F", status: "flagged" },

  // Mule Accounts (Structured Fan-Out)
  { id: "mule-1", label: "user_1021 (Mule 1)", sublabel: "Tier 1 Wallet (Abuja)", type: "mule", x: 170, y: 260, volumeNaira: 2400000, riskScore: 84, deviceFingerprint: "DEV-MAC-8A9F", status: "active" },
  { id: "mule-2", label: "user_3391 (Mule 2)", sublabel: "Tier 1 Wallet (Port Harcourt)", type: "mule", x: 260, y: 350, volumeNaira: 3100000, riskScore: 78, deviceFingerprint: "DEV-MAC-8A9F", status: "active" },
  { id: "mule-3", label: "user_7740 (Mule 3)", sublabel: "Instant Cashout (Kano)", type: "mule", x: 500, y: 340, volumeNaira: 2800000, riskScore: 82, deviceFingerprint: "DEV-AND-4B21", status: "active" },
  { id: "mule-4", label: "user_5512 (Mule 4)", sublabel: "Tier 1 Savings (Enugu)", type: "mule", x: 580, y: 240, volumeNaira: 1950000, riskScore: 75, deviceFingerprint: "DEV-AND-4B21", status: "active" },

  // Off-shore Consolidation / Crypto Gateway Beneficiary
  { id: "ben-1", label: "Offshore Swift Settlement", sublabel: "DIFC Dubai Terminal", type: "beneficiary", x: 490, y: 110, volumeNaira: 11800000, riskScore: 95, status: "flagged" },
];

export const DEFAULT_RING_LINKS: RingLink[] = [
  { source: "root-1", target: "dev-1", amountNaira: 0, txnCount: 18, relationship: "hardware_login" },
  { source: "mule-1", target: "dev-1", amountNaira: 0, txnCount: 12, relationship: "hardware_login" },
  { source: "mule-2", target: "dev-1", amountNaira: 0, txnCount: 9, relationship: "hardware_login" },
  { source: "root-1", target: "mule-1", amountNaira: 2400000, txnCount: 5, relationship: "funneled_to" },
  { source: "root-1", target: "mule-2", amountNaira: 3100000, txnCount: 7, relationship: "funneled_to" },
  { source: "root-1", target: "mule-3", amountNaira: 2800000, txnCount: 6, relationship: "funneled_to" },
  { source: "root-1", target: "mule-4", amountNaira: 1950000, txnCount: 4, relationship: "funneled_to" },
  { source: "mule-3", target: "ben-1", amountNaira: 2600000, txnCount: 3, relationship: "settlement_payout" },
  { source: "mule-4", target: "ben-1", amountNaira: 1800000, txnCount: 2, relationship: "settlement_payout" },
  { source: "root-1", target: "ben-1", amountNaira: 7400000, txnCount: 8, relationship: "settlement_payout" },
];

interface MuleRingGraphProps {
  highlightUserId?: string;
}

export default function MuleRingGraph({ highlightUserId }: MuleRingGraphProps) {
  const { blacklistUser, blacklistedUsers } = useSystemState();
  const [selectedNodeId, setSelectedNodeId] = useState<string>("root-1");
  const [activeFilter, setActiveFilter] = useState<"all" | "mules" | "devices" | "settlement">("all");
  const [ringFeedback, setRingFeedback] = useState<string | null>(null);

  // Mark nodes that are in active blacklist
  const nodes = useMemo(() => {
    return DEFAULT_RING_NODES.map((n) => {
      const isBlacklisted = blacklistedUsers.some(b => b.userId === n.label.split(" ")[0]);
      if (isBlacklisted) {
        return { ...n, status: "blacklisted" as const, riskScore: 99 };
      }
      return n;
    });
  }, [blacklistedUsers]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  // Connected links for selected node
  const connectedLinks = useMemo(() => {
    return DEFAULT_RING_LINKS.filter(
      l => l.source === selectedNode.id || l.target === selectedNode.id
    );
  }, [selectedNode]);

  // Handle Blacklist Entire Ring
  const handleBlacklistEntireRing = () => {
    const accountNodes = nodes.filter(n => n.type === "root" || n.type === "mule");
    accountNodes.forEach((n) => {
      const userHandle = n.label.split(" ")[0];
      blacklistUser(userHandle, `Sanctioned in Smurfing Mule Ring Syndicate (Cluster REF: RING-8492)`);
    });
    setRingFeedback(`Successfully blacklisted all ${accountNodes.length} syndicate accounts across global registries.`);
    setTimeout(() => setRingFeedback(null), 4000);
  };

  const filteredNodes = useMemo(() => {
    if (activeFilter === "mules") return nodes.filter(n => n.type === "mule" || n.type === "root");
    if (activeFilter === "devices") return nodes.filter(n => n.type === "device" || n.type === "root");
    if (activeFilter === "settlement") return nodes.filter(n => n.type === "beneficiary" || n.type === "root");
    return nodes;
  }, [nodes, activeFilter]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header bar */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Mule Ring & Syndicate Graph Explorer
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold">
                CLUSTER CONFIDENCE: 94.2%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Graph analysis exposing structured smurfing funnels, shared hardware fingerprints, and offshore destinations
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBlacklistEntireRing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-650 hover:bg-red-550 border border-red-500/40 text-white font-bold text-xs transition shadow-md shadow-red-950/40"
          >
            <Ban className="h-3.5 w-3.5" />
            <span>Blacklist Entire Mule Ring</span>
          </button>
        </div>
      </div>

      {ringFeedback && (
        <div className="m-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>{ringFeedback}</span>
        </div>
      )}

      {/* Main Grid: SVG Canvas + Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* SVG Graph Canvas (8 cols) */}
        <div className="lg:col-span-8 p-4 bg-slate-950 relative min-h-[420px] flex items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* Subtle graph background lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-40" />

          {/* Quick filter pill */}
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-[11px] backdrop-blur-md z-10">
            {(["all", "mules", "devices", "settlement"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-2 py-0.5 rounded font-medium transition ${
                  activeFilter === tab ? "bg-purple-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                {tab === "all" ? "Full Cluster" : tab === "mules" ? "Mules" : tab === "devices" ? "Hardware" : "Settlement"}
              </button>
            ))}
          </div>

          <svg viewBox="0 0 760 460" className="w-full h-full max-h-[440px] select-none">
            <defs>
              <linearGradient id="fundFlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="hardwareLinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.7" />
              </linearGradient>
            </defs>

            {/* Links / Edges */}
            {DEFAULT_RING_LINKS.map((link, idx) => {
              const src = nodes.find(n => n.id === link.source);
              const tgt = nodes.find(n => n.id === link.target);
              if (!src || !tgt) return null;

              const isHardware = link.relationship === "hardware_login";
              const isSelected = selectedNode.id === src.id || selectedNode.id === tgt.id;

              return (
                <g key={`link-${idx}`} className="transition-all">
                  {/* Base path line */}
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isSelected ? "#ec4899" : isHardware ? "#38bdf8" : "#6366f1"}
                    strokeWidth={isSelected ? 2.5 : isHardware ? 1.5 : 2}
                    strokeOpacity={isSelected ? 0.9 : 0.35}
                    strokeDasharray={isHardware ? "5,5" : undefined}
                  />

                  {/* Animated Flow Dot for money transfers */}
                  {!isHardware && (
                    <circle r="3.5" fill="#ec4899" opacity="0.9">
                      <animateMotion
                        path={`M ${src.x} ${src.y} L ${tgt.x} ${tgt.y}`}
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {filteredNodes.map((node) => {
              const isSelected = selectedNode.id === node.id;
              const isTargetUser = highlightUserId && node.label.includes(highlightUserId);

              let nodeColor = "#a855f7"; // purple
              if (node.type === "root") nodeColor = "#ef4444"; // red orchestrator
              else if (node.type === "device") nodeColor = "#38bdf8"; // cyan hardware
              else if (node.type === "beneficiary") nodeColor = "#f59e0b"; // amber destination
              if (node.status === "blacklisted") nodeColor = "#b91c1c";

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className="cursor-pointer group"
                >
                  {/* Pulse ring for root or selected */}
                  {(isSelected || isTargetUser || node.type === "root") && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isSelected ? 24 : 20}
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth="1.5"
                      opacity="0.8"
                    >
                      <animate
                        attributeName="r"
                        from="14"
                        to="28"
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

                  {/* Outer circle badge */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.type === "root" ? 16 : 13}
                    fill={nodeColor}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    className="transition-transform group-hover:scale-110"
                  />

                  {/* Inner icon placeholder */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.type === "root" ? 8 : 6}
                    fill="#0f172a"
                  />

                  {/* Label */}
                  <text
                    x={node.x}
                    y={node.y - 18}
                    textAnchor="middle"
                    fill={isSelected ? "#ffffff" : "#cbd5e1"}
                    fontSize={isSelected ? "11" : "9.5"}
                    fontWeight={isSelected ? "bold" : "600"}
                    className="drop-shadow select-none pointer-events-none"
                  >
                    {node.label.split(" ")[0]}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + 24}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="8.5"
                    className="select-none pointer-events-none"
                  >
                    {node.type === "device" ? "Hardware Hub" : `₦${(node.volumeNaira / 1_000_000).toFixed(1)}M`}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Canvas Legend */}
          <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 backdrop-blur-md text-[10.5px] text-slate-300 space-y-1 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span>Orchestrator Account</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              <span>Smurfing Mule Account</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              <span>Shared Hardware Hash</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>Offshore Beneficiary</span>
            </div>
          </div>
        </div>

        {/* Selected Node Inspector (4 cols) */}
        <div className="lg:col-span-4 p-5 bg-slate-900/60 flex flex-col justify-between space-y-4">
          <div>
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase">
                  {selectedNode.type} Entity
                </span>
                <span className={`text-xs font-bold ${selectedNode.riskScore >= 75 ? "text-red-400" : "text-amber-400"}`}>
                  Risk Index: {selectedNode.riskScore}%
                </span>
              </div>
              <h4 className="text-base font-bold text-white mt-1.5">{selectedNode.label}</h4>
              <p className="text-xs text-slate-400">{selectedNode.sublabel}</p>
            </div>

            {/* Profile Statistics */}
            <div className="grid grid-cols-2 gap-2 my-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Cluster Volume</span>
                <span className="font-bold text-white block mt-0.5">
                  ₦{selectedNode.volumeNaira.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Syndicate Standing</span>
                <span className={`font-bold block mt-0.5 uppercase ${
                  selectedNode.status === "blacklisted" ? "text-red-400" : selectedNode.status === "flagged" ? "text-amber-400" : "text-slate-300"
                }`}>
                  {selectedNode.status}
                </span>
              </div>
            </div>

            {/* Hardware Association */}
            {selectedNode.deviceFingerprint && (
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs space-y-1 my-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Smartphone className="h-3 w-3 text-sky-400" /> Linked Hardware Fingerprint
                </span>
                <div className="font-mono text-sky-300 font-semibold">{selectedNode.deviceFingerprint}</div>
                <p className="text-[10.5px] text-slate-400">
                  Shared across 3 other distinct user accounts within 48 hours. High collusion index.
                </p>
              </div>
            )}

            {/* Connection Edges */}
            <div className="mt-3">
              <span className="text-xs font-bold text-slate-300 block mb-2">
                Active Cluster Links ({connectedLinks.length})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                {connectedLinks.map((link, idx) => {
                  const otherNodeId = link.source === selectedNode.id ? link.target : link.source;
                  const other = nodes.find(n => n.id === otherNodeId);

                  return (
                    <div
                      key={idx}
                      className="p-2 rounded bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-white block">{other?.label.split(" ")[0]}</span>
                        <span className="text-[10px] text-slate-400 block uppercase font-mono">{link.relationship}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-white text-xs block">
                          {link.amountNaira > 0 ? `₦${link.amountNaira.toLocaleString()}` : "Hardware Hop"}
                        </span>
                        <span className="text-[10px] text-slate-500">{link.txnCount} events</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          {selectedNode.type !== "device" && selectedNode.status !== "blacklisted" && (
            <button
              type="button"
              onClick={() => {
                const userHandle = selectedNode.label.split(" ")[0];
                blacklistUser(userHandle, `Sanctioned in Mule Ring Investigation`);
                setRingFeedback(`Account ${userHandle} blacklisted.`);
                setTimeout(() => setRingFeedback(null), 2500);
              }}
              className="w-full py-2 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-800 text-red-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Ban className="h-3.5 w-3.5" /> Sanction This Entity
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
