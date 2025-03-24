# Quick test script to verify connection
from psycopg import connect

conn = connect(
    "postgresql://seedmart:seedmart@localhost:5432/seedmart"
)
with conn.cursor() as cursor:
    cursor.execute("SELECT version();")
    print(cursor.fetchone())
conn.close()