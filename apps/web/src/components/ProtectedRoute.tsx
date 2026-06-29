import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '@caltrack/types';
import Spinner from './ui/Spinner';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b13] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Administrators automatically bypass all frontend RBAC checks
  if (user.role === 'ADMINISTRATOR') {
    return <>{children}</>;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 bg-[#070b13] font-sans">
        <div className="bg-[#1c0f16]/60 border border-red-900/30 rounded-2xl p-8 max-w-md space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-950/30 text-red-500/80 mb-2">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-lg font-bold text-red-400 uppercase tracking-wide">Access Denied</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Your current security role (<span className="text-gray-300 font-bold uppercase">{user.role.replace('_', ' ')}</span>) is not authorized to view this resource.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
