const express = require('express');
const app = express();
const marketRoutes = require('./routes/market');

// ...other middleware and routes...

app.use('/api/market', marketRoutes);

// ...error handling and listen()