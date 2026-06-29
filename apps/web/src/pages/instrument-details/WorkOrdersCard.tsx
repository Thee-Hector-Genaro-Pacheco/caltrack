import { Instrument } from '@caltrack/types';
import { formatDate } from '@caltrack/utils';
import { ClipboardList, Plus, User } from 'lucide-react';

export interface WorkOrdersCardProps {
  instrument: Instrument;
  onScheduleClick: () => void;
}

export function WorkOrdersCard({ instrument, onScheduleClick }: WorkOrdersCardProps) {
  return (
    <div className="glass-card p-6 rounded-xl border border-white/5">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ClipboardList className="text-indigo-400" size={20} />
          Linked Calibration Work Orders
        </h3>
        {!instrument.workOrders?.some((w) => w.status === 'OPEN' || w.status === 'IN_PROGRESS') && (
          <button
            onClick={onScheduleClick}
            className="btn-transition bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5"
          >
            <Plus size={14} />
            Schedule Work Order
          </button>
        )}
      </div>

      {!instrument.workOrders || instrument.workOrders.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-800 rounded-lg">
          No work orders currently linked to this instrument. Click Schedule Work Order to create one.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-slate-900/30">
                <th className="py-2.5 px-4">WO Number</th>
                <th className="py-2.5 px-4">Priority</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Assigned Tech</th>
                <th className="py-2.5 px-4">Scheduled Date</th>
                <th className="py-2.5 px-4">Completed Date</th>
                <th className="py-2.5 px-4 w-1/3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 text-sm text-gray-300">
              {instrument.workOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-white">{wo.workOrderNumber}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        wo.priority === 'CRITICAL'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : wo.priority === 'HIGH'
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                          : wo.priority === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}
                    >
                      {wo.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        wo.status === 'OPEN'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : wo.status === 'IN_PROGRESS'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : wo.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {wo.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    {wo.assignedTechnician ? (
                      <span className="flex items-center gap-1">
                        <User size={13} className="text-gray-500" />
                        {wo.assignedTechnician}
                      </span>
                    ) : (
                      <span className="text-gray-500 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-400">
                    {wo.scheduledDate ? formatDate(wo.scheduledDate) : '-'}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-400">
                    {wo.completedDate ? formatDate(wo.completedDate) : '-'}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-400 truncate max-w-xs" title={wo.description || ''}>
                    {wo.description || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default WorkOrdersCard;
