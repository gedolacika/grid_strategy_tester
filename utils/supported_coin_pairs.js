
class SupportedCoinPairs {
    #supportedPairs = {
        BTC_USDT: {
            from: 1609459200000,
            to: 1617235140000,
            reversed: false
        }
    }

    getSupportedPairs() {
        return this.#supportedPairs;
    }

    isPairSupported(pair) {
        return this.#supportedPairs[pair] != null
    }

}

module.exports = SupportedCoinPairs