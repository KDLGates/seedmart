import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-for-testing'
    
    # Prioritize Render's database URLs
    SQLALCHEMY_DATABASE_URI = (
        os.environ.get('INT_DB_URL') or  # First try internal Render URL
        os.environ.get('EXT_DB_URL') or  # Then try external Render URL
        os.environ.get('DB_URL') or      # Then try local DB_URL
        'postgresql+psycopg://seedmart:seedmart@localhost:5432/seedmart'  # Fallback
    )
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Add environment flag to detect Render deployment
    IS_PRODUCTION = os.environ.get('RENDER', False)