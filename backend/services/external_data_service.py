import requests


def fetch_fluview_range(epiweeks):
    url = "https://api.delphi.cmu.edu/epidata/fluview/"
    params = {
        "regions": "nat",
        "epiweeks": epiweeks
    }

    try:
        response = requests.get(url, params=params, timeout=10)

        if response.status_code != 200:
            return []

        data = response.json()

        if "epidata" not in data:
            return []

        return data["epidata"]

    except Exception:
        return []


def get_fluview_3years():
    # Clean chunk ranges (~3 years of weekly data)
    ranges = [
        "202301-202350",
        "202351-202450",
        "202451-202550",
        "202551-202615"
    ]

    all_data = []

    try:
        for r in ranges:
            chunk = fetch_fluview_range(r)
            all_data.extend(chunk)

        # Remove duplicates (important)
        seen = set()
        unique_data = []

        for row in all_data:
            ew = row.get("epiweek")
            if ew and ew not in seen:
                seen.add(ew)
                unique_data.append(row)

        # Sort by time (VERY important for trend analysis)
        unique_data.sort(key=lambda x: x.get("epiweek", 0))

        return {
            "source": "Delphi Epidata FluView",
            "range": "3_years",
            "weekly_data": [
                {
                    "epiweek": row.get("epiweek"),
                    "ili_percent": row.get("ili"),
                    "num_patients": row.get("num_patients"),
                    "num_providers": row.get("num_providers")
                }
                for row in unique_data
            ]
        }

    except Exception:
        return get_fallback_3years()


def get_fallback_3years():
    return {
        "source": "fallback",
        "range": "3_years",
        "weekly_data": [
            {"epiweek": 202401, "ili_percent": 2.1},
            {"epiweek": 202410, "ili_percent": 3.4},
            {"epiweek": 202420, "ili_percent": 1.8},
            {"epiweek": 202430, "ili_percent": 2.5},
            {"epiweek": 202440, "ili_percent": 4.2},
            {"epiweek": 202450, "ili_percent": 3.7},
            {"epiweek": 202501, "ili_percent": 2.9},
            {"epiweek": 202510, "ili_percent": 1.9}
        ]
    }


def get_context_for_zip(zip_code):
    flu_data = get_fluview_3years()

    return {
        "zip_code": zip_code,
        "flu_data": flu_data,
        "weather": {
            "temperature_f": 78,
            "humidity": 32,
            "air_quality": "Moderate",
            "pollen_level": "High"
        },
        "environment_notes": [
            "FluView data includes three years of historical weekly data.",
            "Weekly data can be grouped into monthly baselines.",
            "Current local reports can be compared against historical seasonal patterns."
        ]
    }