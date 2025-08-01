import sqlite3
import pymysql

SQLITE_DB = 'stock_data.db'
MYSQL_HOST = 'localhost'
MYSQL_USER = 'root'
MYSQL_PASSWORD = ''
MYSQL_DB = 'stock_data_mysql'

def get_sqlite_tables(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    return [row[0] for row in cursor.fetchall()]

def get_table_schema(conn, table):
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA table_info({table})")
    columns = []
    for col in cursor.fetchall():
        # col[1]: name, col[2]: type
        columns.append((col[1], col[2]))
    return columns

def fetch_table_data(conn, table):
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM {table}")
    return cursor.fetchall()

def main():
    # 连接sqlite
    sqlite_conn = sqlite3.connect(SQLITE_DB)
    tables = get_sqlite_tables(sqlite_conn)

    # 连接mysql
    mysql_conn = pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        charset='utf8mb4'
    )
    mysql_cursor = mysql_conn.cursor()
    # 创建数据库
    mysql_cursor.execute(f"CREATE DATABASE IF NOT EXISTS {MYSQL_DB}")
    mysql_cursor.execute(f"USE {MYSQL_DB}")

    for table in tables:
        columns = get_table_schema(sqlite_conn, table)
        col_defs = ', '.join([f"`{name}` {typ.replace('INTEGER','INT').replace('REAL','FLOAT').replace('TEXT','VARCHAR(255)')}" for name, typ in columns])
        # 创建表
        mysql_cursor.execute(f"DROP TABLE IF EXISTS `{table}`")
        mysql_cursor.execute(f"CREATE TABLE `{table}` ({col_defs})")
        # 插入数据
        rows = fetch_table_data(sqlite_conn, table)
        if rows:
            placeholders = ','.join(['%s'] * len(columns))
            insert_sql = f"INSERT INTO `{table}` VALUES ({placeholders})"
            mysql_cursor.executemany(insert_sql, rows)
    mysql_conn.commit()
    mysql_conn.close()
    sqlite_conn.close()
    print("All tables and data migrated from sqlite to mysql.")

if __name__ == '__main__':
    main()
