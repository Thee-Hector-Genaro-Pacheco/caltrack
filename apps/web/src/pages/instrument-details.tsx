import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { Instrument, CalibrationRecord } from '@caltrack/types';
import { ArrowLeft, Calendar, User, FileText, Plus, ShieldAlert, Trash2, Edit3, X } from 'lucide-react';
import { formatDate } from '@caltrack/utils';

export default function InstrumentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [instrument, setInstrument] = useState<(Instrument & { calibrations: CalibrationRecord[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCalModalOpen, setIsCalModalOpen] = useState(false);
  const [calDate, setCalDate] = useState(new Date().toISOString().split('T')[0]);
  const [technician, setTechnician] = useState('');
  const [asFound, setAsFound] = useState('');
  const [asLeft, setAsLeft] = useState('');
  const [passFail, setPassFail] = useState(true);
  const [notes, setNotes] = useState('');
  const [calSubmitting, setCalSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id]);

  const fetchDetails = () => {
    setLoading(true);
    api.getInstrument(id!)
      .then(res => {
        setInstrument(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Instrument not found or API unreachable.');
        setLoading(false);
      });
  };

  const handleAddCalibration = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalSubmitting(true);
    try {
      await api.addCalibrationRecord({
        instrumentId: id!,
        calibrationDate: calDate,
        technicianName: technician,
        asFound: parseFloat(asFound) || 0,
        asLeft: parseFloat(asLeft) || 0,
        passFail,
        notes,
      });
      setIsCalModalOpen(false);
      setTechnician('');
      setAsFound('');
      setAsLeft('');
      setPassFail(true);
      setNotes('');
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to save calibration record.');
    } finally {
      setCalSubmitting(false);
    }
  };

  const handleDeleteInstrument = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteSubmitting(true);
    try {
      await api.deleteInstrument(id!, deleteReason);
      setIsDeleteModalOpen(false);
      navigate('/instruments');
    } catch (err: any) {
      alert(err.message || 'Failed to decommission instrument.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !instrument) {
    return (
      <div className="p-6 glass-panel rounded-xl text-center max-w-xl mx-auto mt-10 border border-red-500/20">
        <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Registry Error</h2>
        <p className="text-gray-400">{error || 'Device not found.'}</p>
        <Link to="/instruments" className="mt-6 inline-block text-indigo-400 hover:underline">Back to index</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/instruments" className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{instrument.tagNumber}</h1>
            <p className="text-gray-400 mt-1">{instrument.instrumentType}</p>
          </div>
        </div>

        <div className="flex gap-3 self-start sm:self-auto">
          <Link
            to={`/instruments/${instrument.id}/edit`}
            className="btn-transition bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 font-medium py-2 px-4 rounded-lg text-sm flex items-center gap-2"
          >
            <Edit3 size={16} />
            Edit Device
          </Link>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="btn-transition bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium py-2 px-4 rounded-lg text-sm flex items-center gap-2"
          >
            <Trash2 size={16} />
            Decommission
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-6 rounded-xl border border-white/5 space-y-6">
          <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-2">Device Specifications</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
            <div>
              <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Manufacturer</span>
              <span className="text-white font-medium mt-0.5 block">{instrument.manufacturer}</span>
            </div>
            <div>
              <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Model Reference</span>
              <span className="text-white font-medium mt-0.5 block">{instrument.model}</span>
            </div>
            <div>
              <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Calibration Span Range</span>
              <span className="text-white font-medium mt-0.5 block font-mono">
                {instrument.rangeMin} - {instrument.rangeMax} {instrument.engineeringUnits}
              </span>
            </div>
            <div>
              <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Transmitter Signal output</span>
              <span className="text-white font-medium mt-0.5 block">{instrument.signalType}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Physical Location</span>
              <span className="text-white font-medium mt-0.5 block">{instrument.location}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl border border-white/5 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Compliance Status</h3>
            
            <div className="flex items-center gap-3 mt-2">
              <span className={`w-3.5 h-3.5 rounded-full ${
                instrument.status === 'ACTIVE' ? 'bg-emerald-500 glow-success' :
                instrument.status === 'CALIBRATION_DUE' ? 'bg-amber-500 glow-warning' :
                instrument.status === 'OVERDUE' ? 'bg-red-500' :
                'bg-gray-500'
              }`}></span>
              <span className="text-2xl font-extrabold text-white tracking-tight">
                {instrument.status.replace('_', ' ')}
              </span>
            </div>

            <p className="text-xs text-gray-400 mt-4 leading-relaxed">
              {instrument.status === 'ACTIVE' && 'This instrument is within active calibration windows. Maintenance complete.'}
              {instrument.status === 'CALIBRATION_DUE' && 'Annual calibration deadline is imminent. Prepare test equipment.'}
              {instrument.status === 'OVERDUE' && 'CALIBRATION DRIFT RISK! This device is operating outside allowed calibration windows.'}
              {instrument.status === 'INACTIVE' && 'Device temporarily offline/bypassed. Validation unscheduled.'}
            </p>
          </div>

          <button
            onClick={() => setIsCalModalOpen(true)}
            className="w-full btn-transition bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2 mt-6 shadow-lg shadow-indigo-600/10"
          >
            <Plus size={16} />
            Log Calibration Record
          </button>
        </div>
      </div>

      <div className="glass-card p-6 rounded-xl border border-white/5">
        <h3 className="text-lg font-bold text-white mb-6">Calibration History Log</h3>

        {instrument.calibrations.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm border border-dashed border-gray-800 rounded-lg">
            No calibration history records found. Perform validation to update operational metrics.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-slate-900/30">
                  <th className="py-3 px-4">Validation Date</th>
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">As Found ({instrument.engineeringUnits})</th>
                  <th className="py-3 px-4">As Left ({instrument.engineeringUnits})</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-sm text-gray-300">
                {instrument.calibrations.map((cal) => (
                  <tr key={cal.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-500" />
                        {formatDate(cal.calibrationDate)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 text-xs">
                        <User size={14} className="text-gray-500" />
                        {cal.technicianName}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">{cal.asFound}</td>
                    <td className="py-3.5 px-4 font-mono text-xs">{cal.asLeft}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                        cal.passFail
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {cal.passFail ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-400 max-w-xs truncate" title={cal.notes || ''}>
                      <span className="flex items-center gap-1">
                        <FileText size={14} className="text-gray-600 shrink-0" />
                        {cal.notes || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg glass-panel p-6 rounded-2xl glow-primary relative">
            <button
              onClick={() => setIsCalModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-1">New Calibration Record</h3>
            <p className="text-gray-400 text-xs mb-6">Log field validation findings. Device state will update accordingly.</p>

            <form onSubmit={handleAddCalibration} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Calibration Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    value={calDate}
                    onChange={(e) => setCalDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Technician Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. John Doe"
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    As Found Value ({instrument.engineeringUnits})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="0.0"
                    value={asFound}
                    onChange={(e) => setAsFound(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    As Left Value ({instrument.engineeringUnits})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="0.0"
                    value={asLeft}
                    onChange={(e) => setAsLeft(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Calibration Outcome
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setPassFail(true)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border btn-transition ${
                      passFail
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 glow-success'
                        : 'bg-transparent text-gray-500 border-gray-800'
                    }`}
                  >
                    Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => setPassFail(false)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border btn-transition ${
                      !passFail
                        ? 'bg-red-500/10 text-red-400 border-red-500/40'
                        : 'bg-transparent text-gray-500 border-gray-800'
                    }`}
                  >
                    Fail
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Technician Notes / Remarks
                </label>
                <textarea
                  className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 h-20 resize-none"
                  placeholder="Describe calibration offsets, zero-scale modifications, test instruments used, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 text-sm">
                <button
                  type="button"
                  onClick={() => setIsCalModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={calSubmitting}
                  className="btn-transition bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md"
                >
                  {calSubmitting ? 'Logging...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-red-500/20 relative">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-1">Decommission Instrument</h3>
            <p className="text-gray-400 text-xs mb-6">Decommissioning will remove this device from active tracking. This is an audited action.</p>

            <form onSubmit={handleDeleteInstrument} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Reason for Decommissioning *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Obsolete unit replaced, Facility expansion rebuild"
                  className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-red-500"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 text-sm">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteSubmitting}
                  className="btn-transition bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg"
                >
                  {deleteSubmitting ? 'Processing...' : 'Confirm Decommission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
