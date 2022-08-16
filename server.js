
const express = require('express')
let MetaApi = require('metaapi.cloud-sdk').default;


const app = express()


const token = 'nTCBftPwfyzUhUuHVzp6uDzC6jVLbJOSjctxna58nE5oMM16uDYEXLPwhPYIwGbb';
const api = new MetaApi(token);





let accountId = '6a103a80-5a6a-4097-8642-1c8fd47faf18';

async function testMetaApiSynchronization() {
  
    try {
       const account = await api.metatraderAccountApi.getAccount(accountId);
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
testMetaApiSynchronization()

app.listen(8000,() => {
   console.log("Server running on port 8000")
})
