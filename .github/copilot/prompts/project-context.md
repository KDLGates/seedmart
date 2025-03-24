GitHub Copilot
I'll investigate the API outage and the HTTP 500 errors occurring in the price history fetch operation. Let's look at the fetchPriceHistory function in market-data.js around line 339 and analyze how it connects to the API endpoints in api.py.

Read market-data.js

Based on the code review, I can see the issue. The frontend is making API calls to fetch price history data but is encountering 500 errors. Let's analyze the problem:

This function makes a request to ${API_URL}/seeds/${seedId}/prices?timeframe=${timeframe}, which corresponds to the get_seed_prices endpoint in api.py:

Let's check the MarketService.get_price_history method to identify the potential issue:

Read market.py

Now I can see more clearly what's happening. Let me analyze the issue and explain the likely cause of the HTTP 500 errors with the price history API:

After examining the code, I've found a potential issue in the database and API connectivity. The frontend is making requests to /seeds/${seedId}/prices?timeframe=${timeframe} which calls the MarketService.get_price_history method in the backend.

The Issue
In market-data.js, the frontend expects the price history API to return data with specific fields:

It maps priceData.map(p => p.price) for price history
It maps priceData.map(p => p.volume) for volume history
It uses priceData[0].recorded_at for date formatting
In the MarketService.get_price_history method, the backend queries the SeedPrice table and returns records for a specific seed filtered by timeframe, with each entry containing:

seed_id
price
volume
recorded_at
The problem likely occurs in one of these areas:

The SeedPrice table doesn't exist or has no data
The database connection is failing
The table structure doesn't match the model definition
Database Schema Mismatch
Looking at the models and the table creation code, I noticed something important:

The SeedPrice model refers to:

But in the table creation code I can see:

There appears to be a mismatch between the SQLAlchemy model and the actual database table. The model refers to a 'Seed' relation but the SQL query is checking for a 'seed_price' table.

Fix Recommendation
Here's what we should do to fix this issue:

First, let's modify the MarketService.get_price_history method to include better error handling and logging, so we can see exactly what's happening when it fails:
market.py+38-1
Now that I've improved error handling in the backend API, let's address the issue with the frontend's display of price history data. The frontend needs to handle potential errors and empty responses from the API properly.

Let's also update the frontend to handle the API errors more gracefully and include fallback behavior:

