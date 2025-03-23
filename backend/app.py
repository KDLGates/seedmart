from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
from config import Config
from models.models import db
from routes.api import api
from routes.auth import auth
from seed_db import seed_database
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from services.market import MarketService
import atexit

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

# Initialize scheduler
scheduler = BackgroundScheduler()

# Function to wrap update_seed_prices with app context
def update_prices_with_context():
    with app.app_context():
        MarketService.update_seed_prices()

# Add market update job - runs every 30 seconds
scheduler.add_job(
    func=update_prices_with_context,  # Use the wrapper function instead
    trigger=IntervalTrigger(seconds=30),
    id='update_market_prices',
    name='Update seed market prices',
    replace_existing=True,
    max_instances=1,
    coalesce=True  # Combine multiple pending runs into one
)

# Start the scheduler
scheduler.start()

# Shut down the scheduler when exiting the app
atexit.register(lambda: scheduler.shutdown())

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "OK", "message": "SeedMart API is running"})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create database tables
        seed_database()  # Seed the database if it's empty
    app.run(host='0.0.0.0', debug=True, threaded=True)  # Enable threading for multi-user support