from flask import Blueprint, request, jsonify
from models.models import db, Seed, SeedPrice
from datetime import datetime, timedelta
from sqlalchemy import desc

api = Blueprint('api', __name__)

@api.route('/seeds', methods=['GET'])
def get_seeds():
    seeds = Seed.query.all()
    return jsonify([seed.to_dict() for seed in seeds])

@api.route('/seeds/<int:id>', methods=['GET'])
def get_seed(id):
    seed = Seed.query.get_or_404(id)
    return jsonify(seed.to_dict())

@api.route('/seeds/<int:id>/prices', methods=['GET'])
def get_seed_prices(id):
    # Check if seed exists
    seed = Seed.query.get_or_404(id)
    
    # Get timeframe from query params (default to 1 week)
    timeframe = request.args.get('timeframe', '1w')
    
    # Map timeframe strings to days
    timeframe_days = {
        '1d': 1,
        '1w': 7,
        '1m': 30,
        '3m': 90,
        '1y': 365,
        'all': None  # None means all data
    }
    
    days = timeframe_days.get(timeframe, 7)  # Default to 7 days if invalid timeframe
    
    # Build query for price history
    query = SeedPrice.query.filter_by(seed_id=id)
    
    # Apply timeframe filter if specified (other than 'all')
    if days is not None:
        cutoff_date = datetime.now() - timedelta(days=days)
        query = query.filter(SeedPrice.recorded_at >= cutoff_date)
    
    # Order by recorded_at to get chronological data
    prices = query.order_by(SeedPrice.recorded_at).all()
    
    # Return price history as list of dictionaries
    return jsonify([price.to_dict() for price in prices])

@api.route('/seeds/<int:id>/latest-price', methods=['GET'])
def get_seed_latest_price(id):
    # Check if seed exists
    seed = Seed.query.get_or_404(id)
    
    # Get the latest price entry
    latest_price = SeedPrice.query.filter_by(seed_id=id).order_by(desc(SeedPrice.recorded_at)).first()
    
    if not latest_price:
        return jsonify({"error": "No price history available for this seed"}), 404
        
    return jsonify(latest_price.to_dict())

@api.route('/market/summary', methods=['GET'])
def get_market_summary():
    # Get all seeds
    seeds = Seed.query.all()
    
    # For each seed, get the latest price
    summaries = []
    for seed in seeds:
        latest_price = SeedPrice.query.filter_by(seed_id=seed.id).order_by(desc(SeedPrice.recorded_at)).first()
        previous_price = SeedPrice.query.filter_by(seed_id=seed.id).order_by(desc(SeedPrice.recorded_at)).offset(1).first()
        
        if latest_price:
            # Calculate change and change percentage
            current_price = latest_price.price
            previous_price_value = previous_price.price if previous_price else current_price
            
            change = round(current_price - previous_price_value, 2)
            change_percent = round((change / previous_price_value * 100), 1) if previous_price_value > 0 else 0
            
            # Create summary object
            summary = {
                'id': seed.id,
                'name': seed.name,
                'species': seed.species,
                'currentPrice': current_price,
                'previousPrice': previous_price_value,
                'change': change,
                'changePercent': change_percent,
                'volume': latest_price.volume,
                'description': seed.description,
                'recorded_at': latest_price.recorded_at.isoformat()
            }
            
            summaries.append(summary)
    
    return jsonify(summaries)

@api.route('/seeds', methods=['POST'])
def create_seed():
    data = request.json
    new_seed = Seed(
        name=data['name'],
        species=data.get('species'),
        quantity=data.get('quantity', 0),
        price=data.get('price'),
        description=data.get('description')
    )
    db.session.add(new_seed)
    db.session.commit()
    
    # Add initial price entry
    if new_seed.price:
        new_price = SeedPrice(
            seed_id=new_seed.id,
            price=new_seed.price,
            volume=new_seed.quantity,
            recorded_at=datetime.now()
        )
        db.session.add(new_price)
        db.session.commit()
    
    return jsonify(new_seed.to_dict()), 201

@api.route('/seeds/<int:id>', methods=['PUT'])
def update_seed(id):
    seed = Seed.query.get_or_404(id)
    data = request.json
    
    seed.name = data.get('name', seed.name)
    seed.species = data.get('species', seed.species)
    seed.quantity = data.get('quantity', seed.quantity)
    
    # Update price if provided
    if 'price' in data and data['price'] != seed.price:
        seed.price = data['price']
        
        # Add new price entry
        new_price = SeedPrice(
            seed_id=seed.id,
            price=seed.price,
            volume=seed.quantity,
            recorded_at=datetime.now()
        )
        db.session.add(new_price)
        
    seed.description = data.get('description', seed.description)
    
    db.session.commit()
    return jsonify(seed.to_dict())

@api.route('/seeds/<int:id>', methods=['DELETE'])
def delete_seed(id):
    seed = Seed.query.get_or_404(id)
    db.session.delete(seed)
    db.session.commit()
    return jsonify({"message": "Seed deleted"}), 200