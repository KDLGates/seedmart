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
        timeframe_days = {
            '1d': 1,
            '1w': 7,
            '1m': 30,
            '3m': 90,
            '1y': 365
        }
        
        days = timeframe_days.get(timeframe, 7)
        cutoff_date = datetime.now() - timedelta(days=days)
        
        prices = (SeedPrice.query
                 .filter(SeedPrice.seed_id == seed_id,
                        SeedPrice.recorded_at >= cutoff_date)
                 .order_by(SeedPrice.recorded_at)
                 .all())
        
        return [price.to_dict() for price in prices]

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