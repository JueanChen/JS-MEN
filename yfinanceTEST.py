import yfinance as yf
import sqlite3
import pandas as pd

# Define the stock tickers and download parameters
tickers = ['AAPL', 'NVDA', 'MSFT']
period = '5d'
interval = '5m'
db_file = 'stock_data.db'
table_name = 'stocks_data'

print(f"Downloading data for {', '.join(tickers)}...")

# Download the data for all tickers
try:
    data = yf.download(tickers=tickers, period=period, interval=interval)
    
    if data.empty:
        print("No data downloaded. Check ticker symbols or connection.")
    else:
        # --- Data Transformation ---
        # The downloaded data has a multi-level column index (e.g., ('Open', 'AAPL')).
        # We stack the 'Ticker' level from columns to rows to create a single 'Ticker' column.
        # This reshapes the DataFrame from wide to long format.
        data_stacked = data.stack(level='Ticker')

        # Reset the index to turn the multi-level index (Datetime, Ticker) into columns.
        consolidated_df = data_stacked.reset_index()
        
        # --- Database Operation ---
        # Connect to the SQLite database
        conn = sqlite3.connect(db_file)
        print(f"Successfully connected to {db_file}")

        # Save the single, consolidated DataFrame to one SQL table
        # if_exists='replace' will overwrite the table if it already exists
        # index=False prevents pandas from writing the DataFrame index as a column
        print(f"Saving all data to table '{table_name}'...")
        consolidated_df.to_sql(table_name, conn, if_exists='replace', index=False)
        print(f"All data successfully saved.")

        # Close the database connection
        conn.close()
        print("Database connection closed.")

except Exception as e:
    print(f"An error occurred: {e}")