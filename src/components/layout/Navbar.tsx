import React, { useState, useRef } from 'react';
import * as Icons from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import AuthModal from '../auth/AuthModal';
import { NotificationBell } from '../notifications/NotificationBell';
import { NotificationDropdown } from '../notifications/NotificationDropdown';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const logoUrl = 'https://ptiubpxcjrhhklaumpks.supabase.co/storage/v1/object/public/logo//logo.png';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (file: File) => {
    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Logo must be less than 5MB');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      const { error: uploadError } = await supabase.storage
        .from('logo')
        .upload('logo.png', file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;
    } catch (err) {
      console.error('Error uploading logo:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <nav className="bg-gray-900/50 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={onMenuClick}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors md:hidden"
              >
                <Icons.Menu className="w-5 h-5" />
              </button>
              <Link to="/" className="flex items-center gap-2 relative group">
                <div className="h-12 w-[300px] relative">
                  <img
                    src={logoUrl}
                    alt="Innova Trading Zone"
                    className="h-full w-full object-contain transform transition-all hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = '';
                      e.currentTarget.parentElement?.classList.add('hidden');
                    }}
                  />
                </div>
                {user?.user_metadata?.role === 'admin' && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/50 rounded-lg flex items-center justify-center transition-opacity"
                    >
                      <Icons.Image className="w-4 h-4 text-white" />
                    </button>
                  </>
                )}
              </Link>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
              {user ? (
                <>
                  <div className="relative hidden md:block">
                    <NotificationBell onClick={() => setShowNotifications(!showNotifications)} />
                    {showNotifications && (
                    <NotificationDropdown
                      isOpen={showNotifications}
                      onClose={() => setShowNotifications(false)}
                    />
                    )}
                  </div>
                  <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors relative group hidden md:block">
                    <Icons.MessageSquare className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-trading-accent rounded-full"></span>
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors group cursor-pointer relative"
                    >
                      {user.user_metadata?.avatar_url ? (
                        <img
                          src={user.user_metadata.avatar_url}
                          alt={user.user_metadata?.username || user.email?.split('@')[0] || ''}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-700"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.user_metadata?.username || user.email?.split('@')[0] || 'U'
                            )}&background=7C3AED&color=fff`;
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                          <Icons.UserCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                      )}
                      <span className="text-gray-300 group-hover:text-white transition-colors hidden md:block">
                        {user.user_metadata?.username || user.email?.split('@')[0] || 'User'}
                      </span>
                      <Icons.ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors hidden md:block" />
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-xl shadow-xl py-1 border border-gray-700 backdrop-blur-lg">
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                          <Icons.Cog className="w-4 h-4" />
                          Profile Settings
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                          <Icons.LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-all"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Auth Modal - Moved outside nav to prevent z-index issues */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
}