const cryptoReaderFromFile = require('../utils/file').readCrypto
const BalanceProvider = require('./balance_provider')
const GridSignalProvider = require('./grid_signal_provider')
const GridTransactionProvider = require('./grid_transaction_provider')

const gridSettings = {
  min: 57000,
  max: 61000,
  numberOfGrids: 6
}

const grid_backtester = async () => {
  const cryptoExchangeRateChanges = await cryptoReaderFromFile('exchange_rates/usdt_btc/2021_apr_11_12_1min_usdt_btc.csv')
  const balanceProvider = new BalanceProvider();
  const gridSignalProvider = new GridSignalProvider(gridSettings.min, gridSettings.max, gridSettings.numberOfGrids);
  const gridTransationProvider = new GridTransactionProvider(gridSettings.min, gridSettings.max, gridSettings.numberOfGrids);

  balanceProvider.printBalance()
  var counter = 0

  for (let i = 0; i < cryptoExchangeRateChanges.length; i++) {
    const element = cryptoExchangeRateChanges[i];
    const { timestamp, open, highest, lowest, close, volume } = element

    if(gridSignalProvider.isCrossedWithGridLine(element)) {
      const crossedGrid = gridSignalProvider.getCrossedGrid(element)
      const previousGrid = gridSignalProvider.getPreviousCrossedGrid(crossedGrid)
      const nextGrid = gridSignalProvider.getNextCrossedGrid(crossedGrid)

      // check that at the current level is exists already a transaction
      // if not have to create one
      if(!gridTransationProvider.isTransactionExists(gridSignalProvider.getCrossedGrid(element))) {
        const transactionType = open < close ? 'buy' : 'sell';
        var isSuccessedTransaction = false
        console.log('------ CREATE  ORDER -----')
        if(transactionType == 'buy') {
          isSuccessedTransaction = balanceProvider.changeBaseToExchange(crossedGrid * 0.002, crossedGrid);
        }
        if(transactionType == 'sell') {
          isSuccessedTransaction = balanceProvider.changeExchangeToBase(0.002, crossedGrid);
        }
        if(isSuccessedTransaction) {
          balanceProvider.printBalance(i + ' - ' + (new Date(timestamp).toString()) + ' - ' + open.toString() + ' - ' + transactionType.toUpperCase() + ' - crossed grid:' + crossedGrid)
          gridTransationProvider.createTransaction(0.002, crossedGrid, transactionType)
        }
        console.log('------ END CREATION OF ORDER -----')
        console.log('')
      }

      // check that on the lower level is exists an active transaction to fulfill it
      if(gridTransationProvider.isTypedTransactionExists(previousGrid, 'buy')) {
        balanceProvider.changeExchangeToBase(0.002, crossedGrid)
        gridTransationProvider.fulfillTransaction(crossedGrid)
        balanceProvider.printBalance('FULFILL, BUY - onGrid: ' + crossedGrid + ', prevGrid: ' + previousGrid + ' -')
        ++counter;
      }

      // check that on the higher level is exists an active transaction to fulfill it
      if(gridTransationProvider.isTypedTransactionExists(nextGrid, 'sell')) {
        balanceProvider.changeBaseToExchange(crossedGrid * 0.002, crossedGrid)
        gridTransationProvider.fulfillTransaction(crossedGrid)
        balanceProvider.printBalance('FULFILL, SELL - onGrid: ' + crossedGrid + ', nextGrid: ' + nextGrid + ' -')
        ++counter;
      }
    }
  }
  balanceProvider.printBalance()
  console.log('Number of fullfills: ' + counter)
}

grid_backtester()