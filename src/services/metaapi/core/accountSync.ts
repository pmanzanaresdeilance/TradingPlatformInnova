import { supabase } from '@/lib/supabase';
import { logger } from '../utils/logger';
import type { MetaApiAccount } from './types';

interface SyncResult {
  status: 'created' | 'updated' | 'error';
  account: MetaApiAccount | null;
  error?: string;
}

export class AccountSyncService {
  public static async syncAccount(
    serviceAccount: MetaApiAccount,
    userId: string
  ): Promise<SyncResult> {
    try {
      logger.info('Starting account sync', {
        accountId: serviceAccount.id,
        userId
      });

      // Check if account exists in database
      const { data: existingAccount, error: fetchError } = await supabase
        .from('meta_api_accounts')
        .select('*')
        .eq('meta_api_account_id', serviceAccount.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
        throw fetchError;
      }

      if (!existingAccount) {
        // Create new account record
        const { data: newAccount, error: createError } = await supabase
          .from('meta_api_accounts')
          .insert({
            user_id: userId,
            meta_api_account_id: serviceAccount.id,
            name: serviceAccount.name,
            login: serviceAccount.login,
            server: serviceAccount.server,
            platform: serviceAccount.platform || 'mt5', // Ensure platform is set
            state: serviceAccount.state,
            connection_status: serviceAccount.connectionStatus
          })
          .select()
          .single();

        if (createError) throw createError;

        logger.info('Created new account record', {
          accountId: serviceAccount.id,
          userId
        });

        return {
          status: 'created',
          account: newAccount as MetaApiAccount
        };
      }

      // Check if update is needed
      const needsUpdate = 
        existingAccount.name !== serviceAccount.name ||
        existingAccount.state !== serviceAccount.state ||
        existingAccount.connection_status !== serviceAccount.connectionStatus;

      if (needsUpdate) {
        // Update existing account
        const { data: updatedAccount, error: updateError } = await supabase
          .from('meta_api_accounts')
          .update({
            name: serviceAccount.name,
            state: serviceAccount.state,
            connection_status: serviceAccount.connectionStatus,
            updated_at: new Date().toISOString()
          })
          .eq('meta_api_account_id', serviceAccount.id)
          .select()
          .single();

        if (updateError) throw updateError;

        logger.info('Updated account record', {
          accountId: serviceAccount.id,
          userId
        });

        return {
          status: 'updated',
          account: updatedAccount as MetaApiAccount
        };
      }

      // No update needed
      return {
        status: 'updated',
        account: existingAccount as MetaApiAccount
      };

    } catch (error) {
      logger.error('Account sync failed', {
        error,
        accountId: serviceAccount.id,
        userId
      });

      return {
        status: 'error',
        account: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  public static async validateAccountData(account: MetaApiAccount): Promise<string[]> {
    const errors: string[] = [];

    if (!account.id) {
      errors.push('Account ID is required');
    }

    if (!account.login || !/^\d{5,8}$/.test(account.login)) {
      errors.push('Invalid account login format');
    }

    if (!account.server) {
      errors.push('Server name is required');
    }

    if (!['mt4', 'mt5'].includes(account.platform)) {
      errors.push('Invalid platform type');
    }

    if (!['DEPLOYED', 'DEPLOYING', 'UNDEPLOYED'].includes(account.state)) {
      errors.push('Invalid account state');
    }

    if (!['CONNECTED', 'DISCONNECTED', 'CONNECTING'].includes(account.connectionStatus)) {
      errors.push('Invalid connection status');
    }

    return errors;
  }

  public static async getAccountByMetaApiId(metaApiAccountId: string): Promise<MetaApiAccount | null> {
    try {
      const { data, error } = await supabase
        .from('meta_api_accounts')
        .select('*')
        .eq('meta_api_account_id', metaApiAccountId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return null;
        }
        throw error;
      }

      return data as MetaApiAccount;
    } catch (error) {
      logger.error('Failed to fetch account by MetaAPI ID', {
        error,
        metaApiAccountId
      });
      throw error;
    }
  }
}