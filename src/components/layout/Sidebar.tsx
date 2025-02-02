import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LineChart,
  Sunrise,
  Video,
  MessageCircle,
  Calendar,
  Users,
  Trophy,
  BarChart4,
  Activity,
  BookOpen,
  Lock,
  BookMarked,
  Wallet,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Charts & Analysis', icon: LineChart, path: '/charts', requiresAuth: true },
  { name: 'Trading Journal', icon: BookMarked, path: '/journal', requiresAuth: true },
  { name: 'Trading Accounts', icon: Wallet, path: '/accounts', requiresAuth: true },
  { name: 'Premarket', icon: Sunrise, path: '/premarket', requiresAuth: true },
  { name: 'Backtesting Videos', icon: Video, path: '/backtesting', requiresAuth: true },
  { name: 'Support 24/7', icon: MessageCircle, path: '/support', requiresAuth: true },
  { name: 'Economic Calendar', icon: Calendar, path: '/calendar', requiresAuth: false },
  { name: 'Community', icon: Users, path: '/community', requiresAuth: true },
  { name: 'Rankings', icon: Trophy, path: '/rankings', requiresAuth: false },
  { name: 'Live Classes', icon: Video, path: '/live-classes', requiresAuth: true },
  { name: 'Statistics', icon: BarChart4, path: '/statistics', requiresAuth: true },
  { name: 'Market Updates', icon: Activity, path: '/market-updates', requiresAuth: false },
  { name: 'Learning Center', icon: BookOpen, path: '/learning', requiresAuth: true }
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:sticky top-0 left-0 h-[calc(100vh-4rem)] w-64 bg-gray-900/50 backdrop-blur-lg p-4 
        border-r border-gray-800 transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-800 transition-colors md:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        <nav className="space-y-1 mt-8 md:mt-0">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
              onClick={(e) => {
                if (item.requiresAuth && !user) {
                  e.preventDefault();
                } else {
                  onClose();
                }
              }}
            >
              <item.icon className={`w-5 h-5 mr-3 ${
                item.requiresAuth && !user ? 'opacity-50' : ''
              }`} />
              <span className={item.requiresAuth && !user ? 'opacity-50' : ''}>
                {item.name}
              </span>
              {item.requiresAuth && !user && (
                <Lock className="w-4 h-4 ml-auto text-gray-500" />
              )}
            </NavLink>
          ))}
        </nav>

        {!user && (
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
            <h3 className="text-sm font-medium text-white mb-2">
              Join TradePro
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Get access to all premium features and start your trading journey.
            </p>
            <button
              onClick={() => {}} // Add auth modal trigger
              className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all"
            >
              Sign Up Now
            </button>
          </div>
        )}
      </div>
    </>
  );
}