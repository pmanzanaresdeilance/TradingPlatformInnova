import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Mail, Key, Eye, EyeOff, Loader2, LineChart, TrendingUp } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop with trading-themed blur effect */}
      <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md mx-4 overflow-hidden bg-gray-800 rounded-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-trading-accent/10 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative p-8">
          {/* Header with animated icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 mb-4 bg-gradient-to-br from-trading-accent to-trading-success rounded-2xl flex items-center justify-center transform transition-transform hover:scale-105">
              {isLogin ? (
                <LineChart className="w-8 h-8 text-gray-900" />
              ) : (
                <TrendingUp className="w-8 h-8 text-gray-900" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-trading-accent to-trading-success bg-clip-text text-transparent">
              {isLogin ? 'Welcome Back Trader' : 'Join Our Trading Community'}
            </h2>
            <p className="mt-2 text-gray-400 text-center">
              {isLogin 
                ? 'Access your trading dashboard and analytics'
                : 'Start your journey to becoming a successful trader'
              }
            </p>
          </div>

          {error && (
            <div className="p-4 mb-6 border rounded-xl bg-trading-danger/10 border-trading-danger/20">
              <p className="text-sm text-trading-danger">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-trading-accent focus:outline-none transition-all"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-700/50 rounded-xl pl-10 pr-12 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-trading-accent focus:outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-gray-900 bg-gradient-to-r from-trading-accent to-trading-success hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>{isLogin ? 'Sign In' : 'Create Account'}</>
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-gray-400 bg-gray-800">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="w-full py-3 rounded-xl font-semibold text-gray-300 bg-gray-700/50 hover:bg-gray-700 transition-all"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}