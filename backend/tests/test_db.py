# Quick test script to verify connection
import psycopg2
conn = psycopg2.connect(
    host="localhost",
    database="seedmart",
    user="kdlgates",
    password="your_password"
)
cursor = conn.cursor()
cursor.execute("SELECT version();")
print(cursor.fetchone())
conn.close()