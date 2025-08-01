import sqlite3
import json

tickers = ['AAPL', 'GOOG', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC']
table_name = '_5D_5M'

# 连接到数据库
conn = sqlite3.connect('stock_data.db')
cursor = conn.cursor()

# 存储结果的列表
result_data = []

# 遍历每个ticker
for ticker in tickers:
    full_table_name = ticker + table_name
    try:
        # 查询open_price和volume列的所有值
        cursor.execute(f"SELECT open_price, volume FROM {full_table_name}")
        rows = cursor.fetchall()
        open_prices = [row[0] for row in rows]
        volumes = [row[1] for row in rows]
        
        # 添加到结果中
        result_data.append({
            "ticker": ticker,
            "open_prices": open_prices,
            "volumes": volumes
        })
        
        print(f"成功提取 {ticker} 的 {len(open_prices)} 条open_price数据和 {len(volumes)} 条volume数据")
        
    except sqlite3.Error as e:
        print(f"提取 {ticker} 数据时出错: {e}")

# 关闭数据库连接
conn.close()

# 保存为JSON文件
output_file = 'current_price_data.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(result_data, f, indent=2, ensure_ascii=False)

print(f"数据已保存到 {output_file}")

