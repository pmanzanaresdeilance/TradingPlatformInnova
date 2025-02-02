import { MetaApiClient } from './client';
import { ConnectionTester } from './connectionTester';
import { SecurityManager } from './security';
import { logger } from '../utils/logger';
import { AuditLogger, AuditEventType } from './audit';
import { ValidationError } from './errors';
import type { MetaApiAccount } from './types';

interface MT5ConnectionOptions {
  login: string;
  password: string;
  server: string;
  region?: string;
}

export class MT5Connection {
  private client: MetaApiClient;
  private security: SecurityManager;
  private auditLogger: AuditLogger;
  private account: MetaApiAccount | null = null;

  constructor(token: string) {
    this.client = MetaApiClient.getInstance(token);
    this.security = SecurityManager.getInstance();
    this.auditLogger = new AuditLogger();
  }

  public async connect(options: MT5ConnectionOptions): Promise<MetaApiAccount> {
    try {
      logger.info('Initiating MT5 connection', {
        server: options.server
      });

      await this.validateConnectionParams(options);

      // Create MetaAPI account
      this.account = await this.client.createAccount({
        name: `${options.server} - ${options.login}`,
        login: options.login,
        password: options.password,
        server: options.server,
        platform: 'mt5' as const, // Explicitly type as const
        region: options.region
      });

      logger.info('MetaAPI account created', {
        accountId: this.account.id,
        state: this.account.state,
        platform: 'mt5',
        server: options.server
      });

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('User not authenticated');

      // Store account in database with meta_api_account_id
      const { data: dbAccount, error: dbError } = await supabase
        .from('meta_api_accounts') 
        .insert({
          user_id: user.id,
          meta_api_account_id: this.account.id,
          name: options.server, // Use the actual server name selected
          login: options.login,
          server: options.server,
          platform: 'mt5',
          state: this.account.state,
          connection_status: this.account.connectionStatus
        })
        .select()
        .single();

      if (dbError) {
        logger.error('Failed to store MetaAPI account', { 
          error: dbError,
          accountId: this.account.id,
          details: dbError.details
        });
        throw dbError;
      }

      logger.info('Account stored in database', {
        dbAccountId: dbAccount.id,
        metaApiAccountId: this.account.id,
        server: options.server
      });

      // Wait for deployment and connection
      await this.waitForConnection();

      // Log successful connection
      await this.auditLogger.logEvent({
        type: AuditEventType.CONNECTION_ESTABLISHED,
        userId: user.id,
        accountId: this.account.id,
        metadata: {
          server: options.server,
          platform: 'mt5',
          connectionStatus: this.account.connectionStatus
        },
        severity: 'INFO'
      });

      return this.account;
    } catch (error) {
      logger.error('MT5 connection failed', { error });

      await this.auditLogger.logEvent({
        type: AuditEventType.CONNECTION_FAILED,
        userId: 'system',
        metadata: {
          server: options.server,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        severity: 'ERROR'
      });

      throw error;
    }
  }

  private async validateConnectionParams(options: MT5ConnectionOptions): Promise<void> {
    const errors: string[] = [];

    // Validate login format (5-8 digits)
    if (!/^\d{5,8}$/.test(options.login)) {
      errors.push('Login must be 5-8 digits');
    }

    // Validate password requirements
    if (options.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    // Validate server name format
    if (!options.server) {
      errors.push('Server name is required');
    }

    if (errors.length > 0) {
      throw new ValidationError('Invalid connection parameters', errors);
    }
  }

  private async waitForConnection(timeout: number = 30000): Promise<void> {
    if (!this.account) {
      throw new Error('No account to connect to');
    }

    const startTime = Date.now();
    let lastState = '';
    let lastStatus = '';
    
    while (Date.now() - startTime < timeout) {
      const account = await this.client.getAccount(this.account.id);
      
      // Log state changes
      if (account.state !== lastState || account.connectionStatus !== lastStatus) {
        logger.info('Account connection status update', {
          accountId: this.account.id,
          state: account.state,
          connectionStatus: account.connectionStatus,
          previousState: lastState,
          previousStatus: lastStatus
        });
        lastState = account.state;
        lastStatus = account.connectionStatus;
      }

      if (account.state === 'DEPLOYED' && account.connectionStatus === 'CONNECTED') {
        logger.info('Account successfully connected', {
          accountId: this.account.id,
          timeElapsed: Date.now() - startTime
        });
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    logger.error('Connection timeout', {
      accountId: this.account.id,
      lastState,
      lastStatus,
      timeElapsed: Date.now() - startTime
    });
    throw new Error('Connection timeout');
  }

  public async disconnect(): Promise<void> {
    if (!this.account) {
      return;
    }

    try {
      await this.client.undeployAccount(this.account.id);
      
      await this.auditLogger.logEvent({
        type: AuditEventType.ACCOUNT_UPDATED,
        userId: 'system',
        accountId: this.account.id,
        metadata: {
          action: 'disconnect',
          status: 'success'
        },
        severity: 'INFO'
      });
    } catch (error) {
      logger.error('Failed to disconnect account', { error });
      throw error;
    }
  }

  public getAccount(): MetaApiAccount | null {
    return this.account;
  }

  public isConnected(): boolean {
    return this.account?.state === 'DEPLOYED' && 
           this.account?.connectionStatus === 'CONNECTED';
  }
}