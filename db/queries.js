const Pool = require("pg").Pool;
const config = require("../config");

const DB_URL = process.env.DB_URL || config.databaseUrl;

// const pool = new Pool({

//   connectionString: DB_URL,
//   ssl: {
//     rejectUnauthorized: false,
//   },
// });


const pool = new Pool({
  user: 'swingwizards_users_user',
  host: 'dpg-clk1dveg1b2c739f9rqg-a',
  database: 'swingwizards_users',
  password: 'U84u2BM2lRGFIoCArcrIxtYaLQ3fhBmd',
  port: 5432,
})

const checkUsernameExistence = (username, callback) => {
  pool.query(
    "SELECT * FROM user_models WHERE user_name = $1",
    [username],
    (error, results) => {
      if (error) {
        console.error("Error checking username existence:", error);
        callback(error, null);
      } else {
        callback(null, results.rows.length > 0);
      }
    }
  );
};


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
  checkUsernameExistence
};
