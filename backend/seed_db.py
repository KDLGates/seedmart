import random
import math
from datetime import datetime, timedelta
from models.models import db, Seed, SeedPrice

# Mirror the seed types from frontend/public/market-data.js
SEED_TYPES = [
    {"name": "Tomato", "species": "Solanum lycopersicum"},
    {"name": "Carrot", "species": "Daucus carota"},
    {"name": "Sunflower", "species": "Helianthus annuus"},
    {"name": "Corn", "species": "Zea mays"},
    {"name": "Cucumber", "species": "Cucumis sativus"},
    {"name": "Pumpkin", "species": "Cucurbita pepo"},
    {"name": "Lettuce", "species": "Lactuca sativa"},
    {"name": "Pepper", "species": "Capsicum annuum"},
    {"name": "Basil", "species": "Ocimum basilicum"},
    {"name": "Lavender", "species": "Lavandula"}
]

def generate_base_price():
    """Generate a random price between 2 and 12 dollars, matching the frontend logic"""
    return round(random.uniform(2, 12), 2)

def generate_volume():
    """Generate a random volume between 500 and 10500, matching the frontend logic"""
    return random.randint(500, 10500)

def generate_description(name, species):
    """Generate a meaningful description for a seed"""
    descriptions = [
        f"Premium quality {name.lower()} seeds ({species}) ideal for commercial farming.",
        f"Organic {name.lower()} seeds ({species}) with excellent germination rate.",
        f"High-yield {name.lower()} variety ({species}), weather-resistant and disease-tolerant.",
        f"Heritage {name.lower()} seeds ({species}) perfect for home gardeners and collectors."
    ]
    return random.choice(descriptions)

def generate_historical_prices(base_price, days=365):
    """Generate historical price data with realistic market trends"""
    prices = []
    current_price = base_price
    volatility = 0.02  # Base volatility
    trend = random.choice([-1, 1])  # Overall trend direction
    trend_strength = random.uniform(0.001, 0.003)  # Subtle trend influence
    
    # Generate prices for each day
    for day in range(days):
        # Add seasonal and weekly patterns
        seasonal_factor = math.sin(2 * math.pi * day / 365) * 0.1  # Annual cycle
        weekly_factor = math.sin(2 * math.pi * day / 7) * 0.05    # Weekly cycle
        
        # Calculate price change
        random_change = (random.random() - 0.5) * volatility
        trend_change = trend * trend_strength
        total_change = random_change + trend_change + seasonal_factor + weekly_factor
        
        # Apply change with minimum price constraint
        current_price = max(0.2, current_price * (1 + total_change))
        
        # Generate volume (higher on significant price changes)
        volume = int(random.uniform(500, 10500) * (1 + abs(total_change) * 10))
        
        # Record datetime for this price point
        recorded_at = datetime.now() - timedelta(days=days-day)
        
        prices.append({
            'price': round(current_price, 2),
            'volume': volume,
            'recorded_at': recorded_at
        })
    
    return prices

def seed_database():
    """Initialize database with seed data if empty"""
    if Seed.query.first() is None:
        print("Seeding database...")
        for seed_type in SEED_TYPES:
            # Create new seed
            new_seed = Seed(
                name=seed_type['name'],
                species=seed_type['species'],
                description=generate_description(seed_type['name'], seed_type['species'])
            )
            db.session.add(new_seed)
            db.session.flush()  # Flush to get the ID
            
            # Generate and add historical price data
            base_price = random.uniform(1, 6)
            price_history = generate_historical_prices(base_price)
            
            # Add price records
            for price_data in price_history:
                price_record = SeedPrice(
                    seed_id=new_seed.id,
                    price=price_data['price'],
                    volume=price_data['volume'],
                    recorded_at=price_data['recorded_at']
                )
                db.session.add(price_record)
        
        db.session.commit()
        print("Database seeded successfully!")
    else:
        print("Database already contains data. Skipping seed operation.")