from flask import Blueprint, request, jsonify
from backend.services.database import get_db_connection

api = Blueprint('api', __name__)

@api.route('/items', methods=['GET'])
def get_items():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM items')
    items = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(items)

@api.route('/items', methods=['POST'])
def create_item():
    new_item = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO items (name, description) VALUES (?, ?)', 
                   (new_item['name'], new_item['description']))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify(new_item), 201

@api.route('/items/<int:item_id>', methods=['GET'])
def get_item(item_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM items WHERE id = ?', (item_id,))
    item = cursor.fetchone()
    cursor.close()
    conn.close()
    if item is None:
        return jsonify({'error': 'Item not found'}), 404
    return jsonify(item)

@api.route('/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    updated_item = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE items SET name = ?, description = ? WHERE id = ?', 
                   (updated_item['name'], updated_item['description'], item_id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify(updated_item)

@api.route('/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM items WHERE id = ?', (item_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'result': 'Item deleted'})