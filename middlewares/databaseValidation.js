const db = require("./db/queries");


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


  module.exports = {
    checkIfUserExists
  };