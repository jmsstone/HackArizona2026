import sqlite3
import json
import os
from models.report_model import Report

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
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            illness      TEXT NOT NULL,
            zip_code     TEXT NOT NULL,
            submitted_at TEXT NOT NULL
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
            "INSERT INTO reports (illness, zip_code, submitted_at) VALUES (?, ?, ?)",
            (entry["illness"], entry["zip_code"], entry["submitted_at"])
        )
    conn.commit()
    conn.close()

def save_report(illness: str, zip_code: str) -> Report:
    report = Report(illness=illness, zip_code=zip_code)
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO reports (illness, zip_code, submitted_at) VALUES (?, ?, ?)",
        (report.illness, report.zip_code, report.submitted_at)
    )
    conn.commit()
    report.id = cursor.lastrowid
    conn.close()
    return report

def get_recent_reports(days: int = 30) -> list:
    conn = get_connection()
    rows = conn.execute("""
        SELECT * FROM reports
        WHERE submitted_at >= date('now', ? || ' days')
        ORDER BY submitted_at DESC
    """, (f"-{days}",)).fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_reports_by_zip(zip_code: str) -> list:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM reports WHERE zip_code = ? ORDER BY submitted_at DESC",
        (zip_code,)
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_summary() -> list:
    conn = get_connection()
    rows = conn.execute("""
        SELECT illness, zip_code, COUNT(*) as count
        FROM reports
        WHERE submitted_at >= date('now', '-30 days')
        GROUP BY illness, zip_code
        ORDER BY count DESC
    """).fetchall()
    conn.close()
    return [dict(row) for row in rows]
