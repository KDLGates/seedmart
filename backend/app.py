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
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Log configuration details
logger.info(f"Running with DB URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
logger.info(f"Environment: {'Production' if Config.IS_PRODUCTION else 'Development'}")

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
        try:
            MarketService.update_seed_prices()
        except Exception as e:
            logger.error(f"Error updating seed prices: {e}")

# Add market update job - runs every 30 seconds
scheduler.add_job(
    func=update_prices_with_context,
    trigger=IntervalTrigger(seconds=30),
    id='update_market_prices',
    name='Update seed market prices',
    replace_existing=True,
    max_instances=1,
    coalesce=True
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
        try:
            # Test database connection
            db.engine.connect()
            logger.info("Database connection successful")
            
            # Create database tables if they don't exist
            db.create_all()
            logger.info("Database tables created successfully")
            
            # Seed the database if it's empty
            seed_database()
            logger.info("Database seeding completed")
        except Exception as e:
            logger.error(f"Database initialization error: {e}")
            raise
    
    # Get port from environment with fallback to 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=not Config.IS_PRODUCTION, threaded=True)