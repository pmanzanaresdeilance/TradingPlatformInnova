import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export function StatCard({ title, value, change, isPositive }: StatCardProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-gray-400 text-sm">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold">{value}</p>
        <span className={`ml-2 flex items-center text-sm ${
          isPositive ? 'text-green-500' : 'text-red-500'
        }`}>
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4 mr-1" />
          ) : (
            <ArrowDownRight className="w-4 h-4 mr-1" />
          )}
          {change}
        </span>
      </div>
    </div>
  );
}