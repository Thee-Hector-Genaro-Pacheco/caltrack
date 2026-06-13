import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { ProcessArea } from '@caltrack/types';
import { Plus, Calendar, ShieldAlert, X } from 'lucide-react';
import { formatDate } from '@caltrack/utils';

export default function ProcessAreas() {
  const [areas, setAreas] = useState<ProcessArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [areaCode, setAreaCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = () => {
    setLoading(true);
    api.getProcessAreas()
      .then(res => {
        setAreas(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to fetch process areas.');
        setLoading(false);
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createProcessArea({
        areaCode,
        name,
        description,
      });
      setAreaCode('');
      setName('');
      setDescription('');
      setIsModalOpen(false);
      fetchAreas();
    } catch (err: any) {
      alert(err.message || 'Failed to create process area.');
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
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Process Areas</h1>
          <p className="text-gray-400 mt-1">Physical plant divisions and process systems.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-transition bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-indigo-600/10"
        >
          <Plus size={16} />
          Add Process Area
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/30 text-red-200 text-sm rounded-lg flex gap-3">
          <ShieldAlert className="shrink-0" size={20} />
          <span>{error}</span>
        </div>
      )}

      {areas.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm border border-dashed border-gray-800 rounded-lg">
          No process areas registered in system.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {areas.map((area) => (
            <div key={area.id} className="glass-card p-6 rounded-xl border border-white/5 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-lg font-bold font-mono">
                    {area.areaCode}
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight">{area.name}</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed min-h-[40px]">
                  {area.description || 'No description provided.'}
                </p>
              </div>

              <div className="border-t border-gray-800/60 pt-4 mt-6 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1 font-mono">
                  <Calendar size={13} />
                  {formatDate(area.createdAt)}
                </span>
                <span className="bg-indigo-500/10 border border-indigo-500/10 text-indigo-300 font-semibold px-2 py-0.5 rounded">
                  {(area.controlLoops || []).length} Control Loops
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
            <h3 className="text-xl font-bold text-white mb-1 font-sans">New Process Area</h3>
            <p className="text-gray-400 text-xs mb-6">Create process system code parameters to partition loops and devices.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Area Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10, 12, 15"
                  className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  value={areaCode}
                  onChange={(e) => setAreaCode(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Area Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Feedwater System"
                  className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 h-24 resize-none"
                  placeholder="Summarize the functional area details, processes, or operating limits..."
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
                  {submitting ? 'Creating...' : 'Create Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
