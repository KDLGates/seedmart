from flask import Flask, jsonify, request
from backend.services.database import get_db_connection

app = Flask(__name__)

@app.route('/api/items', methods=['GET'])
def get_items():
    conn = get_db_connection()
    items = conn.execute('SELECT * FROM items').fetchall()
    conn.close()
    return jsonify([dict(item) for item in items])

@app.route('/api/items', methods=['POST'])
def create_item():
    new_item = request.json
    conn = get_db_connection()
    conn.execute('INSERT INTO items (name, description) VALUES (?, ?)', 
                 (new_item['name'], new_item['description']))
    conn.commit()
    conn.close()
    return jsonify(new_item), 201

@app.route('/api/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    updated_item = request.json
    conn = get_db_connection()
    conn.execute('UPDATE items SET name = ?, description = ? WHERE id = ?', 
                 (updated_item['name'], updated_item['description'], item_id))
    conn.commit()
    conn.close()
    return jsonify(updated_item)

@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM items WHERE id = ?', (item_id,))
    conn.commit()
    conn.close()
    return jsonify({'result': True})