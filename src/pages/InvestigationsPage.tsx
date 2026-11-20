import { useState, useMemo } from "react";
import { useSystemState } from "../context/SystemStateContext";
import type { InvestigationCase } from "../context/SystemStateContext";
import MuleRingGraph from "../components/MuleRingGraph";
import { 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  FileEdit, 
  User, 
  FileText, 
  Coins, 
  Calendar,
  X,
  ChevronRight,
  Send,
  Ban,
  Plus,
  Scale,
  Network
} from "lucide-react";

export default function InvestigationsPage() {
  const { cases, updateCaseStatus, addCaseNote, transactions, blacklistedUsers, blacklistUser, createInvestigationCase } = useSystemState();
  const [selectedCase, setSelectedCase] = useState<InvestigationCase | null>(null);
  const [newNoteText, setNewNoteText] = useState("");
  const [activeColumnFilter, setActiveColumnFilter] = useState<"All" | "Open" | "In Progress" | "Resolved">("All");
  const [activeView, setActiveView] = useState<"kanban" | "graph">("kanban");

  // Create Case Form State
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [newCaseForm, setNewCaseForm] = useState({
    userId: "",
    amount: "",
    severity: "high" as InvestigationCase["severity"],
    description: "",
    initialNote: "",
  });

  // Kanban Columns definition
  const COLUMNS = [
    { id: "Open", title: "Open Cases", bg: "bg-red-500/10 border-red-500/20 text-red-400" },
    { id: "In Progress", title: "In Progress", bg: "bg-purple-500/10 border-purple-500/20 text-purple-400" },
    { id: "Resolved (Fraud)", title: "Resolved (Fraud)", bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
    { id: "Dismissed (False Positive)", title: "Dismissed (FP)", bg: "bg-slate-500/10 border-slate-800/60 text-slate-400" },
  ] as const;

  // Sync selected case if cases array updates in context
  const activeSelectedCase = useMemo(() => {
    if (!selectedCase) return null;
    return cases.find(c => c.id === selectedCase.id) || null;
  }, [cases, selectedCase]);

  // Priority badge styling
  const getPriorityBadge = (severity: InvestigationCase["severity"]) => {
    switch (severity) {
      case "critical":
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded">CRITICAL</span>;
      case "high":
        return <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold px-2 py-0.5 rounded">HIGH</span>;
      case "medium":
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded">MEDIUM</span>;
      case "low":
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded">LOW</span>;
    }
  };

  // Add note handler
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !activeSelectedCase) return;
    addCaseNote(activeSelectedCase.id, newNoteText.trim());
    setNewNoteText("");
  };

  // Evidence finder: find transactions made by the same user
  const userEvidenceTxns = useMemo(() => {
    if (!activeSelectedCase) return [];
    return transactions.filter(t => t.userId === activeSelectedCase.userId);
  }, [activeSelectedCase, transactions]);

  const isUserBlacklisted = useMemo(() => {
    if (!activeSelectedCase) return false;
    return blacklistedUsers.some(b => b.userId === activeSelectedCase.userId);
  }, [activeSelectedCase, blacklistedUsers]);

  const handleCreateCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseForm.userId.trim()) return;
    const created = createInvestigationCase({
      userId: newCaseForm.userId.trim(),
      amount: parseFloat(newCaseForm.amount) || 0,
      severity: newCaseForm.severity,
      description: newCaseForm.description.trim(),
      initialNote: newCaseForm.initialNote.trim(),
    });
    setIsCreatingCase(false);
    setNewCaseForm({
      userId: "",
      amount: "",
      severity: "high",
      description: "",
      initialNote: "",
    });
    setSelectedCase(created);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Investigations Dashboard</h1>
          <p className="mt-1 text-slate-400 text-sm">
            Manage escalated fraud cases • Perform deep transaction audits
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreatingCase(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-md transition"
          >
            <Plus className="h-3.5 w-3.5" /> Open Case
          </button>
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-lg flex gap-1">
            {(["All", "Open", "In Progress", "Resolved"] as const).map(f => (
              <button
                key={f}
                onClick={() => setActiveColumnFilter(f)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  activeColumnFilter === f ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View Mode Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveView("kanban")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeView === "kanban"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/50"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Case Lifecycle Kanban</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView("graph")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeView === "graph"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/50"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Network className="h-4 w-4" />
          <span>Mule Ring Syndicate Graph</span>
          <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 text-[10px] font-mono border border-purple-800">
            Network AI
          </span>
        </button>
      </div>

      {activeView === "kanban" ? (
        /* Kanban Board Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {COLUMNS.map(col => {
          const colCases = cases.filter(c => {
            if (col.id === "Resolved (Fraud)") return c.status === "Resolved (Fraud)";
            if (col.id === "Dismissed (False Positive)") return c.status === "Dismissed (False Positive)";
            return c.status === col.id;
          });

          // Apply column filter at top level for responsiveness
          const shouldRender = 
            activeColumnFilter === "All" ||
            (activeColumnFilter === "Open" && col.id === "Open") ||
            (activeColumnFilter === "In Progress" && col.id === "In Progress") ||
            (activeColumnFilter === "Resolved" && (col.id.startsWith("Resolved") || col.id.startsWith("Dismissed")));

          if (!shouldRender) return null;

          return (
            <div key={col.id} className="bg-slate-950/45 border border-slate-800/80 rounded-xl p-4 flex flex-col h-[600px]">
              {/* Column Header */}
              <div className={`p-2.5 rounded-lg border flex items-center justify-between mb-4 ${col.bg}`}>
                <h3 className="font-bold text-xs uppercase tracking-wider">{col.title}</h3>
                <span className="text-xs font-black">{colCases.length}</span>
              </div>

              {/* Cards scrolling list */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colCases.length === 0 ? (
                  <div className="h-full border border-dashed border-slate-800 rounded-xl flex items-center justify-center p-4 text-center">
                    <span className="text-[11px] text-slate-600 font-semibold">No cases in this status</span>
                  </div>
                ) : (
                  colCases.map(c => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCase(c)}
                      className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 hover:border-slate-600 hover:shadow-lg transition duration-150 cursor-pointer group"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-white text-xs tracking-tight group-hover:text-indigo-400 transition-colors">
                          {c.id}
                        </span>
                        {getPriorityBadge(c.severity)}
                      </div>

                      <p className="text-xs text-slate-300 mt-2 font-semibold">
                        User ID: {c.userId}
                      </p>
                      
                      <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                        <span>Risk Target Amount:</span>
                        <span className="font-bold text-white">₦{c.amount.toLocaleString()}</span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-3 line-clamp-2 leading-relaxed italic border-l-2 border-slate-700 pl-2">
                        {c.description}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                        <span className="font-semibold text-slate-400 flex items-center gap-0.5">
                          {c.notes.length} notes <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      ) : (
        <MuleRingGraph highlightUserId={selectedCase?.userId} />
      )}

      {/* Case Investigation Portal Modal */}
      {activeSelectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedCase(null)}
          />

          {/* Large Portal Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/40">
                    Active Audit
                  </span>
                  <span className="text-slate-500 text-xs">•</span>
                  <span className="text-slate-400 text-xs font-semibold">Opened: {new Date(activeSelectedCase.createdAt).toLocaleString()}</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-indigo-400" /> Case File: {activeSelectedCase.id}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const event = new CustomEvent("fds:open-sar-modal", {
                      detail: { caseItem: activeSelectedCase }
                    });
                    window.dispatchEvent(event);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-800/80 text-red-300 hover:text-white text-xs font-bold transition shadow-sm"
                  title="Generate Official Suspicious Activity Report (SAR)"
                >
                  <Scale className="h-3.5 w-3.5 text-red-400" />
                  <span>SAR Report</span>
                </button>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Row 1: Profile & Evidence Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* User Profile Card */}
                <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl text-xs space-y-3.5">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800/60 pb-1.5">
                    <User className="h-4 w-4 text-indigo-400" /> Suspect Profile
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">User Handle:</span>
                      <span className="font-bold text-white">{activeSelectedCase.userId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Account Standing:</span>
                      {isUserBlacklisted ? (
                        <span className="text-red-400 font-bold flex items-center gap-1 bg-red-950/40 border border-red-900/40 px-2 py-0.5 rounded text-[11px]">
                          <Ban className="h-3 w-3" /> Blacklisted
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => blacklistUser(activeSelectedCase.userId, `Flagged during investigation of Case ${activeSelectedCase.id}`)}
                          className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 bg-red-950/30 hover:bg-red-900/40 border border-red-800/40 px-2 py-0.5 rounded text-[10px] transition"
                        >
                          <Ban className="h-3 w-3" /> Blacklist User
                        </button>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Country KYC:</span>
                      <span className="font-semibold text-slate-200">Nigeria (NGN)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Flag Severity:</span>
                      <span>{getPriorityBadge(activeSelectedCase.severity)}</span>
                    </div>
                  </div>
                </div>

                {/* Case Details Card */}
                <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl text-xs space-y-3.5 lg:col-span-2">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800/60 pb-1.5">
                    <FileText className="h-4 w-4 text-indigo-400" /> Flag Criteria Summary
                  </h4>
                  <p className="text-slate-200 leading-relaxed font-sans text-xs">
                    {activeSelectedCase.description}
                  </p>
                </div>
              </div>

              {/* Row 2: Evidence Locker (User Transaction Ledger) */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-xs flex items-center gap-1.5 border-b border-slate-800/60 pb-2 mb-3">
                  <Coins className="h-4 w-4 text-indigo-400" /> Evidence Locker: Transaction History (Live)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-slate-500 font-bold border-b border-slate-850">
                      <tr>
                        <th className="pb-2">TXN ID</th>
                        <th className="pb-2">Amount</th>
                        <th className="pb-2">Location</th>
                        <th className="pb-2">Device Fingerprint</th>
                        <th className="pb-2">Risk Score</th>
                        <th className="pb-2">Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {userEvidenceTxns.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-600">
                            No buffered transactions found for this user.
                          </td>
                        </tr>
                      ) : (
                        userEvidenceTxns.map(t => (
                          <tr key={t.id} className="text-slate-300">
                            <td className="py-2.5 font-bold text-white">{t.id}</td>
                            <td className="py-2.5 font-semibold text-white">₦{t.amount.toLocaleString()}</td>
                            <td className="py-2.5">{t.location}</td>
                            <td className="py-2.5 truncate max-w-[140px]">{t.device}</td>
                            <td className={`py-2.5 font-bold ${t.riskScore >= 75 ? "text-red-400" : t.riskScore >= 45 ? "text-amber-400" : "text-emerald-400"}`}>
                              {t.riskScore}%
                            </td>
                            <td className="py-2.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                t.status === "blocked" 
                                  ? "bg-red-500/15 text-red-400" 
                                  : t.status === "flagged" 
                                    ? "bg-amber-500/15 text-amber-400" 
                                    : "bg-emerald-500/15 text-emerald-400"
                              }`}>
                                {t.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Row 3: Chronological Timeline & Analyst Notes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Timeline */}
                <div className="bg-slate-950/30 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-xs flex items-center gap-1.5 border-b border-slate-800/60 pb-2 mb-3">
                    <Calendar className="h-4 w-4 text-indigo-400" /> Historical Case Timeline
                  </h4>
                  <div className="space-y-4 max-h-56 overflow-y-auto flex-1 pr-1">
                    <div className="flex gap-2 text-xs">
                      <div className="flex flex-col items-center">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <div className="w-0.5 h-full bg-slate-800" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">Alert Flagged by Core Policy</span>
                        <span className="text-[10px] text-slate-500">{new Date(activeSelectedCase.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {activeSelectedCase.notes.map((note, index) => {
                      const isLast = index === activeSelectedCase.notes.length - 1;
                      return (
                        <div key={note.id} className="flex gap-2 text-xs">
                          <div className="flex flex-col items-center">
                            <Clock className="h-4 w-4 text-indigo-400 animate-pulse" />
                            {!isLast && <div className="w-0.5 h-full bg-slate-800" />}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{note.author}</span>
                            <p className="text-slate-300 mt-0.5 italic">"{note.text}"</p>
                            <span className="text-[10px] text-slate-500">{new Date(note.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Analyst Notes Form */}
                <div className="bg-slate-950/30 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-xs flex items-center gap-1.5 border-b border-slate-800/60 pb-2 mb-3">
                    <FileEdit className="h-4 w-4 text-indigo-400" /> Write Investigation Findings
                  </h4>
                  <form onSubmit={handleAddNote} className="space-y-3 flex-1 flex flex-col justify-between">
                    <textarea
                      placeholder="Add case findings, user contact replies, verification status details..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="w-full h-32 rounded-lg bg-slate-900 border border-slate-800 p-3 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 outline-none resize-none flex-1"
                    />
                    <button
                      type="submit"
                      disabled={!newNoteText.trim()}
                      className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed transition"
                    >
                      <Send className="h-3.5 w-3.5" /> Submit Case Note
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Modal Decision Footer */}
            {activeSelectedCase.status !== "Resolved (Fraud)" && activeSelectedCase.status !== "Dismissed (False Positive)" && (
              <div className="p-5 border-t border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex gap-2.5">
                  <button
                    onClick={() => {
                      updateCaseStatus(activeSelectedCase.id, "Dismissed (False Positive)");
                      setSelectedCase(null);
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-300 text-xs font-bold py-3 rounded-lg transition"
                  >
                    Dismiss (False Positive)
                  </button>
                  <button
                    onClick={() => {
                      updateCaseStatus(activeSelectedCase.id, "Resolved (Fraud)");
                      if (!isUserBlacklisted) {
                        blacklistUser(
                          activeSelectedCase.userId,
                          `Automated enforcement upon case resolution: ${activeSelectedCase.id}`
                        );
                      }
                      setSelectedCase(null);
                    }}
                    className="flex-1 bg-red-650 hover:bg-red-550 border border-red-500/30 text-white text-xs font-bold py-3 rounded-lg shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    <Ban className="h-3.5 w-3.5" /> Confirm Fraud & Freeze Account
                  </button>
                </div>
                
                {activeSelectedCase.status === "Open" && (
                  <button
                    onClick={() => {
                      updateCaseStatus(activeSelectedCase.id, "In Progress");
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-3 px-6 rounded-lg shadow-md transition"
                  >
                    Begin Investigation (Move to In Progress)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Manual Investigation Case Modal */}
      {isCreatingCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsCreatingCase(false)} />
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-indigo-400" /> Open Manual Investigation
              </h3>
              <button onClick={() => setIsCreatingCase(false)} className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCaseSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-semibold">Suspect User ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. user_9821"
                    value={newCaseForm.userId}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, userId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-semibold">Disputed Amount (₦)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 1500000"
                    value={newCaseForm.amount}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, amount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold">Priority Severity</label>
                <select
                  value={newCaseForm.severity}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, severity: e.target.value as InvestigationCase["severity"] })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                >
                  <option value="critical">CRITICAL (Immediate Freeze Required)</option>
                  <option value="high">HIGH (Active Fraud Risk)</option>
                  <option value="medium">MEDIUM (Compliance Inconsistency)</option>
                  <option value="low">LOW (Audit Verification)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold">Incident / Allegation Summary</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Offline customer complaint regarding unapproved offshore transfer and compromised SIM swap."
                  value={newCaseForm.description}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold">Initial Investigator Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Branch manager requested urgent freeze pending biometric re-verification."
                  value={newCaseForm.initialNote}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, initialNote: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingCase(false)}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition shadow-md"
                >
                  Create & Launch Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
