

class GridSignalProvider {
    constructor(min = 9000, max = 11000, numberOfGrids = 10, isLoggingEnabled = false) {
        this.numberOfGrids = numberOfGrids;
        this.minValue = min;
        this.maxValue = max;
        this.gridLines = []
        this.gridHeight = parseFloat(((this.maxValue - this.minValue) / (this.numberOfGrids - 1)).toFixed(2));
        this.#createGridLines()
        isLoggingEnabled && this.gridLines.reverse().forEach(element => console.log(element))
    }

    #createGridLines() {
        for (let i = 0; i < this.numberOfGrids; i++) {
            this.gridLines.push(this.minValue + (i * this.gridHeight));
        }
    }

    isCrossedWithGridLine(currentValue) {
        const { highest, lowest } = currentValue;
        var isCrossed = false
        this.gridLines.forEach((value, index, array) => {
            if(lowest < value && highest >= value) {
                isCrossed = true;
            }
        });
        return isCrossed;
    }
 
    getCrossedGrid(currentValue) {
        const { highest, lowest } = currentValue;
        var crossedGrid
        this.gridLines.forEach((value, index, array) => {
            if(lowest < value && highest >= value) {
                crossedGrid = value;
            }
        });
        return crossedGrid;
    }


    getPreviousCrossedGrid(crossedGrid) {
        var prevGrid = crossedGrid - this.gridHeight
        return prevGrid < this.minValue ? null : prevGrid;
    }

    getNextCrossedGrid(crossedGrid, i) {
        var nextGrid = crossedGrid + this.gridHeight
        return nextGrid > (this.maxValue + 1) ? null : nextGrid;
    }
}

module.exports = GridSignalProvider