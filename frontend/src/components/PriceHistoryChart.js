import { fetchPriceHistory } from '../services/api';

const PriceHistoryChart = ({ productId }) => {
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPriceHistory = async () => {
      try {
        setLoading(true);
        const data = await fetchPriceHistory(productId);
        
        // Format data for chart.js
        const chartData = {
          labels: data.map(item => item.date),
          datasets: [
            {
              label: 'Price History (USD)',
              data: data.map(item => item.price),
              fill: false,
              backgroundColor: 'rgb(75, 192, 192)',
              borderColor: 'rgba(75, 192, 192, 0.8)',
            },
          ],
        };
        
        setPriceData(chartData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch price history:', err);
        setError('Failed to load price history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadPriceHistory();
    }
  }, [productId]);

  if (loading) return <div>Loading price history...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!priceData) return <div>No price history available</div>;

  return (
    <div className="price-history-chart">
      <h3>Price History</h3>
      <Line 
        data={priceData}
        options={{
          responsive: true,
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                callback: (value) => `$${value.toFixed(2)}`
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => `$${context.parsed.y.toFixed(2)}`
              }
            }
          }
        }}
      />
    </div>
  );
};

export default PriceHistoryChart;
