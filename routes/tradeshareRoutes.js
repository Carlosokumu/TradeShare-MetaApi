const express = require("express");
const router = express.Router();

const traderRoutes = require("./traderRoutes");
const {
  getAccountEquityChart,
  getAccountOpenPositions,
  getAccountHistoricalTrades,
} = require("../controllers/tradeshareController.js");

router.use("/v1/trader", traderRoutes);
router.use("/v1/equity_chart", getAccountEquityChart);
router.use("/v1/positions", getAccountOpenPositions);
router.use("/v1/historicaltrades", getAccountHistoricalTrades);

module.exports = router;
