import { useAuth } from '@/contexts/AuthContext';
import { useDataRetrieval } from './useDataRetrieval';
import { getAccountTrades, getUserAccounts } from '@/services/api/tradingDataService';
import type { Trade, Account } from '@/types';

export function useTrading() {
  const { user } = useAuth();

  // Get user accounts
  const {
    data: accounts,
    loading: accountsLoading,
    error: accountsError
  } = useDataRetrieval<Account[]>({
    fetchFn: () => getUserAccounts(user?.id || ''),
    dependencies: [user?.id],
    transform: (accounts) => accounts.map((account: Account) => ({
      ...account,
      statistics: calculateAccountStats(account)
    }))
  });

  // Get trades for selected account
  const {
    data: trades,
    loading: tradesLoading,
    error: tradesError,
    refresh: refreshTrades
  } = useDataRetrieval<Trade[]>({
    fetchFn: () => getAccountTrades(accounts?.[0]?.id || ''),
    dependencies: [accounts?.[0]?.id],
    transform: (trades) => trades.sort((a, b) => 
      new Date(b.open_time).getTime() - new Date(a.open_time).getTime()
    )
  });

  return {
    accounts,
    trades,
    loading: accountsLoading || tradesLoading,
    error: accountsError || tradesError,
    refreshTrades
  };
}

function calculateAccountStats(account: Account) {
  // Add account statistics calculation logic here
  return {
    balance: account.balance || 0,
    equity: account.equity || 0,
    profit: account.profit || 0
  };
}