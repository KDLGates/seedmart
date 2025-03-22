from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity, get_jwt
)
from models.models import db, User

auth = Blueprint('auth', __name__)

# Register a new user
@auth.route('/register', methods=['POST'])
def register():
    data = request.json
    
    # Check if required fields are present
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Username, email, and password are required"}), 400
    
    # Check if username already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"error": "Username already exists"}), 400
        
    # Check if email already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already exists"}), 400
    
    # Create new user
    new_user = User(
        username=data['username'],
        email=data['email'],
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', '')
    )
    new_user.set_password(data['password'])
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        "message": "User registered successfully",
        "user": new_user.to_dict()
    }), 201

# Login user
@auth.route('/login', methods=['POST'])
def login():
    data = request.json
    
    # Check if required fields are present
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Username and password are required"}), 400
    
    # Find user by username
    user = User.query.filter_by(username=data['username']).first()
    
    # Check if user exists and password is correct
    if not user or not user.check_password(data['password']):
        return jsonify({"error": "Invalid username or password"}), 401
    
    # Update last login time
    user.last_login = datetime.now()
    db.session.commit()
    
    # Generate access and refresh tokens
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict()
    }), 200

# Get current user information
@auth.route('/me', methods=['GET'])
@jwt_required()
def get_user_info():
    # Get user ID from JWT
    user_id = get_jwt_identity()
    
    # Find user
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify(user.to_dict()), 200

# Refresh access token
@auth.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    # Get user ID from refresh token
    user_id = get_jwt_identity()
    
    # Find user
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Generate new access token
    access_token = create_access_token(identity=user_id)
    
    return jsonify({
        "access_token": access_token,
        "user": user.to_dict()
    }), 200

# Logout (client-side mostly, but we'll implement a token blocklist later)
@auth.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    # We will implement a token blocklist in a future enhancement
    return jsonify({"message": "Successfully logged out"}), 200