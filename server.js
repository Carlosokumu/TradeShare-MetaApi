
const express = require('express')
let MetaApi = require('metaapi.cloud-sdk').default;



const app = express()


//Environment variables
const token = process.env.ACCOUNT_TOKEN
let accountId = process.env.ACCOUNT_ID ;


const api = new MetaApi(token);








//Fetch all the currently running positions from the mt4 account

app.get('/positions',async (req,res) => {
   try {
      const account = await api.metatraderAccountApi.getAccount(accountId);
      const connection = account.getStreamingConnection();
      await connection.connect();
      const terminalState = connection.terminalState;
      await connection.waitSynchronized();
      res.status(200).json({
         "positions":terminalState.positions
      })
      console.log(terminalState.positions);
   }   
   catch(err) {
         console.log("FETCHERROR",err)
   }
})

app.get('/account',async (req,res) => {
   try {
      const account = await api.metatraderAccountApi.getAccount(accountId);
      const connection = account.getStreamingConnection();
      await connection.connect();
      const terminalState = connection.terminalState;
      await connection.waitSynchronized();
      console.log(terminalState.accountInformation)
      res.status(200).json(terminalState.accountInformation)
   }   
   catch(err) {
         console.log(err)
   }
})

app.get("/history",async (res,req) => {
   startTime = "2020-09-10 15:00:00.000"
   endTime = "2020-10-10 15:00:00.000"

   const account = await api.metatraderAccountApi.getAccount(accountId);
   const connection = account.getStreamingConnection();
   await connection.connect();
  // const terminalState = connection.terminalState;
 
   await connection.waitSynchronized();
   res.json(await connection.getHistoryOrdersByTimeRange(startTime, endTime))
})

app.listen(process.env.PORT,() => {
   console.log("Server running on port: 8000")
})
