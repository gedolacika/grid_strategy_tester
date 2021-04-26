const cryptoReaderFromFile = require('../utils/file').readCrypto
const cryptoReaderByDate = require('../utils/file').readCryptoByDate
const BalanceProvider = require('./balance_provider')
const GridSignalProvider = require('./grid_signal_provider')
const GridTransactionProvider = require('./grid_transaction_provider')
const getTypeOfOrder = require('../utils/candle_counter_utils').getTypeOfOrder
const precisionTransformer = require('../utils/currency_precision_transformer').transformer

const grid_backtester = async (gridSettings) => {
  // flag for logging if it required for development process
  const isLoggingEnabled = gridSettings.isLoggingEnabled

  //create the object for future expansion and return at the end of the simulation
  var test_result = {
    settings: gridSettings
  }

  // the initial required balance in the exchange and base currencies
  // calculated based on the following equation: (numberOfGrids - 1) * oneTimeChange
  const initialExchangeValue = (gridSettings.numberOfGrids - 1) * gridSettings.exchangeTradingVolumePerLine
  const initialBaseValue = initialExchangeValue * gridSettings.max

  // add the initial wallet details to the return object
  test_result = {
    ...test_result,
    initialBalance: {
      base: initialBaseValue,
      exchange: initialExchangeValue
    }
  }

  // read crypto rate changes from file
  const cryptoExchangeRateChanges = await cryptoReaderByDate(
    gridSettings.fromTimestamp,
    gridSettings.toTimestamp,
    gridSettings.baseCurrency,
    gridSettings.exchangeCurrency
  )

  // create the balance provider and pass the initial balance to manage the virtual balance
  const balanceProvider = new BalanceProvider(
    initialBaseValue,
    initialExchangeValue,
    gridSettings.baseCurrency,
    gridSettings.exchangeCurrency,
    isLoggingEnabled
  );

  // create the instance of the GridSignalProvider class to get signal for opening buy and sell orders 
  const gridSignalProvider = new GridSignalProvider(gridSettings.min, gridSettings.max, gridSettings.numberOfGrids);

  // create the instance of the GridTransactionProvider to manage the transaction (create, fulfill, log)
  const gridTransationProvider = new GridTransactionProvider(
    gridSettings.min,
    gridSettings.max,
    gridSettings.numberOfGrids,
    isLoggingEnabled
  );

  isLoggingEnabled && balanceProvider.printBalance()

  // variable for storing the fulfilled orders // in the future it should be renamed and moved to the GridTransactionProvider class
  var counter = 0
  
  // adding the all transactions of the to show the users, how the simulation worked to check and understand it   
  var transactions = []

  // run the simulation
  for (let i = 1; i < cryptoExchangeRateChanges.length; i++) {
    // current  exchange rate (japanese candle)
    const element = cryptoExchangeRateChanges[i];

    // previous exchange rate to check precisiously that the rate what direction crossed the grid line
    const previousElement = cryptoExchangeRateChanges[i - 1];
    const { timestamp, open, highest, lowest, close, volume } = element

    // check that the current rate is crosses a grid line
    if (gridSignalProvider.isCrossedWithGridLine(element)) {
      // crossed grid line and the upper and lower grid lines; if it is the highest or the lowest than each of previous or next is null
      const crossedGrid = gridSignalProvider.getCrossedGrid(element)
      const previousGrid = gridSignalProvider.getPreviousCrossedGrid(crossedGrid)
      const nextGrid = gridSignalProvider.getNextCrossedGrid(crossedGrid, i)
      
      // check that on the lower level is exists an active transaction to fulfill it
      if (gridTransationProvider.isTypedTransactionExists(previousGrid, 'buy', i)) {
        // create transaction object for adding to the transaction list in the transaction field of the return object
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

        // change back the bought exchange value to base value; bought exchange on the lower grid line and now sell on the current(higher price)  
        balanceProvider.changeExchangeToBase(gridSettings.exchangeTradingVolumePerLine, crossedGrid)
        transaction = {
          ...transaction,
          balanceAfterTransaction: {
            base: balanceProvider.baseCurrency,
            exchange: balanceProvider.exchange
          }
        }

        // clear the transaction from the active transactions list
        gridTransationProvider.fulfillTransaction(previousGrid)
        isLoggingEnabled && balanceProvider.printBalance('FULFILL, BUY - iteration: ' + i + ', time: ' + (new Date(timestamp).toUTCString()) + ', onGrid: ' + crossedGrid + ', prevGrid: ' + previousGrid + ' -')
        if(i < 250) { gridTransationProvider.printActiveTransactions() }
        isLoggingEnabled && console.log('')
        transactions.push(transaction)
        ++counter;
      }

      // check that on the higher level is exists an active transaction to fulfill it
      if (gridTransationProvider.isTypedTransactionExists(nextGrid, 'sell', i)) {
        // create transaction object for adding to the transaction list in the transaction field of the return object
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

        // buy back the sold exchange value from base value; sold exchange on the higher grid line and now buy back on the current(lower price)  
        balanceProvider.changeBaseToExchange(crossedGrid * gridSettings.exchangeTradingVolumePerLine, crossedGrid)
        transaction = {
          ...transaction,
          balanceAfterTransaction: {
            base: balanceProvider.baseCurrency,
            exchange: balanceProvider.exchange
          }
        }

        // clear the transaction from the active transactions list
        gridTransationProvider.fulfillTransaction(nextGrid)
        isLoggingEnabled && balanceProvider.printBalance('FULFILL, SELL - iteration: ' + i + ', time: ' + (new Date(timestamp).toUTCString()) + ', onGrid: ' + crossedGrid + ', nextGrid: ' + nextGrid + ' -')
        if(isLoggingEnabled && i < 250) { gridTransationProvider.printActiveTransactions() }
        transactions.push(transaction)
        ++counter;
      }

      // check that at the current level is exists already a transaction
      // if not have than create one
      if (!gridTransationProvider.isTransactionExists(gridSignalProvider.getCrossedGrid(element))) {
        // check that the price rate from what direction crossed the grid line (if up to down than it will be sell and inverse buy) 
        const transactionType = getTypeOfOrder(element, previousElement, crossedGrid ,gridSignalProvider.gridLines);
        // create transaction object for adding to the transaction list in the transaction field of the return object
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
        
        // buy or sell exchange or base currency based on crossing direction
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

        // if the wallet is enough than the transaction will be succeeded and than have to put the order into the active transactions list
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

  // finish the result object
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
    totalProfitRate: precisionTransformer((test_result.totalProfit * 100 / initialBalanceValue), gridSettings.baseCurrency) + ' %'
  }
  if(gridSettings.isTransactionsHaveToBeReturned) {
    test_result = {
      ...test_result,
      transactions : transactions
    }
  }

  isLoggingEnabled && balanceProvider.printBalance()
  isLoggingEnabled && console.log('Number of fullfills: ' + counter)
  isLoggingEnabled && console.log('Initial balance value: ' + initialBalanceValue)
  isLoggingEnabled && console.log('Finished balance value: ' + endBalanceValue)
  isLoggingEnabled && console.log('The wallet increase rate: ' + ((endBalanceValue * 100 / initialBalanceValue) - 100).toFixed(2) + ' %')
  isLoggingEnabled && console.log('Initial balance: ' + initialBaseValue + ', ' + initialExchangeValue)
  isLoggingEnabled && console.log('Results: ')
  // console.log(test_result)

  // return the result back to the caller function
  return test_result
}

module.exports = {
  grid_backtester: grid_backtester
}
