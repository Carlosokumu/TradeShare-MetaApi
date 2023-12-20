const express = require("express");
let MetaApi = require("metaapi.cloud-sdk").default;
const bodyParser = require("body-parser");
const config = require("./config");
const db = require("./db/queries");

//Environment variabless
const token = process.env.ACCOUNT_TOKEN || config.accessToken;
const port = process.env.PORT || "8000";
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const api = new MetaApi(token);

function checkIfUserExists(req, res, next) {
  db.checkUsernameExistence(req.body.name, (existenceError, usernameExists) => {
    if (existenceError) {
      return res.status(500).json({
        message: existenceError,
      });
    } else {
      if (usernameExists) {
        next();
      } else {
        return res.status(404).json({
          message:
            "Please check that the username is registered in SwingWizards.",
        });
      }
    }
  });
}

app.post("/register", checkIfUserExists, async (req, res) => {
  const { name, login, platform, password, server } = req.body;

  if (!name || !login || !platform || !password || !server) {
    return res.status(400).json({
      message: "Please provide all required fields",
    });
  }
  api.metatraderAccountApi
    .createAccount({
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
    })
    .then((account) => {
      db.updateUserAccountId(account._data._id, name, (error, results) => {
        if (error) {
          throw error;
        } else {
          return res.status(200).json({
            deployed_account: account._data,
          });
        }
      });
    })
    .catch((error) => {
      if (error.details) {
        // returned if the server file for the specified server name has not been found
        // recommended to check the server name or create the account using a provisioning profile
        if (error.details === "E_SRV_NOT_FOUND") {
          console.log(error);
          res.status(404).json({
            message: "Broker Server  not found",
          });
        }
        // returned if the server has failed to connect to the broker using your credentials
        // recommended to check your login and password
        else if (error.details === "E_AUTH") {
          console.log(error);
          res.status(401).json({
            message:
              "Failed to connect to your broker.Please check your login and password and try again",
          });
        }
        // returned if the server has failed to detect the broker settings
        // recommended to try again later or create the account using a provisioning profile
        else if (error.details === "E_SERVER_TIMEZONE") {
          console.log(error);
          res.status(400).json({
            message: error,
          });
        }
      } else {
        res.status(error.status).json({
          message: error,
        });
      }
    });
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

app.listen(port, () => {
  console.log("Server running");
});
