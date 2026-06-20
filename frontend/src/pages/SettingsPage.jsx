import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { User, Lock, Bell, LogOut, Save, AlertCircle, CheckCircle, Users, Trash2 } from 'lucide-react';

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

  const [preferences, setPreferences] = useState({
    email_notifications: true,
    daily_digest: true,
    risk_alerts: true,
  });

  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [userToDelete, setUserToDelete] = useState(null);
  const isAdmin = user?.role === 'admin' || user?.roles?.includes('admin') || user?.email?.toLowerCase() === 'admin.risklens@gmail.com';

  useEffect(() => {
    if (activeTab === 'admin') {
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      setRegisteredUsers(users);
    }
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleRemoveUser = (emailToRemove) => {
    if (emailToRemove.toLowerCase() === 'admin.risklens@gmail.com') {
      setMessage({ type: 'error', text: 'Super Admin cannot be removed.' });
      return;
    }
    setUserToDelete(emailToRemove);
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;
    const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const updatedUsers = users.filter(u => u.email.toLowerCase() !== userToDelete.toLowerCase());
    localStorage.setItem('mock_users', JSON.stringify(updatedUsers));
    setRegisteredUsers(updatedUsers);
    setMessage({ type: 'success', text: `User ${userToDelete} removed successfully.` });
    setUserToDelete(null);
  };

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
    ...(isAdmin ? [{ id: 'admin', label: 'Users', icon: Users }] : []),
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
      <div className="flex gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200 w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMessage(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 font-bold text-xs rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'text-indigo-600 bg-white shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl p-8 max-w-2xl border border-slate-100 shadow-sm space-y-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4 border-b border-gray-300/20 pb-3">
              Profile Settings
            </h3>
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">First Name</label>
              <div className="rounded-xl p-1 bg-slate-50 border border-slate-200 focus-within:border-indigo-500 transition-colors">
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
              <div className="rounded-xl p-1 bg-slate-50 border border-slate-200 focus-within:border-indigo-500 transition-colors">
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
              <div className="rounded-xl p-1 bg-slate-50 border border-slate-200 focus-within:border-indigo-500 transition-colors">
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
                className="px-6 py-3 bg-primary hover:opacity-90 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2"
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
              <div className="rounded-xl p-1 bg-slate-50 border border-slate-200 focus-within:border-indigo-500 transition-colors">
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
              <div className="rounded-xl p-1 bg-slate-50 border border-slate-200 focus-within:border-indigo-500 transition-colors">
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
              <div className="rounded-xl p-1 bg-slate-50 border border-slate-200 focus-within:border-indigo-500 transition-colors">
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
                className="px-6 py-3 bg-primary hover:opacity-90 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2"
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
              <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/55 transition-all">
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

              <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/55 transition-all">
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

              <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/55 transition-all">
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
                className="px-6 py-3 bg-primary hover:opacity-90 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-white" />
                {loading ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        )}

        {/* Admin Tab (Users Management) */}
        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4 border-b border-gray-300/20 pb-3">
              Users Management
            </h3>
            
            <p className="text-xs text-on-surface-variant font-medium">
              Total registered users: <span className="text-indigo-600 font-bold">{registeredUsers.length}</span>
            </p>

            <div className="overflow-hidden border border-slate-100 rounded-2xl">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th scope="col" className="px-6 py-4">Name</th>
                    <th scope="col" className="px-6 py-4">Email</th>
                    <th scope="col" className="px-6 py-4">Role</th>
                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-medium text-on-surface">
                  {registeredUsers.map(userItem => {
                    const isSuperAdmin = userItem.email?.toLowerCase() === 'admin.risklens@gmail.com';
                    return (
                      <tr key={userItem.email} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {userItem.first_name} {userItem.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {userItem.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isSuperAdmin || userItem.role === 'admin' || userItem.roles?.includes('admin')
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {isSuperAdmin || userItem.role === 'admin' || userItem.roles?.includes('admin') ? 'Admin' : 'Analyst'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleRemoveUser(userItem.email)}
                            disabled={isSuperAdmin}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isSuperAdmin
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-red-600 hover:bg-red-50 active:scale-95'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {registeredUsers.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-400 font-normal">
                        No registered users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-xl space-y-6">
            <div className="space-y-2">
              <h4 className="text-base font-bold text-slate-800">Remove User</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-slate-700">{userToDelete}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-all"
              >
                Remove User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
