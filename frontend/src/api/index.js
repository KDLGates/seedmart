import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';


// Core application routes
app.use(express.static(path.join(__dirname, '../public')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});


// Functional CRUD routes
export const getItems = async () => {
    const response = await axios.get(`${API_URL}/items`);
    return response.data;
};

export const getItem = async (id) => {
    const response = await axios.get(`${API_URL}/items/${id}`);
    return response.data;
};

export const createItem = async (item) => {
    const response = await axios.post(`${API_URL}/items`, item);
    return response.data;
};

export const updateItem = async (id, item) => {
    const response = await axios.put(`${API_URL}/items/${id}`, item);
    return response.data;
};

export const deleteItem = async (id) => {
    const response = await axios.delete(`${API_URL}/items/${id}`);
    return response.data;
};
