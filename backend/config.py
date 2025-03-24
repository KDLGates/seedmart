import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-for-testing'
    
    # Prioritize Render's database URLs
    SQLALCHEMY_DATABASE_URI = (
        os.environ.get('DATABASE_URL') or    # First try Render's standard DATABASE_URL
        os.environ.get('INT_DB_URL') or      # Then try internal Render URL
        os.environ.get('EXT_DB_URL') or      # Then try external Render URL
        os.environ.get('FLASK_DB_URL') or    # Then try FLASK_DB_URL
        os.environ.get('DB_URL') or          # Then try local DB_URL
        'postgresql+psycopg2://seedmart:seedmart@seed-mart.com:5432/seedmart'  # Fallback
    )
    
    # Log the database URI
    print(f"Using database URI: {SQLALCHEMY_DATABASE_URI}")
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Add environment flag to detect Render deployment
    IS_PRODUCTION = os.environ.get('RENDER', False) or os.environ.get('FLASK_ENV') == 'production'