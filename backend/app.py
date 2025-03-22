from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from routes.api import api_bp

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

app.register_blueprint(api_bp)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "OK", "message": "SeedMart API is running"})

if __name__ == '__main__':
    app.run(debug=True)