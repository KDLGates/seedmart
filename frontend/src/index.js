const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging
app.use((req, res, next) => {
  console.log(`Request URL: ${req.url}`);
  console.log(`Current directory: ${__dirname}`);
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Add a specific health check endpoint for AWS
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// For any route that doesn't match a static file, serve the index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});