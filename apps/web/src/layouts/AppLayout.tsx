import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Database,
  ShieldCheck,
  Activity,
  LogOut,
  LayoutDashboard,
  User as UserIcon,
  Layers,
  RefreshCw,
  ClipboardList,
  ClipboardCheck,
  Scale,
  BookOpen,
  Menu,
  X,
} from 'lucide-react';

export interface AppLayoutProps {
  children: React.ReactNode;
  userEmail?: string;
  handleLogout?: () => void;
}

export function AppLayout({ children, userEmail, handleLogout }: AppLayoutProps) {
  const { user: authUser, logout: authLogout } = useAuth();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const displayEmail = authUser?.email || userEmail || 'guest@caltrack.com';
  const displayRole = authUser?.role || 'TECHNICIAN';
  const name = authUser ? `${authUser.firstName} ${authUser.lastName}` : displayEmail.split('@')[0];
  const finalLogout = authUser ? authLogout : (handleLogout || (() => {}));

  const isLinkActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  // Close drawer on location change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  // Lock scroll & add Escape key listener when drawer is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false);
      }
    };

    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen]);

  const renderNavLinks = () => (
    <nav className="p-4 space-y-1.5">
      <Link
        to="/dashboard"
        onClick={() => setIsDrawerOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isLinkActive('/dashboard')
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <LayoutDashboard size={18} />
        Dashboard
      </Link>
      <Link
        to="/process-areas"
        onClick={() => setIsDrawerOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isLinkActive('/process-areas')
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <Layers size={18} />
        Process Areas
      </Link>
      <Link
        to="/control-loops"
        onClick={() => setIsDrawerOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isLinkActive('/control-loops')
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <RefreshCw size={18} />
        Control Loops
      </Link>
      <Link
        to="/work-orders"
        onClick={() => setIsDrawerOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isLinkActive('/work-orders')
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <ClipboardList size={18} />
        Work Orders
      </Link>
      {(displayRole === 'QA_REVIEWER' || displayRole === 'ADMINISTRATOR') && (
        <Link
          to="/approvals"
          onClick={() => setIsDrawerOpen(false)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isLinkActive('/approvals')
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <ClipboardCheck size={18} />
          Approvals
        </Link>
      )}
      {(displayRole === 'METROLOGY_MANAGER' || displayRole === 'ADMINISTRATOR') && (
        <Link
          to="/reference-standards"
          onClick={() => setIsDrawerOpen(false)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isLinkActive('/reference-standards')
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Scale size={18} />
          Reference Standards
        </Link>
      )}
      <Link
        to="/documentation"
        onClick={() => setIsDrawerOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isLinkActive('/documentation')
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <BookOpen size={18} />
        Doc Library
      </Link>
      <Link
        to="/instruments"
        onClick={() => setIsDrawerOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isLinkActive('/instruments')
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <Database size={18} />
        Instruments
      </Link>
      <Link
        to="/audit"
        onClick={() => setIsDrawerOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isLinkActive('/audit')
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <Activity size={18} />
        Audit Trail
      </Link>
    </nav>
  );

  const renderUserProfile = () => (
    <div className="p-4 border-t border-gray-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 border border-white/5 shrink-0">
          <UserIcon size={16} />
        </div>
        <div className="overflow-hidden min-w-0">
          <span className="block text-xs font-semibold text-white truncate">{name}</span>
          <span className="block text-[10px] text-gray-500 truncate" title={displayEmail}>{displayEmail}</span>
          <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase mt-1 tracking-wider ${
            displayRole === 'ADMINISTRATOR' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
            displayRole === 'SUPERVISOR' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
            displayRole === 'QA_REVIEWER' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
            displayRole === 'METROLOGY_MANAGER' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
            'bg-slate-500/20 text-slate-400 border border-slate-500/30'
          }`}>
            {displayRole.replace('_', ' ')}
          </span>
        </div>
      </div>

      <button
        onClick={() => {
          setIsDrawerOpen(false);
          finalLogout();
        }}
        className="w-full btn-transition flex items-center justify-center gap-2 py-2 px-3 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg"
      >
        <LogOut size={14} />
        Sign Out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col md:flex-row">
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:flex w-64 border-r border-gray-800 bg-[#0c1220]/60 backdrop-blur-md flex-col justify-between shrink-0">
        <div>
          <div className="h-16 flex items-center gap-3.5 px-6 border-b border-gray-800">
            <span className="p-1.5 bg-indigo-600/10 border border-indigo-500/25 rounded-lg text-indigo-400">
              <ShieldCheck size={20} />
            </span>
            <span className="font-extrabold tracking-widest text-lg text-white">CALTRACK</span>
          </div>
          {renderNavLinks()}
        </div>
        {renderUserProfile()}
      </aside>

      {/* Mobile Backdrop Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-in Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
        className={`fixed top-0 left-0 bottom-0 z-50 w-[85vw] max-w-[320px] bg-[#0c1220] border-r border-gray-800 flex flex-col justify-between shadow-2xl transition-transform duration-300 md:hidden ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800">
            <div className="flex items-center gap-3.5">
              <span className="p-1.5 bg-indigo-600/10 border border-indigo-500/25 rounded-lg text-indigo-400">
                <ShieldCheck size={20} />
              </span>
              <span className="font-extrabold tracking-widest text-lg text-white">CALTRACK</span>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close navigation drawer"
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          {renderNavLinks()}
        </div>
        {renderUserProfile()}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col w-full">
        <header className="h-16 border-b border-gray-800/80 bg-[#090d16]/30 backdrop-blur-sm px-4 md:px-8 flex items-center justify-between md:justify-end">
          {/* Hamburger button (Mobile only) */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors md:hidden flex items-center gap-2"
          >
            <Menu size={22} />
            <span className="text-xs font-bold text-white tracking-widest">CALTRACK</span>
          </button>

          <span className="text-xs text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 glow-success animate-pulse"></span>
            System Live Node API Online
          </span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AppLayout;

