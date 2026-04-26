from flask import Blueprint, jsonify
from services.anomaly_service import analyze_zip, analyze_all_zips

anomaly_bp = Blueprint("anomaly", __name__)

@anomaly_bp.route("/anomalies", methods=["GET"])
def get_all_anomalies():
    results = analyze_all_zips()
    return jsonify({
        "count": len(results),
        "anomalies": results,
    })

@anomaly_bp.route("/anomalies/<zipcode>", methods=["GET"])
def get_anomaly_for_zip(zipcode):
    result = analyze_zip(zipcode)
    return jsonify(result)