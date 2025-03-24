# Quick test script to verify connection
import psycopg2

conn = psycopg2.connect(
    "postgresql://seedmart:seedmart@localhost:5432/seedmart"
)
with conn.cursor() as cursor:
    cursor.execute("SELECT version();")
    print(cursor.fetchone())
conn.close()