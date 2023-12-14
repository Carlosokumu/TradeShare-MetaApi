const express = require("express");
let MetaApi = require("metaapi.cloud-sdk").default;
const bodyParser = require("body-parser");
const config = require("./config");

//Environment variabless
const token = process.env.ACCOUNT_TOKEN || config.accessToken;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const api = new MetaApi(
   token
);

app.post("/register", async (req, res) => {
  const { name, login, platform, password, server } = req.body;

  if (!name || !login || !platform || !password || !server) {
    return res.status(400).json({
      message: "Please provide all required fields",
    });
  }
  try {
    const account = await api.metatraderAccountApi.createAccount({
      name: name,
      type: "cloud",
      login: login,
      platform: platform,
      password: password,
      server: server,
      magic: 123456,
      keywords: ["Swingwizards Ltd"],
      quoteStreamingIntervalInSeconds: 2.5,
      reliability: "high",
    });
    console.log("Account:", account);
    return res.status(200).json({
      deployed_account: account,
    });
  } catch (err) {
    if (err.details) {
      // returned if the server file for the specified server name has not been found
      // recommended to check the server name or create the account using a provisioning profile
      if (err.details === "E_SRV_NOT_FOUND") {
        console.log(err);
        res.status(404).json({
          message: err,
        });
      }
      // returned if the server has failed to connect to the broker using your credentials
      // recommended to check your login and password
      else if (err.details === "E_AUTH") {
        console.log(err);
        res.status(401).json({
          message: err,
        });
      }
      // returned if the server has failed to detect the broker settings
      // recommended to try again later or create the account using a provisioning profile
      else if (err.details === "E_SERVER_TIMEZONE") {
        console.log(err);
        res.status(200).json({
          message: err,
        });
      }
    } else {
      console.log("Error:", err);
      res.status(200).json({
        message: err,
      });
    }
  }
});

app.get("/history", async (req, res) => {
  const { account_id, history_range, offset } = req.body;
  let startTime, endTime;
  const trades = [];

  if (!account_id || !history_range) {
    return res.status(400).json({
      message: "account_id or history range parameter are required",
    });
  }
  switch (parseInt(history_range)) {
    case 1: // Today
      startTime = new Date();
      endTime = new Date();
      break;
    case 2: // Last 30 days (a month)
      startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      endTime = new Date();
      break;
    default:
      return res.status(400).json({
        message: "Invalid history range parameter",
      });
  }
  const account = await api.metatraderAccountApi.getAccount(account_id);
  const connection = account.getRPCConnection();
  await connection.connect();
  await connection.waitSynchronized();
  const orders = await connection.getHistoryOrdersByTimeRange(
    startTime,
    endTime,
    offset || 0,
    25
  );
  for (var i = 0; i < orders.historyOrders.length; i++) {
    const position = await connection.getDealsByPosition(
      orders.historyOrders[i].positionId
    );
    for (var j = 0; j < position.deals.length; j++) {
      trades.push({
        type: position.deals[j].type,
        profit: position.deals[j].profit,
        symbol: position.deals[j].symbol,
      });
    }
  }
  res.status(200).json({ trades: trades });
});

app.listen(8000, () => {
  console.log("Server running on port: 8000");
});
