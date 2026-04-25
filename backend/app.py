from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # This is vital so React can talk to Flask!

@app.route('/api/data')
def get_data():
    return jsonify({"message": "Hello from Flask!", "status": "success"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)