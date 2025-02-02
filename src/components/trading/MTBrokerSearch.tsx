import React, { useState, useCallback, useRef } from 'react';
import { Search, X, Loader2, AlertTriangle, Server } from 'lucide-react';
import { debounce } from '@/utils/debounce';
import { logger } from '@/utils/logger';
import { MetaApiClient } from '@/services/metaapi';
import { ServerDiscovery } from '@/services/metaapi/brokers/serverDiscovery';
import type { BrokerInfo, BrokerGroup } from '@/services/metaapi/brokers/types';

interface MTBrokerSearchProps {
  platform: 'mt4' | 'mt5';
  onSelect: (broker: BrokerInfo, server: string) => void;
  selectedBroker?: string;
  selectedServer?: string;
  region?: string;
}

export function MTBrokerSearch({
  platform,
  onSelect,
  selectedBroker,
  selectedServer,
  region
}: MTBrokerSearchProps) {
  const [query, setQuery] = useState(selectedBroker || '');
  const [results, setResults] = useState<BrokerInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [brokerGroups, setBrokerGroups] = useState<BrokerGroup[]>([]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchBrokers = useCallback(
    debounce(async (searchQuery: string) => {
      // Safely handle undefined or null search query
      const safeQuery = searchQuery?.trim() ?? '';
      
      if (safeQuery.length < 2) {
        logger.debug('Search query too short', { query: searchQuery });
        setResults([]);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const groups = await ServerDiscovery.getBrokerServers(
          safeQuery.toLowerCase(),
          platform,
          region
        );

        setBrokerGroups(groups);
        
        setShowDropdown(true);
        logger.info('Broker search completed', {
          query: safeQuery,
          groupsCount: groups.length
        });
      } catch (err) {
        logger.error('Broker search failed', { 
          error: err instanceof Error ? err.message : 'Unknown error',
          query: safeQuery 
        });
        setError('Unable to fetch broker information. Please try again.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [platform, region]
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Ensure value is never undefined
    const value = e.target.value ?? '';
    setQuery(value);
    searchBrokers(value);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    onSelect({ name: '', servers: [] }, '');
    setError(null);
    setShowDropdown(false);
  };

  const handleSelectServer = (broker: BrokerInfo, server: string) => {
    if (!broker?.name || !server) {
      logger.warn('Invalid broker or server selection', { broker, server });
      return;
    }
    // Use the exact server name for display
    setQuery(server);
    onSelect(broker, server);
    setShowDropdown(false);
  };

  return (
    <div ref={searchRef} className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          className="w-full bg-gray-700 rounded-lg pl-10 pr-10 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
          placeholder="Search for your broker..."
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
        ) : query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-600 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-2 bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden">
          {error ? (
            <div className="p-4 flex items-center gap-2 text-trading-danger">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          ) : brokerGroups.length === 0 ? (
            <div className="p-4 text-gray-400 text-center">
              {query.length < 2 ? 'Type at least 2 characters' : 'No brokers found'}
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {brokerGroups.map((group) => (
                <div key={group.name} className="border-b border-gray-700 last:border-0">
                  <div className="p-4">
                    <h3 className="font-medium mb-2">{group.name}</h3>
                    <div className="space-y-2">
                      {group.servers.map((server) => (
                          <button
                            key={server.address}
                            onClick={() => handleSelectServer(group, server.address)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-700 transition-colors ${
                              selectedBroker === group.name && selectedServer === server.address
                                ? 'bg-trading-accent/10 border border-trading-accent'
                                : 'border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Server className="w-4 h-4 text-gray-400" />
                              <span>{server.name}</span>
                            </div>
                            {server.region && (
                              <span className="text-sm text-gray-400">
                                {server.region}
                              </span>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}