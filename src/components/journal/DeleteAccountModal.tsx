import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  accountName: string;
  loading?: boolean;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  accountName,
  loading = false
}: DeleteAccountModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-trading-danger/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-trading-danger" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Delete Account</h2>
            <p className="text-gray-400">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-gray-300 mb-6">
          Are you sure you want to delete <span className="text-white font-medium">{accountName}</span> and all its associated trades? This action is permanent and cannot be reversed.
        </p>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-6 py-2 bg-trading-danger text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Account'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}