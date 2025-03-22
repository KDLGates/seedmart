from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URI = 'your_database_uri_here'

engine = create_engine(DATABASE_URI)
Session = sessionmaker(bind=engine)

def get_session():
    return Session()

def close_session(session):
    session.close()