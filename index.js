const express = require('express')
const app = express()
const port = 3000
const grid_backtester = require('./grid_backtester/index').grid_backtester

const gridSettingsForTesting = {
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

app.get('/', async (req, res) => {
  const gridSettingsFromQuery = {
    fromTimestamp: parseInt(req.query.fromTimestamp),
    toTimestamp: parseInt(req.query.toTimestamp),
    baseCurrency: req.query.baseCurrency,
    exchangeCurrency: req.query.exchangeCurrency,
    min: parseInt(req.query.min),
    max: parseInt(req.query.max),
    numberOfGrids: parseInt(req.query.numberOfGrids),
    exchangeTradingVolumePerLine: parseFloat(req.query.exchangeTradingVolumePerLine),
    exchangeFee: req.query.exchangeFee != undefined ? parseFloat(req.query.exchangeFee) : 0.001,
    isTransactionsHaveToBeReturned: false,
    isLoggingEnabled: false
  }
  const running_starts = (new Date()).valueOf()
  var test_result = await grid_backtester(gridSettingsFromQuery)
  const running_finished = (new Date()).valueOf()
  console.log('Tester ran. Running time: ' + (running_finished - running_starts) + ' ms')
  test_result = {
    ...test_result,
    testerRunTime: running_finished - running_starts
  }
  res.send(JSON.stringify(test_result))
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})