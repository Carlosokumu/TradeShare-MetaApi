let MetaApi = require("metaapi.cloud-sdk").default;
const config = require("../config");
const axios = require("axios");
const token = process.env.ACCOUNT_TOKEN || config.accessToken;
const ErrorResponse = require("../utils/ErrorResponse");
let MetaStats = require("metaapi.cloud-sdk").MetaStats;
const asyncHandler = require("../middlewares/asyncHandler");
const getTimeDifference = require("../utils/TimeUtil");

const metaStats = new MetaStats(token);
const api = new MetaApi(token);

const TODAY = 1;
const WEEK = 2;
const MONTH = 3;
const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 20;

const getAccountEquityChart = asyncHandler(async (req, res, next) => {
  const accountId = req.query.account_id;
  if (!accountId) {
    return next(new ErrorResponse("Please provide an account id", 400));
  }
  try {
    const metrics = await metaStats.getMetrics(accountId);
    return res.status(200).json({
      metrics: metrics,
    });
  } catch (error) {
    return next(new ErrorResponse(error, 500));
  }
});

const getAccountOpenPositions = asyncHandler(async (req, res, next) => {
  const accountId = req.query.account_id;
  if (!accountId) {
    return next(new ErrorResponse("Please provide an account id", 400));
  }
  try {
    const account = await api.metatraderAccountApi.getAccount(accountId);
    const connection = account.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized();
    const positions = await connection.getPositions();
    return res.status(200).json({
      positions: positions,
    });
  } catch (error) {
    return next(new ErrorResponse(error, 500));
  }
});

const getAccountHistoricalTrades = asyncHandler(async (req, res, next) => {
  const { account_id, history_range, offset } = req.query;

  const trades = [];

  if (!account_id || !history_range) {
    return next(
      new ErrorResponse(
        "account_id or history range parameter are required",
        400
      )
    );
  }

  const currentDate = new Date();
  let startDate;

  switch (parseInt(history_range)) {
    case TODAY:
      startTimeToday = new Date(currentDate);
      startTimeToday.setHours(0, 0, 0, 0);
      startTimeToday.setHours(startTimeToday.getHours() + 3);
      startDate = startTimeToday;
      break;
    case WEEK:
      startForWeek = new Date(currentDate);
      startForWeek.setDate(startForWeek.getDate() - 7);
      startForWeek.setHours(0, 0, 0, 0);
      startForWeek.setHours(startForWeek.getHours() + 3);
      startDate = startForWeek;
      break;
    case MONTH:
      const oneMonthAgo = new Date(currentDate);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      oneMonthAgo.setHours(0, 0, 0, 0);
      oneMonthAgo.setHours(oneMonthAgo.getHours() + 3);
      startDate = oneMonthAgo;
      break;
    default:
      return next(new ErrorResponse("Invalid history rage ", 400));
  }

  try {
    const account = await api.metatraderAccountApi.getAccount(account_id);
    const connection = account.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized();

    const orders = await connection.getHistoryOrdersByTimeRange(
      startDate,
      currentDate,
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
    if (error.details) {
      // returned if the server file for the specified server name has not been found
      // recommended to check the server name or create the account using a provisioning profile
      if (error.details === "E_SRV_NOT_FOUND") {
        console.log(error);
        return next(new ErrorResponse("Broker Server  not found", 404));
      }
      // returned if the server has failed to connect to the broker using your credentials
      // recommended to check your login and password
      else if (error.details === "E_AUTH") {
        console.log(error);
        return next(
          new ErrorResponse(
            "Failed to connect to your broker.Please check your login and password and try again",
            401
          )
        );
      }
      // returned if the server has failed to detect the broker settings
      // recommended to try again later or create the account using a provisioning profile
      else if (error.details === "E_SERVER_TIMEZONE") {
        console.log(error);
        return next(new ErrorResponse(error, 400));
      } else {
        return next(new ErrorResponse(error.details[0].message, error.status));
      }
    } else {
      if (error.message) {
        return next(new ErrorResponse(error.message, error.status));
      } else {
        return next(new ErrorResponse(error.message, error));
      }
    }
  }
});

module.exports = {
  getAccountEquityChart,
  getAccountOpenPositions,
  getAccountHistoricalTrades,
};
