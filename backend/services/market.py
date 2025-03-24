import random
from datetime import datetime, timedelta
from models.models import db, Seed, SeedPrice
from sqlalchemy import func

class MarketService:
    @staticmethod
    def calculate_base_price():
        """Generate a base price between 1-6 dollars with reduced volatility"""
        return round(random.uniform(1, 6), 2)

    @staticmethod
    def calculate_price_change(current_price, volatility=0.02):
        """Calculate price change with controlled volatility"""
        # Convert Decimal to float if needed
        if hasattr(current_price, 'is_finite'):  # Check if it's a Decimal
            current_price = float(current_price)
            
        trend = 1 if random.random() > 0.5 else -1
        change = (random.random() - 0.5) * volatility + (trend * 0.02)
        new_price = max(0.2, current_price + current_price * change)
        return round(new_price, 2)

    @staticmethod
    def get_market_summary():
        """Get current market statistics"""
        seeds = Seed.query.all()
        total_volume = 0
        market_cap = 0
        summaries = []

        for seed in seeds:
            latest_price = (SeedPrice.query
                          .filter_by(seed_id=seed.id)
                          .order_by(SeedPrice.recorded_at.desc())
                          .first())
            
            previous_price = (SeedPrice.query
                            .filter_by(seed_id=seed.id)
                            .order_by(SeedPrice.recorded_at.desc())
                            .offset(1)
                            .first())

            if latest_price:
                current_price = latest_price.price
                previous_price_value = previous_price.price if previous_price else current_price
                change = round(current_price - previous_price_value, 2)
                change_percent = round((change / previous_price_value * 100), 1) if previous_price_value > 0 else 0
                
                # Calculate volume and market cap
                daily_volume = latest_price.volume
                total_volume += daily_volume
                market_cap += current_price * 1000  # Assuming 1000 units per seed type

                summaries.append({
                    'id': seed.id,
                    'name': seed.name,
                    'species': seed.species,
                    'currentPrice': current_price,
                    'previousPrice': previous_price_value,
                    'change': change,
                    'changePercent': change_percent,
                    'volume': daily_volume,
                    'description': seed.description
                })

        return {
            'seeds': summaries,
            'marketStats': {
                'totalVolume': total_volume,
                'marketCap': market_cap,
                'seedCount': len(seeds)
            }
        }

    @staticmethod
    def get_price_history(seed_id, timeframe='1w'):
        """Get price history for a specific seed"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            timeframe_days = {
                '1d': 1,
                '1w': 7,
                '1m': 30,
                '3m': 90,
                '1y': 365
            }
            
            days = timeframe_days.get(timeframe, 7)
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # First check if the seed exists
            seed = Seed.query.get(seed_id)
            if not seed:
                logger.error(f"Seed ID {seed_id} not found in database")
                return []
            
            logger.info(f"Fetching price history for seed ID {seed_id} with timeframe {timeframe}")
            
            try:
                # Try to get prices with SQLAlchemy
                prices = (SeedPrice.query
                        .filter(SeedPrice.seed_id == seed_id,
                                SeedPrice.recorded_at >= cutoff_date)
                        .order_by(SeedPrice.recorded_at)
                        .all())
                
                if prices:
                    result = [price.to_dict() for price in prices]
                    logger.info(f"Found {len(result)} price records for seed ID {seed_id}")
                    return result
                else:
                    logger.warning(f"No price records found for seed ID {seed_id}. Creating a default entry.")
                    
                    # Create a placeholder entry if none exists
                    new_price = SeedPrice(
                        seed_id=seed_id,
                        price=seed.price or MarketService.calculate_base_price(),
                        volume=random.randint(500, 1000),
                        recorded_at=datetime.now()
                    )
                    db.session.add(new_price)
                    db.session.commit()
                    return [new_price.to_dict()]
                    
            except Exception as e:
                logger.exception(f"Error querying SeedPrice table: {str(e)}")
                
                # Try fallback approach with direct connection
                import os
                import psycopg2
                
                DATABASE_URL = (os.environ.get('DATABASE_URL') or 
                               os.environ.get('INT_DB_URL') or 
                               os.environ.get('FLASK_DB_URL'))
                
                if not DATABASE_URL:
                    logger.error("No database URL configured for fallback query")
                    return []
                    
                try:
                    conn = psycopg2.connect(DATABASE_URL)
                    cur = conn.cursor()
                    
                    # Query using direct SQL
                    cur.execute("""
                        SELECT recorded_at, price, volume
                        FROM seed_price
                        WHERE seed_id = %s
                        ORDER BY recorded_at
                    """, (seed_id,))
                    
                    result = []
                    for row in cur.fetchall():
                        result.append({
                            'date': row[0].strftime('%Y-%m-%d'),
                            'recorded_at': row[0].isoformat(),
                            'price': float(row[1]),
                            'volume': row[2] or 0
                        })
                    
                    cur.close()
                    conn.close()
                    
                    logger.info(f"Found {len(result)} price records using direct SQL query")
                    return result
                    
                except Exception as sql_error:
                    logger.exception(f"Error in fallback SQL query: {str(sql_error)}")
                    return []
            
        except Exception as e:
            logger.exception(f"Unexpected error in get_price_history for seed_id {seed_id}: {str(e)}")
            return []

    @staticmethod
    def update_seed_prices():
        """Update all seed prices with new calculated values"""
        seeds = Seed.query.all()
        updates = []
        
        for seed in seeds:
            latest_price = (SeedPrice.query
                          .filter_by(seed_id=seed.id)
                          .order_by(SeedPrice.recorded_at.desc())
                          .first())
            
            if latest_price:
                new_price = MarketService.calculate_price_change(latest_price.price)
                new_volume = random.randint(500, 10500)  # Random volume for now
            else:
                new_price = MarketService.calculate_base_price()
                new_volume = random.randint(500, 10500)

            price_record = SeedPrice(
                seed_id=seed.id,
                price=new_price,
                volume=new_volume,
                recorded_at=datetime.now()
            )
            updates.append(price_record)

        db.session.bulk_save_objects(updates)
        db.session.commit()
        return len(updates)