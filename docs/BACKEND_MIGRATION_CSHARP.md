# Backend Migration C# Structure

## 1. Models

```csharp
// Account Models
public class MT5Account
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string MetaApiAccountId { get; set; }
    public string Name { get; set; }
    public string Login { get; set; }
    public string Server { get; set; }
    public string Platform { get; set; }
    public string State { get; set; }
    public string ConnectionStatus { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class RiskSettings
{
    public Guid Id { get; set; }
    public Guid AccountId { get; set; }
    public decimal MaxDrawdown { get; set; }
    public decimal MaxExposurePerPair { get; set; }
    public decimal MinEquity { get; set; }
    public decimal MarginCallLevel { get; set; }
    public int? MaxPositionsPerPair { get; set; }
    public decimal? MaxDailyLoss { get; set; }
    public decimal? MaxWeeklyLoss { get; set; }
    public decimal? MaxMonthlyLoss { get; set; }
}

public class Trade
{
    public Guid Id { get; set; }
    public Guid AccountId { get; set; }
    public long TicketNumber { get; set; }
    public string Symbol { get; set; }
    public string OrderType { get; set; }
    public decimal LotSize { get; set; }
    public decimal EntryPrice { get; set; }
    public decimal? ExitPrice { get; set; }
    public decimal? StopLoss { get; set; }
    public decimal? TakeProfit { get; set; }
    public decimal? ProfitLoss { get; set; }
    public decimal Commission { get; set; }
    public decimal Swap { get; set; }
    public DateTime OpenTime { get; set; }
    public DateTime? CloseTime { get; set; }
    public string Status { get; set; }
}

public class TradeMetrics
{
    public Guid Id { get; set; }
    public Guid TradeId { get; set; }
    public decimal RiskAmount { get; set; }
    public decimal RewardAmount { get; set; }
    public decimal RiskRewardRatio { get; set; }
    public string WinLoss { get; set; }
}
```

## 2. Controllers

```csharp
[ApiController]
[Route("api/mt5/accounts")]
public class MT5AccountController : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<MT5Account>> CreateAccount(CreateAccountRequest request);

    [HttpGet("{accountId}/status")]
    public async Task<ActionResult<AccountStatus>> GetAccountStatus(Guid accountId);

    [HttpGet("{accountId}/trades")]
    public async Task<ActionResult<IEnumerable<Trade>>> GetTrades(
        Guid accountId, 
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string status = "all"
    );

    [HttpPost("{accountId}/orders")]
    public async Task<ActionResult<OrderResult>> PlaceMarketOrder(
        Guid accountId,
        MarketOrderRequest request
    );

    [HttpPatch("{accountId}/positions/{ticket}")]
    public async Task<ActionResult<ModifyPositionResult>> ModifyPosition(
        Guid accountId,
        long ticket,
        ModifyPositionRequest request
    );

    [HttpDelete("{accountId}/positions/{ticket}")]
    public async Task<ActionResult<ClosePositionResult>> ClosePosition(
        Guid accountId,
        long ticket
    );

    [HttpPut("{accountId}/risk-settings")]
    public async Task<ActionResult<RiskSettings>> UpdateRiskSettings(
        Guid accountId,
        UpdateRiskSettingsRequest request
    );
}
```

## 3. Services

```csharp
public interface IMetaApiService
{
    Task<MT5Account> CreateAccountAsync(CreateAccountRequest request);
    Task<bool> ValidateCredentialsAsync(string login, string password, string server);
    Task<AccountStatus> GetAccountStatusAsync(string accountId);
    Task DeployAccountAsync(string accountId);
    Task UndeployAccountAsync(string accountId);
}

public interface ITradingService
{
    Task<OrderResult> PlaceMarketOrderAsync(string accountId, MarketOrderRequest request);
    Task<ModifyPositionResult> ModifyPositionAsync(string accountId, long ticket, ModifyPositionRequest request);
    Task<ClosePositionResult> ClosePositionAsync(string accountId, long ticket);
    Task<IEnumerable<Trade>> GetTradesAsync(string accountId, DateTime? startDate, DateTime? endDate, string status);
}

public interface IRiskManagementService
{
    Task<RiskCheckResult> CheckRiskLimitsAsync(string accountId, MarketOrderRequest request);
    Task<decimal> CalculatePositionSizeAsync(string accountId, string symbol, decimal stopLoss, decimal entryPrice);
    Task<RiskSettings> UpdateRiskSettingsAsync(string accountId, UpdateRiskSettingsRequest request);
    Task<AccountMetrics> CalculateAccountMetricsAsync(string accountId, string timeframe);
}
```

## 4. Database Context

```csharp
public class TradingDbContext : DbContext
{
    public DbSet<MT5Account> MT5Accounts { get; set; }
    public DbSet<RiskSettings> RiskSettings { get; set; }
    public DbSet<Trade> Trades { get; set; }
    public DbSet<TradeMetrics> TradeMetrics { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Account configuration
        modelBuilder.Entity<MT5Account>()
            .HasIndex(a => a.UserId);
        modelBuilder.Entity<MT5Account>()
            .HasIndex(a => new { a.State, a.ConnectionStatus });

        // Risk settings configuration
        modelBuilder.Entity<RiskSettings>()
            .HasIndex(r => r.AccountId)
            .IsUnique();

        // Trade configuration
        modelBuilder.Entity<Trade>()
            .HasIndex(t => t.AccountId);
        modelBuilder.Entity<Trade>()
            .HasIndex(t => t.TicketNumber);
        modelBuilder.Entity<Trade>()
            .HasIndex(t => t.OpenTime);

        // Trade metrics configuration
        modelBuilder.Entity<TradeMetrics>()
            .HasIndex(m => m.TradeId)
            .IsUnique();
    }
}
```

## 5. Request/Response DTOs

```csharp
public class CreateAccountRequest
{
    public string Login { get; set; }
    public string Password { get; set; }
    public string Server { get; set; }
    public string Name { get; set; }
    public string Region { get; set; }
}

public class MarketOrderRequest
{
    public string Symbol { get; set; }
    public string Type { get; set; }
    public decimal Volume { get; set; }
    public decimal? StopLoss { get; set; }
    public decimal? TakeProfit { get; set; }
}

public class ModifyPositionRequest
{
    public decimal? StopLoss { get; set; }
    public decimal? TakeProfit { get; set; }
}

public class UpdateRiskSettingsRequest
{
    public decimal MaxDrawdown { get; set; }
    public decimal MaxExposurePerPair { get; set; }
    public decimal MinEquity { get; set; }
    public decimal MarginCallLevel { get; set; }
    public int? MaxPositionsPerPair { get; set; }
    public decimal? MaxDailyLoss { get; set; }
    public decimal? MaxWeeklyLoss { get; set; }
    public decimal? MaxMonthlyLoss { get; set; }
}
```

## 6. Middleware

```csharp
public class RateLimitMiddleware
{
    private static readonly Dictionary<string, RateLimit> Limits = new()
    {
        ["/api/mt5/accounts"] = new RateLimit(5, TimeSpan.FromHours(1)),
        ["/api/mt5/accounts/*/orders"] = new RateLimit(60, TimeSpan.FromMinutes(1)),
        ["/api/mt5/accounts/*/positions/*"] = new RateLimit(120, TimeSpan.FromMinutes(1)),
        ["/api/mt5/accounts/*/trades"] = new RateLimit(300, TimeSpan.FromMinutes(1))
    };
}

public class ErrorHandlingMiddleware
{
    // Centralizado manejo de errores
}

public class AuthenticationMiddleware
{
    // Validación de JWT y permisos
}
```

## 7. Background Services

```csharp
public class AccountSyncService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Sincronización periódica de cuentas MT5
    }
}

public class MetricsCalculationService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Cálculo periódico de métricas
    }
}
```

## 8. Configuración

```csharp
public class MetaApiOptions
{
    public string ApiToken { get; set; }
    public string Domain { get; set; }
    public int RequestTimeout { get; set; }
    public RetryOptions RetryOptions { get; set; }
}

public class RiskManagementOptions
{
    public decimal DefaultMaxDrawdown { get; set; }
    public decimal DefaultMaxExposure { get; set; }
    public decimal DefaultMinEquity { get; set; }
    public decimal DefaultMarginCallLevel { get; set; }
}
```

## 9. Dependencias Principales

```xml
<ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="7.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="7.0.0" />
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="7.0.0" />
    <PackageReference Include="MetaApi.Cloud.SDK" Version="23.6.0" />
    <PackageReference Include="StackExchange.Redis" Version="2.6.111" />
    <PackageReference Include="Serilog.AspNetCore" Version="7.0.0" />
</ItemGroup>
```