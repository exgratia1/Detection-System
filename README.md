# 🛡️ Sentinel — Enterprise Financial Crime & Fraud Detection System

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An enterprise-grade, real-time financial fraud detection, investigation, and risk orchestration platform tailored for high-volume banking, fintech, and payment corridors.

---

## ⚡ Key Capabilities

### 1. 📡 Live Monitoring & Step-Up 2FA Dispatcher
- **Real-Time Stream Engine:** High-velocity transaction processing with risk scoring, rule trigger attribution, and location/device entropy telemetry.
- **Interactive 3-Tier Challenge Resolution:** Moves beyond binary allow/block decisions with on-demand authentication challenges:
  - 👁️ Facial Biometric & Liveness Verification
  - 📱 Hardware-Bound Device OTP / Authenticator
  - 📞 Cryptographic IVR Voice Callback
- **Live Override Actions:** Instant manual force-approval, flagging, or blacklisting from slide-over transaction inspection drawers.

### 2. 🕸️ Mule Ring & Syndicate Graph Explorer
- **Interactive SVG Node-Link Visualization:** Exposes structured smurfing funnels, shared hardware fingerprints, and connected offshore beneficiaries.
- **Particle Fund Flow Animations:** Visualizes directional illicit capital movement between mule accounts.
- **Hardware Collusion Detection:** Identifies multiple user accounts sharing identical cryptographic device hashes (`Device_SHA256`).
- **One-Click Mass Sanctioning:** Bulk blacklisting for entire criminal syndicates.

### 3. 🤖 Sentinel AI Forensic Copilot
- **Automated Threat Vector Modeling:** Calculates probabilistic breakdown across:
  - Account Takeover (ATO) via Proxy / Residential VPNs
  - Smurfing & Structured Rapid Funneling
  - SIM Swap / Session Hijacking
  - Synthetic Identity Fraud
- **Frontline Analyst Scripting:** Pre-generated verification checklists and questioning scripts for customer support teams.
- **One-Click Evidence Narrative:** Automatically drafts regulatory SAR narratives formatted with cryptographic hashes, transaction ledgers, and timestamps.

### 4. 🧪 Historic Policy Backtester & Delta Simulator
- **Zero-Risk Sandbox:** Simulates proposed rule thresholds against buffered historical transaction ledgers before deploying to production.
- **Impact Delta Telemetry:** Recalculates net new flagged volume (₦), flipped transaction statuses, prevented fraud loss, and false-positive review friction costs.
- **One-Click Production Rollout:** Instantly deploys vetted parameters to live rule evaluation engines.

### 5. 🚨 Fullscreen SOC War Room (`/war-room`)
- **Wall-Monitor Operational Display:** Dedicated edge-to-edge HUD engineered for physical Security Operations Centers.
- **Dual UTC / WAT Synchronized Clocks:** Blinking operational timekeeping for cross-border alignment.
- **Sweeping Radar & Threat Crosshairs:** Cybernetic spatial radar visualization with live incident streaming tickers.
- **DEFCON Circuit Breaker:** Centralized DEFCON 1 emergency lockdown control with acoustic alarms.

### 6. 🗺️ Geographic Threat Radar & Corridor Analysis
- **Domestic & International Clearing Corridors:** Interactive bezier curve tracking between domestic clearing hubs (Lagos, Abuja, Port Harcourt, Kano, Enugu) and international hubs (London, New York, Frankfurt, Dubai, Singapore).
- **Corridor Inspector:** Deep-dive into volume, average transaction size, and peak risk index per financial corridor.

### 7. ⚖️ Official Regulatory SAR Dossier Exporter
- **NFIU & CBN Compliant:** Statutory formatting compliant with Nigerian Financial Intelligence Unit and Central Bank of Nigeria AML/CFT guidelines.
- **Cryptographic Seal:** HMAC-SHA256 signature verification seal, classification watermarks, and print-to-PDF layout.

### 8. 📊 ML Model Explainer & SHAP Attribution
- **Interactive Frontier ROC Curve:** Dynamic threshold tuning ($\tau \in [0.10, 0.85]$) with real-time recalculation of True Positive Rate, False Positive Rate, Precision, and F1 Score on a 0.984 AUC curve.
- **Dynamic Confusion Matrix:** Economic impact modeling of fraud loss prevented vs customer review friction cost.
- **Global SHAP Weights & Local Waterfalls:** Step-by-step risk contribution attribution for every transaction.

### 9. 🔊 Native Web Audio Threat Synthesizer
- **Zero-Latency Sound Engine:** Built with HTML5 Web Audio API (no external media files required).
- **Acoustic Presets:** Critical alert chirps, DEFCON 1 warbling siren, warning pings, and clearance confirmation chords.

---

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** [Vite 7](https://vite.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Audio:** HTML5 Web Audio API
- **Routing:** React Router DOM v7

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) / [pnpm](https://pnpm.io/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/detection-frontend.git
   cd detection-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Run code quality checks:**
   ```bash
   # Linting
   npm run lint

   # Production build
   npm run build
   ```

---

## 🧭 Navigation & Core Routes

| Route | View | Description |
|---|---|---|
| `/` or `/dashboard` | **Executive Dashboard** | Core KPIs, risk distribution, alert feed, and quick stats |
| `/live-monitoring` | **Live Stream & Radar** | Real-time transaction stream, 2FA challenge dispatcher, geographic corridor radar |
| `/alerts` | **Alerts & Incidents** | High-priority security incident triage and alert dossiers |
| `/investigations` | **Investigations & Mule Ring** | Case management Kanban board and interactive syndicate graph explorer |
| `/rules` | **Fraud Rules & ML Lab** | Rule engine, historic policy backtester, and ML SHAP explainer |
| `/reports` | **Reports & Analytics** | Historical report generation and regulatory compliance logs |
| `/integrations` | **API & Integrations** | API keys, webhook endpoints, and external channel alerts |
| `/settings` | **System Settings** | Watchlist / Blacklist manager, acoustic testing console, analyst profiles |
| `/war-room` | **SOC War Room** | Fullscreen wall-display monitor for high-stakes operational control |

---

## ⌨️ Global Shortcuts

- <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> — Open the **Global Command Palette** (search transactions, navigate pages, trigger SAR dossiers).
- Click **SOS Emergency** in the navigation header to toggle the **DEFCON 1 Circuit Breaker**.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
