import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTradingAccounts } from '@/hooks/useTradingAccounts';
import {
  Plus,
  Building2,
  Wallet,
  DollarSign,
  Percent,
  ChevronRight,
  Trash2,
  Edit2,
} from 'lucide-react';
import { AccountModal } from '@/components/journal/AccountModal';
import { AccountStats } from '@/components/journal/AccountStats';
import { DeleteAccountModal } from '@/components/journal/DeleteAccountModal';
import type { TradingAccount } from '@/hooks/useTradingAccounts';

export default function Accounts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    accounts,
    statistics,
    loading,
    error,
    addAccount,
    updateAccount,
    deleteAccount,
  } = useTradingAccounts();

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TradingAccount | undefined>(undefined);
  const [deletingAccount, setDeletingAccount] = useState<TradingAccount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (!deletingAccount) return;
    setDeleteLoading(true);
    try {
      await deleteAccount(deletingAccount.id);
      setDeletingAccount(null);
    } catch (err) {
      console.error('Failed to delete account:', err);
      alert(
        err instanceof Error
          ? err.message
          : 'Failed to delete account. Please try again.'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trading-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Trading Accounts</h1>
          <p className="text-gray-400 mt-2">
            Connect and manage your trading accounts to track performance
          </p>
        </div>
        <button
          onClick={() => {
            setEditingAccount(undefined);
            setShowAccountModal(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-trading-accent to-cyan-400 text-gray-900 rounded-xl font-medium hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="group bg-gray-800 rounded-xl overflow-hidden hover:shadow-xl hover:shadow-trading-accent/10 transition-all transform hover:-translate-y-1 relative"
          >
            {/* Account Header */}
            <div className="p-6 bg-gradient-to-br from-gray-800 via-gray-800 to-gray-700/50 border-b border-gray-700 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-trading-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-trading-accent/20 to-trading-accent/5 flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Building2 className="w-5 h-5 text-trading-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{account.name}</h3>
                    <p className="text-sm text-gray-400">{account.broker}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 relative z-10">
                  <button
                    onClick={() => {
                      if (user?.id === account.user_id) {
                        setEditingAccount(account);
                        setShowAccountModal(true);
                      } else {
                        alert('You can only edit your own accounts');
                      }
                    }}
                    className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors group tooltip-trigger cursor-pointer"
                    data-tooltip="Edit Account"
                    title="Edit Account"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                  </button>
                  <button
                    onClick={() => {
                      if (user?.id === account.user_id) {
                        setDeletingAccount(account);
                      } else {
                        alert('You can only delete your own accounts');
                      }
                    }}
                    className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors group tooltip-trigger cursor-pointer"
                    data-tooltip="Delete Account"
                    title="Delete Account"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-trading-danger transition-colors" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Account Number</span>
                  <span>{account.account_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Leverage</span>
                  <span>1:{account.leverage}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Currency</span>
                  <span>{account.currency}</span>
                </div>
              </div>
            </div>

            {/* Account Stats */}
            {statistics[account.id] && (
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Balance</span>
                    <span className="font-medium">
                      {account.currency}{' '}
                      {account.current_balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full">
                    <div
                      className="h-full bg-trading-accent rounded-full"
                      style={{
                        width: `${Math.min(
                          (account.current_balance / account.initial_balance) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-400">Win Rate</span>
                    <p className="text-xl font-bold text-trading-success">
                      {statistics[account.id].win_rate}%
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Profit Factor</span>
                    <p className="text-xl font-bold text-trading-accent">
                      {statistics[account.id].profit_factor}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    navigate(`/journal?account=${account.id}`);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-trading-accent to-cyan-400 text-gray-900 rounded-xl font-medium mt-6 transform transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-trading-accent/20 active:translate-y-[1px]"
                >
                  View Trades
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
        {accounts.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-700 group hover:border-trading-accent/50 transition-colors">
            <Building2 className="w-12 h-12 text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              No Trading Accounts
            </h3>
            <p className="text-gray-400 text-center mb-6">
              Add your first trading account to start tracking your performance
            </p>
            <button
              onClick={() => {
                setEditingAccount(undefined);
                setShowAccountModal(true);
              }}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-trading-accent to-cyan-400 text-gray-900 rounded-xl font-medium transform transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-trading-accent/20 active:translate-y-[1px]"
            >
              <Plus className="w-4 h-4" />
              Add First Account
            </button>
          </div>
        )}
      </div>

      {/* Account Modal */}
      {showAccountModal && (
        <AccountModal
          isOpen={showAccountModal}
          onClose={() => setShowAccountModal(false)}
          onSubmit={async (data) => {
            if (editingAccount) {
              await updateAccount(editingAccount.id, data);
            } else {
              await addAccount(data);
            }
            setShowAccountModal(false);
            setEditingAccount(undefined);
          }}
          account={editingAccount}
        />
      )}
      
      {/* Delete Account Modal */}
      {deletingAccount && (
        <DeleteAccountModal
          isOpen={true}
          onClose={() => setDeletingAccount(null)}
          onConfirm={handleDeleteAccount}
          accountName={deletingAccount.name}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}