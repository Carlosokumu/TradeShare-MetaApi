const express = require("express");
const bodyParser = require("body-parser");

//Environment variabless
const port = process.env.PORT || "8000";

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Routes
const tradeShareRoutes = require("./routes/tradeshareRoutes");

app.use("/api", tradeShareRoutes);

// Error Handler
const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

app.listen(port, () => {
  console.log("Server running 🚀");
});
