// src/components/Sidebar.tsx
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useSystemState } from "../context/SystemStateContext";

export default function FraudDetectionSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { alerts, currentAnalyst } = useSystemState();
  const activeAlertsCount = alerts.filter((a) => a.status === "Active" || a.status === "Investigating").length;

  const avatarColorMap: Record<string, { bg: string; text: string; ring: string }> = {
    indigo: { bg: "bg-indigo-600/30", text: "text-indigo-300", ring: "ring-indigo-500/40" },
    emerald: { bg: "bg-emerald-600/30", text: "text-emerald-300", ring: "ring-emerald-500/40" },
    violet: { bg: "bg-violet-600/30", text: "text-violet-300", ring: "ring-violet-500/40" },
    rose: { bg: "bg-rose-600/30", text: "text-rose-300", ring: "ring-rose-500/40" },
    blue: { bg: "bg-blue-600/30", text: "text-blue-300", ring: "ring-blue-500/40" },
    amber: { bg: "bg-amber-600/30", text: "text-amber-300", ring: "ring-amber-500/40" },
  };

  const avatarStyles = avatarColorMap[currentAnalyst.avatarColor] || avatarColorMap.indigo;

  const navItems = [
    { name: "Dashboard", to: "/dashboard", icon: "🏠", end: true },
    { name: "Live Monitoring", to: "/live", icon: "👁️" },
    {
      name: "Alerts",
      to: "/alerts",
      icon: "🔔",
      badge: activeAlertsCount > 0 ? (
        <span className="bg-red-500/30 text-red-400 text-xs px-2 py-0.5 rounded-full ring-1 ring-red-500/40 animate-pulse">
          {activeAlertsCount}
        </span>
      ) : undefined,
    },
    { name: "Investigations", to: "/investigations", icon: "🔍" },
    { name: "Rules & Models", to: "/rules", icon: "⚙️" },
    { name: "Reports & Analytics", to: "/reports", icon: "📊" },
    { name: "SOC War Room", to: "/war-room", icon: "📡" },
    {
      name: "API & Integrations",
      to: "/integrations",
      icon: "🔗",
      section: true,
    },
    { name: "Audit Log", to: "/audit", icon: "📜", section: true },
    { name: "Settings & Profile", to: "/settings", icon: "⚙️", section: true },
  ];

  return (
    <>
      {/* Mobile toggle button – floating style matching navbar feel */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 md:hidden p-4 rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-500 transition-all duration-200"
        aria-label="Open navigation menu"
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
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Sidebar / Drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:w-64 lg:w-72 flex-shrink-0
        `}
      >
        <div className="flex h-full flex-col">
          {/* Header – matches navbar logo style */}
          <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600/80 font-bold text-white shadow-md">
                FDS
              </div>
              <span className="text-lg font-semibold tracking-tight text-white">
                FraudDetection System
              </span>
            </div>

            {/* Close button – mobile only */}
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden text-slate-400 hover:text-white focus:outline-none transition-colors"
              aria-label="Close navigation"
            >
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation links – consistent with navbar */}
          <nav className="flex-1 overflow-y-auto px-3 py-6">
            <ul className="space-y-1.5">
              {navItems.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={() => setIsOpen(false)} // close on mobile when clicking link
                    className={({ isActive }) =>
                      `flex items-center justify-between gap-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-slate-800 text-white font-semibold shadow-sm"
                          : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                      } ${item.section ? "mt-6 border-t border-slate-800 pt-5" : ""}`
                    }
                  >
                    <div className="flex items-center gap-x-3">
                      <span className="h-5 w-5 text-slate-400 flex items-center justify-center text-lg">
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span className="flex items-center">{item.badge}</span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer – quick user info, dynamic analyst info & link to settings */}
          <div className="border-t border-slate-800 p-4">
            <NavLink
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-900/80 border border-transparent hover:border-slate-800 transition-all group"
              title="View & Edit Analyst Profile"
            >
              <div className="relative flex-shrink-0">
                <div className={`h-10 w-10 rounded-full ${avatarStyles.bg} ring-1 ${avatarStyles.ring} flex items-center justify-center ${avatarStyles.text} font-bold text-base shadow-inner`}>
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
              <div className="overflow-hidden flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                    {currentAnalyst.name}
                  </p>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider group-hover:text-slate-400">
                    Edit
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">{currentAnalyst.role}</p>
              </div>
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Mobile backdrop – subtle blur matching navbar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
