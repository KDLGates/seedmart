# SeedMart

A full-stack seed trading platform with a market visualization dashboard and seed management system.

## Project Structure

- Backend: Python with Flask
- Frontend: Node.js with Express
- Database: PostgreSQL

## Features

- Interactive seed market dashboard with price charts
- Trending seeds visualization
- Seed management system
- CRUD operations for seed inventory

## About

SeedMart is a demonstration application designed to showcase modern full-stack development techniques. Like a digital fidget spinner for developers, it's engaging and functional while serving educational purposes.

This fictional plant seed marketplace features:

- **Historical Market Data**: The PostgreSQL backend stores rich time-series data modeling seed price fluctuations
- **Trading Platform Interface**: Inspired by real-world financial platforms like TradeZero and TradingView
- **Non-trivial API Implementation**: RESTful endpoints with proper error handling and data validation
- **Engaging Visualization**: Interactive charts and dashboards that respond to real-time data updates
- **Production-Ready Architecture**: Designed for deployment on AWS with Docker containerization

While SeedMart isn't a real trading platform, it demonstrates how complex financial interfaces can be built with modern web technologies, showcasing the seamless integration between a Flask backend and an interactive frontend.

## Getting Started

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Deployment

### Local Development

Follow the setup instructions in the "Getting Started" section.

### Production Deployment

#### Backend (Flask API)

1. Set up a production server (Heroku, AWS, DigitalOcean, etc.)
2. Configure environment variables:
   ```
   DATABASE_URL=your_production_database_url
   SECRET_KEY=your_secure_secret_key
   ```
3. Install Python dependencies: `pip install -r requirements.txt`
4. Run with a production WSGI server:
   ```
   gunicorn app:app
   ```

#### Frontend (Express server serving React)

1. Set up a Node.js environment
2. Configure environment variables:
   ```
   REACT_APP_API_URL=your_production_backend_url
   ```
3. Install dependencies: `npm install`
4. Build for production: `npm run build` (if using React build process)
5. Start the server: `npm start`

### Docker Deployment

Use the provided docker-compose.yml to deploy both services:

```
docker-compose up -d
```

## Pages

- `/` - Market view with seed price charts
- `/manage.html` - Seed management interface

## API Endpoints

```text
- GET /api/health - Health check endpoint
- GET /api/seeds - Get all seeds
- GET /api/seeds/:id - Get specific seed
- POST /api/seeds - Create new seed
- PUT /api/seeds/:id - Update seed
- DELETE /api/seeds/:id - Delete seed
```
