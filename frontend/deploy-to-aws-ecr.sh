#!/bin/bash

# AWS ECR repository URIs
FRONTEND_REPO=778803818421.dkr.ecr.us-east-1.amazonaws.com/seedmart/frontend
BACKEND_REPO=778803818421.dkr.ecr.us-east-1.amazonaws.com/seedmart/backend

# Build docker images
echo "Building Docker images..."
docker build -t seedmart-frontend:latest -f frontend/Dockerfile.prod ./frontend
docker build -t seedmart-backend:latest -f backend/Dockerfile.prod ./backend

# Tag images for ECR
docker tag seedmart-frontend:latest $FRONTEND_REPO:latest
docker tag seedmart-backend:latest $BACKEND_REPO:latest

# Login to AWS ECR
echo "Logging in to AWS ECR..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 778803818421.dkr.ecr.us-east-1.amazonaws.com

# Push images to ECR
echo "Pushing images to ECR..."
docker push $FRONTEND_REPO:latest
docker push $BACKEND_REPO:latest

echo "Deployment complete!"
