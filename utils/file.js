// returns crypto exchange rates from an existing file
const readCrypto = (fileName = 'exchange_rates/2020_5min_usdt_btc.csv') => {
    const fs = require('fs')
    const csv = require('csv-parser')
    return new Promise((resolve, reject) => {
      var readData = []
      fs.createReadStream(fileName).pipe(csv()).on('data', (row) => {
        readData.push({
          timestamp: parseFloat(row.timestamp),
          open: parseFloat(row.open),
          highest: parseFloat(row.highest),
          lowest: parseFloat(row.lowest),
          close: parseFloat(row.close),
          volume: parseFloat(row.volume),
        })
      }).on('end', () => {resolve(readData)})
    })
  }

  const supportedDates = {
    from: 1609459200000,
    to: 1617251400000
  }

  const sourceFiles = {
    USDT_BTC: [
      'exchange_rates/usdt_btc/2021/2021_jan_1min_usdt_btc.csv',
      'exchange_rates/usdt_btc/2021/2021_feb_1min_usdt_btc.csv',
      'exchange_rates/usdt_btc/2021/2021_march_1min_usdt_btc.csv'
    ]
  }

  const supportedCurrencyPairs = {
    'USDT': [
      'BTC'
    ]
  }

  const readCryptoByDate = async (from, to, baseCurrency, exchangeCurrency) => {
    if(!(from >= supportedDates.from && from <= supportedDates.to && to >= supportedDates.from && to <= supportedDates.to)) {
      console.log('Invalid dates!')
      return []
    }
    if(
      !(
        supportedCurrencyPairs[baseCurrency] != null &&
        supportedCurrencyPairs[baseCurrency].filter(element => element == exchangeCurrency).length == 1
      )
    ) {
      console.log('Invalid trading pairs!')
      return []
    }
    const sources = sourceFiles[(baseCurrency + '_' + exchangeCurrency)]
    var data = []

    for(var i = 0; i < sources.length; ++i) {
      const newData = await readCrypto(sources[i])
      data = data.concat(newData)
    }
    
    return data.filter(element => element.timestamp >= from && element.timestamp <= to)
  }
  
  module.exports = {
    readCrypto: readCrypto,
    readCryptoByDate: readCryptoByDate
  }