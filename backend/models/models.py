from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.sql import func

db = SQLAlchemy()

class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True, index=True)
    name = db.Column(db.String, index=True)
    description = db.Column(db.String)
    price = db.Column(db.Integer)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'))

    category = db.relationship("Category", back_populates="products")

class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True, index=True)
    name = db.Column(db.String, index=True)

    products = db.relationship("Product", back_populates="category")

class Seed(db.Model):
    __tablename__ = "seeds"
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    species = db.Column(db.String(100))
    quantity = db.Column(db.Integer, default=0)
    price = db.Column(db.Float)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=func.now())
    
    # Add relationship to SeedPrice
    prices = db.relationship("SeedPrice", back_populates="seed", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'species': self.species,
            'quantity': self.quantity,
            'price': self.price,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class SeedPrice(db.Model):
    __tablename__ = "seed_prices"
    
    id = db.Column(db.Integer, primary_key=True)
    seed_id = db.Column(db.Integer, db.ForeignKey('seeds.id'), nullable=False)
    price = db.Column(db.Float, nullable=False)
    volume = db.Column(db.Integer, default=0)  # Trading volume for the day
    recorded_at = db.Column(db.DateTime, default=func.now())
    
    # Relationship to Seed
    seed = db.relationship("Seed", back_populates="prices")
    
    def to_dict(self):
        return {
            'id': self.id,
            'seed_id': self.seed_id,
            'price': self.price,
            'volume': self.volume,
            'recorded_at': self.recorded_at.isoformat() if self.recorded_at else None
        }