# MetaApi risk management API for javascript (a member of [metaapi.cloud](https://metaapi.cloud) project)

MetaApi risk management API is a member of MetaApi project ([https://metaapi.cloud](https://metaapi.cloud)), a powerful cloud forex trading API which supports both MetaTrader 4 and MetaTrader 5 platforms.

MetaApi is a paid service, however API access to one MetaTrader account is free of charge.

The [MetaApi pricing](https://metaapi.cloud/#pricing) was developed with the intent to make your charges less or equal to what you would have to pay for hosting your own infrastructure. This is possible because over time we managed to heavily optimize
our MetaTrader infrastructure. And with MetaApi you can save significantly on application development and
maintenance costs and time thanks to high-quality API, open-source SDKs and convenience of a cloud service.

## MetaApi risk management API features

Features supported:

- tracking equity drawdown API
- manage arbitrary number of trackers with different periods
- retrieving drawdown events with REST API or streaming
- retrieving drawdown statistics
- retrieving equity charts

Please check Features section of the [https://metaapi.cloud/docs/risk-management/](https://metaapi.cloud/docs/risk-management/) documentation for detailed description of all settings you can make

## REST API documentation
RiskManagement SDK is built on top of RiskManagement REST API.

RiskManagement REST API docs are available at [https://metaapi.cloud/docs/risk-management/](https://metaapi.cloud/docs/risk-management/)

## FAQ
Please check this page for FAQ: [https://metaapi.cloud/docs/risk-management/faq/](https://metaapi.cloud/docs/risk-management/faq/).

## Code examples
We published some code examples in our github repository, namely:

- Javascript: [https://github.com/agiliumtrade-ai/metaapi-risk-management-javascript-sdk/tree/master/examples](https://github.com/agiliumtrade-ai/metaapi-risk-management-javascript-sdk/tree/master/examples)

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
  const api = new RiskManagement(token);
</script>
```

## Retrieving API token
Please visit [https://app.metaapi.cloud/token](https://app.metaapi.cloud/token) web UI to obtain your API token.

## Configuring equity tracking

In order to configure equity tracking you need to:

- add MetaApi MetaTrader accounts with `riskManagementApiEnabled` field set to true (see below)
- create equity trackers for the accounts with needed parameters

```javascript
import MetaApi, {RiskManagement} from 'metaapi.cloud-sdk';

const token = '...';
const metaapi = new MetaApi(token);
const riskManagement = new RiskManagement(token);

// retrieve MetaApi MetaTrader accounts with riskManagementApiEnabled field set to true
const account = await api.metatraderAccountApi.getAccount('accountId');
if(!masterMetaapiAccount.riskManagementApiEnabled) {
  throw new Error('Please set riskManagementApiEnabled field to true in your MetaApi account in ' +
    'order to use it in RiskManagement API');
}

let riskManagementApi = riskManagement.riskManagementApi;

// create a tracker
let trackerId = await riskManagementApi.createDrawdownTracker('accountId', {
  name: 'Test tracker',
  period: 'day',
  absoluteDrawdownThreshold: 100
});

// retrieve list of trackers
console.log(await riskManagementApi.getDrawdownTrackers('accountId'));

// update a tracker
console.log(await riskManagementApi.updateDrawdownTracker('accountId', trackerId.id, {name: 'Updated name'}));

// remove a tracker
console.log(await riskManagementApi.deleteDrawdownTracker('accountId', trackerId.id));
```

See esdoc in-code documentation for full definition of possible configuration options.

## Retrieving equity tracking events and statistics

RiskManagement allows you to monitor equity drawdowns on trading accounts.

### Retrieving drawdown events
```javascript
// retrieve drawdown events, please note that this method supports filtering by broker time range, accountId, trackerId
// and limits number of records
console.log(await riskManagementApi.getDrawdownEvents('2022-04-13 09:30:00.000', '2022-05-14 09:30:00.000'));
```

### Streaming drawdown events
You can subscribe to a stream of drawdown events using the drawdown listener.
```javascript
import {DrawdownListener} from 'metaapi.cloud-sdk';

// create a custom class based on the DrawdownListener
class Listener extends DrawdownListener {

  // specify the function called on events arrival
  async onDrawdown(drawdownEvent) {
    console.log('Drawdown event', drawdownEvent);
  }

}

// add listener
const listener = new Listener();
const listenerId = riskManagementApi.addDrawdownListener(listener);

// remove listener
riskManagementApi.removeDrawdownListener(listenerId);
```

### Retrieving drawdown statistics
```javascript
// retrieve drawdown statistics, please note that this method can filter returned data and supports pagination
console.log(await riskManagementApi.getDrawdownStatistics('accountId', trackerId.id));
```

### Retrieving equity chart
```javascript
// retrieve equity chart, please note that this method supports loading within specified broker time
console.log(await riskManagementApi.getEquityChart('accountId'));
```

## Related projects:
Take a look at our website for the full list of APIs and features supported [https://metaapi.cloud/#features](https://metaapi.cloud/#features)

Some of the APIs you might decide to use together with MetaStats API are:

1. MetaApi cloud forex API [https://metaapi.cloud/docs/client/](https://metaapi.cloud/docs/client/)
2. MetaTrader account management API [https://metaapi.cloud/docs/provisioning/](https://metaapi.cloud/docs/provisioning/)
3. CopyFactory copy trading  API [https://metaapi.cloud/docs/copyfactory/](https://metaapi.cloud/docs/copyfactory/)
4. MetaStats forex trading metrics API [https://metaapi.cloud/docs/metastats/](https://metaapi.cloud/docs/metastats/)
5. MetaApi MT manager API [https://metaapi.cloud/docs/manager/](https://metaapi.cloud/docs/manager/>)
