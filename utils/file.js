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
  
  module.exports = {
    readCrypto: readCrypto
  }