import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { AuditEvent } from '@caltrack/types';
import { ShieldAlert, RefreshCw, Eye, EyeOff, Search } from 'lucide-react';
import { formatDate } from '@caltrack/utils';

export default function AuditTrail() {
  const [audits, setAudits] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = () => {
    setLoading(true);
    api.getAuditTrail()
      .then(res => {
        setAudits(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to retrieve audit timeline.');
        setLoading(false);
      });
  };

  const toggleExpand = (id: string) => {
    setExpandedRow(prev => (prev === id ? null : id));
  };

  const filtered = audits.filter(a => {
    return (
      a.entityType.toLowerCase().includes(search.toLowerCase()) ||
      a.changedBy.toLowerCase().includes(search.toLowerCase()) ||
      (a.reason && a.reason.toLowerCase().includes(search.toLowerCase())) ||
      a.entityId.includes(search)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Compliance Audit Trail</h1>
        <p className="text-gray-400 mt-1">Immutable historic logs of facility configuration shifts and validations.</p>
      </div>

      <div className="flex gap-4 items-center justify-between glass-card p-4 rounded-xl border border-white/5">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            placeholder="Search audits by technician, entity type, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={fetchAudits}
          className="btn-transition p-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg border border-white/5"
          title="Refresh Logs"
        >
          <RefreshCw size={18} />
        </button>
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
            onClick={fetchAudits}
            className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-400 hover:underline"
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-gray-800 rounded-xl glass-card text-gray-500">
          No audit history matches the criteria.
        </div>
      ) : (
        <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-slate-900/30">
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Action</th>
                  <th className="py-3 px-6">Entity</th>
                  <th className="py-3 px-6">Entity Reference</th>
                  <th className="py-3 px-6">Logged By</th>
                  <th className="py-3 px-6">Justification</th>
                  <th className="py-3 px-6 text-right">Payload Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-sm text-gray-300">
                {filtered.map((event) => (
                  <React.Fragment key={event.id}>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs">{formatDate(event.timestamp)}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                          event.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          event.action === 'UPDATE' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {event.action}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-white">{event.entityType}</td>
                      <td className="py-4 px-6 font-mono text-xs text-gray-400">{event.entityId}</td>
                      <td className="py-4 px-6 text-xs text-indigo-300 font-mono">{event.changedBy}</td>
                      <td className="py-4 px-6 text-xs text-gray-400 max-w-[200px] truncate" title={event.reason || ''}>
                        {event.reason || '-'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => toggleExpand(event.id)}
                          className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1.5"
                        >
                          {expandedRow === event.id ? (
                            <>
                              <EyeOff size={14} /> Hide diff
                            </>
                          ) : (
                            <>
                              <Eye size={14} /> Inspect data
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedRow === event.id && (
                      <tr className="bg-slate-950/40">
                        <td colSpan={7} className="py-4 px-8 border-b border-gray-800">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            {event.oldValue && (
                              <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                                <span className="block font-bold text-red-400 uppercase tracking-wider text-[10px] mb-2">
                                  Original / Deleted Value
                                </span>
                                <pre className="font-mono text-gray-400 overflow-x-auto">
                                  {JSON.stringify(event.oldValue, null, 2)}
                                </pre>
                              </div>
                            )}
                            {event.newValue && (
                              <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                                <span className="block font-bold text-emerald-400 uppercase tracking-wider text-[10px] mb-2">
                                  Updated / Target Value
                                </span>
                                <pre className="font-mono text-gray-300 overflow-x-auto">
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
    </div>
  );
}
