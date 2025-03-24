const express = require('express');
const path = require('path');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require('http');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip} - Host: ${req.headers.host} - User-Agent: ${req.headers['user-agent']}`);
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
    console.log(`Proxying request to API: ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy Error: Cannot connect to API server');
  }
}));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  index: false // Don't automatically serve index.html, let our explicit route handle it
}));

// Health check endpoint for AWS
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Explicit route for the root to ensure index.html is served
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Handle all other routes by serving index.html for SPA behavior
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Server Error: Something went wrong');
});

// Create and start the server
const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=== Frontend server started ===`);
  console.log(`- Listening on port: ${PORT}`);
  console.log(`- Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`- API proxy target: ${process.env.API_URL || 'http://backend:5000'}`);
  console.log(`- Server date/time: ${new Date().toISOString()}`);
});