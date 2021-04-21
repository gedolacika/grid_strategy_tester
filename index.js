const express = require('express')
const app = express()
const port = 3000
const grid_backtester = require('./grid_backtester/index').grid_backtester

app.get('/', async (req, res) => {
  res.send('Hello World!')
  const gridSettings = {
    fromTimestamp: 1609459200000,
    toTimestamp: 1617235140000,
    baseCurrency: 'USDT',
    exchangeCurrency: 'BTC',
    min: 30000,
    max: 60000,
    numberOfGrids: 33,
    exchangeTradingVolumePerLine: 0.01,
    exchangeFee: 0.001,
    isLoggingEnabled: false
  }
  var test_result = await grid_backtester(gridSettings)
  test_result = {
    ...test_result,
    transactions: 'Result hided'
  }
  console.log('Script ran.')
  console.log('Results are: ')
  console.log(test_result)
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})