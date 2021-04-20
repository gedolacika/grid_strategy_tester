
const getTypeOfOrder = (currentCandle, previousCandle, gridLineValue, gridLines) => {
  if(gridLineValue == getLowestGrid(gridLines)) {
    return 'buy'
  }
  if(gridLineValue == getHighestGrid(gridLines)) {
    return 'sell'
  }
  const { open, close, highest, lowest } = currentCandle

  if(
    previousCandle.open >= gridLineValue &&
    previousCandle.close >= gridLineValue &&
    previousCandle.highest >= gridLineValue &&
    previousCandle.lowest >= gridLineValue
  ) {
    return 'sell';
  } else if(
    previousCandle.open <= gridLineValue &&
    previousCandle.close <= gridLineValue &&
    previousCandle.highest <= gridLineValue &&
    previousCandle.lowest <= gridLineValue
  ) {
    return 'buy';
  }
  return open < close ? 'buy' : 'sell';
}

const getLowestGrid = (gridLines) => Math.min.apply(Math, gridLines)

const getHighestGrid = (gridLines) => Math.max.apply(Math, gridLines)

module.exports = {
  getTypeOfOrder: getTypeOfOrder
}