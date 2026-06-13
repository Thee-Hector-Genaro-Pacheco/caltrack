import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { ControlLoop, ProcessArea } from '@caltrack/types';
import { Plus, Calendar, ShieldAlert, X, Eye } from 'lucide-react';
import { formatDate } from '@caltrack/utils';

export default function ControlLoops() {
  const [loops, setLoops] = useState<ControlLoop[]>([]);
  const [areas, setAreas] = useState<ProcessArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loopNumber, setLoopNumber] = useState('');
  const [loopTag, setLoopTag] = useState('');
  const [description, setDescription] = useState('');
  const [pidReference, setPidReference] = useState('');
  const [processAreaId, setProcessAreaId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const loopsList = await api.getControlLoops();
      const areasList = await api.getProcessAreas();
      setLoops(loopsList);
      setAreas(areasList);
      if (areasList.length > 0) {
        setProcessAreaId(areasList[0].id);
      }
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch control loops or process areas.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processAreaId) {
      alert('Please select a process area first.');
      return;
    }
    setSubmitting(true);
    try {
      await api.createControlLoop({
        loopNumber,
        loopTag,
        description,
        pidReference,
        processAreaId,
      });
      setLoopNumber('');
      setLoopTag('');
      setDescription('');
      setPidReference('');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create control loop.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Control Loops</h1>
          <p className="text-gray-400 mt-1">Instrument feedback configurations and control blocks.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-transition bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-indigo-600/10"
        >
          <Plus size={16} />
          Create Control Loop
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/30 text-red-200 text-sm rounded-lg flex gap-3">
          <ShieldAlert className="shrink-0" size={20} />
          <span>{error}</span>
        </div>
      )}

      {loops.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm border border-dashed border-gray-800 rounded-lg">
          No control loops configured. Select Create Control Loop to initialize one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loops.map((loop) => (
            <div key={loop.id} className="glass-card p-6 rounded-xl border border-white/5 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-lg font-bold font-mono text-xs">
                      #{loop.loopNumber}
                    </span>
                    <h3 className="text-base font-bold text-white tracking-tight">{loop.loopTag}</h3>
                  </div>
                  <Link
                    to={`/control-loops/${loop.id}`}
                    className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors"
                    title="View Loop details"
                  >
                    <Eye size={16} />
                  </Link>
                </div>
                
                <div className="space-y-2 text-xs">
                  <p className="text-gray-400 leading-relaxed min-h-[36px]">
                    {loop.description || 'No description provided.'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800/40">
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase font-semibold">Process Area</span>
                      <span className="text-white font-medium">{loop.processArea?.name || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase font-semibold">P&ID Reference</span>
                      <span className="text-white font-mono">{loop.pidReference || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-800/60 pt-4 mt-6 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1 font-mono">
                  <Calendar size={13} />
                  {formatDate(loop.createdAt)}
                </span>
                <span className="bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded">
                  {(loop.instruments || []).length} Associated Devices
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl glow-primary relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-1 font-sans">Create Control Loop</h3>
            <p className="text-gray-400 text-xs mb-6">Group field transmitters and control elements into feedback loops.</p>

            {areas.length === 0 ? (
              <div className="space-y-4 py-4 text-center">
                <p className="text-sm text-gray-400">You must register at least one Process Area before creating a Control Loop.</p>
                <Link
                  to="/process-areas"
                  className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-xs"
                >
                  Go to Process Areas
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      Loop Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 101, 205"
                      className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                      value={loopNumber}
                      onChange={(e) => setLoopNumber(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      Loop Tag / Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PT-101 Loop"
                      className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                      value={loopTag}
                      onChange={(e) => setLoopTag(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Process Area Selection *
                  </label>
                  <select
                    className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    value={processAreaId}
                    onChange={(e) => setProcessAreaId(e.target.value)}
                  >
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.areaCode} - {a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    P&ID Sheet Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PID-10-FW-101"
                    className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                    value={pidReference}
                    onChange={(e) => setPidReference(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 h-20 resize-none"
                    placeholder="Describe control logic (e.g. PID loop feeding boiler level valve)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 text-sm">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-transition bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md"
                  >
                    {submitting ? 'Creating...' : 'Create Loop'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
