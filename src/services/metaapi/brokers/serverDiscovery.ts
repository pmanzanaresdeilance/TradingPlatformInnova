import axios from 'axios';
import { MetaApiClient } from '../core/client';
import { logger } from '../utils/logger';
import type { BrokerServer, BrokerGroup } from './types';

export class ServerDiscovery {
  private static readonly BROKER_SERVERS_CACHE = new Map<string, BrokerServer[]>();
  private static readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour
  private static lastCacheUpdate: number = 0;
  private static readonly MT_API_URL = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';

  public static async getBrokerServers(
    brokerName: string,
    platform: 'mt4' | 'mt5' = 'mt5',
    region?: string
  ): Promise<BrokerGroup[]> {
    try {
      // Check cache first
      const cacheKey = `${brokerName.toLowerCase()}-${platform}`;
      const now = Date.now();

      if (
        this.BROKER_SERVERS_CACHE.has(cacheKey) &&
        now - this.lastCacheUpdate < this.CACHE_TTL
      ) {
        const cachedServers = this.BROKER_SERVERS_CACHE.get(cacheKey)!;
        logger.debug('Using cached broker servers', {
          brokerName,
          platform,
          serversCount: cachedServers.length,
        });
        return this.filterServersByRegion(cachedServers, region);
      }

      // Fetch from MT provisioning API
      const response = await axios.get(
        `${this.MT_API_URL}/known-mt-servers/4/search`,
        { 
          params: { query: brokerName },
          headers: { 'auth-token': import.meta.env.VITE_META_API_TOKEN }
        }
      );

      if (response.status !== 200) {
        throw new Error(
          `Failed to fetch broker servers: ${
            response.data?.message || response.statusText
          }`
        );
      }

      const data = await response.json();
      const brokerGroups: BrokerGroup[] = Object.entries(data).map(([brokerName, servers]) => ({
        name: brokerName,
        servers: (servers as string[]).map(serverName => ({
          name: serverName,
          address: serverName,
          protocol: platform,
          region: this.extractRegionFromServer(serverName)
        }))
      }));

      // Update cache
      this.BROKER_SERVERS_CACHE.set(cacheKey, brokerGroups.flatMap(group => group.servers));
      this.lastCacheUpdate = now;

      logger.info('Retrieved broker servers', {
        brokerName,
        platform,
        groupsCount: brokerGroups.length,
        totalServers: brokerGroups.reduce((acc, group) => acc + group.servers.length, 0)
      });

      return region 
        ? brokerGroups.map(group => ({
            ...group,
            servers: this.filterServersByRegion(group.servers, region)
          }))
        : brokerGroups;
    } catch (error) {
      logger.error('Failed to get broker servers', {
        error,
        brokerName,
        platform,
      });
      throw error;
    }
  }

  public static async validateServer(
    server: string,
    platform: 'mt4' | 'mt5' = 'mt5'
  ): Promise<boolean> {
    try {
      const client = MetaApiClient.getInstance(
        import.meta.env.VITE_META_API_TOKEN
      );
      const result = await client.validateCredentials({
        login: '1', // Dummy login for validation
        password: 'dummy',
        server,
        platform,
      });

      return result.isValid;
    } catch (error) {
      logger.error('Failed to validate server', { error, server });
      return false;
    }
  }

  public static async pingServer(address: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = 5000;

      const response = await axios.head(`https://${address}/ping`, {
        timeout,
        signal: controller.signal,
      });

      return response.status === 200;
    } catch {
      return false;
    }
  }

  private static filterServersByRegion(
    servers: BrokerServer[],
    region?: string
  ): BrokerServer[] {
    if (!region) return servers;
    return servers.filter((server) => server.region === region);
  }

  private static extractRegionFromServer(serverName: string): string {
    // Extract region from server name if possible
    if (serverName.includes('Demo')) return 'demo';
    if (serverName.includes('ECN')) return 'ecn';
    if (serverName.includes('Pro')) return 'pro';
    return 'default';
  }
}