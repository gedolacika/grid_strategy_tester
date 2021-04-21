const cryptoReaderFromFile = require('../utils/file').readCrypto
const cryptoReaderByDate = require('../utils/file').readCryptoByDate
const BalanceProvider = require('./balance_provider')
const GridSignalProvider = require('./grid_signal_provider')
const GridTransactionProvider = require('./grid_transaction_provider')
const getTypeOfOrder = require('../utils/candle_counter_utils').getTypeOfOrder
const precisionTransformer = require('../utils/currency_precision_transformer').transformer

const grid_backtester = async (gridSettings) => {
  const isLoggingEnabled = gridSettings.isLoggingEnabled
  var test_result = {
    settings: gridSettings
  }
   // (numberOfGrids - 1) * oneTimeChange
  const initialExchangeValue = (gridSettings.numberOfGrids - 1) * gridSettings.exchangeTradingVolumePerLine
   // (numberOfGrids - 1) * oneTimeChange
  const initialBaseValue = initialExchangeValue * gridSettings.max
  test_result = {
    ...test_result,
    initialBalance: {
      base: initialBaseValue,
      exchange: initialExchangeValue
    }
  }
  const cryptoExchangeRateChanges = await cryptoReaderByDate(
    gridSettings.fromTimestamp,
    gridSettings.toTimestamp,
    gridSettings.baseCurrency,
    gridSettings.exchangeCurrency
  )
  const balanceProvider = new BalanceProvider(
    initialBaseValue,
    initialExchangeValue,
    gridSettings.baseCurrency,
    gridSettings.exchangeCurrency,
    isLoggingEnabled
  );
  const gridSignalProvider = new GridSignalProvider(gridSettings.min, gridSettings.max, gridSettings.numberOfGrids);
  const gridTransationProvider = new GridTransactionProvider(
    gridSettings.min,
    gridSettings.max,
    gridSettings.numberOfGrids,
    isLoggingEnabled
  );

  isLoggingEnabled && balanceProvider.printBalance()
  var counter = 0
  
  var transactions = []
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
        var transaction = {
          balanceBeforeTransaction: {
            base: balanceProvider.baseCurrency,
            exchange: balanceProvider.exchange
          },
          action: 'fulfill',
          type: 'buy',
          timestamp: timestamp,
          time: new Date(timestamp).toUTCString(),
          crossedGridLine: crossedGrid,
          previousGridLine: previousGrid,
          previousChange: {
            base: previousGrid * gridSettings.exchangeTradingVolumePerLine,
            fee: previousGrid * gridSettings.exchangeTradingVolumePerLine * gridSettings.exchangeFee,
            totalRequiredBase:
              previousGrid * gridSettings.exchangeTradingVolumePerLine +
              previousGrid * gridSettings.exchangeTradingVolumePerLine * gridSettings.exchangeFee,
            toExchange: gridSettings.exchangeTradingVolumePerLine
          },
          currentChange: {
            exchange: gridSettings.exchangeTradingVolumePerLine,
            fee: gridSettings.exchangeTradingVolumePerLine * gridSettings.exchangeFee,
            toBase:
              crossedGrid *
              (gridSettings.exchangeTradingVolumePerLine - gridSettings.exchangeTradingVolumePerLine * gridSettings.exchangeFee)
          },
          profit: precisionTransformer((
            (
            (
              crossedGrid *
              (gridSettings.exchangeTradingVolumePerLine - gridSettings.exchangeTradingVolumePerLine * gridSettings.exchangeFee)
            )
            -
            (
              previousGrid * gridSettings.exchangeTradingVolumePerLine +
              previousGrid * gridSettings.exchangeTradingVolumePerLine * gridSettings.exchangeFee
            )
          )
          ), gridSettings.baseCurrency) + ' ' + gridSettings.baseCurrency
        }
        isLoggingEnabled && console.log('')
        balanceProvider.changeExchangeToBase(gridSettings.exchangeTradingVolumePerLine, crossedGrid)
        transaction = {
          ...transaction,
          balanceAfterTransaction: {
            base: balanceProvider.baseCurrency,
            exchange: balanceProvider.exchange
          }
        }
        gridTransationProvider.fulfillTransaction(previousGrid)
        isLoggingEnabled && balanceProvider.printBalance('FULFILL, BUY - iteration: ' + i + ', time: ' + (new Date(timestamp).toUTCString()) + ', onGrid: ' + crossedGrid + ', prevGrid: ' + previousGrid + ' -')
        if(i < 250) { gridTransationProvider.printActiveTransactions() }
        isLoggingEnabled && console.log('')
        transactions.push(transaction)
        ++counter;
      }

      // check that on the higher level is exists an active transaction to fulfill it
      if (gridTransationProvider.isTypedTransactionExists(nextGrid, 'sell', i)) {
        var transaction = {
          balanceBeforeTransaction: {
            base: balanceProvider.baseCurrency,
            exchange: balanceProvider.exchange
          },
          action: 'fulfill',
          type: 'sell',
          timestamp: timestamp,
          time: new Date(timestamp).toUTCString(),
          crossedGridLine: crossedGrid,
          previousGridLine: nextGrid,
          previousChange: {
            exchange: gridSettings.exchangeTradingVolumePerLine,
            fee: gridSettings.exchangeTradingVolumePerLine * gridSettings.exchangeFee,
            toBase:
              nextGrid *
              (gridSettings.exchangeTradingVolumePerLine - gridSettings.exchangeTradingVolumePerLine * gridSettings.exchangeFee)
          },
          currentChange: {
            base: crossedGrid * gridSettings.exchangeTradingVolumePerLine,
            fee: crossedGrid * gridSettings.exchangeTradingVolumePerLine * gridSettings.exchangeFee,
            taxedBaseBalanceToChange:
              crossedGrid * gridSettings.exchangeTradingVolumePerLine -
              crossedGrid * gridSettings.exchangeTradingVolumePerLine * gridSettings.exchangeFee,
            toExchange: gridSettings.exchangeTradingVolumePerLine
          },
          profit: precisionTransformer((
            (
            (
              nextGrid *
              (gridSettings.exchangeTradingVolumePerLine - gridSettings.exchangeTradingVolumePerLine * gridSettings.exchangeFee)
            )
            -
            (
              crossedGrid * gridSettings.exchangeTradingVolumePerLine -
              crossedGrid * gridSettings.exchangeTradingVolumePerLine * gridSettings.exchangeFee
            )
          )
          ), gridSettings.baseCurrency) + ' ' + gridSettings.baseCurrency
        }
        balanceProvider.changeBaseToExchange(crossedGrid * gridSettings.exchangeTradingVolumePerLine, crossedGrid)
        transaction = {
          ...transaction,
          balanceAfterTransaction: {
            base: balanceProvider.baseCurrency,
            exchange: balanceProvider.exchange
          }
        }
        gridTransationProvider.fulfillTransaction(nextGrid)
        isLoggingEnabled && balanceProvider.printBalance('FULFILL, SELL - iteration: ' + i + ', time: ' + (new Date(timestamp).toUTCString()) + ', onGrid: ' + crossedGrid + ', nextGrid: ' + nextGrid + ' -')
        if(isLoggingEnabled && i < 250) { gridTransationProvider.printActiveTransactions() }
        transactions.push(transaction)
        ++counter;
      }

      // check that at the current level is exists already a transaction
      // if not have to create one
      if (!gridTransationProvider.isTransactionExists(gridSignalProvider.getCrossedGrid(element))) {
        const transactionType = getTypeOfOrder(element, previousElement, crossedGrid ,gridSignalProvider.gridLines);
        var transaction = {
          balanceBeforeTransaction: {
            base: balanceProvider.baseCurrency,
            exchange: balanceProvider.exchange
          },
          action: 'create',
          type: transactionType,
          timestamp: timestamp,
          time: new Date(timestamp).toUTCString(),
          crossedGridLine: crossedGrid
        }
        var isSuccessedTransaction = false
        isLoggingEnabled && console.log('------ CREATE  ORDER -----')
        if (transactionType == 'buy') {
          isSuccessedTransaction = balanceProvider.changeBaseToExchange(crossedGrid * gridSettings.exchangeTradingVolumePerLine, crossedGrid);
        }
        if (transactionType == 'sell') {
          isSuccessedTransaction = balanceProvider.changeExchangeToBase(gridSettings.exchangeTradingVolumePerLine, crossedGrid);
        }
        transaction = {
          ...transaction,
          balanceAfterTransaction: {
            base: balanceProvider.baseCurrency,
            exchange: balanceProvider.exchange
          }
        }
        if (isSuccessedTransaction) {
          isLoggingEnabled && balanceProvider.printBalance(i + ' - ' + (new Date(timestamp).toUTCString()) + ' - ' + open.toString() + ' - ' + transactionType.toUpperCase() + ' - crossed grid:' + crossedGrid)
          gridTransationProvider.createTransaction(gridSettings.exchangeTradingVolumePerLine, crossedGrid, transactionType, i)
          transactions.push(transaction)
        }
        if(isLoggingEnabled && i < 250) { gridTransationProvider.printActiveTransactions() }
        isLoggingEnabled && console.log('------ END CREATION OF ORDER -----')
        isLoggingEnabled && console.log('')
      }
    }
  }
  // the exchange rate of what we calculate the profit
  const countingRate = cryptoExchangeRateChanges[0].close

  // the initial wallet value
  const initialBalanceValue = initialBaseValue + initialExchangeValue * countingRate

  // the wallet value after the gridbot runs
  const endBalanceValue = balanceProvider.baseCurrency + balanceProvider.exchange * countingRate

  const lastCloseRate = cryptoExchangeRateChanges[cryptoExchangeRateChanges.length - 1].close

  test_result = {
    ...test_result,
    endBalance: {
      base: balanceProvider.baseCurrency,
      exchange: balanceProvider.exchange
    },
    profitCountingRate: countingRate,
    initialBalanceValue: precisionTransformer((initialBalanceValue), gridSettings.baseCurrency), // based on the profitCountingRate
    endBalanceValue: precisionTransformer((endBalanceValue), gridSettings.baseCurrency), // based on the profitCountingRate
    profitInBase: precisionTransformer(((endBalanceValue - initialBalanceValue)), gridSettings.baseCurrency),
    increaseRate: (((endBalanceValue * 100 / initialBalanceValue) - 100).toFixed(2) + ' %'),
    walletValueAtTheEndOfTheTesting: {
      lastRate: lastCloseRate,
      endBalanceValue: precisionTransformer(
        (balanceProvider.baseCurrency + balanceProvider.exchange * lastCloseRate),
        gridSettings.baseCurrency
      ),
      profitFromInitialEndPriceChanges: 
        precisionTransformer(
          (
            ( balanceProvider.baseCurrency + balanceProvider.exchange * lastCloseRate ) -
            (endBalanceValue)
          ),
          gridSettings.baseCurrency
        )
    },
    totalProfit: precisionTransformer(
      (
        ( balanceProvider.baseCurrency + balanceProvider.exchange * lastCloseRate ) -
        initialBalanceValue
      ),
      gridSettings.baseCurrency
    )
  }
  test_result = {
    ...test_result,
    totalProfitRate: precisionTransformer((test_result.totalProfit * 100 / initialBalanceValue), gridSettings.baseCurrency) + ' %',
    transactions : transactions
  }

  isLoggingEnabled && balanceProvider.printBalance()
  isLoggingEnabled && console.log('Number of fullfills: ' + counter)
  isLoggingEnabled && console.log('Initial balance value: ' + initialBalanceValue)
  isLoggingEnabled && console.log('Finished balance value: ' + endBalanceValue)
  isLoggingEnabled && console.log('The wallet increase rate: ' + ((endBalanceValue * 100 / initialBalanceValue) - 100).toFixed(2) + ' %')
  isLoggingEnabled && console.log('Initial balance: ' + initialBaseValue + ', ' + initialExchangeValue)
  isLoggingEnabled && console.log('Results: ')
  // console.log(test_result)

  return test_result
}

module.exports = {
  grid_backtester: grid_backtester
}
