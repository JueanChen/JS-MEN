import sqlite3

def round_prices_in_db(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    # 将四个字段的值都更新为保留2位小数
    cursor.execute("""
        UPDATE all_stocks_data
        SET
            open_price = ROUND(open_price, 2),
            close_price = ROUND(close_price, 2),
            high_price = ROUND(high_price, 2),
            low_price = ROUND(low_price, 2)
    """)
    conn.commit()
    conn.close()

# 用法示例
round_prices_in_db('stock_data.db')