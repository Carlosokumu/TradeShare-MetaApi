# metaapi.cloud SDK for node.js and browser javascript

MetaApi is a powerful, fast, cost-efficient, easy to use and standards-driven cloud forex trading API for MetaTrader 4 and MetaTrader 5 platform designed for traders, investors and forex application developers to boost forex application development process. MetaApi can be used with any broker and does not require you to be a brokerage.

CopyFactory is a simple yet powerful copy-trading API which is a part of MetaApi. See below for CopyFactory readme section.

MetaApi is a paid service, but API access to one MetaTrader account is free of charge.

The [MetaApi pricing](https://metaapi.cloud/#pricing) was developed with the intent to make your charges less or equal to what you would have to pay
for hosting your own infrastructure. This is possible because over time we managed to heavily optimize
our MetaTrader infrastructure. And with MetaApi you can save significantly on application development and
maintenance costs and time thanks to high-quality API, open-source SDKs and convenience of a cloud service.

Official REST and websocket API documentation: [https://metaapi.cloud/docs/client/](https://metaapi.cloud/docs/client/)

Please note that this SDK provides an abstraction over REST and websocket API to simplify your application logic.

For more information about SDK APIs please check esdoc documentation in source codes located inside lib folder of this npm package.

## Working code examples
Please check [this short video](https://youtu.be/dDOUWBjdfA4) to see how you can download samples via our web application.

You can also find code examples at [examples folder of our github repo](https://github.com/agiliumtrade-ai/metaapi-node.js-client/tree/master/examples) or in the examples folder of the npm package.

We have composed a [short guide explaining how to use the example code](https://metaapi.cloud/docs/client/usingCodeExamples/)

## Installation
```bash
npm install --save metaapi.cloud-sdk
```

## Installing SDK in browser SPA applications
```bash
npm install --save metaapi.cloud-sdk
```

## Installing SDK in browser HTML applications
```html
<script src="unpkg.com/metaapi.cloud-sdk/index.js"></script>
<script>
    const token = '...';
    const api = new MetaApi(token);
</script>
```

## Connecting to MetaApi
Please use one of these ways: 
1. [https://app.metaapi.cloud/token](https://app.metaapi.cloud/token) web UI to obtain your API token.
2. An account access token which grants access to a single account. See section below on instructions on how to retrieve account access token.

Supply token to the MetaApi class constructor.

```javascript
import MetaApi from 'metaapi.cloud-sdk';

const token = '...';
const api = new MetaApi(token);
```

## Retrieving account access token
Account access token grants access to a single account. You can retrieve account access token via API:
```javascript
let accountId = '...';
let account = await api.metatraderAccountApi.getAccount(accountId);
let accountAccessToken = account.accessToken;
console.log(accountAccessToken);
```

Alternatively, you can retrieve account access token via web UI on https://app.metaapi.cloud/accounts page (see [this video](https://youtu.be/PKYiDns6_xI)).

## Managing MetaTrader accounts (API servers for MT accounts)
Before you can use the API you have to add an MT account to MetaApi and start an API server for it.

### Managing MetaTrader accounts (API servers) via web UI
You can manage MetaTrader accounts here: [https://app.metaapi.cloud/accounts](https://app.metaapi.cloud/accounts)

### Create a MetaTrader account (API server) via API

#### Creating an account using automatic broker settings detection

To create an account, supply a request with account data and the platform field indicating the MetaTrader version.
Provisioning profile id must not be included in the request for automatic broker settings detection.

```javascript
try {
  const account = await api.metatraderAccountApi.createAccount({
    name: 'Trading account #1',
    type: 'cloud',
    login: '1234567',
    platform: 'mt4',
    // password can be investor password for read-only access
    password: 'qwerty',
    server: 'ICMarketsSC-Demo',
    application: 'MetaApi',
    magic: 123456,
    quoteStreamingIntervalInSeconds: 2.5, // set to 0 to receive quote per tick
    reliability: 'regular' // set this field to 'high' value if you want to increase uptime of your account (recommended for production environments)
  });
} catch (err) {
  // process errors
  if(err.details) {
    // returned if the server file for the specified server name has not been found
    // recommended to check the server name or create the account using a provisioning profile
    if(err.details === 'E_SRV_NOT_FOUND') {
      console.error(err);
    // returned if the server has failed to connect to the broker using your credentials
    // recommended to check your login and password
    } else if (err.details === 'E_AUTH') {
      console.log(err);
    // returned if the server has failed to detect the broker settings
    // recommended to try again later or create the account using a provisioning profile
    } else if (err.details === 'E_SERVER_TIMEZONE') {
      console.log(err);
    }
  }
}
```

If the settings have not yet been detected for the broker, the server will begin the process of detection, and you will receive a response with wait time:

```
Retrying request in 60 seconds because request returned message: Automatic broker settings detection is in progress, please retry in 60 seconds
```

The client will automatically retry the request when the recommended time passes.

#### Error handling
Several types of errors are possible during the request:

- Server file not found
- Authentication error
- Settings detection error

##### Server file not found
This error is returned if the server file for the specified server name has not been found. In case of this error it
is recommended to check the server name. If the issue persists, it is recommended to create the account using a
provisioning profile.

```json
{
  "id": 3,
  "error": "ValidationError",
  "message": "We were unable to retrieve the server file for this broker. Please check the server name or configure the provisioning profile manually.",
  "details": "E_SRV_NOT_FOUND"
}
```

##### Authentication error
This error is returned if the server has failed to connect to the broker using your credentials. In case of this
error it is recommended to check your login and password, and try again.

```json
{
  "id": 3,
  "error": "ValidationError",
  "message": "We failed to authenticate to your broker using credentials provided. Please check that your MetaTrader login, password and server name are correct.",
  "details": "E_AUTH"
}
```

##### Settings detection error
This error is returned if the server has failed to detect the broker settings. In case of this error it is recommended
to retry the request later, or create the account using a provisioning profile.

```json
{
  "id": 3,
  "error": "ValidationError",
  "message": "We were not able to retrieve server settings using credentials provided. Please try again later or configure the provisioning profile manually.",
  "details": "E_SERVER_TIMEZONE"
}
```

#### Creating an account using a provisioning profile
If creating the account with automatic broker settings detection has failed, you can create it using a [provisioning profile](#managing-provisioning-profiles).
To create an account using a provisioning profile, create a provisioning profile for the MetaTrader server, and then add the provisioningProfileId field to the request:

```javascript
const account = await api.metatraderAccountApi.createAccount({
  name: 'Trading account #1',
  type: 'cloud',
  login: '1234567',
  // password can be investor password for read-only access
  password: 'qwerty',
  server: 'ICMarketsSC-Demo',
  provisioningProfileId: provisioningProfile.id,
  application: 'MetaApi',
  magic: 123456,
  quoteStreamingIntervalInSeconds: 2.5, // set to 0 to receive quote per tick
  reliability: 'regular' // set this field to 'high' value if you want to increase uptime of your account (recommended for production environments)
});
```

### Retrieving existing accounts via API
```javascript
// filter and paginate accounts, see esdoc for full list of filter options available
const accounts = await api.metatraderAccountApi.getAccounts({
  limit: 10,
  offset: 0,
  query: 'ICMarketsSC-MT5',
  state: ['DEPLOYED']
});
// get accounts without filter (returns 1000 accounts max)
const accounts = await api.metatraderAccountApi.getAccounts();

const account = await api.metatraderAccountApi.getAccount('accountId');
```

### Updating an existing account via API
```javascript
await account.update({
  name: 'Trading account #1',
  login: '1234567',
  // password can be investor password for read-only access
  password: 'qwerty',
  server: 'ICMarketsSC-Demo',
  quoteStreamingIntervalInSeconds: 2.5 // set to 0 to receive quote per tick
});
```

### Removing an account
```javascript
await account.remove();
```

### Deploying, undeploying and redeploying an account (API server) via API
```javascript
await account.deploy();
await account.undeploy();
await account.redeploy();
```

### Manage custom experts (EAs)
Custom expert advisors can only be used for MT4 accounts on g1 infrastructure. EAs which use DLLs are not supported.

### Creating an expert advisor via API
You can use the code below to create an EA. Please note that preset field is a base64-encoded preset file.
```javascript
const expert = await account.createExpertAdvisor('expertId', {
  period: '1h',
  symbol: 'EURUSD',
  preset: 'a2V5MT12YWx1ZTEKa2V5Mj12YWx1ZTIKa2V5Mz12YWx1ZTMKc3VwZXI9dHJ1ZQ'
});
await expert.uploadFile('/path/to/custom-ea');
```

### Retrieving existing experts via API
```javascript
const experts = await account.getExpertAdvisors();
```

### Retrieving existing expert by id via API
```javascript
const expert = await account.getExpertAdvisor('expertId');
```

### Updating existing expert via API
You can use the code below to update an EA. Please note that preset field is a base64-encoded preset file.
```javascript
await expert.update({
  period: '4h',
  symbol: 'EURUSD',
  preset: 'a2V5MT12YWx1ZTEKa2V5Mj12YWx1ZTIKa2V5Mz12YWx1ZTMKc3VwZXI9dHJ1ZQ'
});
await expert.uploadFile('/path/to/custom-ea');
```

### Removing expert via API
```javascript
await expert.remove();
```

## Managing provisioning profiles
Provisioning profiles can be used as an alternative way to create MetaTrader accounts if the automatic broker settings detection has failed.

### Managing provisioning profiles via web UI
You can manage provisioning profiles here: [https://app.metaapi.cloud/provisioning-profiles](https://app.metaapi.cloud/provisioning-profiles)

### Creating a provisioning profile via API
```javascript
// if you do not have created a provisioning profile for your broker,
// you should do it before creating an account
const provisioningProfile = await api.provisioningProfileApi.createProvisioningProfile({
  name: 'My profile',
  version: 5,
  brokerTimezone: 'EET',
  brokerDSTSwitchTimezone: 'EET'
});
// servers.dat file is required for MT5 profile and can be found inside
// config directory of your MetaTrader terminal data folder. It contains
// information about available broker servers
await provisioningProfile.uploadFile('servers.dat', '/path/to/servers.dat');
// for MT4, you should upload an .srv file instead
await provisioningProfile.uploadFile('broker.srv', '/path/to/broker.srv');
```

### Retrieving existing provisioning profiles via API
```javascript
const provisioningProfiles = await api.provisioningProfileApi.getProvisioningProfiles();
const provisioningProfile = await api.provisioningProfileApi.getProvisioningProfile('profileId');
```

### Updating a provisioning profile via API
```javascript
await provisioningProfile.update({name: 'New name'});
// for MT5, you should upload a servers.dat file
await provisioningProfile.uploadFile('servers.dat', '/path/to/servers.dat');
// for MT4, you should upload an .srv file instead
await provisioningProfile.uploadFile('broker.srv', '/path/to/broker.srv');
```

### Removing a provisioning profile
```javascript
await provisioningProfile.remove();
```

## Access MetaTrader account via RPC API
RPC API let you query the trading terminal state. You should use
RPC API if you develop trading monitoring apps like myfxbook or other
simple trading apps.

### Query account information, positions, orders and history via RPC API
```javascript
const connection = account.getRPCConnection();

await connection.connect();
await connection.waitSynchronized();

// retrieve balance and equity
console.log(await connection.getAccountInformation());
// retrieve open positions
console.log(await connection.getPositions());
// retrieve a position by id
console.log(await connection.getPosition('1234567'));
// retrieve pending orders
console.log(await connection.getOrders());
// retrieve a pending order by id
console.log(await connection.getOrder('1234567'));
// retrieve history orders by ticket
console.log(await connection.getHistoryOrdersByTicket('1234567'));
// retrieve history orders by position id
console.log(await connection.getHistoryOrdersByPosition('1234567'));
// retrieve history orders by time range
console.log(await connection.getHistoryOrdersByTimeRange(startTime, endTime));
// retrieve history deals by ticket
console.log(await connection.getDealsByTicket('1234567'));
// retrieve history deals by position id
console.log(await connection.getDealsByPosition('1234567'));
// retrieve history deals by time range
console.log(await connection.getDealsByTimeRange(startTime, endTime));
```

### Query contract specifications and quotes via RPC API
```javascript
const connection = account.getRPCConnection();

await connection.connect();
await connection.waitSynchronized();

// first, subscribe to market data
await connection.subscribeToMarketData('GBPUSD');

// read symbols available
console.log(await connection.getSymbols());
// read constract specification
console.log(await connection.getSymbolSpecification('GBPUSD'));
// read current price
console.log(await connection.getSymbolPrice('GBPUSD'));

// unsubscribe from market data when no longer needed
await connection.unsubscribeFromMarketData('GBPUSD');
```

### Query historical market data via RPC API
Currently this API is supported on G1 and MT4 G2 only.

```javascript
// retrieve 1000 candles before the specified time
let candles = await account.getHistoricalCandles('EURUSD', '1m', new Date('2021-05-01'), 1000);

// retrieve 1000 ticks after the specified time
let ticks = account.getHistoricalTicks('EURUSD', new Date('2021-05-01'), 5, 1000);

// retrieve 1000 latest ticks
ticks = account.getHistoricalTicks('EURUSD', undefined, 0, 1000);
```

### Use real-time streaming API
Real-time streaming API is good for developing trading applications like trade copiers or automated trading strategies.
The API synchronizes the terminal state locally so that you can query local copy of the terminal state really fast.

#### Synchronizing and reading terminal state
```javascript
const account = await api.metatraderAccountApi.getAccount('accountId');
const connection = account.getStreamingConnection();
await connection.connect();

// access local copy of terminal state
const terminalState = connection.terminalState;

// wait until synchronization completed
await connection.waitSynchronized();

console.log(terminalState.connected);
console.log(terminalState.connectedToBroker);
console.log(terminalState.accountInformation);
console.log(terminalState.positions);
console.log(terminalState.orders);
// symbol specifications
console.log(terminalState.specifications);
console.log(terminalState.specification('EURUSD'));
console.log(terminalState.price('EURUSD'));

// access history storage
historyStorage = connection.historyStorage;

// both orderSynchronizationFinished and dealSynchronizationFinished
// should be true once history synchronization have finished
console.log(historyStorage.orderSynchronizationFinished);
console.log(historyStorage.dealSynchronizationFinished);

console.log(historyStorage.deals);
console.log(historyStorage.dealsByTicket(1));
console.log(historyStorage.dealsByPosition(1));
console.log(historyStorage.dealsByTimeRange(new Date(Date.now() - 24 * 60 * 60 * 1000), new Date());
console.log(historyStorage.historyOrders);
console.log(historyStorage.historyOrdersByTicket(1));
console.log(historyStorage.historyOrdersByPosition(1));
console.log(historyStorage.historyOrdersByTimeRange(new Date(Date.now() - 24 * 60 * 60 * 1000), new Date());
```

#### Overriding local history storage
By default history is stored in memory only. You can override history storage to save trade history to a persistent storage like MongoDB database.
```javascript
import {HistoryStorage} from 'metaapi.cloud-sdk';

class MongodbHistoryStorage extends HistoryStorage {
  // implement the abstract methods, see MemoryHistoryStorage for sample
  // implementation
}

let historyStorage = new MongodbHistoryStorage();

// Note: if you will not specify history storage, then in-memory storage
// will be used (instance of MemoryHistoryStorage)
const connection = account.getStreamingConnection(historyStorage);
await connection.connect();

// access history storage
historyStorage = connection.historyStorage;

// invoke other methods provided by your history storage implementation
console.log(await historyStorage.yourMethod());
```

#### Receiving synchronization events
You can override SynchronizationListener in order to receive synchronization event notifications, such as account/position/order/history updates or symbol quote updates.
```javascript
import {SynchronizationListener} from 'metaapi.cloud-sdk';

// receive synchronization event notifications
// first, implement your listener
class MySynchronizationListener extends SynchronizationListener {
  // override abstract methods you want to receive notifications for
}

// retrieving a connection
const connection = account.getStreamingConnection(historyStorage);

// now add the listener
const listener = new MySynchronizationListener();
connection.addSynchronizationListener(listener);

// open the connection after adding listeners
await connection.connect();

// remove the listener when no longer needed
connection.removeSynchronizationListener(listener);
```

### Retrieve contract specifications and quotes via streaming API
```javascript
const connection = account.getStreamingConnection();
await connection.connect();

await connection.waitSynchronized();

// first, subscribe to market data
await connection.subscribeToMarketData('GBPUSD');

// read constract specification
console.log(terminalState.specification('EURUSD'));
// read current price
console.log(terminalState.price('EURUSD'));

// unsubscribe from market data when no longer needed
await connection.unsubscribeFromMarketData('GBPUSD');
```

### Execute trades (both RPC and streaming APIs)
```javascript
const connection = account.getRPCConnection();
// or
const connection = account.getStreamingConnection();

await connection.connect();
await connection.waitSynchronized();

// trade
console.log(await connection.createMarketBuyOrder('GBPUSD', 0.07, 0.9, 2.0, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
console.log(await connection.createMarketSellOrder('GBPUSD', 0.07, 2.0, 0.9, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
console.log(await connection.createLimitBuyOrder('GBPUSD', 0.07, 1.0, 0.9, 2.0, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
console.log(await connection.createLimitSellOrder('GBPUSD', 0.07, 1.5, 2.0, 0.9, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
console.log(await connection.createStopBuyOrder('GBPUSD', 0.07, 1.5, 0.9, 2.0, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
console.log(await connection.createStopSellOrder('GBPUSD', 0.07, 1.0, 2.0, 0.9, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
console.log(await connection.createStopLimitBuyOrder('GBPUSD', 0.07, 1.5, 1.4, 0.9, 2.0, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
console.log(await connection.createStopLimitSellOrder('GBPUSD', 0.07, 1.0, 1.1, 2.0, 0.9, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
console.log(await connection.modifyPosition('46870472', 2.0, 0.9));
console.log(await connection.closePositionPartially('46870472', 0.9));
console.log(await connection.closePosition('46870472'));
console.log(await connection.closeBy('46870472', '46870482'));
console.log(await connection.closePositionsBySymbol('EURUSD'));
console.log(await connection.modifyOrder('46870472', 1.0, 2.0, 0.9));
console.log(await connection.cancelOrder('46870472'));

// if you need to, check the extra result information in stringCode and numericCode properties of the response
const result = await connection.createMarketBuyOrder('GBPUSD', 0.07, 0.9, 2.0, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'});
console.log('Trade successful, result code is ' + result.stringCode);
```

#### Trailing stop loss
Trailing stop loss is a trade option that allows you to automatically configure and change the order/position stop loss based on the 
current price of the symbol. The specified settings are run on the server and modify the stop loss regardless of your connection to the account.
The stop loss can be modified no more often than once in 15 seconds. Two types of trailing stop loss are available: 
distance stop loss and threshold stop loss, but both can be specified at the same time. You can find the full description here: 
[https://metaapi.cloud/docs/client/models/trailingStopLoss/](https://metaapi.cloud/docs/client/models/trailingStopLoss/)

```javascript
// distance trailing stop loss
console.log(await connection.createMarketBuyOrder('GBPUSD', 0.07, 0.9, 2.0, {
  trailingStopLoss: {
    distance: {
      distance: 200,
      units: 'RELATIVE_POINTS'
    }
  }
}));

// threshold trailing stop loss
console.log(await connection.createMarketBuyOrder('GBPUSD', 0.07, 0.9, 2.0, {
  trailingStopLoss: {
    threshold: {
      thresholds: [
        {
          threshold: 50,
          stopLoss: 100
        },
        {
          threshold: 100,
          stopLoss: 50
        }
      ],
      units: 'RELATIVE_POINTS'
    }
  }
}));
```

## Monitoring account connection health and uptime
You can monitor account connection health using MetaApiConnection.healthMonitor API.
```javascript
let monitor = connection.healthMonitor;
// retrieve server-side app health status
console.log(monitor.serverHealthStatus);
// retrieve detailed connection health status
console.log(monitor.healthStatus);
// retrieve account connection update measured over last 7 days
console.log(monitor.uptime);
```

## Tracking latencies
You can track latencies uring MetaApi.latencyMonitor API. Client-side latencies include network communication delays, thus the lowest client-side latencies are achieved if you host your app in AWS Ohio region.
```javascript
let api = new MetaApi('token', {enableLatencyMonitor: true});
let monitor = api.latencyMonitor;
// retrieve trade latecy stats
console.log(monitor.tradeLatencies);
// retrieve update streaming latency stats
console.log(monitor.updateLatencies);
// retrieve quote streaming latency stats
console.log(monitor.priceLatencies);
// retrieve request latency stats
console.log(monitor.requestLatencies);
```

## Managing MetaTrader accounts via API
Please note that not all MT4/MT5 servers allows you to create MT accounts using the method below.
### Create a MetaTrader 4 demo account
```javascript
const demoAccount = await api.metatraderAccountGeneratorApi.createMT4DemoAccount({
  balance: 100000,
  accountType: 'type',
  email: 'example@example.com',
  leverage: 100,
  serverName: 'Exness-Trial4',
  name: 'Test User',
  phone: '+12345678901'
});

// optionally specify a provisioning profile id if servers file is not found by server name
const demoAccount = await api.metatraderAccountGeneratorApi.createMT4DemoAccount({
  balance: 100000,
  accountType: 'type',
  email: 'example@example.com',
  leverage: 100,
  serverName: 'Exness-Trial4',
  name: 'Test User',
  phone: '+12345678901'
}, provisioningProfile.id);

```

### Create a MetaTrader 4 live account
```javascript
const demoAccount = await api.metatraderAccountGeneratorApi.createMT4LiveAccount({
  accountType: 'type',
  balance: 100000,
  email: 'example@example.com',
  leverage: 100,
  serverName: 'Exness-Live4',
  name: 'Test User',
  phone: '+12345678901',
  country: 'Unites States',
  zip: '12345',
  state: 'New York',
  city: 'New York',
  address: 'customer address'
});

// optionally specify provisioning profile id is servers file not found by server name
const demoAccount = await api.metatraderAccountGeneratorApi.createMT4LiveAccount({
  accountType: 'type',
  balance: 100000,
  email: 'example@example.com',
  leverage: 100,
  serverName: 'Exness-Live4',
  name: 'Test User',
  phone: '+12345678901',
  country: 'Unites States',
  zip: '12345',
  state: 'New York',
  city: 'New York',
  address: 'customer address'
}, provisioningProfile.id);
```

### Create a MetaTrader 5 demo account
```javascript
const demoAccount = await api.metatraderAccountGeneratorApi.createMT5DemoAccount({
  accountType: 'type',
  balance: 100000,
  email: 'example@example.com',
  leverage: 100,
  serverName: 'ICMarketsSC-Demo',
  name: 'Test User',
  phone: '+12345678901'
});

// optionally specify provisioning profile id if servers file not found by server name
const demoAccount = await api.metatraderAccountGeneratorApi.createMT5DemoAccount({
  accountType: 'type',
  balance: 100000,
  email: 'example@example.com',
  leverage: 100,
  serverName: 'ICMarketsSC-Demo',
  name: 'Test User',
  phone: '+12345678901'
}, provisioningProfile.id);
```

### Create a MetaTrader 5 live account
```javascript
const demoAccount = await api.metatraderAccountGeneratorApi.createMT5LiveAccount({
  accountType: 'type',
  balance: 100000,
  email: 'example@example.com',
  leverage: 100,
  serverName: 'ICMarketsSC-MT5',
  name: 'Test User',
  phone: '+12345678901',
  country: 'Unites States',
  zip: '12345',
  state: 'New York',
  city: 'New York',
  address: 'customer address'
});

// optionally specify a provisioning profile id if servers file is not found by server name
const demoAccount = await api.metatraderAccountGeneratorApi.createMT5LiveAccount({
  accountType: 'type',
  balance: 100000,
  email: 'example@example.com',
  leverage: 100,
  serverName: 'ICMarketsSC-MT5',
  name: 'Test User',
  phone: '+12345678901',
  country: 'Unites States',
  zip: '12345',
  state: 'New York',
  city: 'New York',
  address: 'customer address'
}, provisioningProfile.id);
```

## Enable log4js logging
By default SDK logs messages to console. You can select the SDK to use [log4js](https://www.npmjs.com/package/log4js) logging library by calling `MetaApi.enableLog4jsLogging()` static method before creating MetaApi instances.

```javascript
import MetaApi from 'metaapi.cloud-sdk';

MetaApi.enableLog4jsLogging();

const metaApi = new MetaApi(token);
```

Please note that the SDK does not configure log4js automatically. If you decide to use log4js, then your application is still responsible to configuring log4js appenders and categories. Please refer to log4js documentation for details.

## Rate limits & quotas
API calls you make are subject to rate limits. See [MT account management API](https://metaapi.cloud/docs/provisioning/rateLimiting/) and [MetaApi API](https://metaapi.cloud/docs/client/rateLimiting/) for details.

MetaApi applies quotas to the number of accounts and provisioning profiles, for more details see the [MT account management API quotas](https://metaapi.cloud/docs/provisioning/userQuota/)

## CopyFactory copy trading API

CopyFactory is a powerful trade copying API which makes developing forex
trade copying applications as easy as writing few lines of code.

You can find CopyFactory Javascript SDK documentation here: [https://github.com/agiliumtrade-ai/copyfactory-javascript-sdk](https://github.com/agiliumtrade-ai/copyfactory-javascript-sdk)

## MetaStats trading statistics API

MetaStats is a powerful trade statistics API which makes it possible to add forex trading metrics into forex applications.

You can find MetaStats Javascript SDK documentation here: [https://github.com/agiliumtrade-ai/metastats-javascript-sdk](https://github.com/agiliumtrade-ai/metastats-javascript-sdk)

## MetaApi MT manager API

MetaApi MT manager API is a cloud REST API which can be used to access and manage MT4 and MT5 servers.

You can find MT manager API documentation here: [https://metaapi.cloud/docs/manager/](https://metaapi.cloud/docs/manager/)

## MetaApi risk management API

MetaApi risk management API is a cloud API for executing trading challenges and competitions. You can use this API for e.g. if you want to launch a proprietary trading company like FTMO. The API is also useful for trading firms/teams which have to enforce trading risk restrictions.

You can find MetaApi risk management Javascript SDK documentation here: [https://github.com/agiliumtrade-ai/risk-management-javascript-sdk](https://github.com/agiliumtrade-ai/risk-management-javascript-sdk)
