let RiskManagement = require('metaapi.cloud-sdk').RiskManagement;
let DrawdownListener = require('metaapi.cloud-sdk').DrawdownListener;

// your MetaApi API token
let token = process.env.TOKEN || '<put in your token here>';
// your MetaApi account id
// the account must have field riskManagementApiEnabled set to true
let accountId = process.env.ACCOUNT_ID || '<put in your account id here>';
let domain = process.env.DOMAIN;

const riskManagement = new RiskManagement(token, {domain});
const riskManagementApi = riskManagement.riskManagementApi;

class ExampleDrawdownListener extends DrawdownListener {
  async onDrawdown(drawdownEvent) {
    console.log('drawdown event received', JSON.stringify(drawdownEvent));
  }
};

async function main() {
  try {
    // creating a tracker
    let trackerId = await riskManagementApi.createDrawdownTracker(accountId, {
      name: 'example-tracker',
      absoluteDrawdownThreshold: 5,
      period: 'day'
    });
    console.log('Created a drawdown tracker ' + trackerId.id);

    // adding a drawdown listener
    let drawdownListener = new ExampleDrawdownListener();
    let listenerId = riskManagementApi.addDrawdownListener(drawdownListener, accountId, trackerId.id);

    console.log('Streaming drawdown events for 1 minute...');
    await new Promise(res => setTimeout(res, 1000 * 60));
    riskManagementApi.removeDrawdownListener(listenerId);

    console.log('Receiving statistics with REST API');
    let events = await riskManagementApi.getDrawdownEvents(undefined, undefined, accountId, trackerId.id);
    console.log('drawdown events', JSON.stringify(events));
    let statistics = await riskManagementApi.getDrawdownStatistics(accountId, trackerId.id);
    console.log('drawdown statistics', JSON.stringify(statistics));
    let equityChart = await riskManagementApi.getEquityChart(accountId);
    console.log('equity chart', JSON.stringify(equityChart));

    // removing the tracker
    await riskManagementApi.deleteDrawdownTracker(accountId, trackerId.id);
    console.log('Removed the tracker');
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

main();
