document.addEventListener('DOMContentLoaded', () => {
  // Seed types with their species for our market
  const seedTypes = [
    { name: 'Tomato', species: 'Solanum lycopersicum' },
    { name: 'Carrot', species: 'Daucus carota' },
    { name: 'Sunflower', species: 'Helianthus annuus' },
    { name: 'Corn', species: 'Zea mays' },
    { name: 'Cucumber', species: 'Cucumis sativus' },
    { name: 'Pumpkin', species: 'Cucurbita pepo' },
    { name: 'Lettuce', species: 'Lactuca sativa' },
    { name: 'Pepper', species: 'Capsicum annuum' },
    { name: 'Basil', species: 'Ocimum basilicum' },
    { name: 'Lavender', species: 'Lavandula' }
  ];

  // Chart configuration
  let chart;
  let marketData = [];
  
  // Generate random price for a seed
  function generateBasePrice() {
    return (Math.random() * 10 + 2).toFixed(2);
  }
  
  // Generate price history data with trends
  function generatePriceHistory(basePrice, days = 7) {
    const prices = [];
    const trend = Math.random() > 0.5 ? 1 : -1; // Random trend direction
    const volatility = Math.random() * 0.2 + 0.05; // How much the price fluctuates
    
    let price = parseFloat(basePrice);
    
    for (let i = 0; i < days; i++) {
      // Add some randomness to the trend
      const change = (Math.random() - 0.5) * volatility + (trend * 0.02);
      price = Math.max(0.2, price + price * change); // Ensure price doesn't go too low
      prices.push(price);
    }
    
    return prices;
  }
  
  // Generate dates for the chart
  function generateDates(days = 7) {
    const dates = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    
    return dates;
  }
  
  // Generate random volume
  function generateVolume() {
    return Math.floor(Math.random() * 10000) + 500;
  }
  
  // Generate market data for all seeds
  function generateMarketData() {
    marketData = seedTypes.map(seed => {
      const basePrice = generateBasePrice();
      const priceHistory = generatePriceHistory(basePrice);
      const currentPrice = priceHistory[priceHistory.length - 1].toFixed(2);
      const previousPrice = priceHistory[priceHistory.length - 2].toFixed(2);
      const change = (currentPrice - previousPrice).toFixed(2);
      const changePercent = ((change / previousPrice) * 100).toFixed(1);
      
      return {
        ...seed,
        basePrice,
        priceHistory,
        currentPrice,
        previousPrice,
        change,
        changePercent,
        volume: generateVolume()
      };
    });
    
    return marketData;
  }
  
  // Initialize the chart
  function initChart(data) {
    const ctx = document.getElementById('seedChart').getContext('2d');
    
    // Get selected seeds for charting (top 5 by price)
    const selectedSeeds = [...data]
      .sort((a, b) => b.currentPrice - a.currentPrice)
      .slice(0, 5);
      
    const labels = generateDates();
    
    // Prepare datasets for chart
    const datasets = selectedSeeds.map(seed => {
      // Generate a random color
      const r = Math.floor(Math.random() * 200);
      const g = Math.floor(Math.random() * 200);
      const b = Math.floor(Math.random() * 200);
      
      return {
        label: seed.name,
        data: seed.priceHistory,
        borderColor: `rgb(${r}, ${g}, ${b})`,
        backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`,
        tension: 0.3
      };
    });
    
    // Destroy existing chart if it exists
    if (chart) {
      chart.destroy();
    }
    
    // Create new chart
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Seed Price Trends (Price in $)'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Price ($)'
            },
            beginAtZero: true
          }
        }
      }
    });
  }
  
  // Update trending lists
  function updateTrendingLists(data) {
    const trendingUp = document.getElementById('trending-up');
    const trendingDown = document.getElementById('trending-down');
    
    // Sort by change percentage
    const sortedByChange = [...data].sort((a, b) => b.changePercent - a.changePercent);
    
    // Clear existing lists
    trendingUp.innerHTML = '';
    trendingDown.innerHTML = '';
    
    // Add top 5 trending up
    sortedByChange.slice(0, 5).forEach(seed => {
      const li = document.createElement('li');
      li.className = 'up';
      li.innerHTML = `
        ${seed.name} 
        <span>+${seed.changePercent}%</span>
      `;
      trendingUp.appendChild(li);
    });
    
    // Add bottom 5 trending down
    sortedByChange.slice(-5).reverse().forEach(seed => {
      const li = document.createElement('li');
      li.className = 'down';
      li.innerHTML = `
        ${seed.name} 
        <span>${seed.changePercent}%</span>
      `;
      trendingDown.appendChild(li);
    });
  }
  
  // Update market table
  function updateMarketTable(data) {
    const tableBody = document.getElementById('market-data');
    tableBody.innerHTML = '';
    
    data.forEach(seed => {
      const row = document.createElement('tr');
      
      // Determine price change class
      const priceChangeClass = seed.change > 0 ? 'price-up' : 'price-down';
      const changeSymbol = seed.change > 0 ? '+' : '';
      
      row.innerHTML = `
        <td>${seed.name}</td>
        <td>${seed.species}</td>
        <td>$${seed.currentPrice}</td>
        <td class="${priceChangeClass}">${changeSymbol}${seed.change} (${changeSymbol}${seed.changePercent}%)</td>
        <td>${seed.volume.toLocaleString()}</td>
        <td><button class="trade-btn">Trade</button></td>
      `;
      
      tableBody.appendChild(row);
    });
  }
  
  // Initialize market view
  function initMarketView() {
    const data = generateMarketData();
    initChart(data);
    updateTrendingLists(data);
    updateMarketTable(data);
  }
  
  // Event listeners
  document.getElementById('timeframe').addEventListener('change', () => {
    // In a real app, this would fetch different timeframe data
    initMarketView();
  });
  
  document.getElementById('refresh-btn').addEventListener('click', () => {
    initMarketView();
  });
  
  // Initialize on page load
  initMarketView();
});
