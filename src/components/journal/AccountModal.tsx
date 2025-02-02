import React, { useState, useEffect } from 'react';
import { Loader2, Building2, Wallet, DollarSign, Percent, X, ChevronDown, AlertTriangle } from 'lucide-react';
import type { TradingAccount } from '@/hooks/useTradingAccounts';
import { useMasterData } from '@/hooks/useMasterData';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<TradingAccount, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  account?: TradingAccount;
}

export function AccountModal({ isOpen, onClose, onSubmit, account }: AccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { brokers } = useMasterData();
  const [formData, setFormData] = useState({
    name: account?.name || "",
    broker: account?.broker || "",
    account_number: account?.account_number || "",
    initial_balance: account?.initial_balance || 0,
    current_balance: account?.current_balance || 0,
    currency: account?.currency || "USD",
    leverage: account?.leverage || 100
  });

  // Initialize form data when account prop changes
  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        broker: account.broker,
        account_number: account.account_number,
        initial_balance: account.initial_balance,
        current_balance: account.current_balance,
        currency: account.currency || 'USD',
        leverage: account.leverage || 100
      });
    }
  }, [account]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-800 rounded-xl overflow-hidden max-w-md w-full mx-4 shadow-2xl transform transition-all hover:scale-[1.02] border border-gray-700/50">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-gray-800 via-gray-800 to-gray-700/50 border-b border-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-trading-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-trading-accent/20 to-trading-accent/5 flex items-center justify-center transform transition-all duration-500 hover:scale-110 hover:rotate-3 shadow-lg shadow-trading-accent/10">
              <Building2 className="w-5 h-5 text-trading-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {account ? 'Edit Trading Account' : 'Add Trading Account'}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {account ? 'Update your trading account details' : 'Connect a new trading account'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-trading-danger/10 border border-trading-danger/20 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-trading-danger/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-trading-danger" />
            </div>
            <p className="text-sm text-trading-danger flex-1">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Account Name *
            </label>
            <div className="relative">
              <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-700/50 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 placeholder-gray-500 border border-gray-600/50 hover:border-trading-accent/50"
              placeholder="e.g., Main Trading Account"
              required
            />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Broker *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.broker}
                onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
                className="w-full bg-gray-700/50 rounded-xl pl-10 pr-10 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 appearance-none border border-gray-600/50 hover:border-trading-accent/50"
                required
              >
                <option value="">Select Broker</option>
                {brokers?.map((broker) => (
                  <option key={broker.id} value={broker.name} className="bg-gray-800">
                    {broker.name} {broker.description ? `- ${broker.description}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Account Number *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
              type="text"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              className="w-full bg-gray-700/50 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 placeholder-gray-500 border border-gray-600/50 hover:border-trading-accent/50"
              placeholder="Enter MT4/MT5 account number"
              required
            />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Initial Balance *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                type="number"
                value={formData.initial_balance}
                onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) })}
                className="w-full bg-gray-700/50 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 placeholder-gray-500 border border-gray-600/50 hover:border-trading-accent/50"
                placeholder="0.00"
                step="0.01"
                required
              />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Current Balance *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                type="number"
                value={formData.current_balance}
                onChange={(e) => setFormData({ ...formData, current_balance: parseFloat(e.target.value) })}
                className="w-full bg-gray-700/50 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 placeholder-gray-500 border border-gray-600/50 hover:border-trading-accent/50"
                placeholder="0.00"
                step="0.01"
                required
              />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Currency
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full bg-gray-700/50 rounded-xl pl-10 pr-10 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 appearance-none placeholder-gray-500 border border-gray-600/50 hover:border-trading-accent/50"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Leverage
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                value={formData.leverage}
                onChange={(e) => setFormData({ ...formData, leverage: parseInt(e.target.value) })}
                className="w-full bg-gray-700/50 rounded-xl pl-10 pr-10 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 appearance-none placeholder-gray-500 border border-gray-600/50 hover:border-trading-accent/50"
              >
                <option value="50">1:50</option>
                <option value="100">1:100</option>
                <option value="200">1:200</option>
                <option value="500">1:500</option>
              </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-700/50 text-white rounded-xl hover:bg-gray-700 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-gray-600/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-trading-accent to-cyan-400 text-gray-900 rounded-xl font-medium transform transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-trading-accent/20 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2 border border-transparent"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                account ? 'Update Account' : 'Add Account'
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}