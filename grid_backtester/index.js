const cryptoReaderFromFile = require('../utils/file').readCrypto
const BalanceProvider = require('./balance_provider')
const GridSignalProvider = require('./grid_signal_provider')
const GridTransactionProvider = require('./grid_transaction_provider')
const getTypeOfOrder = require('../utils/candle_counter_utils').getTypeOfOrder

const gridSettings = {
  min: 50000,
  max: 60000,
  numberOfGrids: 11,
  initialBaseValue: 1200.0, // (numberOfGrids - 1) * oneTimeChange
  initialExchangeValue: 0.02 // (numberOfGrids - 1) * oneTimeChange
}

const grid_backtester = async () => {
  const cryptoExchangeRateChanges = await cryptoReaderFromFile('exchange_rates/usdt_btc/2021/2021_march_1min_usdt_btc.csv')
  const balanceProvider = new BalanceProvider(gridSettings.initialBaseValue, gridSettings.initialExchangeValue);
  const gridSignalProvider = new GridSignalProvider(gridSettings.min, gridSettings.max, gridSettings.numberOfGrids);
  const gridTransationProvider = new GridTransactionProvider(gridSettings.min, gridSettings.max, gridSettings.numberOfGrids);

  balanceProvider.printBalance()
  var counter = 0

  for (let i = 1; i < cryptoExchangeRateChanges.length; i++) {
    const element = cryptoExchangeRateChanges[i];
    const previousElement = cryptoExchangeRateChanges[i - 1];
    const { timestamp, open, highest, lowest, close, volume } = element

    if (gridSignalProvider.isCrossedWithGridLine(element)) {
      const crossedGrid = gridSignalProvider.getCrossedGrid(element)
      const previousGrid = gridSignalProvider.getPreviousCrossedGrid(crossedGrid)
      const nextGrid = gridSignalProvider.getNextCrossedGrid(crossedGrid, i)
      
      // check that on the lower level is exists an active transaction to fulfill it
      if (gridTransationProvider.isTypedTransactionExists(previousGrid, 'buy', i)) {
        console.log('')
        balanceProvider.changeExchangeToBase(0.002, crossedGrid)
        gridTransationProvider.fulfillTransaction(previousGrid)
        balanceProvider.printBalance('FULFILL, BUY - iteration: ' + i + ', time: ' + (new Date(timestamp).toUTCString()) + ', onGrid: ' + crossedGrid + ', prevGrid: ' + previousGrid + ' -')
        if(i < 250) { gridTransationProvider.printActiveTransactions() }
        console.log('')
        ++counter;
      }

      // check that on the higher level is exists an active transaction to fulfill it
      if (gridTransationProvider.isTypedTransactionExists(nextGrid, 'sell', i)) {
        balanceProvider.changeBaseToExchange(crossedGrid * 0.002, crossedGrid)
        gridTransationProvider.fulfillTransaction(nextGrid)
        balanceProvider.printBalance('FULFILL, SELL - iteration: ' + i + ', time: ' + (new Date(timestamp).toUTCString()) + ', onGrid: ' + crossedGrid + ', nextGrid: ' + nextGrid + ' -')
        if(i < 250) { gridTransationProvider.printActiveTransactions() }
        ++counter;
      }

      // check that at the current level is exists already a transaction
      // if not have to create one
      if (!gridTransationProvider.isTransactionExists(gridSignalProvider.getCrossedGrid(element))) {
        const transactionType = getTypeOfOrder(element, previousElement, crossedGrid ,gridSignalProvider.gridLines);
        var isSuccessedTransaction = false
        console.log('------ CREATE  ORDER -----')
        if (transactionType == 'buy') {
          isSuccessedTransaction = balanceProvider.changeBaseToExchange(crossedGrid * 0.002, crossedGrid);
        }
        if (transactionType == 'sell') {
          isSuccessedTransaction = balanceProvider.changeExchangeToBase(0.002, crossedGrid);
        }
        if (isSuccessedTransaction) {
          balanceProvider.printBalance(i + ' - ' + (new Date(timestamp).toUTCString()) + ' - ' + open.toString() + ' - ' + transactionType.toUpperCase() + ' - crossed grid:' + crossedGrid)
          gridTransationProvider.createTransaction(0.002, crossedGrid, transactionType, i)
        }
        if(i < 250) { gridTransationProvider.printActiveTransactions() }
        console.log('------ END CREATION OF ORDER -----')
        console.log('')
      }
    }
  }

  // the exchange rate of what we calculate the profit
  const countingRate = cryptoExchangeRateChanges[0].close

  // the initial wallet value
  const initialBalanceValue = gridSettings.initialBaseValue + gridSettings.initialExchangeValue * countingRate

  // the wallet value after the gridbot runs
  const endBalanceValue = balanceProvider.baseCurrency + balanceProvider.exchange * countingRate
  balanceProvider.printBalance()
  console.log('Number of fullfills: ' + counter)
  console.log('Initial balance value: ' + initialBalanceValue)
  console.log('Finished balance value: ' + endBalanceValue)
  console.log('The wallet increase rate: ' + ((endBalanceValue * 100 / initialBalanceValue) - 100).toFixed(2) + ' %')
}

grid_backtester()