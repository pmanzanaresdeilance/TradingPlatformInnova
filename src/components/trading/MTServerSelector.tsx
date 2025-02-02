import React from 'react';
import { useBrokerServers } from '@/hooks/useBrokerServers';
import { Loader2, AlertTriangle } from 'lucide-react';

interface MTServerSelectorProps {
  brokerName: string;
  platform: 'mt4' | 'mt5';
  value: string;
  onChange: (server: string) => void;
  className?: string;
}

export function MTServerSelector({
  brokerName,
  platform,
  value,
  onChange,
  className = ''
}: MTServerSelectorProps) {
  const { servers, loading, error } = useBrokerServers(brokerName, platform);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading servers...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-trading-danger">
        <AlertTriangle className="w-4 h-4" />
        {error}
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none ${className}`}
    >
      <option value="">Select Server</option>
      {servers.map((server) => (
        <option key={server.address} value={server.address}>
          {server.name} {server.description ? `(${server.description})` : ''}
        </option>
      ))}
    </select>
  );
}