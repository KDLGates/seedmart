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