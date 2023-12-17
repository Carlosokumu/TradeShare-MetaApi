const Pool = require("pg").Pool;
const config = require("../config");

const DB_URL = process.env.DB_URL || config.databaseUrl;

const pool = new Pool({
  connectionString: DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const updateUserAccountId = (accountId, username, callback) => {
  console.log("Username:", username);
  pool.query(
    "UPDATE user_models SET account_id = $1 WHERE user_name = $2",
    [accountId, username],
    (error, results) => {
      if (error) {
        console.error("Error updating user account ID:", error);
        callback(error, null);
      } else {
        console.log("User account ID updated successfully:", results);
        callback(null, results);
      }
    }
  );
};

module.exports = {
  updateUserAccountId,
};
