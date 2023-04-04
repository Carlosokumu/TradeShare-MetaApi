
const express = require('express')
let MetaApi = require('metaapi.cloud-sdk').default;
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const OrderInfo = require('./models/OrderInfo');




let conn

//Environment variables
const token = process.env.ACCOUNT_TOKEN
let accountId = process.env.ACCOUNT_ID 
const DATABASE_URL = process.env.DATABASE_URL


const api = new MetaApi(token);


//mongoose connection to the databases
const connectDB = async () => {
    try {
        conn = await mongoose.connect(DATABASE_URL,{
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('MongoDB connected!!');
    } catch (err) {
        console.log('Failed to connect to MongoDB', err);
    }
};
connectDB()


const initializeOrders = async() => {

   try {
      const account = await api.metatraderAccountApi.getAccount(accountId);
      const connection = account.getStreamingConnection();
      await connection.connect();
      const terminalState = connection.terminalState;
      await connection.waitSynchronized();
     var orders = [];
     for(var x = 0; x < (terminalState.positions.length - 1); x++) {
               var orderinfo = new OrderInfo();
               orderinfo._id = new mongoose.Types.ObjectId();
               orderinfo.ticketId = terminalState.positions[x].id;
               orderinfo.profit = terminalState.positions[x].profit
               orders.push(orderinfo); 
      } 
      OrderInfo.create(orders).then((result) => {
         console.log("Created Orders Successfully:",result.length)
       })
       .catch((err) => {
         console.log("Failed to Create Orders:",err)
       })
   }   
   catch(err) {
         console.log("Failed to connect to Trading account:",err)
   }
}
initializeOrders()



const app = express()





app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



app.get("/orders",async (req,res) => {
   //Find all the orders
   const orders = await OrderInfo.find()
   res.status(200).json({
      "orders": orders
   })
})




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

app.get("/history",async (req,res) => {
   startTime = "2020-09-10 15:00:00.000"
   endTime = "2020-10-10 15:00:00.000"

   const account = await api.metatraderAccountApi.getAccount(accountId);

   const connection = account.getRPCConnection();

    await connection.connect();
    await connection.waitSynchronized();
    const orders = await connection.getHistoryOrdersByTimeRange(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date())
     res.status(200).json({"orders" : orders})
})


app.post("/mt4info",(req,res) => {
   console.log("MT4 Posting data....")
   console.log(req.body)
   res.status(200).send("Link")


})

app.listen(process.env.PORT,() => {
   console.log("Server running on port: 8000")
})
