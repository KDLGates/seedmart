from flask import Blueprint, request, jsonify
from models.models import db, Seed, SeedPrice
from services.market import MarketService
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

@api.route('/seeds/<int:seed_id>/prices', methods=['GET'])
def get_seed_prices(seed_id):
    """Get price history for a specific seed"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        timeframe = request.args.get('timeframe', '1w')
        logger.info(f"API endpoint: Fetching price history for seed_id: {seed_id} with timeframe {timeframe}")
        
        price_history = MarketService.get_price_history(seed_id, timeframe)
        
        if not price_history:
            logger.warning(f"No price history found for seed_id: {seed_id}")
            # Return empty array instead of 404 to avoid frontend errors
            return jsonify([])
            
        logger.info(f"Successfully retrieved {len(price_history)} price records")
        return jsonify(price_history)
        
    except Exception as e:
        logger.exception(f"Error in get_seed_prices endpoint: {str(e)}")
        return jsonify({"error": "An unexpected error occurred processing your request"}), 500

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
    """Get market summary with current prices and statistics"""
    market_data = MarketService.get_market_summary()
    return jsonify(market_data)

@api.route('/market/update', methods=['POST'])
def update_market():
    """Update all seed prices - should be called by a scheduled task"""
    try:
        updates = MarketService.update_seed_prices()
        return jsonify({'success': True, 'updates': updates})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

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

@api.route('/price-history/<int:seed_id>', methods=['GET'])
def get_seed_price_history(seed_id):
    """Get price history for a specific seed"""
    try:
        # First check if the seed exists
        seed = Seed.query.get(seed_id)
        if not seed:
            return jsonify({"error": "Seed not found"}), 404
            
        # Query the price history using SQLAlchemy
        price_history = SeedPrice.query.filter_by(seed_id=seed_id).order_by(SeedPrice.recorded_at).all()
        
        result = []
        for price in price_history:
            result.append({
                'date': price.recorded_at.strftime('%Y-%m-%d'),
                'price': float(price.price)
            })
            
        return jsonify(result)
    except Exception as e:
        # current_app.logger.error(f"Error fetching price history: {str(e)}")
        return jsonify({"error": "Failed to retrieve price history"}), 500