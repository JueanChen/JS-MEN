// scripts/i18n.js
// 通用中英文切换与同步脚本

const i18n = {
  en: {
    system_title: 'Financial Asset Management System',
    nav_asset: 'Personal Assets',
    nav_trade: 'Trade Records',
    nav_stock: 'Stock Trading',
    assets_management: 'Overview of Assets',
    stock_market_analysis: 'Stock Market Analysis',
    data_update_time: 'Data Update Time:',
    add_trade: 'Add Trade',
    select_stock: 'Select Stock',
    current_price: 'Current Price',
    todays_change: "Today's Change",
    open_price: 'Open Price',
    volume: 'Volume',
    historical_trading_data: 'Historical Trading Data',
    total_assets: 'Total Assets',
    total_profit_loss: 'Total Profit/Loss',
    daily_profit_loss: 'Daily Profit/Loss',
    total_market_value: 'Total Market Value',
    income: 'Income',
    spending: 'Spending',
    last_30_days: 'Last 30 Days',
    position_distribution: 'Position Distribution',
    top_gainers: 'Top Gainers',
    top_losers: 'Top Losers',
    position_details: 'Position Details',
    stock: 'Stock',
    cost_price: 'Cost Price',
    current_price: 'Current Price',
    quantity: 'Quantity',
    position_ratio: 'Position Ratio',
    position_value: 'Position Value',
    // trades
    total_trades: 'Total Trades',
    total_trade_amount: 'Total Trade Amount',
    buy_trades: 'Buy Trades',
    sell_trades: 'Sell Trades',
    trade_time: 'Trade Time',
    trade_details: 'Trade Details',
    trade_type: 'Trade Type',
    price: 'Price',
    total_amount: 'Total Amount',
    trade_records: 'Trade Records',
    buy: 'Buy',
    sell: 'Sell',
    available_assets: 'Available Assets',
    // stocks page specific
    time: 'Time',
    open: 'Open',
    high: 'High',
    low: 'Low',
    close: 'Close',
    change: 'Change',
    add_new_trade: 'Add New Trade',
    trade_type_label: 'Trade Type',
    stock_symbol: 'Stock Symbol',
    required_amount: 'Required Amount:',
    current_holdings: 'Current Holdings',
    submit_trade: 'Submit Trade',
    analyze_stock: 'Analyze Stock',
    ai_investment_analysis: 'AI Investment Analysis',
    loading_data: 'Loading data...',
    // chart time periods
    one_day: '1 DAY',
    five_days: '5 DAYS',
    day_chart: 'DAY CHART',
    week_chart: 'WEEK CHART',
    month_chart: 'MONTH CHART',
    income_amount: 'Income Amount:',
    enter_quantity: 'Enter quantity...',
    shares: 'shares',
    insufficient_stock: 'Insufficient stock quantity. You currently hold {current} shares of {ticker}, but you\'re trying to sell {required} shares. Please enter a quantity no more than {current}.',
  },
  zh: {
    system_title: '金融资产管理系统',
    nav_asset: '个人资产',
    nav_trade: '交易记录',
    nav_stock: '股票交易',
    assets_management: '资产总览',
    stock_market_analysis: '股票市场分析',
    data_update_time: '数据更新时间：',
    add_trade: '添加交易',
    select_stock: '选择股票',
    current_price: '现价',
    todays_change: '今日涨跌',
    open_price: '开盘价',
    volume: '成交量',
    historical_trading_data: '历史交易数据',
    total_assets: '总资产',
    total_profit_loss: '总盈亏',
    daily_profit_loss: '当日盈亏',
    total_market_value: '总市值',
    income: '收入',
    spending: '支出',
    last_30_days: '最近30天',
    position_distribution: '持仓分布',
    top_gainers: '涨幅榜',
    top_losers: '跌幅榜',
    position_details: '持仓明细',
    stock: '股票',
    cost_price: '成本价',
    current_price: '现价',
    quantity: '数量',
    position_ratio: '持仓比例',
    position_value: '持仓市值',
    // trades
    total_trades: '总交易数',
    total_trade_amount: '总交易金额',
    buy_trades: '买入交易',
    sell_trades: '卖出交易',
    trade_time: '交易时间',
    trade_details: '交易明细',
    trade_type: '交易类型',
    price: '价格',
    total_amount: '总金额',
    trade_records: '交易记录',
    buy: '买入',
    sell: '卖出',
    available_assets: '当前可用资产',
    // stocks page specific
    time: '时间',
    open: '开盘',
    high: '最高',
    low: '最低',
    close: '收盘',
    change: '涨跌',
    add_new_trade: '添加新交易',
    trade_type_label: '交易类型',
    stock_symbol: '股票代码',
    required_amount: '所需金额：',
    current_holdings: '当前持仓',
    submit_trade: '提交交易',
    analyze_stock: '分析股票',
    ai_investment_analysis: 'AI投资分析',
    loading_data: '加载数据中...',
    // chart time periods
    one_day: '1日',
    five_days: '5日',
    day_chart: '日线图',
    week_chart: '周线图',
    month_chart: '月线图',
    income_amount: '收入金额：',
    enter_quantity: '请输入数量...',
    shares: '股',
    insufficient_stock: '库存不足。您目前持有 {current} 股 {ticker}，但您试图卖出 {required} 股。请输入不超过 {current} 的数量。',
  },
}

function setLanguage(lang) {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')
    el.textContent = i18n[lang][key] || key
  })
  
  // Update placeholders
  document.querySelectorAll('[data-placeholder-key]').forEach((el) => {
    const key = el.getAttribute('data-placeholder-key')
    el.placeholder = i18n[lang][key] || el.placeholder
  })
  
  // Update dynamic text elements (like "-- shares")
  document.querySelectorAll('[data-dynamic-text]').forEach((el) => {
    const key = el.getAttribute('data-dynamic-text')
    const translation = i18n[lang][key]
    if (translation && el.textContent.includes('--')) {
      el.textContent = `-- ${translation}`
    }
  })
  
  localStorage.setItem('lang', lang)
  const btn = document.getElementById('lang-toggle')
  if (btn) {
    // Update button text and flag
    const flagIcon = btn.querySelector('.flag-icon')
    const textSpan = btn.querySelector('span:last-child')
    
    if (lang === 'en') {
      if (flagIcon) flagIcon.textContent = '🇨🇳'
      if (textSpan) textSpan.textContent = '中文'
    } else {
      if (flagIcon) flagIcon.textContent = '🇺🇸'
      if (textSpan) textSpan.textContent = 'EN'
    }
    
    // Fallback for old button structure
    if (!flagIcon && !textSpan) {
      btn.textContent = lang === 'en' ? '中文' : 'EN'
    }
  }
  
  // Dispatch custom event to notify language change
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }))
}

function setupLanguageToggle() {
  const btn = document.getElementById('lang-toggle')
  if (!btn) return
  btn.onclick = function () {
    // Add switching animation
    btn.classList.add('switching')
    
    // Remove animation class after animation completes
    setTimeout(() => {
      btn.classList.remove('switching')
    }, 600)
    
    const lang = localStorage.getItem('lang') === 'en' ? 'zh' : 'en'
    setLanguage(lang)
    window.localStorage.setItem('lang_sync', Date.now())
  }
}

function setupLanguageSync() {
  window.addEventListener('storage', function (e) {
    if (e.key === 'lang' || e.key === 'lang_sync') {
      setLanguage(localStorage.getItem('lang') || 'en')
    }
  })
}

function initI18n() {
  setLanguage(localStorage.getItem('lang') || 'en')
  setupLanguageToggle()
  setupLanguageSync()
}

document.addEventListener('DOMContentLoaded', initI18n)
