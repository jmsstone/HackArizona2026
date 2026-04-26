from flask import Blueprint, jsonify, request

from services.external_data_service import get_context_for_zip
from services.ai_explanation_service import generate_ai_explanation

context_bp = Blueprint("context", __name__)


@context_bp.route("/explain", methods=["POST"])
def explain_anomaly():
    body = request.get_json()

    if not body:
        return jsonify({"error": "Missing JSON body"}), 400

    anomaly_data = body.get("anomaly_data", {})
    zip_code = anomaly_data.get("zip_code", "85719")

    context_data = get_context_for_zip(zip_code)
    explanation = generate_ai_explanation(anomaly_data, context_data)

    return jsonify({
        "anomaly_data": anomaly_data,
        "context_data": context_data,
        "ai_explanation": explanation
    })


@context_bp.route("/<zip_code>", methods=["GET"])
def get_context(zip_code):
    context = get_context_for_zip(zip_code)
    return jsonify(context)