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

## 📊 Information Sciences Approach To Anomaly Detection

The anomaly engine uses a four-step composite scoring model that combines local report trends with CDC FluView baseline data to generate a risk score between 0 and 100.

### Step 1 — Percent Change
```math
pct_change = ((this_week - last_week) / last_week) × 100
```
Compares report volume this week against last week. If last week had zero reports, the system returns a maximum signal of 999%.

### Step 2 — Z-Score
```math
z = (this_week - last_week) / (cdc_std × 3 + 1)
```
Measures how statistically unusual the current spike is, anchored to the CDC FluView standard deviation for the matching epiweek.

### Step 3 — Trend Signal
| Condition | Classification | Signal |
|---|---|---|
| Last week = 0, this week > 0 | Accelerating | 75.0 |
| Ratio > 1.5 | Accelerating | (ratio − 1) × 100 |
| Ratio > 1.05 | Increasing | (ratio − 1) × 100 |
| Ratio ≥ 0.95 | Stable | 0 |
| Ratio < 0.95 | Declining | 0 |

### Step 4 — Composite Score (0–100)
```math
score = (0.25 × pct_signal) + (0.35 × z_signal) + (0.20 × trend_signal) + (0.20 × cluster_signal)
```
Where:
- `pct_signal = min(100, pct_change / 3)`
- `z_signal = min(100, |z| × 25)`
- `cluster_signal = min(100, this_week × 5)`

> Z-score carries the highest weight (35%) as it is the most statistically grounded signal. Percent change follows at 25%, with trend direction and cluster size each contributing 20%.

### Step 5 — Risk Classification
| Score | Label |
|---|---|
| 0 – 25 | 🟢 Normal |
| 26 – 50 | 🟡 Emerging Anomaly |
| 51 – 75 | 🟠 Significant Anomaly |
| 76 – 100 | 🔴 Possible Outbreak |

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


