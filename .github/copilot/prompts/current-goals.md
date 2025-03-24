PROJECT STRUCTURE AND API ISSUES

Frontend Structure:
- JavaScript frontend with market-data.js handling price history fetch operations
- Key function: fetchPriceHistory at line ~339 makes API calls to ${API_URL}/seeds/${seedId}/prices?timeframe=${timeframe}
- Frontend expects response data with specific fields: price, volume, and recorded_at

Backend Structure:
- Flask API with endpoints defined in api.py
- Market data service in market.py containing MarketService.get_price_history method
- PostgreSQL database with SQLAlchemy ORM for data access

Current Issue:
- HTTP 500 errors occur when fetching price history
- Potential database connectivity or schema mismatch problem
- Possible discrepancy between SQLAlchemy model definition and actual database table
- Model refers to 'Seed' relation while SQL query checks for 'seed_price' table

Proposed Fixes:
1. Verify Docker configuration is supporting the Postgres database on 5432
2. Update frontend to handle API errors gracefully with fallback behavior
3. Verify database schema matches ORM model definitions
