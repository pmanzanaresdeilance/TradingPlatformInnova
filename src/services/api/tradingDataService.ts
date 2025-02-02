import { DataService } from './dataService';
import type { Trade, Account } from '@/types';

// Trading accounts service
export const accountsService = new DataService({
  tableName: 'meta_api_accounts',
  externalApiEndpoint: '/accounts',
  transformResponse: (data) => data.map((account: any) => ({
    ...account,
    platform: account.platform || 'mt5',
    state: account.state || 'CREATED'
  }))
});

// Trades service
export const tradesService = new DataService({
  tableName: 'trades',
  externalApiEndpoint: '/trades',
  transformResponse: (data) => data.map((trade: any) => ({
    ...trade,
    profit_loss: parseFloat(trade.profit_loss || 0),
    commission: parseFloat(trade.commission || 0),
    swap: parseFloat(trade.swap || 0)
  }))
});

// Example usage functions
export async function getAccountTrades(accountId: string): Promise<Trade[]> {
  return tradesService.getData<Trade>({ account_id: accountId });
}

export async function getUserAccounts(userId: string): Promise<Account[]> {
  return accountsService.getData<Account>({ user_id: userId });
}