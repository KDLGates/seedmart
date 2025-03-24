import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-for-testing'
    
    # Use the direct database URL from environment
    SQLALCHEMY_DATABASE_URI = os.environ.get('DB_URL')
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False