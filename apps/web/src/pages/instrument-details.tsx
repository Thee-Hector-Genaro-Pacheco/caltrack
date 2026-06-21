import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { Instrument, CalibrationRecord, WorkOrderPriority, ReferenceStandard, CalibrationPrepGuidance, TechnicianBriefing } from '@caltrack/types';
import { ArrowLeft, Calendar, User, FileText, Plus, ShieldAlert, Trash2, Edit3, X, ChevronDown, ChevronRight, ClipboardList, Fingerprint, Check, Award, Sparkles, AlertTriangle, CheckSquare, ListTodo, HelpCircle, Activity, FileCheck, Cpu, BookOpen } from 'lucide-react';
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
  const [notes, setNotes] = useState('');
  const [calSubmitting, setCalSubmitting] = useState(false);
  const [expandedCalId, setExpandedCalId] = useState<string | null>(null);
  const [testPoints, setTestPoints] = useState<any[]>([]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Work Order States
  const [isWoModalOpen, setIsWoModalOpen] = useState(false);
  const [woPriority, setWoPriority] = useState<WorkOrderPriority>('MEDIUM');
  const [woTechnician, setWoTechnician] = useState('');
  const [woDate, setWoDate] = useState('');
  const [woDescription, setWoDescription] = useState('');
  const [woSubmitting, setWoSubmitting] = useState(false);

  // Compliance Review States
  const [reviewCal, setReviewCal] = useState<CalibrationRecord | null>(null);
  const [isSubmitReviewOpen, setIsSubmitReviewOpen] = useState(false);
  const [submitReviewForm, setSubmitReviewForm] = useState({ signerName: '', signerRole: 'TECHNICIAN' as any });
  
  const [isApproveReviewOpen, setIsApproveReviewOpen] = useState(false);
  const [approveReviewForm, setApproveReviewForm] = useState({ signerName: '', signerRole: 'SUPERVISOR' as any });
  
  const [isRejectReviewOpen, setIsRejectReviewOpen] = useState(false);
  const [rejectReviewForm, setRejectReviewForm] = useState({ signerName: '', signerRole: 'QA' as any, reason: '' });
  
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [availableStandards, setAvailableStandards] = useState<ReferenceStandard[]>([]);
  const [selectedStandards, setSelectedStandards] = useState<{ referenceStandardId: string; usageNotes: string }[]>([]);

  const [prepGuidance, setPrepGuidance] = useState<CalibrationPrepGuidance | null>(null);
  const [prepLoading, setPrepLoading] = useState(false);
  const [prepError, setPrepError] = useState<string | null>(null);

  const [briefingData, setBriefingData] = useState<TechnicianBriefing | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);

  const handleOpenBrief = async () => {
    if (!id) return;
    setBriefLoading(true);
    setBriefError(null);
    setIsBriefModalOpen(true);
    try {
      const brief = await api.getCalibrationBrief(id);
      setBriefingData(brief);
    } catch (err: any) {
      console.error(err);
      setBriefError(err.message || 'Failed to fetch calibration brief.');
    } finally {
      setBriefLoading(false);
    }
  };

  const handleGeneratePrep = async () => {
    if (!id) return;
    setPrepLoading(true);
    setPrepError(null);
    try {
      const guidance = await api.generateCalibrationPrep(id);
      setPrepGuidance(guidance);
    } catch (err: any) {
      console.error(err);
      setPrepError(err.message || 'Failed to generate calibration prep guidance.');
    } finally {
      setPrepLoading(false);
    }
  };

  useEffect(() => {
    if (isCalModalOpen && instrument) {
      const percentages = [0, 0.25, 0.5, 0.75, 1.0];
      const initialPoints = percentages.map(p => {
        const targetInput = instrument.rangeMin + p * (instrument.rangeMax - instrument.rangeMin);
        const expectedOutput = instrument.signalType === '4-20 mA' ? 4 + 16 * p : targetInput;
        return {
          percent: p * 100,
          targetInput,
          expectedOutput,
          asFoundOutput: '',
          asLeftOutput: '',
          asFoundError: 0,
          asLeftError: 0,
          pass: true,
        };
      });
      setTestPoints(initialPoints);
      setSelectedStandards([]);
    }
  }, [isCalModalOpen, instrument]);

  const handlePointChange = (index: number, field: 'asFoundOutput' | 'asLeftOutput', value: string) => {
    const nextPoints = [...testPoints];
    nextPoints[index] = {
      ...nextPoints[index],
      [field]: value,
    };

    const outputSpan = instrument?.signalType === '4-20 mA' ? 16 : (instrument!.rangeMax - instrument!.rangeMin);
    const mpe = instrument!.maxPermissibleError;
    const pt = nextPoints[index];

    const foundVal = parseFloat(pt.asFoundOutput);
    const leftVal = parseFloat(pt.asLeftOutput);

    if (!isNaN(foundVal) && outputSpan !== 0) {
      pt.asFoundError = ((foundVal - pt.expectedOutput) / outputSpan) * 100;
    } else {
      pt.asFoundError = 0;
    }

    if (!isNaN(leftVal) && outputSpan !== 0) {
      pt.asLeftError = ((leftVal - pt.expectedOutput) / outputSpan) * 100;
      pt.pass = Math.abs(pt.asLeftError) <= mpe;
    } else {
      pt.asLeftError = 0;
      pt.pass = true;
    }

    setTestPoints(nextPoints);
  };

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
    const query = new URLSearchParams(window.location.search);
    if (query.get('logCal') === 'true') {
      setIsCalModalOpen(true);
    }
    api.getReferenceStandards()
      .then(res => setAvailableStandards(res))
      .catch(err => console.error('Error fetching reference standards:', err));
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
        notes,
        testPoints: testPoints.map(pt => ({
          targetInput: pt.targetInput,
          asFoundOutput: parseFloat(pt.asFoundOutput) || 0,
          asLeftOutput: parseFloat(pt.asLeftOutput) || 0,
        })),
        referenceStandards: selectedStandards,
      });
      setIsCalModalOpen(false);
      setTechnician('');
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

  const handleAddWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setWoSubmitting(true);
    try {
      await api.createWorkOrder({
        instrumentId: id!,
        priority: woPriority,
        assignedTechnician: woTechnician || undefined,
        scheduledDate: woDate ? new Date(woDate).toISOString() : undefined,
        description: woDescription || undefined,
        status: 'OPEN'
      });
      setIsWoModalOpen(false);
      setWoTechnician('');
      setWoDate('');
      setWoDescription('');
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to create work order.');
    } finally {
      setWoSubmitting(false);
    }
  };

  const handleOpenSubmitReview = (cal: CalibrationRecord) => {
    setReviewCal(cal);
    setSubmitReviewForm({ signerName: '', signerRole: 'TECHNICIAN' });
    setIsSubmitReviewOpen(true);
  };

  const handleOpenApproveReview = (cal: CalibrationRecord) => {
    setReviewCal(cal);
    setApproveReviewForm({ signerName: '', signerRole: 'SUPERVISOR' });
    setIsApproveReviewOpen(true);
  };

  const handleOpenRejectReview = (cal: CalibrationRecord) => {
    setReviewCal(cal);
    setRejectReviewForm({ signerName: '', signerRole: 'QA', reason: '' });
    setIsRejectReviewOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewCal) return;
    if (!submitReviewForm.signerName.trim() || submitReviewForm.signerName.length < 2) {
      alert('Please enter a valid signer name.');
      return;
    }
    setReviewSubmitting(true);
    try {
      await api.submitCalibration(reviewCal.id, submitReviewForm.signerName, submitReviewForm.signerRole);
      setIsSubmitReviewOpen(false);
      setReviewCal(null);
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleApproveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewCal) return;
    if (!approveReviewForm.signerName.trim() || approveReviewForm.signerName.length < 2) {
      alert('Please enter a valid signer name.');
      return;
    }
    setReviewSubmitting(true);
    try {
      await api.approveCalibration(reviewCal.id, approveReviewForm.signerName, approveReviewForm.signerRole);
      setIsApproveReviewOpen(false);
      setReviewCal(null);
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to approve calibration.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleRejectReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewCal) return;
    if (!rejectReviewForm.signerName.trim() || rejectReviewForm.signerName.length < 2) {
      alert('Please enter a valid signer name.');
      return;
    }
    if (!rejectReviewForm.reason.trim() || rejectReviewForm.reason.length < 4) {
      alert('Please enter a valid reason.');
      return;
    }
    setReviewSubmitting(true);
    try {
      await api.rejectCalibration(reviewCal.id, rejectReviewForm.signerName, rejectReviewForm.signerRole, rejectReviewForm.reason);
      setIsRejectReviewOpen(false);
      setReviewCal(null);
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to reject calibration.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/20">DRAFT</span>;
      case 'PENDING_REVIEW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">PENDING REVIEW</span>;
      case 'APPROVED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">APPROVED</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20">REJECTED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/20">{status}</span>;
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
            <div>
              <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Max Permissible Error (MPE)</span>
              <span className="text-white font-medium mt-0.5 block font-mono">
                ±{instrument.maxPermissibleError}% of Span
              </span>
            </div>
            <div>
              <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Calibration Interval</span>
              <span className="text-white font-medium mt-0.5 block">
                {instrument.calibrationIntervalMonths} Months
              </span>
            </div>
            <div>
              <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Last Calibration Date</span>
              <span className="text-white font-medium mt-0.5 block font-mono">
                {instrument.lastCalibrationDate ? formatDate(instrument.lastCalibrationDate) : 'Never Calibrated'}
              </span>
            </div>
            <div>
              <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Next Calibration Due</span>
              <span className={`font-semibold mt-0.5 block font-mono ${
                instrument.status === 'OVERDUE' ? 'text-red-500' :
                instrument.status === 'CALIBRATION_DUE' ? 'text-amber-500' :
                'text-emerald-400'
              }`}>
                {instrument.nextCalibrationDueDate ? formatDate(instrument.nextCalibrationDueDate) : 'Unscheduled'}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Physical Location</span>
              <span className="text-white font-medium mt-0.5 block">{instrument.location}</span>
            </div>
            <div>
              <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Process Area</span>
              <span className="text-white font-medium mt-0.5 block">
                {instrument.processArea 
                  ? `${instrument.processArea.areaCode} - ${instrument.processArea.name}`
                  : 'N/A'}
              </span>
            </div>
            <div>
              <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Control Loop</span>
              <span className="text-white font-medium mt-0.5 block">
                {instrument.controlLoop ? (
                  <Link 
                    to={`/control-loops/${instrument.controlLoop.id}`}
                    className="text-indigo-400 hover:underline font-semibold"
                  >
                    {instrument.controlLoop.loopTag}
                  </Link>
                ) : 'N/A'}
              </span>
            </div>
            <div>
              <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">P&ID Reference</span>
              <span className="text-white font-medium mt-0.5 block font-mono">
                {instrument.controlLoop?.pidReference || 'N/A'}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Metadata Info</span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-gray-500 text-[10px] uppercase tracking-wider">Created At</span>
                  <span className="text-gray-400 font-medium mt-0.5 block font-mono text-xs">{formatDate(instrument.createdAt)}</span>
                </div>
                <div>
                  <span className="block text-gray-500 text-[10px] uppercase tracking-wider">Updated At</span>
                  <span className="text-gray-400 font-medium mt-0.5 block font-mono text-xs">{formatDate(instrument.updatedAt)}</span>
                </div>
              </div>
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

          <div className="space-y-3 mt-6">
            <button
              onClick={() => setIsCalModalOpen(true)}
              className="w-full btn-transition bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
            >
              <Plus size={16} />
              Add Calibration Record
            </button>
            <button
              onClick={handleGeneratePrep}
              disabled={prepLoading}
              className="w-full btn-transition bg-[#1f2937] hover:bg-[#374151] border border-white/5 text-gray-200 font-semibold py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles size={16} className="text-indigo-400" />
              {prepLoading ? 'Generating...' : 'Generate Calibration Prep'}
            </button>
            <button
              onClick={handleOpenBrief}
              className="w-full btn-transition bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 border border-indigo-500/30"
            >
              <Sparkles size={16} className="text-indigo-200" />
              AI Calibration Assistant
            </button>
          </div>
        </div>
      </div>

      {prepError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex gap-3 text-xs leading-relaxed">
          <ShieldAlert className="shrink-0 text-red-500" size={18} />
          <div>
            <span className="font-semibold uppercase tracking-wider block mb-0.5">Error Generating Prep Guidance</span>
            {prepError}
          </div>
        </div>
      )}

      {prepGuidance && (
        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-6 glow-primary relative">
          <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600/15 rounded-lg border border-indigo-500/20 text-indigo-400">
                <Cpu size={22} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  AI Calibration Prep Guidance
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded">
                    Technician Assistant
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Custom field calibration procedure & target values for {instrument.tagNumber}</p>
              </div>
            </div>
            <button
              onClick={() => setPrepGuidance(null)}
              className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Close Guidance"
            >
              <X size={18} />
            </button>
          </div>

          {/* Disclaimer Banner */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl flex gap-3 text-xs leading-relaxed">
            <AlertTriangle className="shrink-0 text-amber-500" size={18} />
            <div>
              <span className="font-semibold uppercase tracking-wider block mb-0.5">Safety & Quality Disclaimer</span>
              {prepGuidance.disclaimer}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Required Equipment Checklist */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <CheckSquare size={16} className="text-indigo-400" />
                Required Equipment
              </h4>
              <ul className="space-y-2 bg-[#090d16]/40 border border-gray-800/80 rounded-xl p-4 text-xs text-gray-300">
                {prepGuidance.requiredEquipment.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Reference Standards Needed */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <Award size={16} className="text-indigo-400" />
                Reference Standards Needed
              </h4>
              <ul className="space-y-2 bg-[#090d16]/40 border border-gray-800/80 rounded-xl p-4 text-xs text-gray-300">
                {prepGuidance.referenceStandards.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Safety Precautions & Setup Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Safety Precautions */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <ShieldAlert size={16} className="text-red-400" />
                Safety Precautions
              </h4>
              <ul className="space-y-2 bg-[#090d16]/40 border border-gray-800/80 rounded-xl p-4 text-xs text-gray-300">
                {prepGuidance.safetyPrecautions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Setup Instructions */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <ListTodo size={16} className="text-indigo-400" />
                Setup & Connection Instructions
              </h4>
              <ol className="space-y-2.5 bg-[#090d16]/40 border border-gray-800/80 rounded-xl p-4 text-xs text-gray-300 list-decimal pl-6">
                {prepGuidance.setupInstructions.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* 5-Point Calibration targets */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Activity size={16} className="text-indigo-400" />
              5-Point Calibration Target Points
            </h4>
            <div className="overflow-x-auto border border-gray-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-gray-800 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="p-3 text-center w-24">% Test Point</th>
                    <th className="p-3">Target Input Value ({instrument.engineeringUnits})</th>
                    <th className="p-3">Expected Output ({instrument.signalType})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-gray-300 font-mono">
                  {prepGuidance.testPoints.map((pt, idx) => (
                    <tr key={idx} className="hover:bg-white/5 bg-[#090d16]/10">
                      <td className="p-3 text-center font-bold text-indigo-400 bg-indigo-500/5">{pt.percent}%</td>
                      <td className="p-3">{pt.targetInput.toFixed(2)} {instrument.engineeringUnits}</td>
                      <td className="p-3">{pt.expectedOutput.toFixed(2)} {instrument.signalType === '4-20 mA' ? 'mA' : instrument.engineeringUnits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Documentation Checklist */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <FileCheck size={16} className="text-indigo-400" />
                Documentation Checklist
              </h4>
              <ul className="space-y-2 bg-[#090d16]/40 border border-gray-800/80 rounded-xl p-4 text-xs text-gray-300">
                {prepGuidance.documentationChecklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Common Failure Reasons */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <HelpCircle size={16} className="text-amber-400" />
                Common Failure Reasons
              </h4>
              <ul className="space-y-2 bg-[#090d16]/40 border border-gray-800/80 rounded-xl p-4 text-xs text-gray-300">
                {prepGuidance.commonFailureReasons.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {isBriefModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 overflow-y-auto py-8">
          <div className="w-full max-w-4xl glass-panel p-6 rounded-2xl glow-primary relative my-auto border border-indigo-500/20 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsBriefModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2.5 border-b border-gray-800 pb-4 mb-5">
              <div className="p-2 bg-indigo-600/20 rounded-lg border border-indigo-500/30 text-indigo-400">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  AI Calibration Briefing
                  <span className="text-[9px] uppercase font-extrabold tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                    Operational Intelligence
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Technician briefing report generated for {instrument.tagNumber}</p>
              </div>
            </div>

            {briefLoading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
                <p className="text-xs text-gray-400">Orchestrating agents & querying plant database...</p>
              </div>
            ) : briefError ? (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex gap-3 text-xs leading-relaxed">
                <ShieldAlert className="shrink-0 text-red-500" size={18} />
                <div>
                  <span className="font-semibold uppercase tracking-wider block mb-0.5">Briefing Generation Failed</span>
                  {briefError}
                </div>
              </div>
            ) : briefingData ? (
              <div className="space-y-6 text-sm">
                
                {/* Operational Warning & Recommendations Banner */}
                {briefingData.recommendations.length > 0 && (
                  <div className="bg-[#1e1b4b]/40 border border-indigo-500/20 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <Cpu size={14} />
                      System Diagnostic & Operational Warnings
                    </h4>
                    <ul className="space-y-1.5 text-xs text-gray-300">
                      {briefingData.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-indigo-400 select-none mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Left Column: Instrument Specs */}
                  <div className="md:col-span-2 space-y-6">
                    {/* Device Specs Card */}
                    <div className="bg-[#090d16]/30 border border-gray-800/80 rounded-xl p-4.5 space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
                        <FileText size={14} className="text-indigo-400" />
                        Instrument Specifications
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3.5 gap-x-4 text-xs">
                        <div>
                          <span className="block text-gray-500 text-[10px] uppercase font-semibold">Tag Number</span>
                          <span className="text-white font-semibold mt-0.5 block">{briefingData.instrumentInfo.tagNumber}</span>
                        </div>
                        <div>
                          <span className="block text-gray-500 text-[10px] uppercase font-semibold">Manufacturer</span>
                          <span className="text-white font-medium mt-0.5 block">{briefingData.instrumentInfo.manufacturer}</span>
                        </div>
                        <div>
                          <span className="block text-gray-500 text-[10px] uppercase font-semibold">Model</span>
                          <span className="text-white font-medium mt-0.5 block">{briefingData.instrumentInfo.model}</span>
                        </div>
                        <div>
                          <span className="block text-gray-500 text-[10px] uppercase font-semibold">Device Type</span>
                          <span className="text-white font-medium mt-0.5 block">{briefingData.instrumentInfo.instrumentType}</span>
                        </div>
                        <div>
                          <span className="block text-gray-500 text-[10px] uppercase font-semibold">Span Range</span>
                          <span className="text-white font-semibold mt-0.5 block font-mono">{briefingData.instrumentInfo.range}</span>
                        </div>
                        <div>
                          <span className="block text-gray-500 text-[10px] uppercase font-semibold">Signal Type</span>
                          <span className="text-white font-medium mt-0.5 block">{briefingData.instrumentInfo.signalType}</span>
                        </div>
                        <div className="col-span-2 sm:col-span-3">
                          <span className="block text-gray-500 text-[10px] uppercase font-semibold">Process Area / Loop</span>
                          <span className="text-gray-300 font-medium mt-0.5 block">
                            Area: {briefingData.instrumentInfo.processArea} &bull; Loop: {briefingData.instrumentInfo.controlLoop}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Calibration targets 5-point table */}
                    {briefingData.testPoints && briefingData.testPoints.length > 0 && (
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
                          <Activity size={14} className="text-indigo-400" />
                          5-Point Calibration Target Plan
                        </h4>
                        <div className="overflow-x-auto border border-gray-800/80 rounded-xl bg-[#090d16]/20">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-900/60 border-b border-gray-800 text-gray-400 font-semibold uppercase tracking-wider">
                                <th className="p-2.5 text-center w-20">% Test</th>
                                <th className="p-2.5">Target Input ({instrument.engineeringUnits})</th>
                                <th className="p-2.5">Expected Output ({instrument.signalType})</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/40 text-gray-300 font-mono">
                              {briefingData.testPoints.map((pt, idx) => (
                                <tr key={idx} className="hover:bg-white/5">
                                  <td className="p-2 text-center font-bold text-indigo-400 bg-indigo-500/5">{pt.percent}%</td>
                                  <td className="p-2">{pt.targetInput.toFixed(2)}</td>
                                  <td className="p-2">{pt.expectedOutput.toFixed(2)} {instrument.signalType === '4-20 mA' ? 'mA' : instrument.engineeringUnits}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Technical Documentation Section */}
                    {briefingData.technicalDocumentation && (
                      <div className="space-y-3 bg-[#090d16]/30 border border-gray-800/80 rounded-xl p-4.5">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
                          <BookOpen size={14} className="text-indigo-400" />
                          Technical Documentation & Engineering Work Package
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 text-xs">
                          {/* Recommended Procedure */}
                          <div className="p-3 bg-[#090d16]/40 border border-gray-800/60 rounded-lg flex flex-col justify-between">
                            <div>
                              <span className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Recommended Procedure</span>
                              {briefingData.technicalDocumentation.recommendedProcedure ? (
                                <Link
                                  to={`/documentation/${briefingData.technicalDocumentation.recommendedProcedure.id}`}
                                  className="text-indigo-400 hover:text-indigo-300 font-bold block mt-1 hover:underline"
                                  onClick={() => setIsBriefModalOpen(false)}
                                >
                                  {briefingData.technicalDocumentation.recommendedProcedure.title}
                                </Link>
                              ) : (
                                <span className="text-gray-500 italic block mt-1 font-sans">No procedure linked</span>
                              )}
                            </div>
                            {briefingData.technicalDocumentation.recommendedProcedure && (
                              <span className="text-[10px] text-gray-500 font-mono mt-1.5 block">
                                {briefingData.technicalDocumentation.recommendedProcedure.documentNumber} (Rev {briefingData.technicalDocumentation.recommendedProcedure.revision})
                              </span>
                            )}
                          </div>

                          {/* Manufacturer Manual */}
                          <div className="p-3 bg-[#090d16]/40 border border-gray-800/60 rounded-lg flex flex-col justify-between">
                            <div>
                              <span className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Manufacturer Manual</span>
                              {briefingData.technicalDocumentation.manufacturerManual ? (
                                <Link
                                  to={`/documentation/${briefingData.technicalDocumentation.manufacturerManual.id}`}
                                  className="text-indigo-400 hover:text-indigo-300 font-bold block mt-1 hover:underline"
                                  onClick={() => setIsBriefModalOpen(false)}
                                >
                                  {briefingData.technicalDocumentation.manufacturerManual.title}
                                </Link>
                              ) : (
                                <span className="text-gray-500 italic block mt-1 font-sans">No manual linked</span>
                              )}
                            </div>
                            {briefingData.technicalDocumentation.manufacturerManual && (
                              <span className="text-[10px] text-gray-500 font-mono mt-1.5 block">
                                {briefingData.technicalDocumentation.manufacturerManual.documentNumber} (Rev {briefingData.technicalDocumentation.manufacturerManual.revision})
                              </span>
                            )}
                          </div>

                          {/* Installation Guide */}
                          <div className="p-3 bg-[#090d16]/40 border border-gray-800/60 rounded-lg flex flex-col justify-between">
                            <div>
                              <span className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Installation Guide</span>
                              {briefingData.technicalDocumentation.installationGuide ? (
                                <Link
                                  to={`/documentation/${briefingData.technicalDocumentation.installationGuide.id}`}
                                  className="text-indigo-400 hover:text-indigo-300 font-bold block mt-1 hover:underline"
                                  onClick={() => setIsBriefModalOpen(false)}
                                >
                                  {briefingData.technicalDocumentation.installationGuide.title}
                                </Link>
                              ) : (
                                <span className="text-gray-500 italic block mt-1 font-sans">No installation guide linked</span>
                              )}
                            </div>
                            {briefingData.technicalDocumentation.installationGuide && (
                              <span className="text-[10px] text-gray-500 font-mono mt-1.5 block">
                                {briefingData.technicalDocumentation.installationGuide.documentNumber} (Rev {briefingData.technicalDocumentation.installationGuide.revision})
                              </span>
                            )}
                          </div>

                          {/* Safety Notes */}
                          <div className="p-3 bg-[#090d16]/40 border border-gray-800/60 rounded-lg flex flex-col justify-between">
                            <div>
                              <span className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Safety Notes</span>
                              {briefingData.technicalDocumentation.safetyNotes ? (
                                <Link
                                  to={`/documentation/${briefingData.technicalDocumentation.safetyNotes.id}`}
                                  className="text-indigo-400 hover:text-indigo-300 font-bold block mt-1 hover:underline"
                                  onClick={() => setIsBriefModalOpen(false)}
                                >
                                  {briefingData.technicalDocumentation.safetyNotes.title}
                                </Link>
                              ) : (
                                <span className="text-gray-500 italic block mt-1 font-sans">No safety notes linked</span>
                              )}
                            </div>
                            {briefingData.technicalDocumentation.safetyNotes && (
                              <span className="text-[10px] text-gray-500 font-mono mt-1.5 block">
                                {briefingData.technicalDocumentation.safetyNotes.documentNumber} (Rev {briefingData.technicalDocumentation.safetyNotes.revision})
                              </span>
                            )}
                          </div>

                          {/* Troubleshooting Guide */}
                          <div className="p-3 bg-[#090d16]/40 border border-gray-800/60 rounded-lg flex flex-col justify-between">
                            <div>
                              <span className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Troubleshooting Guide</span>
                              {briefingData.technicalDocumentation.troubleshootingGuide ? (
                                <Link
                                  to={`/documentation/${briefingData.technicalDocumentation.troubleshootingGuide.id}`}
                                  className="text-indigo-400 hover:text-indigo-300 font-bold block mt-1 hover:underline"
                                  onClick={() => setIsBriefModalOpen(false)}
                                >
                                  {briefingData.technicalDocumentation.troubleshootingGuide.title}
                                </Link>
                              ) : (
                                <span className="text-gray-500 italic block mt-1 font-sans">No troubleshooting guide linked</span>
                              )}
                            </div>
                            {briefingData.technicalDocumentation.troubleshootingGuide && (
                              <span className="text-[10px] text-gray-500 font-mono mt-1.5 block">
                                {briefingData.technicalDocumentation.troubleshootingGuide.documentNumber} (Rev {briefingData.technicalDocumentation.troubleshootingGuide.revision})
                              </span>
                            )}
                          </div>

                          {/* Related Drawings */}
                          <div className="p-3 bg-[#090d16]/40 border border-gray-800/60 rounded-lg flex flex-col justify-between">
                            <div>
                              <span className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Related Drawings</span>
                              {briefingData.technicalDocumentation.relatedDrawings && briefingData.technicalDocumentation.relatedDrawings.length > 0 ? (
                                <div className="space-y-1.5 mt-1">
                                  {briefingData.technicalDocumentation.relatedDrawings.map((drawing) => (
                                    <div key={drawing.id} className="flex items-center justify-between text-[11px] font-sans">
                                      <Link
                                        to={`/documentation/${drawing.id}`}
                                        className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline truncate max-w-[170px]"
                                        onClick={() => setIsBriefModalOpen(false)}
                                      >
                                        {drawing.title}
                                      </Link>
                                      <span className="text-[9px] text-gray-500 font-mono font-semibold ml-2 shrink-0">
                                        ({drawing.documentType})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-500 italic block mt-1 font-sans">No drawings linked</span>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: History & Standards */}
                  <div className="space-y-6">
                    {/* Calibration History Card */}
                    <div className="bg-[#090d16]/30 border border-gray-800/80 rounded-xl p-4.5 space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
                        <Calendar size={14} className="text-indigo-400" />
                        Calibration History Summary
                      </h4>
                      <div className="space-y-2.5 text-xs font-sans">
                        <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                          <span className="text-gray-500">Historical Validations</span>
                          <span className="text-white font-mono font-bold">{briefingData.calibrationHistory.numberOfHistoricalCalibrations} records</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                          <span className="text-gray-500">Last Calibrated</span>
                          <span className="text-white font-medium">{briefingData.calibrationHistory.lastCalibrationDate}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                          <span className="text-gray-500">Last Outcome</span>
                          <span className={`font-bold ${
                            briefingData.calibrationHistory.passFail === 'PASS' ? 'text-emerald-400' :
                            briefingData.calibrationHistory.passFail === 'FAIL' ? 'text-rose-400' : 'text-gray-400'
                          }`}>
                            {briefingData.calibrationHistory.passFail}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Previous Tech</span>
                          <span className="text-white font-medium">{briefingData.calibrationHistory.previousTechnician}</span>
                        </div>
                      </div>
                    </div>

                    {/* Reference Standards Card */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
                        <Award size={14} className="text-indigo-400" />
                        Recommended Metrology
                      </h4>
                      {briefingData.referenceStandards.length === 0 ? (
                        <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-xs text-red-400 italic font-sans">
                          No active reference standards found for this category!
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {briefingData.referenceStandards.map((std, idx) => (
                            <div key={idx} className="p-2.5 bg-[#090d16]/30 border border-gray-800/60 rounded-xl space-y-1 font-sans">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10 font-bold">
                                  {std.assetTag}
                                </span>
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                  std.isExpired ? 'bg-red-500/10 text-red-400 border border-red-500/25' :
                                  std.status === 'DUE_SOON' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                                }`}>
                                  {std.status}
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-300 font-medium">
                                {std.manufacturer} {std.model}
                              </div>
                              <div className="text-[9px] text-gray-500 font-mono">
                                Due: {std.calibrationDueDate} &bull; Acc: {std.accuracyClass}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Bottom Section: Checklist */}
                <div className="bg-[#090d16]/30 border border-gray-800/80 rounded-xl p-4.5 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <CheckSquare size={14} className="text-indigo-400" />
                    Technician Action Checklist
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 font-sans">
                    {briefingData.calibrationChecklist.map((task, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 p-2 bg-[#090d16]/20 border border-gray-800/40 rounded-lg text-xs text-gray-300 select-none">
                        <div className="w-4 h-4 rounded border border-gray-700 bg-slate-900 flex items-center justify-center shrink-0 text-[10px] text-indigo-400 font-bold font-mono">
                          {idx + 1}
                        </div>
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer Block */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl flex gap-2.5 text-[10px] leading-relaxed font-sans">
                  <AlertTriangle className="shrink-0 text-amber-500" size={15} />
                  <div>
                    <span className="font-semibold uppercase tracking-wider block mb-0.5">Disclaimer Checklist Directive</span>
                    Generated guidance must be verified against site procedures, manufacturer documentation, and approved quality requirements. This assistant supports technician preparation but does not replace official procedures or qualified review.
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 text-sm mt-5">
              <button
                type="button"
                onClick={() => setIsBriefModalOpen(false)}
                className="btn-transition bg-[#1f2937] hover:bg-[#374151] border border-white/5 text-gray-300 font-semibold py-2 px-6 rounded-lg text-xs font-sans"
              >
                Close Briefing
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <th className="py-3 px-4">As Found ({instrument.signalType === '4-20 mA' ? 'mA' : instrument.engineeringUnits})</th>
                  <th className="py-3 px-4">As Left ({instrument.signalType === '4-20 mA' ? 'mA' : instrument.engineeringUnits})</th>
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
                    <React.Fragment key={cal.id}>
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
                          {hasTestPoints ? 'Multi-point' : (cal.asFound !== null && cal.asFound !== undefined ? cal.asFound : '-')}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs">
                          {hasTestPoints ? 'Multi-point' : (cal.asLeft !== null && cal.asLeft !== undefined ? cal.asLeft : '-')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                            cal.passFail
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {cal.passFail ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(cal.status)}
                        </td>
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
                                        const isFoundErrorMpe = Math.abs(pt.asFoundError) > instrument.maxPermissibleError;
                                        const isLeftErrorMpe = Math.abs(pt.asLeftError) > instrument.maxPermissibleError;
                                        
                                        return (
                                          <tr key={pt.id} className="hover:bg-white/5 font-mono">
                                            <td className="p-2.5">{pt.targetInput.toFixed(2)} {instrument.engineeringUnits}</td>
                                            <td className="p-2.5">{pt.expectedOutput.toFixed(2)} {instrument.signalType === '4-20 mA' ? 'mA' : instrument.engineeringUnits}</td>
                                            <td className="p-2.5">{pt.asFoundOutput.toFixed(2)} {instrument.signalType === '4-20 mA' ? 'mA' : instrument.engineeringUnits}</td>
                                            <td className="p-2.5">
                                              <span className={isFoundErrorMpe ? 'text-red-400 font-semibold' : 'text-emerald-400'}>
                                                {pt.asFoundError.toFixed(3)}%
                                              </span>
                                            </td>
                                            <td className="p-2.5">{pt.asLeftOutput.toFixed(2)} {instrument.signalType === '4-20 mA' ? 'mA' : instrument.engineeringUnits}</td>
                                            <td className="p-2.5">
                                              <span className={isLeftErrorMpe ? 'text-red-400 font-semibold' : 'text-emerald-400'}>
                                                {pt.asLeftError.toFixed(3)}%
                                              </span>
                                            </td>
                                            <td className="p-2.5 font-sans">
                                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                pt.passFail 
                                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                              }`}>
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
                                  Legacy/single-point calibration record. As Found: {cal.asFound ?? '-'}, As Left: {cal.asLeft ?? '-'}
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
                                        <div key={ref.id} className="p-2.5 bg-[#090d16] border border-gray-800 rounded-lg flex items-center justify-between text-xs">
                                          <div>
                                            <div className="font-semibold text-gray-300 flex items-center gap-1.5">
                                              <span className="font-mono text-[9px] text-indigo-400 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10">
                                                {std.assetTag}
                                              </span>
                                              {std.manufacturer} {std.model}
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-1">
                                              S/N: <span className="text-gray-400 font-mono">{std.serialNumber}</span> &bull; 
                                              Cert: <span className="text-indigo-400/80 font-mono">{std.certificateNumber}</span>
                                            </div>
                                            {ref.usageNotes && (
                                              <div className="text-[10px] text-gray-400 mt-1 italic">
                                                Notes: {ref.usageNotes}
                                              </div>
                                            )}
                                          </div>
                                          <div className="text-right">
                                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
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
                                  <div className="text-xs text-gray-500 italic">No reference standards linked to this calibration record.</div>
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
                                      <div key={sig.id} className="p-2.5 bg-[#090d16] border border-gray-800 rounded-lg flex items-center justify-between text-xs">
                                        <div>
                                          <div className="font-semibold text-gray-300">
                                            {sig.signerName} <span className="text-gray-500 font-medium">({sig.signerRole})</span>
                                          </div>
                                          <div className="text-[10px] text-gray-500 mt-0.5">
                                            Meaning: <span className="text-indigo-400 font-semibold">{sig.meaning}</span> &bull; {new Date(sig.signedAt).toLocaleString()}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <span className="block text-[8px] uppercase text-gray-600 font-bold">SHA-256 Checksum</span>
                                          <span className="font-mono text-[9px] text-indigo-400 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10" title={sig.signatureHash}>
                                            {sig.signatureHash.slice(0, 8)}...{sig.signatureHash.slice(-8)}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-500 italic">No signatures recorded for this draft calibration.</div>
                                )}
                              </div>

                              {/* Action Buttons for this Calibration Record */}
                              <div className="flex gap-2.5 pt-3 border-t border-gray-900/60 mt-4">
                                {(cal.status === 'DRAFT' || cal.status === 'REJECTED') && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenSubmitReview(cal);
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
                                        handleOpenApproveReview(cal);
                                      }}
                                      className="px-3 py-1.5 rounded bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 font-semibold text-xs transition-all flex items-center gap-1.5"
                                    >
                                      <Check size={13} />
                                      Sign & Approve
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenRejectReview(cal);
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
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Linked Work Orders Log */}
      <div className="glass-card p-6 rounded-xl border border-white/5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ClipboardList className="text-indigo-400" size={20} />
            Linked Calibration Work Orders
          </h3>
          {!instrument.workOrders?.some(w => w.status === 'OPEN' || w.status === 'IN_PROGRESS') && (
            <button
              onClick={() => setIsWoModalOpen(true)}
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
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        wo.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        wo.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        wo.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {wo.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        wo.status === 'OPEN' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        wo.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        wo.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
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

      {isCalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 overflow-y-auto py-8">
          <div className="w-full max-w-3xl glass-panel p-6 rounded-2xl glow-primary relative my-auto">
            <button
              onClick={() => setIsCalModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-1">New 5-Point Calibration Record</h3>
            <p className="text-gray-400 text-xs mb-6">Log field validation findings. Acceptable tolerance limits: ±{instrument.maxPermissibleError}% MPE.</p>
 
            <form onSubmit={handleAddCalibration} className="space-y-5">
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
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Calibration Test Grid (5-Point Check)
                </label>
                <div className="overflow-x-auto border border-gray-800 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-gray-800 text-gray-400 font-semibold uppercase tracking-wider">
                        <th className="p-2 w-16 text-center">% Test</th>
                        <th className="p-2">Target Input ({instrument.engineeringUnits})</th>
                        <th className="p-2">Expected Output</th>
                        <th className="p-2 w-28">As Found ({instrument.signalType === '4-20 mA' ? 'mA' : instrument.engineeringUnits})</th>
                        <th className="p-2 text-center w-24">Found Error</th>
                        <th className="p-2 w-28">As Left ({instrument.signalType === '4-20 mA' ? 'mA' : instrument.engineeringUnits})</th>
                        <th className="p-2 text-center w-24">Left Error</th>
                        <th className="p-2 text-center w-20">Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60 text-gray-300">
                      {testPoints.map((pt, idx) => {
                        const isFoundErrorMpe = Math.abs(pt.asFoundError) > instrument.maxPermissibleError;
                        const isLeftErrorMpe = Math.abs(pt.asLeftError) > instrument.maxPermissibleError;
                        const hasLeftValue = pt.asLeftOutput !== '';

                        return (
                          <tr key={idx} className="bg-slate-950/20 hover:bg-white/5 font-mono">
                            <td className="p-2 text-center font-bold">{pt.percent}%</td>
                            <td className="p-2">{pt.targetInput.toFixed(2)}</td>
                            <td className="p-2">{pt.expectedOutput.toFixed(2)} {instrument.signalType === '4-20 mA' ? 'mA' : instrument.engineeringUnits}</td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="any"
                                required
                                className="w-full bg-slate-900 border border-gray-700 rounded py-1 px-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                                value={pt.asFoundOutput}
                                onChange={(e) => handlePointChange(idx, 'asFoundOutput', e.target.value)}
                                placeholder="0.0"
                              />
                            </td>
                            <td className="p-2 text-center font-mono">
                              {pt.asFoundOutput !== '' ? (
                                <span className={isFoundErrorMpe ? 'text-red-400 font-semibold' : 'text-emerald-400'}>
                                  {pt.asFoundError.toFixed(3)}%
                                </span>
                              ) : (
                                <span className="text-gray-600">-</span>
                              )}
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="any"
                                required
                                className="w-full bg-slate-900 border border-gray-700 rounded py-1 px-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                                value={pt.asLeftOutput}
                                onChange={(e) => handlePointChange(idx, 'asLeftOutput', e.target.value)}
                                placeholder="0.0"
                              />
                            </td>
                            <td className="p-2 text-center font-mono">
                              {pt.asLeftOutput !== '' ? (
                                <span className={isLeftErrorMpe ? 'text-red-400 font-semibold' : 'text-emerald-400'}>
                                  {pt.asLeftError.toFixed(3)}%
                                </span>
                              ) : (
                                <span className="text-gray-600">-</span>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              {hasLeftValue ? (
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold font-sans ${
                                  pt.pass ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                  {pt.pass ? 'PASS' : 'FAIL'}
                                </span>
                              ) : (
                                <span className="text-gray-600">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
 
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Traceable Reference Standards used
                </label>
                {availableStandards.length === 0 ? (
                  <div className="text-xs text-gray-500 italic p-3 bg-slate-900/40 border border-gray-800 rounded-lg">
                    No reference standards registered. Please register reference standards before logging calibration.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-800 rounded-lg p-3 bg-slate-950/20">
                    {availableStandards.map((std) => {
                      const isSelected = selectedStandards.some(s => s.referenceStandardId === std.id);
                      const isExpired = std.status === 'EXPIRED' || new Date(std.calibrationDueDate) < new Date() && std.status !== 'OUT_OF_SERVICE';
                      const isOutOfService = std.status === 'OUT_OF_SERVICE';
                      const isInvalid = isExpired || isOutOfService;

                      const handleCheckboxChange = (checked: boolean) => {
                        if (checked) {
                          setSelectedStandards(prev => [...prev, { referenceStandardId: std.id, usageNotes: '' }]);
                        } else {
                          setSelectedStandards(prev => prev.filter(s => s.referenceStandardId !== std.id));
                        }
                      };

                      const handleNotesChange = (val: string) => {
                        setSelectedStandards(prev => prev.map(s => s.referenceStandardId === std.id ? { ...s, usageNotes: val } : s));
                      };

                      return (
                        <div key={std.id} className="p-2.5 rounded-lg bg-[#0c1220]/60 border border-gray-800/80 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-gray-200">
                              <input
                                type="checkbox"
                                className="rounded border-gray-700 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                                checked={isSelected}
                                onChange={(e) => handleCheckboxChange(e.target.checked)}
                              />
                              <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                                <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 font-bold">
                                  {std.assetTag}
                                </span>
                                {std.manufacturer} {std.model}
                              </span>
                            </label>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-gray-500">S/N: {std.serialNumber}</span>
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                isExpired ? 'bg-red-500/10 text-red-400 border border-red-500/25' :
                                isOutOfService ? 'bg-gray-500/10 text-gray-400 border border-gray-500/25' :
                                std.status === 'DUE_SOON' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                              }`}>
                                {isExpired ? 'EXPIRED' : std.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="pl-6.5 mt-1">
                              <input
                                type="text"
                                className="w-full bg-slate-900 border border-gray-800 rounded py-1 px-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
                                placeholder="Add optional usage notes for this instrument (e.g. Channel calibration used)..."
                                value={selectedStandards.find(s => s.referenceStandardId === std.id)?.usageNotes || ''}
                                onChange={(e) => handleNotesChange(e.target.value)}
                              />
                              {isInvalid && (
                                <p className="text-[10px] text-red-400 mt-1 font-medium flex items-center gap-1">
                                  <ShieldAlert size={11} />
                                  Warning: Using an expired/out-of-service standard will block this record's review submission.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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

      {isWoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl glow-primary border border-white/5 relative">
            <button
              onClick={() => setIsWoModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-1">Create Calibration Work Order</h3>
            <p className="text-gray-400 text-xs mb-6">Schedule calibration validation maintenance task for {instrument.tagNumber}.</p>

            <form onSubmit={handleAddWorkOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none"
                  value={woPriority}
                  onChange={(e) => setWoPriority(e.target.value as any)}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Assigned Technician
                </label>
                <input
                  type="text"
                  placeholder="e.g. Elena Rostova"
                  className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none"
                  value={woTechnician}
                  onChange={(e) => setWoTechnician(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none font-mono text-sm"
                  value={woDate}
                  onChange={(e) => setWoDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Task Description / Work Instructions
                </label>
                <textarea
                  placeholder="e.g. Conduct passing 5-point verification check against ±0.5% MPE spec"
                  className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none h-24 resize-none"
                  value={woDescription}
                  onChange={(e) => setWoDescription(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 text-sm">
                <button
                  type="button"
                  onClick={() => setIsWoModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={woSubmitting}
                  className="btn-transition bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg"
                >
                  {woSubmitting ? 'Creating...' : 'Schedule Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Submission Modal */}
      {isSubmitReviewOpen && reviewCal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0c1220] border border-gray-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-800/80 flex justify-between items-center bg-[#080d16]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Fingerprint className="text-indigo-400" size={18} />
                Submit Calibration for Review
              </h3>
              <button onClick={() => setIsSubmitReviewOpen(false)} className="text-gray-400 hover:text-white transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview}>
              <div className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-indigo-950/15 border border-indigo-900/20 text-gray-300 rounded-lg leading-relaxed">
                  Submit this calibration record for compliance review. Signing certifies that the test points recorded represent the true and accurate verification measurements.
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-400 font-semibold">Technician Name (Signature)</label>
                  <input
                    type="text"
                    required
                    value={submitReviewForm.signerName}
                    onChange={(e) => setSubmitReviewForm(prev => ({ ...prev, signerName: e.target.value }))}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 bg-[#090d16] text-white border border-gray-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-xs"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-800/80 flex justify-end gap-3 bg-[#080d16]">
                <button
                  type="button"
                  onClick={() => setIsSubmitReviewOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 font-semibold rounded-lg border border-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-lg shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Sign & Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Approval Modal */}
      {isApproveReviewOpen && reviewCal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0c1220] border border-gray-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-800/80 flex justify-between items-center bg-[#080d16]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Check size={18} className="text-emerald-400" />
                Sign & Approve Calibration
              </h3>
              <button onClick={() => setIsApproveReviewOpen(false)} className="text-gray-400 hover:text-white transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApproveReview}>
              <div className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-emerald-950/10 border border-emerald-900/20 text-gray-300 rounded-lg leading-relaxed">
                  Confirm quality review check and approve this calibration record. This action recalculates instrument compliance due dates and closes active work orders.
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-400 font-semibold">Reviewer Name (Signature)</label>
                  <input
                    type="text"
                    required
                    value={approveReviewForm.signerName}
                    onChange={(e) => setApproveReviewForm(prev => ({ ...prev, signerName: e.target.value }))}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 bg-[#090d16] text-white border border-gray-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-400 font-semibold">Signer Role</label>
                  <select
                    value={approveReviewForm.signerRole}
                    onChange={(e) => setApproveReviewForm(prev => ({ ...prev, signerRole: e.target.value as any }))}
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
                  onClick={() => setIsApproveReviewOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 font-semibold rounded-lg border border-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-semibold rounded-lg shadow-md shadow-emerald-600/10 transition-all flex items-center gap-1.5"
                >
                  {reviewSubmitting ? 'Approving...' : 'Sign & Approve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Rejection Modal */}
      {isRejectReviewOpen && reviewCal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0c1220] border border-gray-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-800/80 flex justify-between items-center bg-[#080d16]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <X size={18} className="text-rose-400" />
                Reject Compliance Record
              </h3>
              <button onClick={() => setIsRejectReviewOpen(false)} className="text-gray-400 hover:text-white transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRejectReview}>
              <div className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-red-950/15 border border-red-900/20 text-gray-300 rounded-lg leading-relaxed">
                  Reject this calibration record and return it to Draft/Rejected status for correction.
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-400 font-semibold">Reviewer Name (Signature)</label>
                  <input
                    type="text"
                    required
                    value={rejectReviewForm.signerName}
                    onChange={(e) => setRejectReviewForm(prev => ({ ...prev, signerName: e.target.value }))}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 bg-[#090d16] text-white border border-gray-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-400 font-semibold">Signer Role</label>
                  <select
                    value={rejectReviewForm.signerRole}
                    onChange={(e) => setRejectReviewForm(prev => ({ ...prev, signerRole: e.target.value as any }))}
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
                    value={rejectReviewForm.reason}
                    onChange={(e) => setRejectReviewForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Describe the discrepancy/reasons..."
                    className="w-full px-3.5 py-2.5 bg-[#090d16] text-white border border-gray-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-xs resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-800/80 flex justify-end gap-3 bg-[#080d16]">
                <button
                  type="button"
                  onClick={() => setIsRejectReviewOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 font-semibold rounded-lg border border-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white font-semibold rounded-lg shadow-md shadow-rose-600/10 transition-all flex items-center gap-1.5"
                >
                  {reviewSubmitting ? 'Rejecting...' : 'Reject Calibration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
