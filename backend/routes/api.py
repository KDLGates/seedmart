from flask import Blueprint, request, jsonify
from models.models import db, Seed

api = Blueprint('api', __name__)

@api.route('/seeds', methods=['GET'])
def get_seeds():
    seeds = Seed.query.all()
    return jsonify([seed.to_dict() for seed in seeds])

@api.route('/seeds/<int:id>', methods=['GET'])
def get_seed(id):
    seed = Seed.query.get_or_404(id)
    return jsonify(seed.to_dict())

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
    return jsonify(new_seed.to_dict()), 201

@api.route('/seeds/<int:id>', methods=['PUT'])
def update_seed(id):
    seed = Seed.query.get_or_404(id)
    data = request.json
    
    seed.name = data.get('name', seed.name)
    seed.species = data.get('species', seed.species)
    seed.quantity = data.get('quantity', seed.quantity)
    seed.price = data.get('price', seed.price)
    seed.description = data.get('description', seed.description)
    
    db.session.commit()
    return jsonify(seed.to_dict())

@api.route('/seeds/<int:id>', methods=['DELETE'])
def delete_seed(id):
    seed = Seed.query.get_or_404(id)
    db.session.delete(seed)
    db.session.commit()
    return jsonify({"message": "Seed deleted"}), 200