import MetaApi from 'metaapi.cloud-sdk';
import { META_API_CONFIG } from '../config';
import { CircuitBreaker } from './circuitBreaker';
import { RateLimiter } from './rateLimiter';
import { MetaStats } from 'metaapi.cloud-sdk';
import { logger } from '../utils/logger';
import { 
  MetaApiError, 
  ConnectionError, 
  AuthenticationError, 
  ValidationError,
  RateLimitError 
} from './errors';
import type { MetaApiConfig, MetaApiAccount, CreateAccountOptions } from './types';

export class MetaApiClient {
  private static instance: MetaApiClient;
  private api: MetaApi;
  private metaStats: MetaStats;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: RateLimiter;
  private connectionPool: Map<string, Promise<any>>;
  private cloudApi: any;
  private token: string;
  private static readonly BROKER_INFO_CACHE = new Map<string, any>();
  private static readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour
  private static statsCache = new Map<string, {
    data: any;
    timestamp: number;
  }>();
  private static lastCacheUpdate = 0;
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;

  private constructor(token: string, config: Partial<MetaApiConfig> = {}) {
    // Validate token format first
    if (!token || typeof token !== 'string' || token.length < 32) {
      throw new ValidationError('Invalid MetaAPI token format');
    }

    this.token = token;
    this.connectionPool = new Map();

    // Initialize MetaAPI SDK
    this.api = new MetaApi(token, {
      ...META_API_CONFIG,
      ...config
    });
    // Initialize MetaStats
    this.metaStats = new MetaStats(token, {
      domain: META_API_CONFIG.domain,
      requestTimeout: META_API_CONFIG.requestTimeout
    });

    // Initialize APIs
    this.cloudApi = this.api.metatraderAccountApi;

    this.circuitBreaker = new CircuitBreaker();
    this.rateLimiter = new RateLimiter();

    logger.info('MetaAPI client initialized successfully');
  }

  public static getInstance(token: string, config?: Partial<MetaApiConfig>): MetaApiClient {
    if (!token) {
      logger.error('MetaAPI token is missing');
      throw new ValidationError('MetaAPI token is required');
    }
    
    if (!MetaApiClient.instance || MetaApiClient.instance.token !== token) {
      MetaApiClient.instance = new MetaApiClient(token, config);
    }
    return MetaApiClient.instance;
  }

  // Ejecuta operaciones con manejo de errores y reintentos
  private async executeOperation<T>(operation: () => Promise<T>): Promise<T> {
    try {
      await this.rateLimiter.acquire();
      return await this.circuitBreaker.execute(operation);
    } catch (err: any) {
      this.handleError(err);
    }
  }

  // Manejo centralizado de errores
  private handleError(error: any): never {
    logger.error('MetaAPI operation failed', {
      name: error.name,
      message: error.message,
      details: error.details
    });

    const errorMap = {
      ValidationError: () => new ValidationError(error.message, error.details),
      UnauthorizedError: () => new AuthenticationError('Invalid or expired API token'),
      TooManyRequestsError: () => new RateLimitError('Rate limit exceeded'),
      ConnectionError: () => new ConnectionError('Failed to connect to MetaAPI')
    };

    throw errorMap[error.name]?.() || new MetaApiError(
      error.message || 'An unexpected error occurred',
      error.code,
      error.details
    );
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    retries = MetaApiClient.MAX_RETRIES,
    delay = MetaApiClient.RETRY_DELAY
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (err) {
        if (i === retries - 1) throw err;
        logger.warn('Operation failed, retrying...', {
          attempt: i + 1,
          maxAttempts: retries,
          error: err
        });
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
    throw new Error('Max retries reached');
  }

  private async getConnection(accountId: string) {
    if (!this.connectionPool.has(accountId)) {
      this.connectionPool.set(accountId, this.createConnection(accountId));
    }
    return this.connectionPool.get(accountId);
  }

  private async createConnection(accountId: string) {
    try {
      const account = await this.getAccount(accountId);
      const connection = account.getRPCConnection();
      
      await Promise.race([
        connection.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 30000)
        )
      ]);

      return connection;
    } catch (err) {
      this.connectionPool.delete(accountId);
      throw err;
    }
  }

  public async getBrokerInfo(brokerName: string): Promise<any> {
    return this.executeOperation(async () => {
      const now = Date.now();
      const cacheKey = brokerName.toLowerCase();

      // Check cache
      if (
        MetaApiClient.BROKER_INFO_CACHE.has(cacheKey) &&
        now - MetaApiClient.lastCacheUpdate < MetaApiClient.CACHE_TTL
      ) {
        logger.debug('Using cached broker info', { brokerName });
        return MetaApiClient.BROKER_INFO_CACHE.get(cacheKey);
      }

      // Check hardcoded data first
      const hardcodedBroker = BROKER_SERVERS[cacheKey as keyof typeof BROKER_SERVERS];
      if (hardcodedBroker) {
        logger.info('Using hardcoded broker info', { brokerName });
        MetaApiClient.BROKER_INFO_CACHE.set(cacheKey, hardcodedBroker);
        MetaApiClient.lastCacheUpdate = now;
        return hardcodedBroker;
      }

      // For other brokers, implement API call to MetaAPI's broker database
      logger.warn('Broker not in hardcoded list, attempting API lookup', { brokerName });
      
      // Implement fallback to MetaAPI broker database here
      // For now, return empty result to avoid errors
      return {
        name: brokerName,
        status: 'unknown',
        servers: []
      };
    });
  }

  public async createAccount(options: CreateAccountOptions): Promise<MetaApiAccount> {
    return this.executeOperation(async () => {
      try {
        // Validar datos de entrada
        this.validateAccountOptions(options);

        // Create MetaAPI account
        const account = await this.api.provisioningProfileApi.createAccount({
          name: options.name || `${options.server} - ${options.login}`,
          type: 'cloud',
          login: options.login,
          password: options.password,
          server: options.server,
          platform: options.platform,
          magic: Math.floor(Math.random() * 900000) + 100000,
          region: options.region || 'new-york',
          application: 'TradingJournal'
        });

        // Deploy account
        await account.deploy();
        
        logger.info('Account created successfully', {
          accountId: account.id,
          server: options.server
        });

        return account;
      } catch (error) {
        logger.error('Account creation failed', { error });
        throw error;
      }
    });
  }

  // Validación de datos para crear cuenta
  private validateAccountOptions(options: CreateAccountOptions): void {
    const validations = [
      {
        condition: !options.login || !options.password || !options.server || !options.platform,
        message: 'All fields are required'
      },
      {
        condition: !/^\d{5,8}$/.test(options.login),
        message: 'Account number must be 5-8 digits'
      },
      {
        condition: !['mt4', 'mt5'].includes(options.platform),
        message: 'Platform must be either mt4 or mt5'
      },
      {
        condition: !options.server.match(/^[A-Za-z0-9-]+$/),
        message: 'Invalid server name format'
      },
      {
        condition: options.password.length < 8,
        message: 'Password must be at least 8 characters'
      }
    ];

    const failed = validations.find(v => v.condition);
    if (failed) {
      throw new ValidationError(failed.message);
    }
  }

  private async waitForAccountCreation(accountId: string, timeout = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const account = await this.getAccount(accountId);
      
      if (account.state === 'DEPLOYED') {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Account creation timeout');
  }

  public async getAccount(accountId: string): Promise<MetaApiAccount> {
    return this.executeOperation(async () => {
      if (!accountId) {
        throw new ValidationError('Account ID is required');
      }

      const account = await this.api.metatraderAccountApi.getAccount(accountId);
      logger.info('Account retrieved successfully', { accountId });
      return account;
    });
  }

  public async getAccounts(): Promise<MetaApiAccount[]> {
    return this.executeOperation(async () => {
      const accounts = await this.api.metatraderAccountApi.getAccounts();
      
      if (!accounts || !Array.isArray(accounts)) {
        throw new Error('Invalid response from MetaAPI');
      }
      
      logger.info('Accounts retrieved successfully', { count: accounts.length });
      return accounts;
    });
  }

  public async removeAccount(accountId: string): Promise<void> {
    return this.executeOperation(async () => {
      if (!accountId) {
        throw new ValidationError('Account ID is required');
      }

      const account = await this.api.metatraderAccountApi.getAccount(accountId);
      await account.remove();
      logger.info('Account removed successfully', { accountId });
    });
  }

  public async deployAccount(accountId: string): Promise<void> {
    return this.executeOperation(async () => {
      if (!accountId) {
        throw new ValidationError('Account ID is required');
      }

      const account = await this.api.metatraderAccountApi.getAccount(accountId);
      await account.deploy();
      logger.info('Account deployed successfully', { accountId });
    });
  }

  public async undeployAccount(accountId: string): Promise<void> {
    return this.executeOperation(async () => {
      if (!accountId) {
        throw new ValidationError('Account ID is required');
      }

      const account = await this.api.metatraderAccountApi.getAccount(accountId);
      await account.undeploy();
      logger.info('Account undeployed successfully', { accountId });
    });
  }

  public async getHistoricalTrades(accountId: string, startTime: Date, endTime: Date) {
    return this.executeOperation(async () => {
      try {
        logger.info('Fetching historical trades', {
          accountId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        });

        const trades = await this.metaStats.getMetrics(
          accountId,
          {
            name: 'tradingMetrics',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            includePositions: true
          }
        );

        logger.info('Historical trades fetched successfully', {
          accountId,
          tradesCount: trades.trades
        });

        return trades;
      } catch (err) {
        logger.error('Failed to fetch historical trades', {
          error: err,
          accountId,
          startTime,
          endTime
        });
        throw err;
      }
    });
  }

  public async getAccountStats(accountId: string) {
    return this.executeOperation(async () => {
      try {
        const account = await this.getAccount(accountId);
        const metaApiAccountId = account?.id;

        if (!accountId) {
          throw new ValidationError('Account ID is required');
        }

        // Check cache
        const cacheKey = `stats_${accountId}`;
        const cached = MetaApiClient.statsCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < MetaApiClient.CACHE_TTL) {
          logger.debug('Using cached account stats', { accountId, metaApiAccountId });
          return cached.data;
        }

        logger.info('Starting metrics calculation', { accountId, metaApiAccountId });

        // Configure analysis period (last 30 days)
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000);

        try {
          // Get metrics and trades in parallel
          const [metrics, trades] = await Promise.all([
            this.metaStats.getMetrics(accountId, {
            name: 'tradingMetrics',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            includePositions: true
            }),
            this.metaStats.getAccountTrades(
              accountId,
              startTime.toISOString(),
              endTime.toISOString()
            )
          ]);

          logger.info('Metrics calculated successfully', {
            accountId,
            metaApiAccountId,
            period: '30d',
            trades: metrics.trades || 0,
            winRate: metrics.winRate || 0,
            profitFactor: metrics.profitFactor || 0
          });

          const stats = {
            trades: metrics.trades || 0,
            winRate: metrics.winRate || 0,
            profitFactor: metrics.profitFactor || 0,
            totalProfit: metrics.profit || 0,
            averageWin: metrics.averageWin || 0,
            averageLoss: metrics.averageLoss || 0,
            sharpeRatio: metrics.sharpeRatio || 0,
            maxDrawdown: metrics.maxDrawdown || 0,
            maxDrawdownDate: metrics.maxDrawdownTime,
            positions: metrics.positions || [],
            historicalTrades: trades || []
          };

          // Update cache
          MetaApiClient.statsCache.set(cacheKey, {
            data: stats,
            timestamp: Date.now()
          });

          return stats;
        } catch (metaStatsError) {
          logger.error('MetaStats API error', {
            error: metaStatsError,
            accountId
          });
          throw new Error('Failed to retrieve metrics from MetaStats API');
        }

      } catch (err) { 
        logger.error('Error calculating account metrics', {
          error: err,
          accountId,
          metaApiAccountId
        });
        throw err;
      }
    });
  }
}