#!/bin/bash

# Exit on error
set -e

echo "Starting build process..."

# Backend setup
echo "Setting up backend..."
cd backend
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..

# Frontend setup
echo "Setting up frontend..."
cd frontend
npm install
cd ..

echo "Build completed successfully!"
