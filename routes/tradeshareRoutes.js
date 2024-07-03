const express = require("express");
const router = express.Router();

const traderRoutes = require("./traderRoutes");
const {
  getAccountEquityChart,
  getAccountOpenPositions,
  getAccountHistoricalTrades,
  searchServerName,
} = require("../controllers/tradeshareController.js");

router.use("/v1/trader", traderRoutes);
router.use("/v1/equity_chart", getAccountEquityChart);
router.use("/v1/positions", getAccountOpenPositions);
router.use("/v1/historicaltrades", getAccountHistoricalTrades);
router.use("/v1/servers", searchServerName);

module.exports = router;
