from flask import Flask, jsonify, request
from flask_cors import CORS
import datetime
import uuid

from routes.context_routes import context_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(context_bp, url_prefix="/api/context")

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat()
    })

@app.route('/api/reports', methods=['POST'])
def create_report():
    data = request.get_json()

    # 1. Validation Logic based on your JSON Schema
    required_fields = [
        "professional_diagnosis_of_influenza", 
        "zipcode", 
        "severity_of_symptoms"
    ]
    
    # Basic check for required fields
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields matching InfluenzaReport schema"}), 400

    # 2. Enrich the data (Auto-generating ID and Timestamp)
    # This fulfills the "required" part of your schema without making the frontend do the work
    report_to_save = {
        "ID": str(uuid.uuid4()),
        "timestamp": datetime.datetime.now().isoformat(),
        "professional_diagnosis_of_influenza": data["professional_diagnosis_of_influenza"],
        "zipcode": data["zipcode"],
        "state": data.get("state", "Unknown"), # Optional in your schema
        "severity_of_symptoms": data["severity_of_symptoms"]
    }

    # 3. Log it (Later, you will pass 'report_to_save' to your StorageService)
    print(f"New Report Logged: {report_to_save}")

    return jsonify({
        "status": "success",
        "message": "InfluenzaReport created",
        "data": report_to_save
    }), 201

@app.route('/api/reports/recent', methods=['GET'])
def get_recent_reports():
    # Example of what the output looks like using your schema
    mock_reports = [
        {
            "ID": str(uuid.uuid4()),
            "timestamp": datetime.datetime.now().isoformat(),
            "professional_diagnosis_of_influenza": True,
            "zipcode": "90210",
            "state": "California",
            "severity_of_symptoms": "Moderate"
        }
    ]
    return jsonify(mock_reports)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
