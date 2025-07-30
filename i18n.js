// scripts/i18n.js
// 通用中英文切换与同步脚本

const i18n = {
  en: {
    system_title: 'Financial Asset Management System',
    nav_asset: 'Asset Management',
    nav_trade: 'Trade Management',
    nav_stock: 'Stock Trading',
    assets_management: 'Assets Management',
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
  },
  zh: {
    system_title: '金融资产管理系统',
    nav_asset: '资产管理',
    nav_trade: '交易管理',
    nav_stock: '股票交易',
    assets_management: '资产管理',
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
  },
}

function setLanguage(lang) {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')
    el.textContent = i18n[lang][key] || key
  })
  localStorage.setItem('lang', lang)
  const btn = document.getElementById('lang-toggle')
  if (btn) btn.textContent = lang === 'en' ? '中文' : 'EN'
}

function setupLanguageToggle() {
  const btn = document.getElementById('lang-toggle')
  if (!btn) return
  btn.onclick = function () {
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
