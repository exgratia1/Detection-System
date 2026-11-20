import { useState, useMemo } from "react";
import { useSystemState } from "../context/SystemStateContext";
import type { Alert } from "../context/SystemStateContext";
import { 
  Search, 
  ShieldAlert, 
  ShieldCheck,
  X,
  Zap,
  Ban,
  Scale
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AlertsPage() {
  const { alerts, resolveAlert, blacklistedUsers, blacklistUser } = useSystemState();
  const navigate = useNavigate();

  // Local UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Active" | "Investigating" | "Resolved">("All");
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [viewingAlert, setViewingAlert] = useState<Alert | null>(null);
  const [alertFeedback, setAlertFeedback] = useState<string | null>(null);

  // Tabs filtering
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      // Tab match
      const tabMatch = 
        activeTab === "All" ||
        (activeTab === "Active" && a.status === "Active") ||
        (activeTab === "Investigating" && a.status === "Investigating") ||
        (activeTab === "Resolved" && (a.status === "Resolved" || a.status === "Dismissed"));

      // Search match
      const searchMatch = 
        a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.type.toLowerCase().includes(searchTerm.toLowerCase());

      return tabMatch && searchMatch;
    });
  }, [alerts, activeTab, searchTerm]);

  // Bulk select handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAlerts(filteredAlerts.map(a => a.id));
    } else {
      setSelectedAlerts([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAlerts(prev => [...prev, id]);
    } else {
      setSelectedAlerts(prev => prev.filter(item => item !== id));
    }
  };

  // Bulk operations
  const handleBulkDismiss = () => {
    selectedAlerts.forEach(id => resolveAlert(id, "dismiss"));
    setSelectedAlerts([]);
  };

  const handleBulkEscalate = () => {
    selectedAlerts.forEach(id => resolveAlert(id, "escalate"));
    setSelectedAlerts([]);
    navigate("/investigations");
  };

  const isViewingUserBlacklisted = useMemo(() => {
    if (!viewingAlert) return false;
    return blacklistedUsers.some((b) => b.userId === viewingAlert.user);
  }, [viewingAlert, blacklistedUsers]);

  // Status badges styling
  const getStatusBadge = (status: Alert["status"]) => {
    switch (status) {
      case "Active":
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 ring-1 ring-red-500/30 animate-pulse">
            Active
          </span>
        );
      case "Investigating":
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30">
            Investigating
          </span>
        );
      case "Resolved":
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
            Resolved
          </span>
        );
      case "Dismissed":
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/25 text-slate-400 ring-1 ring-slate-500/30">
            Dismissed
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight font-sans">Alerts & Notifications</h1>
        <p className="mt-1 text-slate-400 text-sm">
          Active system notifications • {alerts.filter(a => a.status === "Active").length} critical events require action
        </p>
      </div>

      {/* Tab Navigation & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800/80 rounded-xl p-1">
          {(["All", "Active", "Investigating", "Resolved"] as const).map((tab) => {
            const count = 
              tab === "All" 
                ? alerts.length 
                : tab === "Active" 
                  ? alerts.filter(a => a.status === "Active").length
                  : tab === "Investigating"
                    ? alerts.filter(a => a.status === "Investigating").length
                    : alerts.filter(a => a.status === "Resolved" || a.status === "Dismissed").length;

            const isTabActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedAlerts([]);
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                  isTabActive
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab}
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                  isTabActive ? "bg-indigo-600 text-white" : "bg-slate-850 text-slate-400"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search Alerts by ID, User, Type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 outline-none"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
        </div>
      </div>

      {/* Bulk Operations Toolbar */}
      {selectedAlerts.length > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-indigo-950/20 border border-indigo-900/30 rounded-xl text-xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold">
            <Zap className="h-4 w-4 text-indigo-400" />
            <span>{selectedAlerts.length} alerts selected for batch action</span>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={handleBulkDismiss}
              className="bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 px-3.5 py-1.5 rounded-lg font-bold transition"
            >
              Dismiss (False Positive)
            </button>
            <button
              onClick={handleBulkEscalate}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg font-bold shadow-md transition"
            >
              Escalate Cases
            </button>
          </div>
        </div>
      )}

      {/* Alerts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filteredAlerts.length > 0 && selectedAlerts.length === filteredAlerts.length}
                    onChange={handleSelectAll}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 bg-slate-850 border-slate-700 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4">Alert ID</th>
                <th className="px-6 py-4">Anomaly Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Target User</th>
                <th className="px-6 py-4">Raised Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 text-xs">
                    No alerts in this view.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => {
                  const isSelected = selectedAlerts.includes(alert.id);
                  const isResolved = alert.status === "Resolved" || alert.status === "Dismissed";
                  
                  return (
                    <tr
                      key={alert.id}
                      className={`hover:bg-slate-800/40 transition-colors cursor-pointer group ${
                        isSelected ? "bg-slate-800/20" : ""
                      }`}
                      onClick={() => setViewingAlert(alert)}
                    >
                      <td 
                        className="px-6 py-4 text-center"
                        onClick={(e) => e.stopPropagation()} // Prevent row click trigger
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectOne(alert.id, e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 bg-slate-850 border-slate-700 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 font-bold text-white text-xs sm:text-sm">
                        {alert.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            alert.severity === "critical" ? "bg-red-500" : "bg-amber-500"
                          }`} />
                          <span className="text-slate-200 font-medium text-xs sm:text-sm">{alert.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">
                        {alert.amount}
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-xs sm:text-sm">
                        {alert.user}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {alert.time}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(alert.status)}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-3 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setViewingAlert(alert)}
                            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                          >
                            View
                          </button>
                          {!isResolved && (
                            <>
                              <span className="text-slate-750">|</span>
                              <button
                                onClick={() => resolveAlert(alert.id, "escalate")}
                                className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition"
                              >
                                Escalate
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Investigation Modal */}
      {viewingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setViewingAlert(null)}
          />
          {/* Modal Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 overflow-y-auto z-10 animate-in zoom-in-95 duration-200 relative">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Security Incident Dossier</span>
                <h3 className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-indigo-400" /> {viewingAlert.id} : {viewingAlert.type}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const event = new CustomEvent("fds:open-sar-modal", {
                      detail: { alertItem: viewingAlert }
                    });
                    window.dispatchEvent(event);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-800/80 text-red-300 hover:text-white text-[11px] font-bold transition shadow-sm"
                  title="Generate Official Suspicious Activity Report (SAR)"
                >
                  <Scale className="h-3 w-3 text-red-400" />
                  <span>SAR Report</span>
                </button>
                <button
                  onClick={() => setViewingAlert(null)}
                  className="p-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content Details */}
            <div className="space-y-5 mt-5 text-xs">
              
              {/* Action Feedback Banner */}
              {alertFeedback && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>{alertFeedback}</span>
                </div>
              )}

              {/* Blacklist Warning */}
              {isViewingUserBlacklisted && (
                <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg flex items-center gap-2 text-xs text-red-300 font-medium">
                  <Ban className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <span>Target user {viewingAlert.user} is currently blacklisted from financial services.</span>
                </div>
              )}

              {/* Speedometer Gauge */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Security Threat Level</span>
                <div className="relative mt-2 h-14 w-28 flex items-end justify-center overflow-hidden">
                  <svg viewBox="0 0 100 50" className="w-full h-full">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1e293b" strokeWidth="8" />
                    <path 
                      d="M 10 50 A 40 40 0 0 1 90 50" 
                      fill="none" 
                      stroke={viewingAlert.severity === "critical" ? "#ef4444" : "#f59e0b"} 
                      strokeWidth="8" 
                      strokeDasharray="125.6"
                      strokeDashoffset={viewingAlert.severity === "critical" ? 12.5 : 37.5}
                      className="transition-all duration-300"
                    />
                  </svg>
                  <span className="absolute bottom-0 text-xl font-extrabold text-white">
                    {viewingAlert.severity === "critical" ? "CRITICAL" : "HIGH"}
                  </span>
                </div>
              </div>

              {/* Data parameters */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg flex flex-col justify-between">
                  <span className="text-slate-400 block">Beneficiary Target User</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-semibold text-white text-sm block">{viewingAlert.user}</span>
                    {isViewingUserBlacklisted ? (
                      <span className="text-[10px] bg-red-950/50 border border-red-900/60 text-red-300 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Ban className="h-3 w-3" /> BANNED
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          blacklistUser(viewingAlert.user, `Blacklisted directly from Alert ${viewingAlert.id}`);
                          setAlertFeedback(`User ${viewingAlert.user} added to blacklist.`);
                          setTimeout(() => setAlertFeedback(null), 3000);
                        }}
                        className="text-[10px] bg-red-950/30 hover:bg-red-900/40 border border-red-800/40 text-red-400 font-bold px-2 py-0.5 rounded flex items-center gap-1 transition"
                      >
                        <Ban className="h-3 w-3" /> Blacklist
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
                  <span className="text-slate-400 block">Transaction Amount</span>
                  <span className="font-bold text-rose-400 mt-1 text-sm block">{viewingAlert.amount}</span>
                </div>
                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
                  <span className="text-slate-400 block">Audit Connection</span>
                  <span className="font-semibold text-slate-300 mt-1 block">Linked {viewingAlert.txnId}</span>
                </div>
                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
                  <span className="text-slate-400 block">Raised Time</span>
                  <span className="font-semibold text-slate-300 mt-1 block">{viewingAlert.time}</span>
                </div>
              </div>

              {/* Alert Reason */}
              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block mb-1 font-semibold">Incident Narrative / Flag Criteria</span>
                <p className="text-slate-200 leading-relaxed text-xs">
                  {viewingAlert.reason}
                </p>
              </div>

              {/* Current Status */}
              <div className="flex justify-between items-center p-3 bg-slate-850 border border-slate-800 rounded-lg">
                <span className="text-slate-400 font-bold">Current Alert Status:</span>
                <div>{getStatusBadge(viewingAlert.status)}</div>
              </div>
            </div>

            {/* Footer Buttons */}
            {viewingAlert.status !== "Resolved" && viewingAlert.status !== "Dismissed" && (
              <div className="border-t border-slate-800 pt-4 mt-6 flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => {
                    resolveAlert(viewingAlert.id, "dismiss");
                    setViewingAlert(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-2.5 rounded-lg transition"
                >
                  <X className="h-4 w-4 text-slate-400" /> Dismiss (False Positive)
                </button>
                <button
                  onClick={() => {
                    resolveAlert(viewingAlert.id, "resolve");
                    setViewingAlert(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold py-2.5 rounded-lg transition"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> Mark as Confirmed Fraud
                </button>
                {viewingAlert.status !== "Investigating" && (
                  <button
                    onClick={() => {
                      resolveAlert(viewingAlert.id, "escalate");
                      setViewingAlert(null);
                      navigate("/investigations");
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg shadow-md transition"
                  >
                    <ShieldAlert className="h-4 w-4" /> Escalate Case
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
