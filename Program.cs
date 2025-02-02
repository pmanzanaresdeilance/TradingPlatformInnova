using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Serilog;
using TradingPlatform.Services;

namespace TradingPlatform
{
    class Program
    {
        static async Task Main(string[] args)
        {
            // Configure logging
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Debug()
                .WriteTo.Console()
                .WriteTo.File("logs/app.log", rollingInterval: RollingInterval.Day)
                .CreateLogger();

            try
            {
                // Load configuration
                var config = new ConfigurationBuilder()
                    .AddJsonFile("appsettings.json")
                    .AddEnvironmentVariables()
                    .Build();

                // Initialize Supabase client
                var supabaseUrl = config["Supabase:Url"];
                var supabaseKey = config["Supabase:Key"];
                var supabaseService = new SupabaseService(supabaseUrl, supabaseKey);

                // Demo CRUD operations
                await DemoCRUDOperations(supabaseService);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "An error occurred while running the application");
            }
            finally
            {
                Log.CloseAndFlush();
            }
        }

        static async Task DemoCRUDOperations(SupabaseService supabase)
        {
            try
            {
                // Authenticate user
                var authResult = await supabase.SignInAsync("test@example.com", "password123");
                Log.Information("User authenticated: {UserId}", authResult.User.Id);

                // Create a new trading account
                var account = new Models.MetaApiAccount
                {
                    Name = "Demo Account",
                    Login = "12345678",
                    Server = "Demo-Server",
                    Platform = "mt5",
                    State = "CREATED",
                    ConnectionStatus = "DISCONNECTED"
                };

                var createdAccount = await supabase.MetaApiAccounts.CreateAsync(account);
                Log.Information("Created account: {AccountId}", createdAccount.Id);

                // Query accounts with filters
                var filters = new Dictionary<string, object>
                {
                    { "platform", "mt5" },
                    { "state", "CREATED" }
                };

                var accounts = await supabase.MetaApiAccounts.GetFilteredAsync(filters, "created_at", false);
                Log.Information("Found {Count} accounts", accounts.Count());

                // Update account
                createdAccount.State = "DEPLOYED";
                var updatedAccount = await supabase.MetaApiAccounts.UpdateAsync(createdAccount.Id, createdAccount);
                Log.Information("Updated account state to: {State}", updatedAccount.State);

                // Create trade for account
                var trade = new Models.Trade
                {
                    AccountId = createdAccount.Id,
                    Symbol = "EURUSD",
                    OrderType = "buy",
                    LotSize = 0.1m,
                    EntryPrice = 1.1000m,
                    OpenTime = DateTime.UtcNow,
                    Status = "open"
                };

                var createdTrade = await supabase.Trades.CreateAsync(trade);
                Log.Information("Created trade: {TradeId}", createdTrade.Id);

                // Add trade note
                var note = new Models.TradeNote
                {
                    TradeId = createdTrade.Id,
                    UserId = authResult.User.Id,
                    NoteType = "analysis",
                    Content = "Test trade note"
                };

                await supabase.TradeNotes.CreateAsync(note);
                Log.Information("Added note to trade");

                // Delete trade (demo purposes only)
                await supabase.Trades.DeleteAsync(createdTrade.Id);
                Log.Information("Deleted trade");

                // Delete account (demo purposes only)
                await supabase.MetaApiAccounts.DeleteAsync(createdAccount.Id);
                Log.Information("Deleted account");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error during CRUD operations demo");
                throw;
            }
        }
    }
}