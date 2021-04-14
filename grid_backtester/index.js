const cryptoReaderFromFile = require('../utils/file').readCrypto
const BalanceProvider = require('./balance_provider')
const GridSignalProvider = require('./grid_signal_provider')
const GridTransactionProvider = require('./grid_transaction_provider')

const gridSettings = {
  min: 0.03370,
  max: 0.04955,
  numberOfGrids: 8
}

const grid_backtester = async () => {
  const cryptoExchangeRateChanges = await cryptoReaderFromFile('exchange_rates/waves_bnb/2021_feb_22_apr_14_1min.csv')
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
        if(transactionType == 'buy') {
          balanceProvider.changeUsdtToBtc(crossedGrid * 0.002, crossedGrid);
          balanceProvider.printBalance(i + ' - ' + (new Date(timestamp).toString()) + ' - ' + open.toString() + ' - BUY')
        }
        if(transactionType == 'sell') {
          balanceProvider.changeBtcToUsdt(0.002, crossedGrid);
          balanceProvider.printBalance(i + ' - ' + (new Date(timestamp).toString()) + ' - ' + open.toString() + ' - SELL')
        }
        gridTransationProvider.createTransaction(0.002, crossedGrid, transactionType)
      }

      // check that on the lower level is exists an active transaction to fulfill it
      if(gridTransationProvider.isTypedTransactionExists(previousGrid, 'buy')) {
        balanceProvider.changeBtcToUsdt(0.002, crossedGrid)
        gridTransationProvider.fulfillTransaction(crossedGrid)
        balanceProvider.printBalance('FULFILL, BUY')
        ++counter;
      }

      // check that on the higher level is exists an active transaction to fulfill it
      if(gridTransationProvider.isTypedTransactionExists(nextGrid, 'sell')) {
        balanceProvider.changeUsdtToBtc(crossedGrid * 0.002, crossedGrid)
        gridTransationProvider.fulfillTransaction(crossedGrid)
        balanceProvider.printBalance('FULFILL, SELL')
        ++counter;
      }
    }
  }
  balanceProvider.printBalance()
  console.log('Number of fullfills: ' + counter)
}

grid_backtester()