import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { MetaApiClient } from '@/services/metaapi';
import type { MetatraderAccount } from 'metaapi.cloud-sdk';

interface MTAccountConnectionProps {
  onConnectionSuccess?: (account: MetatraderAccount) => void;
}

export function MTAccountConnection({ onConnectionSuccess }: MTAccountConnectionProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<any>(null);

  useEffect(() => {
    const connectToMetaApi = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        const client = MetaApiClient.getInstance(import.meta.env.VITE_META_API_TOKEN);
        const account = await client.getAccount(import.meta.env.VITE_MT_ACCOUNT_ID);

        // Deploy if needed
        if (account.state === 'UNDEPLOYED') {
          await account.deploy();
        }

        // Wait for connection
        const connection = await account.waitConnected();
        
        // Get account information
        const info = await connection.getAccountInformation();
        setAccountInfo(info);

        // Subscribe to updates
        connection.onAccountInformationUpdated((info) => {
          setAccountInfo(info);
        });

        if (onConnectionSuccess) {
          onConnectionSuccess(account);
        }
      } catch (err) {
        console.error('MetaAPI connection failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect to MetaAPI');
      } finally {
        setLoading(false);
      }
    };

    connectToMetaApi();
  }, [user, onConnectionSuccess]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-trading-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-trading-danger/10 border border-trading-danger/20 rounded-lg">
        <p className="text-sm text-trading-danger">{error}</p>
      </div>
    );
  }

  if (!accountInfo) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4">Account Information</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-400">Balance</span>
            <p className="text-xl font-bold">${accountInfo.balance.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-400">Equity</span>
            <p className="text-xl font-bold">${accountInfo.equity.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-400">Margin</span>
            <p className="text-xl font-bold">${accountInfo.margin.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-400">Free Margin</span>
            <p className="text-xl font-bold">${accountInfo.freeMargin.toFixed(2)}</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Margin Level</span>
            <span className={accountInfo.marginLevel < 100 ? 'text-trading-danger' : 'text-trading-success'}>
              {accountInfo.marginLevel.toFixed(2)}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full">
            <div
              className={`h-full rounded-full ${
                accountInfo.marginLevel < 100 ? 'bg-trading-danger' : 'bg-trading-success'
              }`}
              style={{ width: `${Math.min(accountInfo.marginLevel, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}