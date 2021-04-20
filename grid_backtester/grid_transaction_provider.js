

class GridTransactionProvider {
    
    constructor(min = 9000, max = 11000, numberOfGrids = 10){
        this.activeTransactions = []
        this.maxValue = max
        this.minValue = min
        this.numberOfGrids = numberOfGrids
        this.gridHeight = parseFloat(((this.maxValue - this.minValue) / (this.numberOfGrids - 1)).toFixed(2));
    }

    isTransactionExists(exchangeRate) {
        return this.activeTransactions.filter(element => element.exchangeRate == exchangeRate).length == 1;
    }

    isTypedTransactionExists(exchangeRate, transactionType, i) {
        return this.activeTransactions
            .filter(element => element.exchangeRate == exchangeRate && element.transactionType == transactionType)
            .length == 1;
    }

    // transactionType: buy/sell
    createTransaction(volume, exchangeRate, transactionType, iteration) {
        this.activeTransactions.push({
            volume: volume,
            exchangeRate: exchangeRate,
            transactionType: transactionType,
            iteration: iteration
        })
    }

    fulfillTransaction(exchangeRate) {
        var indexToRemove;
        for (let i = 0; i < this.activeTransactions.length; i++) {
            if(this.activeTransactions[i].exchangeRate == exchangeRate) {
                indexToRemove = i;
                break;
            }
        }
        if(indexToRemove != null) {
            this.activeTransactions.splice(indexToRemove, 1);
        }
    }

    printTransaction(index) {
        if(index < this.activeTransactions.length) {
            const { volume, exchangeRate, transactionType } = this.activeTransactions[index];
            console.log('Exchange rate: ' + exchangeRate + ', volume: ' + volume + ', transactionType: ' + transactionType);
        }
    }

    printActiveTransactions() {
        console.log('     --- Active transactions ---')
        this.activeTransactions.forEach(({ exchangeRate, volume, transactionType, iteration }) => console.log('Exchange rate: ' + exchangeRate + ', volume: ' + volume + ', transactionType: ' + transactionType + ', createdIteration: ' + iteration)
        )
        console.log('               -----')
    }
}

module.exports = GridTransactionProvider