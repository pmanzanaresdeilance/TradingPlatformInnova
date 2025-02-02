import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Link2, Copy, Check, Loader2, X } from 'lucide-react';

interface ShareJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareJournalModal({ isOpen, onClose }: ShareJournalModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  if (!isOpen) return null;

  const generateShareLink = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: generateError } = await supabase
        .rpc('generate_share_link', {
          user_id: user?.id
        });

      if (generateError) throw generateError;

      const shareUrl = `${window.location.origin}/journal/shared/${data}`;
      setShareLink(shareUrl);
    } catch (err) {
      console.error('Error generating share link:', err);
      setError('Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareLink) return;
    
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy link');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-trading-accent/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-trading-accent" />
            </div>
            <h2 className="text-xl font-bold">Share Trading Journal</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-trading-danger/10 border border-trading-danger/20 rounded-lg">
            <p className="text-sm text-trading-danger">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <p className="text-gray-400">
            Generate a link to share your trading journal with others. They will be able to view your trades and statistics.
          </p>

          {shareLink ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-trading-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              <button
                onClick={generateShareLink}
                disabled={loading}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Generate New Link
              </button>
            </div>
          ) : (
            <button
              onClick={generateShareLink}
              disabled={loading}
              className="w-full px-4 py-2 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Link...
                </>
              ) : (
                <>
                  <Link2 className="w-5 h-5" />
                  Generate Share Link
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}