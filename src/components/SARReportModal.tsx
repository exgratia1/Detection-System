import { useState, useEffect } from "react";
import { useSystemState, type InvestigationCase, type Alert } from "../context/SystemStateContext";
import { generatePrintableSARDossier, type SARReportPayload } from "../utils/sarExporter";
import { downloadAsJSON } from "../utils/exportHelpers";
import { 
  X, 
  Printer, 
  Download, 
  Scale, 
  CheckCircle2, 
  Building2 
} from "lucide-react";

export default function SARReportModal() {
  const { currentAnalyst, transactions, emergencyLockdownDetails, addAuditEntry } = useSystemState();
  const [isOpen, setIsOpen] = useState(false);
  const [targetCase, setTargetCase] = useState<InvestigationCase | null>(null);
  const [targetAlert, setTargetAlert] = useState<Alert | null>(null);
  const [agencyRecipient, setAgencyRecipient] = useState<"NFIU" | "CBN" | "EFCC" | "FATF">("NFIU");
  const [targetUser, setTargetUser] = useState("user_8492");
  const [disputedAmount, setDisputedAmount] = useState<number>(1450000);
  const [violationReason, setViolationReason] = useState("High-Velocity Structuring & Anomaly Breach");
  const [recommendedAction, setRecommendedAction] = useState("Immediate Account Freeze & Law Enforcement Referral");
  const [analystNarrative, setAnalystNarrative] = useState(
    "Target entity engaged in rapid succession of high-value inter-bank transfers through suspicious proxy gateways. Transaction velocity breached internal risk thresholds by 320%. Recommend immediate regulatory asset freeze pursuant to NFIU AML/CFT Section 14 guidelines."
  );
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    function handleOpen(event: Event) {
      const customEvent = event as CustomEvent<{
        caseItem?: InvestigationCase;
        alertItem?: Alert;
        userId?: string;
        amount?: number;
      }>;
      if (customEvent.detail?.caseItem) {
        const c = customEvent.detail.caseItem;
        setTargetCase(c);
        setTargetUser(c.userId);
        setDisputedAmount(c.amount);
        setViolationReason(c.description);
        setAnalystNarrative(
          `Case ${c.id}: ${c.description}\n\nInvestigator Notes:\n${c.notes.map(n => `- [${n.author}] ${n.text}`).join("\n")}`
        );
      } else if (customEvent.detail?.alertItem) {
        const a = customEvent.detail.alertItem;
        setTargetAlert(a);
        setTargetUser(a.user);
        const parsed = parseFloat(a.amount.replace(/[^0-9.]/g, "")) || 0;
        setDisputedAmount(parsed);
        setViolationReason(a.reason);
        setAnalystNarrative(`Incident Alert ${a.id} (${a.type}): ${a.reason}. Triggered at ${a.time}.`);
      } else if (customEvent.detail?.userId) {
        setTargetUser(customEvent.detail.userId);
        if (customEvent.detail.amount) setDisputedAmount(customEvent.detail.amount);
      }
      setIsSuccess(false);
      setIsOpen(true);
    }

    window.addEventListener("fds:open-sar-modal", handleOpen);
    return () => window.removeEventListener("fds:open-sar-modal", handleOpen);
  }, []);

  if (!isOpen) return null;

  const handleGeneratePDF = () => {
    const reportRef = `SAR-NFIU-${Math.floor(Math.random() * 900000 + 100000)}`;
    const matchedTxns = transactions.filter(t => t.userId === targetUser);

    const payload: SARReportPayload = {
      reportRef,
      generatedAt: new Date().toISOString(),
      agencyRecipient,
      reportingAnalyst: currentAnalyst,
      lockdownDetails: emergencyLockdownDetails,
      targetCase,
      targetAlert,
      targetUser,
      disputedAmountNaira: disputedAmount,
      violationReason,
      recommendedAction,
      interceptedTransactions: matchedTxns.length > 0 ? matchedTxns : transactions.slice(0, 5),
      analystNarrative,
    };

    generatePrintableSARDossier(payload);
    addAuditEntry(
      "SAR Regulatory Dossier Generated",
      "Report",
      reportRef,
      `Analyst generated official ${agencyRecipient} Suspicious Activity Report for ${targetUser}. Disputed volume: ₦${disputedAmount.toLocaleString()}.`
    );
    setIsSuccess(true);
  };

  const handleDownloadJSON = () => {
    const reportRef = `SAR-NFIU-${Math.floor(Math.random() * 900000 + 100000)}`;
    const matchedTxns = transactions.filter(t => t.userId === targetUser);
    const payload = {
      regulatoryHeader: {
        classification: "RESTRICTED // AML REGULATORY FILING",
        referenceId: reportRef,
        agencyRecipient,
        filingStation: currentAnalyst.location,
        leadInvestigator: `${currentAnalyst.name} (${currentAnalyst.role})`,
        timestamp: new Date().toISOString(),
      },
      targetProfile: {
        userId: targetUser,
        disputedVolumeNaira: disputedAmount,
        violationReason,
        recommendedAction,
      },
      analystNarrative,
      interceptedEvidence: matchedTxns,
    };

    downloadAsJSON(`${reportRef}_DOSSIER.json`, [payload]);
    addAuditEntry(
      "SAR JSON Payload Exported",
      "Report",
      reportRef,
      `Analyst exported raw SAR JSON package for ${targetUser}.`
    );
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Official Regulatory SAR Dossier Generator
                </h3>
                <span className="text-[10px] font-bold uppercase bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded">
                  CBN / NFIU SAR
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate authentic regulatory Suspicious Activity Reports for statutory law enforcement submission
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success feedback */}
        {isSuccess && (
          <div className="my-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>Official SAR regulatory filing generated and audit trail recorded.</span>
          </div>
        )}

        {/* Form Body */}
        <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-1 text-xs">
          {/* Recipient Authority */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-indigo-400" /> Statutory Regulatory Recipient
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["NFIU", "CBN", "EFCC", "FATF"] as const).map((agency) => (
                <button
                  key={agency}
                  type="button"
                  onClick={() => setAgencyRecipient(agency)}
                  className={`p-2.5 rounded-xl border text-center transition font-bold ${
                    agencyRecipient === agency
                      ? "bg-red-950/60 border-red-500 text-red-200 shadow-sm"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span className="block text-sm">{agency}</span>
                  <span className="block text-[9.5px] font-normal text-slate-500 mt-0.5">
                    {agency === "NFIU" ? "Intelligence Unit" : agency === "CBN" ? "Supervision" : agency === "EFCC" ? "Enforcement" : "Global FATF"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Target & Disputed Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-slate-400 font-semibold text-[11px]">Subject User / Entity ID</label>
              <input
                type="text"
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-red-500 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-400 font-semibold text-[11px]">Total Intercepted Amount (₦ NGN)</label>
              <input
                type="number"
                value={disputedAmount}
                onChange={(e) => setDisputedAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-red-500 font-mono font-bold"
              />
            </div>
          </div>

          {/* Violation Classification */}
          <div className="space-y-1">
            <label className="block text-slate-400 font-semibold text-[11px]">Statutory Violation Classification</label>
            <input
              type="text"
              value={violationReason}
              onChange={(e) => setViolationReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-red-500"
            />
          </div>

          {/* Recommended Enforcement Action */}
          <div className="space-y-1">
            <label className="block text-slate-400 font-semibold text-[11px]">Recommended Punitive / Enforcement Action</label>
            <select
              value={recommendedAction}
              onChange={(e) => setRecommendedAction(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-red-500"
            >
              <option value="Immediate Account Freeze & Law Enforcement Referral">Immediate Account Freeze & Law Enforcement Referral</option>
              <option value="Swift International Wire Recall & Asset Seizure">Swift International Wire Recall & Asset Seizure</option>
              <option value="Enhanced Ongoing AML Transaction Surveillance">Enhanced Ongoing AML Transaction Surveillance</option>
              <option value="Entity Sanction Blacklist & Global Inter-Bank Ban">Entity Sanction Blacklist & Global Inter-Bank Ban</option>
            </select>
          </div>

          {/* Investigator Narrative */}
          <div className="space-y-1">
            <label className="block text-slate-400 font-semibold text-[11px]">Lead Investigator Narrative & Findings</label>
            <textarea
              rows={4}
              value={analystNarrative}
              onChange={(e) => setAnalystNarrative(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-red-500 leading-relaxed font-sans"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            Filing Officer: <span className="text-slate-300 font-semibold">{currentAnalyst.name}</span> • Station: <span className="text-slate-300 font-semibold">{currentAnalyst.location}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDownloadJSON}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>JSON Payload</span>
            </button>

            <button
              type="button"
              onClick={handleGeneratePDF}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg shadow-red-950/50"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Generate Official PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
