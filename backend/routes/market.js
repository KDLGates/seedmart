const express = require('express');
const router = express.Router();

// Dummy market summary data (update with your real database logic)
router.get('/summary', (req, res) => {
  const marketSummary = [
    {
      id: 1,
      name: "Tomato",
      species: "Solanum lycopersicum",
      currentPrice: 2.45,
      previousPrice: 2.30,
      change: 0.15,
      changePercent: 6.5,
      volume: 15000,
      description: "Fresh tomato seeds"
    },
    // ...more data
  ];

  res.json(marketSummary);
});

module.exports = router;