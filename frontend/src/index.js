const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Logging
app.use((req, res, next) => {
  console.log(`Request URL: ${req.url}`);
  console.log(`Current directory: ${__dirname}`);
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Serve all client routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});

// Serve statics from public
app.use(express.static(path.join(__dirname, '../public')));

// For any route that doesn't match a static file, serve the index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Add a specific health check endpoint for AWS
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});