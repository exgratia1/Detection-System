import { useEffect, useState } from "react";
import { useSystemState } from "../context/SystemStateContext";
import { AlertCircle, X, ShieldAlert, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotificationToast() {
  const { newAlertNotification, clearNotification, escalateAlert } = useSystemState();
  const [progress, setProgress] = useState(100);
  const navigate = useNavigate();

  useEffect(() => {
    if (!newAlertNotification) return;

    const duration = 5000; // 5 seconds
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          clearNotification();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [newAlertNotification, clearNotification]);

  if (!newAlertNotification) return null;

  const severityColor =
    newAlertNotification.severity === "critical"
      ? "border-red-500 bg-red-950/90 text-red-200"
      : "border-amber-500 bg-amber-950/90 text-amber-200";

  const handleReview = () => {
    clearNotification();
    navigate("/alerts");
  };

  const handleEscalate = () => {
    escalateAlert(newAlertNotification.id, newAlertNotification.severity);
    clearNotification();
    navigate("/investigations");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom duration-300">
      <div className={`border rounded-xl shadow-2xl backdrop-blur-md overflow-hidden ${severityColor}`}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {newAlertNotification.severity === "critical" ? (
                <ShieldAlert className="h-6 w-6 text-red-400 animate-bounce" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  New {newAlertNotification.severity} Risk Trigger
                </span>
                <button
                  onClick={clearNotification}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <h4 className="font-bold text-white mt-0.5 text-sm sm:text-base">
                {newAlertNotification.type}
              </h4>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                {newAlertNotification.reason}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-white">
                  {newAlertNotification.amount} • <span className="text-slate-400 font-normal">{newAlertNotification.user}</span>
                </div>
                <span className="text-xs text-slate-400">{newAlertNotification.time}</span>
              </div>
              <div className="mt-4 flex gap-2.5">
                <button
                  onClick={handleReview}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2 px-3 rounded-lg border border-slate-700 transition-all duration-150"
                >
                  Review Alert
                </button>
                <button
                  onClick={handleEscalate}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-md transition-all duration-150"
                >
                  Escalate Case <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="h-1 bg-slate-800 w-full">
          <div
            className={`h-full transition-all ease-linear ${
              newAlertNotification.severity === "critical" ? "bg-red-500" : "bg-amber-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
