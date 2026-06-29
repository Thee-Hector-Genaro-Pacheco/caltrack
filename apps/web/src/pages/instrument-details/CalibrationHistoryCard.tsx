import { Fragment } from 'react';
import { Instrument, CalibrationRecord } from '@caltrack/types';
import { formatDate } from '@caltrack/utils';
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  User,
  FileText,
  Fingerprint,
  Check,
  X,
  Award,
} from 'lucide-react';

export interface CalibrationHistoryCardProps {
  instrument: Instrument & { calibrations: CalibrationRecord[] };
  expandedCalId: string | null;
  setExpandedCalId: (id: string | null) => void;
  onOpenSubmitReview: (cal: CalibrationRecord) => void;
  onOpenApproveReview: (cal: CalibrationRecord) => void;
  onOpenRejectReview: (cal: CalibrationRecord) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function CalibrationHistoryCard({
  instrument,
  expandedCalId,
  setExpandedCalId,
  onOpenSubmitReview,
  onOpenApproveReview,
  onOpenRejectReview,
  getStatusBadge,
}: CalibrationHistoryCardProps) {
  return (
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
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4">Validation Date</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4">
                  As Found ({instrument.signalType === '4-20 mA' ? 'mA' : instrument.engineeringUnits})
                </th>
                <th className="py-3 px-4">
                  As Left ({instrument.signalType === '4-20 mA' ? 'mA' : instrument.engineeringUnits})
                </th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 text-sm text-gray-300">
              {instrument.calibrations.map((cal) => {
                const isExpanded = expandedCalId === cal.id;
                const hasTestPoints = cal.testPoints && cal.testPoints.length > 0;

                return (
                  <Fragment key={cal.id}>
                    <tr
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setExpandedCalId(isExpanded ? null : cal.id)}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <button className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400">
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </td>
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
                      <td className="py-3.5 px-4 font-mono text-xs">
                        {hasTestPoints
                          ? 'Multi-point'
                          : cal.asFound !== null && cal.asFound !== undefined
                          ? cal.asFound
                          : '-'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        {hasTestPoints
                          ? 'Multi-point'
                          : cal.asLeft !== null && cal.asLeft !== undefined
                          ? cal.asLeft
                          : '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                            cal.passFail
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {cal.passFail ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(cal.status)}</td>
                      <td className="py-3.5 px-4 text-xs text-gray-400 max-w-xs truncate" title={cal.notes || ''}>
                        <span className="flex items-center gap-1">
                          <FileText size={14} className="text-gray-600 shrink-0" />
                          {cal.notes || '-'}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="bg-slate-950/40 p-4 border-b border-gray-800">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                                Calibration Check points (±{instrument.maxPermissibleError}% MPE)
                              </h4>
                            </div>
                            {hasTestPoints ? (
                              <div className="overflow-x-auto border border-gray-800 rounded-lg">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="bg-slate-900/80 border-b border-gray-800 text-gray-400 font-semibold uppercase tracking-wider font-sans">
                                      <th className="p-2.5">Target Input</th>
                                      <th className="p-2.5">Expected Output</th>
                                      <th className="p-2.5">As Found Output</th>
                                      <th className="p-2.5">As Found Error</th>
                                      <th className="p-2.5">As Left Output</th>
                                      <th className="p-2.5">As Left Error</th>
                                      <th className="p-2.5">Outcome</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-800/40 text-gray-300">
                                    {cal.testPoints!.map((pt) => {
                                      const isFoundErrorMpe =
                                        Math.abs(pt.asFoundError) > instrument.maxPermissibleError;
                                      const isLeftErrorMpe =
                                        Math.abs(pt.asLeftError) > instrument.maxPermissibleError;

                                      return (
                                        <tr key={pt.id} className="hover:bg-white/5 font-mono">
                                          <td className="p-2.5">
                                            {pt.targetInput.toFixed(2)} {instrument.engineeringUnits}
                                          </td>
                                          <td className="p-2.5">
                                            {pt.expectedOutput.toFixed(2)}{' '}
                                            {instrument.signalType === '4-20 mA'
                                              ? 'mA'
                                              : instrument.engineeringUnits}
                                          </td>
                                          <td className="p-2.5">
                                            {pt.asFoundOutput.toFixed(2)}{' '}
                                            {instrument.signalType === '4-20 mA'
                                              ? 'mA'
                                              : instrument.engineeringUnits}
                                          </td>
                                          <td className="p-2.5">
                                            <span
                                              className={
                                                isFoundErrorMpe ? 'text-red-400 font-semibold' : 'text-emerald-400'
                                              }
                                            >
                                              {pt.asFoundError.toFixed(3)}%
                                            </span>
                                          </td>
                                          <td className="p-2.5">
                                            {pt.asLeftOutput.toFixed(2)}{' '}
                                            {instrument.signalType === '4-20 mA'
                                              ? 'mA'
                                              : instrument.engineeringUnits}
                                          </td>
                                          <td className="p-2.5">
                                            <span
                                              className={
                                                isLeftErrorMpe ? 'text-red-400 font-semibold' : 'text-emerald-400'
                                              }
                                            >
                                              {pt.asLeftError.toFixed(3)}%
                                            </span>
                                          </td>
                                          <td className="p-2.5 font-sans">
                                            <span
                                              className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                pt.passFail
                                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                              }`}
                                            >
                                              {pt.passFail ? 'PASS' : 'FAIL'}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-gray-500 text-xs italic">
                                Legacy/single-point calibration record. As Found: {cal.asFound ?? '-'}, As Left:{' '}
                                {cal.asLeft ?? '-'}
                              </div>
                            )}

                            {/* Traceable Reference Standards Section */}
                            <div className="space-y-2 mt-4">
                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 font-sans">
                                <Award size={12} className="text-indigo-400" />
                                Traceable Reference Standards (Metrology)
                              </h5>
                              {cal.referenceStandards && cal.referenceStandards.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {cal.referenceStandards.map((ref) => {
                                    const std = ref.referenceStandard;
                                    if (!std) return null;
                                    return (
                                      <div
                                        key={ref.id}
                                        className="p-2.5 bg-[#090d16] border border-gray-800 rounded-lg flex items-center justify-between text-xs"
                                      >
                                        <div>
                                          <div className="font-semibold text-gray-300 flex items-center gap-1.5">
                                            <span className="font-mono text-[9px] text-indigo-400 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10">
                                              {std.assetTag}
                                            </span>
                                            {std.manufacturer} {std.model}
                                          </div>
                                          <div className="text-[10px] text-gray-500 mt-1">
                                            S/N: <span className="text-gray-400 font-mono">{std.serialNumber}</span>{' '}
                                            &bull; Cert:{' '}
                                            <span className="text-indigo-400/80 font-mono">
                                              {std.certificateNumber}
                                            </span>
                                          </div>
                                          {ref.usageNotes && (
                                            <div className="text-[10px] text-gray-400 mt-1 italic">
                                              Notes: {ref.usageNotes}
                                            </div>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <span
                                            className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                              std.status === 'ACTIVE'
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : std.status === 'DUE_SOON'
                                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                : std.status === 'EXPIRED'
                                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                            }`}
                                          >
                                            {std.status.replace('_', ' ')}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500 italic">
                                  No reference standards linked to this calibration record.
                                </div>
                              )}
                            </div>

                            {/* Electronic Signatures Section */}
                            <div className="space-y-2 mt-4">
                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                <Fingerprint size={12} className="text-indigo-400" />
                                Electronic Signatures & Review Trail
                              </h5>
                              {cal.signatures && cal.signatures.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {cal.signatures.map((sig) => (
                                    <div
                                      key={sig.id}
                                      className="p-2.5 bg-[#090d16] border border-gray-800 rounded-lg flex items-center justify-between text-xs"
                                    >
                                      <div>
                                        <div className="font-semibold text-gray-300">
                                          {sig.signerName}{' '}
                                          <span className="text-gray-500 font-medium">({sig.signerRole})</span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">
                                          Meaning:{' '}
                                          <span className="text-indigo-400 font-semibold">{sig.meaning}</span> &bull;{' '}
                                          {new Date(sig.signedAt).toLocaleString()}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <span className="block text-[8px] uppercase text-gray-600 font-bold">
                                          SHA-256 Checksum
                                        </span>
                                        <span
                                          className="font-mono text-[9px] text-indigo-400 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10"
                                          title={sig.signatureHash}
                                        >
                                          {sig.signatureHash.slice(0, 8)}...{sig.signatureHash.slice(-8)}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500 italic">
                                  No signatures recorded for this draft calibration.
                                </div>
                              )}
                            </div>

                            {/* Action Buttons for this Calibration Record */}
                            <div className="flex gap-2.5 pt-3 border-t border-gray-900/60 mt-4">
                              {(cal.status === 'DRAFT' || cal.status === 'REJECTED') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenSubmitReview(cal);
                                  }}
                                  className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
                                >
                                  <Fingerprint size={13} />
                                  Submit for Review
                                </button>
                              )}
                              {cal.status === 'PENDING_REVIEW' && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenApproveReview(cal);
                                    }}
                                    className="px-3 py-1.5 rounded bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 font-semibold text-xs transition-all flex items-center gap-1.5"
                                  >
                                    <Check size={13} />
                                    Sign & Approve
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenRejectReview(cal);
                                    }}
                                    className="px-3 py-1.5 rounded bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 font-semibold text-xs transition-all flex items-center gap-1.5"
                                  >
                                    <X size={13} />
                                    Reject Record
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CalibrationHistoryCard;
