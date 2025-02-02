import { supabase } from '@/lib/supabase';
import { logger } from '../utils/logger';
import { ServerDiscovery } from './serverDiscovery';
import type { BrokerServer } from './types';

interface ServerSyncStats {
  added: number;
  updated: number;
  removed: number;
  errors: number;
}

export class ServerService {
  private static readonly CACHE_KEY = 'mt_servers_cache';
  private static readonly CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

  public static async syncServers(): Promise<ServerSyncStats> {
    const stats: ServerSyncStats = {
      added: 0,
      updated: 0,
      removed: 0,
      errors: 0
    };

    try {
      logger.info('Starting server sync');

      // Get existing servers from database
      const { data: existingServers, error: fetchError } = await supabase
        .from('trading_servers')
        .select('*');

      if (fetchError) throw fetchError;

      // Get servers from MetaAPI
      const client = new ServerDiscovery();
      const brokers = ['roboforex', 'icmarkets', 'fxpro', 'pepperstone'];
      const platforms = ['mt4', 'mt5'];
      const newServers: BrokerServer[] = [];

      for (const broker of brokers) {
        for (const platform of platforms) {
          try {
            const servers = await client.getBrokerServers(broker, platform);
            newServers.push(...servers);
          } catch (err) {
            logger.error('Error fetching servers', { broker, platform, error: err });
            stats.errors++;
          }
        }
      }

      // Process servers in batches
      const batchSize = 100;
      for (let i = 0; i < newServers.length; i += batchSize) {
        const batch = newServers.slice(i, i + batchSize);
        
        // Upsert servers
        const { error: upsertError } = await supabase
          .from('trading_servers')
          .upsert(
            batch.map(server => ({
              server_id: `${server.name}-${server.address}`,
              name: server.name,
              server_type: server.protocol,
              broker_name: server.name.split('-')[0],
              broker_timezone: 'UTC', // Default to UTC
              address: server.address,
              description: server.description,
              region: server.region,
              reliability: server.reliability || 1,
              connection_status: 'active',
              last_updated_at: new Date().toISOString()
            })),
            {
              onConflict: 'server_id',
              ignoreDuplicates: false
            }
          );

        if (upsertError) {
          logger.error('Error upserting servers', { error: upsertError });
          stats.errors++;
          continue;
        }

        // Count stats
        for (const server of batch) {
          const existing = existingServers?.find(s => 
            s.server_id === `${server.name}-${server.address}`
          );
          
          if (existing) {
            stats.updated++;
          } else {
            stats.added++;
          }
        }
      }

      // Remove old servers
      const newServerIds = newServers.map(s => `${s.name}-${s.address}`);
      const serversToRemove = existingServers?.filter(
        s => !newServerIds.includes(s.server_id)
      ) || [];

      if (serversToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('trading_servers')
          .delete()
          .in('server_id', serversToRemove.map(s => s.server_id));

        if (deleteError) {
          logger.error('Error removing old servers', { error: deleteError });
          stats.errors++;
        } else {
          stats.removed = serversToRemove.length;
        }
      }

      // Update cache in local storage
      localStorage.setItem(this.CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        servers: newServers
      }));

      logger.info('Server sync completed', { stats });
      return stats;
    } catch (error) {
      logger.error('Server sync failed', { error });
      throw error;
    }
  }

  public static async getServers(
    brokerName?: string,
    platform?: 'mt4' | 'mt5',
    region?: string
  ): Promise<BrokerServer[]> {
    try {
      // Try cache first
      const cachedData = localStorage.getItem(this.CACHE_KEY);
      if (cachedData) {
        const { timestamp, servers } = JSON.parse(cachedData);
        if (Date.now() - timestamp < this.CACHE_TTL) {
          return this.filterServers(servers, brokerName, platform, region);
        }
      }

      // Query database
      let query = supabase
        .from('trading_servers')
        .select('*')
        .eq('connection_status', 'active');

      if (brokerName) {
        query = query.eq('broker_name', brokerName);
      }

      if (platform) {
        query = query.eq('server_type', platform);
      }

      if (region) {
        query = query.eq('region', region);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(server => ({
        name: server.name,
        address: server.address,
        description: server.description,
        protocol: server.server_type,
        region: server.region,
        reliability: server.reliability
      }));
    } catch (error) {
      logger.error('Error fetching servers', { error });
      throw error;
    }
  }

  private static filterServers(
    servers: BrokerServer[],
    brokerName?: string,
    platform?: 'mt4' | 'mt5',
    region?: string
  ): BrokerServer[] {
    return servers.filter(server => {
      if (brokerName && !server.name.toLowerCase().includes(brokerName.toLowerCase())) {
        return false;
      }
      if (platform && server.protocol !== platform) {
        return false;
      }
      if (region && server.region !== region) {
        return false;
      }
      return true;
    });
  }
}