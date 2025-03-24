#!/bin/sh

# Change to backend directory and start Python app in background (silenced)
cd backend
python app.py > /dev/null 2>&1 &
BACKEND_PID=$!

# Change to frontend directory and start npm in background (silenced)
cd ../frontend
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!

# Return to original directory
cd ..

# Clear any remaining output and show the PIDs (without cluttering with other messages)
clear
echo "Backend PID: $BACKEND_PID | Frontend PID: $FRONTEND_PID | Use 'jobs' to manage"
echo ""

# Explicitly reset the prompt by creating a new shell instance
exec bash
