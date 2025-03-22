document.addEventListener('DOMContentLoaded', () => {
  const seedList = document.getElementById('seed-list');
  const seedForm = document.getElementById('seed-form');
  
  const API_URL = 'http://localhost:5000/api';
  
  // Fetch and display seeds
  async function fetchSeeds() {
    try {
      const response = await fetch(`${API_URL}/seeds`);
      const seeds = await response.json();
      
      if (seeds.length === 0) {
        seedList.innerHTML = '<p>No seeds available. Add some below!</p>';
        return;
      }
      
      let html = '';
      seeds.forEach(seed => {
        html += `
          <div class="seed-card" data-id="${seed.id}">
            <h3>${seed.name}</h3>
            <p><strong>Species:</strong> ${seed.species || 'N/A'}</p>
            <p><strong>Quantity:</strong> ${seed.quantity}</p>
            <p><strong>Price:</strong> $${seed.price?.toFixed(2) || 'N/A'}</p>
            <p><strong>Description:</strong> ${seed.description || 'No description'}</p>
            <div class="actions">
              <button class="edit-btn" onclick="editSeed(${seed.id})">Edit</button>
              <button class="delete-btn" onclick="deleteSeed(${seed.id})">Delete</button>
            </div>
          </div>
        `;
      });
      
      seedList.innerHTML = html;
    } catch (error) {
      seedList.innerHTML = '<p>Error loading seeds. Is the API server running?</p>';
      console.error('Error fetching seeds:', error);
    }
  }
  
  // Add new seed
  seedForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      name: document.getElementById('name').value,
      species: document.getElementById('species').value,
      quantity: parseInt(document.getElementById('quantity').value) || 0,
      price: parseFloat(document.getElementById('price').value) || 0,
      description: document.getElementById('description').value
    };
    
    try {
      const response = await fetch(`${API_URL}/seeds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        seedForm.reset();
        fetchSeeds();
      } else {
        alert('Error creating seed');
      }
    } catch (error) {
      console.error('Error creating seed:', error);
      alert('Error creating seed');
    }
  });
  
  // Load seeds when page loads
  fetchSeeds();
  
  // Make these functions global so the onclick handlers can access them
  window.editSeed = async (id) => {
    // In a real app, you'd implement editing here
    alert(`Editing seed ${id} (not implemented in this demo)`);
  };
  
  window.deleteSeed = async (id) => {
    if (confirm('Are you sure you want to delete this seed?')) {
      try {
        const response = await fetch(`${API_URL}/seeds/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          fetchSeeds();
        } else {
          alert('Error deleting seed');
        }
      } catch (error) {
        console.error('Error deleting seed:', error);
        alert('Error deleting seed');
      }
    }
  };
});