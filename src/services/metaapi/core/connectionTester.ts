import { logger } from '../utils/logger';
import { ConnectionError } from './errors';
import { MetaApiClient } from './client';
import { WebSocketClient } from './websocket';
import { HealthCheck } from '../utils/healthCheck';
import { WEBSOCKET_CONFIG } from '../config';

interface ConnectionTestResult {
  success: boolean;
  error?: string;
  details?: {
    internetConnectivity: boolean;
    brokerConnectivity: boolean;
    credentialsValid: boolean;
    serverResponse?: number;
    errorCode?: string;
  };
}

export class ConnectionTester {
  private static readonly TIMEOUT = 10000; // 10 seconds
  private static readonly RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  public static async testConnection(
    accountNumber: string,
    password: string,
    server: string,
    platform: 'mt4' | 'mt5'
  ): Promise<ConnectionTestResult> {
    try {
      logger.info('Starting connection test', {
        server,
        platform,
        accountNumber: accountNumber.substring(0, 3) + '***'
      });

      // Step 1: Check internet connectivity
      const internetConnectivity = await this.checkInternetConnectivity();
      if (!internetConnectivity) {
        return {
          success: false,
          error: 'No internet connection detected',
          details: {
            internetConnectivity: false,
            brokerConnectivity: false,
            credentialsValid: false
          }
        };
      }

      // Step 2: Validate broker server
      const brokerConnectivity = await this.checkBrokerConnectivity(server);
      if (!brokerConnectivity) {
        return {
          success: false,
          error: 'Unable to connect to broker server',
          details: {
            internetConnectivity: true,
            brokerConnectivity: false,
            credentialsValid: false
          }
        };
      }

      // Step 3: Validate credentials
      const credentialsValid = await this.validateCredentials(
        accountNumber,
        password,
        server,
        platform
      );

      if (!credentialsValid) {
        return {
          success: false,
          error: 'Invalid account credentials',
          details: {
            internetConnectivity: true,
            brokerConnectivity: true,
            credentialsValid: false
          }
        };
      }

      // Step 4: Test WebSocket connection
      const wsTest = await this.testWebSocketConnection(server);
      if (!wsTest.success) {
        return {
          success: false,
          error: 'WebSocket connection failed',
          details: {
            internetConnectivity: true,
            brokerConnectivity: true,
            credentialsValid: true,
            errorCode: wsTest.errorCode
          }
        };
      }

      logger.info('Connection test completed successfully', {
        server,
        platform
      });

      return {
        success: true,
        details: {
          internetConnectivity: true,
          brokerConnectivity: true,
          credentialsValid: true,
          serverResponse: wsTest.responseTime
        }
      };
    } catch (error) {
      logger.error('Connection test failed', { error });
      throw new ConnectionError(
        'Failed to complete connection test',
        { error }
      );
    }
  }

  private static async checkInternetConnectivity(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.status === 204;
    } catch {
      return false;
    }
  }

  private static async checkBrokerConnectivity(
    server: string
  ): Promise<boolean> {
    try {
      logger.info('Testing broker connectivity', { server });
      const healthCheck = HealthCheck.getInstance();
      let attempts = 0;
      let success = false;

      while (attempts < this.RETRY_ATTEMPTS && !success) {
        try {
          // Use MetaAPI's server validation endpoint
          const response = await fetch(
            'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/servers/mt5',
            {
              headers: {
                'auth-token': import.meta.env.VITE_META_API_TOKEN
              }
            }
          );

          const servers = await response.json();
          success = servers.some((s: any) => 
            s.name.toLowerCase() === server.toLowerCase() ||
            s.address.toLowerCase() === server.toLowerCase()
          });
        } catch {
          attempts++;
          if (attempts < this.RETRY_ATTEMPTS) {
            await new Promise(resolve => 
              setTimeout(resolve, this.RETRY_DELAY)
            );
          }
        }
      }

      logger.info('Broker connectivity test completed', {
        server,
        success,
        attempts
      });
      return success;
    } catch {
      return false;
    }
  }

  private static async validateCredentials(
    accountNumber: string,
    password: string,
    server: string,
    platform: 'mt4' | 'mt5'
  ): Promise<boolean> {
    try {
      // Test server connectivity first
      const serverConnectivity = await this.checkBrokerConnectivity(server);
      if (!serverConnectivity) {
        throw new Error('Server unreachable');
      }

      const client = MetaApiClient.getInstance(
        import.meta.env.VITE_META_API_TOKEN
      );

      // Validate credentials without creating an account
      const validationResult = await client.api.metatraderAccountApi.validateCredentials({
        login: accountNumber,
        password,
        server,
        platform
      });

      if (!validationResult.isValid) {
        throw new Error(validationResult.message || 'Invalid credentials');
      }
      return true;
    } catch (error) {
      logger.error('Credential validation failed', { error });
      return false;
    }
  }

  private static async testWebSocketConnection(
    server: string
  ): Promise<{ success: boolean; responseTime?: number; errorCode?: string }> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const ws = new WebSocketClient(
        `wss://${server}/ws`,
        import.meta.env.VITE_META_API_TOKEN
      );

      const timeout = setTimeout(() => {
        ws.disconnect();
        resolve({ 
          success: false, 
          errorCode: 'TIMEOUT' 
        });
      }, WEBSOCKET_CONFIG.heartbeatInterval);

      ws.connect();

      // Listen for successful connection
      setTimeout(() => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        clearTimeout(timeout);
        ws.disconnect();

        resolve({
          success: true,
          responseTime
        });
      }, 1000);

      // Handle connection error
      ws.onerror = (error) => {
        clearTimeout(timeout);
        ws.disconnect();
        resolve({ 
          success: false, 
          errorCode: error.code 
        });
      };
    });
  }
}