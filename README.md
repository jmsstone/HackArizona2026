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
