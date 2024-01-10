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

const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 25;
const TODAY = 1;
const WEEK = 2;
const MONTH = 3;

const checkIfUserExists = (req, res, next) => {
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
};

const getTimeDifference = (dateString) => {
  const currentDate = new Date();
  const targetDate = new Date(dateString);
  const timeDifference = currentDate - targetDate;
  const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

  if (daysDifference === 0) {
    return "today";
  } else if (daysDifference === 1) {
    return "yesterday";
  } else if (daysDifference <= 7) {
    return `${daysDifference} days ago`;
  } else if (daysDifference <= 30) {
    const weeks = Math.floor(daysDifference / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  } else {
    const months = Math.floor(daysDifference / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }
};

app.post("/register", checkIfUserExists, async (req, res) => {
  const { name, login, platform, password, server } = req.body;

  if (!name || !login || !platform || !password || !server) {
    return res.status(400).json({
      message: "Please provide all the required fields",
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
      db.updateUserAccountId(account._data._id, name, (error) => {
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
      console.log("Error", error);
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
        } else {
          res.status(error.status).json({
            message: error.details[0].message,
          });
        }
      } else {
        res.status(error.status).json({
          message: error.message,
        });
      }
    });
});

app.get("/history", async (req, res) => {
  const { account_id, history_range, offset } = req.query;
  const currentDate = new Date();
  let startTime, endTime;
  const trades = [];
  if (!account_id || !history_range) {
    return res.status(400).json({
      message: "account_id or history range parameter are required",
    });
  }
  switch (parseInt(history_range)) {
    case TODAY: // Last 24 hours
      startTime = new Date(currentDate);
      startTime.setHours(currentDate.getHours() - 24);
      endTime = new Date();
      break;
    case WEEK: // Last 7 days (a week)
      startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      endTime = new Date();
      break;
    case MONTH: // Last 30 days (a month)
      startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      endTime = new Date();
      break;
    default:
      return res.status(400).json({
        message: "Invalid history range parameter",
      });
    //   TODO: Implement cases where a custom period can be used to filter historical trades
  }
  try {
    const account = await api.metatraderAccountApi.getAccount(account_id);
    const connection = account.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized();
    connection.getCo;
    const orders = await connection.getHistoryOrdersByTimeRange(
      startTime,
      endTime,
      parseInt(offset) || DEFAULT_OFFSET,
      DEFAULT_LIMIT
    );
    for (var i = 0; i < orders.historyOrders.length; i++) {
      const position = await connection.getDealsByPosition(
        orders.historyOrders[i].positionId
      );
      const closedPositions = position.deals.filter(
        (deal) => deal.entryType === "DEAL_ENTRY_OUT"
      );
      for (var j = 0; j < closedPositions.length; j++) {
        if (!trades.map((trade) => trade.id).includes(closedPositions[j].id)) {
          trades.push({
            id: closedPositions[j].id,
            type: closedPositions[j].type,
            profit: closedPositions[j].profit,
            symbol: closedPositions[j].symbol,
            createdAt: getTimeDifference(closedPositions[j].time),
            volume: closedPositions[j].volume,
            time: closedPositions[j].time,
          });
        }
      }
    }
    res.status(200).json({
      trades: trades.sort((a, b) => Date.parse(b.time) - Date.parse(a.time)),
    });
  } catch (error) {
    console.log("Error", error);
    if (error.message) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(error.status).json({ message: error });
    }
  }
});

app.listen(port, () => {
  console.log("Server running 🚀");
});
