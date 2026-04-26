# AI-Driven Risk Profiling & Anomaly Detection

An intelligent health reporting system designed for **HackArizona 2026**. This platform leverages professional health reporting and historical CDC datasets to identify emerging health anomalies and risk profiles in real-time.

## 🚀 Overview

This project provides a bridge between individual user health reporting and macro-level CDC data. By cross-referencing recent professional diagnoses with historical trends, the system identifies statistical anomalies that could indicate localized outbreaks or health trends.

* **User Reporting:** Securely captures professionally diagnosed illnesses from the past month.
* **Anomaly Detection:** Uses AI services to compare current reporting rates against baseline CDC data.
* **Risk Profiling:** Generates dynamic risk scores and visual trends for specific regions/ZIP codes.

---

## 🛠️ Tech Stack

### Frontend
* **Framework:** React 18 with TypeScript
* **Build Tool:** Vite
* **Styling:** Tailwind CSS + shadcn/ui
* **State Management:** Custom hooks & local state logic
* **Testing:** Vitest

### Backend
* **Language:** Python 3.11
* **Framework:** Flask
* **Database:** SQLite (SQLAlchemy)
* **AI/Analysis:** Custom Anomaly & AI Explanation Services
* **Containerization:** Docker & Docker Compose

---

## Information Sciences Approach To Determine Anomaly

Step 1 — Percent Change
pct_change = ((this_week - last_week) / last_week) * 100
Compares reports this week vs last week. If last week was 0, it returns 999%.
Step 2 — Z-Score
z = (this_week - last_week) / (cdc_std * 3 + 1)
Measures how statistically unusual the spike is using CDC standard deviation as a reference.
Step 3 — Trend Signal
if last_week == 0 and this_week > 0 → 75.0
if ratio > 1.5 → accelerating → signal = (ratio - 1) * 100
if ratio > 1.05 → increasing → signal = (ratio - 1) * 100
if ratio >= 0.95 → stable → 0
else → declining → 0
Step 4 — Composite Score (0-100)
score = (0.25 × pct_signal) 
      + (0.35 × z_signal) 
      + (0.20 × trend_signal) 
      + (0.20 × cluster_signal)
Where:

pct_signal = min(100, pct_change / 3)
z_signal = min(100, abs(z) * 25)
cluster_signal = min(100, this_week * 5)

Step 5 — Label
0–25  → Normal
26–50 → Emerging Anomaly
51–75 → Significant Anomaly
76–100 → Possible Outbreak
Z-score carries the most weight at 35%, percent change at 25%, trend and cluster size at 20% each.

## 📂 Project Structure

```text
HackArizona2026/
├── backend/             # Flask API, AI Services, & SQLite DB
│   ├── models/          # Database schemas (SQLAlchemy)
│   ├── routes/          # API Endpoints (Reports, Anomalies, Health)
│   ├── services/        # Core logic: AI Explanation & Anomaly Detection
│   └── data/            # Seed data and historical CDC records
├── frontend/            # React + Vite application
│   ├── src/components/  # High-level UI (RiskScoreBar, TrendBadge, etc.)
│   ├── src/pages/       # Dashboard and ZipDetail views
│   └── src/lib/         # API wrappers and utility functions
└── docker-compose.yml   # Orchestration for full-stack deployment


