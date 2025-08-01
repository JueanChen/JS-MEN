# AI Stock Analysis Feature Configuration Guide

## Overview
The stock analysis feature integrates multiple large language model AI services and supports streaming output of analysis results. You can choose different AI service providers based on your needs.

## Supported AI Models

### 1. OpenAI GPT (Recommended)
```javascript
// Configuration example
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_OPENAI_API_KEY'  // Replace with your API key
  },
  body: JSON.stringify({
    model: "gpt-4",  // or "gpt-3.5-turbo"
    messages: [{ role: "user", content: prompt }],
    stream: true,
    max_tokens: 2000,
    temperature: 0.7
  })
});
```
- **Get API Key**: https://platform.openai.com/api-keys
- **Documentation**: https://platform.openai.com/docs/api-reference/chat
- **Pricing**: Pay per token, GPT-4 is more expensive but performs better

### 2. Anthropic Claude
```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_CLAUDE_API_KEY',
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: "claude-3-opus-20240229",  // or "claude-3-sonnet-20240229"
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
    stream: true
  })
});
```
- **Get API Key**: https://console.anthropic.com/
- **Documentation**: https://docs.anthropic.com/claude/reference/messages_post

### 3. Baidu ERNIE (文心一言)
```javascript
// First get access_token
const tokenResponse = await fetch('https://aip.baidubce.com/oauth/2.0/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: `grant_type=client_credentials&client_id=YOUR_API_KEY&client_secret=YOUR_SECRET_KEY`
});
const { access_token } = await tokenResponse.json();

// Then call ERNIE API
const response = await fetch(`https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/eb-instant?access_token=${access_token}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: "user", content: prompt }],
    stream: true
  })
});
```
- **Get API Key**: https://cloud.baidu.com/product/wenxinworkshop
- **Documentation**: https://cloud.baidu.com/doc/WENXINWORKSHOP/index.html

### 4. Alibaba Qwen (通义千问)
```javascript
const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_DASHSCOPE_API_KEY'
  },
  body: JSON.stringify({
    model: "qwen-plus",  // or "qwen-turbo"
    input: { messages: [{ role: "user", content: prompt }] },
    parameters: { 
      result_format: "message",
      incremental_output: true  // Streaming output
    }
  })
});
```
- **Get API Key**: https://dashscope.aliyun.com/
- **Documentation**: https://help.aliyun.com/zh/dashscope/

### 5. Zhipu AI GLM (智谱AI)
```javascript
const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_GLM_API_KEY'
  },
  body: JSON.stringify({
    model: "glm-4",  // or "glm-3-turbo"
    messages: [{ role: "user", content: prompt }],
    stream: true,
    max_tokens: 2000
  })
});
```
- **Get API Key**: https://open.bigmodel.cn/
- **Documentation**: https://open.bigmodel.cn/dev/api

## Configuration Steps

1. **Choose AI Service Provider**: Select the appropriate AI service based on your needs and budget
2. **Get API Key**: Visit the corresponding platform to register and obtain API key
3. **Modify Code**: Find the `streamAnalysis` function in `stocks.html` file and replace the corresponding API configuration
4. **Test Function**: Click the "Analyze Current Stock" button to test if the function works properly

## Important Notes

- **API Key Security**: Do not hardcode API keys in frontend code, recommend using backend proxy for API calls
- **Cost Control**: Most AI services charge based on usage, please control usage costs
- **Network Issues**: Some international APIs may require proxy access
- **Fallback Solution**: If API call fails, the system will automatically display simulated analysis results

## Production Environment Recommendations

For security purposes, it's recommended to create a backend API endpoint to handle AI calls:

```javascript
// Frontend calls backend API
const response = await fetch('/api/analyze-stock', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    ticker: stockTicker, 
    prompt: prompt 
  })
});
```

This approach avoids exposing API keys in the frontend while providing better control over access frequency and costs.
