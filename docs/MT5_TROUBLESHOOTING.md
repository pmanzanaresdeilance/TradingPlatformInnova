# MetaTrader Connection Troubleshooting Guide

## Error Description
When attempting to connect a MetaTrader account, the server validation process fails with the error "Dice Server Validation Failed". This typically occurs during the initial connection setup or when trying to validate broker server settings.

## Quick Checklist
- [ ] MetaTrader platform version
- [ ] Broker server address
- [ ] Account credentials
- [ ] Network connectivity
- [ ] MetaAPI token validity
- [ ] Server region settings

## Step-by-Step Troubleshooting

### 1. Verify MetaTrader Server Connection

#### Check Server Status
```bash
# Server validation endpoint
GET https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/servers/mt5
```

Expected Response:
```json
{
  "name": "RoboForex-ECN",
  "address": "mt5ecn.roboforex.com",
  "region": "new-york",
  "reliability": "high"
}
```

#### Common Server Issues:
- Incorrect server address format
- Server maintenance periods
- Regional access restrictions
- SSL/TLS certificate issues

### 2. Validate Account Credentials

#### Required Format:
- Account Number: 5-8 digits
- Password: Minimum 8 characters
- Server: Alphanumeric with hyphens only

#### Validation Process:
1. Check account number format
2. Verify password meets requirements
3. Confirm server name matches broker's format
4. Test credentials without account creation

### 3. Network Connectivity Tests

#### Required Endpoints:
```plaintext
- mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai
- mt-client-api-v1.agiliumtrade.agiliumtrade.ai
- Broker's MT5 server (e.g., mt5ecn.roboforex.com)
```

#### Network Requirements:
- Stable internet connection
- Open ports: 443 (HTTPS), 8443 (WSS)
- No firewall blocking MetaAPI domains
- VPN compatibility (if used)

### 4. MetaAPI Configuration

#### Token Validation:
```typescript
// Test token validity
const response = await fetch('https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts', {
  headers: {
    'auth-token': META_API_TOKEN
  }
});
```

#### Required Permissions:
- Account management
- Trading operations
- Market data access
- Risk management features

### 5. Error Codes and Solutions

| Error Code | Description | Solution |
|------------|-------------|----------|
| `SERVER_VALIDATION_FAILED` | Cannot validate broker server | Verify server address and availability |
| `INVALID_CREDENTIALS` | Account credentials rejected | Check login/password format |
| `CONNECTION_TIMEOUT` | Server connection timeout | Check network stability |
| `TOKEN_EXPIRED` | Invalid or expired MetaAPI token | Refresh API token |
| `REGION_MISMATCH` | Server region configuration error | Update region settings |

### 6. Logging and Debugging

Enable detailed logging:
```typescript
logger.setLevel(LogLevel.DEBUG);
```

Important log patterns:
```plaintext
[ERROR] Server validation failed: {error: {...}}
[ERROR] Connection test failed: {details: {...}}
[ERROR] MetaAPI operation failed: {code: "...", message: "..."}
```

### 7. Common Solutions

1. **Server Validation Failure**
   ```typescript
   // Correct server validation approach
   const serverInfo = await client.getBrokerInfo(brokerName);
   const validServer = serverInfo.servers.find(s => 
     s.name === serverName || s.address === serverAddress
   );
   ```

2. **Connection Timeout**
   ```typescript
   // Implement retry logic
   const result = await retry(
     async () => await testConnection(credentials),
     {
       retries: 3,
       minDelay: 1000,
       maxDelay: 5000
     }
   );
   ```

3. **Invalid Credentials**
   ```typescript
   // Validate credentials format
   if (!/^\d{5,8}$/.test(accountNumber)) {
     throw new ValidationError('Invalid account number format');
   }
   ```

### 8. Prevention Measures

1. **Pre-connection Validation**
   - Validate server availability
   - Check credential format
   - Verify network connectivity
   - Test API token validity

2. **Connection Monitoring**
   - Implement health checks
   - Monitor connection stability
   - Log connection events
   - Track error patterns

3. **Error Recovery**
   - Implement automatic reconnection
   - Cache server information
   - Handle network interruptions
   - Provide user feedback

## Support Resources

- [MetaAPI Documentation](https://metaapi.cloud/docs/client/)
- [MT5 Server List](https://www.metatrader5.com/en/trading-platform/help/start_advanced/server)
- [Network Requirements](https://www.metatrader5.com/en/terminal/help/start_advanced/installation#system)
- [Error Code Reference](https://metaapi.cloud/docs/client/errors/)