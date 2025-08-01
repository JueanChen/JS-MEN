/**
 * 实时数据管理器
 * 负责管理所有页面的实时股票价格数据更新
 */

class RealtimeDataManager {
  constructor() {
    this.currentDataArray = [] // 存储current_data.json中的数据
    this.globalStartTime = null // 全局开始时间，存储在localStorage中保持连续性
    this.priceUpdateInterval = null // 价格更新定时器
    this.isInitialized = false // 是否已初始化
    this.initPromise = null // 初始化Promise，避免重复初始化
    
    // 初始化全局开始时间
    this.initGlobalStartTime()
  }

  /**
   * 初始化全局开始时间
   */
  initGlobalStartTime() {
    const storedStartTime = localStorage.getItem('realtime_global_start_time')
    if (storedStartTime) {
      this.globalStartTime = parseInt(storedStartTime)
      console.log('RealtimeDataManager: Using existing global start time:', new Date(this.globalStartTime))
    } else {
      this.globalStartTime = Date.now()
      localStorage.setItem('realtime_global_start_time', this.globalStartTime.toString())
      console.log('RealtimeDataManager: Set new global start time:', new Date(this.globalStartTime))
    }
  }

  /**
   * 初始化实时数据管理器
   */
  async initialize() {
    if (this.isInitialized) {
      return true
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this._doInitialize()
    return this.initPromise
  }

  async _doInitialize() {
    try {
      console.log('RealtimeDataManager: Initializing...')
      
      // 加载current_data.json数据
      const dataLoaded = await this.loadCurrentData()
      if (!dataLoaded) {
        console.error('RealtimeDataManager: Failed to load current data')
        return false
      }

      this.isInitialized = true
      console.log('RealtimeDataManager: Initialized successfully')
      return true
    } catch (error) {
      console.error('RealtimeDataManager: Initialization failed:', error)
      return false
    }
  }

  /**
   * 加载current_data.json数据
   */
  async loadCurrentData() {
    try {
      console.log('RealtimeDataManager: Loading current_data.json...')
      const response = await fetch('./current_data.json')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      this.currentDataArray = await response.json()
      console.log('RealtimeDataManager: Current data loaded successfully:', this.currentDataArray.length, 'stocks')
      
      // 打印每个股票的数据信息
      this.currentDataArray.forEach(stock => {
        console.log(`Stock ${stock.ticker}: ${stock.open_prices.length} prices, ${stock.volumes.length} volumes`)
      })
      
      return true
    } catch (error) {
      console.error('RealtimeDataManager: Failed to load current data:', error)
      return false
    }
  }

  /**
   * 启动实时数据更新
   */
  async startRealTimeUpdates() {
    // 确保已初始化
    const initialized = await this.initialize()
    if (!initialized) {
      console.error('RealtimeDataManager: Cannot start updates - initialization failed')
      return false
    }

    // 如果已经在运行，则不重复启动
    if (this.priceUpdateInterval) {
      console.log('RealtimeDataManager: Real-time updates already running')
      return true
    }

    console.log('RealtimeDataManager: Starting real-time updates...')
    
    // 立即执行一次更新
    this.updateAllStockPrices()
    
    // 每5秒更新一次
    this.priceUpdateInterval = setInterval(() => {
      this.updateAllStockPrices()
    }, 5000)
    
    console.log('RealtimeDataManager: Real-time updates started, interval ID:', this.priceUpdateInterval)
    return true
  }

  /**
   * 停止实时数据更新
   */
  stopRealTimeUpdates() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval)
      this.priceUpdateInterval = null
      console.log('RealtimeDataManager: Real-time updates stopped')
    }
  }

  /**
   * 更新并保存所有股票的实时价格到localStorage
   */
  updateAllStockPrices() {
    if (!this.currentDataArray.length) {
      console.log('RealtimeDataManager: No data available for update')
      return
    }
    
    // 计算全局开始时间到现在的时间（秒）
    const currentTime = Date.now()
    const elapsedSeconds = Math.floor((currentTime - this.globalStartTime) / 1000)
    
    console.log(`RealtimeDataManager: Global elapsed time: ${elapsedSeconds} seconds`)
    
    // 获取或创建current_prices对象
    let currentPrices = {}
    try {
      const stored = localStorage.getItem('current_prices')
      if (stored) {
        currentPrices = JSON.parse(stored)
      }
    } catch (error) {
      console.error('RealtimeDataManager: Failed to parse stored current_prices:', error)
      currentPrices = {}
    }
    
    // 为每个股票计算实时价格
    this.currentDataArray.forEach(stockData => {
      const priceIndex = elapsedSeconds % stockData.open_prices.length
      
      // 确保索引有效
      if (priceIndex < stockData.open_prices.length) {
        const currentPrice = stockData.open_prices[priceIndex]
        currentPrices[stockData.ticker] = currentPrice
      }
    })
    
    // 保存到localStorage
    try {
      localStorage.setItem('current_prices', JSON.stringify(currentPrices))
      console.log('RealtimeDataManager: Current prices updated and saved:', Object.keys(currentPrices).length, 'stocks')
      
      // 触发storage事件，通知其他页面数据已更新
      this.dispatchStorageEvent(currentPrices)
    } catch (error) {
      console.error('RealtimeDataManager: Failed to save current_prices to localStorage:', error)
    }
  }

  /**
   * 手动触发storage事件，确保同一页面内的监听器也能收到通知
   */
  dispatchStorageEvent(currentPrices) {
    // 创建自定义storage事件
    const storageEvent = new StorageEvent('storage', {
      key: 'current_prices',
      newValue: JSON.stringify(currentPrices),
      oldValue: null,
      storageArea: localStorage,
      url: window.location.href
    })
    
    // 分发事件
    window.dispatchEvent(storageEvent)
  }

  /**
   * 获取特定股票的当前价格
   */
  getCurrentPrice(ticker) {
    try {
      const stored = localStorage.getItem('current_prices')
      if (stored) {
        const currentPrices = JSON.parse(stored)
        return currentPrices[ticker] || null
      }
    } catch (error) {
      console.error('RealtimeDataManager: Failed to get current price for', ticker, ':', error)
    }
    return null
  }

  /**
   * 获取所有股票的当前价格
   */
  getAllCurrentPrices() {
    try {
      const stored = localStorage.getItem('current_prices')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('RealtimeDataManager: Failed to get all current prices:', error)
    }
    return {}
  }

  /**
   * 根据ticker获取股票数据
   */
  getStockDataByTicker(ticker) {
    return this.currentDataArray.find(stock => stock.ticker === ticker)
  }

  /**
   * 检查是否正在运行实时更新
   */
  isRunning() {
    return this.priceUpdateInterval !== null
  }

  /**
   * 页面卸载时的清理工作
   */
  cleanup() {
    this.stopRealTimeUpdates()
  }
}

// 创建全局实例
window.realtimeDataManager = new RealtimeDataManager()

// 页面卸载时清理
window.addEventListener('beforeunload', function() {
  if (window.realtimeDataManager) {
    window.realtimeDataManager.cleanup()
  }
})

// 页面加载完成后自动启动实时更新
document.addEventListener('DOMContentLoaded', async function() {
  console.log('RealtimeDataManager: Page loaded, auto-starting real-time updates...')
  const success = await window.realtimeDataManager.startRealTimeUpdates()
  if (success) {
    console.log('RealtimeDataManager: Auto-start successful')
  } else {
    console.error('RealtimeDataManager: Auto-start failed')
  }
})
