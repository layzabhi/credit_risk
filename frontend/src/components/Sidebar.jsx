import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Menu, X, BarChart3, FileText, Layers, Lock, Settings, Home, ChevronDown } from 'lucide-react';

/**
 * Sidebar component - Navigation sidebar with menu items
 */
export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [open, setOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState(null);

  const menuItems = [
    {
      label: 'Dashboard',
      icon: Home,
      path: '/',
      roles: ['user', 'admin'],
    },
    {
      label: 'Scoring',
      icon: BarChart3,
      path: '/scoring',
      roles: ['user', 'admin'],
    },
    {
      label: 'Batch Processing',
      icon: Layers,
      path: '/batch',
      roles: ['user', 'admin'],
    },
    {
      label: 'Governance',
      icon: FileText,
      path: '/governance',
      roles: ['admin'],
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      roles: ['user', 'admin'],
    },
  ];

  const isActive = (path) => location.pathname === path;

  const visibleItems = menuItems.filter(item =>
    item.roles.some(role => hasRole(role))
  );

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-40"
          onClick={() => setOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative left-0 top-16 md:top-0 h-[calc(100vh-4rem)] md:h-screen bg-gray-900 text-white transition-all duration-300 z-40 ${
          open ? 'w-64' : 'w-0 md:w-20'
        }`}
      >
        {/* Header */}
        <div className="h-16 md:h-0 flex items-center justify-between px-4 md:hidden">
          <h2 className="font-bold">Menu</h2>
          <button onClick={() => setOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="px-2 py-4 space-y-2 overflow-y-auto h-full md:h-auto md:mt-4">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${!open && 'md:mx-auto'}`} />
                <span className={`${!open && 'md:hidden'} whitespace-nowrap`}>
                  {item.label}
                </span>
                {active && !open && <div className="hidden md:block absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r"></div>}
              </button>
            );
          })}
        </nav>

        {/* Toggle Button */}
        <button
          onClick={() => setOpen(!open)}
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-gray-800 border-2 border-gray-900 rounded-full items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : '-rotate-90'}`} />
        </button>
      </aside>

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed bottom-8 right-8 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-30"
      >
        <Menu className="w-6 h-6" />
      </button>
    </>
  );
}

export default Sidebar;
