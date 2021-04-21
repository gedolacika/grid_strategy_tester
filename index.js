const express = require('express')
const app = express()
const port = 3000
const grid_backtester = require('./grid_backtester/index').grid_backtester

app.get('/test', async (req, res) => {
  res.send('Hello World!')
  console.log('Data from params: ' + req.query.fromTimestamp)
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
  console.log('Tester starts to run...')
  const running_starts = (new Date()).valueOf()
  var test_result = await grid_backtester(gridSettings)
  const running_finished = (new Date()).valueOf()
  console.log('Tester ran. Running time: ' + (running_finished - running_starts) + ' ms') 
  test_result = {
    ...test_result,
    transactions: 'Result hided'
  }
  // console.log('Results: ')
  // console.log(test_result)
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})