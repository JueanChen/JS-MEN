const http = require('http');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const Positions = require('../Positions.js');

// 加载测试环境变量
dotenv.config({ path: '.test.env' });

describe('股票持仓API测试', () => {
  let connection;
  let server;

  beforeAll(async () => {
    // 创建测试数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // 启动服务器
    server = http.createServer(Positions.handleRequest);
    await new Promise(resolve => server.listen(3000, resolve));
  });

  afterEach(async () => {
    // 清空测试数据
    await connection.query('DELETE FROM positions');
  });

  afterAll(async () => {
    await connection.end();
    await new Promise(resolve => server.close(resolve));
  });

  test('GET /stocks/summary 应返回初始资产数据', async () => {
    const response = await sendRequest('GET', '/stocks/summary');
    expect(response.statusCode).toBe(200);
    expect(response.data).toMatchObject({
      cashflow: 1000000,
      totalAssets: 1000000,
      totalMarketValue: 0
    });
  });

  test('POST /stocks/positions 应成功创建新持仓', async () => {
    const payload = {
      ticker: 'AAPL',
      trade_time: '2023-01-01',
      price: 150,
      quantity: 100
    };

    const response = await sendRequest('POST', '/stocks/positions', payload);
    expect(response.statusCode).toBe(201);
    
    const [positions] = await connection.query('SELECT * FROM positions');
    expect(positions[0].stock_name).toBe('AAPL');
    expect(positions[0].quantity).toBe(100);
  });

  test('加仓操作应更新平均成本', async () => {
    // 初始持仓
    await connection.query(`
      INSERT INTO positions 
      (stock_name, stock_cost, stock_current_price, quantity, daily_profit_loss, position_percentage)
      VALUES ('AAPL', 150, 150, 100, 0, 0.1)
    `);

    const payload = {
      ticker: 'AAPL',
      trade_time: '2023-01-02',
      price: 160,
      quantity: 50
    };

    const response = await sendRequest('POST', '/stocks/positions', payload);
    expect(response.statusCode).toBe(200);

    const [positions] = await connection.query('SELECT * FROM positions');
    expect(positions[0].stock_cost).toBeCloseTo((150*100 + 160*50)/150, 2);
  });
});

// 辅助函数发送HTTP请求
function sendRequest(method, path, data = null) {
  return new Promise((resolve) => {
    const req = http.request({
      host: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    }, async (res) => {
      let body = [];
      res.on('data', chunk => body.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: body.length ? JSON.parse(Buffer.concat(body)) : null
        });
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}
