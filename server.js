
const express = require('express')
let MetaApi = require('metaapi.cloud-sdk').default;
const { accessToken,accountId, port } = require('./config');


const app = express()


//const token = 'nTCBftPwfyzUhUuHVzp6uDzC6jVLbJOSjctxna58nE5oMM16uDYEXLPwhPYIwGbb' || process.env.ACCOUNT_TOKEN;
const token = {accessToken}
const api = new MetaApi(token);





//let accountId = '6a103a80-5a6a-4097-8642-1c8fd47faf18' || process.env.ACCOUNT_ID ;
//let accountId = {accountId}

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
      const account = await api.metatraderAccountApi.getAccount({accountId});
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
