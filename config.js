
const dotenv = require('dotenv');
dotenv.config();


module.exports = {
  port: process.env.PORT,
  accountId: process.env.ACCOUNT_ID,
  accessToken:process.env.ACCOUNT_TOKEN 

};