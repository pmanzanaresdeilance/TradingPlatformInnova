import React from 'react';
import { ChevronDown, Plus, Wallet, Building2 } from 'lucide-react';
import type { TradingAccount } from '@/hooks/useTradingAccounts';

interface AccountSelectorProps {
  accounts: TradingAccount[];
  selectedAccount: string | null;
  onAccountSelect: (accountId: string) => void;
  onAddAccount: () => void;
}

export function AccountSelector({
  accounts,
  selectedAccount,
  onAccountSelect,
  onAddAccount
}: AccountSelectorProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-4">
      <div className="relative flex-1 group w-full">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Wallet className="w-5 h-5 text-gray-400 group-focus-within:text-trading-accent transition-colors" />
        </div>
        <select
          value={selectedAccount || ''}
          onChange={(e) => onAccountSelect(e.target.value)}
          className="w-full bg-gray-700/50 rounded-lg pl-10 pr-10 py-2.5 md:py-3 text-sm md:text-base text-white appearance-none focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-colors"
        >
          <option value="">Select Trading Account</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} • {account.broker} • {account.account_number}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-trading-accent transition-colors pointer-events-none" />
      </div>

      <button
        onClick={onAddAccount}
        className="flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors text-sm md:text-base whitespace-nowrap"
      >
        <Plus className="w-4 h-4" />
        Add Account
      </button>
    </div>
  );
}