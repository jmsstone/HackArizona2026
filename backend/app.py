from flask import Flask, jsonify, request
from flask_cors import CORS
import datetime
import uuid

# Import Person 4's Blueprint
from routes.context_routes import context_bp
# Import Person 3's Blueprint
from routes.anomly_routes import anomaly_bp

# Import Person 2's Database functions
from services.storage_service import init_db, save_report, get_recent_reports, get_reports_by_zip

app = Flask(__name__)
CORS(app)

# 1. Register Person 4's logic
app.register_blueprint(context_bp, url_prefix="/api/context")
# 2. Register Person 3's anomaly detection
app.register_blueprint(anomaly_bp)

# 2. Initialize Person 2's Database
init_db()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat()
    })

@app.route('/api/reports', methods=['POST'])
def create_report():
    data = request.get_json()

    # Validation Logic based on JSON Schema
    required_fields = [
        "professional_diagnosis_of_influenza", 
        "zipcode", 
        "severity_of_symptoms"
    ]
    
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        # 3. Call Person 2's save_report function 
        # This writes to reports.db instead of just printing!
        new_report = save_report(
            professional_diagnosis=data["professional_diagnosis_of_influenza"],
            zipcode=data["zipcode"],
            state=data.get("state", "Unknown"),
            severity=data["severity_of_symptoms"]
        )

        return jsonify({
            "status": "success",
            "message": "InfluenzaReport created and saved",
            "data": new_report
        }), 201
    except Exception as e:
        return jsonify({"error": "Database save failed", "details": str(e)}), 500

@app.route('/api/reports/recent', methods=['GET'])
def get_recent_endpoint():
    # 4. Fetch the real latest reports (defaulting to 30 days)
    reports = get_recent_reports()
    return jsonify(reports)

@app.route('/api/reports/by-zip/<zipcode>', methods=['GET'])
def get_by_zip(zipcode):
    # 5. Use the zip-specific filter from storage_service
    reports = get_reports_by_zip(zipcode)
    return jsonify(reports)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)