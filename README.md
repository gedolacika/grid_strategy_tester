# Grid strategy tester

small desc about software

## Generic grid trading stratedy
how it works...
statistics, what is it required...

## Grid trading strategy what I implemented
how it works...
statistics, what is it required...
why it is better then the basic

## Endpoints

The port is 3000 by default but it can change for whatever free port

### /
It runs the test and returns the result.

#### Parameters

|            Name              |     Type    | Default | Required |     Example   |                       Description                        |
| ---------------------------- | ----------- | ------- | -------- | ------------- | -------------------------------------------------------- |
| fromTimestamp                |     int     |    -    |   true   | 1609459200000 | starting time in millis of the time interval             |
| toTimestamp                  |     int     |    -    |   true   | 1617235140000 | ending time in millis of the time interval               |
| baseCurrency                 |    string   |    -    |   true   |     'USDT'    | the currency where the profit will save                  |
| exchangeCurrency             |    string   |    -    |   true   |     'BTC'     | the other currency for trading                           |
| min                          | int / float |    -    |   true   |     30000     | the lowest price of the grid; the bottom line            |
| max                          | int / float |    -    |   true   |     60000     | the highest price of the grid; the top line              |
| numberOfGrids                |     int     |    -    |   true   |       33      | number of lines in the grid                              |
| exchangeTradingVolumePerLine |    float    |    -    |   true   |      0.01     | the exchange trading volume for each grid line           |
| exchangeFee                  |    float    |  0.001  |   false  |     0.001     | the fee of the various exchanges; the binance is default |

### /supportedPairs

The currently supported pairs with intervals

|  Symbol  |       Supported starting time      |        Supported ending time       |
| -------- |----------------|-------------------|----------------|-------------------|
|          |  Milliseconds  |      DateTime     |  Milliseconds  |      DateTime     | 
| -------- |----------------|-------------------|----------------|-------------------|
| USDT/BTC |  1609459200000 | 2021.01.01; 00:00 |  1617235140000 | 2021.03.31; 23:59 |

### Parameters
description for each parameter
example

### Example for call
simple bash example

```bash
curl 'localhost:300/'
```
