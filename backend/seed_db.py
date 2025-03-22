import random
from models.models import db, Seed

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
            
            new_seed = Seed(
                name=seed_type["name"],
                species=seed_type["species"],
                quantity=quantity,
                price=price,
                description=description
            )
            db.session.add(new_seed)
        
        db.session.commit()
        print(f"Successfully added {len(SEED_TYPES)} seed types to the database.")
    else:
        print(f"Database already contains {seed_count} seeds. Skipping seed data initialization.")