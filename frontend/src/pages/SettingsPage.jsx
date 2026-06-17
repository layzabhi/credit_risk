import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { User, Lock, Bell, LogOut, Save, AlertCircle, CheckCircle } from 'lucide-react';

export function SettingsPage() {
  const { user, logout, updateProfile } = useAuth();
  const { put } = useApi();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Preferences State
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    daily_digest: true,
    risk_alerts: true,
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePreferenceChange = (e) => {
    const { name, checked } = e.target;
    setPreferences(prev => ({ ...prev, [name]: checked }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await updateProfile(profileData);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await put('/v1/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await put('/v1/auth/preferences', preferences);
      setMessage({ type: 'success', text: 'Preferences updated successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-on-surface">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Settings</h1>
        <p className="text-on-surface-variant text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 max-w-2xl ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold text-xs capitalize">{message.type}</p>
            <p className="text-xs">{message.text}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-2xl neo-inset bg-[#e8eaf0] w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMessage(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 font-bold text-xs rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'neo-raised text-primary bg-[#e8eaf0]'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-background rounded-3xl p-8 max-w-2xl neo-raised space-y-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4 border-b border-gray-300/20 pb-3">
              Profile Settings
            </h3>
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">First Name</label>
              <div className="neo-inset rounded-xl p-1 bg-[#e8eaf0]">
                <input
                  type="text"
                  name="first_name"
                  value={profileData.first_name}
                  onChange={handleProfileChange}
                  className="w-full bg-transparent border-none focus:ring-0 text-xs text-on-surface p-2 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Last Name</label>
              <div className="neo-inset rounded-xl p-1 bg-[#e8eaf0]">
                <input
                  type="text"
                  name="last_name"
                  value={profileData.last_name}
                  onChange={handleProfileChange}
                  className="w-full bg-transparent border-none focus:ring-0 text-xs text-on-surface p-2 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Email Address</label>
              <div className="neo-inset rounded-xl p-1 bg-[#e8eaf0]">
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="w-full bg-transparent border-none focus:ring-0 text-xs text-on-surface p-2 font-medium"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary hover:opacity-90 text-white rounded-xl font-bold text-xs neo-raised transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-white" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="space-y-5">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4 border-b border-gray-300/20 pb-3">
              Change Password
            </h3>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Current Password</label>
              <div className="neo-inset rounded-xl p-1 bg-[#e8eaf0]">
                <input
                  type="password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  className="w-full bg-transparent border-none focus:ring-0 text-xs text-on-surface p-2 font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">New Password</label>
              <div className="neo-inset rounded-xl p-1 bg-[#e8eaf0]">
                <input
                  type="password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  className="w-full bg-transparent border-none focus:ring-0 text-xs text-on-surface p-2 font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Confirm New Password</label>
              <div className="neo-inset rounded-xl p-1 bg-[#e8eaf0]">
                <input
                  type="password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  className="w-full bg-transparent border-none focus:ring-0 text-xs text-on-surface p-2 font-medium"
                  required
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary hover:opacity-90 text-white rounded-xl font-bold text-xs neo-raised transition-all flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-white" />
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <form onSubmit={handleSavePreferences} className="space-y-5">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4 border-b border-gray-300/20 pb-3">
              Notification Preferences
            </h3>

            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 rounded-2xl neo-inset bg-[#e2e4ea] cursor-pointer">
                <input
                  type="checkbox"
                  name="email_notifications"
                  checked={preferences.email_notifications}
                  onChange={handlePreferenceChange}
                  className="w-4 h-4 text-primary border-gray-300/60 rounded focus:ring-2 focus:ring-primary/20 cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-on-surface">Email Notifications</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Receive updates via email</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 rounded-2xl neo-inset bg-[#e2e4ea] cursor-pointer">
                <input
                  type="checkbox"
                  name="daily_digest"
                  checked={preferences.daily_digest}
                  onChange={handlePreferenceChange}
                  className="w-4 h-4 text-primary border-gray-300/60 rounded focus:ring-2 focus:ring-primary/20 cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-on-surface">Daily Summary Digest</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Receive a daily performance summary</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 rounded-2xl neo-inset bg-[#e2e4ea] cursor-pointer">
                <input
                  type="checkbox"
                  name="risk_alerts"
                  checked={preferences.risk_alerts}
                  onChange={handlePreferenceChange}
                  className="w-4 h-4 text-primary border-gray-300/60 rounded focus:ring-2 focus:ring-primary/20 cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-on-surface">High-Risk Alerts</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Be notified immediately when high-risk profiles are scored</p>
                </div>
              </label>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary hover:opacity-90 text-white rounded-xl font-bold text-xs neo-raised transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-white" />
                {loading ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 max-w-2xl neo-raised">
        <h3 className="text-base font-bold text-red-600 mb-2 font-headline uppercase tracking-wider">Danger Zone</h3>
        <p className="text-xs text-on-surface-variant mb-6">Logging out will invalidate your session on this browser.</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md active:scale-95 hover:scale-102"
        >
          <LogOut className="w-4 h-4 text-white" />
          Logout Session
        </button>
      </div>
    </div>
  );
}

export default SettingsPage;
