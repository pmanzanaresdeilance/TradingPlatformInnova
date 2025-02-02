import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2, Upload, Image as ImageIcon, X, Building2, ChevronDown, TrendingUp, AlertTriangle, Search } from 'lucide-react';
import { useTradingAccounts } from '@/hooks/useTradingAccounts';
import { useMasterData } from '@/hooks/useMasterData';
import type { TradingAccount } from '@/hooks/useTradingAccounts';

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedAccount: TradingAccount | null;
}

function generateTicketNumber(): number {
  // Generate a unique 9-digit number for manual trades
  // Using timestamp + random number to ensure uniqueness
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return parseInt(timestamp + random);
}

export function AddTradeModal({ isOpen, onClose, onSuccess, selectedAccount }: AddTradeModalProps) {
  const { user } = useAuth();
  const { accounts } = useTradingAccounts();
  const { symbols } = useMasterData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [symbolSearch, setSymbolSearch] = useState('');
  const [symbolType, setSymbolType] = useState<'forex' | 'stocks' | 'indices' | 'commodities'>('forex');
  const [formData, setFormData] = useState({
    symbol: '',
    order_type: 'buy',
    lot_size: '',
    entry_price: '',
    exit_price: '',
    stop_loss: '',
    take_profit: '',
    profit_loss: '',
    open_time: '',
    close_time: '',
    status: 'closed',
    notes: ''
  });

  const filteredSymbols = symbols?.length ? symbols
    .filter(s => s.type === symbolType)
    .filter(s => s.symbol.toLowerCase().includes(symbolSearch.toLowerCase()))
    : [];

  // Update selected account when prop changes
  useEffect(() => {
    setSelectedAccountId(selectedAccount?.id || '');
    setLoading(false);
  }, [selectedAccount]);

  if (!isOpen) return null;

  const handleScreenshotChange = (file: File) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Screenshot must be less than 5MB');
        setScreenshot(null);
        setScreenshotPreview(null);
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('File must be an image');
        setScreenshot(null);
        setScreenshotPreview(null);
        return;
      }

      setError(null);
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAccountId) {
      setError('Please select a trading account first');
      return;
    }

    setLoading(true);

    try {
      // Validate required fields
      if (!formData.symbol || !formData.lot_size || !formData.entry_price || !formData.open_time) {
        throw new Error('Please fill in all required fields');
      }

      let screenshotUrl = null;
      if (screenshot) {
        const fileName = `${user?.id}/${Date.now()}-${screenshot.name}`;
        
        // Create storage bucket if it doesn't exist
        const { data: bucketData, error: bucketError } = await supabase.storage
          .createBucket('trade-screenshots', { public: true });

        if (bucketError && bucketError.message !== 'Bucket already exists') {
          throw bucketError;
        }

        // Upload screenshot
        const { error: uploadError } = await supabase.storage
          .from('trade-screenshots')
          .upload(fileName, screenshot, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('trade-screenshots')
          .getPublicUrl(fileName);

        screenshotUrl = publicUrl;
        console.log('Screenshot uploaded:', screenshotUrl);
      }

      // Format price based on symbol
      const formatPrice = (price: string) => {
        if (!price) return null;
        const numPrice = parseFloat(price);
        
        // Handle different instrument types
        if (formData.symbol.includes('JPY')) {
          return parseFloat(numPrice.toFixed(3));
        } else if (formData.symbol.startsWith('XAUUSD')) {
          return parseFloat(numPrice.toFixed(2));
        } else if (formData.symbol.includes('US30') || formData.symbol.includes('GER40')) {
          return parseFloat(numPrice.toFixed(1));
        }
        return parseFloat(numPrice.toFixed(5));
      };

      const tradeData = {
        user_id: user?.id,
        account_id: selectedAccountId,
        ticket_number: generateTicketNumber(), // Generate unique ticket number
        symbol: formData.symbol.toUpperCase(),
        order_type: formData.order_type,
        lot_size: parseFloat(formData.lot_size),
        entry_price: formatPrice(formData.entry_price),
        exit_price: formatPrice(formData.exit_price),
        stop_loss: formatPrice(formData.stop_loss),
        take_profit: formatPrice(formData.take_profit),
        profit_loss: formData.profit_loss ? parseFloat(formData.profit_loss) : null,
        open_time: new Date(formData.open_time).toISOString(),
        close_time: formData.close_time ? new Date(formData.close_time).toISOString() : null,
        status: formData.status
      };

      const { data: trade, error: tradeError } = await supabase
        .from('trades')
        .insert([tradeData])
        .select()
        .single();

      if (tradeError) {
        console.error('Error adding trade:', tradeError);
        throw new Error('Failed to add trade. Please try again.');
      }

      // Add note with screenshot if provided
      if (formData.notes || screenshotUrl) {
        const { error: noteError } = await supabase
          .from('trade_notes')
          .insert([{
            trade_id: trade.id,
            user_id: user?.id,
            note_type: 'post_trade',
            content: formData.notes,
            screenshot_url: screenshotUrl
          }]);

        if (noteError) {
          console.error('Error adding trade note:', noteError);
          throw new Error('Failed to add trade note. Please try again.');
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding trade:', err);
      setError(err instanceof Error ? err.message : 'Failed to add trade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-800 rounded-xl overflow-hidden max-w-7xl w-full mx-4 max-h-[90vh] border border-gray-700/50 shadow-2xl">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-gray-800 via-gray-800 to-gray-700/50 border-b border-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-trading-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-trading-accent/20 to-trading-accent/5 flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <TrendingUp className="w-5 h-5 text-trading-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Add New Trade
                </h2>
                <p className="text-sm text-gray-400">Record your trading activity</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-80px)] overflow-y-auto">
        {selectedAccount && (
          <p className="text-gray-400 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Adding trade to <span className="text-trading-accent">{selectedAccount.name}</span> ({selectedAccount.account_number})
          </p>
        )}

        {error && (
          <div className="p-4 bg-trading-danger/10 border border-trading-danger/20 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-trading-danger/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-trading-danger" />
            </div>
            <p className="text-sm text-trading-danger flex-1">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Trading Account *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-gray-700/50 rounded-xl pl-10 pr-10 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 appearance-none border border-gray-600/50 hover:border-trading-accent/50"
                required
              >
                <option value="">Select Trading Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} • {account.broker} • {account.account_number}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-gray-400" />
                Trading Chart Screenshot
              </div>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleScreenshotChange(e.target.files[0])}
            />
            
            {screenshotPreview ? (
              <div className="relative group">
                <img
                  src={screenshotPreview}
                  alt="Trade screenshot"
                  className="w-full h-48 object-cover rounded-xl border border-gray-600/50 group-hover:border-trading-accent/50 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    setScreenshot(null);
                    setScreenshotPreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-gray-900/90 rounded-lg hover:bg-gray-900 transition-all duration-300 opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-gray-700/50 rounded-xl flex flex-col items-center justify-center hover:border-trading-accent/50 transition-all duration-300 bg-gray-700/10 hover:bg-gray-700/20"
              >
                <div className="w-16 h-16 rounded-xl bg-gray-700/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-300 font-medium">Click to upload screenshot</p>
                <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 5MB</p>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Market Type *
                </label>
                <select
                  value={symbolType}
                  onChange={(e) => {
                    setSymbolType(e.target.value as any);
                    setFormData({ ...formData, symbol: '' });
                    setSymbolSearch('');
                  }}
                  className="w-full bg-gray-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 border border-gray-600/50 hover:border-trading-accent/50"
                  required
                >
                  <option value="forex">Forex</option>
                  <option value="stocks">Stocks</option>
                  <option value="indices">Indices</option>
                  <option value="commodities">Commodities</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Symbol *
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={symbolSearch}
                    onChange={(e) => setSymbolSearch(e.target.value)}
                    className="w-full bg-gray-700/50 rounded-t-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 border border-gray-600/50 hover:border-trading-accent/50"
                    placeholder={`Search ${symbolType} symbols...`}
                  />
                  {symbolSearch && (
                    <div className="absolute z-10 w-full bg-gray-800 border border-gray-700 rounded-b-xl max-h-48 overflow-y-auto shadow-xl">
                      {filteredSymbols.map((symbol) => (
                        <button
                          key={symbol.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, symbol: symbol.symbol });
                            setSymbolSearch('');
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-700 text-white text-sm transition-colors flex items-center justify-between group"
                        >
                          <span className="font-medium">{symbol.symbol}</span>
                          <span className="text-gray-400 group-hover:text-gray-300">{symbol.description}</span>
                        </button>
                      ))}
                      {filteredSymbols.length === 0 && (
                        <div className="px-4 py-2 text-gray-400 text-sm">
                          No symbols found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formData.symbol && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="px-3 py-1 bg-trading-accent/10 text-trading-accent rounded-lg text-sm">
                      {formData.symbol}
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, symbol: '' })}
                      className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Order Type *
                </label>
                <select
                  value={formData.order_type}
                  onChange={(e) => setFormData({ ...formData, order_type: e.target.value })}
                  className="w-full bg-gray-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 border border-gray-600/50 hover:border-trading-accent/50"
                  required
                >
                  <option value="buy" className="bg-gray-800">Buy</option>
                  <option value="sell" className="bg-gray-800">Sell</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Lot Size *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.lot_size}
                  onChange={(e) => setFormData({ ...formData, lot_size: e.target.value })}
                  className="w-full bg-gray-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 border border-gray-600/50 hover:border-trading-accent/50"
                  placeholder="0.01"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Entry Price *
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={formData.entry_price}
                  onChange={(e) => setFormData({ ...formData, entry_price: e.target.value })}
                  className="w-full bg-gray-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 border border-gray-600/50 hover:border-trading-accent/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Exit Price
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={formData.exit_price}
                  onChange={(e) => setFormData({ ...formData, exit_price: e.target.value })}
                  className="w-full bg-gray-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 border border-gray-600/50 hover:border-trading-accent/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Stop Loss
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={formData.stop_loss}
                  onChange={(e) => setFormData({ ...formData, stop_loss: e.target.value })}
                  className="w-full bg-gray-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 border border-gray-600/50 hover:border-trading-accent/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Take Profit
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={formData.take_profit}
                  onChange={(e) => setFormData({ ...formData, take_profit: e.target.value })}
                  className="w-full bg-gray-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 border border-gray-600/50 hover:border-trading-accent/50"
                />
              </div>
            </div>

            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Profit/Loss
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.profit_loss}
                  onChange={(e) => setFormData({ ...formData, profit_loss: e.target.value })}
                  className="w-full bg-gray-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 border border-gray-600/50 hover:border-trading-accent/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Open Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.open_time}
                  onChange={(e) => setFormData({ ...formData, open_time: e.target.value })}
                  className="w-full bg-gray-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 border border-gray-600/50 hover:border-trading-accent/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Close Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.close_time}
                  onChange={(e) => setFormData({ ...formData, close_time: e.target.value })}
                  className="w-full bg-gray-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 border border-gray-600/50 hover:border-trading-accent/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-gray-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 border border-gray-600/50 hover:border-trading-accent/50"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-gray-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none hover:bg-gray-700 transition-all duration-300 border border-gray-600/50 hover:border-trading-accent/50"
              rows={4}
              placeholder="Add any notes about this trade..."
            />
          </div>

          <div className="flex justify-end gap-4">
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
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Trade...
                </>
              ) : (
                'Create Trade'
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
