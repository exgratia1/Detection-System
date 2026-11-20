import { useSystemState } from "../context/SystemStateContext";
import { AlertTriangle, Download, Power } from "lucide-react";

export default function SOSBanner() {
  const {
    isEmergencyLockdown,
    emergencyLockdownDetails,
    toggleEmergencyLockdown,
    exportEmergencySOSDossier,
  } = useSystemState();

  if (!isEmergencyLockdown) return null;

  return (
    <div className="bg-red-650 border-b border-red-700 text-white px-4 py-2.5 text-xs font-semibold shadow-xl z-50 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2.5">
        <span className="p-1 rounded bg-black/25 text-white animate-pulse flex-shrink-0">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="leading-tight">
          <span className="font-bold uppercase tracking-wider text-[11px] bg-black/30 px-2 py-0.5 rounded mr-2">
            DEFCON 1 ACTIVE
          </span>
          <span>
            EMERGENCY SOS CIRCUIT BREAKER ENGAGED: Automated 99% risk hold on all transactions &gt; ₦250,000.
          </span>
          {emergencyLockdownDetails && (
            <span className="hidden md:inline text-red-100 ml-1.5 opacity-90">
              (Authorized by {emergencyLockdownDetails.engagedBy})
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={exportEmergencySOSDossier}
          className="bg-black/30 hover:bg-black/50 text-white px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 border border-white/20"
        >
          <Download className="h-3 w-3" /> SOS Dossier
        </button>
        <button
          type="button"
          onClick={() => toggleEmergencyLockdown()}
          className="bg-white hover:bg-slate-100 text-red-700 hover:text-red-800 px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 shadow-sm"
        >
          <Power className="h-3 w-3" /> Deactivate
        </button>
      </div>
    </div>
  );
}
