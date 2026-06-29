import React from 'react';
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
} from 'lucide-react';

export interface AppLayoutProps {
  children: React.ReactNode;
  userEmail?: string;
  handleLogout?: () => void;
}

export function AppLayout({ children, userEmail, handleLogout }: AppLayoutProps) {
  const { user: authUser, logout: authLogout } = useAuth();
  const location = useLocation();

  const displayEmail = authUser?.email || userEmail || 'guest@caltrack.com';
  const displayRole = authUser?.role || 'TECHNICIAN';
  const name = authUser ? `${authUser.firstName} ${authUser.lastName}` : displayEmail.split('@')[0];
  const finalLogout = authUser ? authLogout : (handleLogout || (() => {}));

  const isLinkActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex">
      <aside className="w-64 border-r border-gray-800 bg-[#0c1220]/60 backdrop-blur-md flex flex-col justify-between shrink-0">
        <div>
          <div className="h-16 flex items-center gap-3.5 px-6 border-b border-gray-800">
            <span className="p-1.5 bg-indigo-600/10 border border-indigo-500/25 rounded-lg text-indigo-400">
              <ShieldCheck size={20} />
            </span>
            <span className="font-extrabold tracking-widest text-lg text-white">CALTRACK</span>
          </div>

          <nav className="p-4 space-y-1.5">
            <Link
              to="/dashboard"
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
        </div>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 border border-white/5">
              <UserIcon size={16} />
            </div>
            <div className="overflow-hidden">
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
            onClick={finalLogout}
            className="w-full btn-transition flex items-center justify-center gap-2 py-2 px-3 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-gray-800/80 bg-[#090d16]/30 backdrop-blur-sm px-8 flex items-center justify-end">
          <span className="text-xs text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 glow-success animate-pulse"></span>
            System Live Node API Online
          </span>
        </header>
        <div className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
