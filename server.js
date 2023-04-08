
const express = require('express')
let MetaApi = require('metaapi.cloud-sdk').default;
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const OrderInfo = require('./models/OrderInfo');






//Environment variabless
const token = process.env.ACCOUNT_TOKEN
let accountId = process.env.ACCOUNT_ID 
const DATABASE_URL = process.env.DATABASE_URL


const api = new MetaApi(token);


//mongoose connection to the database
const connectDB = async () => {
    try {
         await mongoose.connect(DATABASE_URL,{
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }).then(client => {
         console.log('MongoDB connected!!'); 
         client.connections[0].collection("ordermodels").deleteMany({})
        });
    } catch (err) {
        console.log('Failed to connect to MongoDB', err);
    }
};




connectDB()

const isJsonString = (str) => {
   if(!str && typeof str === "string"){
      console.log("json error")
      return false;
  }
   try {
       var data = JSON.stringify(str)
       JSON.parse(data);
   } catch (e) {
       return false;
   }
   return true;
}


//We  initialize trading history for the last 30 days from Metatrader.
const initializeOrders = async() => {

   try {
      const account = await api.metatraderAccountApi.getAccount(accountId);
      const connection = account.getRPCConnection();
      await connection.connect();
      await connection.waitSynchronized();


      var orders = [];

      await connection.getHistoryOrdersByTimeRange(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()).then(tradedata => {
         for (var i = 0; i < tradedata.historyOrders.length; i++) {
            var orderinfo = new OrderInfo();
            orderinfo._id = new mongoose.Types.ObjectId();
            orderinfo.ticketId = tradedata.historyOrders[i].id;
            orderinfo.profit = tradedata.historyOrders[i].profit
            orders.push(orderinfo); 
        }
         
      }

      ).catch(err => {
           console.log("error getting orders:",err)
      })  
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
    const orders = await connection.getHistoryOrdersByTimeRange(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date())
     res.status(200).json({"orders" : orders})
})


app.post("/mt4info",async (req,res) => {

   console.log("MT4 Posting data....")
   console.log(isJsonString(req.body))
   var x = req.body
   var stringdata = JSON.stringify(req.body)
   var data = JSON.parse(stringdata)
   console.log(data)
   Object.keys(x).forEach(function(key) {
      console.log('Key : ' + key + ', Value : ' + x[key])
      OrderInfo.findOne({ticketId: key}).then(order => {
         order.profit = x[key];
         order.save().then(savedDoc => {
               console(savedDoc)
               res.status(200).send("Link")
         }); 
      })
})
})

app.listen(process.env.PORT,() => {
   console.log("Server running on port: 8000")
})
