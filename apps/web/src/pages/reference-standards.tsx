import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { ReferenceStandard, ReferenceStandardStatus } from '@caltrack/types';
import { Plus, Search, ShieldAlert, X, Award, AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import { formatDate } from '@caltrack/utils';

export default function ReferenceStandards() {
  const [standards, setStandards] = useState<ReferenceStandard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetTag, setAssetTag] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [accuracyClass, setAccuracyClass] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [lastCalibratedDate, setLastCalibratedDate] = useState('');
  const [calibrationDueDate, setCalibrationDueDate] = useState('');
  const [status, setStatus] = useState<ReferenceStandardStatus>('ACTIVE');
  const [submitting, setSubmitting] = useState(false);

  const [selectedStandard, setSelectedStandard] = useState<ReferenceStandard | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchStandards();
  }, []);

  const fetchStandards = () => {
    setLoading(true);
    api.getReferenceStandards()
      .then(res => {
        setStandards(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to fetch reference standards registry.');
        setLoading(false);
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createReferenceStandard({
        assetTag,
        equipmentType,
        manufacturer,
        model,
        serialNumber,
        accuracyClass,
        certificateNumber,
        lastCalibratedDate,
        calibrationDueDate,
        status,
      });

      // Clear form
      setAssetTag('');
      setEquipmentType('');
      setManufacturer('');
      setModel('');
      setSerialNumber('');
      setAccuracyClass('');
      setCertificateNumber('');
      setLastCalibratedDate('');
      setCalibrationDueDate('');
      setStatus('ACTIVE');
      setIsModalOpen(false);
      fetchStandards();
    } catch (err: any) {
      alert(err.message || 'Failed to register reference standard.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate local statistics for summary cards
  const totalCount = standards.length;
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const dueSoonCount = standards.filter(s => {
    const isDueSoonStatus = s.status === 'DUE_SOON';
    const isWithin30Days = s.status === 'ACTIVE' && 
      new Date(s.calibrationDueDate) >= now && 
      new Date(s.calibrationDueDate) <= thirtyDaysFromNow;
    return isDueSoonStatus || isWithin30Days;
  }).length;

  const expiredCount = standards.filter(s => {
    const isExpiredStatus = s.status === 'EXPIRED';
    const isPastDue = new Date(s.calibrationDueDate) < now && s.status !== 'OUT_OF_SERVICE';
    return isExpiredStatus || isPastDue;
  }).length;

  const outOfServiceCount = standards.filter(s => s.status === 'OUT_OF_SERVICE').length;

  const filtered = standards.filter(std => {
    const matchesSearch = 
      std.assetTag.toLowerCase().includes(search.toLowerCase()) ||
      std.equipmentType.toLowerCase().includes(search.toLowerCase()) ||
      std.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
      std.model.toLowerCase().includes(search.toLowerCase()) ||
      std.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      std.certificateNumber.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || std.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (statusVal: ReferenceStandardStatus, dueDateStr: Date | string) => {
    const isPastDue = new Date(dueDateStr) < new Date() && statusVal !== 'OUT_OF_SERVICE';
    if (statusVal === 'EXPIRED' || isPastDue) {
      return 'bg-red-500/10 text-red-400 border border-red-500/20';
    }
    if (statusVal === 'DUE_SOON') {
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
    if (statusVal === 'OUT_OF_SERVICE') {
      return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
    return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  };

  const getStatusDot = (statusVal: ReferenceStandardStatus, dueDateStr: Date | string) => {
    const isPastDue = new Date(dueDateStr) < new Date() && statusVal !== 'OUT_OF_SERVICE';
    if (statusVal === 'EXPIRED' || isPastDue) return 'bg-red-500';
    if (statusVal === 'DUE_SOON') return 'bg-amber-500';
    if (statusVal === 'OUT_OF_SERVICE') return 'bg-gray-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Reference Standards & Metrology</h1>
          <p className="text-gray-400 mt-1">Certified test equipment and standards traceable to national metrology institutes.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-transition bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-indigo-600/10"
        >
          <Plus size={16} />
          Register Standard
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl border border-white/5 flex items-center gap-4">
          <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <Award size={22} />
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Standards</span>
            <span className="text-2xl font-bold text-white mt-0.5 block">{totalCount}</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-white/5 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
            <AlertTriangle size={22} />
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Soon (30d)</span>
            <span className="text-2xl font-bold text-amber-400 mt-0.5 block">{dueSoonCount}</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-white/5 flex items-center gap-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            <ShieldAlert size={22} />
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Expired Standards</span>
            <span className="text-2xl font-bold text-red-400 mt-0.5 block">{expiredCount}</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-white/5 flex items-center gap-4">
          <div className="p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg text-gray-400">
            <X size={22} />
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Out of Service</span>
            <span className="text-2xl font-bold text-gray-400 mt-0.5 block">{outOfServiceCount}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass-card p-4 rounded-xl border border-white/5">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Search standards by tag, type, serial, cert..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-gray-800 w-full md:w-auto overflow-x-auto">
          {['ALL', 'ACTIVE', 'DUE_SOON', 'EXPIRED', 'OUT_OF_SERVICE'].map((statusOption) => (
            <button
              key={statusOption}
              onClick={() => setStatusFilter(statusOption)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase whitespace-nowrap btn-transition ${
                statusFilter === statusOption
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {statusOption.replace('_', ' ')}
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
          <ShieldAlert className="mx-auto mb-3 text-red-500" size={36} />
          <p className="font-medium">{error}</p>
          <button
            onClick={fetchStandards}
            className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-400 hover:underline"
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-gray-800 rounded-xl glass-card">
          <p className="text-gray-500 mb-2">No reference standards match the selected criteria.</p>
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
                  <th className="py-3 px-6">Asset Tag</th>
                  <th className="py-3 px-6">Equipment Type</th>
                  <th className="py-3 px-6">Manufacturer / Model</th>
                  <th className="py-3 px-6">Serial Number</th>
                  <th className="py-3 px-6">Accuracy Class</th>
                  <th className="py-3 px-6">Certificate Number</th>
                  <th className="py-3 px-6">Calibration Due</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-sm text-gray-300">
                {filtered.map((std) => (
                  <tr key={std.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-6 font-semibold text-indigo-400 font-mono text-sm">
                      {std.assetTag}
                    </td>
                    <td className="py-4 px-6">{std.equipmentType}</td>
                    <td className="py-4 px-6">{std.manufacturer} / {std.model}</td>
                    <td className="py-4 px-6 font-mono text-xs text-gray-400">{std.serialNumber}</td>
                    <td className="py-4 px-6 text-xs">{std.accuracyClass}</td>
                    <td className="py-4 px-6 font-mono text-xs text-indigo-300/80">{std.certificateNumber}</td>
                    <td className={`py-4 px-6 font-mono text-xs ${
                      new Date(std.calibrationDueDate) < new Date() && std.status !== 'OUT_OF_SERVICE' ? 'text-red-400 font-semibold' : ''
                    }`}>
                      {formatDate(std.calibrationDueDate)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusStyle(std.status, std.calibrationDueDate)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(std.status, std.calibrationDueDate)}`}></span>
                        {std.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-xs">
                      <button
                        onClick={() => {
                          setSelectedStandard(std);
                          setIsDetailModalOpen(true);
                        }}
                        className="btn-transition text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 ml-auto"
                      >
                        <Eye size={14} />
                        View Traceability
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg glass-panel p-6 rounded-2xl glow-primary relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-1 font-sans">Register Reference Standard</h3>
            <p className="text-gray-400 text-xs mb-6">Enroll certified metrology reference equipment to enable traceability mapping.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Asset Tag *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. REF-FL754"
                    className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                    value={assetTag}
                    onChange={(e) => setAssetTag(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Equipment Type *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Documenting Calibrator"
                    className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    value={equipmentType}
                    onChange={(e) => setEquipmentType(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Manufacturer *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fluke"
                    className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Model Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 754"
                    className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FL754-893012"
                    className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Accuracy Class *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ±0.01% span"
                    className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    value={accuracyClass}
                    onChange={(e) => setAccuracyClass(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Calibration Certificate Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CERT-2026-9988"
                  className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Last Calibrated Date *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                    value={lastCalibratedDate}
                    onChange={(e) => setLastCalibratedDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Calibration Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                    value={calibrationDueDate}
                    onChange={(e) => setCalibrationDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Metrology Status *
                </label>
                <select
                  required
                  className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-sans"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ReferenceStandardStatus)}
                >
                  <option value="ACTIVE">Active (In Calibration)</option>
                  <option value="DUE_SOON">Due Soon</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                </select>
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
                  {submitting ? 'Registering...' : 'Register Standard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Traceability Modal */}
      {isDetailModalOpen && selectedStandard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl glow-primary relative">
            <button
              onClick={() => {
                setSelectedStandard(null);
                setIsDetailModalOpen(false);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                <Award size={20} />
              </span>
              <h3 className="text-xl font-bold text-white font-sans">Metrology Traceability</h3>
            </div>
            <p className="text-gray-400 text-xs mb-6">Certified instrument reference verification parameters details.</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 border-b border-gray-800/60 pb-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 block font-semibold">Asset Tag</span>
                  <span className="text-sm font-semibold text-white font-mono">{selectedStandard.assetTag}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 block font-semibold">Equipment Type</span>
                  <span className="text-sm text-gray-200">{selectedStandard.equipmentType}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-gray-800/60 pb-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 block font-semibold">Manufacturer</span>
                  <span className="text-sm text-gray-200">{selectedStandard.manufacturer}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 block font-semibold">Model</span>
                  <span className="text-sm text-gray-200 font-mono">{selectedStandard.model}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-gray-800/60 pb-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 block font-semibold">Serial Number</span>
                  <span className="text-sm font-mono text-gray-300">{selectedStandard.serialNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 block font-semibold">Accuracy Class</span>
                  <span className="text-sm text-gray-300">{selectedStandard.accuracyClass}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-gray-800/60 pb-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 block font-semibold">Certificate Number</span>
                  <span className="text-sm font-mono text-indigo-300">{selectedStandard.certificateNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 block font-semibold">Status Badge</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${getStatusStyle(selectedStandard.status, selectedStandard.calibrationDueDate)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(selectedStandard.status, selectedStandard.calibrationDueDate)}`}></span>
                    {selectedStandard.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-1">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 block font-semibold">Last Calibrated</span>
                  <span className="text-xs font-mono text-gray-400">{formatDate(selectedStandard.lastCalibratedDate)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 block font-semibold">Calibration Due</span>
                  <span className="text-xs font-mono text-gray-400">{formatDate(selectedStandard.calibrationDueDate)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-800 text-sm mt-6">
              <button
                type="button"
                onClick={() => {
                  setSelectedStandard(null);
                  setIsDetailModalOpen(false);
                }}
                className="btn-transition bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-6 rounded-lg"
              >
                Close Traceability
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
