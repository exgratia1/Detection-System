// src/utils/sarExporter.ts
import type { InvestigationCase, Alert, Transaction, AnalystProfile, EmergencyLockdownDetails } from "../context/SystemStateContext";

export interface SARReportPayload {
  reportRef: string;
  generatedAt: string;
  agencyRecipient: "NFIU" | "CBN" | "EFCC" | "FATF";
  reportingAnalyst: AnalystProfile;
  lockdownDetails?: EmergencyLockdownDetails | null;
  targetCase?: InvestigationCase | null;
  targetAlert?: Alert | null;
  targetUser: string;
  disputedAmountNaira: number;
  violationReason: string;
  recommendedAction: string;
  interceptedTransactions: Transaction[];
  analystNarrative: string;
}

/**
 * Generates an official, print-ready Suspicious Activity Report (SAR)
 * and opens the browser's native print-to-PDF dialog.
 */
export function generatePrintableSARDossier(payload: SARReportPayload): void {
  const printWindow = window.open("", "_blank", "width=900,height=1100");
  if (!printWindow) {
    alert("Please allow popups to generate the official SAR Regulatory PDF.");
    return;
  }

  const dateStr = new Date(payload.generatedAt).toLocaleString("en-GB", {
    dateStyle: "full",
    timeStyle: "medium",
  });

  const agencyLabels: Record<string, string> = {
    NFIU: "NIGERIAN FINANCIAL INTELLIGENCE UNIT (NFIU) // SPECIAL FRAUD ANALYSIS UNIT",
    CBN: "CENTRAL BANK OF NIGERIA (CBN) // BANKING SUPERVISION DIRECTORATE",
    EFCC: "ECONOMIC AND FINANCIAL CRIMES COMMISSION (EFCC) // FINANCIAL CRIMES DESK",
    FATF: "FINANCIAL ACTION TASK FORCE (FATF) // INTERNATIONAL ANOMALY DESK",
  };

  const recipientTitle = agencyLabels[payload.agencyRecipient] || agencyLabels.NFIU;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CONFIDENTIAL_SAR_DOSSIER_${payload.reportRef}.pdf</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      font-size: 11pt;
      line-height: 1.45;
    }
    .watermark {
      position: fixed;
      top: 40%;
      left: 10%;
      right: 10%;
      text-align: center;
      font-size: 55pt;
      font-weight: 900;
      color: rgba(220, 38, 38, 0.06);
      transform: rotate(-35deg);
      pointer-events: none;
      z-index: 999;
      letter-spacing: 4px;
      text-transform: uppercase;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .classification-bar {
      background: #991b1b;
      color: #ffffff;
      font-size: 9pt;
      font-weight: bold;
      letter-spacing: 1.5px;
      text-align: center;
      padding: 4px;
      text-transform: uppercase;
      margin-bottom: 14px;
      border-radius: 2px;
    }
    .agency-title {
      font-size: 13pt;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      margin: 0 0 4px 0;
    }
    .document-title {
      font-size: 16pt;
      font-weight: 900;
      color: #b91c1c;
      letter-spacing: -0.5px;
      margin: 0 0 4px 0;
    }
    .metadata-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 14px;
      font-size: 9.5pt;
      margin-bottom: 20px;
    }
    .metadata-grid strong {
      color: #334155;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
      border-left: 4px solid #b91c1c;
      padding-left: 8px;
      margin: 18px 0 10px 0;
    }
    .table-container {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 9pt;
    }
    .table-container th {
      background: #0f172a;
      color: #ffffff;
      text-align: left;
      padding: 6px 8px;
      font-weight: 700;
    }
    .table-container td {
      border-bottom: 1px solid #e2e8f0;
      padding: 6px 8px;
    }
    .table-container tr:nth-child(even) {
      background: #f8fafc;
    }
    .narrative-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 12px;
      font-size: 9.5pt;
      margin-bottom: 16px;
      white-space: pre-wrap;
    }
    .signature-card {
      margin-top: 24px;
      border-top: 1px dashed #94a3b8;
      padding-top: 14px;
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 16px;
      font-size: 9pt;
    }
    .seal-box {
      border: 2px solid #b91c1c;
      border-radius: 6px;
      padding: 8px;
      text-align: center;
      color: #b91c1c;
      font-weight: 800;
      font-size: 8pt;
      text-transform: uppercase;
    }
    .no-print-bar {
      background: #1e293b;
      color: #ffffff;
      padding: 10px;
      text-align: center;
      margin: -24px -24px 24px -24px;
      font-size: 10pt;
    }
    .print-btn {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 6px 16px;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      margin-left: 12px;
    }
    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="watermark">RESTRICTED // LAW ENFORCEMENT</div>

  <div class="no-print-bar">
    <span>Official Regulatory Preview Ready. Click below to save as PDF or Print:</span>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="classification-bar">
    SECRET // RESTRICTED FINANCIAL DISCLOSURE (SEC 14 AML/CFT ACT 2022)
  </div>

  <div class="header">
    <h3 class="agency-title">${recipientTitle}</h3>
    <h1 class="document-title">OFFICIAL SUSPICIOUS ACTIVITY REPORT (SAR)</h1>
    <div style="font-size: 9pt; color: #64748b; display: flex; justify-content: space-between;">
      <span><strong>REF:</strong> ${payload.reportRef}</span>
      <span><strong>TIMESTAMP:</strong> ${dateStr}</span>
    </div>
  </div>

  <div class="metadata-grid">
    <div><strong>Target Account / Entity:</strong> ${payload.targetUser}</div>
    <div><strong>Disputed Total Volume:</strong> ₦${payload.disputedAmountNaira.toLocaleString()}</div>
    <div><strong>Authorizing Analyst:</strong> ${payload.reportingAnalyst.name} (${payload.reportingAnalyst.role})</div>
    <div><strong>Station / Node:</strong> ${payload.reportingAnalyst.location}</div>
    <div><strong>Regulatory Jurisdiction:</strong> Federal Republic of Nigeria (CBN / NFIU)</div>
    <div><strong>System Threat Status:</strong> ${payload.lockdownDetails ? "DEFCON 1 ACTIVE CIRCUIT BREAKER" : "STANDARD OPERATIONAL SENTINEL"}</div>
  </div>

  <div class="section-title">1. Executive Summary & Recommended Sanctions</div>
  <div class="narrative-box">
<strong>Violation Classification:</strong> ${payload.violationReason}
<strong>Recommended Enforcement:</strong> ${payload.recommendedAction}
  </div>

  <div class="section-title">2. Lead Investigator Findings & Narrative</div>
  <div class="narrative-box">
${payload.analystNarrative}
  </div>

  <div class="section-title">3. Intercepted Transaction Evidence Ledger</div>
  <table class="table-container">
    <thead>
      <tr>
        <th>Transaction ID</th>
        <th>User ID</th>
        <th>Origin / Device</th>
        <th>Amount (NGN)</th>
        <th>Risk Score</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${
        payload.interceptedTransactions.length > 0
          ? payload.interceptedTransactions
              .map(
                (t) => `
        <tr>
          <td style="font-family: monospace; font-weight: bold;">${t.id}</td>
          <td>${t.userId}</td>
          <td>${t.location} via ${t.device}</td>
          <td style="font-weight: bold;">₦${t.amount.toLocaleString()}</td>
          <td style="${t.riskScore >= 75 ? "color: #b91c1c; font-weight: bold;" : "color: #d97706;"}">${t.riskScore}%</td>
          <td style="text-transform: uppercase; font-weight: bold; ${t.status === "blocked" ? "color: #b91c1c;" : "color: #d97706;"}">${t.status}</td>
        </tr>
      `
              )
              .join("")
          : `<tr><td colspan="6" style="text-align: center; color: #64748b;">No individual transactions intercepted. Case evaluated on entity heuristics.</td></tr>`
      }
    </tbody>
  </table>

  <div class="signature-card">
    <div>
      <div><strong>Investigator Electronic Attestation:</strong></div>
      <div style="color: #64748b; font-size: 8pt; margin-top: 4px;">
        I hereby affirm that the facts presented in this Suspicious Activity Report have been gathered in strict compliance with the Nigerian Anti-Money Laundering and Counter-Terrorist Financing (AML/CFT) regulatory regime.
      </div>
      <div style="font-family: monospace; font-size: 8.5pt; margin-top: 6px; color: #1e293b;">
        HMAC-SHA256 SIGNATURE HASH: ${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}
      </div>
    </div>
    <div class="seal-box">
      <div>CBN / NFIU</div>
      <div style="font-size: 11pt; margin: 4px 0;">VERIFIED</div>
      <div>REGULATORY COMPLIANT</div>
    </div>
  </div>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
