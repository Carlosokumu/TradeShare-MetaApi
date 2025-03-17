const Pool = require("pg").Pool;



const user = process.env.USER 
const host = process.env.HOST 
const password = process.env.PASSWORD 
const database = process.env.DB
const port = process.env.DB_PORT

const pool = new Pool({
  user: user,
  host: host,
  database: database,
  password: password,
  port: port,
  ssl: true,
});

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

const searchServerName = (query, callback) => {
  const searchQuery = `%${query}%`; // partial matching
  pool.query(
    "SELECT * FROM servers WHERE name LIKE $1",
    [searchQuery],
    (error, results) => {
      if (error) {
        callback(error, null);
        return;
      }
      callback(null, results.rows);
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
  checkUsernameExistence,
  searchServerName,
};
