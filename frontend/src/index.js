const express = require('express');
const path = require('path');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API proxy middleware
app.use('/api', createProxyMiddleware({
  target: process.env.API_URL || 'http://localhost:5000/api',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'
  },
  onProxyReq: (proxyReq, req) => {
    // Log proxy requests in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Proxying request:', req.method, req.url);
    }
  }
}));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint for AWS
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`API proxy target: ${process.env.API_URL || 'http://backend:5000'}`);
});