const SupportedCoinPairs = require('../utils/supported_coin_pairs.js')

const arePairsValidAndSupported = (base, exchange) => {
  const supportedPairs = new SupportedCoinPairs()
  return supportedPairs.isPairSupported(exchange + '_' + base)
    ? null
    : 'this pairs are not supported. You can get the supported pairs on the /supportedPairs endpoint'
}

const isTimeIntervalCorrect = (fromSettings, toSettings, base, exchange) => {
  const { from, to } = (new SupportedCoinPairs()).getSupportedPairs()[(exchange + '_' + base)]

  if(fromSettings >= from && fromSettings <= to && toSettings >= from && toSettings <= to) {
    return null
  } else {
    return 'time interval is not correct/supported'
  }
}

const isMinMaxValueValid = (min, max) => {
  return typeof min === 'number' && typeof max === 'number' && min >= 0 && max >= 0 ? null : 'min or/and max value are not valid'
}

const isNumberOfGridsValueValid = (numberOfGrids) => {
  return typeof numberOfGrids === 'number' && Number.isInteger(numberOfGrids) && numberOfGrids >= 3 ? null : 'invalid numberOfGrids value';
}

const isTradingVolumePerLineValid = (tradingVolumePerLine) => {
  return typeof tradingVolumePerLine === 'number' && tradingVolumePerLine >= 0 ? null : 'invalid tradingVolumePerLine value';
}

const isExchangeFeeValid = (fee) => {
  return (((typeof fee) === 'number') && fee >= 0) ? null : 'invalid fee value';
}

const areParametersValid = (gridSettings) => {
  const {
    fromTimestamp,
    toTimestamp,
    baseCurrency,
    exchangeCurrency,
    min,
    max,
    numberOfGrids,
    exchangeTradingVolumePerLine,
    exchangeFee } = gridSettings

  const errorPair = arePairsValidAndSupported(baseCurrency, exchangeCurrency)
  var errorInterval
  if(errorPair == null) {
    errorInterval = isTimeIntervalCorrect(fromTimestamp, toTimestamp, baseCurrency, exchangeCurrency)

  }
  const errorMinMax = isMinMaxValueValid(min, max)
  const errorNumberOfGrids = isNumberOfGridsValueValid(numberOfGrids)
  const errorTradingVolumePerLine = isTradingVolumePerLineValid(exchangeTradingVolumePerLine)
  const errorExchangeFee = isExchangeFeeValid(exchangeFee)

  var errorMessage = ''

  if(errorPair) {
    errorMessage = errorMessage + errorPair + '; '
  }
  if(!errorPair && errorInterval) {
    errorMessage = errorMessage + errorInterval + '; '
  }
  if(errorMinMax) {
    errorMessage = errorMessage + errorMinMax + '; '
  }
  if(errorNumberOfGrids) {
    errorMessage = errorMessage + errorNumberOfGrids + '; '
  }
  if(errorTradingVolumePerLine) {
    errorMessage = errorMessage + errorTradingVolumePerLine + '; '
  }
  if(errorExchangeFee) {
    errorMessage = errorMessage + errorExchangeFee + '; '
  }
  console.log(errorMessage)
  const error = errorMessage == '' ? null : errorMessage

  return {
    areParametersCorrect: error == null,
    error: error.trim()
  }
}

module.exports = {
  areParametersValid: areParametersValid
}