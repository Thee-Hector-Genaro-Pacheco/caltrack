import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { WorkOrder, WorkOrderStatus, WorkOrderPriority, Instrument } from '@caltrack/types';
import { Plus, Search, AlertCircle, RefreshCw, ClipboardList, Play, Check, X, Calendar, User, Eye, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '@caltrack/utils';

export default function WorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Search states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Create Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    instrumentId: '',
    status: 'OPEN' as WorkOrderStatus,
    priority: 'MEDIUM' as WorkOrderPriority,
    assignedTechnician: '',
    scheduledDate: '',
    description: '',
  });

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [wos, insts] = await Promise.all([
        api.getWorkOrders(),
        api.getInstruments()
      ]);
      setWorkOrders(wos);
      setInstruments(insts);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load work orders registry.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanAndGenerate = async () => {
    setLoading(true);
    try {
      const res = await api.generateWorkOrders();
      if (res.generatedCount > 0) {
        showToast('success', `Successfully scanned and auto-generated ${res.generatedCount} work order(s).`);
      } else {
        showToast('info', 'Registry check complete. All overdue/due instruments already have active work orders.');
      }
      await fetchData();
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Auto-scan failed.');
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: WorkOrderStatus) => {
    try {
      await api.updateWorkOrder(id, {
        status: newStatus,
        reason: `Work order status changed to ${newStatus} via dashboard interface.`
      });
      showToast('success', `Work order status updated to ${newStatus}.`);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Failed to update work order.');
    }
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type: type === 'error' ? 'error' : 'success', message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.instrumentId) {
      showToast('error', 'You must select a target instrument.');
      return;
    }

    setModalSubmitting(true);
    try {
      await api.createWorkOrder({
        instrumentId: formData.instrumentId,
        status: formData.status,
        priority: formData.priority,
        assignedTechnician: formData.assignedTechnician || undefined,
        scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : undefined,
        description: formData.description || undefined,
      });

      showToast('success', 'Work order generated successfully.');
      setIsModalOpen(false);
      setFormData({
        instrumentId: '',
        status: 'OPEN',
        priority: 'MEDIUM',
        assignedTechnician: '',
        scheduledDate: '',
        description: '',
      });
      await fetchData();
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Failed to create work order.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const filtered = workOrders.filter(wo => {
    const instTag = wo.instrument?.tagNumber || '';
    const instType = wo.instrument?.instrumentType || '';
    const woNum = wo.workOrderNumber || '';
    const techName = wo.assignedTechnician || '';

    const matchesSearch = 
      instTag.toLowerCase().includes(search.toLowerCase()) ||
      instType.toLowerCase().includes(search.toLowerCase()) ||
      woNum.toLowerCase().includes(search.toLowerCase()) ||
      techName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || wo.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || wo.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityBadgeClass = (prio: WorkOrderPriority) => {
    switch (prio) {
      case 'CRITICAL':
        return 'bg-red-500/15 text-red-400 border border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'LOW':
        return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
    }
  };

  const getStatusBadgeClass = (status: WorkOrderStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30';
      case 'IN_PROGRESS':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'COMPLETED':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'CANCELLED':
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 max-w-md ${
          notification.type === 'error' 
            ? 'bg-red-950/80 border-red-500/30 text-red-200' 
            : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
        }`}>
          <Info size={20} className={notification.type === 'error' ? 'text-red-400' : 'text-emerald-400'} />
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Calibration Work Orders</h1>
          <p className="text-gray-400 mt-1">Manage preventive calibration schedules and active field work orders.</p>
        </div>
        <div className="flex gap-3 self-start sm:self-auto">
          <button
            onClick={handleScanAndGenerate}
            disabled={loading}
            className="btn-transition bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 border border-indigo-500/35 font-semibold py-2.5 px-4 rounded-lg text-sm flex items-center gap-2 shadow-sm disabled:opacity-50"
            title="Scan the instrument registry and auto-generate OPEN work orders for overdue or due soon devices."
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Scan & Generate
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-transition bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/10"
          >
            <Plus size={18} />
            New Work Order
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between glass-card p-4 rounded-xl border border-white/5">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Search by WO#, instrument tag, or tech..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-lg border border-gray-800">
            <span className="text-[10px] uppercase font-bold text-gray-500 px-2">Status:</span>
            {['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase whitespace-nowrap btn-transition ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-lg border border-gray-800">
            <span className="text-[10px] uppercase font-bold text-gray-500 px-2">Priority:</span>
            {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((prio) => (
              <button
                key={prio}
                onClick={() => setPriorityFilter(prio)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase whitespace-nowrap btn-transition ${
                  priorityFilter === prio
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {prio}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid or Table Listing */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-400 border border-red-500/20 rounded-xl glass-panel">
          <AlertCircle className="mx-auto mb-3 text-red-500" size={36} />
          <p className="font-medium">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-400 hover:underline"
          >
            <RefreshCw size={16} /> Retry loading
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-gray-800 rounded-xl glass-card">
          <ClipboardList className="mx-auto mb-3 text-gray-600" size={40} />
          <p className="text-gray-500 mb-2">No work orders match the selected criteria.</p>
          <button
            onClick={() => { setSearch(''); setStatusFilter('ALL'); setPriorityFilter('ALL'); }}
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
                  <th className="py-3 px-6">WO Number</th>
                  <th className="py-3 px-6">Instrument Link</th>
                  <th className="py-3 px-6">Priority</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Technician</th>
                  <th className="py-3 px-6">Scheduled Date</th>
                  <th className="py-3 px-6">Completed Date</th>
                  <th className="py-3 px-6">Description</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-sm text-gray-300">
                {filtered.map((wo) => (
                  <tr key={wo.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-6 font-mono font-bold text-white">
                      {wo.workOrderNumber}
                    </td>
                    <td className="py-4 px-6 font-semibold text-indigo-400 hover:underline">
                      {wo.instrument ? (
                        <Link to={`/instruments/${wo.instrumentId}`}>
                          {wo.instrument.tagNumber}
                        </Link>
                      ) : (
                        <span className="text-gray-500 font-mono">Unlinked ({wo.instrumentId.slice(0, 6)})</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityBadgeClass(wo.priority)}`}>
                        {wo.priority}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusBadgeClass(wo.status)}`}>
                        {wo.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      {wo.assignedTechnician ? (
                        <div className="flex items-center gap-1.5">
                          <User size={13} className="text-gray-500" />
                          <span>{wo.assignedTechnician}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-gray-400">
                      {wo.scheduledDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar size={13} className="text-gray-500" />
                          <span>{formatDate(wo.scheduledDate)}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-gray-400">
                      {wo.completedDate ? formatDate(wo.completedDate) : '-'}
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-400 max-w-xs truncate" title={wo.description || ''}>
                      {wo.description || '-'}
                    </td>
                    <td className="py-4 px-6 text-right text-xs">
                      <div className="flex justify-end gap-2.5">
                        {wo.instrument && (
                          <Link
                            to={`/instruments/${wo.instrumentId}`}
                            className="text-gray-400 hover:text-white p-1 hover:bg-white/5 rounded transition-colors"
                            title="View linked instrument"
                          >
                            <Eye size={14} />
                          </Link>
                        )}
                        {wo.status === 'OPEN' && (
                          <button
                            onClick={() => handleUpdateStatus(wo.id, 'IN_PROGRESS')}
                            className="text-amber-400 hover:text-amber-300 p-1 hover:bg-amber-400/5 border border-amber-500/10 hover:border-amber-500/25 rounded transition-all flex items-center gap-1 px-1.5"
                            title="Start calibration work"
                          >
                            <Play size={13} />
                            <span className="font-bold text-[10px]">START</span>
                          </button>
                        )}
                        {wo.status === 'IN_PROGRESS' && (
                          <Link
                            to={`/instruments/${wo.instrumentId}?logCal=true`}
                            className="text-emerald-400 hover:text-emerald-300 p-1 hover:bg-emerald-400/5 border border-emerald-500/10 hover:border-emerald-500/25 rounded transition-all flex items-center gap-1 px-1.5"
                            title="Complete calibration worksheets"
                          >
                            <Check size={13} />
                            <span className="font-bold text-[10px]">COMPLETE</span>
                          </Link>
                        )}
                        {(wo.status === 'OPEN' || wo.status === 'IN_PROGRESS') && (
                          <button
                            onClick={() => handleUpdateStatus(wo.id, 'CANCELLED')}
                            className="text-red-400 hover:text-red-300 p-1 hover:bg-red-400/5 border border-red-500/10 hover:border-red-500/25 rounded transition-all"
                            title="Cancel work order"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Work Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg glass-panel p-6 rounded-2xl glow-primary border border-white/5 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-1">Create Maintenance Work Order</h3>
            <p className="text-gray-400 text-xs mb-6">Create a new preventive maintenance or calibration workflow check.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Select Instrument *
                </label>
                <select
                  name="instrumentId"
                  required
                  className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500"
                  value={formData.instrumentId}
                  onChange={handleFormChange}
                >
                  <option value="">-- Choose Instrument --</option>
                  {instruments
                    .filter(inst => inst.status !== 'INACTIVE')
                    .map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.tagNumber} - {inst.instrumentType} ({inst.location}) [{inst.status}]
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none"
                    value={formData.priority}
                    onChange={handleFormChange}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Initial Status
                  </label>
                  <select
                    name="status"
                    className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none"
                    value={formData.status}
                    onChange={handleFormChange}
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Assigned Technician
                  </label>
                  <input
                    type="text"
                    name="assignedTechnician"
                    placeholder="e.g. Marcus Vance"
                    className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none"
                    value={formData.assignedTechnician}
                    onChange={handleFormChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    name="scheduledDate"
                    className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none font-mono text-sm"
                    value={formData.scheduledDate}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Task Description / Instruction
                </label>
                <textarea
                  name="description"
                  placeholder="State work orders details, calibration intervals, or specific symptoms..."
                  className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none h-24 resize-none"
                  value={formData.description}
                  onChange={handleFormChange}
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
                  disabled={modalSubmitting}
                  className="btn-transition bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md"
                >
                  {modalSubmitting ? 'Creating...' : 'Generate Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
