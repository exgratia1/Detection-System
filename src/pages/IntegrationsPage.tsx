import { useState, useEffect } from "react";
import { useSystemState } from "../context/SystemStateContext";
import { 
  Key, 
  Webhook, 
  Slack, 
  Mail, 
  Terminal, 
  Copy, 
  Trash, 
  Plus, 
  Check, 
  X,
  Settings,
  ShieldCheck
} from "lucide-react";

interface APIKey {
  id: string;
  name: string;
  prefix: string;
  scope: "Read-Only" | "Read-Write" | "Admin";
  createdAt: string;
}

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  status: "Active" | "Inactive";
  createdAt: string;
}

export default function IntegrationsPage() {
  const { addAuditEntry } = useSystemState();

  // API Keys state
  const [apiKeys, setApiKeys] = useState<APIKey[]>(() => {
    try {
      const saved = localStorage.getItem("fds_api_keys");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      { id: "key-1", name: "Core API Prevention Service", prefix: "fds_live_k8s2...", scope: "Read-Write", createdAt: "2026-02-14" },
      { id: "key-2", name: "Compliance Reporting Daemon", prefix: "fds_live_r0a9...", scope: "Read-Only", createdAt: "2026-04-02" },
    ];
  });
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScope, setNewKeyScope] = useState<APIKey["scope"]>("Read-Only");
  const [displayedNewKey, setDisplayedNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(() => {
    try {
      const saved = localStorage.getItem("fds_webhooks");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      { id: "web-1", url: "https://api.compliance-internal.org/v1/fraud-alerts", events: ["alert.created", "case.resolved"], status: "Active", createdAt: "2026-01-10" },
    ];
  });
  const [isAddingWebhook, setIsAddingWebhook] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(["alert.created"]);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testWebhookResult, setTestWebhookResult] = useState<string | null>(null);

  // Communication toggles
  const [channels, setChannels] = useState(() => {
    try {
      const saved = localStorage.getItem("fds_channels");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      slack: true,
      pagerduty: false,
      email: true,
    };
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("fds_api_keys", JSON.stringify(apiKeys));
    } catch {
      // ignore
    }
  }, [apiKeys]);

  useEffect(() => {
    try {
      localStorage.setItem("fds_webhooks", JSON.stringify(webhooks));
    } catch {
      // ignore
    }
  }, [webhooks]);

  useEffect(() => {
    try {
      localStorage.setItem("fds_channels", JSON.stringify(channels));
    } catch {
      // ignore
    }
  }, [channels]);

  // API Key handlers
  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    const randomSuffix = Math.random().toString(36).substring(2, 18);
    const generated = `fds_live_${newKeyScope.toLowerCase().substring(0, 1)}_${randomSuffix}`;
    const newKeyItem: APIKey = {
      id: `key-${Math.floor(Math.random() * 1000)}`,
      name: newKeyName,
      prefix: `${generated.substring(0, 12)}...`,
      scope: newKeyScope,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setApiKeys([...apiKeys, newKeyItem]);
    setDisplayedNewKey(generated);
    setIsGeneratingKey(false);
    setNewKeyName("");
    setNewKeyScope("Read-Only");
    addAuditEntry("API Key Generated", "APIKey", newKeyItem.id, `Analyst created API Key: ${newKeyItem.name}`);
  };

  const handleDeleteKey = (id: string, name: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== id));
    addAuditEntry("API Key Deleted", "APIKey", id, `Analyst deleted API Key: ${name}`);
  };

  const handleCopyKey = () => {
    if (!displayedNewKey) return;
    navigator.clipboard.writeText(displayedNewKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Webhook handlers
  const handleAddWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    const newWeb: WebhookConfig = {
      id: `web-${Math.floor(Math.random() * 1000)}`,
      url: newWebhookUrl,
      events: newWebhookEvents,
      status: "Active",
      createdAt: new Date().toISOString().split("T")[0],
    };

    setWebhooks([...webhooks, newWeb]);
    setIsAddingWebhook(false);
    setNewWebhookUrl("");
    setNewWebhookEvents(["alert.created"]);
    addAuditEntry("Webhook Registered", "System", newWeb.id, `Registered webhook endpoint: ${newWeb.url}`);
  };

  const handleToggleWebhookEvent = (ev: string) => {
    if (newWebhookEvents.includes(ev)) {
      setNewWebhookEvents(newWebhookEvents.filter(e => e !== ev));
    } else {
      setNewWebhookEvents([...newWebhookEvents, ev]);
    }
  };

  const handleTestWebhook = (_id: string, url: string) => {
    setIsTestingWebhook(true);
    setTestWebhookResult(null);
    setTimeout(() => {
      setIsTestingWebhook(false);
      setTestWebhookResult(`Test payload delivered successfully to ${url}. Status: 200 OK (latency: 184ms)`);
      setTimeout(() => setTestWebhookResult(null), 5000);
    }, 1200);
  };

  const handleDeleteWebhook = (id: string, url: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
    addAuditEntry("Webhook Deleted", "System", id, `Deleted webhook endpoint: ${url}`);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">API & Integrations</h1>
        <p className="mt-1 text-slate-400 text-sm">
          Manage secure API access tokens, event webhooks, and third-party communication channels
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: API Credentials & Webhooks */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* API Keys Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-lg">
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Key className="h-4.5 w-4.5 text-indigo-400" /> Web API Access Keys
                </h3>
                <p className="text-xs text-slate-400">Tokens used to authenticate requests to the FDS prevention engine</p>
              </div>
              <button
                onClick={() => setIsGeneratingKey(true)}
                className="flex items-center gap-1 bg-slate-855 hover:bg-slate-800 border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition"
              >
                <Plus className="h-3.5 w-3.5" /> Generate Key
              </button>
            </div>

            {/* Keys Table */}
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="text-slate-500 font-bold border-b border-slate-850">
                  <tr>
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Token Prefix</th>
                    <th className="pb-2">Access Scope</th>
                    <th className="pb-2">Created</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {apiKeys.map(k => (
                    <tr key={k.id} className="text-slate-350 hover:bg-slate-850/10 transition-colors">
                      <td className="py-3 font-bold text-white">{k.name}</td>
                      <td className="py-3"><code className="bg-slate-950/60 p-1 rounded font-mono text-[11px] border border-slate-800">{k.prefix}</code></td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          k.scope === "Admin" 
                            ? "bg-red-500/15 text-red-400" 
                            : k.scope === "Read-Write" 
                              ? "bg-indigo-500/15 text-indigo-400" 
                              : "bg-slate-500/15 text-slate-400"
                        }`}>
                          {k.scope}
                        </span>
                      </td>
                      <td className="py-3">{k.createdAt}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteKey(k.id, k.name)}
                          className="text-red-450 hover:text-red-400 transition"
                          title="Revoke Key"
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

          {/* Webhooks Config Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-lg">
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Webhook className="h-4.5 w-4.5 text-indigo-400" /> System Action Webhooks
                </h3>
                <p className="text-xs text-slate-400">Receive HTTP POST payloads in real-time when fraud actions occur</p>
              </div>
              <button
                onClick={() => setIsAddingWebhook(true)}
                className="flex items-center gap-1 bg-slate-855 hover:bg-slate-800 border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition"
              >
                <Plus className="h-3.5 w-3.5" /> Register URL
              </button>
            </div>

            {/* Webhooks table */}
            <div className="space-y-3">
              {webhooks.map(w => (
                <div key={w.id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <div className="font-bold text-white truncate max-w-[280px] sm:max-w-[400px]">
                      {w.url}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestWebhook(w.id, w.url)}
                        disabled={isTestingWebhook}
                        className="text-[10px] bg-slate-850 hover:bg-slate-800 border border-slate-750 text-indigo-400 font-bold px-2.5 py-1 rounded transition disabled:opacity-50"
                      >
                        {isTestingWebhook ? "Pinging..." : "Test Ping"}
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(w.id, w.url)}
                        className="text-red-450 hover:text-red-400 transition"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-850 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      Status: <strong className="text-emerald-400">Active</strong>
                    </span>
                    <span>•</span>
                    <span>Events: <strong className="text-slate-350">{w.events.join(", ")}</strong></span>
                  </div>
                </div>
              ))}

              {testWebhookResult && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 flex items-center gap-2 animate-in slide-in-from-top duration-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>{testWebhookResult}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Channels */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 shadow-lg">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="h-4.5 w-4.5 text-indigo-400" /> Messaging Channels
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Route critical threats to external alert portals</p>
            </div>

            {/* Channel list */}
            <div className="space-y-4 text-xs">
              {/* Slack */}
              <div className="flex justify-between items-center p-3 bg-slate-950/30 border border-slate-850 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 border border-slate-800 text-white rounded-lg">
                    <Slack className="h-4.5 w-4.5 text-[#e01e5a]" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Slack Alerts Bot</span>
                    <span className="text-[10px] text-slate-500">Send logs to #ops-threat-alerts</span>
                  </div>
                </div>
                <button
                  onClick={() => setChannels({ ...channels, slack: !channels.slack })}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                    channels.slack ? "bg-indigo-600" : "bg-slate-800"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                    channels.slack ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* PagerDuty */}
              <div className="flex justify-between items-center p-3 bg-slate-950/30 border border-slate-850 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 border border-slate-800 text-white rounded-lg">
                    <Terminal className="h-4.5 w-4.5 text-orange-400" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">PagerDuty Incident</span>
                    <span className="text-[10px] text-slate-500">Trigger on-call analyst escalation</span>
                  </div>
                </div>
                <button
                  onClick={() => setChannels({ ...channels, pagerduty: !channels.pagerduty })}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                    channels.pagerduty ? "bg-indigo-600" : "bg-slate-800"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                    channels.pagerduty ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Email */}
              <div className="flex justify-between items-center p-3 bg-slate-950/30 border border-slate-850 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 border border-slate-800 text-white rounded-lg">
                    <Mail className="h-4.5 w-4.5 text-blue-400" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Email Dispatcher</span>
                    <span className="text-[10px] text-slate-500">Daily reports compliance logs</span>
                  </div>
                </div>
                <button
                  onClick={() => setChannels({ ...channels, email: !channels.email })}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                    channels.email ? "bg-indigo-600" : "bg-slate-800"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                    channels.email ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Reveal Modal */}
      {displayedNewKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDisplayedNewKey(null)} />
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 z-10 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" /> Token Generated Successfully
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Copy this token now. For security purposes, you will not be able to view it again once this modal is closed.
            </p>
            
            <div className="flex gap-2 bg-slate-950 p-3 rounded-lg border border-slate-850 items-center justify-between font-mono text-xs text-indigo-300">
              <code className="truncate max-w-[280px]">{displayedNewKey}</code>
              <button
                onClick={handleCopyKey}
                className="p-1.5 rounded bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white transition"
                title="Copy to Clipboard"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <button
              onClick={() => setDisplayedNewKey(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2.5 rounded-lg mt-5 transition"
            >
              Done, I have saved the token
            </button>
          </div>
        </div>
      )}

      {/* Generate Key Form Modal */}
      {isGeneratingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsGeneratingKey(false)} />
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">Generate Access Token</h3>
              <button onClick={() => setIsGeneratingKey(false)} className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-400"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleGenerateKey} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold">Key Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Analytics Exporter Node"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold">Security Scope</label>
                <select
                  value={newKeyScope}
                  onChange={(e) => setNewKeyScope(e.target.value as APIKey["scope"])}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                >
                  <option value="Read-Only">Read-Only (Access logs & reports)</option>
                  <option value="Read-Write">Read-Write (Evaluate & override transactions)</option>
                  <option value="Admin">Admin (Full privileges to manage rules)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg transition shadow-md"
              >
                Generate Secure Token
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Webhook Form Modal */}
      {isAddingWebhook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsAddingWebhook(false)} />
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">Register Webhook Endpoint</h3>
              <button onClick={() => setIsAddingWebhook(false)} className="p-1 rounded bg-slate-855 hover:bg-slate-800 text-slate-400"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleAddWebhook} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold">Payload Destination URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://api.yourdomain.com/webhooks"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold">Triggering Event Topics</label>
                <div className="space-y-2 pt-1">
                  {["alert.created", "case.escalated", "case.resolved", "transaction.blocked"].map(ev => {
                    const isChecked = newWebhookEvents.includes(ev);
                    return (
                      <label key={ev} className="flex items-center gap-2 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleWebhookEvent(ev)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 bg-slate-950 border-slate-800"
                        />
                        <span>{ev}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={newWebhookEvents.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg transition shadow-md disabled:bg-slate-800 disabled:text-slate-600"
              >
                Register Endpoint
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
