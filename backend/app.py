from flask import Flask, jsonify
from flask_cors import CORS

from routes.context_routes import context_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(context_bp, url_prefix="/api/context")


@app.route("/")
def home():
    return jsonify({"message": "Backend is running"})


@app.route("/api/health")
def health():
    return jsonify({"status": "healthy"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)