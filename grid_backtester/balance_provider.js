

class BalanceProvider {

    constructor() {
        this.usdt = 3016.0
        this.btc = 0.05
        this.changeFee = 0.001
    }

    changeUsdtToBtc(usdtToChange, changeRate) {
        if (this.usdt >= usdtToChange) {
            var usdtAfterFee = usdtToChange * (1 - this.changeFee);
            var btcValue = usdtAfterFee / changeRate;

            this.usdt = parseFloat((this.usdt - usdtToChange).toFixed(2));
            this.btc = parseFloat((this.btc + btcValue).toFixed(6));
        }
    }

    changeBtcToUsdt(btcToChange, changeRate) {
        if (this.btc >= btcToChange) {
            var btcAfterFee = btcToChange * (1 - this.changeFee);
            var usdtValue = btcAfterFee * changeRate;

            this.usdt = parseFloat((this.usdt + usdtValue).toFixed(2));
            this.btc = parseFloat((this.btc - btcToChange).toFixed(6));
        }
    }

    printBalance(additionalMessage = '') {
        if(additionalMessage == '') {
            console.log('USDT: ' + this.usdt.toString() + '; BTC: ' + this.btc.toString())
        } else {
            console.log(additionalMessage + '; USDT: ' + this.usdt.toString() + '; BTC: ' + this.btc.toString())
        }
    }

}

module.exports = BalanceProvider