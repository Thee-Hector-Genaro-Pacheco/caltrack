import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ShieldCheck, Lock, Mail, Server } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!isSupabaseConfigured) {
      localStorage.setItem('caltrack_mock_token', 'mock-jwt-auth-session-token');
      localStorage.setItem('caltrack_user_email', email || 'technician@caltrack.com');
      setTimeout(() => {
        setLoading(false);
        navigate('/dashboard');
      }, 600);
      return;
    }

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase!.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        setSuccess('Registration successful! Check your email for confirmation link or sign in.');
        setIsSignUp(false);
      } else {
        const { error: signInError } = await supabase!.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090d16] px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl glow-primary relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-4 text-indigo-400">
            <ShieldCheck size={36} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">CALTRACK</h1>
          <p className="text-gray-400 text-sm mt-1 text-center">Industrial Instrumentation & Calibration Management</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-6 p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg flex gap-3 text-xs text-amber-300">
            <Server size={20} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Demo Simulation Active</span>
              Supabase Auth env keys are not set. The login screen will simulate sessions locally using local storage.
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 bg-red-950/20 border border-red-500/30 text-red-200 text-sm rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 text-sm rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="email"
                required
                className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="tech@facility.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="password"
                required
                className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-transition bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 mt-4 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Technician Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button onClick={() => setIsSignUp(false)} className="text-indigo-400 hover:underline">
                Sign In
              </button>
            </p>
          ) : (
            <p>
              New technician?{' '}
              <button onClick={() => setIsSignUp(true)} className="text-indigo-400 hover:underline">
                Register Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
