import yfinance as yf
import pandas as pd
from sqlalchemy import create_engine, DECIMAL

# Define the stock tickers and download parameters
tickers = ['AAPL', 'GOOG', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC']
period = '5d'
interval = '1mo'
db_file = 'stock_data.db'

for ticker in tickers:
    table_name = ticker + '_MK'
    print(f"Downloading data for {ticker}")

    # Download the data for all tickers
    try:
        data = yf.download(tickers=ticker, start="2009-12-29", end="2025-07-29", interval=interval)
        
        if data.empty:
            print("No data downloaded. Check ticker symbols or connection.")
        else:
            # --- 1. Data Transformation ---
            # Stack the 'Ticker' level from columns to create a 'Ticker' column
            data_stacked = data.stack(level='Ticker')
            consolidated_df = data_stacked.reset_index()

            # --- 2. Column Renaming and Formatting ---
            # Define a mapping for renaming columns
            column_rename_map = {
                'Date': 'time_stamp',
                'Open': 'open_price',
                'High': 'high_price',
                'Low': 'low_price',
                'Close': 'close_price',
                'Volume': 'volume'
            }
            consolidated_df.rename(columns=column_rename_map, inplace=True)
            
            # Format the time_stamp column to 'YYYY-MM-DD HH:MM:SS' string format
            consolidated_df['time_stamp'] = consolidated_df['time_stamp'].dt.strftime('%Y-%m-%d')

            # Select only the columns we need, dropping 'Adj Close'
            final_df = consolidated_df[['time_stamp', 'open_price', 'high_price', 'low_price', 'close_price', 'volume']]

            # --- 3. Database Operation ---
            # Create a SQLAlchemy engine for more control over data types
            engine = create_engine(f'sqlite:///{db_file}')
            
            # Define the desired data types for SQL columns
            # This ensures prices are stored with fixed precision
            dtype_mapping = {
                'open_price': DECIMAL(18, 2),
                'high_price': DECIMAL(18, 2),
                'low_price': DECIMAL(18, 2),
                'close_price': DECIMAL(18, 2)
            }

            # Save the final DataFrame to the SQL table
            print(f"Saving formatted data to table '{table_name}'...")
            final_df.to_sql(
                table_name, 
                con=engine, 
                if_exists='replace', 
                index=False, 
                dtype=dtype_mapping
            )
            print("All data successfully saved.")


    except Exception as e:
        print(f"An error occurred: {e}")