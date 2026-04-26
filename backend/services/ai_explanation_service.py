import os
from dotenv import load_dotenv

load_dotenv()

client = None

def _get_client():
    global client
    if client is None:
        from openai import OpenAI
        key = os.getenv("OPENAI_API_KEY")
        if not key:
            return None
        client = OpenAI(api_key=key)
    return client


def generate_ai_explanation(anomaly_data, context_data):
    c = _get_client()
    if c is None:
        return generate_rule_based_explanation(anomaly_data, context_data)
    try:
        prompt = f"""
Return JSON with keys:
summary, evidence (list), recommendations (list)

Anomaly:
{anomaly_data}

Context:
{context_data}

Rules:
- Keep it short
- Not medical advice
- Explain WHY it's abnormal
"""
        response = c.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        return {
            "source": "openai",
            "text": response.choices[0].message.content
        }
    except Exception:
        return generate_rule_based_explanation(anomaly_data, context_data)


def generate_rule_based_explanation(anomaly_data, context_data):
    percent = anomaly_data.get("percent_change", 0)
    observed = anomaly_data.get("observed_count", 0)
    baseline = anomaly_data.get("baseline_count", 0)

    if percent > 200:
        level = "significant"
    elif percent > 100:
        level = "moderate"
    else:
        level = "low"

    return {
        "source": "fallback",
        "summary": f"There is a {level} increase in illness reports.",
        "evidence": [
            f"Observed: {observed} vs baseline: {baseline}",
            f"Change of {percent}%",
            "Compared against historical flu trends"
        ],
        "recommendations": [
            "Monitor symptoms over the next 48 hours",
            "Avoid crowded indoor spaces if symptomatic",
            "This is not medical advice"
        ]
    }