import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Bell, User, LogOut, Settings, Sun, Moon } from 'lucide-react';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

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
    
  const profileRole = user?.role ? user.role : 'Super Admin';

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
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-[#f8f9ff] rounded-full"></span>
          </button>

          {/* Profile Menu */}
          <div className="relative">
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
