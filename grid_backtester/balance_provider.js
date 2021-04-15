

class BalanceProvider {

    #currencyPrecisions = {
        USDT: 2,
        BTC: 6,
        WAVES: 4,
        BNB: 5
    }

    constructor(initialBaseValue = 3016.0, initialExchangeValue = 0.05, baseCurrency = 'USDT', exchangeCurrency = 'BTC', isLoggingEnabled = true) {
        this.baseCurrency = initialBaseValue
        this.exchange = initialExchangeValue
        this.changeFee = 0.001
        this.basePrecision = this.#currencyPrecisions[baseCurrency] == null ? 2 : this.#currencyPrecisions[baseCurrency]
        this.exchangePrecision = this.#currencyPrecisions[exchangeCurrency] == null ? 2 : this.#currencyPrecisions[exchangeCurrency]
        this.isLoggingEnabled = isLoggingEnabled
    }

    changeBaseToExchange(baseToChange, changeRate) {
        var isTransactionSuccessed = false
        if (this.baseCurrency >= baseToChange) {
            var baseAfterFee = baseToChange * (1 - this.changeFee);
            var exchangeValue = baseAfterFee / changeRate;

            this.baseCurrency = parseFloat((this.baseCurrency - baseToChange).toFixed(2));
            this.exchange = parseFloat((this.exchange + exchangeValue).toFixed(6));
            isTransactionSuccessed = true;
        }
        this.#printTransaction(isTransactionSuccessed, 'BASE -> EXCHANGE', baseToChange, exchangeValue, changeRate)
        return isTransactionSuccessed;
    }

    changeExchangeToBase(exchangeToChange, changeRate) {
        var isTransactionSuccessed = false
        if (this.exchange >= exchangeToChange) {
            var exchangeAfterFee = exchangeToChange * (1 - this.changeFee);
            var baseValue = exchangeAfterFee * changeRate;

            this.baseCurrency = parseFloat((this.baseCurrency + baseValue).toFixed(2));
            this.exchange = parseFloat((this.exchange - exchangeToChange).toFixed(6));
            isTransactionSuccessed = true;
        }
        this.#printTransaction(isTransactionSuccessed, 'EXCHANGE -> BASE', exchangeToChange, baseValue, changeRate)
        return isTransactionSuccessed;
    }

    printBalance(additionalMessage = '') {
        if(additionalMessage == '') {
            console.log('BASE: ' + this.baseCurrency.toString() + '; EXCHANGE: ' + this.exchange.toString())
        } else {
            console.log(additionalMessage + '; BASE: ' + this.baseCurrency.toString() + '; EXCHANGE: ' + this.exchange.toString())
        }
    }

    #printTransaction(isTransactionSuccessed, transactionDirection, fromValue, toValue, rate) {
        if(this.isLoggingEnabled) {
            if(isTransactionSuccessed) {
                console.log('Successfull transaction: direction: ' + transactionDirection + ', rate: ' + rate + ', from: ' + fromValue + ', to: ' + toValue)
            }
            else {
                console.log('ERROR - unsuccessfull transaction')
            }
        }
    }

}

module.exports = BalanceProvider