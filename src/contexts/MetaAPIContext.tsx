import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import MetaApi from 'metaapi.cloud-sdk';
import MetaStats from 'metaapi.cloud-sdk';

// Tipos mejorados
interface AccountStats {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  profitToday: number;
}

interface AccountOptions {
  login: string;
  password: string;
  server: string;
  platform: 'mt4' | 'mt5';
}

interface MetaAPIContextType {
  accounts: any[];
  loading: boolean;
  error: string | null;
  accountStats: Record<string, AccountStats>;
  createAccount: (options: AccountOptions) => Promise<any>;
  removeAccount: (accountId: string) => Promise<void>;
  deployAccount: (accountId: string) => Promise<void>;
  undeployAccount: (accountId: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
}

const MetaAPIContext = createContext<MetaAPIContextType | undefined>(undefined);

const REQUIRED_TOKEN_LENGTH = 32;

export function MetaAPIProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<{ metaApiClient: any; metaStatsClient: any } | null>(null);
  const [accountStats, setAccountStats] = useState<Record<string, AccountStats>>({});
  const mounted = useRef(true);
  const initializePromise = useRef<Promise<void> | null>(null);

  // Helper function to log account stats updates
  const updateAccountStats = useCallback((accountId: string, info: any) => {
    console.log(`Updating stats for account ${accountId}:`, info);
    setAccountStats(prev => ({
      ...prev,
      [accountId]: {
        balance: info.balance,
        equity: info.equity,
        margin: info.margin,
        freeMargin: info.freeMargin,
        marginLevel: info.marginLevel,
        profitToday: info.profit || 0
      }
    }));
  }, []);

  // Validate MetaAPI token
  const validateToken = useCallback((token: string | undefined): string => {
    console.log('Validating MetaAPI token...');
    if (!token) {
      console.error('MetaAPI token not found in environment variables');
      throw new Error('MetaAPI token not found in environment variables');
    }

    if (typeof token !== 'string' || token.length < REQUIRED_TOKEN_LENGTH) {
      console.error('Invalid MetaAPI token format');
      throw new Error('Invalid MetaAPI token format');
    }

    console.log('MetaAPI token validated successfully');
    return token;
  }, []);

  // Initialize MetaAPI client
  const initializeClient = useCallback(async () => {
    console.log('Initializing MetaAPI client...');
    try {
      const token = validateToken(import.meta.env.VITE_META_API_TOKEN);
      const metaApiClient = new MetaApi(token);
      const metaStatsClient = new MetaStats(token);

      setClient({ metaApiClient, metaStatsClient });
      console.log('MetaAPI client initialized successfully');
      return { metaApiClient, metaStatsClient };
    } catch (err) {
      console.error('Failed to initialize MetaAPI client:', err);
      throw new Error('Unable to initialize trading features');
    }
  }, [validateToken]);

  // Handle account connection
  const handleAccountConnection = useCallback(async (
    account: any,
    currentClient: { metaApiClient: any; metaStatsClient: any }
  ) => {
    console.log(`Handling connection for account ${account.id}...`);
    try {
      const accountDetails = await currentClient.metaApiClient.metatraderAccountApi.getAccount(account.id);
      console.log(`Account details for ${account.id}:`, accountDetails);

      if (accountDetails.state !== 'DEPLOYED') {
        console.log(`Deploying account ${account.id}...`);
        await accountDetails.deploy();
      } else {
        console.log(`Account ${account.id} is already deployed`);
      }

      console.log(`Waiting for account ${account.id} to connect to broker...`);
      if (accountDetails.connectionStatus !== 'CONNECTED') {
        await accountDetails.waitConnected();
      }
      console.log(`Account ${account.id} is connected to broker`);

      const metrics = await currentClient.metaStatsClient.getMetrics(account.id);
      console.log(`Metrics for account ${account.id}:`, metrics);

      if (mounted.current) {
        updateAccountStats(account.id, {
          balance: metrics.balance,
          equity: metrics.equity,
          margin: metrics.margin,
          freeMargin: metrics.freeMargin,
          marginLevel: metrics.marginLevel,
          profitToday: metrics.profit || 0
        });
      }

      const openTrades = await currentClient.metaStatsClient.getAccountOpenTrades(account.id);
      console.log(`Open trades for account ${account.id}:`, openTrades);

    } catch (err) {
      console.error(`Error processing account ${account.id}:`, err);
      throw err;
    }
  }, [updateAccountStats]);

  // Load accounts and establish connections
  const loadAccountsAndConnect = useCallback(async (currentClient: { metaApiClient: any; metaStatsClient: any }) => {
    console.log('Loading accounts and establishing connections...');
    if (!mounted.current) return;

    try {
      setLoading(true);
      const fetchedAccounts = await currentClient.metaApiClient.metatraderAccountApi.getAccounts();
      console.log('Fetched accounts:', fetchedAccounts);

      if (!mounted.current) return;

      const results = await Promise.allSettled(
        fetchedAccounts.map(account =>
          handleAccountConnection(account, currentClient)
        )
      );

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to connect account ${fetchedAccounts[index].id}:`, result.reason);
        }
      });

      if (mounted.current) {
        setAccounts(fetchedAccounts);
        setLoading(false);
      }

      console.log('Accounts loaded and connections established successfully');
    } catch (err) {
      console.error('Failed to load accounts and establish connections:', err);
      if (mounted.current) {
        setError('Unable to load trading accounts');
        setLoading(false);
      }
    }
  }, [handleAccountConnection]);

  // Main initialization effect
  useEffect(() => {
    if (!user) {
      console.log('No user found, skipping initialization');
      return;
    }
    mounted.current = true;

    const initialize = async () => {
      try {
        console.log('Starting initialization process...');
        const currentClient = await initializeClient();
        await loadAccountsAndConnect(currentClient);
        console.log('Initialization process completed successfully');
      } catch (err) {
        console.error('Error during initialization:', err);
        if (mounted.current) {
          setError(err instanceof Error ? err.message : 'Unknown error occurred');
          setLoading(false);
        }
      }
    };

    if (!initializePromise.current) {
      initializePromise.current = initialize();
    }

    return () => {
      console.log('Cleaning up...');
      mounted.current = false;
    };
  }, [user, initializeClient, loadAccountsAndConnect]);

  const value = {
    accounts,
    accountStats,
    loading,
    error,
    createAccount: async () => { throw new Error('Not implemented'); },
    removeAccount: async () => { throw new Error('Not implemented'); },
    deployAccount: async () => { throw new Error('Not implemented'); },
    undeployAccount: async () => { throw new Error('Not implemented'); },
    refreshAccounts: async () => { throw new Error('Not implemented'); }
  };

  return (
    <MetaAPIContext.Provider value={value}>
      {children}
    </MetaAPIContext.Provider>
  );
}

export const useMetaAPI = () => {
  const context = useContext(MetaAPIContext);
  if (context === undefined) {
    throw new Error('useMetaAPI must be used within a MetaAPIProvider');
  }
  return context;
};