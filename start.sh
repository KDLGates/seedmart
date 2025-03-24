#!/bin/bash

echo "Starting SeedMart application..."

# Start the backend server
cd backend
echo "Starting Flask backend..."
# Use the PORT environment variable provided by Render for the backend
# or default to 5000 if not provided
export FLASK_PORT=${PORT:-5000}
export FLASK_ENV=production
python app.py &
BACKEND_PID=$!
cd ..

# Start the frontend server
cd frontend
echo "Starting Node.js frontend..."
# Use a different port for the frontend
export PORT=3000
node src/index.js &
FRONTEND_PID=$!
cd ..

echo "Backend PID: $BACKEND_PID | Frontend PID: $FRONTEND_PID"

# Keep the script running
wait $BACKEND_PID $FRONTEND_PID
