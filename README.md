# JS-MEN

A stock data management and trading system project.

## Project Structure

```
JS-MEN/
├── src/                          # Source code directory
│   ├── controllers/              # Controllers (route handlers)
│   ├── services/                 # Business logic services
│   │   └── realtime-data-manager.js
│   ├── utils/                    # Utility functions
│   └── server.js                 # Main server file
├── public/                       # Static assets
│   ├── html/                     # HTML pages
│   │   ├── positions.html
│   │   ├── stocks.html
│   │   ├── trades.html
│   │   └── test_trade_functionality.html
│   └── js/                       # Frontend JavaScript
│       ├── Positions.js
│       ├── trade.js
│       └── i18n.js
├── tests/                        # Test files
│   └── positions.test.js
├── scripts/                      # Script files
│   ├── yfinanceTEST.py
│   ├── db2mysql.py
│   └── test.py
├── data/                         # Data files
│   ├── current_data.json
│   ├── stocks.json
│   └── stock_data.db
├── config/                       # Configuration files
│   └── AI_API_CONFIG.md
├── .env                          # Environment variables
├── .test.env                     # Test environment variables
├── package.json                  # Project dependencies
└── README.md                     # Project documentation
```

## Features

- Stock data fetching and storage
- Real-time data management
- Trading functionality
- Multi-language support
- Database integration (SQLite, MySQL)

## Installation and Setup

```bash
# Install dependencies
npm install

# Run the server
node src/server.js
```

## Technology Stack

- **Backend**: Node.js, Express
- **Frontend**: HTML, JavaScript
- **Database**: SQLite, MySQL
- **Data Processing**: Python (yfinance, pandas)
- **Others**: OpenAI API, CORS
