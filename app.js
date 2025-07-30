// 引入核心模块
const http = require('http');          // HTTP 服务器模块
const mysql = require('mysql2');       // MySQL 数据库驱动
const dotenv = require('dotenv');      // 环境变量加载器

// 加载.env文件中的环境变量
dotenv.config();

// 用于POST请求体解析的模块和变量
const { Buffer } = require('buffer');  // 二进制数据处理
let body = [];                         // 临时存储请求体数据

// 数据库连接配置（使用环境变量）
const db = mysql.createConnection({
    host: process.env.DB_HOST,        // 数据库地址
    port: process.env.DB_PORT,        // 数据库端口
    user: process.env.DB_USER,        // 登录用户名
    password: process.env.DB_PASSWORD,// 登录密码
    database: process.env.DB_NAME,    // 目标数据库
    timezone: '+08:00'
});

// 数据库连接状态处理
db.connect((err) => {
    if (err) {
        console.error('数据库连接失败:', err);
    } else {
        console.log('成功连接到数据库');
    }
});

// 创建HTTP服务器并配置请求处理
const server = http.createServer(async (req, res) => {
    // 交易数据提交接口
    if (req.method === 'POST' && req.url === '/trades') {
        try {
            const data = await parseRequest(req);    // 解析请求体
            validateTradeData(data);                 // 验证数据完整性
            const result = await saveToDatabase(data); // 持久化存储
            const getResult = await getTradesFromDB();
            // 成功响应（201 Created）
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ data: getResult }));
        } catch (error) {
            console.error('交易数据处理失败:', error.message);
            // 错误响应（400 Bad Request）
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    } 
    // 新增交易记录查询接口
    else if (req.method === 'GET' && req.url === '/trades') {
        try {
            const trades = await getTradesFromDB();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(trades));
        } catch (error) {
            console.error('查询失败:', error.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '服务器内部错误' }));
        }
    } else {
        // 默认路由响应
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('hello world');
    }
});



//示例查询（测试用）
db.query('SELECT * FROM helloworld', (err, results) => {
    if (err) {
        console.error('查询失败:', err);
    } else {
        console.log('查询结果:', results);
    }
});

// 启动HTTP服务器
const PORT = 3001;  
server.listen(PORT, () => {
    console.log(`服务器正在运行在端口 ${PORT}`);
});

// 以下是功能函数模块 -------------------------

/**
 * 解析HTTP请求体（JSON格式）
 * 使用Promise封装异步流式数据处理
 */
// 这个函数接收req参数，即HTTP请求对象
function parseRequest(req) {
    return new Promise((resolve, reject) => {
        let body = []; // 将 body 改为局部变量（关键修复）
        
        req.on('data', chunk => body.push(chunk));
        
        req.on('end', () => {
            try {
                const data = JSON.parse(Buffer.concat(body).toString());
                resolve(data);
            } catch (error) {
                reject(new Error('无效的JSON格式'));
            }
        });
    });
}

/**
 * 交易数据验证逻辑
 * 1. 检查必填字段
 * 2. 自动计算总金额
 */
function validateTradeData(data) {
    // 必需字段检查
    const requiredFields = ['ticker', 'trade_time', 'price', 'quantity'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
        throw new Error(`缺少必填字段: ${missingFields.join(', ')}`);
    }
    
    // 计算总金额（保留两位小数）
    data.total_amount = (data.price * data.quantity).toFixed(2);
}

/**
 * 数据库写入操作
 * 使用预处理语句防止SQL注入
 */
async function saveToDatabase(data) {
    const sql = `INSERT INTO trades 
        (ticker, trade_time, price, quantity, total_amount)
        VALUES (?, ?, ?, ?, ?)`;  // 参数化查询
    
    const values = [
        data.ticker,
        data.trade_time,  // 转换时间格式
        data.price,
        data.quantity,
        data.total_amount
    ];
    
    const if_forward_ok = await forwardData2StockService(data);
    if (!if_forward_ok) {
        console.log("error --> if_forward_not_ok");
        throw new Error('数据转发失败');
    } else {
        console.log('数据转发成功');
    }

    // 将回调函数包装为Promise
    return new Promise((resolve, reject) => {
        db.query(sql, values, (err, results) => {
            if (err) reject(new Error('数据库写入失败'));
            resolve(results);
        });
    });
}



/**
 * 转发持仓数据到指定服务
 * 使用HTTP模块发送POST请求
 */
async function forwardData2StockService(data) {
    try {
        if (!data || typeof data !== 'object') {
            throw new Error('无效的JSON结构体');
        }

        // 配置股票服务地址（根据实际服务地址修改）
        const options = {
            hostname: process.env.DB_HOST,
            port: 3000,
            path: '/stocks/positions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Connection': 'close'
            }
        };

        // 添加调试日志
        console.log('正在转发数据到:', JSON.stringify(options));
        console.log('发送数据:', JSON.stringify(data, null, 2));

        const postData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(postData);

        return await new Promise((resolve) => {
            const req = http.request(options, (res) => {
                let responseBody = '';
                console.log(`收到响应状态码: ${res.statusCode}`);
                
                res.setEncoding('utf8');
                res.on('data', (chunk) => responseBody += chunk);
                res.on('end', () => {
                    console.log('响应内容:', responseBody);
                    const success = res.statusCode >= 200 && res.statusCode < 300;
                    resolve(success);
                });
            });

            req.on('error', (e) => {
                console.error('转发请求失败详情:', e.stack); // 显示完整错误堆栈
                resolve(false);
            });
            
            req.write(postData);
            req.end();
        });
    } catch (error) {
        console.error('数据处理异常:', error.stack);
        return false;
    }
}

/**
 * 新增：从数据库获取所有交易记录
 */
async function getTradesFromDB() {
    const sql = `SELECT 
        *
    FROM trades
    ORDER BY trade_time DESC`;

    return new Promise((resolve, reject) => {
        db.query(sql, (err, results) => {
            if (err) {
                reject(new Error('数据库查询失败'));
            } else {
                // 在结果外层包裹 data 字段
                resolve({
                    data: results.map(row => ({
                        ...row,
                        trade_time: new Date(row.trade_time.getTime() + (8 * 60 * 60 * 1000))
                            .toISOString().replace('T', ' ').replace(/\..+/, '')
                    }))
                });
            }
        });
    });
}







