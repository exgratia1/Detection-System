// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layouts/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import LiveMonitoringPage from "./pages/LiveMonitoringPage";
import AlertsPage from "./pages/AlertsPage";
import InvestigationsPage from "./pages/InvestigationsPage";
import RulesPage from "./pages/RulesPage";
import ReportsPage from "./pages/ReportsPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import AuditLogPage from "./pages/AuditLogPage";
import SettingsPage from "./pages/SettingsPage";
import WarRoomPage from "./pages/WarRoomPage";
import { SystemStateProvider } from "./context/SystemStateContext";

function App() {
  return (
    <SystemStateProvider>
      <BrowserRouter>
        <Routes>
          {/* Standalone Physical SOC War Room Wall Monitor */}
          <Route path="/war-room" element={<WarRoomPage />} />

          {/* All protected/dashboard routes use the layout with navbar + sidebar */}
          <Route element={<DashboardLayout />}>
            {/* Redirect root "/" → dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/live" element={<LiveMonitoringPage />} />

            <Route path="/alerts" element={<AlertsPage />} />

            <Route path="/investigations" element={<InvestigationsPage />} />

            <Route path="/rules" element={<RulesPage />} />

            <Route path="/reports" element={<ReportsPage />} />

            <Route path="/integrations" element={<IntegrationsPage />} />
            
            <Route path="/audit" element={<AuditLogPage />} />
            
            <Route path="/settings" element={<SettingsPage />} />

            {/* Catch-all for 404 */}
            <Route
              path="*"
              element={
                <div className="p-8 text-center text-xl text-slate-400 font-medium">
                  404 - Page Not Found
                </div>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </SystemStateProvider>
  );
}

export default App;

