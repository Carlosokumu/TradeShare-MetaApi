//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   // Subscribe to trade events
   EventSetMillisecondTimer(500); // Set a timer to check for trade events every 500 milliseconds
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Your trading logic goes here
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTimer()
{
   // Check for trade events
   CheckForTradeEvents();
}

//+------------------------------------------------------------------+
//| Function to check for trade events                               |
//+------------------------------------------------------------------+
void CheckForTradeEvents()
{
   int totalDeals = HistoryDealsTotal(); // Get the total number of deals in the trading history

   // Check each deal
   for (int i = 0; i < totalDeals; i++)
   {
      datetime dealTime = HistoryDealGetInteger(i, DEAL_TIME); // Get the deal time
      int dealType = HistoryDealGetInteger(i, DEAL_ENTRY_TYPE); // Get the deal type (buy or sell)
      double dealProfit = HistoryDealGetDouble(i, DEAL_PROFIT); // Get the deal profit

      // Check if the deal type is a closed position (TRADE_TRANSACTION_DEAL)
      if (HistoryDealGetInteger(i, DEAL_ENTRY) == DEAL_ENTRY_OUT && HistoryDealGetInteger(i, DEAL_TRANSACTION_TYPE) == TRADE_TRANSACTION_DEAL)
      {
         // Position was closed
         Print("Position closed at ", dealTime, " with profit: ", dealProfit);
         // Add your code to handle the closed position event
      }
   }
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   // Clean up or perform actions before the EA is removed
   EventKillTimer(); // Kill the timer when the EA is removed
}

//+------------------------------------------------------------------+
