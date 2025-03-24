# Quick test script to verify connection
from psycopg import connect

conn = connect(
    "dbname=seedmart user=seedmart host=localhost password=seedmart"
)
with conn.cursor() as cursor:
    cursor.execute("SELECT version();")
    print(cursor.fetchone())
conn.close()