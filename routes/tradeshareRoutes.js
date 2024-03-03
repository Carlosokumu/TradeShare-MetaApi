
const express = require("express");
const router = express.Router();



const traderRoutes = require("./traderRoutes");


router.use("/v1/trader", traderRoutes);

module.exports = router;