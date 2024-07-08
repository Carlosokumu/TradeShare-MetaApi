let MetaApi = require("metaapi.cloud-sdk").default;
const isProduction = process.env.NODE_ENV === 'production';

let config;
if (!isProduction) {
  try {
    config = require("../config");
  } catch (error) {
    console.error("Failed to load config file (expected in development only):", error);
  }
}

const token = process.env.ACCOUNT_TOKEN || config.accessToken;
const api = new MetaApi(token);
const db = require("../db/queries");
const asyncHandler = require("../middlewares/asyncHandler");
const ErrorResponse = require("../utils/ErrorResponse");
const axios = require("axios");

async function connectTradingAccount(
  username,
  accountId,
  platform,
  accessToken
) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  try {
    await axios.patch(
      "https://tradesharebackend-xuqcyp00.b4a.run/api/v1/trader/connect",
      {
        platform: platform,
        account_id: accountId,
        username: username,
      },
      { headers: headers }
    );
  } catch (error) {
    // Handle errors
    console.error("Error:", error.message);
    new ErrorResponse(error.message, 500);
  }
}

const registerTrader = asyncHandler(async (req, res, next) => {
  const { name, login, platform, password, server, token } = req.body;

  if (!name || !login || !platform || !password || !server || !token) {
    return next(
      new ErrorResponse("Please provide all the required fields", 400)
    );
  }
  //Check if the given username exists in Swingwizards
  db.checkUsernameExistence(name, (existenceError, usernameExists) => {
    if (existenceError) {
      return next(new ErrorResponse(existenceError, 500));
    } else {
      if (usernameExists) {
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
            //Update TradeShare database  with metaapi accountId after successully connecting the trading account
            connectTradingAccount(name, account._data._id, platform, token);

            res.status(200).json({
              success: false,
              data: { deployed_account: account._data },
            });
          })
          .catch((error) => {
            if (error.message && error.status) {
              return next(new ErrorResponse(error.message, error.status));
            } else if (error == "MethodAccessError") {
              return next(new ErrorResponse(error, 500));
            }
          });
      } else {
        return next(
          new ErrorResponse(
            "Please check that the username is registered in SwingWizards.",
            404
          )
        );
      }
    }
  });
});

module.exports = registerTrader;
