# SeedMart

A full-stack seed trading platform with a market visualization dashboard and seed management system.

## Project Structure

- Backend: Python with Flask
- Frontend: Node.js with Express
- Database: SQLite/PostgreSQL

## Features

- Interactive seed market dashboard with price charts
- Trending seeds visualization
- Seed management system
- CRUD operations for seed inventory

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
