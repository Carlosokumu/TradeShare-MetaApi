let MetaApi = require("metaapi.cloud-sdk").default;
const config = require("../config");
const token = process.env.ACCOUNT_TOKEN || config.accessToken;
const api = new MetaApi(token);
const db = require("../db/queries");
const asyncHandler = require("../middlewares/asyncHandler");
const ErrorResponse = require("../utils/ErrorResponse");

const registerTrader = asyncHandler(async (req, res, next) => {
  const { name, login, platform, password, server } = req.body;

  if (!name || !login || !platform || !password || !server) {
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
            db.updateUserAccountId(account._data._id, name, (error) => {
              if (error) {
                throw error;
              } else {
                res.status(200).json({
                  success: false,
                  data: { deployed_account: account._data },
                });
              }
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
