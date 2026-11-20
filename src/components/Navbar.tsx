import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSystemState } from "../context/SystemStateContext";
import { 
  Settings, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  ChevronDown, 
  Search,
  FileText,
  AlertOctagon,
  Volume2,
  VolumeX,
  Bot,
  Radio
} from "lucide-react";

export default function FraudDetectionNavbar() {
  const { 
    alerts, 
    currentAnalyst, 
    updateCurrentAnalyst, 
    isEmergencyLockdown,
    isAudioMuted,
    toggleAudioMute
  } = useSystemState();
  const navigate = useNavigate();
  const activeAlertsCount = alerts.filter((a) => a.status === "Active" || a.status === "Investigating").length;

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  const avatarColorMap: Record<string, { bg: string; text: string; ring: string }> = {
    indigo: { bg: "bg-indigo-600/30", text: "text-indigo-300", ring: "ring-indigo-500/40" },
    emerald: { bg: "bg-emerald-600/30", text: "text-emerald-300", ring: "ring-emerald-500/40" },
    violet: { bg: "bg-violet-600/30", text: "text-violet-300", ring: "ring-violet-500/40" },
    rose: { bg: "bg-rose-600/30", text: "text-rose-300", ring: "ring-rose-500/40" },
    blue: { bg: "bg-blue-600/30", text: "text-blue-300", ring: "ring-blue-500/40" },
    amber: { bg: "bg-amber-600/30", text: "text-amber-300", ring: "ring-amber-500/40" },
  };

  const avatarStyles = avatarColorMap[currentAnalyst.avatarColor] || avatarColorMap.indigo;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/80 font-bold text-white shadow-md">
              FDS
            </div>
            <NavLink
              to="/dashboard"
              className="text-xl font-semibold tracking-tight text-white hover:text-indigo-400 transition-colors"
            >
              FraudDetection System
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-1 lg:gap-2">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-slate-800 text-white font-semibold"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/live"
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? "bg-slate-800 text-white font-semibold"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`
              }
            >
              Live
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </NavLink>

            <NavLink
              to="/alerts"
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? "bg-slate-800 text-white font-semibold"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`
              }
            >
              Alerts
              {activeAlertsCount > 0 && (
                <span className="bg-red-500/30 text-red-400 text-xs px-2 py-0.5 rounded-full ring-1 ring-red-500/40 animate-pulse">
                  {activeAlertsCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/investigations"
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-slate-800 text-white font-semibold"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`
              }
            >
              Investigations
            </NavLink>

            <NavLink
              to="/rules"
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-slate-800 text-white font-semibold"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`
              }
            >
              Rules
            </NavLink>
          </div>

          {/* Right side – Search + Profile */}
          <div className="hidden md:flex md:items-center md:gap-4">
            {/* Quick search button linking to Command Palette */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("fds:open-command-palette"))}
              className="flex items-center justify-between w-60 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition group shadow-inner"
              title="Global search (Ctrl + K)"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                <span className="truncate">Search system...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded shadow-sm">
                <span>Ctrl</span>
                <span>K</span>
              </kbd>
            </button>

            {/* Sentinel AI Forensic Copilot Trigger */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("fds:open-ai-copilot"))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition bg-gradient-to-tr from-indigo-950/80 to-purple-950/80 hover:from-indigo-900 hover:to-purple-900 border border-indigo-700/50 text-indigo-200 hover:text-white shadow-sm"
              title="Sentinel AI Forensic Copilot"
            >
              <Bot className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden lg:inline">AI Copilot</span>
            </button>

            {/* SOC War Room Wall Monitor Trigger */}
            <NavLink
              to="/war-room"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 text-slate-300 hover:text-white shadow-sm"
              title="Physical SOC War Room Wall Monitor"
            >
              <Radio className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
              <span className="hidden lg:inline">War Room</span>
            </NavLink>

            {/* Emergency Response SOS Circuit Breaker Button */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("fds:open-sos-modal"))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                isEmergencyLockdown
                  ? "bg-red-650 hover:bg-red-600 text-white animate-pulse border border-red-500 shadow-red-950/50"
                  : "bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 hover:border-red-600 text-red-300 hover:text-white"
              }`}
              title="Emergency Response & Circuit Breaker (SOS)"
            >
              <AlertOctagon className={`h-3.5 w-3.5 ${isEmergencyLockdown ? "text-white" : "text-red-400"}`} />
              <span>{isEmergencyLockdown ? "SOS ACTIVE" : "SOS"}</span>
            </button>

            {/* Audio Alert Chime Mute/Unmute Quick Toggle */}
            <button
              type="button"
              onClick={toggleAudioMute}
              className={`flex items-center justify-center h-8 w-8 rounded-lg border transition shadow-sm ${
                isAudioMuted
                  ? "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                  : "bg-indigo-950/40 border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/60 hover:text-white"
              }`}
              title={isAudioMuted ? "Unmute Audio Alert Chimes" : "Mute Audio Alert Chimes (Active)"}
              aria-label={isAudioMuted ? "Unmute Audio Alert Chimes" : "Mute Audio Alert Chimes"}
            >
              {isAudioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            {/* Profile Avatar & Interactive Popover */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-2.5 rounded-full p-1 pl-1.5 pr-2.5 border transition-all ${
                  isProfileOpen 
                    ? "bg-slate-800 border-indigo-500/60 shadow-md" 
                    : "bg-slate-900/80 hover:bg-slate-800 border-slate-800"
                }`}
                aria-label="Open analyst profile menu"
                aria-expanded={isProfileOpen}
              >
                <div className="relative">
                  <div className={`h-8 w-8 rounded-full ${avatarStyles.bg} ring-1 ${avatarStyles.ring} flex items-center justify-center ${avatarStyles.text} font-bold text-sm shadow-inner`}>
                    {currentAnalyst.name ? currentAnalyst.name.charAt(0).toUpperCase() : "A"}
                  </div>
                  <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-950 ${
                    currentAnalyst.status === "Active" 
                      ? "bg-emerald-500" 
                      : currentAnalyst.status === "Away" 
                        ? "bg-amber-500" 
                        : "bg-slate-500"
                  }`} />
                </div>
                <div className="text-left text-xs">
                  <span className="block font-semibold text-white leading-tight truncate max-w-[90px]">
                    {currentAnalyst.name}
                  </span>
                  <span className="block text-[10px] text-slate-400 leading-tight">
                    {currentAnalyst.role.split(" ")[0]}
                  </span>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isProfileOpen ? "rotate-180 text-white" : ""}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Analyst Card Header */}
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                    <div className={`h-11 w-11 rounded-full ${avatarStyles.bg} ring-1 ${avatarStyles.ring} flex items-center justify-center ${avatarStyles.text} font-bold text-lg`}>
                      {currentAnalyst.name ? currentAnalyst.name.charAt(0).toUpperCase() : "A"}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-white truncate">{currentAnalyst.name}</h4>
                        <span className={`h-2 w-2 rounded-full ${
                          currentAnalyst.status === "Active" 
                            ? "bg-emerald-500" 
                            : currentAnalyst.status === "Away" 
                              ? "bg-amber-500" 
                              : "bg-slate-500"
                        }`} />
                      </div>
                      <p className="text-xs text-slate-400 truncate">{currentAnalyst.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">
                        {currentAnalyst.role}
                      </span>
                    </div>
                  </div>

                  {/* Metadata preview */}
                  <div className="py-2.5 border-b border-slate-800/60 space-y-1.5 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{currentAnalyst.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{currentAnalyst.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{currentAnalyst.timezone}</span>
                    </div>
                  </div>

                  {/* Quick Status Selector */}
                  <div className="pt-2.5 pb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Analyst Availability
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => updateCurrentAnalyst({ status: "Active" })}
                        className={`flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-semibold border transition ${
                          currentAnalyst.status === "Active"
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active
                      </button>
                      <button
                        onClick={() => updateCurrentAnalyst({ status: "Away" })}
                        className={`flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-semibold border transition ${
                          currentAnalyst.status === "Away"
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Away
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 space-y-1">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate("/settings");
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition"
                    >
                      <Settings className="h-4 w-4 text-indigo-400" />
                      <span>Edit Profile & System Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate("/audit");
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition"
                    >
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span>My Audit Logs</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-slate-800/60 text-slate-300 hover:text-white"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  isMobileOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h7"
                }
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95">
          {/* Mobile profile card */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full ${avatarStyles.bg} ring-1 ${avatarStyles.ring} flex items-center justify-center ${avatarStyles.text} font-bold text-sm`}>
                {currentAnalyst.name ? currentAnalyst.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div>
                <span className="font-bold text-white text-sm block leading-tight">{currentAnalyst.name}</span>
                <span className="text-xs text-slate-400 block">{currentAnalyst.role}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setIsMobileOpen(false);
                navigate("/settings");
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition"
            >
              Settings
            </button>
          </div>

          <div className="px-4 py-3 space-y-1">
            {/* Mobile SOS Trigger */}
            <button
              type="button"
              onClick={() => {
                setIsMobileOpen(false);
                window.dispatchEvent(new CustomEvent("fds:open-sos-modal"));
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-bold mb-2 transition ${
                isEmergencyLockdown
                  ? "bg-red-650 text-white animate-pulse shadow-md"
                  : "bg-red-950/40 border border-red-800/60 text-red-300 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertOctagon className="h-4 w-4" />
                <span>Emergency Response (SOS)</span>
              </div>
              <span className="text-[10px] uppercase font-extrabold bg-black/40 px-2 py-0.5 rounded">
                {isEmergencyLockdown ? "DEFCON 1" : "STANDBY"}
              </span>
            </button>

            {/* Mobile Audio Mute Toggle */}
            <button
              type="button"
              onClick={toggleAudioMute}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium mb-2 transition border ${
                isAudioMuted
                  ? "bg-slate-900/60 border-slate-800 text-slate-400"
                  : "bg-indigo-950/40 border-indigo-800/60 text-indigo-300"
              }`}
            >
              <div className="flex items-center gap-2">
                {isAudioMuted ? <VolumeX className="h-4 w-4 text-slate-500" /> : <Volume2 className="h-4 w-4 text-indigo-400" />}
                <span>Acoustic Alerts</span>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                isAudioMuted ? "bg-slate-800 text-slate-400" : "bg-indigo-500/20 text-indigo-300"
              }`}>
                {isAudioMuted ? "MUTED" : "ENABLED"}
              </span>
            </button>

            {/* Mobile AI Copilot Trigger */}
            <button
              type="button"
              onClick={() => {
                setIsMobileOpen(false);
                window.dispatchEvent(new CustomEvent("fds:open-ai-copilot"));
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-indigo-200 bg-indigo-950/40 border border-indigo-800/60 mb-2 transition"
            >
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-indigo-400" />
                <span>Sentinel AI Copilot</span>
              </div>
              <span className="text-[10px] bg-indigo-900/80 px-2 py-0.5 rounded text-indigo-300 font-bold uppercase">
                NEURAL
              </span>
            </button>

            {/* Mobile War Room Link */}
            <NavLink
              to="/war-room"
              onClick={() => setIsMobileOpen(false)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-rose-300 bg-rose-950/30 border border-rose-900/50 mb-2 transition"
            >
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-rose-400 animate-pulse" />
                <span>SOC War Room Wall Monitor</span>
              </div>
              <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded font-bold uppercase border border-rose-800">
                LIVE HUD
              </span>
            </NavLink>

            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => {
                setIsMobileOpen(false);
                window.dispatchEvent(new CustomEvent("fds:open-command-palette"));
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-slate-300 bg-slate-900 border border-slate-800 mb-2"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-indigo-400" />
                <span>Search Command Hub...</span>
              </div>
              <span className="text-[10px] bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                Ctrl+K
              </span>
            </button>

            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800/60"
                }`
              }
              onClick={() => setIsMobileOpen(false)}
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/live"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800/60"
                }`
              }
              onClick={() => setIsMobileOpen(false)}
            >
              Live Monitoring
            </NavLink>

            <NavLink
              to="/alerts"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium flex items-center justify-between ${
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800/60"
                }`
              }
              onClick={() => setIsMobileOpen(false)}
            >
              <span>Alerts</span>
              {activeAlertsCount > 0 && (
                <span className="bg-red-500/30 text-red-400 text-xs px-2 py-0.5 rounded-full ring-1 ring-red-500/40">
                  {activeAlertsCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/investigations"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800/60"
                }`
              }
              onClick={() => setIsMobileOpen(false)}
            >
              Investigations
            </NavLink>

            <NavLink
              to="/rules"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800/60"
                }`
              }
              onClick={() => setIsMobileOpen(false)}
            >
              Rules
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800/60"
                }`
              }
              onClick={() => setIsMobileOpen(false)}
            >
              System Settings & Profile
            </NavLink>
          </div>
        </div>
      )}
    </nav>
  );
}
