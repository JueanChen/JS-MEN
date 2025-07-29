import yfinance as yf
import sqlite3
import pandas as pd

# Define the stock tickers and download parameters
tickers = ['AAPL', 'NVDA', 'MSFT']
period = '5d'
interval = '5m'
db_file = 'stock_data.db'

print(f"Downloading data for {', '.join(tickers)}...")

# Download the data for all tickers at once
# yfinance returns a pandas DataFrame with a multi-level column index
try:
    data = yf.download(tickers=tickers, period=period, interval=interval)
    
    if data.empty:
        print("No data downloaded. Check ticker symbols or connection.")
    else:
        # Connect to the SQLite database (this will create the file if it doesn't exist)
        conn = sqlite3.connect(db_file)
        print(f"Successfully connected to {db_file}")

        # yfinance returns data with a multi-level column structure: (Metric, Ticker)
        # We'll loop through each ticker and save its data to a separate table
        for ticker in tickers:
            # Select the data for the current ticker
            # The .xs() method extracts a cross-section from the DataFrame
            ticker_df = data.xs(ticker, level='Ticker', axis=1)

            # Remove rows with all NaN values, which can occur for non-trading times
            ticker_df.dropna(how='all', inplace=True)

            if not ticker_df.empty:
                # Save the ticker's DataFrame to a SQL table named after the ticker
                # if_exists='replace' will overwrite the table if it already exists
                print(f"Saving data for {ticker}...")
                ticker_df.to_sql(ticker, conn, if_exists='replace', index=True)
                print(f"Data for {ticker} saved to table '{ticker}'.")
            else:
                print(f"No data to save for {ticker} for the specified period.")

        # Close the database connection
        conn.close()
        print(f"Database connection closed. Process complete.")

except Exception as e:
    print(f"An error occurred: {e}")

