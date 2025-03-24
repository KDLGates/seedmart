import os
import sys
import psycopg2
from datetime import datetime, timedelta
import random
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Use the internal database URL from environment variable
DATABASE_URL = os.getenv('FLASK_DB_URL') or os.getenv('INT_DB_URL')

def get_db_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return None

def create_price_history_table():
    """Create price_history table if it doesn't exist"""
    conn = get_db_connection()
    if not conn:
        logger.error("Failed to connect to database")
        return False
    
    try:
        cur = conn.cursor()
        
        # Check if seed_price table exists
        cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'seed_price')")
        seed_price_exists = cur.fetchone()[0]
        
        if not seed_price_exists:
            logger.info("Creating seed_price table")
            cur.execute('''
                CREATE TABLE IF NOT EXISTS seed_price (
                    id SERIAL PRIMARY KEY,
                    seed_id INTEGER NOT NULL,
                    price NUMERIC(10, 2) NOT NULL,
                    volume INTEGER,
                    recorded_at TIMESTAMP NOT NULL
                )
            ''')
        
        # Check if price_history table exists 
        cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'price_history')")
        price_history_exists = cur.fetchone()[0]
        
        if not price_history_exists:
            logger.info("Creating price_history table")
            cur.execute('''
                CREATE TABLE IF NOT EXISTS price_history (
                    id SERIAL PRIMARY KEY,
                    product_id INTEGER NOT NULL,
                    date TIMESTAMP NOT NULL,
                    price NUMERIC(10, 2) NOT NULL
                )
            ''')
        
        conn.commit()
        logger.info("Tables created or verified successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def generate_test_data():
    """Generate test price history data for all seeds"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        
        # Get all seed IDs
        cur.execute("SELECT id FROM seed")
        seed_ids = [row[0] for row in cur.fetchall()]
        
        if not seed_ids:
            logger.warning("No seeds found in database")
            return False
        
        logger.info(f"Found {len(seed_ids)} seeds")
        
        # Generate 30 days of price history for each seed
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        for seed_id in seed_ids:
            # Get the current price for the seed
            cur.execute("SELECT price FROM seed WHERE id = %s", (seed_id,))
            current_price = cur.fetchone()[0]
            
            if not current_price:
                current_price = random.uniform(1.0, 50.0)
            
            # Generate price points with some random variation
            current_date = start_date
            while current_date <= end_date:
                # Add some random price fluctuation (±10%)
                price_variation = random.uniform(-0.1, 0.1)
                price = current_price * (1 + price_variation)
                
                # Insert into both tables for compatibility
                # seed_price table
                cur.execute(
                    "INSERT INTO seed_price (seed_id, price, volume, recorded_at) VALUES (%s, %s, %s, %s)",
                    (seed_id, price, random.randint(50, 200), current_date)
                )
                
                # price_history table
                cur.execute(
                    "INSERT INTO price_history (product_id, date, price) VALUES (%s, %s, %s)",
                    (seed_id, current_date, price)
                )
                
                current_date += timedelta(days=1)
        
        conn.commit()
        logger.info("Test price history data generated successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error generating test data: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    if create_price_history_table():
        if generate_test_data():
            logger.info("Test data creation completed successfully")
        else:
            logger.error("Failed to generate test data")
    else:
        logger.error("Failed to create required tables")
