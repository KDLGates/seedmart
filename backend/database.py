from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import Config
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log which database URL is being used
logger.info(f"Using database URL: {Config.SQLALCHEMY_DATABASE_URI}")

# Create the SQLAlchemy engine with proper connection options
engine = create_engine(
    Config.SQLALCHEMY_DATABASE_URI,
    pool_pre_ping=True,  # Check connection before using it
    pool_recycle=3600,   # Recycle connections after 1 hour
    connect_args={
        "connect_timeout": 30  # 30 second connection timeout
    }
)

# Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class for declarative models
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()