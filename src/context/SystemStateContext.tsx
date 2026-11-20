/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { downloadAsJSON } from "../utils/exportHelpers";
import { soundEngine } from "../utils/soundEngine";

// Types
export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  timestamp: string;
  riskScore: number; // 0 to 100
  status: "passed" | "flagged" | "blocked" | "pending_challenge";
  location: string;
  device: string;
  category: "Transfer" | "Withdrawal" | "Payment";
  ruleTriggers: string[];
  challengeType?: "biometric" | "otp" | "callback";
  challengeExpiresAt?: number;
}

export interface Alert {
  id: string;
  txnId: string;
  type: string;
  amount: string;
  user: string;
  time: string;
  status: "Active" | "Investigating" | "Resolved" | "Dismissed";
  severity: "critical" | "high" | "medium";
  reason: string;
}

export interface CaseNote {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface InvestigationCase {
  id: string;
  alertId: string;
  userId: string;
  amount: number;
  status: "Open" | "In Progress" | "Resolved (Fraud)" | "Dismissed (False Positive)";
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  notes: CaseNote[];
  createdAt: string;
  resolvedAt?: string;
}

export interface FraudRule {
  id: string;
  name: string;
  description: string;
  type: "velocity" | "threshold" | "geolocation" | "device";
  parameterValue: number | string;
  isActive: boolean;
  triggersCount: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  analyst: string;
  action: string;
  targetType: "Alert" | "Case" | "Rule" | "System" | "Report" | "APIKey";
  targetId: string;
  details: string;
}

export interface ScheduledReport {
  id: string;
  title: string;
  frequency: "Daily" | "Weekly" | "Monthly";
  format: "CSV" | "Excel" | "PDF" | "JSON";
  recipients: string;
  createdAt: string;
  status: "Active" | "Paused";
}

export interface AnalystProfile {
  name: string;
  role: "Admin" | "Senior Analyst" | "Junior Investigator";
  email: string;
  status: "Active" | "Away" | "Offline";
  avatarColor: "indigo" | "emerald" | "violet" | "rose" | "blue" | "amber";
  phone: string;
  department: string;
  location: string;
  timezone: string;
  lastActive: string;
}

export interface BlacklistedEntity {
  id: string;
  userId: string;
  reason: string;
  blacklistedAt: string;
  blacklistedBy: string;
}

export interface EmergencyLockdownDetails {
  engagedBy: string;
  engagedAt: string;
  reason: string;
}

interface SystemStateContextType {
  transactions: Transaction[];
  alerts: Alert[];
  cases: InvestigationCase[];
  rules: FraudRule[];
  auditLogs: AuditLogEntry[];
  scheduledReports: ScheduledReport[];
  blacklistedUsers: BlacklistedEntity[];
  currentAnalyst: AnalystProfile;
  isSimulatorActive: boolean;
  isAudioMuted: boolean;
  toggleAudioMute: () => void;
  playChime: (type: "critical" | "emergency" | "warning" | "success") => void;
  newAlertNotification: Alert | null;
  isEmergencyLockdown: boolean;
  emergencyLockdownDetails: EmergencyLockdownDetails | null;
  toggleEmergencyLockdown: (reason?: string) => void;
  exportEmergencySOSDossier: () => void;
  setNewAlertNotification: (alert: Alert | null) => void;
  updateCurrentAnalyst: (profile: Partial<AnalystProfile>) => void;
  toggleSimulator: () => void;
  resolveAlert: (alertId: string, action: "escalate" | "dismiss" | "resolve") => void;
  escalateAlert: (alertId: string, severity?: "critical" | "high" | "medium" | "low") => void;
  updateCaseStatus: (caseId: string, status: InvestigationCase["status"]) => void;
  createInvestigationCase: (data: {
    userId: string;
    amount: number;
    severity: InvestigationCase["severity"];
    description: string;
    initialNote?: string;
  }) => InvestigationCase;
  addCaseNote: (caseId: string, text: string) => void;
  toggleRule: (ruleId: string) => void;
  updateRuleThreshold: (ruleId: string, value: number | string) => void;
  createRule: (rule: Omit<FraudRule, "id" | "triggersCount">) => void;
  scheduleReport: (report: Omit<ScheduledReport, "id" | "createdAt" | "status">) => void;
  toggleReportStatus: (reportId: string) => void;
  deleteReport: (reportId: string) => void;
  addAuditEntry: (action: string, targetType: AuditLogEntry["targetType"], targetId: string, details: string) => void;
  clearNotification: () => void;
  resetSystemToDefaults: () => void;
  forceApproveTransaction: (txnId: string) => void;
  manuallyFlagTransaction: (txnId: string, reason?: string) => void;
  dispatchStepUpChallenge: (txnId: string, challengeType?: "biometric" | "otp" | "callback") => void;
  blacklistUser: (userId: string, reason?: string) => void;
  unblacklistUser: (userId: string) => void;
}

const SystemStateContext = createContext<SystemStateContextType | undefined>(undefined);

export const useSystemState = () => {
  const context = useContext(SystemStateContext);
  if (!context) {
    throw new Error("useSystemState must be used within a SystemStateProvider");
  }
  return context;
};

// Initial Mock Data
const initialRules: FraudRule[] = [
  {
    id: "RULE-1",
    name: "High-Value Transaction Threshold",
    description: "Flag any transaction exceeding the threshold limit",
    type: "threshold",
    parameterValue: 1500000,
    isActive: true,
    triggersCount: 14,
  },
  {
    id: "RULE-2",
    name: "Rapid Velocity Check",
    description: "Flag accounts making more than 3 transactions within 1 minute",
    type: "velocity",
    parameterValue: 3,
    isActive: true,
    triggersCount: 9,
  },
  {
    id: "RULE-3",
    name: "Suspicious Geolocation Access",
    description: "Flag transactions originating outside whitelisted countries",
    type: "geolocation",
    parameterValue: "NG,US,GB",
    isActive: true,
    triggersCount: 22,
  },
  {
    id: "RULE-4",
    name: "Device Fingerprint Discrepancy",
    description: "Flag transactions where device hardware does not match profile",
    type: "device",
    parameterValue: "OS Mismatch",
    isActive: true,
    triggersCount: 6,
  },
];

const initialTransactions: Transaction[] = [
  {
    id: "TXN-9020",
    userId: "user_3942",
    amount: 2950000,
    currency: "NGN",
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    riskScore: 92,
    status: "blocked",
    location: "Unknown IP (Lagos VPN)",
    device: "Linux / Unknown Browser",
    category: "Transfer",
    ruleTriggers: ["RULE-1", "RULE-3"],
  },
  {
    id: "TXN-9019",
    userId: "user_1289",
    amount: 875000,
    currency: "NGN",
    timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    riskScore: 68,
    status: "flagged",
    location: "Lagos, Nigeria",
    device: "Safari / iPhone 15",
    category: "Transfer",
    ruleTriggers: ["RULE-2"],
  },
  {
    id: "TXN-9018",
    userId: "user_8110",
    amount: 45000,
    currency: "NGN",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    riskScore: 8,
    status: "passed",
    location: "Abuja, Nigeria",
    device: "Chrome / Windows 11",
    category: "Payment",
    ruleTriggers: [],
  },
  {
    id: "TXN-9017",
    userId: "user_2039",
    amount: 120000,
    currency: "NGN",
    timestamp: new Date(Date.now() - 72 * 60 * 1000).toISOString(),
    riskScore: 12,
    status: "passed",
    location: "Kano, Nigeria",
    device: "Chrome / Android",
    category: "Withdrawal",
    ruleTriggers: [],
  },
  {
    id: "TXN-9016",
    userId: "user_4910",
    amount: 1850000,
    currency: "NGN",
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    riskScore: 88,
    status: "blocked",
    location: "New York, USA",
    device: "Chrome / Windows 10",
    category: "Transfer",
    ruleTriggers: ["RULE-1", "RULE-3"],
  },
  {
    id: "TXN-9015",
    userId: "user_4910",
    amount: 95000,
    currency: "NGN",
    timestamp: new Date(Date.now() - 112 * 60 * 1000).toISOString(),
    riskScore: 45,
    status: "passed",
    location: "Lagos, Nigeria",
    device: "Chrome / Windows 10",
    category: "Payment",
    ruleTriggers: [],
  },
];

const initialAlerts: Alert[] = [
  {
    id: "ALR-2841",
    txnId: "TXN-9020",
    type: "High Value + Geolocation Anomaly",
    amount: "₦2,950,000",
    user: "user_3942",
    time: new Date(Date.now() - 4 * 60 * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    status: "Active",
    severity: "critical",
    reason: "Transaction amount exceeds ₦1.5M and was routed through an unverified VPN IP address outside Nigeria.",
  },
  {
    id: "ALR-2839",
    txnId: "TXN-9019",
    type: "Multiple High-Velocity Transfers",
    amount: "₦875,000",
    user: "user_1289",
    time: new Date(Date.now() - 28 * 60 * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    status: "Investigating",
    severity: "high",
    reason: "User executed 4 distinct transfer requests in less than 45 seconds, indicating potential session hijack.",
  },
  {
    id: "ALR-2835",
    txnId: "TXN-9016",
    type: "Cross-Border Device Mismatch",
    amount: "₦1,850,000",
    user: "user_4910",
    time: new Date(Date.now() - 110 * 60 * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    status: "Resolved",
    severity: "high",
    reason: "Transaction originated from New York, USA using Windows 10 just 2 minutes after a Lagos transfer, suggesting credential sharing or token cloning.",
  },
];

const initialCases: InvestigationCase[] = [
  {
    id: "CASE-501",
    alertId: "ALR-2839",
    userId: "user_1289",
    amount: 875000,
    status: "In Progress",
    severity: "high",
    description: "Suspicious velocity spikes. 4 transfers within 45 seconds totaling ₦875,000. Customer has never transacted this quickly. Contacting user for out-of-band verification.",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    notes: [
      {
        id: "note-1",
        author: "Jethro (Analyst)",
        text: "Escalated to investigation. Placing temporary hold on user withdrawals while review is active.",
        timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
      },
      {
        id: "note-2",
        author: "Jethro (Analyst)",
        text: "Sent verification SMS. Awaiting user callback to confirm they initiated these transactions.",
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "CASE-498",
    alertId: "ALR-2835",
    userId: "user_4910",
    amount: 1850000,
    status: "Resolved (Fraud)",
    severity: "critical",
    description: "Account takeover confirmed. Unauthorized IP login from NY, USA. Attacker attempted transfer to new Nigerian beneficiary. Compromised credentials revoked.",
    createdAt: new Date(Date.now() - 100 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    notes: [
      {
        id: "note-3",
        author: "Jethro (Analyst)",
        text: "Spoke with customer. They confirmed they are currently in Lagos and did not make this transfer. Marking transaction as fraudulent and blacklisting the beneficiary account.",
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
    ],
  },
];

const initialAuditLogs: AuditLogEntry[] = [
  {
    id: "AUD-1001",
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    analyst: "System Sentinel",
    action: "Rule Triggered",
    targetType: "Rule",
    targetId: "RULE-1",
    details: "High-value rule triggered for user_4910 (₦1,850,000)",
  },
  {
    id: "AUD-1002",
    timestamp: new Date(Date.now() - 100 * 60 * 1000).toISOString(),
    analyst: "Jethro (Analyst)",
    action: "Case Escalated",
    targetType: "Case",
    targetId: "CASE-498",
    details: "Escalated Alert ALR-2835 to formal investigation.",
  },
  {
    id: "AUD-1003",
    timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    analyst: "Jethro (Analyst)",
    action: "Case Resolved",
    targetType: "Case",
    targetId: "CASE-498",
    details: "Resolved Case CASE-498 as Confirmed Fraud. Customer account secured.",
  },
  {
    id: "AUD-1004",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    analyst: "Jethro (Analyst)",
    action: "Case Escalated",
    targetType: "Case",
    targetId: "CASE-501",
    details: "Escalated Alert ALR-2839 due to suspicious rapid-fire transfers.",
  },
];

const initialReports: ScheduledReport[] = [
  {
    id: "RPT-101",
    title: "Daily Fraud Operations Summary",
    frequency: "Daily",
    format: "PDF",
    recipients: "compliance@fds.com, ops-leads@fds.com",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Active",
  },
  {
    id: "RPT-102",
    title: "Weekly AML Risk Geolocation Analysis",
    frequency: "Weekly",
    format: "CSV",
    recipients: "risk-team@fds.com",
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Active",
  },
];

const LOCATIONS = [
  "Lagos, Nigeria",
  "Abuja, Nigeria",
  "Port Harcourt, Nigeria",
  "Kano, Nigeria",
  "London, UK",
  "New York, USA",
  "Dublin, Ireland",
  "Frankfurt, Germany",
  "Unknown IP (Proxy)",
  "Unknown IP (VPN)",
];

const DEVICES = [
  "Chrome / Windows 11",
  "Safari / iPhone 15 Pro",
  "Chrome / Android 14",
  "Firefox / MacOS Sonoma",
  "FDS Android App v3.2",
  "FDS iOS App v3.2",
  "Linux / Unknown User Agent",
];

const initialAnalyst: AnalystProfile = {
  name: "Jethro",
  role: "Senior Analyst",
  email: "jethro@sentinel.com",
  status: "Active",
  avatarColor: "indigo",
  phone: "+234 803 123 4567",
  department: "Financial Crime & Risk Investigations",
  location: "Abuja, Nigeria",
  timezone: "WAT (UTC+1)",
  lastActive: "Active now",
};

const initialBlacklisted: BlacklistedEntity[] = [
  {
    id: "BL-101",
    userId: "user_4910",
    reason: "Account takeover & fraudulent cross-border transfer attempt",
    blacklistedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    blacklistedBy: "Jethro (Senior Analyst)",
  },
];

const STORAGE_KEYS = {
  transactions: "fds_transactions",
  alerts: "fds_alerts",
  cases: "fds_cases",
  rules: "fds_rules",
  auditLogs: "fds_audit_logs",
  scheduledReports: "fds_scheduled_reports",
  currentAnalyst: "fds_current_analyst",
  blacklistedUsers: "fds_blacklisted_users",
  emergencyLockdown: "fds_emergency_lockdown",
  emergencyLockdownDetails: "fds_emergency_lockdown_details",
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error loading ${key} from storage:`, err);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

export const SystemStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAnalyst, setCurrentAnalyst] = useState<AnalystProfile>(() =>
    loadFromStorage(STORAGE_KEYS.currentAnalyst, initialAnalyst)
  );
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadFromStorage(STORAGE_KEYS.transactions, initialTransactions)
  );
  const [alerts, setAlerts] = useState<Alert[]>(() =>
    loadFromStorage(STORAGE_KEYS.alerts, initialAlerts)
  );
  const [cases, setCases] = useState<InvestigationCase[]>(() =>
    loadFromStorage(STORAGE_KEYS.cases, initialCases)
  );
  const [rules, setRules] = useState<FraudRule[]>(() =>
    loadFromStorage(STORAGE_KEYS.rules, initialRules)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    loadFromStorage(STORAGE_KEYS.auditLogs, initialAuditLogs)
  );
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>(() =>
    loadFromStorage(STORAGE_KEYS.scheduledReports, initialReports)
  );
  const [blacklistedUsers, setBlacklistedUsers] = useState<BlacklistedEntity[]>(() =>
    loadFromStorage(STORAGE_KEYS.blacklistedUsers, initialBlacklisted)
  );
  const [isEmergencyLockdown, setIsEmergencyLockdown] = useState<boolean>(() =>
    loadFromStorage(STORAGE_KEYS.emergencyLockdown, false)
  );
  const [emergencyLockdownDetails, setEmergencyLockdownDetails] = useState<EmergencyLockdownDetails | null>(() =>
    loadFromStorage(STORAGE_KEYS.emergencyLockdownDetails, null)
  );
  const [isSimulatorActive, setIsSimulatorActive] = useState<boolean>(true);
  const [newAlertNotification, setNewAlertNotification] = useState<Alert | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => soundEngine.getMuted());

  const toggleAudioMute = useCallback(() => {
    setIsAudioMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  const playChime = useCallback((type: "critical" | "emergency" | "warning" | "success") => {
    switch (type) {
      case "critical":
        soundEngine.playCriticalAlert();
        break;
      case "emergency":
        soundEngine.playEmergencySiren();
        break;
      case "warning":
        soundEngine.playWarningPing();
        break;
      case "success":
        soundEngine.playSuccessChime();
        break;
    }
  }, []);

  // Auto-sync state to localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.currentAnalyst, currentAnalyst);
  }, [currentAnalyst]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.transactions, transactions);
  }, [transactions]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.alerts, alerts);
  }, [alerts]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.cases, cases);
  }, [cases]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.rules, rules);
  }, [rules]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.auditLogs, auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.scheduledReports, scheduledReports);
  }, [scheduledReports]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.blacklistedUsers, blacklistedUsers);
  }, [blacklistedUsers]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.emergencyLockdown, isEmergencyLockdown);
  }, [isEmergencyLockdown]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.emergencyLockdownDetails, emergencyLockdownDetails);
  }, [emergencyLockdownDetails]);

  // Keep rules, analyst, and blacklist ref updated for simulator and callbacks
  const rulesRef = useRef(rules);
  useEffect(() => {
    rulesRef.current = rules;
  }, [rules]);

  const currentAnalystRef = useRef(currentAnalyst);
  useEffect(() => {
    currentAnalystRef.current = currentAnalyst;
  }, [currentAnalyst]);

  const blacklistedUsersRef = useRef(blacklistedUsers);
  useEffect(() => {
    blacklistedUsersRef.current = blacklistedUsers;
  }, [blacklistedUsers]);

  const isEmergencyLockdownRef = useRef(isEmergencyLockdown);
  useEffect(() => {
    isEmergencyLockdownRef.current = isEmergencyLockdown;
  }, [isEmergencyLockdown]);

  // Helper to add audit log entries
  const addAuditEntry = useCallback((action: string, targetType: AuditLogEntry["targetType"], targetId: string, details: string) => {
    const active = currentAnalystRef.current;
    const newEntry: AuditLogEntry = {
      id: `AUD-${Math.floor(Math.random() * 9000 + 1000)}`,
      timestamp: new Date().toISOString(),
      analyst: `${active.name} (${active.role})`,
      action,
      targetType,
      targetId,
      details,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  }, []);

  const updateCurrentAnalyst = useCallback((updates: Partial<AnalystProfile>) => {
    setCurrentAnalyst((prev) => {
      const updated = { ...prev, ...updates };
      addAuditEntry(
        "Analyst Profile Updated",
        "System",
        "PROFILE",
        `Analyst profile (${updated.name}) updated successfully.`
      );
      return updated;
    });
  }, [addAuditEntry]);

  const toggleSimulator = useCallback(() => {
    setIsSimulatorActive((prev) => {
      const next = !prev;
      addAuditEntry(
        next ? "Simulator Resumed" : "Simulator Paused",
        "System",
        "SIMULATOR",
        `Real-time transaction stream was ${next ? "enabled" : "paused"} by analyst.`
      );
      return next;
    });
  }, [addAuditEntry]);

  // Core Alert escalation logic
  const escalateAlert = useCallback((alertId: string, severity: InvestigationCase["severity"] = "high") => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: "Investigating" as const } : a))
    );

    const alert = alerts.find((a) => a.id === alertId);
    if (!alert) return;

    // Check if case already exists for this alert
    const caseExists = cases.some((c) => c.alertId === alertId);
    if (caseExists) return;

    const numericAmount = parseFloat(alert.amount.replace(/[^0-9.]/g, "")) || 0;

    const newCase: InvestigationCase = {
      id: `CASE-${Math.floor(Math.random() * 900 + 100)}`,
      alertId: alert.id,
      userId: alert.user,
      amount: numericAmount,
      status: "Open",
      severity,
      description: `Escalated from Alert ${alert.id}: ${alert.type}. Triggered at ${alert.time}. Reason: ${alert.reason}`,
      notes: [
        {
          id: `note-${Math.floor(Math.random() * 100000)}`,
          author: "System Auto-Escalation",
          text: `Case opened automatically from escalated Alert ${alert.id}.`,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    setCases((prev) => [newCase, ...prev]);
    addAuditEntry("Case Escalated", "Case", newCase.id, `Escalated Alert ${alertId} to Case ${newCase.id}`);
  }, [alerts, cases, addAuditEntry]);

  // Alert resolver
  const resolveAlert = useCallback((alertId: string, action: "escalate" | "dismiss" | "resolve") => {
    if (action === "escalate") {
      escalateAlert(alertId);
    } else {
      const resolvedStatus = action === "dismiss" ? ("Dismissed" as const) : ("Resolved" as const);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: resolvedStatus } : a))
      );
      if (action === "resolve") {
        soundEngine.playSuccessChime();
      }
      addAuditEntry(
        action === "dismiss" ? "Alert Dismissed" : "Alert Resolved",
        "Alert",
        alertId,
        `Alert ${alertId} was marked as ${resolvedStatus} by analyst.`
      );
    }
  }, [escalateAlert, addAuditEntry]);

  // Case updates
  const updateCaseStatus = useCallback((caseId: string, status: InvestigationCase["status"]) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id === caseId) {
          const isResolved = status.startsWith("Resolved") || status.startsWith("Dismissed");
          if (isResolved) {
            soundEngine.playSuccessChime();
          }
          return {
            ...c,
            status,
            resolvedAt: isResolved ? new Date().toISOString() : undefined,
          };
        }
        return c;
      })
    );

    // Sync back to alert if case is resolved/dismissed
    const theCase = cases.find((c) => c.id === caseId);
    if (theCase) {
      const correspondingAlertStatus = status.includes("False Positive") ? "Dismissed" : "Resolved";
      setAlerts((prev) =>
        prev.map((a) => (a.id === theCase.alertId ? { ...a, status: correspondingAlertStatus } : a))
      );
    }

    addAuditEntry(
      "Case Status Updated",
      "Case",
      caseId,
      `Case ${caseId} status updated to: ${status}`
    );
  }, [cases, addAuditEntry]);

  const addCaseNote = useCallback((caseId: string, text: string) => {
    const active = currentAnalystRef.current;
    const newNote: CaseNote = {
      id: `note-${Math.floor(Math.random() * 100000)}`,
      author: `${active.name} (${active.role})`,
      text,
      timestamp: new Date().toISOString(),
    };

    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, notes: [...c.notes, newNote] } : c))
    );

    addAuditEntry("Case Note Added", "Case", caseId, `Analyst added a note to Case ${caseId}`);
  }, [addAuditEntry]);

  const createInvestigationCase = useCallback((data: {
    userId: string;
    amount: number;
    severity: InvestigationCase["severity"];
    description: string;
    initialNote?: string;
  }): InvestigationCase => {
    const active = currentAnalystRef.current;
    const newCaseId = `CASE-${Math.floor(Math.random() * 900 + 100)}`;
    const newCase: InvestigationCase = {
      id: newCaseId,
      alertId: "MANUAL-REFERRAL",
      userId: data.userId,
      amount: data.amount,
      status: "Open",
      severity: data.severity,
      description: data.description,
      notes: [
        {
          id: `note-${Math.floor(Math.random() * 100000)}`,
          author: `${active.name} (${active.role})`,
          text: data.initialNote?.trim() || "Manual investigation opened by analyst.",
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    setCases((prev) => [newCase, ...prev]);
    addAuditEntry(
      "Manual Case Created",
      "Case",
      newCase.id,
      `Analyst opened manual case ${newCase.id} for user ${data.userId} with ${data.severity} priority.`
    );
    return newCase;
  }, [addAuditEntry]);

  // Rule configuration
  const toggleRule = useCallback((ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === ruleId) {
          const nextActive = !r.isActive;
          addAuditEntry(
            nextActive ? "Rule Enabled" : "Rule Disabled",
            "Rule",
            ruleId,
            `Fraud rule '${r.name}' was ${nextActive ? "enabled" : "disabled"}.`
          );
          return { ...r, isActive: nextActive };
        }
        return r;
      })
    );
  }, [addAuditEntry]);

  const updateRuleThreshold = useCallback((ruleId: string, value: number | string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === ruleId) {
          addAuditEntry(
            "Rule Threshold Modified",
            "Rule",
            ruleId,
            `Rule '${r.name}' threshold changed from ${r.parameterValue} to ${value}`
          );
          return { ...r, parameterValue: value };
        }
        return r;
      })
    );
  }, [addAuditEntry]);

  const createRule = useCallback((newRuleData: Omit<FraudRule, "id" | "triggersCount">) => {
    const newRule: FraudRule = {
      ...newRuleData,
      id: `RULE-${Math.floor(Math.random() * 90 + 10)}`,
      triggersCount: 0,
    };
    setRules((prev) => [...prev, newRule]);
    addAuditEntry("Rule Created", "Rule", newRule.id, `Created new rule '${newRule.name}' of type ${newRule.type}`);
  }, [addAuditEntry]);

  // Scheduled reports
  const scheduleReport = useCallback((newReportData: Omit<ScheduledReport, "id" | "createdAt" | "status">) => {
    const newReport: ScheduledReport = {
      ...newReportData,
      id: `RPT-${Math.floor(Math.random() * 900 + 100)}`,
      createdAt: new Date().toISOString(),
      status: "Active",
    };
    setScheduledReports((prev) => [...prev, newReport]);
    addAuditEntry("Report Scheduled", "Report", newReport.id, `Scheduled new report: ${newReport.title}`);
  }, [addAuditEntry]);

  const toggleReportStatus = useCallback((reportId: string) => {
    setScheduledReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          const nextStatus = r.status === "Active" ? ("Paused" as const) : ("Active" as const);
          addAuditEntry("Report Schedule Updated", "Report", reportId, `Scheduled report ${reportId} was ${nextStatus}`);
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
  }, [addAuditEntry]);

  const deleteReport = useCallback((reportId: string) => {
    setScheduledReports((prev) => prev.filter((r) => r.id !== reportId));
    addAuditEntry("Report Schedule Cancelled", "Report", reportId, `Cancelled scheduled report ${reportId}`);
  }, [addAuditEntry]);

  const clearNotification = useCallback(() => {
    setNewAlertNotification(null);
  }, []);

  // Transaction Overrides
  const forceApproveTransaction = useCallback((txnId: string) => {
    setTransactions(prev =>
      prev.map(t => (t.id === txnId ? { ...t, status: "passed", riskScore: 5 } : t))
    );
    // Auto-resolve any corresponding alert
    setAlerts(prev =>
      prev.map(a => (a.txnId === txnId ? { ...a, status: "Resolved" } : a))
    );
    soundEngine.playSuccessChime();
    addAuditEntry(
      "Transaction Force-Approved",
      "Alert",
      txnId,
      `Analyst manually force-approved transaction ${txnId}. Risk status cleared to passed (5%).`
    );
  }, [addAuditEntry]);

  const manuallyFlagTransaction = useCallback((txnId: string, reason = "Manually flagged for compliance audit") => {
    let targetTxn: Transaction | undefined;
    setTransactions(prev =>
      prev.map(t => {
        if (t.id === txnId) {
          targetTxn = { ...t, status: "flagged", riskScore: Math.max(t.riskScore, 75) };
          return targetTxn;
        }
        return t;
      })
    );

    const alertId = `ALR-${Math.floor(Math.random() * 9000 + 1000)}`;
    const newAlert: Alert = {
      id: alertId,
      txnId,
      type: "Manual Compliance Flag",
      amount: targetTxn ? `₦${targetTxn.amount.toLocaleString()}` : "₦0",
      user: targetTxn ? targetTxn.userId : "Unknown User",
      time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      status: "Active",
      severity: "high",
      reason,
    };

    setAlerts(prev => [newAlert, ...prev]);
    setNewAlertNotification(newAlert);
    soundEngine.playWarningPing();
    addAuditEntry(
      "Transaction Manually Flagged",
      "Alert",
      txnId,
      `Analyst manually flagged transaction ${txnId}. Generated Alert ${alertId}.`
    );
  }, [addAuditEntry]);

  const dispatchStepUpChallenge = useCallback((txnId: string, challengeType: "biometric" | "otp" | "callback" = "biometric") => {
    const expiresAt = Date.now() + 15000;
    setTransactions(prev =>
      prev.map(t => (t.id === txnId ? { ...t, status: "pending_challenge", challengeType, challengeExpiresAt: expiresAt } : t))
    );
    soundEngine.playWarningPing();
    addAuditEntry(
      "Step-Up 2FA Challenge Dispatched",
      "Alert",
      txnId,
      `Analyst dispatched interactive ${challengeType.toUpperCase()} Step-Up Authentication challenge to user device. Awaiting verification response.`
    );

    // Simulate customer interactive verification resolution after 7.5 seconds
    setTimeout(() => {
      const isSuccess = Math.random() < 0.8; // 80% pass rate
      setTransactions(prev =>
        prev.map(t => {
          if (t.id === txnId && t.status === "pending_challenge") {
            if (isSuccess) {
              return { ...t, status: "passed", riskScore: 12 };
            } else {
              return { ...t, status: "blocked", riskScore: 96 };
            }
          }
          return t;
        })
      );

      if (isSuccess) {
        soundEngine.playSuccessChime();
        setAlerts(prev => prev.map(a => (a.txnId === txnId ? { ...a, status: "Resolved" } : a)));
        addAuditEntry(
          "Step-Up 2FA Verified",
          "Alert",
          txnId,
          `Customer successfully completed ${challengeType.toUpperCase()} challenge. Transaction ${txnId} cleared to passed (Risk: 12%).`
        );
      } else {
        soundEngine.playCriticalAlert();
        addAuditEntry(
          "Step-Up 2FA Failed / Expired",
          "Alert",
          txnId,
          `Customer failed or timed out ${challengeType.toUpperCase()} challenge. Transaction ${txnId} escalated to BLOCKED (Risk: 96%).`
        );
      }
    }, 7500);
  }, [addAuditEntry]);

  const blacklistUser = useCallback((userId: string, reason = "Flagged as high-risk security threat by analyst") => {
    const active = currentAnalystRef.current;
    const newEntry: BlacklistedEntity = {
      id: `BL-${Math.floor(Math.random() * 900 + 100)}`,
      userId,
      reason,
      blacklistedAt: new Date().toISOString(),
      blacklistedBy: `${active.name} (${active.role})`,
    };

    setBlacklistedUsers(prev => {
      if (prev.some(b => b.userId === userId)) return prev;
      return [newEntry, ...prev];
    });

    // Immediately block any active transactions for this user
    setTransactions(prev =>
      prev.map(t => {
        if (t.userId === userId) {
          return {
            ...t,
            status: "blocked",
            riskScore: 99,
            ruleTriggers: Array.from(new Set([...t.ruleTriggers, "RULE-BLACKLIST"])),
          };
        }
        return t;
      })
    );

    addAuditEntry(
      "User Blacklisted",
      "System",
      userId,
      `User ${userId} was added to the Blacklist registry. Reason: ${reason}`
    );
  }, [addAuditEntry]);

  const unblacklistUser = useCallback((userId: string) => {
    setBlacklistedUsers(prev => prev.filter(b => b.userId !== userId));
    soundEngine.playSuccessChime();
    addAuditEntry(
      "User Unblacklisted",
      "System",
      userId,
      `User ${userId} was removed from the Blacklist registry and unbanned.`
    );
  }, [addAuditEntry]);

  const toggleEmergencyLockdown = useCallback((reason?: string) => {
    setIsEmergencyLockdown((prev) => {
      const next = !prev;
      const activeAnalyst = currentAnalystRef.current;
      if (next) {
        const details: EmergencyLockdownDetails = {
          engagedBy: `${activeAnalyst.name} (${activeAnalyst.role})`,
          engagedAt: new Date().toISOString(),
          reason: reason || "System-wide high threat emergency circuit breaker engaged by security analyst.",
        };
        setEmergencyLockdownDetails(details);
        soundEngine.playEmergencySiren();
        addAuditEntry(
          "Emergency SOS Lockdown Engaged",
          "System",
          "DEFCON-1",
          `Global Circuit Breaker engaged: ${details.reason}`
        );
      } else {
        setEmergencyLockdownDetails(null);
        soundEngine.playSuccessChime();
        addAuditEntry(
          "Emergency SOS Lockdown Disengaged",
          "System",
          "DEFCON-5",
          "Emergency Circuit Breaker deactivated. Normal banking simulation thresholds restored."
        );
      }
      return next;
    });
  }, [addAuditEntry]);

  const exportEmergencySOSDossier = useCallback(() => {
    const activeAnalyst = currentAnalystRef.current;
    const criticalAlerts = alerts.filter(a => a.severity === "critical" && (a.status === "Active" || a.status === "Investigating"));
    const blockedTransactions = transactions.filter(t => t.status === "blocked").slice(0, 50);
    const bannedUsers = blacklistedUsers;

    const dossier = {
      header: {
        classification: "RESTRICTED // REGULATORY EMERGENCY SUBMISSION (NFIU / CBN / LAW ENFORCEMENT)",
        dispatchType: "EMERGENCY SUSPICIOUS OPERATIONS SUMMARY (SOS DOSSIER)",
        generatedAt: new Date().toISOString(),
        authorizingAnalyst: `${activeAnalyst.name} (${activeAnalyst.role})`,
        station: activeAnalyst.location,
        lockdownStatus: isEmergencyLockdownRef.current ? "ACTIVE (DEFCON 1 CIRCUIT BREAKER)" : "STANDBY (NORMAL OPERATIONS)",
        lockdownDetails: emergencyLockdownDetails,
      },
      summary: {
        activeCriticalIncidentsCount: criticalAlerts.length,
        interceptedTransactionsCount: blockedTransactions.length,
        bannedEntitiesCount: bannedUsers.length,
        totalBlockedVolumeNaira: blockedTransactions.reduce((acc, t) => acc + t.amount, 0),
      },
      criticalIncidents: criticalAlerts,
      interceptedTransactions: blockedTransactions,
      blacklistedEntities: bannedUsers,
      recentAuditLedger: auditLogs.slice(0, 20),
    };

    const dateStr = new Date().toISOString().split("T")[0];
    downloadAsJSON(`FDS_EMERGENCY_SOS_DOSSIER_${dateStr}.json`, [dossier]);
    addAuditEntry(
      "Emergency SOS Dossier Exported",
      "Report",
      "SOS-DOSSIER",
      `Analyst exported Emergency SOS Regulatory Package with ${criticalAlerts.length} critical incidents and ${blockedTransactions.length} blocked transactions.`
    );
  }, [alerts, transactions, blacklistedUsers, auditLogs, emergencyLockdownDetails, addAuditEntry]);

  // background Simulator engine
  useEffect(() => {
    if (!isSimulatorActive) return;

    const interval = setInterval(() => {
      // 1. Generate a random transaction
      const txnId = `TXN-${Math.floor(Math.random() * 1000 + 9100)}`;
      const userNum = Math.floor(Math.random() * 8000 + 1000);
      const userId = `user_${userNum}`;
      const amount = Math.floor(Math.random() * 2500000 + 5000); // ₦5,000 to ₦2.5M
      const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      const device = DEVICES[Math.floor(Math.random() * DEVICES.length)];
      const category = (["Transfer", "Withdrawal", "Payment"] as const)[Math.floor(Math.random() * 3)];
      
      const activeRules = rulesRef.current;
      const ruleTriggers: string[] = [];
      let riskScore = Math.floor(Math.random() * 20); // Base low risk score

      // 2. Evaluate against active rules
      // Emergency Lockdown Circuit Breaker check
      if (isEmergencyLockdownRef.current && amount >= 250000) {
        ruleTriggers.push("RULE-SOS-LOCKDOWN");
        riskScore = 99;
      }

      // Blacklist check
      const isBlacklisted = blacklistedUsersRef.current.some(b => b.userId === userId);
      if (isBlacklisted) {
        ruleTriggers.push("RULE-BLACKLIST");
        riskScore = 99;
      }

      // Threshold check
      const thresholdRule = activeRules.find((r) => r.id === "RULE-1");
      if (thresholdRule?.isActive && amount > (thresholdRule.parameterValue as number)) {
        ruleTriggers.push("RULE-1");
        riskScore += 45;
      }

      // Geolocation check
      const geoRule = activeRules.find((r) => r.id === "RULE-3");
      if (geoRule?.isActive) {
        const whitelisted = (geoRule.parameterValue as string).split(",");
        const isSuspiciousLoc = location.includes("Unknown") || 
                               (location.includes("London") && !whitelisted.includes("GB")) ||
                               (location.includes("New York") && !whitelisted.includes("US")) ||
                               (location.includes("Germany") && !whitelisted.includes("DE"));
        if (isSuspiciousLoc) {
          ruleTriggers.push("RULE-3");
          riskScore += 35;
        }
      }

      // Device check
      const deviceRule = activeRules.find((r) => r.id === "RULE-4");
      if (deviceRule?.isActive && device.includes("Linux / Unknown")) {
        ruleTriggers.push("RULE-4");
        riskScore += 20;
      }

      // Random high-risk spike to simulate velocity or other anomalies (10% chance)
      const velocityRule = activeRules.find((r) => r.id === "RULE-2");
      if (velocityRule?.isActive && Math.random() < 0.1) {
        ruleTriggers.push("RULE-2");
        riskScore += 30;
      }

      // Cap risk score at 99
      riskScore = Math.min(riskScore, 99);

      // 3. Determine transaction status
      let status: Transaction["status"] = "passed";
      if (riskScore >= 75) {
        status = "blocked";
      } else if (riskScore >= 45) {
        status = "flagged";
      }

      const newTxn: Transaction = {
        id: txnId,
        userId,
        amount,
        currency: "NGN",
        timestamp: new Date().toISOString(),
        riskScore,
        status,
        location,
        device,
        category,
        ruleTriggers,
      };

      // 4. Update transactions list (keep last 30 to prevent bloat)
      setTransactions((prev) => [newTxn, ...prev.slice(0, 29)]);

      // 5. If flagged/blocked, create an Alert
      if (status !== "passed") {
        // Increment triggers count in rules
        setRules((prev) =>
          prev.map((r) => (ruleTriggers.includes(r.id) ? { ...r, triggersCount: r.triggersCount + 1 } : r))
        );

        const alertId = `ALR-${Math.floor(Math.random() * 9000 + 1000)}`;
        const severity = riskScore >= 75 ? ("critical" as const) : ("high" as const);
        
        let alertType = "Suspicious Transaction Pattern";
        if (ruleTriggers.includes("RULE-SOS-LOCKDOWN")) {
          alertType = "Emergency SOS Circuit Breaker Intercept";
        } else if (ruleTriggers.includes("RULE-BLACKLIST")) {
          alertType = "Blacklisted Entity Security Threat";
        } else if (ruleTriggers.includes("RULE-1") && ruleTriggers.includes("RULE-3")) {
          alertType = "High Value + Cross-Border Anomaly";
        } else if (ruleTriggers.includes("RULE-1")) {
          alertType = "High Value Transaction Alert";
        } else if (ruleTriggers.includes("RULE-3")) {
          alertType = "Geolocation Security Alert";
        } else if (ruleTriggers.includes("RULE-2")) {
          alertType = "Velocity Threshold Breach";
        } else if (ruleTriggers.includes("RULE-4")) {
          alertType = "Hardware Identity Mismatch";
        }

        const reason = ruleTriggers.includes("RULE-SOS-LOCKDOWN")
          ? "EMERGENCY DEFCON 1 INTERCEPTION: Transaction exceeded emergency lockdown threshold (> ₦250,000) during active circuit breaker."
          : `Matched rules: [${ruleTriggers
              .map((id) => activeRules.find((r) => r.id === id)?.name || id)
              .join(", ")}]. Origin: ${location} via ${device}.`;

        const newAlert: Alert = {
          id: alertId,
          txnId: newTxn.id,
          type: alertType,
          amount: `₦${amount.toLocaleString()}`,
          user: userId,
          time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          status: "Active",
          severity,
          reason,
        };

        // Update alerts
        setAlerts((prev) => [newAlert, ...prev.slice(0, 24)]);
        
        // Push notification toast & sound
        setNewAlertNotification(newAlert);
        if (severity === "critical" || ruleTriggers.includes("RULE-SOS-LOCKDOWN")) {
          soundEngine.playCriticalAlert();
        } else {
          soundEngine.playWarningPing();
        }

        // Auto audit entry
        const entryId = `AUD-${Math.floor(Math.random() * 9000 + 1000)}`;
        const autoEntry: AuditLogEntry = {
          id: entryId,
          timestamp: new Date().toISOString(),
          analyst: "System Sentinel",
          action: "Rule Triggered",
          targetType: "Rule",
          targetId: ruleTriggers[0] || "System",
          details: `Transaction ${txnId} by ${userId} flagged with Risk Score ${riskScore}%. Generated Alert ${alertId}.`,
        };
        setAuditLogs((prev) => [autoEntry, ...prev]);
      }
    }, 6000); // generate every 6 seconds

    return () => clearInterval(interval);
  }, [isSimulatorActive]);

  const resetSystemToDefaults = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch (e) {
        console.error(e);
      }
    });
    setCurrentAnalyst(initialAnalyst);
    setTransactions(initialTransactions);
    setAlerts(initialAlerts);
    setCases(initialCases);
    setRules(initialRules);
    setAuditLogs([
      {
        id: `AUD-${Math.floor(Math.random() * 9000 + 1000)}`,
        timestamp: new Date().toISOString(),
        analyst: "System Administrator",
        action: "Factory Reset",
        targetType: "System",
        targetId: "SYSTEM",
        details: "System state and persistent caches were restored to factory demo defaults.",
      },
      ...initialAuditLogs,
    ]);
    setScheduledReports(initialReports);
    setBlacklistedUsers(initialBlacklisted);
    setIsEmergencyLockdown(false);
    setEmergencyLockdownDetails(null);
  }, []);

  return (
    <SystemStateContext.Provider
      value={{
        transactions,
        alerts,
        cases,
        rules,
        auditLogs,
        scheduledReports,
        blacklistedUsers,
        currentAnalyst,
        isSimulatorActive,
        isAudioMuted,
        toggleAudioMute,
        playChime,
        newAlertNotification,
        isEmergencyLockdown,
        emergencyLockdownDetails,
        toggleEmergencyLockdown,
        exportEmergencySOSDossier,
        setNewAlertNotification,
        updateCurrentAnalyst,
        toggleSimulator,
        resolveAlert,
        escalateAlert,
        updateCaseStatus,
        createInvestigationCase,
        addCaseNote,
        toggleRule,
        updateRuleThreshold,
        createRule,
        scheduleReport,
        toggleReportStatus,
        deleteReport,
        addAuditEntry,
        clearNotification,
        resetSystemToDefaults,
        forceApproveTransaction,
        manuallyFlagTransaction,
        dispatchStepUpChallenge,
        blacklistUser,
        unblacklistUser,
      }}
    >
      {children}
    </SystemStateContext.Provider>
  );
};
