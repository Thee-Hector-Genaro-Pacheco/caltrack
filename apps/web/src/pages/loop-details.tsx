import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { ControlLoop, Instrument } from '@caltrack/types';
import { ArrowLeft, ShieldAlert, Cpu } from 'lucide-react';

export default function LoopDetails() {
  const { id } = useParams<{ id: string }>();
  const [loop, setLoop] = useState<ControlLoop | null>(null);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const loopData = await api.getControlLoop(id!);
      const instrumentsData = await api.getLoopInstruments(id!);
      setLoop(loopData);
      setInstruments(instrumentsData);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError('Control Loop details not found or API is offline.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !loop) {
    return (
      <div className="p-6 glass-panel rounded-xl text-center max-w-xl mx-auto mt-10 border border-red-500/20">
        <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Loop Query Error</h2>
        <p className="text-gray-400">{error || 'Loop details not found.'}</p>
        <Link to="/control-loops" className="mt-6 inline-block text-indigo-400 hover:underline">Back to Control Loops</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link to="/control-loops" className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="p-1 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded font-mono text-base">
              #{loop.loopNumber}
            </span>
            {loop.loopTag}
          </h1>
          <p className="text-gray-400 mt-1">Details and linked instruments operating in control feedback block.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-6 rounded-xl border border-white/5 space-y-6">
          <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-2">Loop Configuration Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
            <div>
              <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Loop Tag Reference</span>
              <span className="text-white font-medium mt-0.5 block">{loop.loopTag}</span>
            </div>
            <div>
              <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">P&ID Document ID</span>
              <span className="text-white font-mono mt-0.5 block">{loop.pidReference || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Process Area Code</span>
              <span className="text-white font-medium mt-0.5 block">{loop.processArea?.areaCode} - {loop.processArea?.name}</span>
            </div>
            <div>
              <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Associated Devices Count</span>
              <span className="text-white font-medium mt-0.5 block">{instruments.length} Devices</span>
            </div>
            <div className="sm:col-span-2">
              <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Functional Description</span>
              <span className="text-white font-medium mt-0.5 block leading-relaxed">{loop.description || 'No description provided.'}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl border border-white/5 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Metrology Overview</h3>
            <div className="flex items-center gap-3 mt-2">
              <span className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg">
                <Cpu size={24} />
              </span>
              <div>
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  {instruments.filter(i => i.status === 'ACTIVE').length} / {instruments.length}
                </span>
                <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Active Instruments</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-6 leading-relaxed">
              Instruments in this control loop must be calibrated periodically according to process area limits and maximum permissible error configurations.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-xl border border-white/5">
        <h3 className="text-lg font-bold text-white mb-6">Loop Instruments (Devices)</h3>

        {instruments.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm border border-dashed border-gray-800 rounded-lg">
            No instruments are linked to this control loop.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-slate-900/30">
                  <th className="py-3 px-4">Tag Number</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Manufacturer</th>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4">Span Range</th>
                  <th className="py-3 px-4">MPE %</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-sm text-gray-300">
                {instruments.map((inst) => (
                  <tr key={inst.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      <Link to={`/instruments/${inst.id}`} className="hover:underline text-indigo-400">
                        {inst.tagNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-xs">{inst.instrumentType}</td>
                    <td className="py-3.5 px-4 text-xs">{inst.manufacturer}</td>
                    <td className="py-3.5 px-4 text-xs">{inst.model}</td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      {inst.rangeMin} - {inst.rangeMax} {inst.engineeringUnits}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">±{inst.maxPermissibleError}%</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                        inst.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        inst.status === 'CALIBRATION_DUE' ? 'bg-amber-500/10 text-amber-400 border border-emerald-500/20' :
                        inst.status === 'OVERDUE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          inst.status === 'ACTIVE' ? 'bg-emerald-400' :
                          inst.status === 'CALIBRATION_DUE' ? 'bg-amber-400' :
                          inst.status === 'OVERDUE' ? 'bg-red-400' : 'bg-gray-400'
                        }`}></span>
                        {inst.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/instruments/${inst.id}`}
                        className="text-xs text-indigo-400 hover:underline"
                      >
                        Details
                      </Link>
                    </td>
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
