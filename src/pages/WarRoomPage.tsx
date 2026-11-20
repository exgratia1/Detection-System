import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSystemState } from "../context/SystemStateContext";
import ThreatMap from "../components/ThreatMap";
import { 
  Radio, 
  ShieldAlert, 
  Activity, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  Maximize, 
  Minimize, 
  Flame, 
  Zap
} from "lucide-react";

export default function WarRoomPage() {
  const { 
    transactions, 
    alerts, 
    blacklistedUsers, 
    isEmergencyLockdown, 
    isAudioMuted, 
    toggleAudioMute, 
    toggleEmergencyLockdown 
  } = useSystemState();

  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [lagosTime, setLagosTime] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live clocks
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-GB", { hour12: false }));
      setLagosTime(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Africa/Lagos",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(now)
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalVolumeMonitored = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.amount, 0) + 128500000;
  }, [transactions]);

  const blockedCount = useMemo(() => {
    return transactions.filter(t => t.status === "blocked").length + 18;
  }, [transactions]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 overflow-hidden relative select-none font-sans">
      {/* Background cybernetic grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0284c70a_1px,transparent_1px),linear-gradient(to_bottom,#0284c70a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Top Operations Telemetry Header */}
      <header className="relative z-10 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:px-6 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
        {/* Left: Branding & DEFCON Status */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
            title="Return to standard dashboard view"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Exit War Room</span>
          </button>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-650 text-white animate-pulse shadow-lg shadow-red-950/60">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-wider text-white uppercase font-mono">
                  SENTINEL DEFENSE CENTER // SOC WAR ROOM
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono border ${
                  isEmergencyLockdown 
                    ? "bg-red-500/30 text-red-200 border-red-500 animate-pulse shadow-lg shadow-red-950" 
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                }`}>
                  {isEmergencyLockdown ? "DEFCON 1 ACTIVE" : "DEFCON 5 NORMAL"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Physical Wall Monitor Display • Sector: West Africa Financial Corridor
              </p>
            </div>
          </div>
        </div>

        {/* Right: Operational Clocks & Global Audio / Lockdown Controls */}
        <div className="flex items-center gap-3">
          {/* Synchronized Clocks */}
          <div className="hidden md:flex items-center gap-3 bg-slate-950 border border-slate-800 px-3.5 py-1.5 rounded-xl font-mono text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Lagos (WAT)</span>
              <span className="font-bold text-indigo-300">{lagosTime || "00:00:00"}</span>
            </div>
            <div className="h-5 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">UTC System</span>
              <span className="font-bold text-slate-300">{currentTime || "00:00:00"}</span>
            </div>
          </div>

          {/* Audio Chime Mute */}
          <button
            type="button"
            onClick={toggleAudioMute}
            className={`p-2.5 rounded-xl border transition shadow-sm ${
              isAudioMuted
                ? "bg-slate-950 border-slate-800 text-slate-500"
                : "bg-indigo-950/60 border-indigo-700/60 text-indigo-300 shadow-indigo-950/50"
            }`}
            title={isAudioMuted ? "Unmute Acoustic Alerts" : "Mute Acoustic Alerts"}
          >
            {isAudioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {/* Emergency SOS Lockdown Quick Switch */}
          <button
            type="button"
            onClick={() => toggleEmergencyLockdown("DEFCON 1 engaged from Physical SOC War Room")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase font-mono tracking-wider transition shadow-md ${
              isEmergencyLockdown
                ? "bg-red-650 hover:bg-red-600 text-white animate-pulse border border-red-400"
                : "bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-300"
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>{isEmergencyLockdown ? "DEACTIVATE SOS" : "ENGAGE SOS"}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Mission Matrix Body */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 my-5 flex-1 items-stretch">
        {/* Left Column: Mission Telemetry & Counters (3 cols) */}
        <div className="lg:col-span-3 flex flex-col justify-between gap-4">
          {/* Telemetry Counter Cards */}
          <div className="space-y-3.5">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl">
              <span className="text-[10.5px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center justify-between">
                <span>Monitored Daily Volume</span>
                <Activity className="h-3.5 w-3.5 text-indigo-400" />
              </span>
              <span className="text-2xl font-black text-white mt-1 block font-mono">
                ₦{totalVolumeMonitored.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Settlement Feed Active
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl">
              <span className="text-[10.5px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center justify-between">
                <span>Intercepted Threat Blocks</span>
                <Flame className="h-3.5 w-3.5 text-red-400" />
              </span>
              <span className="text-2xl font-black text-red-400 mt-1 block font-mono">
                {blockedCount} Incidents
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Automatic Circuit Breaker Interception
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl">
              <span className="text-[10.5px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center justify-between">
                <span>Active Sanction Watchlist</span>
                <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              </span>
              <span className="text-2xl font-black text-amber-300 mt-1 block font-mono">
                {blacklistedUsers.length} Entities
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Synchronized across all clearing nodes
              </span>
            </div>
          </div>

          {/* Sweeping Radar Cyber HUD */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
            <span className="text-[10.5px] uppercase font-bold text-slate-400 font-mono tracking-wider w-full text-left mb-2 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-indigo-400" /> Sector Cyber Radar
            </span>

            <div className="relative w-44 h-44 rounded-full border border-indigo-500/30 flex items-center justify-center bg-slate-950/80 my-2">
              <div className="w-32 h-32 rounded-full border border-indigo-500/20" />
              <div className="w-20 h-20 rounded-full border border-indigo-500/25" />
              <div className="w-8 h-8 rounded-full border border-indigo-500/40" />

              {/* Crosshair lines */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-px bg-indigo-500/20" />
                <div className="h-full w-px bg-indigo-500/20 absolute" />
              </div>

              {/* Sweeping Radar Needle */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: "conic-gradient(from 0deg, transparent 0deg, transparent 280deg, rgba(99, 102, 241, 0.45) 360deg)",
                  animation: "spin 3s linear infinite",
                }}
              />

              {/* Blinking Target Dots */}
              <span className="absolute top-8 left-12 h-2 w-2 rounded-full bg-red-400 animate-ping" />
              <span className="absolute bottom-10 right-10 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="absolute top-14 right-12 h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>

            <span className="text-[10px] font-mono text-indigo-300 mt-1">
              SCANNING SECTOR 04 // LAGOS HUB
            </span>
          </div>
        </div>

        {/* Center: Live Geographic Threat Map (9 cols) */}
        <div className="lg:col-span-9 flex flex-col justify-between">
          <ThreatMap />
        </div>
      </div>

      {/* Bottom Live Streaming Threat Incident Ticker */}
      <footer className="relative z-10 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 px-5 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase font-mono tracking-wider flex-shrink-0">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
          <span>LIVE INCIDENT STREAM:</span>
        </div>

        {/* Scrolling Incident Ticker */}
        <div className="flex-1 overflow-hidden whitespace-nowrap text-xs font-mono text-slate-300">
          <div className="inline-flex gap-8 animate-marquee">
            {alerts.slice(0, 8).map(a => (
              <span key={a.id} className="inline-flex items-center gap-1.5">
                <span className="text-red-400 font-bold">[{a.id}]</span>
                <span className="text-white font-semibold">{a.type}</span>
                <span className="text-slate-400">({a.user})</span>
                <span className="text-amber-400 font-bold">{a.amount}</span>
                <span className="text-slate-600">•</span>
              </span>
            ))}
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-500 flex-shrink-0 hidden md:block">
          STATUS: <span className="text-emerald-400 font-bold">ONLINE</span> • CHANNEL: SECURE
        </div>
      </footer>
    </div>
  );
}
