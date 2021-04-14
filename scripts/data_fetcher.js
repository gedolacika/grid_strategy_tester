const ccxt = require('ccxt')
const fs = require('fs')

const fetchCandles = async (fromTimestamp = 1611455122174, toTimestamp = 1611875122174, currency = 'BTC/EUR', timeIntervals = '5m', fileName = 'fetchedData.csv') => {
    console.log(currency)
    var ccxtInstance = new ccxt.binance()
    var candles = []
    var currentTimestamp = fromTimestamp
    do {
      var resultData = (await ccxtInstance.fetchOHLCV(currency, timeIntervals, currentTimestamp))
      console.log(resultData)
      candles = [...candles, ...resultData]
      console.log(candles.length)
      if (resultData.length > 0) { currentTimestamp = resultData[resultData.length - 1][0] }
    } while (candles.length > 0 && candles[candles.length - 1][0] < toTimestamp)

    // create the string variable to print out values
    var data = "timestamp,open,highest,lowest,close,volume\n"
    candles.forEach(element => {
      var line = ""
      element.forEach((e, index) => {
        line = line.toString() + e.toString()
        if (index != element.length - 1) { line += ',' }
        else { line += "\n" }
      })
      data += line.toString()
    })

    // print the data out to the file
    fs.writeFile(fileName, data, (err, data) => { })
  }

fetchCandles(1613952000000, 1618387101737, 'WAVES/BNB', '1m', '2021_feb_22_apr_14_1min_waves_bnb.csv')