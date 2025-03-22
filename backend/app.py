from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
from config import Config
from models.models import db
from routes.api import api
from routes.auth import auth
from seed_db import seed_database  # Import the seeding function

app = Flask(__name__)
app.config.from_object(Config)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = app.config['SECRET_KEY']
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)

CORS(app)

# Initialize extensions
db.init_app(app)
jwt = JWTManager(app)

# Register blueprints
app.register_blueprint(api, url_prefix='/api')
app.register_blueprint(auth, url_prefix='/api/auth')

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "OK", "message": "SeedMart API is running"})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create database tables
        seed_database()  # Seed the database if it's empty
    app.run(debug=True, threaded=True)  # Enable threading for multi-user support