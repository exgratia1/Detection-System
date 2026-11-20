import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSystemState } from "../context/SystemStateContext";
import {
  Search,
  LayoutDashboard,
  Tv,
  Bell,
  ShieldCheck,
  FolderOpen,
  FileText,
  Key,
  Clock,
  Settings,
  Ban,
  ArrowRight,
  X,
  CreditCard,
  AlertTriangle,
  AlertOctagon,
  Scale,
  Bot,
  Radio
} from "lucide-react";

interface PaletteItem {
  id: string;
  category: "Navigation" | "Alerts" | "Transactions" | "Cases" | "Rules" | "Blacklist";
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ElementType;
  action: () => void;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    transactions,
    alerts,
    cases,
    rules,
    blacklistedUsers,
    isEmergencyLockdown,
    exportEmergencySOSDossier,
  } = useSystemState();

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => {
          if (!prev) {
            setQuery("");
            setSelectedIndex(0);
          }
          return !prev;
        });
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => {
      setQuery("");
      setSelectedIndex(0);
      setIsOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("fds:open-command-palette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("fds:open-command-palette", handleCustomOpen);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Build items based on search query
  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const results: PaletteItem[] = [];

    const navPages = [
      { name: "Executive Dashboard", path: "/dashboard", desc: "System health, KPIs & live feed", icon: LayoutDashboard },
      { name: "Live Transaction Feed", path: "/live", desc: "Streaming transactions with network anomaly map", icon: Tv },
      { name: "Alerts & Notifications", path: "/alerts", desc: "Triage active alerts & trigger incident cases", icon: Bell },
      { name: "Fraud Rules & AI Engine", path: "/rules", desc: "Manage threshold, velocity, and pattern detection rules", icon: ShieldCheck },
      { name: "Investigation Cases", path: "/investigations", desc: "Manage open cases, assignees & resolutions", icon: FolderOpen },
      { name: "Compliance Data Reports", path: "/reports", desc: "Export CBN AML compliance reports and audit schedules", icon: FileText },
      { name: "API & Gateway Integrations", path: "/integrations", desc: "Webhooks, API keys, and payment gateway health", icon: Key },
      { name: "Immutable Audit Trail", path: "/audit", desc: "Searchable log of all analyst actions & overrides", icon: Clock },
      { name: "System Settings", path: "/settings", desc: "Analyst profile, team permissions & blacklist manager", icon: Settings },
    ];

    // Navigation matches
    for (const page of navPages) {
      if (!q || page.name.toLowerCase().includes(q) || page.desc.toLowerCase().includes(q)) {
        results.push({
          id: `nav-${page.path}`,
          category: "Navigation",
          title: page.name,
          subtitle: page.desc,
          icon: page.icon,
          action: () => {
            navigate(page.path);
            setIsOpen(false);
          },
        });
      }
    }

    // Emergency Response SOS matches
    if (!q || q.includes("sos") || q.includes("emerg") || q.includes("lock") || q.includes("panic") || q.includes("circuit") || q.includes("kill")) {
      results.unshift({
        id: "sos-emergency-modal",
        category: "Navigation",
        title: isEmergencyLockdown ? "🚨 Deactivate Emergency SOS Circuit Breaker" : "🚨 Engage Emergency Response & Circuit Breaker (SOS)",
        subtitle: isEmergencyLockdown ? "DEFCON 1 currently active • Restore normal rules" : "Enforce system-wide automatic hold on transactions > ₦250k",
        badge: isEmergencyLockdown ? "DEFCON 1" : "EMERGENCY",
        badgeColor: "bg-red-500/30 text-red-200 border border-red-500/50",
        icon: AlertOctagon,
        action: () => {
          setIsOpen(false);
          window.dispatchEvent(new CustomEvent("fds:open-sos-modal"));
        },
      });

      results.push({
        id: "sos-emergency-export",
        category: "Navigation",
        title: "📋 Export Emergency SOS Regulatory Dossier",
        subtitle: "One-click compilation of critical alerts, blocked activity & blacklist for CBN/NFIU",
        badge: "SOS REPORT",
        badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
        icon: FileText,
        action: () => {
          setIsOpen(false);
          exportEmergencySOSDossier();
        },
      });

      results.push({
        id: "sar-regulatory-dossier",
        category: "Navigation",
        title: "🏛️ Generate Official SAR Regulatory Report (NFIU / CBN)",
        subtitle: "Official Suspicious Activity Report PDF with watermark, HMAC signature & evidence ledger",
        badge: "SAR REPORT",
        badgeColor: "bg-red-500/20 text-red-300 border border-red-500/40",
        icon: Scale,
        action: () => {
          setIsOpen(false);
          window.dispatchEvent(new CustomEvent("fds:open-sar-modal"));
        },
      });

      results.push({
        id: "ai-copilot-brief",
        category: "Navigation",
        title: "🤖 Launch Sentinel AI Forensic Copilot",
        subtitle: "Autonomous attack vector breakdown, ATO probability & customer verification scripts",
        badge: "AI COPILOT",
        badgeColor: "bg-purple-500/20 text-purple-300 border border-purple-500/40",
        icon: Bot,
        action: () => {
          setIsOpen(false);
          window.dispatchEvent(new CustomEvent("fds:open-ai-copilot"));
        },
      });

      results.push({
        id: "soc-war-room-nav",
        category: "Navigation",
        title: "🛡️ Physical SOC War Room Wall Monitor",
        subtitle: "Full-screen dark operations display with sweeping radar, volume counters & audio telemetry",
        badge: "WAR ROOM",
        badgeColor: "bg-rose-500/20 text-rose-300 border border-rose-500/40",
        icon: Radio,
        action: () => {
          setIsOpen(false);
          navigate("/war-room");
        },
      });
    }

    // Alerts matches
    const matchedAlerts = alerts
      .filter((a) => {
        if (!q) return false;
        return (
          a.id.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q) ||
          a.user.toLowerCase().includes(q) ||
          a.reason.toLowerCase().includes(q) ||
          a.severity.toLowerCase().includes(q)
        );
      })
      .slice(0, 5);

    for (const a of matchedAlerts) {
      results.push({
        id: `alert-${a.id}`,
        category: "Alerts",
        title: `${a.id} — ${a.type}`,
        subtitle: `User: ${a.user} • ${a.reason} • Amount: ${a.amount}`,
        badge: a.severity.toUpperCase(),
        badgeColor:
          a.severity === "critical"
            ? "bg-red-500/20 text-red-300 border border-red-500/30"
            : a.severity === "high"
            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            : "bg-blue-500/20 text-blue-300 border border-blue-500/30",
        icon: AlertTriangle,
        action: () => {
          navigate("/alerts");
          setIsOpen(false);
        },
      });
    }

    // Transactions matches
    const matchedTxns = transactions
      .filter((t) => {
        if (!q) return false;
        return (
          t.id.toLowerCase().includes(q) ||
          t.userId.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q) ||
          t.device.toLowerCase().includes(q) ||
          t.amount.toString().includes(q) ||
          t.status.toLowerCase().includes(q)
        );
      })
      .slice(0, 5);

    for (const t of matchedTxns) {
      results.push({
        id: `txn-${t.id}`,
        category: "Transactions",
        title: `${t.id} — ₦${t.amount.toLocaleString()} (${t.category})`,
        subtitle: `User: ${t.userId} • ${t.location} • Risk: ${t.riskScore}%`,
        badge: t.status.toUpperCase(),
        badgeColor:
          t.status === "blocked"
            ? "bg-red-500/20 text-red-300 border border-red-500/30"
            : t.status === "flagged"
            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
        icon: CreditCard,
        action: () => {
          navigate("/live");
          setIsOpen(false);
        },
      });
    }

    // Investigation Cases matches
    const matchedCases = cases
      .filter((c) => {
        if (!q) return false;
        return (
          c.id.toLowerCase().includes(q) ||
          c.userId.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.severity.toLowerCase().includes(q) ||
          c.status.toLowerCase().includes(q)
        );
      })
      .slice(0, 4);

    for (const c of matchedCases) {
      results.push({
        id: `case-${c.id}`,
        category: "Cases",
        title: `${c.id} — User: ${c.userId}`,
        subtitle: `${c.description} • ₦${c.amount.toLocaleString()} • Severity: ${c.severity}`,
        badge: c.status,
        badgeColor: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
        icon: FolderOpen,
        action: () => {
          navigate("/investigations");
          setIsOpen(false);
        },
      });
    }

    // Rules matches
    const matchedRules = rules
      .filter((r) => {
        if (!q) return false;
        return (
          r.id.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q)
        );
      })
      .slice(0, 4);

    for (const r of matchedRules) {
      results.push({
        id: `rule-${r.id}`,
        category: "Rules",
        title: `${r.id} — ${r.name}`,
        subtitle: `${r.description} • Type: ${r.type}`,
        badge: r.isActive ? "ACTIVE" : "INACTIVE",
        badgeColor: r.isActive
          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          : "bg-slate-700 text-slate-400",
        icon: ShieldCheck,
        action: () => {
          navigate("/rules");
          setIsOpen(false);
        },
      });
    }

    // Blacklist matches
    const matchedBlacklist = blacklistedUsers
      .filter((b) => {
        if (!q) return false;
        return (
          b.userId.toLowerCase().includes(q) ||
          b.reason.toLowerCase().includes(q) ||
          b.blacklistedBy.toLowerCase().includes(q)
        );
      })
      .slice(0, 4);

    for (const b of matchedBlacklist) {
      results.push({
        id: `bl-${b.id}`,
        category: "Blacklist",
        title: `Blacklisted: ${b.userId}`,
        subtitle: `${b.reason} • Banned by ${b.blacklistedBy}`,
        badge: "BANNED",
        badgeColor: "bg-red-500/20 text-red-300 border border-red-500/30",
        icon: Ban,
        action: () => {
          navigate("/settings");
          setIsOpen(false);
        },
      });
    }

    return results;
  }, [query, alerts, transactions, cases, rules, blacklistedUsers, navigate, isEmergencyLockdown, exportEmergencySOSDossier]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Key navigation
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const safeIndex = selectedIndex >= items.length ? 0 : selectedIndex;
      if (items[safeIndex]) {
        items[safeIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:px-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/40">
          <Search className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search transactions, alerts, cases, rules, navigation... (Ctrl+K)"
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 mr-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-800 border border-slate-700 rounded">
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">No results found for "{query}"</p>
              <p className="text-xs text-slate-500 mt-1">
                Try searching for a transaction ID (e.g., TXN-), user (USR-), rule name, or page name.
              </p>
            </div>
          ) : (
            items.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  data-index={index}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "text-slate-300 hover:bg-slate-800/80"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold truncate leading-tight">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : item.badgeColor || "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[11px] truncate mt-0.5 ${
                          isSelected ? "text-indigo-100" : "text-slate-400"
                        }`}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-850 text-slate-500 border border-slate-800"
                      }`}
                    >
                      {item.category}
                    </span>
                    <ArrowRight
                      className={`h-3.5 w-3.5 ${
                        isSelected ? "text-white" : "text-slate-600"
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/60 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300">↓</kbd>
              <span className="text-slate-500 ml-0.5">navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300">↵</kbd>
              <span className="text-slate-500 ml-0.5">select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300">esc</kbd>
              <span className="text-slate-500 ml-0.5">close</span>
            </span>
          </div>

          <div className="text-[10px] text-slate-500">
            FraudDetection Command Hub
          </div>
        </div>
      </div>
    </div>
  );
}
