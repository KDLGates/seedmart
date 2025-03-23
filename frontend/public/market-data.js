document.addEventListener('DOMContentLoaded', () => {
  // API configuration
  const API_URL = 'http://localhost:5000/api';
  let marketData = [];
  let selectedSeed = null;
  let chartType = 'line';
  let timeframe = '1w';
  let autoUpdateEnabled = true;
  let chart;
  let volumeChart;

  // Set up server time update
  function updateServerTime() {
    const serverTimeElement = document.getElementById('server-time');
    const now = new Date();
    serverTimeElement.textContent = `Server time: ${now.toLocaleTimeString()}`;
  }

  setInterval(updateServerTime, 1000);
  updateServerTime();

  // Fetch market data from API
  async function fetchMarketData() {
    try {
      const response = await fetch(`${API_URL}/market/summary`);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      const data = await response.json();
      marketData = data.seeds;
      updateMarketStats(data.marketStats);
      return marketData;
    } catch (error) {
      console.error('Error fetching market data:', error);
      showErrorMessage('Error loading market data. Please try again later.');
      return [];
    }
  }

  // Update market statistics display
  function updateMarketStats(stats) {
    document.getElementById('market-volume').textContent = '$' + stats.totalVolume.toLocaleString();
    document.getElementById('market-cap').textContent = '$' + stats.marketCap.toLocaleString();
    document.getElementById('seed-count').textContent = stats.seedCount;
  }

  // Fetch price history for a specific seed
  async function fetchPriceHistory(seedId) {
    try {
      document.getElementById('seedChart').style.opacity = '0.5';
      document.getElementById('volumeChart').style.opacity = '0.5';
      
      const response = await fetch(`${API_URL}/seeds/${seedId}/prices?timeframe=${timeframe}`);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const priceData = await response.json();
      return {
        priceHistory: priceData.map(p => p.price),
        volumeHistory: priceData.map(p => p.volume),
        rawData: priceData
      };
    } catch (error) {
      console.error(`Error fetching price history for seed ${seedId}:`, error);
      return { priceHistory: [], volumeHistory: [], rawData: [] };
    } finally {
      document.getElementById('seedChart').style.opacity = '1';
      document.getElementById('volumeChart').style.opacity = '1';
    }
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
    
    if (priceData.length > 0 && priceData[0].recorded_at) {
      return priceData.map(item => {
        const date = new Date(item.recorded_at);
        return date.toLocaleDateString('en-US', timeframeFormat[timeframe] || { month: 'short', day: 'numeric' });
      });
    }
    
    return [];
  }

  // Initialize chart with seed data
  async function initChart(seeds) {
    const ctx = document.getElementById('seedChart').getContext('2d');
    const volumeCtx = document.getElementById('volumeChart').getContext('2d');
    
    let seedsToShow = [...seeds];
    if (seedsToShow.length > 3) {
      seedsToShow = seedsToShow
        .sort((a, b) => b.currentPrice - a.currentPrice)
        .slice(0, 3);
    }
    
    // Fetch price history for each seed
    for (let seed of seedsToShow) {
      const historyData = await fetchPriceHistory(seed.id);
      seed.priceHistory = historyData.priceHistory;
      seed.volumeHistory = historyData.volumeHistory;
      seed.rawPriceData = historyData.rawData;
    }
    
    const labels = seedsToShow.length > 0 && seedsToShow[0].rawPriceData ? 
      generateDates(seedsToShow[0].rawPriceData) : [];
    
    document.getElementById('current-seed').textContent = seedsToShow.map(seed => seed.name).join(', ');
    
    if (seedsToShow.length > 0) {
      document.getElementById('live-price').textContent = '$' + seedsToShow[0].currentPrice;
      const changeText = seedsToShow[0].change > 0 ? 
        `+${seedsToShow[0].change} (${seedsToShow[0].changePercent}%)` : 
        `${seedsToShow[0].change} (${seedsToShow[0].changePercent}%)`;
      const liveChange = document.getElementById('live-change');
      liveChange.textContent = changeText;
      liveChange.className = seedsToShow[0].change > 0 ? 'price-up' : 'price-down';
    }

    // Create datasets for the chart
    const datasets = seedsToShow.map(seed => {
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

    // Destroy existing charts if they exist
    if (chart) chart.destroy();
    if (volumeChart) volumeChart.destroy();

    // Create new charts
    Chart.defaults.color = '#787b86';
    Chart.defaults.borderColor = '#363a45';

    chart = new Chart(ctx, {
      type: chartType,
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        animation: { duration: 800, easing: 'easeOutQuart' },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', size: 12 },
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
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
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

    // Create volume chart
    volumeChart = new Chart(volumeCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: seedsToShow.map(seed => {
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
        animation: { duration: 800, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
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
          x: { display: false },
          y: { display: false, beginAtZero: true }
        }
      }
    });
  }

  // Generate sparkline chart for table
  async function generateSparkline(seed, trend) {
    const sparklineCanvas = document.createElement('canvas');
    sparklineCanvas.className = 'sparkline';
    sparklineCanvas.width = 120;
    sparklineCanvas.height = 40;
    sparklineCanvas.style.width = '120px';
    sparklineCanvas.style.height = '40px';

    const historyData = await fetchPriceHistory(seed.id);
    const priceData = historyData.priceHistory;

    if (priceData.length === 0) {
      const noDataDiv = document.createElement('div');
      noDataDiv.className = 'spark-loading';
      noDataDiv.textContent = 'No data';
      return noDataDiv;
    }

    const normalizedData = normalizeChartData(priceData);
    const sparkCtx = sparklineCanvas.getContext('2d');

    new Chart(sparkCtx, {
      type: 'line',
      data: {
        labels: Array(normalizedData.length).fill(''),
        datasets: [{
          data: normalizedData,
          borderColor: trend > 0 ? '#26a69a' : '#ef5350',
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          tension: 0.3
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: { display: false },
          y: {
            display: false,
            min: 0,
            max: 100,
          }
        }
      }
    });

    return sparklineCanvas;
  }

  // Helper function to normalize chart data
  function normalizeChartData(data) {
    if (!data || data.length === 0) return [];
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    
    if (min === max) return data.map(() => 50);
    return data.map(value => ((value - min) / (max - min)) * 100);
  }

  // Update trending lists
  function updateTrendingLists(data) {
    const trendingUp = document.getElementById('trending-up');
    const trendingDown = document.getElementById('trending-down');
    
    const sortedByChange = [...data].sort((a, b) => b.changePercent - a.changePercent);
    
    trendingUp.innerHTML = '';
    trendingDown.innerHTML = '';
    
    sortedByChange.slice(0, 5).forEach(seed => {
      const li = document.createElement('li');
      li.className = 'up';
      li.innerHTML = `${seed.name} <span>+${seed.changePercent}%</span>`;
      trendingUp.appendChild(li);
      
      li.addEventListener('click', () => {
        document.querySelectorAll('.trend-list li').forEach(item => item.classList.remove('selected'));
        li.classList.add('selected');
        selectedSeed = seed;
        initChart([seed]);
      });
    });
    
    sortedByChange.slice(-5).reverse().forEach(seed => {
      const li = document.createElement('li');
      li.className = 'down';
      li.innerHTML = `${seed.name} <span>${seed.changePercent}%</span>`;
      trendingDown.appendChild(li);
      
      li.addEventListener('click', () => {
        document.querySelectorAll('.trend-list li').forEach(item => item.classList.remove('selected'));
        li.classList.add('selected');
        selectedSeed = seed;
        initChart([seed]);
      });
    });
  }

  // Update market table
  async function updateMarketTable(data) {
    const tableBody = document.getElementById('market-data');
    const sortBy = document.getElementById('sort-by').value;
    const searchTerm = document.getElementById('search-seeds').value.toLowerCase();
    
    let filteredData = searchTerm ? 
      data.filter(seed => seed.name.toLowerCase().includes(searchTerm) || 
                          seed.species.toLowerCase().includes(searchTerm)) : 
      data;
    
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
    
    for (const seed of filteredData) {
      const row = document.createElement('tr');
      
      if (selectedSeed && selectedSeed.name === seed.name) {
        row.classList.add('active');
      }
      
      const priceChangeClass = seed.change > 0 ? 'price-up' : 'price-down';
      const changeSymbol = seed.change > 0 ? '+' : '';
      
      const sparklineCell = document.createElement('td');
      sparklineCell.appendChild(await generateSparkline(seed, seed.change));
      
      row.innerHTML = `
        <td>${seed.name}</td>
        <td>${seed.species}</td>
        <td>$${seed.currentPrice}</td>
        <td class="${priceChangeClass}">${changeSymbol}${seed.change} (${changeSymbol}${seed.changePercent}%)</td>
        <td>${seed.volume.toLocaleString()}</td>
        <td><button class="trade-btn">Trade</button></td>
      `;
      
      row.insertBefore(sparklineCell, row.children[5]);
      
      row.addEventListener('click', (e) => {
        if (e.target.classList.contains('trade-btn')) return;
        
        document.querySelectorAll('#market-data tr').forEach(row => row.classList.remove('active'));
        row.classList.add('active');
        
        document.querySelectorAll('.trend-list li').forEach(item => item.classList.remove('selected'));
        
        selectedSeed = seed;
        initChart([seed]);
      });
      
      tableBody.appendChild(row);
    }
  }

  // Initialize market view
  async function initMarketView() {
    const data = await fetchMarketData();
    if (data.length > 0) {
      initChart(data);
      updateTrendingLists(data);
      await updateMarketTable(data);
      initializeTradeButtons();
    }
  }

  // Auto-update market data
  let updateInterval;
  function startAutoUpdate() {
    if (updateInterval) clearInterval(updateInterval);
    
    updateInterval = setInterval(async () => {
      if (!autoUpdateEnabled) return;
      
      const data = await fetchMarketData();
      if (data.length > 0) {
        if (selectedSeed) {
          const updatedSeed = data.find(s => s.id === selectedSeed.id);
          if (updatedSeed) {
            selectedSeed = updatedSeed;
            initChart([updatedSeed]);
          }
        }
        updateTrendingLists(data);
        await updateMarketTable(data);
      }
    }, 30000); // Update every 30 seconds to match backend
  }

  // Event listeners
  document.getElementById('timeframe').addEventListener('change', (e) => {
    timeframe = e.target.value;
    if (selectedSeed) {
      initChart([selectedSeed]);
    } else {
      initChart(marketData);
    }
  });

  const chartTypeButtons = document.querySelectorAll('.chart-type-btn');
  chartTypeButtons.forEach(button => {
    button.addEventListener('click', () => {
      chartTypeButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      chartType = button.getAttribute('data-type');
      if (selectedSeed) {
        initChart([selectedSeed]);
      } else {
        initChart(marketData);
      }
    });
  });

  document.getElementById('search-seeds').addEventListener('input', () => {
    updateMarketTable(marketData);
  });

  document.getElementById('sort-by').addEventListener('change', () => {
    updateMarketTable(marketData);
  });

  document.getElementById('refresh-btn').addEventListener('click', () => {
    if (!autoUpdateEnabled) {
      initMarketView();
    }
  });

  document.getElementById('refresh-btn').addEventListener('dblclick', () => {
    autoUpdateEnabled = !autoUpdateEnabled;
    const refreshBtn = document.getElementById('refresh-btn');
    
    if (autoUpdateEnabled) {
      refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Auto';
      startAutoUpdate();
    } else {
      refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    }
  });

  // Show error message
  function showErrorMessage(message) {
    const marketDataTable = document.getElementById('market-data');
    if (marketDataTable) {
      marketDataTable.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="error-message">${message}</div>
          </td>
        </tr>
      `;
    }
  }

  // Initialize
  initMarketView();
  startAutoUpdate();
});
