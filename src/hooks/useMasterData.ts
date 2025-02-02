import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface MarketSymbol {
  id: string;
  symbol: string;
  type: 'forex' | 'stocks' | 'indices' | 'commodities';
  description: string;
  is_active: boolean;
}

interface Broker {
  id: string;
  name: string;
  website: string;
  description: string;
  is_active: boolean;
}

export function useMasterData() {
  const [symbols, setSymbols] = useState<MarketSymbol[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch market symbols
        const { data: symbolsData, error: symbolsError } = await supabase
          .from('market_symbols')
          .select('*')
          .eq('is_active', true)
          .order('symbol');

        if (symbolsError) throw symbolsError;

        // Fetch brokers
        const { data: brokersData, error: brokersError } = await supabase
          .from('brokers')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (brokersError) throw brokersError;

        setSymbols(symbolsData || []);
        setBrokers(brokersData || []);
      } catch (err) {
        console.error('Error loading master data:', err);
        setError('Failed to load master data');
      } finally {
        setLoading(false);
      }
    };

    loadMasterData();

    // Set up real-time subscriptions
    const symbolsSubscription = supabase
      .channel('market_symbols_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'market_symbols'
        },
        () => {
          loadMasterData();
        }
      )
      .subscribe();

    const brokersSubscription = supabase
      .channel('brokers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'brokers'
        },
        () => {
          loadMasterData();
        }
      )
      .subscribe();

    return () => {
      symbolsSubscription.unsubscribe();
      brokersSubscription.unsubscribe();
    };
  }, []);

  return {
    symbols,
    brokers,
    loading,
    error
  };
}