# SeedMart

SeedMart is a CRUD application that connects to a remote database server using a Python back end and a Node.js front end. This project is designed to demonstrate the integration of a Flask API with a React front end, allowing users to perform Create, Read, Update, and Delete operations on data.

## Project Structure

```
seedmart
├── backend                # Python back end
│   ├── app.py            # Entry point for the Flask application
│   ├── config.py         # Configuration settings
│   ├── models             # Data models
│   │   ├── __init__.py
│   │   └── models.py
│   ├── routes             # API routes
│   │   ├── __init__.py
│   │   └── api.py
│   ├── services           # Database services
│   │   ├── __init__.py
│   │   └── database.py
│   ├── requirements.txt   # Python dependencies
│   └── tests              # Unit tests
│       ├── __init__.py
│       └── test_api.py
├── frontend               # React front end
│   ├── public
│   │   ├── index.html     # Main HTML file
│   │   └── style.css      # Styles for the front end
│   ├── src
│   │   ├── api
│   │   │   └── index.js   # API calls
│   │   ├── components
│   │   │   └── App.js     # Main React component
│   │   └── index.js       # Entry point for the React application
│   ├── package.json       # npm configuration
│   └── .env               # Environment variables
├── .gitignore             # Files to ignore in version control
├── docker-compose.yml      # Docker configuration
└── README.md              # Project documentation
```

## Getting Started

### Prerequisites

- Python 3.x
- Node.js and npm
- Docker (optional, for containerization)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd seedmart
   ```

2. Set up the back end:
   - Navigate to the `backend` directory:
     ```
     cd backend
     ```
   - Install the required Python packages:
     ```
     pip install -r requirements.txt
     ```

3. Set up the front end:
   - Navigate to the `frontend` directory:
     ```
     cd ../frontend
     ```
   - Install the required Node.js packages:
     ```
     npm install
     ```

### Running the Application

- To run the back end, navigate to the `backend` directory and execute:
  ```
  python app.py
  ```

- To run the front end, navigate to the `frontend` directory and execute:
  ```
  npm start
  ```

### API Endpoints

The back end exposes several API endpoints for CRUD operations. Refer to the `api.py` file in the `backend/routes` directory for detailed information on available endpoints.

### Testing

To run the unit tests for the back end, navigate to the `backend` directory and execute:
```
pytest
```

### License

This project is licensed under the MIT License. See the LICENSE file for more details.