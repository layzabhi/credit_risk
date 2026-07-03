import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Bell, User, LogOut, Settings, Sun, Moon, CheckCircle2, AlertTriangle, Info, X, ShieldAlert, Check } from 'lucide-react';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsMenuOpen, setNotificationsMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'success',
      title: 'Model Calibration Complete',
      message: 'Ensemble XGBoost model retrained successfully. Accuracy improved by +0.8% to 87.7%.',
      time: '10m ago',
      read: false,
      link: '/model-performance'
    },
    {
      id: 2,
      type: 'warning',
      title: 'High Risk Profile Flagged',
      message: 'Applicant AP-9831 default probability calculated at 91.5% and recommended for manual review.',
      time: '1h ago',
      read: false,
      link: '/scoring'
    },
    {
      id: 3,
      type: 'alert',
      title: 'Data Drift Warning',
      message: 'Feature drift detected in "Debt-to-Income (DTI) ratio" inputs over the past 24 hours.',
      time: '4h ago',
      read: true,
      link: '/dataset-insights'
    },
    {
      id: 4,
      type: 'info',
      title: 'Security: API Token Generated',
      message: 'A new read-only API access token was generated for integration with the core banking system.',
      time: '1d ago',
      read: true,
      link: '/settings'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const deleteNotification = (id) => {
    setNotifications(prev =>
      prev.filter(n => n.id !== id)
    );
  };

  const handleNotificationClick = (item) => {
    markAsRead(item.id);
    setNotificationsMenuOpen(false);
    navigate(item.link);
  };

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  React.useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!e.target.closest('.profile-menu-container')) {
        setProfileMenuOpen(false);
      }
      if (!e.target.closest('.notifications-container')) {
        setNotificationsMenuOpen(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/scoring': return 'Prediction';
      case '/explainability': return 'Explainability';
      case '/model-performance': return 'Model Performance';
      case '/dataset-insights': return 'Dataset Insights';
      case '/about-project': return 'About Project';
      case '/settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  const profileName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : 'Erika Collins';

  const getRoleLabel = () => {
    if (user?.email?.toLowerCase() === 'admin.risklens@gmail.com') {
      return 'Admin';
    }
    if (user?.role) {
      if (user.role.toLowerCase() === 'admin') return 'Admin';
      return 'Analyst';
    }
    if (user?.roles && user.roles.length > 0) {
      if (user.roles.includes('admin')) return 'Admin';
      return 'Analyst';
    }
    return 'Analyst';
  };

  const profileRole = getRoleLabel();

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0] ? name[0].toUpperCase() : 'U';
  };

  return (
    <nav className="bg-transparent px-8 pt-6 pb-2 flex justify-between items-center z-10 shrink-0">
      {/* Left side title */}
      <h2 className="text-sm font-medium text-slate-500">
        <b>{getPageTitle()}</b>
      </h2>

      {/* Right side items */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          {/* Day / Night Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div className="relative notifications-container">
            <button 
              onClick={() => setNotificationsMenuOpen(!notificationsMenuOpen)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors relative focus:outline-none"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 border border-white dark:border-slate-900 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notificationsMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 z-50 overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-850 dark:text-slate-200">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {/* Body */}
                <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-105 dark:divide-slate-800 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                        <Check className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-350 font-sans">All caught up!</p>
                      <p className="text-[10px] text-slate-400 max-w-[180px] leading-normal font-sans">
                        No new system alerts or risk ratings require your attention.
                      </p>
                    </div>
                  ) : (
                    notifications.map((item) => {
                      const Icon = item.type === 'success' ? CheckCircle2 :
                                  item.type === 'warning' ? AlertTriangle :
                                  item.type === 'alert' ? ShieldAlert : Info;

                      const iconBg = item.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' :
                                     item.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400' :
                                     item.type === 'alert' ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400' :
                                     'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400';

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className={`px-4 py-3 flex items-start gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer relative group ${
                            !item.read ? 'bg-indigo-50/[0.15] dark:bg-indigo-500/[0.02]' : ''
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${iconBg}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-xs font-bold truncate ${
                                !item.read ? 'text-slate-900 dark:text-slate-100 font-extrabold' : 'text-slate-700 dark:text-slate-300'
                              }`}>
                                {item.title}
                              </p>
                              {!item.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 animate-pulse" />
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                              {item.message}
                            </p>
                            <span className="text-[9px] text-slate-400 mt-1 block font-mono">
                              {item.time}
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(item.id);
                            }}
                            className="absolute right-2 top-3 p-1 text-slate-305 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/20 dark:bg-slate-900/20">
                    <button
                      onClick={clearAll}
                      className="text-[10px] font-bold text-slate-450 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative profile-menu-container">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-3 ml-2 cursor-pointer hover:opacity-90 transition-opacity focus:outline-none"
            >
              {user?.avatar_url ? (
                <img
                  alt={profileName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  src={user.avatar_url}
                />
              ) : (
                <div className="w-10 h-10 rounded-full border border-slate-200 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm shrink-0">
                  {getInitials(profileName)}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-sm font-bold text-slate-800 leading-none">{profileName}</p>
                <p className="text-xs text-slate-400 mt-1">{profileRole}</p>
              </div>
            </button>

            {/* Profile Dropdown */}
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg p-2 z-50 border border-slate-100">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-800">{profileName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email || 'erika.collins@risklens.ai'}</p>
                </div>

                <button
                  onClick={() => {
                    navigate('/settings');
                    setProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg flex items-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Settings
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
