# Backend Migration Technical Specification

## 1. API Endpoints

### Authentication & Account Management

#### Create MT5 Account
- **Route**: `/api/mt5/accounts`
- **Method**: POST
- **Description**: Creates a new MT5 account connection
- **Input Parameters**:
  ```typescript
  {
    login: string;        // MT5 account number
    password: string;     // MT5 account password
    server: string;       // MT5 server name
    name?: string;        // Optional display name
    region?: string;      // Optional server region
  }
  ```
- **Response Format**:
  ```typescript
  {
    id: string;          // Internal account ID
    meta_api_account_id: string;
    login: string;
    server: string;
    platform: 'mt5';
    state: 'DEPLOYED' | 'DEPLOYING' | 'UNDEPLOYED';
    connection_status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  }
  ```
- **Status Codes**:
  - 201: Account created successfully
  - 400: Invalid input parameters
  - 401: Unauthorized
  - 409: Account already exists
  - 500: Server error

#### Get MT5 Account Status
- **Route**: `/api/mt5/accounts/{accountId}/status`
- **Method**: GET
- **Description**: Retrieves current account connection status
- **Response Format**:
  ```typescript
  {
    state: 'DEPLOYED' | 'DEPLOYING' | 'UNDEPLOYED';
    connection_status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
    last_connected: string;    // ISO timestamp
    error_message?: string;
  }
  ```
- **Status Codes**:
  - 200: Success
  - 404: Account not found
  - 500: Server error

### Trading Operations

#### Get Account Trades
- **Route**: `/api/mt5/accounts/{accountId}/trades`
- **Method**: GET
- **Description**: Retrieves trading history
- **Query Parameters**:
  - startDate (ISO timestamp)
  - endDate (ISO timestamp)
  - status ('open' | 'closed' | 'all')
- **Response Format**:
  ```typescript
  {
    trades: Array<{
      ticket: number;
      symbol: string;
      type: 'buy' | 'sell';
      volume: number;
      openPrice: number;
      closePrice?: number;
      stopLoss?: number;
      takeProfit?: number;
      profit: number;
      commission: number;
      swap: number;
      openTime: string;
      closeTime?: string;
    }>
  }
  ```
- **Status Codes**:
  - 200: Success
  - 404: Account not found
  - 500: Server error

#### Place Market Order
- **Route**: `/api/mt5/accounts/{accountId}/orders`
- **Method**: POST
- **Description**: Places a new market order
- **Input Parameters**:
  ```typescript
  {
    symbol: string;
    type: 'buy' | 'sell';
    volume: number;
    stopLoss?: number;
    takeProfit?: number;
  }
  ```
- **Response Format**:
  ```typescript
  {
    ticket: number;
    openPrice: number;
    openTime: string;
  }
  ```
- **Status Codes**:
  - 201: Order placed successfully
  - 400: Invalid order parameters
  - 404: Account not found
  - 429: Rate limit exceeded
  - 500: Server error

#### Modify Position
- **Route**: `/api/mt5/accounts/{accountId}/positions/{ticket}`
- **Method**: PATCH
- **Description**: Modifies an existing position
- **Input Parameters**:
  ```typescript
  {
    stopLoss?: number;
    takeProfit?: number;
  }
  ```
- **Response Format**:
  ```typescript
  {
    success: boolean;
    ticket: number;
    modified: {
      stopLoss?: number;
      takeProfit?: number;
    }
  }
  ```
- **Status Codes**:
  - 200: Position modified successfully
  - 400: Invalid parameters
  - 404: Position not found
  - 500: Server error

#### Close Position
- **Route**: `/api/mt5/accounts/{accountId}/positions/{ticket}`
- **Method**: DELETE
- **Description**: Closes an open position
- **Response Format**:
  ```typescript
  {
    ticket: number;
    closePrice: number;
    closeTime: string;
    profit: number;
  }
  ```
- **Status Codes**:
  - 200: Position closed successfully
  - 404: Position not found
  - 500: Server error

### Risk Management

#### Update Risk Settings
- **Route**: `/api/mt5/accounts/{accountId}/risk-settings`
- **Method**: PUT
- **Description**: Updates account risk management settings
- **Input Parameters**:
  ```typescript
  {
    maxDrawdown: number;          // 0-1 percentage
    maxExposurePerPair: number;   // 0-1 percentage
    minEquity: number;            // Minimum account equity
    marginCallLevel: number;      // 0-1 percentage
    maxPositionsPerPair?: number; // Optional max positions per symbol
    maxDailyLoss?: number;        // Optional max daily loss amount
    maxWeeklyLoss?: number;       // Optional max weekly loss amount
    maxMonthlyLoss?: number;      // Optional max monthly loss amount
  }
  ```
- **Response Format**:
  ```typescript
  {
    success: boolean;
    settings: RiskSettings;
    appliedAt: string;           // ISO timestamp
  }
  ```
- **Status Codes**:
  - 200: Settings updated successfully
  - 400: Invalid settings
  - 404: Account not found
  - 500: Server error

## 2. Database Schema

### MT5 Accounts Table
```sql
CREATE TABLE meta_api_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meta_api_account_id text NOT NULL,
  name text NOT NULL,
  login text NOT NULL,
  server text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('mt4', 'mt5')),
  state text NOT NULL DEFAULT 'CREATED',
  connection_status text NOT NULL DEFAULT 'DISCONNECTED',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, meta_api_account_id)
);

-- Indexes
CREATE INDEX idx_meta_api_accounts_user_id ON meta_api_accounts(user_id);
CREATE INDEX idx_meta_api_accounts_status ON meta_api_accounts(state, connection_status);
```

### Risk Settings Table
```sql
CREATE TABLE meta_api_risk_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES meta_api_accounts(id) ON DELETE CASCADE NOT NULL,
  max_drawdown numeric NOT NULL DEFAULT 0.1,
  max_exposure_per_pair numeric NOT NULL DEFAULT 0.05,
  min_equity numeric NOT NULL DEFAULT 100,
  margin_call_level numeric NOT NULL DEFAULT 0.5,
  max_positions_per_pair integer,
  max_daily_loss numeric,
  max_weekly_loss numeric,
  max_monthly_loss numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(account_id)
);

-- Indexes
CREATE INDEX idx_risk_settings_account_id ON meta_api_risk_settings(account_id);
```

### Trades Table
```sql
CREATE TABLE trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES meta_api_accounts(id) ON DELETE CASCADE NOT NULL,
  ticket_number bigint NOT NULL,
  symbol text NOT NULL,
  order_type text NOT NULL CHECK (order_type IN ('buy', 'sell')),
  lot_size numeric NOT NULL,
  entry_price numeric NOT NULL,
  exit_price numeric,
  stop_loss numeric,
  take_profit numeric,
  profit_loss numeric,
  commission numeric NOT NULL DEFAULT 0,
  swap numeric NOT NULL DEFAULT 0,
  open_time timestamptz NOT NULL,
  close_time timestamptz,
  status text NOT NULL CHECK (status IN ('open', 'closed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(account_id, ticket_number)
);

-- Indexes
CREATE INDEX idx_trades_account_id ON trades(account_id);
CREATE INDEX idx_trades_ticket ON trades(ticket_number);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_open_time ON trades(open_time);
```

### Trade Metrics Table
```sql
CREATE TABLE trade_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid REFERENCES trades(id) ON DELETE CASCADE NOT NULL,
  risk_amount numeric NOT NULL,
  reward_amount numeric NOT NULL,
  risk_reward_ratio numeric NOT NULL,
  win_loss text CHECK (win_loss IN ('win', 'loss', 'breakeven')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(trade_id)
);

-- Indexes
CREATE INDEX idx_trade_metrics_trade_id ON trade_metrics(trade_id);
```

## 3. Core Functions

### Account Management

#### deployAccount
```typescript
async function deployAccount(accountId: string): Promise<void> {
  // 1. Get account details from database
  // 2. Initialize MetaAPI client
  // 3. Create/get MetaAPI account
  // 4. Deploy if not deployed
  // 5. Wait for connection
  // 6. Update database status
}
```

#### validateCredentials
```typescript
async function validateCredentials(
  login: string,
  password: string,
  server: string
): Promise<{
  isValid: boolean;
  error?: string;
}> {
  // 1. Validate input format
  // 2. Test server connectivity
  // 3. Attempt demo login
  // 4. Return validation result
}
```

### Trading Operations

#### placeMarketOrder
```typescript
async function placeMarketOrder(
  accountId: string,
  orderParams: MarketOrderParams
): Promise<OrderResult> {
  // 1. Get account connection
  // 2. Validate order parameters
  // 3. Check risk limits
  // 4. Place order
  // 5. Store trade record
  // 6. Return result
}
```

#### calculatePositionSize
```typescript
async function calculatePositionSize(
  accountId: string,
  symbol: string,
  stopLoss: number,
  entryPrice: number
): Promise<number> {
  // 1. Get account equity and risk settings
  // 2. Calculate risk amount based on settings
  // 3. Calculate position size based on stop loss distance
  // 4. Apply position size limits
  // 5. Return calculated size
}
```

### Risk Management

#### checkRiskLimits
```typescript
async function checkRiskLimits(
  accountId: string,
  orderParams: MarketOrderParams
): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  // 1. Get account risk settings
  // 2. Check drawdown limit
  // 3. Check exposure per pair
  // 4. Check daily/weekly/monthly loss limits
  // 5. Return risk check result
}
```

#### calculateAccountMetrics
```typescript
async function calculateAccountMetrics(
  accountId: string,
  timeframe: 'day' | 'week' | 'month' | 'year'
): Promise<AccountMetrics> {
  // 1. Get trades for timeframe
  // 2. Calculate win rate
  // 3. Calculate profit factor
  // 4. Calculate drawdown
  // 5. Calculate other metrics
  // 6. Return metrics object
}
```

## 4. Security Considerations

### Authentication & Authorization
- All endpoints require valid JWT token
- Token must have appropriate scopes
- Account access restricted to owner
- Rate limiting applied per user/IP

### Data Validation
- Input validation on all parameters
- SQL injection prevention
- XSS protection
- Request size limits

### Error Handling
- Standardized error responses
- Detailed logging
- No sensitive data in errors
- Graceful degradation

## 5. Rate Limits

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| Account creation | 5 | per hour |
| Order placement | 60 | per minute |
| Position modifications | 120 | per minute |
| Data retrieval | 300 | per minute |

## 6. Dependencies

- MetaAPI SDK
- PostgreSQL 14+
- Node.js 18+
- Redis (for rate limiting)
- TypeScript 5+

## 7. Monitoring & Logging

### Metrics to Track
- Connection success rate
- Order execution time
- API response times
- Error rates by type
- Resource usage

### Log Levels
- ERROR: All errors and exceptions
- WARN: Potential issues
- INFO: Important operations
- DEBUG: Detailed debugging

## 8. Testing Requirements

### Unit Tests
- Input validation
- Business logic
- Error handling
- Edge cases

### Integration Tests
- API endpoints
- Database operations
- MetaAPI integration
- Error scenarios

### Performance Tests
- Load testing
- Stress testing
- Connection handling
- Concurrent operations