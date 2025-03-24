const express = require('express');
const path = require('path');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require('http');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 3000; // Use port 3000 by default
const HTTPS_PORT = process.env.HTTPS_PORT || 3443; // Changed from 443 for same reason
const API_PORT = process.env.API_PORT || 5000;

// SSL certificate options
let httpsOptions = {};
try {
  httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, '../../certs/privkey.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../../certs/cert.pem')),
    ca: fs.readFileSync(path.join(__dirname, '../../certs/chain.pem'))
  };
  console.log('SSL certificates loaded successfully');
} catch (err) {
  console.warn('SSL certificates not found, HTTPS server will not start:', err.message);
}

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
  target: process.env.API_URL || `http://localhost:${API_PORT}/api`,
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

// Create and start HTTP server
const httpServer = http.createServer(app);

httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`=== HTTP server started ===`);
  console.log(`- Listening on port: ${HTTP_PORT}`);
  console.log(`- Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`- API proxy target: ${process.env.API_URL || `http://localhost:${API_PORT}`}`);
  console.log(`- Server date/time: ${new Date().toISOString()}`);
});

// Create and start HTTPS server if SSL certificates are available
if (httpsOptions.key && httpsOptions.cert) {
  const httpsServer = https.createServer(httpsOptions, app);
  
  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`=== HTTPS server started ===`);
    console.log(`- Listening on port: ${HTTPS_PORT}`);
    console.log(`- Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`- Server date/time: ${new Date().toISOString()}`);
  });
} else {
  console.warn('HTTPS server not started: missing SSL certificates');
}