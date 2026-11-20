import { useState } from "react";
import { useSystemState } from "../context/SystemStateContext";
import type { AnalystProfile } from "../context/SystemStateContext";
import { 
  User,
  Users, 
  Save, 
  UserPlus, 
  Trash, 
  Check, 
  Globe, 
  Lock,
  X,
  ShieldCheck,
  MapPin,
  Clock,
  Phone,
  Mail,
  Palette,
  RotateCcw,
  Database,
  AlertTriangle,
  Ban,
  Search,
  Volume2,
  VolumeX,
  BellRing,
  Play
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: "Admin" | "Senior Analyst" | "Junior Investigator";
  status: "Active" | "Away" | "Offline";
  email: string;
}

export default function SettingsPage() {
  const { 
    currentAnalyst, 
    updateCurrentAnalyst, 
    addAuditEntry,
    transactions,
    rules,
    cases,
    auditLogs,
    resetSystemToDefaults,
    blacklistedUsers,
    blacklistUser,
    unblacklistUser,
    isAudioMuted,
    toggleAudioMute,
    playChime
  } = useSystemState();

  // Active tab state
  const [activeTab, setActiveTab] = useState<"profile" | "general" | "team" | "security" | "blacklist">("profile");

  // Storage reset modal state
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);

  // Blacklist tab state
  const [blacklistSearch, setBlacklistSearch] = useState("");
  const [isAddingBlacklist, setIsAddingBlacklist] = useState(false);
  const [newBlacklistUser, setNewBlacklistUser] = useState({ userId: "", reason: "" });
  const [blacklistFeedback, setBlacklistFeedback] = useState<string | null>(null);

  // Analyst Profile local form state
  const [profileForm, setProfileForm] = useState<AnalystProfile>({ ...currentAnalyst });
  const [showProfileSaved, setShowProfileSaved] = useState(false);

  // General state
  const [generalConfig, setGeneralConfig] = useState({
    orgName: "Sentinel Trust Microfinance",
    defaultCurrency: "NGN (₦)",
    sessionTimeout: 30, // minutes
    alertThreshold: 45, // minimum score to alert
  });
  const [showGeneralSaved, setShowGeneralSaved] = useState(false);

  // Analysts team state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: "mem-1", name: currentAnalyst.name, role: currentAnalyst.role, status: currentAnalyst.status, email: currentAnalyst.email },
    { id: "mem-2", name: "Sarah Alao", role: "Admin", status: "Active", email: "sarah.alao@sentinel.com" },
    { id: "mem-3", name: "Emmanuel Okafor", role: "Junior Investigator", status: "Away", email: "emmanuel@sentinel.com" },
  ]);

  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    role: "Junior Investigator" as TeamMember["role"],
    email: "",
  });

  const avatarColorMap: Record<string, { bg: string; text: string; ring: string; border: string }> = {
    indigo: { bg: "bg-indigo-600/30", text: "text-indigo-300", ring: "ring-indigo-500/40", border: "border-indigo-500" },
    emerald: { bg: "bg-emerald-600/30", text: "text-emerald-300", ring: "ring-emerald-500/40", border: "border-emerald-500" },
    violet: { bg: "bg-violet-600/30", text: "text-violet-300", ring: "ring-violet-500/40", border: "border-violet-500" },
    rose: { bg: "bg-rose-600/30", text: "text-rose-300", ring: "ring-rose-500/40", border: "border-rose-500" },
    blue: { bg: "bg-blue-600/30", text: "text-blue-300", ring: "ring-blue-500/40", border: "border-blue-500" },
    amber: { bg: "bg-amber-600/30", text: "text-amber-300", ring: "ring-amber-500/40", border: "border-amber-500" },
  };

  const previewAvatarStyles = avatarColorMap[profileForm.avatarColor] || avatarColorMap.indigo;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentAnalyst(profileForm);
    
    // Also synchronize this analyst's entry in teamMembers
    setTeamMembers(prev => prev.map(m => {
      if (m.email === currentAnalyst.email || m.name === currentAnalyst.name) {
        return {
          ...m,
          name: profileForm.name,
          email: profileForm.email,
          role: profileForm.role,
          status: profileForm.status,
        };
      }
      return m;
    }));

    setShowProfileSaved(true);
    setTimeout(() => setShowProfileSaved(false), 3000);
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setShowGeneralSaved(true);
    addAuditEntry("System Settings Modified", "System", "SETTINGS", `Analyst modified general organization configurations.`);
    setTimeout(() => setShowGeneralSaved(false), 3000);
  };

  const handleExecuteReset = () => {
    resetSystemToDefaults();
    setIsConfirmingReset(false);
    setShowResetSuccess(true);
    setTimeout(() => {
      setShowResetSuccess(false);
      window.location.reload();
    }, 1200);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const newMemberItem: TeamMember = {
      id: `mem-${Math.floor(Math.random() * 1000)}`,
      name: newMember.name,
      role: newMember.role,
      status: "Active",
      email: newMember.email,
    };

    setTeamMembers([...teamMembers, newMemberItem]);
    setIsAddingMember(false);
    setNewMember({ name: "", role: "Junior Investigator", email: "" });
    addAuditEntry("Team Member Added", "System", newMemberItem.id, `Added team member: ${newMemberItem.name} as ${newMemberItem.role}`);
  };

  const handleDeleteMember = (id: string, name: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
    addAuditEntry("Team Member Removed", "System", id, `Removed team member: ${name}`);
  };

  const handleAddBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlacklistUser.userId.trim()) return;
    blacklistUser(newBlacklistUser.userId.trim(), newBlacklistUser.reason.trim() || "Manual compliance ban");
    setBlacklistFeedback(`Entity ${newBlacklistUser.userId.trim()} added to active blacklist.`);
    setIsAddingBlacklist(false);
    setNewBlacklistUser({ userId: "", reason: "" });
    setTimeout(() => setBlacklistFeedback(null), 3000);
  };

  const handleRemoveBlacklist = (userId: string) => {
    unblacklistUser(userId);
    setBlacklistFeedback(`Entity ${userId} unbanned and restored.`);
    setTimeout(() => setBlacklistFeedback(null), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings & Profile</h1>
        <p className="mt-1 text-slate-400 text-sm">
          Manage your analyst profile, operational security preferences, and team authorizations
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
            activeTab === "profile"
              ? "border-indigo-500 text-indigo-400 bg-slate-900/60"
              : "border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30"
          }`}
        >
          <User className="h-4 w-4" /> My Analyst Profile
        </button>

        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
            activeTab === "general"
              ? "border-indigo-500 text-indigo-400 bg-slate-900/60"
              : "border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30"
          }`}
        >
          <Globe className="h-4 w-4" /> General Organization
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
            activeTab === "team"
              ? "border-indigo-500 text-indigo-400 bg-slate-900/60"
              : "border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30"
          }`}
        >
          <Users className="h-4 w-4" /> Analyst Team Privileges
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
            activeTab === "security"
              ? "border-indigo-500 text-indigo-400 bg-slate-900/60"
              : "border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30"
          }`}
        >
          <Lock className="h-4 w-4" /> Compliance & Security
        </button>

        <button
          onClick={() => setActiveTab("blacklist")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
            activeTab === "blacklist"
              ? "border-red-500 text-red-400 bg-slate-900/60"
              : "border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30"
          }`}
        >
          <Ban className="h-4 w-4" /> Watchlist & Blacklist ({blacklistedUsers.length})
        </button>
      </div>

      {/* Tab 1: Analyst Profile */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Left Column: Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <User className="h-4.5 w-4.5 text-indigo-400" /> Personal Identity & Credentials
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Changes here update your header badge, incident logs, and timeline author tags immediately.
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  profileForm.status === "Active" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${profileForm.status === "Active" ? "bg-emerald-400" : "bg-amber-400"}`} />
                  {profileForm.status}
                </span>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-indigo-400" /> Analyst Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-indigo-400" /> Operational Email
                    </label>
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Assigned Role */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" /> Security Role & Clearance
                    </label>
                    <select
                      value={profileForm.role}
                      onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value as AnalystProfile["role"] })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                    >
                      <option value="Senior Analyst">Senior Analyst (Override, Escalate & Approve)</option>
                      <option value="Junior Investigator">Junior Investigator (Review & Note)</option>
                      <option value="Admin">Admin (Full System Privilege)</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Duty Status</label>
                    <select
                      value={profileForm.status}
                      onChange={(e) => setProfileForm({ ...profileForm, status: e.target.value as AnalystProfile["status"] })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                    >
                      <option value="Active">Active (Ready for queue alerts)</option>
                      <option value="Away">Away (Standby)</option>
                      <option value="Offline">Offline</option>
                    </select>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" /> Contact Phone
                    </label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400" /> Unit / Department
                    </label>
                    <input
                      type="text"
                      value={profileForm.department}
                      onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" /> Station Location
                    </label>
                    <input
                      type="text"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Timezone */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" /> Operational Timezone
                    </label>
                    <input
                      type="text"
                      value={profileForm.timezone}
                      onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Avatar Color Picker */}
                <div className="pt-2 border-t border-slate-850">
                  <label className="block text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-indigo-400" /> Avatar Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    {(["indigo", "emerald", "violet", "rose", "blue", "amber"] as const).map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setProfileForm({ ...profileForm, avatarColor: color })}
                        className={`h-7 w-7 rounded-full transition-transform flex items-center justify-center ${
                          color === "indigo" ? "bg-indigo-500" :
                          color === "emerald" ? "bg-emerald-500" :
                          color === "violet" ? "bg-violet-500" :
                          color === "rose" ? "bg-rose-500" :
                          color === "blue" ? "bg-blue-500" : "bg-amber-500"
                        } ${profileForm.avatarColor === color ? "ring-2 ring-white scale-110 shadow-lg" : "opacity-70 hover:opacity-100"}`}
                        title={color}
                      >
                        {profileForm.avatarColor === color && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-850 flex items-center justify-between">
                  {showProfileSaved ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5 animate-in fade-in duration-200">
                      <Check className="h-4 w-4 text-emerald-500" /> Profile updated across system!
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[11px]">
                      * Changes will update your active session badges across all pages in real time.
                    </span>
                  )}
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-lg transition shadow-md"
                  >
                    <Save className="h-4 w-4" /> Save Profile
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Live Card Preview */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-lg text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Live Badge Preview</span>
              
              <div className="flex flex-col items-center pt-2">
                <div className="relative">
                  <div className={`h-20 w-20 rounded-full ${previewAvatarStyles.bg} ring-2 ${previewAvatarStyles.ring} flex items-center justify-center ${previewAvatarStyles.text} font-bold text-3xl shadow-2xl`}>
                    {profileForm.name ? profileForm.name.charAt(0).toUpperCase() : "A"}
                  </div>
                  <span className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-slate-900 ${
                    profileForm.status === "Active" ? "bg-emerald-500 animate-pulse" : profileForm.status === "Away" ? "bg-amber-500" : "bg-slate-500"
                  }`} />
                </div>

                <h3 className="text-lg font-bold text-white mt-3">{profileForm.name || "Analyst Name"}</h3>
                <p className="text-xs text-slate-400">{profileForm.email || "email@sentinel.com"}</p>

                <div className="mt-2.5 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                  {profileForm.role}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80 text-left space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span className="text-slate-500">Unit:</span>
                  <span className="text-slate-200 font-medium">{profileForm.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="text-slate-200 font-medium">{profileForm.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Timezone:</span>
                  <span className="text-slate-200 font-medium">{profileForm.timezone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: General Organization */}
      {activeTab === "general" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-lg">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800/60 pb-3">
                <Globe className="h-4.5 w-4.5 text-indigo-400" /> General Administration Config
              </h3>
              
              <form onSubmit={handleSaveGeneral} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Org Name */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Organization Name</label>
                    <input
                      type="text"
                      required
                      value={generalConfig.orgName}
                      onChange={(e) => setGeneralConfig({ ...generalConfig, orgName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Default Currency */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Default System Currency</label>
                    <select
                      value={generalConfig.defaultCurrency}
                      onChange={(e) => setGeneralConfig({ ...generalConfig, defaultCurrency: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                    >
                      <option value="NGN (₦)">NGN (₦) - Nigerian Naira</option>
                      <option value="USD ($)">USD ($) - US Dollar</option>
                      <option value="EUR (€)">EUR (€) - Euro</option>
                      <option value="GBP (£)">GBP (£) - British Pound</option>
                    </select>
                  </div>

                  {/* Session Timeout */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Max Analyst Session Timeout (Minutes)</label>
                    <input
                      type="number"
                      required
                      min="5"
                      max="120"
                      value={generalConfig.sessionTimeout}
                      onChange={(e) => setGeneralConfig({ ...generalConfig, sessionTimeout: parseInt(e.target.value) || 30 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Minimum Score */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-semibold">Global Minimum Threat Score Alert (0-100)</label>
                    <input
                      type="number"
                      required
                      min="10"
                      max="90"
                      value={generalConfig.alertThreshold}
                      onChange={(e) => setGeneralConfig({ ...generalConfig, alertThreshold: parseInt(e.target.value) || 45 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-850 flex items-center justify-between gap-4">
                  {showGeneralSaved ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5 animate-in fade-in duration-200">
                      <Check className="h-4 w-4 text-emerald-500" /> Settings saved successfully!
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[10px]">
                      * Changes will update default calculations and risk thresholds.
                    </span>
                  )}
                  
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-lg transition shadow-md"
                  >
                    <Save className="h-4 w-4" /> Save Configuration
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Persistent Storage & Factory Reset */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-lg">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="h-4.5 w-4.5 text-indigo-400" /> Persistent Storage
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Local browser state caching & demo controls</p>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                  <span className="text-slate-400">Cache Engine:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LocalStorage Active
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Buffered Transactions:</span>
                  <span className="font-bold text-white">{transactions.length} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Policy Rules:</span>
                  <span className="font-bold text-white">{rules.length} configured</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Cases:</span>
                  <span className="font-bold text-white">{cases.length} records</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Audit Entries:</span>
                  <span className="font-bold text-white">{auditLogs.length} events</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(true)}
                  className="w-full flex items-center justify-center gap-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 text-rose-300 font-semibold text-xs py-2.5 rounded-lg transition"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-rose-400" /> Reset System to Demo Defaults
                </button>
                <p className="text-[10.5px] text-slate-500 mt-2 text-center">
                  Clears local browser cache and restores initial simulated scenario.
                </p>
              </div>
            </div>

            {/* Acoustic Threat Alerts & Sound Engine */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BellRing className="h-4.5 w-4.5 text-indigo-400" /> Acoustic Threat Alerts
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Synthesized native audio alerts for SOC events</p>
                </div>
                <button
                  type="button"
                  onClick={toggleAudioMute}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    isAudioMuted
                      ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      : "bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30"
                  }`}
                >
                  {isAudioMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  <span>{isAudioMuted ? "Unmute" : "Mute Alerts"}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                  <span className="text-slate-400">Audio Engine Status:</span>
                  <span className={`font-semibold flex items-center gap-1.5 ${
                    isAudioMuted ? "text-slate-400" : "text-emerald-400"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      isAudioMuted ? "bg-slate-500" : "bg-emerald-400 animate-pulse"
                    }`} />
                    {isAudioMuted ? "Audio Muted (Silent Mode)" : "Acoustic Synthesizer Active"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Audio Architecture:</span>
                  <span className="font-mono text-slate-300">HTML5 Web Audio API</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Asset Footprint:</span>
                  <span className="font-semibold text-indigo-300">0 KB (Zero External MP3s)</span>
                </div>
              </div>

              {/* Sound Preview Testing Matrix */}
              <div className="space-y-2 pt-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Test Alert Chimes
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => playChime("critical")}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-red-950/30 hover:bg-red-900/50 border border-red-900/40 text-left transition text-xs group"
                  >
                    <div>
                      <span className="font-semibold text-red-300 block text-[11px]">Critical Threat</span>
                      <span className="text-[10px] text-slate-500 block">Dual-oscillator pulse</span>
                    </div>
                    <Play className="h-3 w-3 text-red-400 group-hover:scale-125 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => playChime("emergency")}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-left transition text-xs group"
                  >
                    <div>
                      <span className="font-semibold text-rose-300 block text-[11px]">SOS Siren</span>
                      <span className="text-[10px] text-slate-500 block">DEFCON-1 warble</span>
                    </div>
                    <Play className="h-3 w-3 text-rose-400 group-hover:scale-125 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => playChime("warning")}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-amber-950/30 hover:bg-amber-900/50 border border-amber-900/40 text-left transition text-xs group"
                  >
                    <div>
                      <span className="font-semibold text-amber-300 block text-[11px]">Warning Ping</span>
                      <span className="text-[10px] text-slate-500 block">Medium risk chime</span>
                    </div>
                    <Play className="h-3 w-3 text-amber-400 group-hover:scale-125 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => playChime("success")}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-900/40 text-left transition text-xs group"
                  >
                    <div>
                      <span className="font-semibold text-emerald-300 block text-[11px]">Clearance Chime</span>
                      <span className="text-[10px] text-slate-500 block">Triad approval chord</span>
                    </div>
                    <Play className="h-3 w-3 text-emerald-400 group-hover:scale-125 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Team Privileges */}
      {activeTab === "team" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-lg">
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="h-4.5 w-4.5 text-indigo-400" /> Analyst Team Privileges
                </h3>
                <p className="text-xs text-slate-400">Manage user authorization groups and operational status</p>
              </div>
              <button
                onClick={() => setIsAddingMember(true)}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow"
              >
                <UserPlus className="h-3.5 w-3.5" /> Add Analyst
              </button>
            </div>

            {/* Team list */}
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="text-slate-500 font-bold border-b border-slate-850">
                  <tr>
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Assigned Role</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {teamMembers.map(m => (
                    <tr key={m.id} className="text-slate-300 hover:bg-slate-850/10 transition-colors">
                      <td className="py-3 font-bold text-white flex items-center gap-2">
                        <span>{m.name}</span>
                        {m.email === currentAnalyst.email && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">
                            You
                          </span>
                        )}
                      </td>
                      <td className="py-3">{m.email}</td>
                      <td className="py-3">
                        <span className="font-semibold text-slate-300">{m.role}</span>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1.5 ${
                          m.status === "Active" ? "text-emerald-400" : m.status === "Away" ? "text-amber-400" : "text-slate-500"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            m.status === "Active" ? "bg-green-500 animate-pulse" : m.status === "Away" ? "bg-amber-500" : "bg-slate-500"
                          }`} />
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteMember(m.id, m.name)}
                          disabled={m.email === currentAnalyst.email || m.name === currentAnalyst.name}
                          className="text-red-400 hover:text-red-300 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title={m.email === currentAnalyst.email ? "Cannot delete currently active account" : "Revoke Access"}
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security Policy */}
      {activeTab === "security" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 shadow-lg">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="h-4.5 w-4.5 text-indigo-400" /> Security Compliance Policy
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Global operational security & AML auditing rules</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-lg space-y-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-indigo-400" /> ISO 27001 Protocol
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Compliance protocol strictly monitors and audits rule edits, key generation, and transaction overrides. All actions are appended as cryptographic blocks to the Audit ledger.
                </p>
              </div>

              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-lg space-y-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-amber-400" /> Beneficiary Blacklisting
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Escalating cases to "Resolved (Fraud)" triggers an automated downstream callback to blacklist the destination bank accounts and international swift beneficiaries.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Watchlist & Blacklist */}
      {activeTab === "blacklist" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {blacklistFeedback && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
              <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>{blacklistFeedback}</span>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Ban className="h-4.5 w-4.5 text-red-400" /> Watchlist & Blacklist Engine
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  High-risk and sanctioned entities blocked instantly. The live simulator automatically halts and creates critical alerts for blacklisted accounts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingBlacklist(true)}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition shadow-md flex-shrink-0"
              >
                <Ban className="h-3.5 w-3.5" /> Blacklist Entity
              </button>
            </div>

            {/* Search and Filters */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={blacklistSearch}
                onChange={(e) => setBlacklistSearch(e.target.value)}
                placeholder="Filter by User ID, ban reason, or analyst..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-red-500 transition"
              />
            </div>

            {/* Blacklist Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Entity / User ID</th>
                      <th className="px-4 py-3">Enforcement Reason</th>
                      <th className="px-4 py-3">Blacklisted At</th>
                      <th className="px-4 py-3">Enforcing Analyst</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {blacklistedUsers
                      .filter((b) => {
                        const q = blacklistSearch.toLowerCase();
                        if (!q) return true;
                        return (
                          b.userId.toLowerCase().includes(q) ||
                          b.reason.toLowerCase().includes(q) ||
                          b.blacklistedBy.toLowerCase().includes(q)
                        );
                      })
                      .map((user) => (
                        <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-red-300 bg-red-950/30 border border-red-900/40 px-2 py-0.5 rounded">
                              {user.userId}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-200">
                            {user.reason}
                          </td>
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                            {new Date(user.blacklistedAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                              {user.blacklistedBy}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleRemoveBlacklist(user.userId)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-800/40 rounded transition"
                            >
                              Unban User
                            </button>
                          </td>
                        </tr>
                      ))}

                    {blacklistedUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-500">
                          <Ban className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                          <p className="font-semibold text-slate-400">No active blacklist restrictions</p>
                          <p className="text-[11px] mt-0.5">All incoming user transactions will be evaluated solely by policy rules.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Form Modal */}
      {isAddingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsAddingMember(false)} />
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">Add Analyst User</h3>
              <button onClick={() => setIsAddingMember(false)} className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-400"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleAddMember} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold">User Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oluwaseun Adesina"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold">Security Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. o.adesina@sentinel.com"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold">Role Group Privilege</label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value as TeamMember["role"] })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                >
                  <option value="Junior Investigator">Junior Investigator (Review-Only)</option>
                  <option value="Senior Analyst">Senior Analyst (Override & Escalate)</option>
                  <option value="Admin">Admin (Full System Privilege)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg transition shadow-md"
              >
                Register User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Blacklist Entity Modal */}
      {isAddingBlacklist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsAddingBlacklist(false)} />
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Ban className="h-4.5 w-4.5 text-red-400" /> Blacklist User or Account
              </h3>
              <button onClick={() => setIsAddingBlacklist(false)} className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddBlacklist} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold">User or Account ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. USR-10928 or ACC-77281"
                  value={newBlacklistUser.userId}
                  onChange={(e) => setNewBlacklistUser({ ...newBlacklistUser, userId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold">Violation / Regulatory Reason</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Confirmed synthetic identity attack and unauthorized chargeback surge"
                  value={newBlacklistUser.reason}
                  onChange={(e) => setNewBlacklistUser({ ...newBlacklistUser, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-red-500"
                />
              </div>

              <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-slate-400 text-[11px] leading-relaxed">
                Adding this entity will immediately trigger automatic 99% risk scores and Critical alert creation on any future transactions generated or processed by the system.
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingBlacklist(false)}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition shadow-md"
                >
                  Confirm Blacklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isConfirmingReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsConfirmingReset(false)} />
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30">
                <AlertTriangle className="h-5 w-5 text-rose-400" />
              </div>
              <h3 className="text-base font-bold text-white">Reset System to Factory Defaults?</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              This action will wipe custom rules, case updates, analyst profile adjustments, and generated transactions saved in local browser storage, restoring the clean factory demonstration scenario.
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setIsConfirmingReset(false)}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition shadow-md"
              >
                Confirm Factory Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success notification toast for reset */}
      {showResetSuccess && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-300">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>System restored to defaults. Reloading session...</span>
        </div>
      )}
    </div>
  );
}
