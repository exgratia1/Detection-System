import { useState, useMemo } from "react";
import { useSystemState } from "../context/SystemStateContext";
import type { AuditLogEntry } from "../context/SystemStateContext";
import { downloadAsCSV, downloadAsJSON } from "../utils/exportHelpers";
import { 
  Search, 
  Download, 
  User,
  Activity, 
  Database, 
  Key, 
  FileCheck,
  Clock,
  FileSpreadsheet
} from "lucide-react";

export default function AuditLogPage() {
  const { auditLogs } = useSystemState();
  const [searchTerm, setSearchTerm] = useState("");
  const [targetFilter, setTargetFilter] = useState<"All" | "Alert" | "Case" | "Rule" | "System" | "Report">("All");

  // Filter logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch = 
        log.analyst.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.targetId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTarget = 
        targetFilter === "All" || 
        log.targetType === targetFilter;

      return matchesSearch && matchesTarget;
    });
  }, [auditLogs, searchTerm, targetFilter]);

  // Export audit logs actions
  const dateStamp = new Date().toISOString().slice(0, 10);

  const handleExportJSON = () => {
    downloadAsJSON(`fds_compliance_audit_${dateStamp}.json`, filteredLogs);
  };

  const handleExportCSV = () => {
    downloadAsCSV(`fds_compliance_audit_${dateStamp}.csv`, filteredLogs as unknown as Record<string, unknown>[]);
  };

  // Icon selector based on target type
  const getTargetIcon = (targetType: AuditLogEntry["targetType"]) => {
    switch (targetType) {
      case "Alert":
        return <Activity className="h-4 w-4 text-rose-400" />;
      case "Case":
        return <FileCheck className="h-4 w-4 text-purple-400" />;
      case "Rule":
        return <Database className="h-4 w-4 text-indigo-450" />;
      case "APIKey":
        return <Key className="h-4 w-4 text-amber-450" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Compliance Audit Trail</h1>
          <p className="mt-1 text-slate-400 text-sm">
            Read-only chronological ledger recording all system alerts, rule changes, and analyst actions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            title="Download formatted spreadsheet"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" /> Export CSV
          </button>

          <button
            onClick={handleExportJSON}
            disabled={filteredLogs.length === 0}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            title="Download raw structured data"
          >
            <Download className="h-3.5 w-3.5 text-indigo-400" /> Export JSON
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {(["All", "Alert", "Case", "Rule", "System", "Report"] as const).map((t) => {
            const isTabActive = targetFilter === t;
            return (
              <button
                key={t}
                onClick={() => setTargetFilter(t)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  isTabActive
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search log details, analyst, target..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 outline-none"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Analyst / Origin</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Target Type</th>
                <th className="px-6 py-4">Target ID</th>
                <th className="px-6 py-4">Action Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No compliance records found in this category.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/15 transition-colors">
                    <td className="px-6 py-4 text-slate-450 font-mono text-[11px]">
                      {new Date(log.timestamp).toISOString().replace("T", " ").substring(0, 19)}
                    </td>
                    <td className="px-6 py-4 font-bold text-white flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-500" /> {log.analyst}
                    </td>
                    <td className="px-6 py-4 text-slate-250 font-semibold">
                      {log.action}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-slate-350">
                        {getTargetIcon(log.targetType)}
                        <span>{log.targetType}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="bg-slate-950/65 border border-slate-850 px-1.5 py-0.5 rounded font-mono text-[10px] text-indigo-350 font-bold">
                        {log.targetId}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-slate-350 leading-relaxed font-sans max-w-sm truncate sm:max-w-md lg:max-w-lg">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
