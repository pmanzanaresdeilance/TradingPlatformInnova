import React, { useState } from 'react';
import { Link2, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';
import { MetaApiClient } from '@/services/metaapi';
import { ServerDiscovery } from '@/services/metaapi/brokers/serverDiscovery';
import { MTServerSelector } from './MTServerSelector';
import { MTBrokerSearch } from './MTBrokerSearch';
import { useAuth } from '@/contexts/AuthContext';

interface MTConnectionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MTConnectionWizard({ isOpen, onClose, onSuccess }: MTConnectionWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [formData, setFormData] = useState<{
    brokerName: string;
    accountNumber: string;
    server: string;
    platform: 'mt4' | 'mt5';
    password: string;
  }>({
    brokerName: '',
    accountNumber: '',
    server: '',
    platform: 'mt5',
    password: ''
  });

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    try {
      setIsValidating(true);
      setError(null);

      const isValid = await ServerDiscovery.validateServer(
        formData.server,
        formData.platform
      );

      if (!isValid) {
        throw new Error('Server validation failed. Please check your server details.');
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate server');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.accountNumber || !formData.password || !formData.server) {
        throw new Error('Please fill in all required fields');
      }

      const serverName = formData.server;
      // Crear cuenta en MetaAPI

      const client = MetaApiClient.getInstance(import.meta.env.VITE_META_API_TOKEN);
      const metaAccount = await client.createAccount({
        name: `${formData.brokerName} - ${formData.accountNumber}`,
        login: formData.accountNumber,
        password: formData.password,
        server: serverName,
        platform: formData.platform,
        magic: Math.floor(Math.random() * 900000) + 100000,
        region: formData.region
      });

      // Guardar el ID de MetaAPI en nuestra base de datos
      const { error: dbError } = await supabase
        .from('meta_api_accounts')
        .insert({
          user_id: user?.id,
          meta_api_account_id: metaAccount.id,
          name: `${formData.brokerName} - ${formData.accountNumber}`,
          login: formData.accountNumber,
          server: serverName,
          platform: formData.platform,
          state: metaAccount.state,
          connection_status: metaAccount.connectionStatus
        });

      if (dbError) throw dbError;

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-trading-accent/10 flex items-center justify-center">
            <Link2 className="w-6 h-6 text-trading-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Connect MetaTrader Account</h2>
            <p className="text-gray-400">Follow the steps to connect your trading account</p>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-700" />
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                  s === step
                    ? 'bg-trading-accent text-gray-900'
                    : s < step
                    ? 'bg-trading-success text-gray-900'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-gray-400">Account Details</span>
            <span className="text-gray-400">Server Settings</span>
            <span className="text-gray-400">Verification</span>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Select Broker
              </label>
              <MTBrokerSearch
                platform={formData.platform}
                selectedBroker={formData.brokerName}
                selectedServer={formData.server}
                onSelect={(broker, server) => setFormData({
                  ...formData,
                  brokerName: broker.name,
                  server: server
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                placeholder="Enter your MT account number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Platform
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value as 'mt4' | 'mt5' })}
                className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
              >
                <option value="mt5">MetaTrader 5</option>
                <option value="mt4">MetaTrader 4</option>
              </select>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-lg">
              <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-500 font-medium mb-1">Where to find your account number?</p>
                <p className="text-gray-400">
                  Open your MetaTrader platform and look for "Account Information" in the Navigator window.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-400">
                  Selected Server
                </label>
                <span className="text-sm text-trading-accent">{formData.server}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                placeholder="Enter your trading account password"
              />
            </div>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={!formData.server || !formData.password || isValidating}
              className="w-full px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Test Connection'
              )}
            </button>

            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-yellow-500 font-medium mb-1">Important Security Notice</p>
                <p className="text-gray-400">
                  We recommend using an Investor Password instead of your Master Password for read-only access.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="font-medium mb-4">Connection Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Account Number:</span>
                  <span>{formData.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Broker:</span>
                  <span>{formData.brokerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Server:</span>
                  <span>{formData.server}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Platform:</span>
                  <span>{formData.platform.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-trading-danger/10 border border-trading-danger/20 rounded-lg">
                <p className="text-sm text-trading-danger">{error}</p>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 bg-trading-success/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-trading-success shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-trading-success font-medium mb-1">Ready to Connect</p>
                <p className="text-gray-400">
                  Please verify the details above before proceeding with the connection.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Account'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}