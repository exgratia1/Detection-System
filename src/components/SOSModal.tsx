import { useState, useEffect } from "react";
import { useSystemState } from "../context/SystemStateContext";
import { 
  AlertOctagon, 
  AlertTriangle, 
  ShieldCheck, 
  X, 
  Download, 
  Power, 
  Lock, 
  CheckCircle,
  FileText
} from "lucide-react";

export default function SOSModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const {
    isEmergencyLockdown,
    emergencyLockdownDetails,
    toggleEmergencyLockdown,
    exportEmergencySOSDossier,
    currentAnalyst,
  } = useSystemState();

  useEffect(() => {
    const handleOpen = () => {
      setReason("");
      setFeedback(null);
      setIsOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("fds:open-sos-modal", handleOpen);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("fds:open-sos-modal", handleOpen);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    toggleEmergencyLockdown(reason.trim() || undefined);
    if (!isEmergencyLockdown) {
      setFeedback("EMERGENCY DEFCON 1 LOCKDOWN ACTIVATED. Automated hold engaged on all transactions > ₦250,000.");
    } else {
      setFeedback("Emergency lockdown disengaged. Standard rules and thresholds restored.");
    }
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const handleExport = () => {
    exportEmergencySOSDossier();
    setFeedback("Official Emergency SOS Regulatory Package compiled and downloaded.");
    setTimeout(() => {
      setFeedback(null);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsOpen(false)} 
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isEmergencyLockdown 
                ? "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse" 
                : "bg-amber-500/15 border-amber-500/30 text-amber-400"
            }`}>
              <AlertOctagon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Emergency Response & Circuit Breaker (SOS)</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                  isEmergencyLockdown 
                    ? "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse" 
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                }`}>
                  {isEmergencyLockdown ? "DEFCON 1 ACTIVE" : "STANDBY"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Central Bank AML / Rapid Incident Response protocol for severe system threats
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div className="mt-4 p-3 bg-indigo-500/15 border border-indigo-500/30 rounded-xl text-xs text-indigo-200 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-indigo-400 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="space-y-5 my-5 text-xs">
          
          {/* Status Overview Card */}
          <div className={`p-4 rounded-xl border ${
            isEmergencyLockdown
              ? "bg-red-950/30 border-red-800/60 text-red-200"
              : "bg-slate-950/50 border-slate-800 text-slate-300"
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                {isEmergencyLockdown ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-400 animate-pulse" />
                    Emergency Lockdown Engaged
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Standard Defensive Posture Active
                  </>
                )}
              </span>
              <span className="text-[11px] text-slate-400">
                Authorizing Analyst: <strong className="text-slate-200">{currentAnalyst.name}</strong>
              </span>
            </div>

            {isEmergencyLockdown && emergencyLockdownDetails && (
              <div className="mt-3 pt-3 border-t border-red-900/40 text-[11px] space-y-1">
                <div><strong>Activated At:</strong> {new Date(emergencyLockdownDetails.engagedAt).toLocaleString()}</div>
                <div><strong>Enforced By:</strong> {emergencyLockdownDetails.engagedBy}</div>
                <div><strong>Justification:</strong> {emergencyLockdownDetails.reason}</div>
              </div>
            )}

            {!isEmergencyLockdown && (
              <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                Engaging the emergency circuit breaker immediately enforces a 99% risk override and automated block on all simulated and live transactions exceeding ₦250,000, preventing capital drain during coordinated zero-day attacks.
              </p>
            )}
          </div>

          {/* Reason Input (When entering lockdown) */}
          {!isEmergencyLockdown && (
            <div className="space-y-1.5">
              <label className="block text-slate-400 font-semibold">Emergency Justification / Incident Reference</label>
              <textarea
                rows={2}
                placeholder="e.g. Coordinated synthetic identity surge and international proxy velocity anomaly detected across multiple accounts."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-red-500"
              />
            </div>
          )}

          {/* Defensive Posture Specs */}
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
              <span className="text-slate-400 block font-semibold flex items-center gap-1.5 mb-1">
                <Lock className="h-3.5 w-3.5 text-indigo-400" /> Circuit Threshold
              </span>
              <span className="text-white font-bold">₦250,000 Max Cap</span>
              <p className="text-slate-500 text-[10px] mt-0.5">Transactions exceeding limit are held immediately</p>
            </div>
            <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
              <span className="text-slate-400 block font-semibold flex items-center gap-1.5 mb-1">
                <FileText className="h-3.5 w-3.5 text-amber-400" /> Regulatory Protocol
              </span>
              <span className="text-white font-bold">CBN / NFIU STR Compatible</span>
              <p className="text-slate-500 text-[10px] mt-0.5">All actions appended as cryptographic audit ledger</p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleExport}
            className="flex-1 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            <Download className="h-3.5 w-3.5 text-indigo-400" /> Download SOS Dossier
          </button>

          <button
            type="button"
            onClick={handleToggle}
            className={`flex-1 text-xs font-bold py-2.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 ${
              isEmergencyLockdown
                ? "bg-slate-800 hover:bg-slate-750 border border-slate-700 text-emerald-400"
                : "bg-red-600 hover:bg-red-550 text-white shadow-red-950/50"
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            {isEmergencyLockdown ? "Deactivate Lockdown" : "Engage Emergency Lockdown"}
          </button>
        </div>
      </div>
    </div>
  );
}
