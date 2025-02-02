import { supabase } from '@/lib/supabase';
import { BaseApiService } from './base';
import { logger } from '@/utils/logger';
import type { MetaApiAccount } from '@/services/metaapi/core/types';

export class AccountsService extends BaseApiService {
  private static readonly ACCOUNTS_CACHE_KEY = 'user_accounts';

  public static async getUserAccounts(userId: string): Promise<MetaApiAccount[]> {
    return this.getCached(
      `${this.ACCOUNTS_CACHE_KEY}:${userId}`,
      async () => {
        return this.executeQuery(
          () => supabase
            .from('meta_api_accounts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
          'Failed to fetch user accounts'
        );
      }
    );
  }

  public static async syncAccount(
    account: MetaApiAccount,
    userId: string
  ): Promise<MetaApiAccount> {
    try {
      logger.info('Syncing account with database', {
        accountId: account.id,
        userId
      });

      // First try to find existing account
      const { data: existingAccount } = await supabase
        .from('meta_api_accounts')
        .select('id, meta_api_account_id')
        .eq('meta_api_account_id', account.id.toString())
        .single();

      const accountData = {
          user_id: userId,
          meta_api_account_id: account.id.toString(),
          name: account.name,
          login: account.login,
          server: account.server,
          platform: account.platform || 'mt5',
          state: account.state,
          connection_status: account.connectionStatus,
          updated_at: new Date().toISOString()
      };

      const { data, error } = existingAccount
        ? await supabase
            .from('meta_api_accounts')
            .update(accountData)
            .eq('meta_api_account_id', account.id.toString())
            .select()
            .single()
        : await supabase
            .from('meta_api_accounts')
            .insert(accountData)
            .select()
            .single();

      if (error) throw error;

      // Clear cache after successful sync
      this.clearCache(`${this.ACCOUNTS_CACHE_KEY}:${userId}`);

      logger.info('Account synced successfully', {
        accountId: account.id,
        userId
      });

      return data;
    } catch (error) {
      logger.error('Failed to sync account', {
        error,
        accountId: account.id,
        userId
      });
      throw error;
    }
  }

  public static async getAccountByMetaApiId(metaApiAccountId: string): Promise<MetaApiAccount | null> {
    try {
      const { data, error } = await supabase
        .from('meta_api_accounts')
        .select('*')
        .eq('meta_api_account_id', metaApiAccountId.toString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to fetch account by MetaAPI ID', {
        error,
        metaApiAccountId
      });
      throw error;
    }
  }

  public static async deleteAccount(accountId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('meta_api_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      this.clearCache(this.ACCOUNTS_CACHE_KEY);
    } catch (error) {
      logger.error('Failed to delete account', { error, accountId });
      throw error;
    }
  }
}