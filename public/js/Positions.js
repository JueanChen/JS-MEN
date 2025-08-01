const http = require('http');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const { promisify } = require('util');
const url = require('url');
const querystring = require('querystring');

// 加载环境变量
dotenv.config();

// 创建数据库连接
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// 连接数据库
db.connect((err) => {
    if (err) {
        console.error('数据库连接失败:', err);
    } else {
        console.log('成功连接到数据库');
    }
});

// 将db.query转换为Promise形式
const query = promisify(db.query).bind(db);

//定义总资产和总市值,现金流
var cashflow = 1000000;
var totalAssets = 0; // 总资产实时计算
var totalMarketValue = 0; // 假设初始总市值

const parseBody = (req) => {
    return new Promise((resolve, reject) => {
        const body = [];
        req.on('data', (chunk) => body.push(chunk));
        req.on('end', () => {
            try {
                const bodyString = Buffer.concat(body).toString().trim();
                // 如果请求体为空，返回空对象
                if (!bodyString) {
                    resolve({});
                    return;
                }
                // 尝试解析JSON
                resolve(JSON.parse(bodyString));
            } catch (err) {
                console.error('JSON解析错误:', err.message);
                console.error('原始请求体:', Buffer.concat(body).toString());
                // 可以选择返回错误信息，而不是拒绝Promise
                // 这样在handleRequest中可以返回更具体的错误
                reject(new Error(`无效的JSON格式: ${err.message}`));
            }
        });
        req.on('error', reject);
    });
};
//定义一个获取总市值的函数
    const getTotalMarketValue = async () => {
        try {
            //查询持仓表中的所有股票的市值
            const positions = await query('SELECT stock_current_price, quantity FROM positions');
            if (positions.length === 0) {
                console.log('没有持仓记录');
                return 0; // 如果没有持仓记录，总市值为0
            }
            // 计算总市值
            let totalMarketValue = 0;
            for (const position of positions) {
                totalMarketValue += position.stock_current_price * position.quantity;
            }
       
            // 更新全局变量
            totalMarketValue = positions.reduce((sum, position) => 
                sum + position.stock_current_price * position.quantity, 0);
            
            return totalMarketValue;
        } catch (error) {
            console.error('获取总市值失败:', error);
            throw error;
        }
    };
// 新增：计算总资产
const calculateTotalAssets = (cashflow, marketValue) => {
    return cashflow + marketValue;
};
// 新增：计算持仓占比
// 修改持仓占比计算公式
const calculatePositionPercentage = (positionValue, totalMarketValue) => {
    console.log('positionValue:', positionValue);
    console.log('totalMarketValue:', totalMarketValue);
    return totalMarketValue > 0 ? (positionValue / totalMarketValue) * 100 : 0;
};

// 修改更新所有持仓百分比的方法
const updateAllPositionPercentages = async (totalMarketValue) => {
    try {
        const positions = await query('SELECT stock_name, stock_current_price, quantity FROM positions');
        for (const position of positions) {
            const positionValue = position.stock_current_price * position.quantity;
            const percentage = calculatePositionPercentage(positionValue, totalMarketValue);
            await query(
                'UPDATE positions SET position_percentage = ? WHERE stock_name = ?',
                [percentage, position.stock_name]
            );
        }
    } catch (error) {
        console.error('更新所有持仓百分比失败:', error);
        throw error;
    }
};
// 修改updatePositionMetrics函数
const updatePositionMetrics = async (stockName, newCost, newPrice, newQuantity) => {
    try {
        const totalMarketValue = await getTotalMarketValue();
        const positionValue = newPrice * newQuantity;
        // 修正为使用总持仓市值
        const positionPercentage = calculatePositionPercentage(positionValue, totalMarketValue);
        
        const dailyProfitLoss = (newPrice - newCost) * newQuantity;
        
        // 更新当前股票的持仓指标
        await query(`
            UPDATE positions
            SET position_percentage = ?,
                daily_profit_loss = ?
            WHERE stock_name = ?
        `, [positionPercentage, dailyProfitLoss, stockName]);
        
        // 更新所有股票的持仓百分比
        await updateAllPositionPercentages(totalMarketValue);
        
        return { positionPercentage, dailyProfitLoss };
    } catch (error) {
        console.error('更新持仓指标失败:', error);
        throw error;
    }
};
//定义一个获取全部持仓数据的函数
const getAllPositions = async () => {
    try {
        const positions = await query('SELECT * FROM positions');
        //输出获取到的持仓数据
        console.log('获取到的持仓数据:', positions);
        if(positions.length == 0){
          //不用报错，直接返回空数组
          return [];
        }
        return positions;   
    } catch (error) {
        console.error('获取全部持仓数据失败:', error);
        throw error;
    }
};
  
// 处理请求的函数
// 在handleRequest函数中添加新的路由处理
const handleRequest = async (req, res) => {
    // 设置跨域头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // 设置默认响应头
    res.setHeader('Content-Type', 'application/json');
    
    // 新增：解析URL和路径（必须放在路由判断之前）
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    try {
        // 新增股票价格更新接口
        if (pathname === '/stocks/update-prices' && method === 'POST') {
            const body = await parseBody(req);
            if (!Array.isArray(body)) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: '请求体需要股票数据数组' }));
                return;
            }

            // 更新所有股票的现价和指标
            for (const stockData of body) {
                const { stockName, currentPrice } = stockData;
                if (!stockName || !currentPrice) continue;

                // 获取当前持仓数据
                const [position] = await query('SELECT * FROM positions WHERE stock_name = ?', [stockName]);
                if (!position) continue;

                // 更新现价和相关指标
                await query('UPDATE positions SET stock_current_price = ? WHERE stock_name = ?', 
                    [currentPrice, stockName]);
                await updatePositionMetrics(
                    stockName,
                    position.stock_cost,
                    currentPrice,
                    position.quantity
                );
            }

            // 返回最新汇总数据
            const summary = await getSummaryData();
            res.statusCode = 200;
            res.end(JSON.stringify(summary));
            return;
        }

        // 新增总资产数据接口
        if (pathname === '/stocks/summary' && method === 'GET') {
            const summaryData = await getSummaryData();
            res.statusCode = 200;
            res.end(JSON.stringify(summaryData));
            return;
        }

        // 获取全部持仓数据
        if (pathname.match('/stocks/sync-position') && method === 'GET') {
            console.log('Received GET request for /stocks/sync-position');
            //获取全部持仓记录
            const positions = await getAllPositions();
            if(positions.code == 400){
                res.statusCode = 400;
                res.end(JSON.stringify({ error: positions.msg }));
                return;
            }
            //返回获取到的持仓记录
            res.statusCode = 200;
            res.end(JSON.stringify(positions));
            return;
            
        }

        // 添加或修改新的持仓记录 (POST)
        if (pathname === '/stocks/positions' && method === 'POST') {
            console.log('Received POST request for /stocks/positions');
            const body = await parseBody(req);
            const { ticker, trade_time, price, quantity } = body;
            
            // 判断请求体中的必需字段是否存在
            if (!ticker || !trade_time || !price || !quantity) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: '请求体中缺少必需字段' }));
                return;
            }

            // 检查是否存在相同股票的持仓记录
            const existingPositions = await query('SELECT * FROM positions WHERE stock_name = ?', [ticker]);
            
            if (existingPositions.length === 0) {
                // 创建新持仓
                await createNewPosition(ticker, price, quantity, res);
            } else {
                // 更新现有持仓
                await updateExistingPosition(existingPositions[0], ticker, price, quantity, res);
            }
            return;
        }

        // 未找到的路由
        res.statusCode = 404;
        res.end(JSON.stringify({ error: '未找到请求的资源' }));

    } catch (err) {
        console.error('处理请求出错:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: '服务器内部错误' }));
    }
};

// 新增：创建新持仓
const createNewPosition = async (ticker, price, quantity, res) => {
    const cost = price * quantity;
    
    // 检查现金流是否充足
    if (cost > cashflow) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: '现金流不足，无法购买股票' }));
        return;
    }

    // 更新现金流
    cashflow -= cost;
    
    // 计算总市值
    const currentMarketValue = await getTotalMarketValue();
    const newMarketValue = currentMarketValue + cost;

    // 修正百分比计算（使用总市值）
    const percentage = calculatePositionPercentage(cost, newMarketValue);

    // 插入新持仓记录
    const result = await query(`
        INSERT INTO positions 
        (stock_name, stock_cost, stock_current_price, quantity, daily_profit_loss, position_percentage)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [ticker, price, price, quantity, 0, percentage]);

    // 修正调用参数（使用总市值）
    await updateAllPositionPercentages(newMarketValue);

    // 返回响应
    res.statusCode = 201;
    res.end(JSON.stringify({
        message: '持仓记录添加成功',
        positionId: result.insertId
    }));
    
    // 日志输出
    console.log('总市值:', await getTotalMarketValue());
    console.log('总资产:', calculateTotalAssets(cashflow, newMarketValue));
};

// 新增：更新现有持仓
const updateExistingPosition = async (existingPosition, ticker, price, quantity, res) => {
    console.log('Existing position found:', existingPosition);
    
    // 检查卖出数量是否超过持有数量
    if (quantity < 0 && Math.abs(quantity) > existingPosition.quantity) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: '卖出数量超过持有数量' }));
        return;
    }

    // 根据数量正负处理加仓或减仓
    if (quantity > 0) {
        await handleAddition(existingPosition, ticker, price, quantity, res);
    } else if (quantity < 0) {
        await handleReduction(existingPosition, ticker, price, quantity, res);
    }
};

// 新增：处理加仓操作
const handleAddition = async (existingPosition, ticker, price, quantity, res) => {
    console.log('加仓操作');
    const newQuantity = existingPosition.quantity + quantity;
    const requiredCash = price * quantity;

    // 检查现金流是否充足
    if (requiredCash > cashflow) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: '现金流不足，无法购买股票' }));
        return;
    }

    // 计算加权平均成本
    const totalCost = existingPosition.stock_cost * existingPosition.quantity + price * quantity;
    const newCost = totalCost / newQuantity;

    // 更新现金流
    cashflow -= requiredCash;

    // 计算总市值和总资产
    const newMarketValue = (await getTotalMarketValue()) + requiredCash;
    const totalAssets = calculateTotalAssets(cashflow, newMarketValue);
    
    // 计算衍生指标
    const positionValue = price * newQuantity;
    const percentage = positionValue / totalAssets;
    const dailyProfitLoss = (price - newCost) * newQuantity;

    // 更新持仓记录
    await query(`
        UPDATE positions 
        SET stock_cost = ?, 
            stock_current_price = ?, 
            quantity = ?, 
            daily_profit_loss = ?,
            position_percentage = ?
        WHERE stock_name = ?
    `, [newCost, price, newQuantity, dailyProfitLoss, percentage, ticker]);

    // 更新所有持仓百分比
    await updateAllPositionPercentages(totalAssets);

    // 返回响应
    res.statusCode = 200;
    res.end(JSON.stringify({    
        message: '持仓记录更新成功',
        positionId: existingPosition.id
    }));
};

// 新增：处理减仓操作
const handleReduction = async (existingPosition, ticker, price, quantity, res) => {
    console.log('减仓操作');
    const remainingQuantity = existingPosition.quantity + quantity; // 正确变量名应该是remainingQuantity
    const sellAmount = price * Math.abs(quantity);

    // 更新现金流
    cashflow += sellAmount;

    // 如果全部卖出，删除持仓记录
    if (remainingQuantity === 0) {
        await query('DELETE FROM positions WHERE stock_name = ?', [ticker]);
    } else {
        // 计算剩余持仓成本
        const newCost = (existingPosition.stock_cost * existingPosition.quantity - price * Math.abs(quantity)) / remainingQuantity;
        
        // 更新持仓记录基本信息
        await query(`
            UPDATE positions
            SET stock_cost = ?,
                stock_current_price = ?,
                quantity = ?
            WHERE stock_name = ?
        `, [newCost, price, remainingQuantity, ticker]);

        // 获取更新后的持仓记录并更新指标
        const updatedPosition = await query('SELECT * FROM positions WHERE stock_name = ?', [ticker]);
        console.log('Updated position:', updatedPosition[0]);

        // 计算总市值和总资产
        const currentMarketValue = await getTotalMarketValue();
        const positionValue = price * remainingQuantity; // 使用正确的remainingQuantity变量
        const percentage = calculatePositionPercentage(positionValue, currentMarketValue);
        const dailyProfitLoss = (price - newCost) * remainingQuantity;

        // 更新持仓记录
        await query(`
            UPDATE positions 
            SET daily_profit_loss = ?,
                position_percentage = ?
            WHERE stock_name = ?
        `, [dailyProfitLoss, percentage, ticker]);

        // 更新所有持仓百分比
        await updateAllPositionPercentages(currentMarketValue);
    }

    // 返回响应（移到if-else外部）
    res.statusCode = 200;
    res.end(JSON.stringify({
        message: '持仓记录更新成功',
        positionId: existingPosition.id
    }));
};

// 创建并启动服务器
const PORT = 3002;
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
    console.log(`服务器正在运行在端口 ${PORT}`);
});

// 修改汇总数据获取函数
const getSummaryData = async () => {
    try {
        const totalMarketValue = await getTotalMarketValue();
        
        const positions = await query(`
            SELECT 
                CAST(stock_cost AS DECIMAL(18,2)) as stock_cost,
                quantity,
                CAST(daily_profit_loss AS DECIMAL(18,2)) as daily_profit_loss 
            FROM positions
        `);
        
        let totalCost = 0;
        let totalDailyProfit = 0;
        
        for (const position of positions) {
            totalCost += Number(position.stock_cost) * Number(position.quantity);
            totalDailyProfit += Number(position.daily_profit_loss);
        }
        
        return {
            totalAssets: calculateTotalAssets(cashflow, totalMarketValue),
            totalMarketValue: totalMarketValue,
            cashflow: cashflow,
            totalProfit: totalMarketValue - totalCost,  // 总盈亏 = 总市值 - 总成本
            totalDailyProfit: Number(totalDailyProfit).toFixed(2) // 强制保留两位小数
        };
    } catch (error) {
        console.error('获取汇总数据失败:', error);
        throw error;
    }
};