import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for error handling
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error('API request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API response error:', error);
    return Promise.reject(error);
  }
);

// API methods
export const fetchPriceHistory = async (productId) => {
  try {
    const response = await api.get(`/price-history/${productId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching price history for product ${productId}:`, error);
    throw error;
  }
};

export default api;
