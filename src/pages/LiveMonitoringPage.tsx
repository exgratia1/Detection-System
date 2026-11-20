import { useState, useMemo } from "react";
import { useSystemState } from "../context/SystemStateContext";
import type { Transaction } from "../context/SystemStateContext";
import ThreatMap from "../components/ThreatMap";
import { 
  Play, 
  Pause, 
  Search, 
  MapPin, 
  Filter, 
  Info, 
  ShieldAlert, 
  User, 
  X,
  PlusCircle,
  FolderOpen,
  CheckCircle,
  Ban,
  Fingerprint
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LiveMonitoringPage() {
  const { 
    transactions, 
    isSimulatorActive, 
    toggleSimulator,
    forceApproveTransaction,
    manuallyFlagTransaction,
    dispatchStepUpChallenge,
    blacklistUser,
    blacklistedUsers
  } = useSystemState();
  const navigate = useNavigate();
  
  // Local UI State
  const [isPaused, setIsPaused] = useState(false);
  const [frozenTransactions, setFrozenTransactions] = useState<Transaction[]>([]);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilters, setRiskFilters] = useState({
    passed: true,
    flagged: true,
    blocked: true,
  });

  // Filtered transactions
  const displayTransactions = useMemo(() => {
    const list = isPaused ? frozenTransactions : transactions;
    return list.filter((t) => {
      const matchesSearch = 
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.userId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = 
        (t.status === "passed" && riskFilters.passed) ||
        (t.status === "flagged" && riskFilters.flagged) ||
        (t.status === "blocked" && riskFilters.blocked);

      return matchesSearch && matchesFilter;
    });
  }, [isPaused, frozenTransactions, transactions, searchTerm, riskFilters]);

  const isUserBlacklisted = useMemo(() => {
    if (!selectedTxn) return false;
    return blacklistedUsers.some((b) => b.userId === selectedTxn.userId);
  }, [selectedTxn, blacklistedUsers]);

  const handleEscalate = () => {
    // Escalate requires an Alert ID. We will generate one if not exist or find matching alert
    // For convenience, we will trigger the escalation by making a case directly or pointing to alerts page
    navigate("/alerts");
  };

  return (
    <div className="space-y-8 relative">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Live Monitoring</h1>
          <p className="mt-1 text-slate-400 text-sm">
            Real-time transaction stream • Instant anomaly isolation
          </p>
        </div>
        
        {/* Play/Pause Controls */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg">
            <span className={`h-2.5 w-2.5 rounded-full ${isSimulatorActive ? "bg-green-500 animate-pulse" : "bg-slate-600"}`} />
            Simulator: {isSimulatorActive ? "ACTIVE" : "PAUSED"}
          </span>
          <button
            onClick={toggleSimulator}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {isSimulatorActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isSimulatorActive ? "Pause Sim" : "Resume Sim"}
          </button>
          <button
            onClick={() => {
              if (!isPaused) {
                setFrozenTransactions(transactions);
              }
              setIsPaused(!isPaused);
            }}
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition border ${
              isPaused 
                ? "bg-amber-600 hover:bg-amber-500 border-amber-500 text-white" 
                : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
            }`}
          >
            {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {isPaused ? "Resume Feed" : "Freeze Feed"}
          </button>
        </div>
      </div>

      {/* Interactive Geographic Threat & Banking Corridor Radar */}
      <ThreatMap />

      {/* Scrolling Stream & Filter Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {/* Filtering Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white">Buffered Stream Data</h2>
            {isPaused && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase rounded border border-amber-500/30">
                Feed Frozen
              </span>
            )}
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search User or TXN ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-56 rounded-lg bg-slate-900 border border-slate-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 outline-none"
              />
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
            </div>

            {/* Filter checkboxes */}
            <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-800 rounded-lg p-1.5 px-3">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Filters:
              </span>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={riskFilters.blocked}
                  onChange={(e) => setRiskFilters({ ...riskFilters, blocked: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500 h-3.5 w-3.5 bg-slate-800 border-slate-700"
                />
                <span className="text-red-400 font-semibold">Blocked</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={riskFilters.flagged}
                  onChange={(e) => setRiskFilters({ ...riskFilters, flagged: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 bg-slate-800 border-slate-700"
                />
                <span className="text-amber-400 font-semibold">Flagged</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={riskFilters.passed}
                  onChange={(e) => setRiskFilters({ ...riskFilters, passed: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 bg-slate-800 border-slate-700"
                />
                <span className="text-emerald-400 font-semibold">Passed</span>
              </label>
            </div>
          </div>
        </div>

        {/* Scroll Stream Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Transaction ID</th>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Device</th>
                <th className="px-5 py-3.5">Risk Score</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {displayTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-500 text-xs">
                    No transactions match search or filter settings.
                  </td>
                </tr>
              ) : (
                displayTransactions.map((txn, index) => {
                  const isNew = index === 0 && !isPaused && isSimulatorActive;
                  const rowBg = 
                    txn.status === "blocked" 
                      ? "bg-red-950/10 hover:bg-red-950/20" 
                      : txn.status === "flagged" 
                        ? "bg-amber-950/10 hover:bg-amber-950/20" 
                        : "hover:bg-slate-800/40";

                  const riskColor = 
                    txn.riskScore >= 75 
                      ? "text-red-400" 
                      : txn.riskScore >= 45 
                        ? "text-amber-400" 
                        : "text-emerald-400";

                  const statusBadge = 
                    txn.status === "pending_challenge" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
                        <Fingerprint className="h-3 w-3" /> 2FA Challenge
                      </span>
                    ) : txn.status === "blocked" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                        Blocked
                      </span>
                    ) : txn.status === "flagged" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        Flagged
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Passed
                      </span>
                    );

                  return (
                    <tr
                      key={txn.id}
                      className={`transition-colors duration-200 cursor-pointer group ${rowBg} ${
                        isNew ? "border-l-4 border-indigo-500 animate-in fade-in duration-300" : ""
                      }`}
                      onClick={() => setSelectedTxn(txn)}
                    >
                      <td className="px-5 py-4 font-bold text-white text-xs sm:text-sm">
                        {txn.id}
                      </td>
                      <td className="px-5 py-4 text-slate-300 text-xs font-medium">
                        {txn.userId}
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs">
                        {txn.category}
                      </td>
                      <td className="px-5 py-4 font-semibold text-white text-xs sm:text-sm">
                        ₦{txn.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-slate-300 text-xs max-w-[120px] truncate">
                        {txn.location}
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs max-w-[120px] truncate">
                        {txn.device}
                      </td>
                      <td className={`px-5 py-4 font-bold text-xs ${riskColor}`}>
                        {txn.riskScore}%
                      </td>
                      <td className="px-5 py-4">
                        {statusBadge}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors flex items-center gap-1 ml-auto">
                          Analyze <Info className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Transaction Drawer */}
      {selectedTxn && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedTxn(null)}
          />
          {/* Drawer Container */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl p-6 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              {/* Drawer Header */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-indigo-400" /> Deep Anomaly Analyzer
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">TXN ID: {selectedTxn.id}</p>
                </div>
                <button
                  onClick={() => setSelectedTxn(null)}
                  className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Transaction Parameters */}
              <div className="space-y-5 mt-6">
                {/* Risk Gauge */}
                <div className="bg-slate-950/65 border border-slate-800 p-4 rounded-xl flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Evaluated Risk Level</span>
                  
                  {/* Gauge Arc */}
                  <div className="relative mt-2 h-14 w-28 flex items-end justify-center overflow-hidden">
                    <svg viewBox="0 0 100 50" className="w-full h-full">
                      {/* Grey Track */}
                      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1e293b" strokeWidth="8" />
                      {/* Active Arc */}
                      <path 
                        d="M 10 50 A 40 40 0 0 1 90 50" 
                        fill="none" 
                        stroke={selectedTxn.riskScore >= 75 ? "#ef4444" : selectedTxn.riskScore >= 45 ? "#f59e0b" : "#10b981"} 
                        strokeWidth="8" 
                        strokeDasharray="125.6"
                        strokeDashoffset={125.6 - (selectedTxn.riskScore / 100) * 125.6}
                        className="transition-all duration-500 ease-out"
                      />
                    </svg>
                    <span className="absolute bottom-0 text-2xl font-black text-white">{selectedTxn.riskScore}%</span>
                  </div>
                  <span className={`text-xs font-bold mt-2 uppercase tracking-wider ${
                    selectedTxn.riskScore >= 75 ? "text-red-400" : selectedTxn.riskScore >= 45 ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {selectedTxn.riskScore >= 75 ? "CRITICAL THREAT" : selectedTxn.riskScore >= 45 ? "ELEVATED RISK" : "CLEARED PASSED"}
                  </span>
                </div>

                {/* Metadata details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction Data</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-lg text-xs">
                      <span className="text-slate-400 block">User Profile</span>
                      <span className="font-bold text-white mt-1 flex items-center gap-1"><User className="h-3 w-3 text-slate-400" /> {selectedTxn.userId}</span>
                    </div>
                    <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-lg text-xs">
                      <span className="text-slate-400 block">Category</span>
                      <span className="font-bold text-white mt-1">{selectedTxn.category}</span>
                    </div>
                    <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-lg text-xs">
                      <span className="text-slate-400 block">Amount</span>
                      <span className="font-bold text-white mt-1 text-sm">₦{selectedTxn.amount.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-lg text-xs">
                      <span className="text-slate-400 block">Currency</span>
                      <span className="font-bold text-white mt-1">{selectedTxn.currency} (Nigerian Naira)</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-lg text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Geographic Origin:</span>
                      <span className="font-semibold text-white flex items-center gap-1"><MapPin className="h-3 w-3 text-red-400" /> {selectedTxn.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Device Fingerprint:</span>
                      <span className="font-semibold text-white truncate max-w-[200px]">{selectedTxn.device}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Timestamp:</span>
                      <span className="font-semibold text-slate-300">{new Date(selectedTxn.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                {/* Rule Triggers */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Triggered Policy Rules</h4>
                  {selectedTxn.ruleTriggers.length === 0 ? (
                    <div className="p-3 bg-slate-950/20 border border-slate-800/40 rounded-lg text-xs text-emerald-400 font-medium">
                      No policy rules breached. Clean profile.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedTxn.ruleTriggers.map(ruleId => (
                        <div key={ruleId} className="p-2.5 bg-red-950/20 border border-red-900/30 text-red-200 text-xs rounded-lg flex items-center gap-2">
                          <ShieldAlert className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                          <div>
                            <span className="font-bold block">{ruleId} Triggered</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Blacklist Warning */}
            {isUserBlacklisted && (
              <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg flex items-center gap-2.5 text-xs text-red-300 font-medium">
                <Ban className="h-4 w-4 text-red-400 flex-shrink-0" />
                <span>User {selectedTxn.userId} is currently blacklisted. Automatic system blocks are active.</span>
              </div>
            )}

            {/* Action Feedback Banner */}
            {actionFeedback && (
              <div className="p-3 bg-indigo-950/60 border border-indigo-800/80 rounded-lg flex items-center gap-2 text-xs text-indigo-200">
                <CheckCircle className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                <span>{actionFeedback}</span>
              </div>
            )}

            {/* Analyst Actions */}
            <div className="border-t border-slate-800 pt-4 mt-6 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Override & Escalate</h4>
              
              {/* Dispatch Interactive Step-Up Challenge */}
              <button
                onClick={() => {
                  dispatchStepUpChallenge(selectedTxn.id, "biometric");
                  setActionFeedback(`Interactive biometric 2FA challenge dispatched to user device.`);
                  setTimeout(() => {
                    setActionFeedback(null);
                  }, 2500);
                }}
                disabled={selectedTxn.status === "pending_challenge"}
                className="w-full flex items-center justify-center gap-2 bg-purple-600/90 hover:bg-purple-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition shadow-md shadow-purple-950/30"
              >
                <Fingerprint className="h-4 w-4" />
                <span>{selectedTxn.status === "pending_challenge" ? "Verification In Progress (Awaiting User)..." : "Dispatch Step-Up 2FA Challenge"}</span>
              </button>

              {selectedTxn.status !== "passed" ? (
                <button
                  onClick={handleEscalate}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg transition"
                >
                  <FolderOpen className="h-4 w-4" /> Escalate to Investigation Case
                </button>
              ) : (
                <button
                  onClick={() => {
                    manuallyFlagTransaction(selectedTxn.id);
                    setActionFeedback(`Transaction ${selectedTxn.id} manually flagged as suspicious.`);
                    setTimeout(() => {
                      setActionFeedback(null);
                      setSelectedTxn(null);
                    }, 1000);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2.5 rounded-lg transition"
                >
                  <PlusCircle className="h-4 w-4" /> Manually Flag Transaction
                </button>
              )}
              
              <div className="flex gap-2.5">
                <button
                  onClick={() => {
                    forceApproveTransaction(selectedTxn.id);
                    setActionFeedback(`Transaction ${selectedTxn.id} force-approved by analyst.`);
                    setTimeout(() => {
                      setActionFeedback(null);
                      setSelectedTxn(null);
                    }, 1000);
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-400 py-2.5 rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Force Approve
                </button>
                <button
                  onClick={() => {
                    blacklistUser(
                      selectedTxn.userId,
                      `Blacklisted from Live Monitoring during review of transaction ${selectedTxn.id}`
                    );
                    setActionFeedback(`User ${selectedTxn.userId} has been blacklisted.`);
                    setTimeout(() => {
                      setActionFeedback(null);
                    }, 2000);
                  }}
                  disabled={isUserBlacklisted}
                  className={`flex-1 border text-xs font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                    isUserBlacklisted
                      ? "bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-red-400"
                  }`}
                >
                  <Ban className="h-3.5 w-3.5" /> {isUserBlacklisted ? "User Blacklisted" : "Blacklist User"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
