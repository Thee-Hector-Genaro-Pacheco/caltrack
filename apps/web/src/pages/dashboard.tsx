import { useEffect, useState } from 'react';
import api from '../lib/api';
import { DashboardStats } from '@caltrack/types';
import { Activity, AlertTriangle, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '@caltrack/utils';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getDashboardStats()
      .then(res => {
        setStats(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load dashboard statistics');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 glass-panel rounded-xl text-center max-w-xl mx-auto mt-10 border border-red-500/20">
        <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Error Loading Dashboard</h2>
        <p className="text-gray-400">{error || 'Unable to communicate with services.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Facility Telemetry</h1>
        <p className="text-gray-400 mt-1">Real-time instrument calibration compliance metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-xl relative overflow-hidden transition-all hover:scale-[1.02] border border-white/5 glow-primary">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Registered</p>
              <h3 className="text-4xl font-extrabold text-white mt-2">{stats.totalInstruments}</h3>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/25">
              <Database size={24} />
            </div>
          </div>
          <div className="mt-4 text-xs text-indigo-300">
            <Link to="/instruments" className="hover:underline">View registry index →</Link>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl relative overflow-hidden transition-all hover:scale-[1.02] border border-white/5 glow-warning">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Calibrations Due</p>
              <h3 className="text-4xl font-extrabold text-amber-500 mt-2">{stats.calibrationsDue}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/25">
              <Activity size={24} />
            </div>
          </div>
          <div className="mt-4 text-xs text-amber-400">
            <span>Requires calibration maintenance</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl relative overflow-hidden transition-all hover:scale-[1.02] border border-white/5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Overdue Registry</p>
              <h3 className="text-4xl font-extrabold text-red-500 mt-2">{stats.overdueInstruments}</h3>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg text-red-500 border border-red-500/25">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="mt-4 text-xs text-red-400">
            <span>Critical calibration gap</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-6 rounded-xl border border-white/5">
          <h3 className="text-lg font-bold text-white mb-4">Compliance Status Distribution</h3>
          
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-6">
            <div className="relative w-36 h-36 flex items-center justify-center rounded-full border-8 border-gray-800">
              <div className="absolute inset-0 rounded-full border-8 border-t-emerald-500 border-r-emerald-500 border-l-amber-500 border-b-red-500 animate-[spin_10s_linear_infinite] pointer-events-none"></div>
              <div className="text-center z-10">
                <span className="text-3xl font-extrabold text-white">
                  {stats.totalInstruments > 0 
                    ? Math.round(((stats.totalInstruments - stats.calibrationsDue - stats.overdueInstruments) / stats.totalInstruments) * 100)
                    : 100}%
                </span>
                <span className="block text-[10px] uppercase tracking-wider text-gray-400 mt-0.5">Active Compliance</span>
              </div>
            </div>

            <div className="space-y-3 shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#10b981]"></span>
                <span className="text-sm text-gray-300">Active / Valid ({stats.totalInstruments - stats.calibrationsDue - stats.overdueInstruments})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#f59e0b]"></span>
                <span className="text-sm text-gray-300">Calibration Due ({stats.calibrationsDue})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#ef4444]"></span>
                <span className="text-sm text-gray-300">Overdue ({stats.overdueInstruments})</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl border border-white/5 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Technician Actions</h3>
            <p className="text-xs text-gray-400 mb-6">Quick shortcuts to common registry updates.</p>
          </div>

          <div className="space-y-3">
            <Link
              to="/instruments/new"
              className="block w-full text-center btn-transition bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm shadow-md"
            >
              Add New Instrument
            </Link>
            <Link
              to="/instruments"
              className="block w-full text-center btn-transition bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm border border-white/5"
            >
              Review Instrument List
            </Link>
            <Link
              to="/audit"
              className="block w-full text-center btn-transition bg-transparent hover:bg-white/5 text-gray-300 font-medium py-2.5 px-4 rounded-lg text-sm"
            >
              Access Audit Log
            </Link>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-xl border border-white/5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">Recent Audit Activity</h3>
          <Link to="/audit" className="text-xs text-indigo-400 hover:underline">View full trail →</Link>
        </div>

        {stats.recentAuditActivity.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No recent modifications logged.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Changed By</th>
                  <th className="py-3 px-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-sm text-gray-300">
                {stats.recentAuditActivity.map((event) => (
                  <tr key={event.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs">{formatDate(event.timestamp)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                        event.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        event.action === 'UPDATE' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {event.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{event.entityType}</td>
                    <td className="py-3.5 px-4 text-xs font-mono">{event.changedBy}</td>
                    <td className="py-3.5 px-4 text-gray-400 italic max-w-xs truncate">{event.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
