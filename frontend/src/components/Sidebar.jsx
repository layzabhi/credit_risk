import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MenuToggle } from './ui/menu-toggle';
import {
  Home,
  Activity,
  Eye,
  LineChart,
  Database,
  Info,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  CheckCircle2
} from 'lucide-react';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [open, setOpen] = useState(true);

  const menuItems = [
    {
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      roles: ['user', 'admin', 'analyst'],
    },
    {
      label: 'Prediction',
      icon: Activity,
      path: '/scoring',
      roles: ['user', 'admin', 'analyst'],
    },
    {
      label: 'Explainability',
      icon: Eye,
      path: '/explainability',
      roles: ['user', 'admin', 'analyst'],
    },
    {
      label: 'Model Performance',
      icon: LineChart,
      path: '/model-performance',
      roles: ['user', 'admin', 'analyst'],
    },
    {
      label: 'Dataset Insights',
      icon: Database,
      path: '/dataset-insights',
      roles: ['user', 'admin', 'analyst'],
    },
    {
      label: 'About Project',
      icon: Info,
      path: '/about-project',
      roles: ['user', 'admin', 'analyst'],
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      roles: ['user', 'admin', 'analyst'],
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
        className={`nav-sidebar flex flex-col py-6 text-slate-800 shrink-0 z-20 transition-all duration-300 relative ${open ? 'w-56' : 'w-16'
          }`}
      >
        {/* Header */}
        {open ? (
          <div className="mb-10 flex items-center justify-between px-6 w-full gap-3 transition-all duration-300">
            <div className="transition-opacity duration-300 min-w-0">
              <h1 className="text-lg font-headline font-bold leading-tight text-indigo-600">RiskLens</h1>
              <p className="text-[9px] font-semibold text-slate-500 tracking-wider uppercase leading-tight mt-0.5">
                AI-Powered Credit Risk Assessment
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none"
              aria-label="Collapse Sidebar"
            >
              <MenuToggle open={true} onOpenChange={() => { }} className="w-4 h-4 text-slate-600 pointer-events-none" />
            </button>
          </div>
        ) : (
          <div className="mb-10 flex items-center justify-center w-full transition-all duration-300">
            <button
              onClick={() => setOpen(true)}
              className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none"
              aria-label="Expand Sidebar"
            >
              <MenuToggle open={false} onOpenChange={() => { }} className="w-4 h-4 text-slate-600 pointer-events-none" />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className={`flex-1 space-y-1 ${open ? 'pr-2' : ''}`}>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 768) {
                    setOpen(false);
                  }
                }}
                className={`w-full flex items-center transition-all relative ${open ? 'px-6 gap-3 py-2.5 rounded-r-lg' : 'justify-center py-2.5'
                  } ${active
                    ? 'active-nav'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                {open && <span className="font-semibold text-sm transition-opacity duration-300">{item.label}</span>}
                {active && !open && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* System Status */}
        <div className={`mt-auto mb-6 flex items-center text-xs text-slate-500 transition-all duration-300 ${open ? 'px-6 gap-2' : 'justify-center'}`}>
          {open ? (
            <>
              <span className="opacity-80">System Status:</span>
              <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Active
              </span>
            </>
          ) : (
            <div className="w-8 h-8 flex items-center justify-center text-emerald-500" title="System Status: Active">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
