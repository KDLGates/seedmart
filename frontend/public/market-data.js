document.addEventListener('DOMContentLoaded', () => {
  // API configuration
  const API_URL = 'http://localhost:5000/api';
  let useMockData = true; // Toggle between mock data and API data
  
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
  
  // Generate random price for a seed
  function generateBasePrice() {
    return (Math.random() * 10 + 2).toFixed(2);
  }
  
  // Generate price history data with trends
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
    const volatility = Math.random() * 0.2 + 0.05; // How much the price fluctuates
    
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
  function generateDates(days = 7) {
    const timeframeFormat = {
      '1d': { hour: '2-digit', minute: '2-digit' },
      '1w': { month: 'short', day: 'numeric' },
      '1m': { month: 'short', day: 'numeric' },
      '3m': { month: 'short', day: 'numeric' },
      '1y': { month: 'short', year: 'numeric' }
    };
    
    // Map timeframe to number of days
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
  
  // Generate random volume data
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
  
  // Generate random volume
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

  // Fetch seeds from the API
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
      
      // Fetch data from API
      const response = await fetch(`${API_URL}/seeds`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const seedsData = await response.json();
      
      // Transform API data to match our market data format
      return seedsData.map(seed => {
        const basePrice = seed.price || generateBasePrice();
        const priceHistory = generatePriceHistory(basePrice);
        const volumeHistory = generateVolumeData();
        const currentPrice = priceHistory[priceHistory.length - 1].toFixed(2);
        const previousPrice = priceHistory[priceHistory.length - 2].toFixed(2);
        const change = (currentPrice - previousPrice).toFixed(2);
        const changePercent = ((change / previousPrice) * 100).toFixed(1);
        
        return {
          id: seed.id,
          name: seed.name,
          species: seed.species || 'Unknown species',
          basePrice,
          priceHistory,
          volumeHistory,
          currentPrice,
          previousPrice,
          change,
          changePercent,
          volume: seed.quantity || generateVolume(),
          description: seed.description
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
  
  // Initialize the chart
  function initChart(data) {
    const ctx = document.getElementById('seedChart').getContext('2d');
    const volumeCtx = document.getElementById('volumeChart').getContext('2d');
    
    // Get selected seeds for charting (top 5 by price)
    const selectedSeeds = [...data]
      .sort((a, b) => b.currentPrice - a.currentPrice)
      .slice(0, 3);
      
    const labels = generateDates();
    
    // Display selected seeds in chart title
    document.getElementById('current-seed').textContent = selectedSeeds.map(seed => seed.name).join(', ');
    
    // Update real-time price indicator
    if (selectedSeeds.length > 0) {
      document.getElementById('live-price').textContent = '$' + selectedSeeds[0].currentPrice;
      const changeText = selectedSeeds[0].change > 0 ? 
        `+${selectedSeeds[0].change} (${selectedSeeds[0].changePercent}%)` : 
        `${selectedSeeds[0].change} (${selectedSeeds[0].changePercent}%)`;
      const liveChange = document.getElementById('live-change');
      liveChange.textContent = changeText;
      liveChange.className = selectedSeeds[0].change > 0 ? 'price-up' : 'price-down';
    }
    
    // Prepare datasets for chart based on chart type
    const datasets = selectedSeeds.map(seed => {
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
        datasets: selectedSeeds.map(seed => {
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
  function generateSparkline(priceHistory, seedName, trend) {
    const sparklineCanvas = document.createElement('canvas');
    sparklineCanvas.className = 'sparkline';
    
    const hash = seedName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const r = (hash * 123) % 200 + 55;
    const g = (hash * 456) % 200 + 55;
    const b = (hash * 789) % 200 + 55;
    
    const sparkCtx = sparklineCanvas.getContext('2d');
    
    // Create mini line chart
    new Chart(sparkCtx, {
      type: 'line',
      data: {
        labels: Array(priceHistory.length).fill(''),
        datasets: [{
          data: priceHistory,
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
      sparklineCell.appendChild(generateSparkline(seed.priceHistory, seed.name, seed.change));
      
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
      
      // Update price history
      seed.priceHistory.push(parseFloat(newPrice));
      seed.priceHistory.shift();
      
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
});
