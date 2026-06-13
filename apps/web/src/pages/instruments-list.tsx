import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Instrument } from '@caltrack/types';
import { Plus, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InstrumentsList() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchInstruments();
  }, []);

  const fetchInstruments = () => {
    setLoading(true);
    api.getInstruments()
      .then(res => {
        setInstruments(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to fetch instrument registry.');
        setLoading(false);
      });
  };

  const filtered = instruments.filter(inst => {
    const matchesSearch = inst.tagNumber.toLowerCase().includes(search.toLowerCase()) ||
      inst.instrumentType.toLowerCase().includes(search.toLowerCase()) ||
      inst.location.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || inst.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Instrument Registry</h1>
          <p className="text-gray-400 mt-1">Directory of monitored field instruments and sensors.</p>
        </div>
        <Link
          to="/instruments/new"
          className="btn-transition bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-indigo-600/10"
        >
          <Plus size={18} />
          Register Instrument
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass-card p-4 rounded-xl border border-white/5">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Search by tag, type, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-gray-800 w-full md:w-auto overflow-x-auto">
          {['ALL', 'ACTIVE', 'CALIBRATION_DUE', 'OVERDUE', 'INACTIVE'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase whitespace-nowrap btn-transition ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-400 border border-red-500/20 rounded-xl glass-panel">
          <AlertCircle className="mx-auto mb-3 text-red-500" size={36} />
          <p className="font-medium">{error}</p>
          <button
            onClick={fetchInstruments}
            className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-400 hover:underline"
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-gray-800 rounded-xl glass-card">
          <p className="text-gray-500 mb-2">No instruments match the selected criteria.</p>
          <button
            onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
            className="text-sm text-indigo-400 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-slate-900/30">
                  <th className="py-3 px-6">Tag Number</th>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6">Manufacturer / Model</th>
                  <th className="py-3 px-6">Range</th>
                  <th className="py-3 px-6">Signal Type</th>
                  <th className="py-3 px-6">Location</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-sm text-gray-300">
                {filtered.map((inst) => (
                  <tr key={inst.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-6 font-semibold text-indigo-400 group-hover:underline">
                      <Link to={`/instruments/${inst.id}`}>{inst.tagNumber}</Link>
                    </td>
                    <td className="py-4 px-6">{inst.instrumentType}</td>
                    <td className="py-4 px-6">{inst.manufacturer} / {inst.model}</td>
                    <td className="py-4 px-6 font-mono text-xs">
                      {inst.rangeMin} - {inst.rangeMax} {inst.engineeringUnits}
                    </td>
                    <td className="py-4 px-6">{inst.signalType}</td>
                    <td className="py-4 px-6 text-xs text-gray-400 max-w-[200px] truncate" title={inst.location}>
                      {inst.location}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        inst.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        inst.status === 'CALIBRATION_DUE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        inst.status === 'OVERDUE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          inst.status === 'ACTIVE' ? 'bg-emerald-500' :
                          inst.status === 'CALIBRATION_DUE' ? 'bg-amber-500' :
                          inst.status === 'OVERDUE' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}></span>
                        {inst.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-xs">
                      <div className="flex justify-end gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/instruments/${inst.id}`}
                          className="text-gray-400 hover:text-white"
                        >
                          View Details
                        </Link>
                        <Link
                          to={`/instruments/${inst.id}/edit`}
                          className="text-indigo-400 hover:text-indigo-300"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
