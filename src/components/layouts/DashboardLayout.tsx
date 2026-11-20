import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import FraudDetectionNavbar from "../Navbar";
import Sidebar from "../Sidebar";
import NotificationToast from "../NotificationToast";
import CommandPalette from "../CommandPalette";
import SOSBanner from "../SOSBanner";
import SOSModal from "../SOSModal";
import SARReportModal from "../SARReportModal";
import AICopilotDrawer from "../AICopilotDrawer";
import { useSystemState } from "../../context/SystemStateContext";

export default function DashboardLayout() {
  const location = useLocation();
  const { isSimulatorActive, newAlertNotification, currentAnalyst } = useSystemState();

  // Optional: derive current page title from path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard" || path === "/") return "Dashboard";
    if (path === "/live") return "Live Monitoring";
    if (path === "/alerts") return "Alerts & Notifications";
    if (path === "/investigations") return "Investigations";
    if (path === "/rules") return "Rules & Models";
    if (path === "/reports") return "Reports & Analytics";
    if (path === "/integrations") return "API & Integrations";
    if (path === "/audit") return "System Audit Log";
    if (path === "/settings") return "System Settings";
    return "Fraud Detection System";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Global Emergency SOS Lockdown Banner */}
      <SOSBanner />

      {/* Top Navigation */}
      <FraudDetectionNavbar />

      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {/* Page header / context bar */}
          <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    {getPageTitle()}
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Welcome back, {currentAnalyst.name} ({currentAnalyst.role}) • {currentAnalyst.location} •{" "}
                    {new Date().toLocaleDateString("en-NG", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {/* Quick actions / status */}
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="text-slate-300">System Status</div>
                    <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                      <span className={`h-2 w-2 rounded-full bg-green-500 ${isSimulatorActive ? "animate-pulse" : ""}`} />
                      {isSimulatorActive ? "All systems operational" : "Monitoring stream paused"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page content – rendered by Outlet */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading dashboard data...</p>
                  </div>
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

      {/* Global alert toast notifications */}
      <NotificationToast key={newAlertNotification?.id || "none"} />

      {/* Global Command Palette */}
      <CommandPalette />

      {/* Emergency SOS Response Modal */}
      <SOSModal />

      {/* Official Regulatory SAR Generator Modal */}
      <SARReportModal />

      {/* Sentinel AI Forensic Copilot Drawer */}
      <AICopilotDrawer />
    </div>
  );
}
