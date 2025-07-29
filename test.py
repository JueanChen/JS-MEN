import sqlite3

tickers = ['AAPL', 'GOOG', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC']
def round_prices_in_db(db_path, ticker):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    # 将四个字段的值都更新为保留2位小数
    cursor.execute(f"""
        UPDATE {ticker}
        SET
            open_price = ROUND(open_price, 2),
            close_price = ROUND(close_price, 2),
            high_price = ROUND(high_price, 2),
            low_price = ROUND(low_price, 2)
    """)
    conn.commit()
    conn.close()

# 用法示例
for ticker in tickers:
    print(f"Rounding prices for {ticker} in database...")
    round_prices_in_db('stock_data.db', ticker)