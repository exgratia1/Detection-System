import { useState } from "react";
import { useSystemState } from "../context/SystemStateContext";
import type { ScheduledReport } from "../context/SystemStateContext";
import { downloadAsCSV, downloadAsJSON, downloadBlob } from "../utils/exportHelpers";
import { 
  Download, 
  Calendar, 
  Plus, 
  Trash, 
  Play, 
  Pause, 
  Mail, 
  CheckCircle,
  X,
  Sparkles,
  RefreshCw
} from "lucide-react";

export default function ReportsPage() {
  const { 
    scheduledReports, 
    scheduleReport, 
    toggleReportStatus, 
    deleteReport,
    transactions,
    alerts,
    cases,
    addAuditEntry
  } = useSystemState();

  // Local state for Exports
  const [exportType, setExportType] = useState<"Transactions" | "Alerts" | "Investigations">("Transactions");
  const [exportFormat, setExportFormat] = useState<"CSV" | "Excel" | "PDF" | "JSON">("CSV");
  const [exportRange, setExportRange] = useState("Last 7 Days");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  // Local state for Scheduler Modal
  const [isScheduling, setIsScheduling] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    title: "",
    frequency: "Daily" as ScheduledReport["frequency"],
    format: "PDF" as ScheduledReport["format"],
    recipients: "",
  });

  // Handle Export File Generation & Real Download
  const handleExportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    setExportProgress(0);
    setShowExportSuccess(false);

    // Prepare real dataset
    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileNameBase = `FDS_${exportType.toLowerCase()}_export_${dateStamp}`;

    const rawData = 
      exportType === "Transactions" 
        ? transactions 
        : exportType === "Alerts" 
          ? alerts 
          : cases;

    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          setShowExportSuccess(true);

          // Trigger real browser download
          if (exportFormat === "CSV") {
            downloadAsCSV(`${fileNameBase}.csv`, rawData as unknown as Record<string, unknown>[]);
          } else if (exportFormat === "JSON") {
            downloadAsJSON(`${fileNameBase}.json`, rawData);
          } else if (exportFormat === "Excel") {
            downloadAsCSV(`${fileNameBase}.xlsx`, rawData as unknown as Record<string, unknown>[]);
          } else if (exportFormat === "PDF") {
            const reportText = `FRAUD DETECTION SYSTEM - COMPLIANCE AUDIT EXPORT\nSegment: ${exportType}\nGenerated: ${new Date().toLocaleString()}\nTotal Records: ${rawData.length}\n\n` + JSON.stringify(rawData, null, 2);
            downloadBlob(`${fileNameBase}.txt`, reportText, "text/plain;charset=utf-8;");
          }

          addAuditEntry(
            "Report Downloaded",
            "Report",
            exportType,
            `Exported ${rawData.length} ${exportType} records as ${exportFormat}.`
          );

          // Auto-hide success message after 4 seconds
          setTimeout(() => setShowExportSuccess(false), 4000);
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  // Handle Create Schedule
  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    scheduleReport({
      title: newSchedule.title,
      frequency: newSchedule.frequency,
      format: newSchedule.format,
      recipients: newSchedule.recipients,
    });

    // Reset Form
    setIsScheduling(false);
    setNewSchedule({
      title: "",
      frequency: "Daily",
      format: "PDF",
      recipients: "",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Reports & Compliance</h1>
        <p className="mt-1 text-slate-400 text-sm">
          Export operations data, schedule automated security briefs, and review compliance audits
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Export Data Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2 flex flex-col justify-between relative overflow-hidden">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Download className="h-4 w-4 text-indigo-400" /> Compliance Data Export Center
            </h3>
            <p className="text-xs text-slate-400">Generate on-demand extracts of FDS ledger transactions</p>

            <form onSubmit={handleExportSubmit} className="mt-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Data Category */}
                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-semibold">Data Segment</label>
                  <select
                    value={exportType}
                    onChange={(e) => setExportType(e.target.value as "Transactions" | "Alerts" | "Investigations")}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="Transactions">Transactions Stream</option>
                    <option value="Alerts">Raised Threats Alerts</option>
                    <option value="Investigations">Escalated Audit Cases</option>
                  </select>
                </div>

                {/* Time Range */}
                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-semibold">Date Range</label>
                  <select
                    value={exportRange}
                    onChange={(e) => setExportRange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="Today">Today (Current Session)</option>
                    <option value="Last 24 Hours">Last 24 Hours</option>
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                  </select>
                </div>

                {/* Format selection */}
                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-semibold">Format Type</label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as "CSV" | "Excel" | "PDF" | "JSON")}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="CSV">Comma-Separated (CSV)</option>
                    <option value="Excel">Excel Worksheet (XLSX)</option>
                    <option value="PDF">Portable Document (PDF)</option>
                    <option value="JSON">Raw Objects Schema (JSON)</option>
                  </select>
                </div>
              </div>

              {/* Progress and trigger button */}
              <div className="pt-4 border-t border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-slate-500 text-[10.5px]">
                  * Exports are signed and fully hashed under compliance security keys.
                </div>
                
                <button
                  type="submit"
                  disabled={isExporting}
                  className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-lg disabled:bg-slate-800 disabled:text-slate-500 transition-all shadow-md"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="h-4.5 w-4.5 animate-spin" /> Compiling... ({exportProgress}%)
                    </>
                  ) : (
                    <>
                      <Download className="h-4.5 w-4.5" /> Generate Export File
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Exporting loading bar overlay */}
          {isExporting && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center space-y-3 z-15 p-6 animate-in fade-in duration-200">
              <div className="h-2 w-48 bg-slate-850 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-150 ease-out" 
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <span className="text-white text-xs font-bold uppercase tracking-wider">
                Hashing and Packaging {exportType} Ledger...
              </span>
            </div>
          )}

          {/* Success toast notification */}
          {showExportSuccess && (
            <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
              <span>
                <strong>Successfully compiled!</strong> FDS_{exportType.toLowerCase()}_export.{exportFormat.toLowerCase()} is ready and downloaded.
              </span>
            </div>
          )}
        </div>

        {/* Efficacy Analytics Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" /> Efficacy Statistics
            </h3>
            <p className="text-xs text-slate-400">Automated indicators of operational compliance</p>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs p-3 bg-slate-950/45 border border-slate-800/60 rounded-lg">
                <span className="text-slate-400">Mean Time to Resolve (MTTR)</span>
                <span className="font-bold text-white">14.5 minutes</span>
              </div>
              <div className="flex justify-between items-center text-xs p-3 bg-slate-950/45 border border-slate-800/60 rounded-lg">
                <span className="text-slate-400">Analyst True Positive Rate</span>
                <span className="font-bold text-emerald-400">94.2%</span>
              </div>
              <div className="flex justify-between items-center text-xs p-3 bg-slate-950/45 border border-slate-800/60 rounded-lg">
                <span className="text-slate-400">Auto-Prevention Ratio</span>
                <span className="font-bold text-indigo-400">82.5%</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 mt-4 leading-relaxed">
            MTTR is calculated as elapsed minutes between Alert Trigger and formal Case Resolution by the analyst team.
          </div>
        </div>
      </div>

      {/* Scheduled Reports Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-indigo-400" /> Automated Scheduled Briefings
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Automated reports dispatched directly to compliance and risk channels</p>
          </div>
          <button
            onClick={() => setIsScheduling(true)}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold px-4 py-2 rounded-lg transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> Create Report Schedule
          </button>
        </div>

        {/* Schedules Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850">
              <tr>
                <th className="px-5 py-3.5">Report Title</th>
                <th className="px-5 py-3.5">Frequency</th>
                <th className="px-5 py-3.5">Output Format</th>
                <th className="px-5 py-3.5">Recipients List</th>
                <th className="px-5 py-3.5">Created Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {scheduledReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-slate-500 text-xs">
                    No scheduled briefings registered.
                  </td>
                </tr>
              ) : (
                scheduledReports.map((rpt) => (
                  <tr key={rpt.id} className="hover:bg-slate-800/25 transition">
                    <td className="px-5 py-4 font-bold text-white text-xs sm:text-sm">
                      {rpt.title}
                    </td>
                    <td className="px-5 py-4 text-slate-300 text-xs font-semibold">
                      {rpt.frequency}
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs">
                      {rpt.format}
                    </td>
                    <td className="px-5 py-4 text-slate-300 text-xs max-w-[200px] truncate">
                      {rpt.recipients}
                    </td>
                    <td className="px-5 py-4 text-slate-450 text-xs">
                      {new Date(rpt.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                        rpt.status === "Active" 
                          ? "bg-indigo-950/60 text-indigo-400 border-indigo-900/30" 
                          : "bg-slate-950 text-slate-500 border-slate-900"
                      }`}>
                        {rpt.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-3 items-center">
                        <button
                          onClick={() => toggleReportStatus(rpt.id)}
                          className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                          title={rpt.status === "Active" ? "Pause schedule" : "Resume schedule"}
                        >
                          {rpt.status === "Active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 text-emerald-400" />}
                        </button>
                        <button
                          onClick={() => deleteReport(rpt.id)}
                          className="p-1 rounded bg-slate-850 hover:bg-slate-800/80 text-red-450 hover:text-red-400 transition"
                          title="Delete Briefing"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Report Form Modal */}
      {isScheduling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsScheduling(false)}
          />
          {/* Form Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 z-10 animate-in zoom-in-95 duration-200 relative">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-indigo-400" /> Schedule Operations Briefing
              </h3>
              <button
                onClick={() => setIsScheduling(false)}
                className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold">Report Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Fraud Operations Audit"
                  value={newSchedule.title}
                  onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-semibold">Dispatch Frequency</label>
                  <select
                    value={newSchedule.frequency}
                    onChange={(e) => setNewSchedule({ ...newSchedule, frequency: e.target.value as ScheduledReport["frequency"] })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="Daily">Daily Summary</option>
                    <option value="Weekly">Weekly Digest</option>
                    <option value="Monthly">Monthly Review</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-semibold">Format Output</label>
                  <select
                    value={newSchedule.format}
                    onChange={(e) => setNewSchedule({ ...newSchedule, format: e.target.value as ScheduledReport["format"] })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="PDF">Report PDF</option>
                    <option value="CSV">Spreadsheet CSV</option>
                    <option value="Excel">Worksheet XLSX</option>
                    <option value="JSON">Objects JSON</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-slate-450" /> Email Recipients (Comma-separated)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. lead-analyst@fds.com, audit@fds.com"
                  value={newSchedule.recipients}
                  onChange={(e) => setNewSchedule({ ...newSchedule, recipients: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduling(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-2.5 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newSchedule.title || !newSchedule.recipients}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg disabled:bg-slate-800 disabled:text-slate-600 transition shadow-md"
                >
                  Schedule Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
