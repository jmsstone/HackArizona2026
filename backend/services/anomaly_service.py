import math
from datetime import datetime, timedelta
from services.storage_service import get_connection, get_reports_by_zip
from services.external_data_service import get_fluview_3years

def _current_epiweek():
    today = datetime.utcnow()
    jan4 = datetime(today.year, 1, 4)
    sunday = jan4 - timedelta(days=(jan4.weekday() + 1) % 7)
    diff = (today - sunday).days
    wk = diff // 7 + 1
    if wk < 1:
        wk = 52
    elif wk > 52:
        wk = 52
    return wk


def _get_baseline(current_week, cdc_data=None):
    if cdc_data is None:
        cdc_data = get_fluview_3years()
    weekly = cdc_data.get("weekly_data", [])

    matching_ili = []
    for row in weekly:
        ew = row.get("epiweek")
        if ew is None:
            continue
        week_num = ew % 100  
        if week_num == current_week:
            ili = row.get("ili_percent")
            if ili is not None:
                matching_ili.append(ili)

    if not matching_ili:
        for row in weekly:
            ew = row.get("epiweek")
            if ew is None:
                continue
            week_num = ew % 100
            if abs(week_num - current_week) <= 1:
                ili = row.get("ili_percent")
                if ili is not None:
                    matching_ili.append(ili)

    if not matching_ili:
        return {"avg_ili": 2.0, "std_ili": 0.5, "weeks_found": 0}

    avg = sum(matching_ili) / len(matching_ili)

    if len(matching_ili) >= 2:
        variance = sum((x - avg) ** 2 for x in matching_ili) / len(matching_ili)
        std = math.sqrt(variance)
    else:
        std = 0.5 

    return {
        "avg_ili": round(avg, 4),
        "std_ili": round(std, 4),
        "weeks_found": len(matching_ili),
        "values": matching_ili,
    }



def _count_reports_in_window(reports, days_back_start, days_back_end):
  
    now = datetime.utcnow()
    start = now - timedelta(days=days_back_end)
    end = now - timedelta(days=days_back_start)

    count = 0
    for r in reports:
        ts = r.get("timestamp", "")
        try:
            dt = datetime.fromisoformat(ts.replace("Z", ""))
        except (ValueError, TypeError):
            try:
                dt = datetime.strptime(ts[:10], "%Y-%m-%d")
            except (ValueError, TypeError):
                continue

        if start <= dt <= end:
            count += 1

    return count



def _percent_change(observed, baseline):
    if baseline <= 0:
        return 0.0 if observed == 0 else 999.0
    return round(((observed - baseline) / baseline) * 100, 1)


def _z_score(observed, mean, std):
    if std <= 0:
        std = 1.0
    return round((observed - mean) / std, 2)



def _trend_direction(this_week, last_week):
    if last_week == 0:
        if this_week > 0:
            return "accelerating", 75.0
        return "stable", 0.0

    ratio = this_week / last_week

    if ratio > 1.5:
        return "accelerating", min(100.0, (ratio - 1) * 100)
    elif ratio > 1.05:
        return "increasing", min(100.0, (ratio - 1) * 100)
    elif ratio >= 0.95:
        return "stable", 0.0
    else:
        return "declining", 0.0



def _composite_score(pct_change, z, trend_signal, cluster_size):
 
    pct_signal = min(100, max(0, pct_change / 3))

    z_signal = min(100, max(0, abs(z) * 25))


    cluster_signal = min(100, max(0, cluster_size * 5))

    score = (
        0.25 * pct_signal +
        0.35 * z_signal +
        0.20 * trend_signal +
        0.20 * cluster_signal
    )

    return int(min(100, max(0, round(score))))



def _label(score):
    if score <= 25:
        return "Normal"
    elif score <= 50:
        return "Emerging Anomaly"
    elif score <= 75:
        return "Significant Anomaly"
    else:
        return "Possible Outbreak"


def _label_color(label):
    if "Outbreak" in label:
        return "#ef4444"
    elif "Significant" in label:
        return "#f97316"
    elif "Emerging" in label:
        return "#eab308"
    return "#22c55e"



def analyze_zip(zipcode, cdc_data=None):

    reports = get_reports_by_zip(zipcode)

    if not reports:
        return {
            "zip_code": zipcode,
            "score": 0,
            "label": "No Data",
            "label_color": "#71717a",
            "observed_this_week": 0,
            "observed_last_week": 0,
            "baseline_ili": None,
            "percent_change": 0,
            "z_score": 0,
            "trend": "no data",
            "message": "No reports found for this ZIP."
        }

    current_week = _current_epiweek()
    baseline = _get_baseline(current_week, cdc_data)

    this_week = _count_reports_in_window(reports, 0, 7)
    last_week = _count_reports_in_window(reports, 7, 14)

    local_baseline = max(last_week, 1) 

    pct = _percent_change(this_week, local_baseline)
    z = _z_score(this_week, local_baseline, baseline["std_ili"] * 3 + 1)

    trend_label, trend_signal = _trend_direction(this_week, last_week)

    score = _composite_score(pct, z, trend_signal, this_week)

    label = _label(score)

    return {
        "zip_code": zipcode,
        "score": score,
        "label": label,
        "label_color": _label_color(label),

        "observed_this_week": this_week,
        "observed_last_week": last_week,
        "baseline_ili": baseline["avg_ili"],
        "baseline_weeks_found": baseline["weeks_found"],

        "percent_change": pct,
        "z_score": z,
        "trend": trend_label,

        "current_epiweek": current_week,
        "total_reports_all_time": len(reports),
    }


def analyze_all_zips():
    conn = get_connection()
    rows = conn.execute("SELECT DISTINCT zipcode FROM reports").fetchall()
    conn.close()

    cdc_data = get_fluview_3years()

    zips = [row["zipcode"] for row in rows]
    results = [analyze_zip(z, cdc_data) for z in zips]

    results.sort(key=lambda x: x["score"], reverse=True)
    return results
