# Project Setup Guide

## Environment Variables Configuration

Create a `.env` file in the root directory with the following configuration:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=stock_data

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key

# Other Configuration
CORS_ORIGIN=http://localhost:3000
```

## Database Setup

### SQLite (Default)
The project uses SQLite database by default, with the data file located at `data/stock_data.db`

### MySQL (Optional)
To use MySQL, configure the database connection information in the `.env` file.

## Python Script Dependencies

To run Python scripts, install the following dependencies:

```bash
pip install yfinance pandas sqlalchemy
```

## API Endpoints

- `/api/stocks` - Get stock data
- `/api/positions` - Get position information
- `/api/trades` - Get trading records
- `/api/realtime` - Real-time data updates

## Development Mode

```bash
npm run dev
```

## Production Mode

```bash
npm start
```
