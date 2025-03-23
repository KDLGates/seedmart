import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-for-testing'
    
    # Force localhost for development
    DB_HOST = os.environ.get('DB_HOST_DEV') or 'localhost'
    
    # Use separate env vars for development vs production
    if os.environ.get('FLASK_ENV') == 'production':
        DB_HOST = os.environ.get('DB_HOST_PROD') or '34.234.2.20'
    
    DB_USER = os.environ.get('DB_USER')
    DB_PASSWORD = os.environ.get('DB_PASSWORD')
    DB_PORT = os.environ.get('DB_PORT') or '5432'
    DB_NAME = os.environ.get('DB_NAME') or 'seedmart'
    
    # For standard psycopg2 (most common)
    SQLALCHEMY_DATABASE_URI = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'

    # Or explicitly specify psycopg2 if needed
    # SQLALCHEMY_DATABASE_URI = f'postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'

    SQLALCHEMY_TRACK_MODIFICATIONS = False