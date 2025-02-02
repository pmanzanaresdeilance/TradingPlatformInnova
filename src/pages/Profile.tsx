import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { User, Settings, Upload, Crown, Star, Shield, Loader2 } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    username: user?.user_metadata?.username || '',
    fullName: user?.user_metadata?.full_name || '',
    bio: user?.user_metadata?.bio || '',
    phone: user?.user_metadata?.phone || '',
    timezone: user?.user_metadata?.timezone || '',
    language: user?.user_metadata?.language || '',
    country: user?.user_metadata?.country || '',
    tradingExperience: user?.user_metadata?.trading_experience || '',
    tradingStyle: user?.user_metadata?.trading_style || '',
    riskTolerance: user?.user_metadata?.risk_tolerance || '',
    preferredMarkets: user?.user_metadata?.preferred_markets || [],
    emailNotifications: user?.user_metadata?.email_notifications || {
      marketUpdates: true,
      tradeAlerts: true,
      communityMessages: true,
      educationalContent: true
    },
    socialLinks: user?.user_metadata?.social_links || {
      twitter: '',
      linkedin: '',
      tradingview: '',
      myfxbook: ''
    },
    privacySettings: user?.user_metadata?.privacy_settings || {
      showProfile: true,
      showTrades: true,
      showStats: true,
      allowMessages: true
    },
    tradingGoals: user?.user_metadata?.trading_goals || {
      monthlyTarget: '',
      riskPerTrade: '',
      maxDrawdown: '',
      tradingHours: []
    }
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.user_metadata?.avatar_url || null
  );

  const handleAvatarChange = (file: File) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Avatar must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('File must be an image');
        return;
      }

      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Create storage bucket if it doesn't exist (will be ignored if it exists)
      const { data: bucketData, error: bucketError } = await supabase.storage
        .createBucket('avatars', { public: true });

      if (bucketError && bucketError.message !== 'Bucket already exists') {
        throw bucketError;
      }

      let avatarUrl = user.user_metadata?.avatar_url || null;

      if (avatar) {
        const fileName = `${user.id}/${Date.now()}-${avatar.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatar);

        if (uploadError) throw uploadError;

        avatarUrl = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName).data.publicUrl;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          username: formData.username,
          full_name: formData.fullName,
          bio: formData.bio,
          avatar_url: avatarUrl,
          phone: formData.phone,
          timezone: formData.timezone,
          language: formData.language,
          country: formData.country,
          trading_experience: formData.tradingExperience,
          trading_style: formData.tradingStyle,
          risk_tolerance: formData.riskTolerance,
          preferred_markets: formData.preferredMarkets,
          email_notifications: formData.emailNotifications,
          social_links: formData.socialLinks,
          privacy_settings: formData.privacySettings,
          trading_goals: formData.tradingGoals
        }
      });

      if (updateError) throw updateError;

      setSuccess(true);
      
      // Update local avatar preview
      setAvatarPreview(avatarUrl);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        <p className="text-gray-400 mt-2">Manage your account and preferences</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-trading-accent" />
              Basic Information
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-trading-danger/10 border border-trading-danger/20 rounded-lg">
                <p className="text-sm text-trading-danger">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-trading-success/10 border border-trading-success/20 rounded-lg">
                <p className="text-sm text-trading-success">Profile updated successfully!</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="shrink-0">
                  <div className="relative">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                        <User className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-trading-accent rounded-full hover:bg-opacity-90 transition-colors"
                    >
                      <Upload className="w-4 h-4 text-gray-900" />
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleAvatarChange(e.target.files[0])}
                  />
                </div>

                <div>
                  <div className="text-lg font-medium">{formData.fullName || user?.email}</div>
                  <div className="text-sm text-gray-400">
                    Member since {new Date(user?.created_at || '').toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-gray-700/50 rounded-lg px-4 py-2.5 text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          </div>

          {/* Trading Profile Card */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-trading-accent" />
              Trading Profile
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Trading Experience
                  </label>
                  <select
                    value={formData.tradingExperience}
                    onChange={(e) => setFormData({ ...formData, tradingExperience: e.target.value })}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                  >
                    <option value="">Select experience</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Trading Style
                  </label>
                  <select
                    value={formData.tradingStyle}
                    onChange={(e) => setFormData({ ...formData, tradingStyle: e.target.value })}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                  >
                    <option value="">Select style</option>
                    <option value="day trading">Day Trading</option>
                    <option value="swing trading">Swing Trading</option>
                    <option value="position trading">Position Trading</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Risk Tolerance
                  </label>
                  <select
                    value={formData.riskTolerance}
                    onChange={(e) => setFormData({ ...formData, riskTolerance: e.target.value })}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                  >
                    <option value="">Select risk tolerance</option>
                    <option value="conservative">Conservative</option>
                    <option value="moderate">Moderate</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Preferred Markets
                  </label>
                  <select
                    multiple
                    value={formData.preferredMarkets}
                    onChange={(e) => setFormData({
                      ...formData,
                      preferredMarkets: Array.from(e.target.selectedOptions, option => option.value)
                    })}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                  >
                    <option value="forex">Forex</option>
                    <option value="stocks">Stocks</option>
                    <option value="crypto">Crypto</option>
                    <option value="commodities">Commodities</option>
                  </select>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-4">Trading Goals</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Monthly Target (%)
                    </label>
                    <input
                      type="number"
                      value={formData.tradingGoals.monthlyTarget}
                      onChange={(e) => setFormData({
                        ...formData,
                        tradingGoals: { ...formData.tradingGoals, monthlyTarget: e.target.value }
                      })}
                      className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                      placeholder="Enter target"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Risk Per Trade (%)
                    </label>
                    <input
                      type="number"
                      value={formData.tradingGoals.riskPerTrade}
                      onChange={(e) => setFormData({
                        ...formData,
                        tradingGoals: { ...formData.tradingGoals, riskPerTrade: e.target.value }
                      })}
                      className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                      placeholder="Enter risk"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Max Drawdown (%)
                    </label>
                    <input
                      type="number"
                      value={formData.tradingGoals.maxDrawdown}
                      onChange={(e) => setFormData({
                        ...formData,
                        tradingGoals: { ...formData.tradingGoals, maxDrawdown: e.target.value }
                      })}
                      className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                      placeholder="Enter max drawdown"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links Card */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Social Links</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Twitter
                </label>
                <input
                  type="url"
                  value={formData.socialLinks.twitter}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, twitter: e.target.value }
                  })}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                  placeholder="Twitter profile URL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={formData.socialLinks.linkedin}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, linkedin: e.target.value }
                  })}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                  placeholder="LinkedIn profile URL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  TradingView
                </label>
                <input
                  type="url"
                  value={formData.socialLinks.tradingview}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, tradingview: e.target.value }
                  })}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                  placeholder="TradingView profile URL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Myfxbook
                </label>
                <input
                  type="url"
                  value={formData.socialLinks.myfxbook}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, myfxbook: e.target.value }
                  })}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                  placeholder="Myfxbook profile URL"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Privacy Settings Card */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Privacy Settings</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.privacySettings.showProfile}
                  onChange={(e) => setFormData({
                    ...formData,
                    privacySettings: {
                      ...formData.privacySettings,
                      showProfile: e.target.checked
                    }
                  })}
                  className="rounded bg-gray-700 border-gray-600 text-trading-accent focus:ring-trading-accent"
                />
                <div>
                  <div className="font-medium">Show Profile</div>
                  <div className="text-sm text-gray-400">Make your profile visible to others</div>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.privacySettings.showTrades}
                  onChange={(e) => setFormData({
                    ...formData,
                    privacySettings: {
                      ...formData.privacySettings,
                      showTrades: e.target.checked
                    }
                  })}
                  className="rounded bg-gray-700 border-gray-600 text-trading-accent focus:ring-trading-accent"
                />
                <div>
                  <div className="font-medium">Show Trades</div>
                  <div className="text-sm text-gray-400">Share your trading history</div>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.privacySettings.showStats}
                  onChange={(e) => setFormData({
                    ...formData,
                    privacySettings: {
                      ...formData.privacySettings,
                      showStats: e.target.checked
                    }
                  })}
                  className="rounded bg-gray-700 border-gray-600 text-trading-accent focus:ring-trading-accent"
                />
                <div>
                  <div className="font-medium">Show Statistics</div>
                  <div className="text-sm text-gray-400">Display your trading performance</div>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.privacySettings.allowMessages}
                  onChange={(e) => setFormData({
                    ...formData,
                    privacySettings: {
                      ...formData.privacySettings,
                      allowMessages: e.target.checked
                    }
                  })}
                  className="rounded bg-gray-700 border-gray-600 text-trading-accent focus:ring-trading-accent"
                />
                <div>
                  <div className="font-medium">Allow Messages</div>
                  <div className="text-sm text-gray-400">Let others contact you</div>
                </div>
              </label>
            </div>
          </div>

          {/* Email Notifications Card */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Email Notifications</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.emailNotifications.marketUpdates}
                  onChange={(e) => setFormData({
                    ...formData,
                    emailNotifications: {
                      ...formData.emailNotifications,
                      marketUpdates: e.target.checked
                    }
                  })}
                  className="rounded bg-gray-700 border-gray-600 text-trading-accent focus:ring-trading-accent"
                />
                <div>
                  <div className="font-medium">Market Updates</div>
                  <div className="text-sm text-gray-400">Daily market analysis and news</div>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.emailNotifications.tradeAlerts}
                  onChange={(e) => setFormData({
                    ...formData,
                    emailNotifications: {
                      ...formData.emailNotifications,
                      tradeAlerts: e.target.checked
                    }
                  })}
                  className="rounded bg-gray-700 border-gray-600 text-trading-accent focus:ring-trading-accent"
                />
                <div>
                  <div className="font-medium">Trade Alerts</div>
                  <div className="text-sm text-gray-400">Notifications about your trades</div>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.emailNotifications.communityMessages}
                  onChange={(e) => setFormData({
                    ...formData,
                    emailNotifications: {
                      ...formData.emailNotifications,
                      communityMessages: e.target.checked
                    }
                  })}
                  className="rounded bg-gray-700 border-gray-600 text-trading-accent focus:ring-trading-accent"
                />
                <div>
                  <div className="font-medium">Community Messages</div>
                  <div className="text-sm text-gray-400">Messages from other traders</div>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.emailNotifications.educationalContent}
                  onChange={(e) => setFormData({
                    ...formData,
                    emailNotifications: {
                      ...formData.emailNotifications,
                      educationalContent: e.target.checked
                    }
                  })}
                  className="rounded bg-gray-700 border-gray-600 text-trading-accent focus:ring-trading-accent"
                />
                <div>
                  <div className="font-medium">Educational Content</div>
                  <div className="text-sm text-gray-400">Trading tips and tutorials</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}