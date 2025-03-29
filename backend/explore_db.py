from app import app
from models.models import db, Seed, SeedPrice, User, Product, Category, PriceHistory
import json
from datetime import datetime

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super(DateTimeEncoder, self).default(obj)

def print_table_info(title, records, limit=10):
    print(f"\n===== {title} ===== (showing up to {limit} records)")
    if not records:
        print("No records found.")
        return
    
    print(f"Total records: {len(records)}")
    for i, record in enumerate(records[:limit]):
        print(f"\nRecord {i+1}:")
        if hasattr(record, 'to_dict'):
            print(json.dumps(record.to_dict(), indent=2, cls=DateTimeEncoder))
        else:
            print(str(record))
    
    if len(records) > limit:
        print(f"... and {len(records) - limit} more records")

with app.app_context():
    # Explore Seeds
    seeds = Seed.query.all()
    print_table_info("SEEDS", seeds)
    
    # Explore SeedPrice (latest 10 entries for each seed)
    seed_prices = SeedPrice.query.order_by(SeedPrice.recorded_at.desc()).limit(20).all()
    print_table_info("SEED PRICES (20 most recent)", seed_prices)
    
    # Get price history for a specific seed (if any exist)
    if seeds:
        first_seed_id = seeds[0].id
        prices = SeedPrice.query.filter_by(seed_id=first_seed_id).order_by(SeedPrice.recorded_at).all()
        print_table_info(f"PRICE HISTORY FOR SEED ID {first_seed_id} ({seeds[0].name})", prices)
    
    # Explore Users
    users = User.query.all()
    print_table_info("USERS", users)
    
    # Explore Products
    products = Product.query.all()
    print_table_info("PRODUCTS", products)
    
    # Explore Categories
    categories = Category.query.all()
    print_table_info("CATEGORIES", categories)
    
    # Explore Legacy Price History
    price_history = PriceHistory.query.all()
    print_table_info("LEGACY PRICE HISTORY", price_history)
    
    # Database table summary
    tables = [
        ("seeds", Seed),
        ("seed_price", SeedPrice),
        ("users", User),
        ("products", Product),
        ("categories", Category),
        ("price_history", PriceHistory)
    ]
    
    print("\n===== DATABASE SUMMARY =====")
    for table_name, model in tables:
        count = model.query.count()
        print(f"{table_name}: {count} records")
