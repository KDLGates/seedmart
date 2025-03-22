document.addEventListener('DOMContentLoaded', () => {
  // API configuration
  const API_URL = 'http://localhost:5000/api';
  let useMockData = false; // Set to false to use API data by default
  
  // Seed types with their species for our market (used for mock data)
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
  let volumeChart;
  let marketData = [];
  let selectedSeed = null;
  let chartType = 'line'; // Default chart type
  let timeframe = '1w'; // Default timeframe
  let autoUpdateEnabled = true; // Auto-update chart flag
  
  // Set up server time update
  function updateServerTime() {
    const serverTimeElement = document.getElementById('server-time');
    const now = new Date();
    serverTimeElement.textContent = `Server time: ${now.toLocaleTimeString()}`;
  }
  
  // Update server time every second
  setInterval(updateServerTime, 1000);
  updateServerTime();
  
  // Generate random price for a seed (for mock data only)
  function generateBasePrice() {
    // Scaled down from 10+2 to 5+1 to get smaller price values (1-6 range instead of 2-12)
    return (Math.random() * 5 + 1).toFixed(2);
  }
  
  // Generate price history data with trends (for mock data only)
  function generatePriceHistory(basePrice, days = 7) {
    // Map timeframe to number of days
    const timeframeDays = {
      '1d': 1 * 24, // 1 day x 24 hourly data points
      '1w': 7,
      '1m': 30,
      '3m': 90,
      '1y': 365,
    };
    
    // Get the number of data points based on selected timeframe
    const dataPoints = timeframeDays[timeframe] || 7;
    
    const prices = [];
    const trend = Math.random() > 0.5 ? 1 : -1; // Random trend direction
    // Reduced volatility for smaller price movements
    const volatility = Math.random() * 0.1 + 0.02; // Scaled down from 0.2+0.05
    
    let price = parseFloat(basePrice);
    
    for (let i = 0; i < dataPoints; i++) {
      // Add some randomness to the trend
      const change = (Math.random() - 0.5) * volatility + (trend * 0.02);
      price = Math.max(0.2, price + price * change); // Ensure price doesn't go too low
      prices.push(price);
    }
    
    return prices;
  }
  
  // Generate dates for the chart
  function generateDates(priceData = []) {
    const timeframeFormat = {
      '1d': { hour: '2-digit', minute: '2-digit' },
      '1w': { month: 'short', day: 'numeric' },
      '1m': { month: 'short', day: 'numeric' },
      '3m': { month: 'short', day: 'numeric' },
      '1y': { month: 'short', year: 'numeric' }
    };
    
    // If we have actual price data with timestamps, use those
    if (priceData.length > 0 && priceData[0].recorded_at) {
      return priceData.map(item => {
        const date = new Date(item.recorded_at);
        return date.toLocaleDateString('en-US', timeframeFormat[timeframe] || { month: 'short', day: 'numeric' });
      });
    }
    
    // Fallback to generating dates if we don't have timestamp data
    const timeframeDays = {
      '1d': 1 * 24, // 1 day with hourly data points
      '1w': 7,
      '1m': 30,
      '3m': 90,
      '1y': 365,
    };
    
    const dataPoints = timeframeDays[timeframe] || 7;
    const format = timeframeFormat[timeframe] || { month: 'short', day: 'numeric' };
    
    const dates = [];
    const now = new Date();
    
    // For 1 day timeframe, use hourly points
    if (timeframe === '1d') {
      for (let i = dataPoints - 1; i >= 0; i--) {
        const date = new Date();
        date.setHours(now.getHours() - i);
        dates.push(date.toLocaleTimeString('en-US', format));
      }
    } else {
      // For other timeframes, use daily points
      for (let i = dataPoints - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        dates.push(date.toLocaleDateString('en-US', format));
      }
    }
    
    return dates;
  }
  
  // Generate random volume data (for mock data only)
  function generateVolumeData(days = 7) {
    // Map timeframe to number of data points
    const timeframeDays = {
      '1d': 1 * 24,
      '1w': 7,
      '1m': 30,
      '3m': 90,
      '1y': 365,
    };
    
    const dataPoints = timeframeDays[timeframe] || 7;
    const volumes = [];
    
    for (let i = 0; i < dataPoints; i++) {
      volumes.push(Math.floor(Math.random() * 10000) + 500);
    }
    
    return volumes;
  }
  
  // Generate random volume (for mock data only)
  function generateVolume() {
    return Math.floor(Math.random() * 10000) + 500;
  }
  
  // Calculate market statistics
  function calculateMarketStats(data) {
    const totalVolume = data.reduce((sum, seed) => sum + seed.volume, 0);
    const marketCap = data.reduce((sum, seed) => sum + (seed.currentPrice * 1000), 0); // Assuming 1000 units per seed type
    
    document.getElementById('market-volume').textContent = '$' + totalVolume.toLocaleString();
    document.getElementById('market-cap').textContent = '$' + marketCap.toLocaleString();
    document.getElementById('seed-count').textContent = data.length;
  }

  // Fetch seeds from the API using the market summary endpoint
  async function fetchSeedsFromAPI() {
    try {
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'loading';
      loadingIndicator.textContent = 'Loading seed data';
      
      // Show loading state in market data table
      const marketDataTable = document.getElementById('market-data');
      if (marketDataTable) {
        marketDataTable.innerHTML = '';
        const loadingRow = document.createElement('tr');
        const loadingCell = document.createElement('td');
        loadingCell.colSpan = 7;
        loadingCell.appendChild(loadingIndicator);
        loadingRow.appendChild(loadingCell);
        marketDataTable.appendChild(loadingRow);
      }
      
      // Fetch market summary data from API
      const response = await fetch(`${API_URL}/market/summary`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const summaryData = await response.json();
      
      // Return the market summary data - it already has the format we need
      return summaryData.map(seed => {
        return {
          id: seed.id,
          name: seed.name,
          species: seed.species || 'Unknown species',
          currentPrice: seed.currentPrice,
          previousPrice: seed.previousPrice,
          change: seed.change,
          changePercent: seed.changePercent,
          volume: seed.volume,
          description: seed.description,
          // Initialize with empty arrays - will be populated when seed is selected
          priceHistory: [],
          volumeHistory: []
        };
      });
    } catch (error) {
      console.error('Error fetching seeds from API:', error);
      
      // Show error in the UI
      const marketDataTable = document.getElementById('market-data');
      if (marketDataTable) {
        marketDataTable.innerHTML = `
          <tr>
            <td colspan="7">
              <div class="error-message">
                Error loading seed data. Using mock data instead.
                <br><small>${error.message}</small>
              </div>
            </td>
          </tr>
        `;
      }
      
      // Return null to indicate error and fall back to mock data
      return null;
    }
  }

  // Fetch price history for a specific seed
  async function fetchPriceHistory(seedId) {
    try {
      // Show loading indicator in the chart
      document.getElementById('seedChart').style.opacity = '0.5';
      document.getElementById('volumeChart').style.opacity = '0.5';
      
      // Fetch price history from API with the current timeframe
      const response = await fetch(`${API_URL}/seeds/${seedId}/prices?timeframe=${timeframe}`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const priceData = await response.json();
      
      // Extract price and volume arrays
      const prices = priceData.map(item => item.price);
      const volumes = priceData.map(item => item.volume);
      
      // Return both arrays and the raw data
      return {
        priceHistory: prices,
        volumeHistory: volumes,
        rawData: priceData
      };
    } catch (error) {
      console.error(`Error fetching price history for seed ${seedId}:`, error);
      
      // In case of error, return empty arrays
      return {
        priceHistory: [],
        volumeHistory: [],
        rawData: []
      };
    } finally {
      // Restore chart opacity
      document.getElementById('seedChart').style.opacity = '1';
      document.getElementById('volumeChart').style.opacity = '1';
    }
  }
  
  // Generate market data for all seeds
  async function generateMarketData() {
    let data = [];
    
    // Try to fetch from API first if not using mock data
    if (!useMockData) {
      const apiData = await fetchSeedsFromAPI();
      
      // If API data is available, use it
      if (apiData && apiData.length > 0) {
        data = apiData;
      } else {
        // If API fails or returns empty, fall back to mock data
        useMockData = true;
        updateDataSourceUI(); // Update the UI to reflect the data source change
        console.log('Falling back to mock data');
      }
    }
    
    // If using mock data or API failed, generate mock data
    if (useMockData || data.length === 0) {
      data = seedTypes.map(seed => {
        const basePrice = generateBasePrice();
        const priceHistory = generatePriceHistory(basePrice);
        const volumeHistory = generateVolumeData();
        const currentPrice = priceHistory[priceHistory.length - 1].toFixed(2);
        const previousPrice = priceHistory[priceHistory.length - 2].toFixed(2);
        const change = (currentPrice - previousPrice).toFixed(2);
        const changePercent = ((change / previousPrice) * 100).toFixed(1);
        
        return {
          ...seed,
          basePrice,
          priceHistory,
          volumeHistory,
          currentPrice,
          previousPrice,
          change,
          changePercent,
          volume: generateVolume()
        };
      });
    }
    
    marketData = data;
    calculateMarketStats(marketData);
    return marketData;
  }
  
  // Initialize the chart with a set of seeds (top 3 or selected seed)
  async function initChart(seeds) {
    const ctx = document.getElementById('seedChart').getContext('2d');
    const volumeCtx = document.getElementById('volumeChart').getContext('2d');
    
    // Clone the seeds to avoid modifying the original data
    let seedsToShow = [...seeds];
    
    // Limit to top 3 if not selecting a specific seed
    if (seedsToShow.length > 3) {
      seedsToShow = seedsToShow
        .sort((a, b) => b.currentPrice - a.currentPrice)
        .slice(0, 3);
    }
    
    // For each seed to show, fetch its price history if needed
    for (let seed of seedsToShow) {
      // If price history isn't loaded yet, fetch it from API (or generate if mock)
      if (!seed.priceHistory || seed.priceHistory.length === 0) {
        if (!useMockData) {
          // Fetch from API
          const historyData = await fetchPriceHistory(seed.id);
          seed.priceHistory = historyData.priceHistory;
          seed.volumeHistory = historyData.volumeHistory;
          seed.rawPriceData = historyData.rawData;
        } else {
          // Generate mock data
          seed.priceHistory = generatePriceHistory(seed.currentPrice);
          seed.volumeHistory = generateVolumeData();
        }
      }
    }
    
    // Generate dates based on the first seed's price history
    const labels = seedsToShow.length > 0 && seedsToShow[0].rawPriceData ? 
      generateDates(seedsToShow[0].rawPriceData) : 
      generateDates();
    
    // Display selected seeds in chart title
    document.getElementById('current-seed').textContent = seedsToShow.map(seed => seed.name).join(', ');
    
    // Update real-time price indicator
    if (seedsToShow.length > 0) {
      document.getElementById('live-price').textContent = '$' + seedsToShow[0].currentPrice;
      const changeText = seedsToShow[0].change > 0 ? 
        `+${seedsToShow[0].change} (${seedsToShow[0].changePercent}%)` : 
        `${seedsToShow[0].change} (${seedsToShow[0].changePercent}%)`;
      const liveChange = document.getElementById('live-change');
      liveChange.textContent = changeText;
      liveChange.className = seedsToShow[0].change > 0 ? 'price-up' : 'price-down';
    }
    
    // Prepare datasets for chart based on chart type
    const datasets = seedsToShow.map(seed => {
      // Generate a consistent color for each seed
      const hash = seed.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const r = (hash * 123) % 200 + 55;
      const g = (hash * 456) % 200 + 55;
      const b = (hash * 789) % 200 + 55;
      
      return {
        label: seed.name,
        data: seed.priceHistory,
        borderColor: `rgb(${r}, ${g}, ${b})`,
        backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`,
        pointBackgroundColor: `rgb(${r}, ${g}, ${b})`,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: `rgb(${r}, ${g}, ${b})`,
        pointHoverBorderColor: '#fff',
        tension: 0.3
      };
    });
    
    // Destroy existing chart if it exists
    if (chart) {
      chart.destroy();
    }
    if (volumeChart) {
      volumeChart.destroy();
    }
    
    // TradingView-inspired dark theme
    Chart.defaults.color = '#787b86';
    Chart.defaults.borderColor = '#363a45';
    
    // Create new price chart with animations
    chart = new Chart(ctx, {
      type: chartType,
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                size: 12
              },
              boxWidth: 15,
              usePointStyle: true
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: '#2a2e39',
            titleColor: '#d1d4dc',
            bodyColor: '#d1d4dc',
            borderColor: '#363a45',
            borderWidth: 1,
            padding: 10,
            displayColors: true,
            callbacks: {
              title: function(tooltipItems) {
                return tooltipItems[0].label;
              },
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: true,
              color: '#2a2e39',
              tickColor: '#363a45'
            },
            ticks: {
              color: '#787b86',
              font: {
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                size: 11
              }
            }
          },
          y: {
            position: 'right',
            grid: {
              display: true,
              color: '#2a2e39',
              tickColor: '#363a45'
            },
            ticks: {
              color: '#787b86',
              font: {
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                size: 11
              },
              callback: function(value) {
                return '$' + value.toFixed(2);
              }
            }
          }
        }
      }
    });
    
    // Create volume chart with animations
    volumeChart = new Chart(volumeCtx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: seedsToShow.map(seed => {
          // Generate a consistent color for each seed
          const hash = seed.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const r = (hash * 123) % 200 + 55;
          const g = (hash * 456) % 200 + 55;
          const b = (hash * 789) % 200 + 55;
          
          return {
            label: seed.name + ' Volume',
            data: seed.volumeHistory,
            backgroundColor: `rgba(${r}, ${g}, ${b}, 0.5)`
          };
        })
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: '#2a2e39',
            bodyColor: '#d1d4dc',
            borderColor: '#363a45',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            display: false
          },
          y: {
            display: false,
            beginAtZero: true
          }
        }
      }
    });
  }
  
  // Generate sparkline chart for table
  function generateSparkline(seed, trend) {
    const sparklineCanvas = document.createElement('canvas');
    sparklineCanvas.className = 'sparkline';
    
    // If we have price history, use it; otherwise fetch it or use empty array
    let priceData = seed.priceHistory || [];
    
    // If no price data is available, use the spark cell to show loading indicator
    if (priceData.length === 0) {
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'spark-loading';
      loadingDiv.textContent = 'Loading...';
      
      // Try to fetch price history in the background if API is available
      if (!useMockData) {
        fetchPriceHistory(seed.id).then(data => {
          seed.priceHistory = data.priceHistory;
          seed.volumeHistory = data.volumeHistory;
          
          // Once data is loaded, replace loading indicator with sparkline
          const parentCell = loadingDiv.parentElement;
          if (parentCell) {
            parentCell.innerHTML = '';
            parentCell.appendChild(generateSparkline(seed, trend));
          }
        }).catch(err => {
          console.error(`Error fetching sparkline data for ${seed.name}:`, err);
          loadingDiv.textContent = 'No data';
        });
      } else {
        // For mock data, generate immediately
        seed.priceHistory = generatePriceHistory(seed.currentPrice);
        seed.volumeHistory = generateVolumeData();
        return generateSparkline(seed, trend);
      }
      
      return loadingDiv;
    }
    
    const hash = seed.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const r = (hash * 123) % 200 + 55;
    const g = (hash * 456) % 200 + 55;
    const b = (hash * 789) % 200 + 55;
    
    const sparkCtx = sparklineCanvas.getContext('2d');
    
    // Create mini line chart
    new Chart(sparkCtx, {
      type: 'line',
      data: {
        labels: Array(priceData.length).fill(''),
        datasets: [{
          data: priceData,
          borderColor: trend > 0 ? '#26a69a' : '#ef5350',
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          duration: 600
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
          }
        },
        scales: {
          x: {
            display: false
          },
          y: {
            display: false
          }
        },
        elements: {
          line: {
            tension: 0.4
          }
        }
      }
    });
    
    return sparklineCanvas;
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
      
      // Add click event to select seed for chart
      li.addEventListener('click', () => {
        // Highlight the selected seed in the list
        document.querySelectorAll('.trend-list li').forEach(item => item.classList.remove('selected'));
        li.classList.add('selected');
        
        selectedSeed = seed;
        initChart([seed]); // Show only this seed
      });
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
      
      // Add click event to select seed for chart
      li.addEventListener('click', () => {
        // Highlight the selected seed in the list
        document.querySelectorAll('.trend-list li').forEach(item => item.classList.remove('selected'));
        li.classList.add('selected');
        
        selectedSeed = seed;
        initChart([seed]); // Show only this seed
      });
    });
  }
  
  // Update market table
  function updateMarketTable(data) {
    const tableBody = document.getElementById('market-data');
    const sortBy = document.getElementById('sort-by').value;
    const searchTerm = document.getElementById('search-seeds').value.toLowerCase();
    
    // Filter by search term if provided
    let filteredData = searchTerm ? 
      data.filter(seed => seed.name.toLowerCase().includes(searchTerm) || 
                          seed.species.toLowerCase().includes(searchTerm)) : 
      data;
    
    // Sort data based on selected sorting option
    switch(sortBy) {
      case 'name':
        filteredData.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price':
        filteredData.sort((a, b) => b.currentPrice - a.currentPrice);
        break;
      case 'change':
        filteredData.sort((a, b) => b.changePercent - a.changePercent);
        break;
      case 'volume':
        filteredData.sort((a, b) => b.volume - a.volume);
        break;
    }
    
    tableBody.innerHTML = '';
    
    filteredData.forEach(seed => {
      const row = document.createElement('tr');
      
      // Mark row as active if it's the selected seed
      if (selectedSeed && selectedSeed.name === seed.name) {
        row.classList.add('active');
      }
      
      // Determine price change class
      const priceChangeClass = seed.change > 0 ? 'price-up' : 'price-down';
      const changeSymbol = seed.change > 0 ? '+' : '';
      
      // Create sparkline chart cell
      const sparklineCell = document.createElement('td');
      sparklineCell.appendChild(generateSparkline(seed, seed.change));
      
      row.innerHTML = `
        <td>${seed.name}</td>
        <td>${seed.species}</td>
        <td>$${seed.currentPrice}</td>
        <td class="${priceChangeClass}">${changeSymbol}${seed.change} (${changeSymbol}${seed.changePercent}%)</td>
        <td>${seed.volume.toLocaleString()}</td>
        <td><button class="trade-btn">Trade</button></td>
      `;
      
      // Insert sparkline as the 6th cell (before Actions)
      row.insertBefore(sparklineCell, row.children[5]);
      
      // Add click event to show this seed in the chart
      row.addEventListener('click', (e) => {
        // Don't trigger if clicking the trade button
        if (e.target.classList.contains('trade-btn')) return;
        
        // Highlight the selected row
        document.querySelectorAll('#market-data tr').forEach(row => row.classList.remove('active'));
        row.classList.add('active');
        
        // Remove highlight from trend lists
        document.querySelectorAll('.trend-list li').forEach(item => item.classList.remove('selected'));
        
        selectedSeed = seed;
        initChart([seed]);
      });
      
      tableBody.appendChild(row);
    });
  }
  
  // Initialize market view
  async function initMarketView() {
    const data = await generateMarketData();
    initChart(data);
    updateTrendingLists(data);
    updateMarketTable(data);
    
    // Initialize trade buttons after the table is populated
    initializeTradeButtons();
    
    // Simulate real-time ticker updates
    startRealtimeTicker();
  }
  
  // Update the UI to reflect the current data source
  function updateDataSourceUI() {
    const dataSourceBtn = document.getElementById('data-source-btn');
    const dataSourceLabel = dataSourceBtn.querySelector('.data-source-label');
    
    if (useMockData) {
      dataSourceBtn.classList.add('mock-active');
      dataSourceBtn.classList.remove('api-active');
      dataSourceLabel.textContent = 'Mock Data';
    } else {
      dataSourceBtn.classList.remove('mock-active');
      dataSourceBtn.classList.add('api-active');
      dataSourceLabel.textContent = 'API Data';
    }
  }
  
  // Simulate real-time price updates
  let tickerInterval;
  function startRealtimeTicker() {
    // Clear previous interval if exists
    if (tickerInterval) clearInterval(tickerInterval);
    
    // Update ticker every few seconds
    tickerInterval = setInterval(() => {
      // Only update if we have market data and auto-update is enabled
      if (marketData.length === 0 || !autoUpdateEnabled) return;
      
      // Select a random seed to update
      const randomIndex = Math.floor(Math.random() * marketData.length);
      const seed = marketData[randomIndex];
      
      // Generate a small random price change
      const changeDirection = Math.random() > 0.5 ? 1 : -1;
      const changeAmount = (Math.random() * 0.1).toFixed(2);
      
      // Update the price
      const newPrice = (parseFloat(seed.currentPrice) + changeDirection * parseFloat(changeAmount)).toFixed(2);
      const oldPrice = seed.currentPrice;
      seed.currentPrice = newPrice;
      seed.change = (newPrice - seed.previousPrice).toFixed(2);
      seed.changePercent = ((seed.change / seed.previousPrice) * 100).toFixed(1);
      
      // Update price history if it exists
      if (seed.priceHistory && seed.priceHistory.length > 0) {
        seed.priceHistory.push(parseFloat(newPrice));
        seed.priceHistory.shift();
      }
      
      // If this is the selected seed or one of the displayed seeds, update the chart
      if (selectedSeed && selectedSeed.name === seed.name) {
        document.getElementById('live-price').textContent = '$' + newPrice;
        const changeText = seed.change > 0 ? 
          `+${seed.change} (${seed.changePercent}%)` : 
          `${seed.change} (${seed.changePercent}%)`;
        const liveChange = document.getElementById('live-change');
        liveChange.textContent = changeText;
        liveChange.className = seed.change > 0 ? 'price-up' : 'price-down';
        
        // Flash effect for price change
        const priceEl = document.getElementById('live-price');
        priceEl.style.backgroundColor = parseFloat(newPrice) > parseFloat(oldPrice) ? 
          'rgba(38, 166, 154, 0.2)' : 'rgba(239, 83, 80, 0.2)';
        setTimeout(() => {
          priceEl.style.backgroundColor = 'transparent';
        }, 1000);
        
        // Update chart with new data
        if (chart) {
          // Find the dataset for this seed
          let datasetIndex = -1;
          chart.data.datasets.forEach((dataset, index) => {
            if (dataset.label === seed.name) {
              datasetIndex = index;
            }
          });
          
          if (datasetIndex !== -1) {
            chart.data.datasets[datasetIndex].data = seed.priceHistory;
            chart.update('none'); // Update without animation for smoother transitions
          }
        }
      }
      
      // Update trending lists and market table occasionally to avoid constant updates
      if (Math.random() < 0.2) {
        updateTrendingLists(marketData);
        updateMarketTable(marketData);
      }
      
    }, 2000); // Update every 2 seconds for more responsive feel
  }
  
  // Toggle between API and mock data
  function toggleDataSource() {
    useMockData = !useMockData;
    updateDataSourceUI();
    
    // Re-initialize market view with new data source
    initMarketView();
  }
  
  // Add a keyboard shortcut (Shift+D) to toggle data source (for development)
  document.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key === 'D') {
      toggleDataSource();
    }
  });
  
  // Toggle auto-update
  function toggleAutoUpdate() {
    autoUpdateEnabled = !autoUpdateEnabled;
    const refreshBtn = document.getElementById('refresh-btn');
    
    if (autoUpdateEnabled) {
      refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Auto';
      startRealtimeTicker();
    } else {
      refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
      if (tickerInterval) {
        clearInterval(tickerInterval);
      }
    }
  }
  
  // Event listeners
  document.getElementById('timeframe').addEventListener('change', (e) => {
    timeframe = e.target.value;
    // Clear price history cache when timeframe changes
    marketData.forEach(seed => {
      seed.priceHistory = [];
      seed.volumeHistory = [];
      seed.rawPriceData = null;
    });
    initMarketView();
  });
  
  document.getElementById('refresh-btn').addEventListener('click', () => {
    if (!autoUpdateEnabled) {
      initMarketView();
    } else {
      toggleAutoUpdate(); // Turn off auto-update if it's on
    }
  });
  
  // Double-click on refresh button to toggle auto-update
  document.getElementById('refresh-btn').addEventListener('dblclick', toggleAutoUpdate);
  
  // Add data source toggle button event listener
  document.getElementById('data-source-btn').addEventListener('click', toggleDataSource);
  
  // Add event listener for chart type buttons
  const chartTypeButtons = document.querySelectorAll('.chart-type-btn');
  chartTypeButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active button
      chartTypeButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update chart type
      chartType = button.getAttribute('data-type');
      initChart(selectedSeed ? [selectedSeed] : marketData);
    });
  });
  
  // Add event listeners for search and sort
  document.getElementById('search-seeds').addEventListener('input', () => {
    updateMarketTable(marketData);
  });
  
  document.getElementById('sort-by').addEventListener('change', () => {
    updateMarketTable(marketData);
  });
  
  // Initialize the data source UI state
  updateDataSourceUI();
  
  // Initialize with auto-update on
  autoUpdateEnabled = true;
  document.getElementById('refresh-btn').innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Auto';
  
  // Initialize on page load
  initMarketView();

  // Handle unfinished features
  function initializeUnfinishedFeatures() {
    // Trade button functionality
    const tradeButtons = document.querySelectorAll('.trade-btn, button[data-action="trade"]');
    tradeButtons.forEach(btn => {
      btn.classList.add('feature-coming-soon', 'disabled');
      
      // Add tooltip
      const tooltip = document.createElement('span');
      tooltip.className = 'tooltip';
      tooltip.textContent = 'Trading feature coming soon';
      btn.appendChild(tooltip);
      
      // Add click handler for feature announcement
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        showFeatureAnnouncement('Seed Trading', 'Not Yet Implemented');
      });
    });
    
    // Password reset functionality
    const resetLinks = document.querySelectorAll('a[href*="reset-password"], .forgot-password');
    resetLinks.forEach(link => {
      link.classList.add('feature-coming-soon');
      
      // Add tooltip
      const tooltip = document.createElement('span');
      tooltip.className = 'tooltip';
      tooltip.textContent = 'Reset feature coming soon';
      link.appendChild(tooltip);
      
      // Add click handler
      link.addEventListener('click', function(e) {
        e.preventDefault();
        showFeatureAnnouncement('Password Reset', 'Not Yet Implemented');
      });
    });
    
    // For registration links that aren't implemented
    const profileLinks = document.querySelectorAll('a[href*="profile"]');
    profileLinks.forEach(link => {
      link.classList.add('feature-coming-soon');
      
      // Add tooltip
      const tooltip = document.createElement('span');
      tooltip.className = 'tooltip';
      tooltip.textContent = 'Profile feature coming soon';
      link.appendChild(tooltip);
      
      link.addEventListener('click', function(e) {
        e.preventDefault();
        showFeatureAnnouncement('User Profiles', 'Not Yet Implemented');
      });
    });
    
    // Also handle links with Profile text content
    document.querySelectorAll('a').forEach(link => {
      if (link.textContent.includes('Profile') && !link.classList.contains('feature-coming-soon')) {
        link.classList.add('feature-coming-soon');
        
        // Add tooltip
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = 'Profile feature coming soon';
        link.appendChild(tooltip);
        
        link.addEventListener('click', function(e) {
          e.preventDefault();
          showFeatureAnnouncement('User Profiles', 'Not Yet Implemented');
        });
      }
    });
  }
  
  // Function to show announcement modal
  function showFeatureAnnouncement(title, message) {
    // Create modal if it doesn't exist
    if (!document.getElementById('feature-modal')) {
      const modal = document.createElement('div');
      modal.id = 'feature-modal';
      modal.className = 'modal';
      
      modal.innerHTML = `
        <div class="modal-content">
          <h2>${title}</h2>
          <div class="coming-soon-tag">Coming Soon</div>
          <p>${message}</p>
          <div class="modal-buttons">
            <button class="btn btn-primary close-modal">Got it</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Add event listeners
      document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('feature-modal').style.display = 'none';
      });
      
    } else {
      // Update existing modal content
      document.querySelector('#feature-modal h2').textContent = title;
      document.querySelector('#feature-modal p').textContent = message;
    }
    
    // Show the modal
    document.getElementById('feature-modal').style.display = 'flex';
  }
  
  // Call this at the end of your document ready function
  initializeUnfinishedFeatures();
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    const modal = document.getElementById('feature-modal');
    if (modal && event.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Initialize trade buttons
  initializeTradeButtons();
});

// Trade button functionality
function initializeTradeButtons() {
  const tradeButtons = document.querySelectorAll('.trade-btn');
  
  tradeButtons.forEach(btn => {
    btn.classList.add('feature-coming-soon', 'disabled');
    
    // Add tooltip
    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip';
    tooltip.textContent = 'Trading feature coming soon';
    btn.appendChild(tooltip);
    
    // Add click handler for feature announcement
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      showFeatureAnnouncement('Seed Trading', 'Not Yet Implemented');
    });
  });
}

// Function to show feature announcement modal
function showFeatureAnnouncement(title, message) {
  // Create modal if it doesn't exist
  if (!document.getElementById('feature-modal')) {
    const modal = document.createElement('div');
    modal.id = 'feature-modal';
    modal.className = 'modal';
    
    modal.innerHTML = `
      <div class="modal-content">
        <h2>${title}</h2>
        <div class="coming-soon-tag">Coming Soon</div>
        <p>${message}</p>
        <div class="modal-buttons">
          <button class="btn btn-primary close-modal" title="Close modal">Got it</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    document.querySelector('.close-modal').addEventListener('click', () => {
      document.getElementById('feature-modal').style.display = 'none';
    });
  } else {
    // Update existing modal content
    document.querySelector('#feature-modal h2').textContent = title;
    document.querySelector('#feature-modal p').textContent = message;
  }
  
  // Show the modal
  document.getElementById('feature-modal').style.display = 'flex';
}

// Handle unfinished features with event delegation
document.addEventListener('DOMContentLoaded', function() {
  // Use event delegation for trade buttons
  document.addEventListener('click', function(event) {
    let target = event.target;
    
    // Check if the clicked element or its parent is a trade button
    while (target && !(target.matches('.trade-btn') || target.matches('.forgot-password') || 
           target.matches('a[href*="profile"]') || target.matches('.social-btn'))) {
      target = target.parentElement;
      if (!target || target === document.body) break;
    }
    
    if (target) {
      if (target.matches('.trade-btn')) {
        event.preventDefault();
        event.stopPropagation();
        showFeatureAnnouncement('Seed Trading', 'Our trading platform is under development! We\'re working hard to implement this feature.');
      } else if (target.matches('.forgot-password')) {
        event.preventDefault();
        showFeatureAnnouncement('Password Reset', 'Our password reset functionality is coming soon. In the meantime, please contact support for assistance.');
      } else if (target.matches('a[href*="profile"]') && !target.href.includes('profile.html')) {
        event.preventDefault();
        showFeatureAnnouncement('User Profiles', 'User profile functionality is coming soon! We\'re working hard to implement this feature.');
      } else if (target.matches('.social-btn')) {
        event.preventDefault();
        showFeatureAnnouncement('Social Login', 'Social login integration is coming soon! We\'re working with providers to enable this feature.');
      }
    }
  });
  
  // Add styling to unimplemented features
  function styleUnimplementedFeatures() {
    // Style trade buttons
    document.querySelectorAll('.trade-btn').forEach(btn => {
      btn.classList.add('feature-coming-soon', 'disabled');
      
      // Only add tooltip if it doesn't already have one
      if (!btn.querySelector('.tooltip')) {
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = 'Trading feature coming soon';
        btn.appendChild(tooltip);
      }
    });
    
    // Style forgot password links
    document.querySelectorAll('.forgot-password').forEach(link => {
      link.classList.add('feature-coming-soon');
      
      if (!link.querySelector('.tooltip')) {
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = 'Reset feature coming soon';
        link.appendChild(tooltip);
      }
    });
    
    // Style social login buttons
    document.querySelectorAll('.social-btn').forEach(btn => {
      btn.classList.add('feature-coming-soon');
      
      if (!btn.querySelector('.tooltip')) {
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = 'Social login coming soon';
        btn.appendChild(tooltip);
      }
    });
  }
  
  // Initial styling
  styleUnimplementedFeatures();
  
  // Style after any DOM updates
  const observer = new MutationObserver(function(mutations) {
    styleUnimplementedFeatures();
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    const modal = document.getElementById('feature-modal');
    if (modal && event.target === modal) {
      modal.style.display = 'none';
    }
  });
});
