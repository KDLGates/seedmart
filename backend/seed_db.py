import random
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

def generate_price_history(seed_id, base_price, days=365):
    """Generate historical price data for a seed"""
    prices = []
    trend = 1 if random.random() > 0.5 else -1  # Random trend direction
    volatility = random.random() * 0.2 + 0.05  # How much the price fluctuates
    price = base_price
    
    now = datetime.now()
    
    # Generate price history for the specified number of days
    for i in range(days, 0, -1):
        # Add some randomness to the trend
        change = (random.random() - 0.5) * volatility + (trend * 0.02)
        price = max(0.2, price + price * change)  # Ensure price doesn't go too low
        
        # Create price entry for this day
        date = now - timedelta(days=i)
        price_entry = SeedPrice(
            seed_id=seed_id,
            price=round(price, 2),
            volume=generate_volume(),
            recorded_at=date
        )
        prices.append(price_entry)
    
    return prices

def seed_database():
    """Check if database is empty and seed with initial data if needed"""
    # Check if there are any seeds in the database
    seed_count = Seed.query.count()
    
    if seed_count == 0:
        print("Database is empty. Seeding with initial mock data...")
        
        for seed_type in SEED_TYPES:
            price = generate_base_price()
            quantity = generate_volume()
            description = generate_description(seed_type["name"], seed_type["species"])
            
            # Create the seed
            new_seed = Seed(
                name=seed_type["name"],
                species=seed_type["species"],
                quantity=quantity,
                price=price,
                description=description
            )
            db.session.add(new_seed)
            db.session.flush()  # Flush to get the ID without committing
            
            # Generate and add historical price data
            price_history = generate_price_history(new_seed.id, price)
            db.session.add_all(price_history)
        
        db.session.commit()
        print(f"Successfully added {len(SEED_TYPES)} seed types with historical price data to the database.")
    else:
        print(f"Database already contains {seed_count} seeds. Checking price history...")
        
        # Check if we have price history for existing seeds
        price_count = SeedPrice.query.count()
        if price_count == 0:
            print("No price history found. Generating historical price data for existing seeds...")
            
            seeds = Seed.query.all()
            for seed in seeds:
                price_history = generate_price_history(seed.id, seed.price)
                db.session.add_all(price_history)
            
            db.session.commit()
            print(f"Successfully added historical price data for {len(seeds)} existing seeds.")
        else:
            print(f"Database already contains {price_count} price history records. Skipping price data initialization.")