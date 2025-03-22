from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models.models import db
from routes.api import api
from seed_db import seed_database  # Import the seeding function

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# Initialize database
db.init_app(app)

# Register blueprints
app.register_blueprint(api, url_prefix='/api')

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "OK", "message": "SeedMart API is running"})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create database tables
        seed_database()  # Seed the database if it's empty
    app.run(debug=True)