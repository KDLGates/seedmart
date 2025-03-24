PROJECT STRUCTURE AND API ISSUES

Frontend Structure:
- JavaScript frontend with market-data.js handling price history fetch operations
- Key function: fetchPriceHistory at line ~339 makes API calls to ${API_URL}/seeds/${seedId}/prices?timeframe=${timeframe}
- Frontend expects response data with specific fields: price, volume, and recorded_at

Backend Structure:
- Flask API with endpoints defined in api.py
- Market data service in market.py containing MarketService.get_price_history method
- PostgreSQL database with SQLAlchemy ORM for data access

Database Components:
- SeedPrice table storing historical price data
- Each record contains: seed_id, price, volume, recorded_at

Current Issue:
- HTTP 500 errors occur when fetching price history
- Potential database connectivity or schema mismatch problem
- Possible discrepancy between SQLAlchemy model definition and actual database table
- Model refers to 'Seed' relation while SQL query checks for 'seed_price' table

Proposed Fixes:
1. Improve error handling in MarketService.get_price_history
2. Update frontend to handle API errors gracefully with fallback behavior
3. Verify database schema matches ORM model definitions
4. Add proper logging to identify exact failure points