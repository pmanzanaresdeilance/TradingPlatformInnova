import { supabase } from '@/lib/supabase';
import { logger } from '../utils/logger';
import { ServerService } from './serverService';

export class ServerMonitor {
  private static readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static readonly RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second
  private intervalId: NodeJS.Timeout | null = null;

  public startMonitoring(): void {
    if (this.intervalId) {
      logger.warn('Server monitoring already started');
      return;
    }

    this.checkServers();
    this.intervalId = setInterval(() => this.checkServers(), ServerMonitor.CHECK_INTERVAL);
    logger.info('Server monitoring started');
  }

  public stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Server monitoring stopped');
    }
  }

  private async checkServers(): Promise<void> {
    try {
      logger.info('Starting server health check');

      const { data: servers, error } = await supabase
        .from('trading_servers')
        .select('*')
        .eq('connection_status', 'active');

      if (error) throw error;

      for (const server of servers) {
        let attempts = 0;
        let success = false;

        while (attempts < ServerMonitor.RETRY_ATTEMPTS && !success) {
          try {
            const isHealthy = await this.checkServerHealth(server.address);
            
            if (!isHealthy) {
              logger.warn('Server health check failed', {
                server: server.name,
                attempt: attempts + 1
              });
              
              attempts++;
              if (attempts < ServerMonitor.RETRY_ATTEMPTS) {
                await new Promise(resolve => 
                  setTimeout(resolve, ServerMonitor.RETRY_DELAY)
                );
                continue;
              }
            } else {
              success = true;
            }
          } catch (err) {
            logger.error('Server health check error', {
              server: server.name,
              error: err
            });
            attempts++;
            if (attempts < ServerMonitor.RETRY_ATTEMPTS) {
              await new Promise(resolve => 
                setTimeout(resolve, ServerMonitor.RETRY_DELAY)
              );
              continue;
            }
          }
        }

        // Update server status
        const { error: updateError } = await supabase
          .from('trading_servers')
          .update({
            connection_status: success ? 'active' : 'error',
            last_checked_at: new Date().toISOString(),
            reliability: success 
              ? Math.min((server.reliability || 1) + 0.1, 1)
              : Math.max((server.reliability || 1) - 0.2, 0)
          })
          .eq('server_id', server.server_id);

        if (updateError) {
          logger.error('Failed to update server status', {
            server: server.name,
            error: updateError
          });
        }
      }

      logger.info('Server health check completed', {
        checkedServers: servers.length
      });
    } catch (error) {
      logger.error('Server monitoring failed', { error });
    }
  }

  private async checkServerHealth(address: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`https://${address}/ping`, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
}