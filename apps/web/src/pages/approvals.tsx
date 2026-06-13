import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { CalibrationRecord, SignerRole } from '@caltrack/types';
import { Search, AlertCircle, RefreshCw, Check, X, Eye, Info, Calendar, User, CheckCircle2, XCircle, FileText, Fingerprint } from 'lucide-react';
import { formatDate } from '@caltrack/utils';
import { Link } from 'react-router-dom';

export default function Approvals() {
  const [activeTab, setActiveTab] = useState<'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'>('PENDING_REVIEW');
  const [calibrations, setCalibrations] = useState<CalibrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  
  // Modal states
  const [selectedCal, setSelectedCal] = useState<CalibrationRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [approveForm, setApproveForm] = useState({ signerName: '', signerRole: 'SUPERVISOR' as SignerRole });
  const [signingSubmitting, setSigningSubmitting] = useState(false);
  
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectForm, setRejectForm] = useState({ signerName: '', signerRole: 'QA' as SignerRole, reason: '' });
  
  // Notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    fetchCalibrations();
  }, [activeTab]);

  const fetchCalibrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCalibrations(activeTab);
      // Sort by calibration date desc
      setCalibrations(data.sort((a, b) => new Date(b.calibrationDate).getTime() - new Date(a.calibrationDate).getTime()));
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch approvals queue.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const handleOpenDetails = async (cal: CalibrationRecord) => {
    try {
      const details = await api.getCalibration(cal.id);
      setSelectedCal(details);
      setIsDetailsOpen(true);
    } catch (err: any) {
      console.error(err);
      showToast('error', 'Failed to retrieve calibration record details.');
    }
  };

  const handleOpenApprove = (cal: CalibrationRecord) => {
    setSelectedCal(cal);
    setApproveForm({ signerName: '', signerRole: 'SUPERVISOR' });
    setIsApproveOpen(true);
  };

  const handleOpenReject = (cal: CalibrationRecord) => {
    setSelectedCal(cal);
    setRejectForm({ signerName: '', signerRole: 'QA', reason: '' });
    setIsRejectOpen(true);
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCal) return;
    if (!approveForm.signerName.trim() || approveForm.signerName.length < 2) {
      showToast('error', 'Please enter a valid signer name (minimum 2 characters).');
      return;
    }

    setSigningSubmitting(true);
    try {
      await api.approveCalibration(selectedCal.id, approveForm.signerName, approveForm.signerRole);
      showToast('success', `Calibration record for ${selectedCal.instrument?.tagNumber} officially APPROVED.`);
      setIsApproveOpen(false);
      setSelectedCal(null);
      await fetchCalibrations();
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Signature authentication failed.');
    } finally {
      setSigningSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCal) return;
    if (!rejectForm.signerName.trim() || rejectForm.signerName.length < 2) {
      showToast('error', 'Please enter a valid signer name (minimum 2 characters).');
      return;
    }
    if (!rejectForm.reason.trim() || rejectForm.reason.length < 4) {
      showToast('error', 'Please enter a valid reason for rejection (minimum 4 characters).');
      return;
    }

    setSigningSubmitting(true);
    try {
      await api.rejectCalibration(selectedCal.id, rejectForm.signerName, rejectForm.signerRole, rejectForm.reason);
      showToast('success', `Calibration record for ${selectedCal.instrument?.tagNumber} has been REJECTED.`);
      setIsRejectOpen(false);
      setSelectedCal(null);
      await fetchCalibrations();
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Review submission failed.');
    } finally {
      setSigningSubmitting(false);
    }
  };

  const filtered = calibrations.filter(cal => {
    const tag = cal.instrument?.tagNumber || '';
    const instType = cal.instrument?.instrumentType || '';
    const tech = cal.technicianName || '';
    
    return tag.toLowerCase().includes(search.toLowerCase()) ||
           instType.toLowerCase().includes(search.toLowerCase()) ||
           tech.toLowerCase().includes(search.toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2 py-1 text-xs font-semibold rounded-md bg-slate-500/15 text-slate-400 border border-slate-500/30">DRAFT</span>;
      case 'PENDING_REVIEW':
        return <span className="px-2 py-1 text-xs font-semibold rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">PENDING REVIEW</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 text-xs font-semibold rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">APPROVED</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 text-xs font-semibold rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30">REJECTED</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-md bg-slate-500/15 text-slate-400 border border-slate-500/30">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 max-w-md ${
          toast.type === 'error' 
            ? 'bg-red-950/80 border-red-500/30 text-red-200' 
            : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
        }`}>
          <Info size={20} className={toast.type === 'error' ? 'text-red-400' : 'text-emerald-400'} />
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Fingerprint className="text-indigo-400" size={32} />
            Compliance Reviews
          </h1>
          <p className="text-gray-400 mt-1 text-sm max-w-2xl">
            Electronic signature workflow and quality records governance. Verify and sign off calibration data to maintain plant compliance.
          </p>
        </div>

        <button 
          onClick={fetchCalibrations}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 text-sm font-semibold border border-white/5 transition-all"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Reload Queue
        </button>
      </div>

      {/* Tab Select & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0c1220]/60 backdrop-blur-md border border-gray-800 p-4 rounded-xl">
        {/* Tabs */}
        <div className="flex gap-1.5 bg-[#080d16] p-1 rounded-lg border border-gray-800/80 self-start">
          {(['PENDING_REVIEW', 'APPROVED', 'REJECTED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === tab 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by instrument tag or technician..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-[#090d16] text-white border border-gray-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all"
          />
        </div>
      </div>

      {/* Main content grid */}
      <div className="bg-[#0c1220]/60 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-16 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 mx-auto"></div>
            <p className="text-gray-500 text-xs mt-3">Loading compliance records...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-400 flex flex-col items-center gap-2">
            <AlertCircle size={28} />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="mx-auto text-gray-600 mb-3" size={36} />
            <p className="text-sm font-semibold text-gray-300">No records found</p>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              There are no calibrations currently in {activeTab.replace('_', ' ').toLowerCase()} status matching the filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800/80 bg-[#080d16]/50">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Instrument Tag</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Type / Range</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Calibration Date</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Technician</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Results</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filtered.map((cal) => (
                  <tr key={cal.id} className="hover:bg-white/[0.01] transition-all">
                    <td className="px-6 py-4 font-semibold text-indigo-400 text-sm whitespace-nowrap">
                      <Link to={`/instruments/${cal.instrumentId}`} className="hover:underline">
                        {cal.instrument?.tagNumber || 'Unknown Tag'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-300 text-xs block font-medium">
                        {cal.instrument?.instrumentType || 'N/A'}
                      </span>
                      <span className="text-gray-500 text-[10px] block mt-0.5">
                        {cal.instrument ? `${cal.instrument.rangeMin} - ${cal.instrument.rangeMax} ${cal.instrument.engineeringUnits}` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-gray-500" />
                        {formatDate(cal.calibrationDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-gray-500" />
                        {cal.technicianName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cal.passFail ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">PASS</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">FAIL</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(cal.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetails(cal)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-gray-300 font-medium border border-white/5 transition-all"
                          title="View Calibration Test Points & Signatures"
                        >
                          <Eye size={13} />
                          Details
                        </button>

                        {activeTab === 'PENDING_REVIEW' && (
                          <>
                            <button
                              onClick={() => handleOpenApprove(cal)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/20 transition-all"
                            >
                              <Check size={13} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenReject(cal)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium border border-red-500/20 transition-all"
                            >
                              <X size={13} />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAILS MODAL */}
      {isDetailsOpen && selectedCal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0c1220] border border-gray-800 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-800/80 flex justify-between items-center bg-[#080d16]">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="text-indigo-400 font-semibold" size={20} />
                  Calibration Quality Record Details
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Instrument {selectedCal.instrument?.tagNumber || 'Unknown'} - {selectedCal.instrument?.instrumentType || 'N/A'}
                </p>
              </div>
              <button 
                onClick={() => setIsDetailsOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {/* Record Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#090d16]/40 p-4 rounded-xl border border-gray-800/60">
                <div>
                  <span className="block text-[10px] font-semibold text-gray-500 uppercase">Technician</span>
                  <span className="block text-gray-200 mt-0.5 font-medium">{selectedCal.technicianName}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-gray-500 uppercase">Calibration Date</span>
                  <span className="block text-gray-200 mt-0.5 font-medium">{formatDate(selectedCal.calibrationDate)}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-gray-500 uppercase">Evaluation</span>
                  <span className="block mt-0.5">
                    {selectedCal.passFail ? (
                      <span className="text-emerald-400 font-bold">PASS</span>
                    ) : (
                      <span className="text-red-400 font-bold">FAIL</span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-gray-500 uppercase">Workflow State</span>
                  <span className="block mt-0.5">{getStatusBadge(selectedCal.status)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedCal.notes && (
                <div className="p-3 bg-indigo-950/10 border border-indigo-900/20 text-xs text-gray-300 rounded-lg">
                  <span className="font-semibold text-indigo-400 block mb-1">Audit Notes / Comments:</span>
                  {selectedCal.notes}
                </div>
              )}

              {/* Test Points Grid */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Multi-Point Calibration Data (5-Point Check)</h4>
                
                {selectedCal.testPoints && selectedCal.testPoints.length > 0 ? (
                  <div className="border border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#080d16] border-b border-gray-800 text-gray-400 font-semibold">
                          <th className="px-4 py-3">Point Target</th>
                          <th className="px-4 py-3">Expected Output</th>
                          <th className="px-4 py-3">As Found Output</th>
                          <th className="px-4 py-3">As Left Output</th>
                          <th className="px-4 py-3">As Found Error</th>
                          <th className="px-4 py-3">As Left Error</th>
                          <th className="px-4 py-3 text-right">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/50 text-gray-300">
                        {selectedCal.testPoints.map((pt, idx) => (
                          <tr key={pt.id || idx} className="hover:bg-white/[0.01]">
                            <td className="px-4 py-2.5 font-medium">{pt.targetInput.toFixed(2)}</td>
                            <td className="px-4 py-2.5 font-medium text-gray-400">{pt.expectedOutput.toFixed(2)}</td>
                            <td className="px-4 py-2.5">{pt.asFoundOutput.toFixed(2)}</td>
                            <td className="px-4 py-2.5">{pt.asLeftOutput.toFixed(2)}</td>
                            <td className={`px-4 py-2.5 font-medium ${Math.abs(pt.asFoundError) > (selectedCal.instrument?.maxPermissibleError || 0.5) ? 'text-rose-400' : 'text-gray-400'}`}>
                              {pt.asFoundError.toFixed(3)}%
                            </td>
                            <td className={`px-4 py-2.5 font-medium ${Math.abs(pt.asLeftError) > (selectedCal.instrument?.maxPermissibleError || 0.5) ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {pt.asLeftError.toFixed(3)}%
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold">
                              {pt.passFail ? (
                                <span className="text-emerald-400">PASS</span>
                              ) : (
                                <span className="text-rose-400">FAIL</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-800/10 border border-gray-800 text-gray-400 text-xs rounded-xl flex items-center gap-2">
                    <Info size={16} />
                    <span>Legacy Calibration Record format (does not contain structured 5-point calibration matrices).</span>
                  </div>
                )}
              </div>

              {/* Traceable Reference Standards */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Traceable Reference Standards (Metrology)</h4>
                {selectedCal.referenceStandards && selectedCal.referenceStandards.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCal.referenceStandards.map((ref) => {
                      const std = ref.referenceStandard;
                      if (!std) return null;
                      return (
                        <div key={ref.id} className="p-3 bg-[#080d16] border border-gray-800 rounded-xl flex items-center justify-between flex-wrap gap-3">
                          <div>
                            <div className="font-semibold text-gray-200 text-xs flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                                {std.assetTag}
                              </span>
                              {std.manufacturer} {std.model}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1">
                              S/N: <span className="text-gray-300 font-mono">{std.serialNumber}</span> &bull; 
                              Cert: <span className="text-indigo-300 font-mono">{std.certificateNumber}</span> &bull;
                              Accuracy: <span className="text-gray-300">{std.accuracyClass}</span>
                            </div>
                            {ref.usageNotes && (
                              <div className="text-[10px] text-gray-400 mt-1 italic">
                                Usage Notes: {ref.usageNotes}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${
                              std.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              std.status === 'DUE_SOON' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              std.status === 'EXPIRED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                            }`}>
                              {std.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-800/10 border border-gray-800 text-gray-400 text-xs rounded-xl">
                    No reference standards linked to this calibration record.
                  </div>
                )}
              </div>

              {/* Electronic Signature History */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Electronic Signatures & Sign-off History</h4>
                
                {selectedCal.signatures && selectedCal.signatures.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCal.signatures.map((sig) => (
                      <div key={sig.id} className="p-3 bg-[#080d16] border border-gray-800 rounded-xl flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            sig.meaning === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            sig.meaning === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}>
                            <Fingerprint size={16} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-200 text-xs">
                              {sig.signerName} <span className="text-gray-500 font-medium">({sig.signerRole})</span>
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              Meaning: <span className="text-indigo-400 font-semibold">{sig.meaning}</span> &bull; {new Date(sig.signedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-[8px] uppercase tracking-wider text-gray-600 font-bold">SHA-256 Checksum</span>
                          <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10" title={sig.signatureHash}>
                            {sig.signatureHash.slice(0, 12)}...{sig.signatureHash.slice(-12)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-800/10 border border-gray-800 text-gray-400 text-xs rounded-xl flex items-center gap-2">
                    <Fingerprint size={16} />
                    <span>No digital signatures recorded. This calibration was created in DRAFT state.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-800/80 flex justify-end gap-3 bg-[#080d16]">
              {selectedCal.status === 'APPROVED' && (
                <div className="mr-auto flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <Fingerprint size={15} className="text-indigo-500" />
                  Quality record locked. Modifications prohibited.
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-semibold rounded-lg border border-white/5 transition-all"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE MODAL */}
      {isApproveOpen && selectedCal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0c1220] border border-gray-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-800/80 flex justify-between items-center bg-[#080d16]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="text-emerald-400" size={18} />
                Sign & Approve Calibration
              </h3>
              <button onClick={() => setIsApproveOpen(false)} className="text-gray-400 hover:text-white transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApproveSubmit}>
              <div className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-indigo-950/15 border border-indigo-900/20 text-gray-300 rounded-lg leading-relaxed">
                  <Fingerprint className="text-indigo-400 float-left mr-2 mt-0.5" size={16} />
                  <span>
                    By signing this electronic record, you confirm the calibration data for instrument <strong>{selectedCal.instrument?.tagNumber}</strong> is review-verified and compliant. This action updates next due schedules and locks this record from modifications.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-400 font-semibold">Reviewer Name (Signature)</label>
                  <input
                    type="text"
                    required
                    value={approveForm.signerName}
                    onChange={(e) => setApproveForm(prev => ({ ...prev, signerName: e.target.value }))}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 bg-[#090d16] text-white border border-gray-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-400 font-semibold">Signer Role</label>
                  <select
                    value={approveForm.signerRole}
                    onChange={(e) => setApproveForm(prev => ({ ...prev, signerRole: e.target.value as SignerRole }))}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] text-white border border-gray-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-xs"
                  >
                    <option value="SUPERVISOR">Supervisor / Approver</option>
                    <option value="QA">Quality Assurance (QA)</option>
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-800/80 flex justify-end gap-3 bg-[#080d16]">
                <button
                  type="button"
                  onClick={() => setIsApproveOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 font-semibold rounded-lg border border-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={signingSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-semibold rounded-lg shadow-md shadow-emerald-600/10 transition-all flex items-center gap-1.5"
                >
                  {signingSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      Verify & Sign
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {isRejectOpen && selectedCal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0c1220] border border-gray-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-800/80 flex justify-between items-center bg-[#080d16]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <XCircle className="text-rose-400" size={18} />
                Reject Compliance Record
              </h3>
              <button onClick={() => setIsRejectOpen(false)} className="text-gray-400 hover:text-white transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit}>
              <div className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-red-950/15 border border-red-900/20 text-gray-300 rounded-lg">
                  Rejection returns the record to the technician queue with a status of REJECTED. The technician must correct the errors and resubmit.
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-400 font-semibold">Reviewer Name (Signature)</label>
                  <input
                    type="text"
                    required
                    value={rejectForm.signerName}
                    onChange={(e) => setRejectForm(prev => ({ ...prev, signerName: e.target.value }))}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 bg-[#090d16] text-white border border-gray-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-400 font-semibold">Signer Role</label>
                  <select
                    value={rejectForm.signerRole}
                    onChange={(e) => setRejectForm(prev => ({ ...prev, signerRole: e.target.value as SignerRole }))}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] text-white border border-gray-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-xs"
                  >
                    <option value="SUPERVISOR">Supervisor / Approver</option>
                    <option value="QA">Quality Assurance (QA)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-400 font-semibold">Reason for Rejection</label>
                  <textarea
                    required
                    rows={3}
                    value={rejectForm.reason}
                    onChange={(e) => setRejectForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Provide detailed feedback regarding why this compliance record was rejected..."
                    className="w-full px-3.5 py-2.5 bg-[#090d16] text-white border border-gray-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-xs resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-800/80 flex justify-end gap-3 bg-[#080d16]">
                <button
                  type="button"
                  onClick={() => setIsRejectOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 font-semibold rounded-lg border border-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={signingSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white font-semibold rounded-lg shadow-md shadow-rose-600/10 transition-all flex items-center gap-1.5"
                >
                  {signingSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <X size={14} />
                      Reject Calibration
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
