const express = require('express')
const mysql = require('mysql2/promise')
const cors = require('cors')
const OpenAI = require('openai')

const app = express()
app.use(cors())
app.use(express.json())

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'stock_data_mysql'
}

// 配置OpenAI客户端
const openai = new OpenAI({
  // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx",
  apiKey: "",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
})

app.get('/api/stock_data', async (req, res) => {
  const ticker = (req.query.ticker || '').toLowerCase()
  const suffix = req.query.suffix || '_dk'
  if (!ticker) return res.status(400).json({ error: 'Missing ticker' })
  const tableName = `${ticker}${suffix}`
  try {
    const conn = await mysql.createConnection(dbConfig)
    const [rows] = await conn.query(
      `SELECT time_stamp, open_price, high_price, low_price, close_price, volume FROM \`${tableName}\` ORDER BY time_stamp ASC`
    )
    await conn.end()
    // 格式化为前端需要的格式
    const price_data = {
      timestamp: [],
      open: [],
      high: [],
      low: [],
      close: [],
      volume: []
    }
    for (const row of rows) {
      price_data.timestamp.push(row.time_stamp)
      price_data.open.push(Number(row.open_price))
      price_data.high.push(Number(row.high_price))
      price_data.low.push(Number(row.low_price))
      price_data.close.push(Number(row.close_price))
      price_data.volume.push(Number(row.volume))
    }
    res.json({
      ticker: ticker.toUpperCase(),
      price_data
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
})

// AI股票分析接口
app.post('/api/analyze-stock', async (req, res) => {
  try {
    const { prompt, language } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    // 根据语言设置system prompt
    let systemPrompt = "You are a professional stock investment analyst. Please provide detailed and professional analysis."
    if (language === 'zh') {
      systemPrompt = "你是一位专业的股票投资分析师。请提供详细且专业的分析。请用中文回答所有问题。"
    }

    // 设置响应头为Server-Sent Events格式
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    try {
      const completion = await openai.chat.completions.create({
        model: "qwen-plus-latest",
        messages: [
          { "role": "system", "content": systemPrompt },
          { "role": "user", "content": prompt }
        ],
        stream: true,
        max_tokens: 32768,
        temperature: 0.7
      });

      for await (const chunk of completion) {
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) {
          // 发送SSE格式的数据
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      
      // 发送结束信号
      res.write(`data: [DONE]\n\n`);
      res.end();
      
    } catch (aiError) {
      console.error('AI API调用失败:', aiError);
      res.write(`data: ${JSON.stringify({ error: 'AI analysis failed', details: aiError.message })}\n\n`);
      res.end();
    }
    
  } catch (error) {
    console.error('分析请求处理失败:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
})
