import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { KeyRound, ShieldCheck, Mail, ArrowRight, AlertCircle, Info } from 'lucide-react';
import { DEMO_ROLE_PRESETS, DemoRolePreset } from '../config/demo-presets';

export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email address is required');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Authentication failure:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (preset: DemoRolePreset) => {
    setEmail(preset.email);
    setError(null);

    if (preset.publicPassword) {
      setPassword(preset.publicPassword);
      setInfoNotice(null);
    } else {
      setPassword('');
      setInfoNotice('Enter the private demo password supplied by the presenter.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background industrial grid decorative glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-500/5 blur-[120px]" />

      <div className="w-full max-w-lg space-y-6 z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck size={14} />
            CalTrack Enterprise Identity
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white font-sans mt-2">
            CAL<span className="text-indigo-400">TRACK</span>
          </h1>
          <p className="text-xs text-gray-500">
            Secure Role-Based Access Control and Calibration Audit Logging.
          </p>
        </div>

        {/* Public Portfolio Demo Notice Banner */}
        <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-950/40 border border-indigo-500/30 rounded-xl p-3.5 text-xs text-indigo-200 flex flex-col space-y-1">
          <div className="flex items-center justify-between font-bold text-indigo-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Public Demo Account
            </span>
            <span className="text-[10px] text-gray-400 font-mono">DEMO_VIEWER</span>
          </div>
          <p className="text-[11px] text-gray-300">
            Email: <code className="text-indigo-300 font-mono font-bold bg-slate-900/60 px-1 py-0.5 rounded">demo@caltrack.com</code> &bull; Password: <code className="text-indigo-300 font-mono font-bold bg-slate-900/60 px-1 py-0.5 rounded">DemoOnly123!</code>
          </p>
        </div>

        <Card className="border border-gray-800/80 bg-[#090d16]/90 p-8 shadow-2xl rounded-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg p-3">
                <AlertCircle className="shrink-0 mt-0.5" size={15} />
                <span>{error}</span>
              </div>
            )}

            {infoNotice && (
              <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-lg p-3">
                <Info className="shrink-0 mt-0.5" size={15} />
                <span>{infoNotice}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={12} />
                Enterprise Email Address
              </label>
              <Input
                type="email"
                placeholder="email@caltrack.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-slate-950/60 border-gray-800 text-sm focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound size={12} />
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-slate-950/60 border-gray-800 text-sm focus:border-indigo-500"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full justify-center text-sm py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 mt-2 shadow-lg shadow-indigo-600/20 transition-all duration-200"
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={15} />
                </>
              )}
            </Button>
          </form>

          {/* Quick-select Demo Registry */}
          <div className="pt-4 border-t border-gray-800/80 space-y-3">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block text-center">
              Quick Connect Role Selectors
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_ROLE_PRESETS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  className={`flex flex-col text-left p-2.5 rounded-lg border text-xs font-sans transition-all duration-150 ${
                    email === acc.email
                      ? 'bg-indigo-500/10 border-indigo-500 text-white'
                      : 'bg-slate-950/30 border-gray-800 text-gray-400 hover:border-gray-700 hover:bg-slate-950/50'
                  }`}
                >
                  <span className="font-bold text-white text-[11px]">{acc.label}</span>
                  <span className="text-[9px] text-gray-500 truncate">{acc.description}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
