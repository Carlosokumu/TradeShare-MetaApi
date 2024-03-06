const express = require("express");
const router = express.Router();
const registerTrader = require("../controllers/traderController");

router.post("/register", registerTrader);

module.exports = router;
