import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccounts } from '@/hooks/useAccounts';
import { Settings, Plus } from 'lucide-react';
import { MTConnectionWizard } from '@/components/trading/MTConnectionWizard';
import { MTAccountCard } from '@/components/trading/MTAccountCard';
import { MTRiskSettingsModal } from '@/components/trading/MTRiskSettingsModal';
import { TradeAnalytics } from '@/components/journal/TradeAnalytics';
import { TradeDistribution } from '@/components/journal/TradeDistribution';
import { TradeCharts } from '@/components/journal/TradeCharts';

export default function Journal() {
  const { user } = useAuth();
  const { accounts, loading, error, createAccount } = useAccounts();
  
  // Estados para modales
  const [showConnectionWizard, setShowConnectionWizard] = useState(false);
  const [showRiskSettings, setShowRiskSettings] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  // Estado para configuración de riesgo
  const [riskSettings, setRiskSettings] = useState({
    maxDrawdown: 0.1,
    maxExposurePerPair: 0.05,
    minEquity: 100,
    marginCallLevel: 0.5
  });

  // Manejadores
  const handleSaveRiskSettings = async (settings: any) => {
    try {
      setRiskSettings(settings);
      setShowRiskSettings(false);
    } catch (err) {
      console.error('Error guardando configuración de riesgo:', err);
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
        <h1 className="text-3xl font-bold text-white">Trading Journal</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRiskSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Risk Settings
          </button>
          <button
            onClick={() => setShowConnectionWizard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Connect Account
          </button>
        </div>
      </div>

      {/* Lista de Cuentas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(account => (
          <MTAccountCard
            key={account.id}
            key={account.id}
            account={account} 
            statistics={account.statistics || {
              balance: 0, equity: 0, margin: 0,
              freeMargin: 0, marginLevel: 0, profitToday: 0
            }}
            onEdit={() => {}}
            onDelete={() => {}}
            onViewTrades={() => setSelectedAccount(account.id)} 
          />
        ))}
      </div>

      {/* Análisis de Trading */}
      {selectedAccount && (
        <>
          <TradeAnalytics trades={[]} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TradeDistribution trades={[]} />
            <TradeCharts trades={[]} />
          </div>
        </>
      )}

      {/* Modales */}
      <MTConnectionWizard
        isOpen={showConnectionWizard}
        onClose={() => setShowConnectionWizard(false)}
        onSuccess={() => window.location.reload()}
      />

      <MTRiskSettingsModal
        isOpen={showRiskSettings}
        onClose={() => setShowRiskSettings(false)}
        currentSettings={riskSettings}
        onSave={handleSaveRiskSettings}
      />
    </div>
  );
}