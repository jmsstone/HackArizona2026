import sqlite3
import json
import os
import uuid
from datetime import datetime

DB_PATH = "reports.db"
SEED_PATH = "data/seed_reports.json"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id                                  TEXT PRIMARY KEY,
            timestamp                           TEXT NOT NULL,
            professional_diagnosis_of_influenza INTEGER NOT NULL,
            zipcode                             TEXT NOT NULL,
            state                               TEXT NOT NULL,
            severity_of_symptoms                TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()
    load_seed_data()

def load_seed_data():
    conn = get_connection()
    count = conn.execute("SELECT COUNT(*) FROM reports").fetchone()[0]
    conn.close()
    if count > 0:
        return
    if not os.path.exists(SEED_PATH):
        return
    with open(SEED_PATH, "r") as f:
        seeds = json.load(f)
    conn = get_connection()
    for entry in seeds:
        conn.execute(
            """INSERT INTO reports
               (id, timestamp, professional_diagnosis_of_influenza, zipcode, state, severity_of_symptoms)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                entry["ID"],
                entry["timestamp"],
                1 if entry["professional_diagnosis_of_influenza"] else 0,
                entry["zipcode"],
                entry["state"],
                entry["severity_of_symptoms"]
            )
        )
    conn.commit()
    conn.close()

def save_report(professional_diagnosis: bool, zipcode: str, state: str, severity: str) -> dict:
    report = {
        "id":                                  str(uuid.uuid4()),
        "timestamp":                           datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "professional_diagnosis_of_influenza": 1 if professional_diagnosis else 0,
        "zipcode":                             zipcode,
        "state":                               state,
        "severity_of_symptoms":                severity
    }
    conn = get_connection()
    conn.execute(
        """INSERT INTO reports
           (id, timestamp, professional_diagnosis_of_influenza, zipcode, state, severity_of_symptoms)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (
            report["id"],
            report["timestamp"],
            report["professional_diagnosis_of_influenza"],
            report["zipcode"],
            report["state"],
            report["severity_of_symptoms"]
        )
    )
    conn.commit()
    conn.close()
    report["professional_diagnosis_of_influenza"] = professional_diagnosis
    return report

def get_recent_reports(days: int = 30) -> list:
    conn = get_connection()
    rows = conn.execute("""
        SELECT * FROM reports
        WHERE timestamp >= datetime('now', ? || ' days')
        ORDER BY timestamp DESC
    """, (f"-{days}",)).fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_reports_by_zip(zipcode: str) -> list:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM reports WHERE zipcode = ? ORDER BY timestamp DESC",
        (zipcode,)
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_summary() -> list:
    conn = get_connection()
    rows = conn.execute("""
        SELECT zipcode, state, severity_of_symptoms,
               COUNT(*) as count,
               SUM(professional_diagnosis_of_influenza) as confirmed_count
        FROM reports
        WHERE timestamp >= datetime('now', '-30 days')
        GROUP BY zipcode, severity_of_symptoms
        ORDER BY count DESC
    """).fetchall()
    conn.close()
    return [dict(row) for row in rows]