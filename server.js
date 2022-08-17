
const express = require('express')
let MetaApi = require('metaapi.cloud-sdk').default;



const app = express()


//Environment variables
const token = process.env.ACCOUNT_TOKEN
let accountId = process.env.ACCOUNT_ID ;


const api = new MetaApi(token);








async function testMetaApiSynchronization() {
  
    try {
       const account = await api.metatraderAccountApi.getAccount({accountId});
       const connection = account.getStreamingConnection();
       await connection.connect();
       const terminalState = connection.terminalState;
       await connection.waitSynchronized();
       console.log(terminalState.positions);
    }   
    catch(err) {
          console.log(err)
    }
} 
//testMetaApiSynchronization()

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
         console.log(err)
   }
})

app.listen(process.env.PORT,() => {
   console.log("Server running on port: 8000")
})
