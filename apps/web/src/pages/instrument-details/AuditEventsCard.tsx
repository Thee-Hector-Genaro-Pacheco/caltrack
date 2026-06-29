import React, { useState } from 'react';
import { AuditEvent } from '@caltrack/types';
import { ClipboardList, Eye, EyeOff } from 'lucide-react';
import { formatDate } from '@caltrack/utils';
import Card from '../../components/ui/Card';

export interface AuditEventsCardProps {
  audits: AuditEvent[];
  loading?: boolean;
}

export function AuditEventsCard({ audits, loading }: AuditEventsCardProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ClipboardList className="text-indigo-400" size={20} />
          Compliance Audit Timeline
        </h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      ) : audits.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-800 rounded-lg">
          No audit log history entries recorded for this instrument.
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-850 rounded-xl bg-slate-950/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-slate-900/30">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Entity</th>
                  <th className="py-2.5 px-4">Operator</th>
                  <th className="py-2.5 px-4">Justification</th>
                  <th className="py-2.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-gray-300">
                {audits.map((event) => (
                  <React.Fragment key={event.id}>
                    <tr className="hover:bg-white/5 transition-colors font-sans">
                      <td className="py-3 px-4 font-mono text-[10px]">{formatDate(event.timestamp)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            event.action === 'CREATE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : event.action === 'UPDATE'
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {event.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-white text-[11px]">{event.entityType}</td>
                      <td className="py-3 px-4 text-[10px] text-indigo-300 font-mono">{event.changedBy}</td>
                      <td className="py-3 px-4 text-[11px] text-gray-400 max-w-[150px] truncate" title={event.reason || ''}>
                        {event.reason || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => toggleExpand(event.id)}
                          className="text-[10px] text-gray-400 hover:text-white inline-flex items-center gap-1 font-sans"
                        >
                          {expandedRow === event.id ? (
                            <>
                              <EyeOff size={12} /> Hide
                            </>
                          ) : (
                            <>
                              <Eye size={12} /> Inspect
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedRow === event.id && (
                      <tr className="bg-slate-950/40">
                        <td colSpan={6} className="py-3 px-6 border-b border-gray-800">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
                            {event.oldValue && (
                              <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5">
                                <span className="block font-bold text-red-400 uppercase tracking-wider text-[8px] mb-1.5">
                                  Original Value
                                </span>
                                <pre className="font-mono text-gray-400 overflow-x-auto max-h-32 text-[9px]">
                                  {JSON.stringify(event.oldValue, null, 2)}
                                </pre>
                              </div>
                            )}
                            {event.newValue && (
                              <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5">
                                <span className="block font-bold text-emerald-400 uppercase tracking-wider text-[8px] mb-1.5">
                                  Updated Value
                                </span>
                                <pre className="font-mono text-gray-300 overflow-x-auto max-h-32 text-[9px]">
                                  {JSON.stringify(event.newValue, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}

export default AuditEventsCard;
