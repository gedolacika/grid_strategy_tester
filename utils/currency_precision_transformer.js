const precisions = require('./currency_precisions').currencyPrecisions

const transformer = (value, currency) => {
    const precision = precisions[currency];
    return precision != null ? parseFloat(value.toFixed(precision)) : null;
}

module.exports = {
    transformer: transformer
}