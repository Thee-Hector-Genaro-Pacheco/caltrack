import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import {
  Instrument,
  CalibrationRecord,
  WorkOrderPriority,
  ReferenceStandard,
  CalibrationPrepGuidance,
  TechnicianBriefing,
  AuditEvent,
  InstrumentIntelligenceSummary,
} from '@caltrack/types';
import PredictiveRiskCard from './instrument-details/PredictiveRiskCard';
import {
  ArrowLeft,
  Plus,
  ShieldAlert,
  Trash2,
  Edit3,
  Award,
  Sparkles,
  ListTodo,
  HelpCircle,
  Activity,
  FileCheck,
  Cpu,
} from 'lucide-react';

import DeviceSpecsCard from './instrument-details/DeviceSpecsCard';
import CalibrationHistoryCard from './instrument-details/CalibrationHistoryCard';
import AICalibrationBriefModal from './instrument-details/AICalibrationBriefModal';
import WorkOrdersCard from './instrument-details/WorkOrdersCard';
import DocumentationCard from './instrument-details/DocumentationCard';
import ReferenceStandardsCard from './instrument-details/ReferenceStandardsCard';
import AuditEventsCard from './instrument-details/AuditEventsCard';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { InstrumentStatusBadge } from '../components/ui/Badge';

interface LocalTestPoint {
  percent: number;
  targetInput: number;
  expectedOutput: number;
  asFoundOutput: string;
  asLeftOutput: string;
  asFoundError: number;
  asLeftError: number;
  pass: boolean;
}

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
  const [testPoints, setTestPoints] = useState<LocalTestPoint[]>([]);

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
  const [intelligenceSummary, setIntelligenceSummary] = useState<InstrumentIntelligenceSummary | null>(null);
  const [intelligenceLoading, setIntelligenceLoading] = useState(true);

  const [prepGuidance, setPrepGuidance] = useState<CalibrationPrepGuidance | null>(null);
  const [prepLoading, setPrepLoading] = useState(false);
  const [prepError, setPrepError] = useState<string | null>(null);

  const [briefingData, setBriefingData] = useState<TechnicianBriefing | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);

  const [audits, setAudits] = useState<AuditEvent[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(false);

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
      const initialPoints = percentages.map((p) => {
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

    const outputSpan = instrument?.signalType === '4-20 mA' ? 16 : instrument!.rangeMax - instrument!.rangeMin;
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
    api
      .getReferenceStandards()
      .then((res) => setAvailableStandards(res))
      .catch((err) => console.error('Error fetching reference standards:', err));
  }, [id]);

  const fetchDetails = () => {
    setLoading(true);
    
    // Fetch intelligence summary
    setIntelligenceLoading(true);
    api.getInstrumentIntelligence(id!)
      .then((intelRes) => {
        setIntelligenceSummary(intelRes);
        setIntelligenceLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching intelligence summary:', err);
        setIntelligenceLoading(false);
      });

    api
      .getInstrument(id!)
      .then((res) => {
        setInstrument(res);
        setLoading(false);

        // Fetch instrument specific compliance audit timeline
        setAuditsLoading(true);
        api.getAuditTrail()
          .then((auditRes) => {
            const instrumentAudits = auditRes.filter((event) => {
              const isDirect = event.entityId === id;
              const isCalibration = event.entityType === 'CALIBRATION' && res.calibrations?.some(c => c.id === event.entityId);
              const isWorkOrder = event.entityType === 'WORK_ORDER' && res.workOrders?.some(w => w.id === event.entityId);
              return isDirect || isCalibration || isWorkOrder;
            });
            setAudits(instrumentAudits);
            setAuditsLoading(false);
          })
          .catch((err) => {
            console.error('Error fetching audits:', err);
            setAuditsLoading(false);
          });
      })
      .catch((err) => {
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
        testPoints: testPoints.map((pt) => ({
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
        status: 'OPEN',
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
      await api.rejectCalibration(
        reviewCal.id,
        rejectReviewForm.signerName,
        rejectReviewForm.signerRole,
        rejectReviewForm.reason
      );
      setIsRejectReviewOpen(false);
      setReviewCal(null);
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to reject calibration.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return <Spinner minHeight="400px" size="lg" />;
  }

  if (error || !instrument) {
    return (
      <div className="p-6 glass-panel rounded-xl text-center max-w-xl mx-auto mt-10 border border-red-500/20 font-sans">
        <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Registry Error</h2>
        <p className="text-gray-400">{error || 'Device not found.'}</p>
        <Link to="/instruments" className="mt-6 inline-block text-indigo-400 hover:underline">
          Back to index
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/instruments"
            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
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
            type="button"
          >
            <Trash2 size={16} />
            Decommission
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-6 rounded-xl border border-white/5 space-y-6">
          <DeviceSpecsCard instrument={instrument} />
        </div>

        <div className="space-y-6 flex flex-col">
          <div className="glass-card p-6 rounded-xl border border-white/5 flex flex-col justify-between flex-grow">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Compliance Status</h3>

              <div className="flex items-center gap-3 mt-2">
                <InstrumentStatusBadge status={instrument.status} />
              </div>

              <p className="text-gray-400 text-xs mt-3 leading-relaxed font-sans">
                {instrument.status === 'ACTIVE'
                  ? 'Operational state validated. The metrology loop registers true and accurate signals.'
                  : instrument.status === 'CALIBRATION_DUE'
                  ? 'Validation interval reached. Schedule routine service tasks to maintain regulatory compliance.'
                  : instrument.status === 'OVERDUE'
                  ? 'CRITICAL: Device has exceeded validation limits. Operation is uncertified.'
                  : 'Instrument is offline/inactive and not being tracked for calibrations.'}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-6 border-t border-gray-800/80 mt-6 font-sans">
              <button
                onClick={() => setIsCalModalOpen(true)}
                className="btn-transition bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2"
                type="button"
              >
                <Plus size={16} />
                Log Calibration Test
              </button>

              <button
                onClick={handleOpenBrief}
                className="btn-transition bg-slate-800 hover:bg-slate-700 border border-white/5 text-gray-200 font-semibold py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2"
                type="button"
              >
                <Sparkles size={16} className="text-indigo-400" />
                AI Calibration Assistant
              </button>
            </div>
          </div>

          <PredictiveRiskCard summary={intelligenceSummary} loading={intelligenceLoading} />
        </div>
      </div>

      {!prepGuidance ? (
        <div className="glass-card p-6 rounded-xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="text-indigo-400 animate-pulse" size={18} />
              Generate AI Calibration Guidance
            </h3>
            <p className="text-xs text-gray-400 mt-1 font-sans">
              Orchestrate engineering agents to analyze location safety hazards, connection instructions, and expected
              target ranges.
            </p>
          </div>
          <button
            onClick={handleGeneratePrep}
            disabled={prepLoading}
            className="btn-transition px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shrink-0 flex items-center gap-2 shadow-lg shadow-indigo-600/10 font-sans"
            type="button"
          >
            {prepLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
            ) : (
              <Sparkles size={16} />
            )}
            {prepLoading ? 'Orchestrating...' : 'Prepare Guidance'}
          </button>
        </div>
      ) : (
        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="text-indigo-400" size={20} />
              AI Calibration Guidance Checklist
            </h3>
            <span className="text-[10px] text-gray-500 font-mono">Target: {instrument.tagNumber}</span>
          </div>

          {prepError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-sans">{prepError}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {/* Required Equipment */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <Cpu size={16} className="text-indigo-400" />
                Required Equipment
              </h4>
              <ul className="space-y-2 bg-[#090d16]/40 border border-gray-800/80 rounded-xl p-4 text-xs text-gray-300 font-sans">
                {prepGuidance.requiredEquipment.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Reference Standards */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <Award size={16} className="text-indigo-400" />
                Recommended Reference Standards
              </h4>
              <ul className="space-y-2 bg-[#090d16]/40 border border-gray-800/80 rounded-xl p-4 text-xs text-gray-300 font-sans">
                {prepGuidance.referenceStandards.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Safety Precautions & Setup Instructions */}
            {/* Safety Precautions */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <ShieldAlert size={16} className="text-red-400" />
                Safety Precautions
              </h4>
              <ul className="space-y-2 bg-[#090d16]/40 border border-gray-800/80 rounded-xl p-4 text-xs text-gray-300 font-sans">
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
              <ol className="space-y-2.5 bg-[#090d16]/40 border border-gray-800/80 rounded-xl p-4 text-xs text-gray-300 list-decimal pl-6 font-sans">
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
                  <tr className="bg-slate-900/80 border-b border-gray-800 text-gray-400 font-semibold uppercase tracking-wider bg-slate-900">
                    <th className="p-3 text-center w-24">% Test Point</th>
                    <th className="p-3">Target Input Value ({instrument.engineeringUnits})</th>
                    <th className="p-3">Expected Output ({instrument.signalType})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-gray-300 font-mono">
                  {prepGuidance.testPoints.map((pt, idx) => (
                    <tr key={idx} className="hover:bg-white/5 bg-[#090d16]/10">
                      <td className="p-3 text-center font-bold text-indigo-400 bg-indigo-500/5">{pt.percent}%</td>
                      <td className="p-3">
                        {pt.targetInput.toFixed(2)} {instrument.engineeringUnits}
                      </td>
                      <td className="p-3">
                        {pt.expectedOutput.toFixed(2)}{' '}
                        {instrument.signalType === '4-20 mA' ? 'mA' : instrument.engineeringUnits}
                      </td>
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
              <ul className="space-y-2 bg-[#090d16]/40 border border-gray-800/80 rounded-xl p-4 text-xs text-gray-300 font-sans">
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
              <ul className="space-y-2 bg-[#090d16]/40 border border-gray-800/80 rounded-xl p-4 text-xs text-gray-300 font-sans">
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

      <AICalibrationBriefModal
        isOpen={isBriefModalOpen}
        onClose={() => setIsBriefModalOpen(false)}
        loading={briefLoading}
        error={briefError}
        briefingData={briefingData}
        instrument={instrument}
      />

      <CalibrationHistoryCard
        instrument={instrument}
        expandedCalId={expandedCalId}
        setExpandedCalId={setExpandedCalId}
        onOpenSubmitReview={handleOpenSubmitReview}
        onOpenApproveReview={handleOpenApproveReview}
        onOpenRejectReview={handleOpenRejectReview}
      />

      <WorkOrdersCard instrument={instrument} onScheduleClick={() => setIsWoModalOpen(true)} />

      <DocumentationCard instrument={instrument} />

      <ReferenceStandardsCard standards={availableStandards} />

      <AuditEventsCard audits={audits} loading={auditsLoading} />

      <Modal
        isOpen={isCalModalOpen}
        onClose={() => setIsCalModalOpen(false)}
        title="New 5-Point Calibration Record"
        description={`Log field validation findings. Acceptable tolerance limits: ±${instrument.maxPermissibleError}% MPE.`}
        size="3xl"
        glow
        glowType="primary"
      >
        <form onSubmit={handleAddCalibration} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Calibration Date
              </label>
              <input
                type="date"
                required
                className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 font-sans">
              Calibration Test Grid (5-Point Check)
            </label>
            <div className="overflow-x-auto border border-gray-800 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-gray-800 text-gray-400 font-semibold uppercase tracking-wider font-sans">
                    <th className="p-2 w-16 text-center">% Test</th>
                    <th className="p-2">Target Input ({instrument.engineeringUnits})</th>
                    <th className="p-2">Expected Output</th>
                    <th className="p-2 w-28">
                      As Found ({instrument.signalType === '4-20 mA' ? 'mA' : instrument.engineeringUnits})
                    </th>
                    <th className="p-2 text-center w-24">Found Error</th>
                    <th className="p-2 w-28">
                      As Left ({instrument.signalType === '4-20 mA' ? 'mA' : instrument.engineeringUnits})
                    </th>
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
                        <td className="p-2">
                          {pt.expectedOutput.toFixed(2)}{' '}
                          {instrument.signalType === '4-20 mA' ? 'mA' : instrument.engineeringUnits}
                        </td>
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
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold font-sans ${
                                pt.pass
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}
                            >
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

          <div className="font-sans">
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
                  const isSelected = selectedStandards.some((s) => s.referenceStandardId === std.id);
                  const isExpired =
                    std.status === 'EXPIRED' ||
                    (new Date(std.calibrationDueDate) < new Date() && std.status !== 'OUT_OF_SERVICE');
                  const isOutOfService = std.status === 'OUT_OF_SERVICE';
                  const isInvalid = isExpired || isOutOfService;

                  const handleCheckboxChange = (checked: boolean) => {
                    if (checked) {
                      setSelectedStandards((prev) => [...prev, { referenceStandardId: std.id, usageNotes: '' }]);
                    } else {
                      setSelectedStandards((prev) => prev.filter((s) => s.referenceStandardId !== std.id));
                    }
                  };

                  const handleNotesChange = (val: string) => {
                    setSelectedStandards((prev) =>
                      prev.map((s) => (s.referenceStandardId === std.id ? { ...s, usageNotes: val } : s))
                    );
                  };

                  return (
                    <div
                      key={std.id}
                      className="p-2.5 rounded-lg bg-[#0c1220]/60 border border-gray-800/80 flex flex-col gap-2 font-sans"
                    >
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
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              isExpired
                                ? 'bg-red-500/10 text-red-400 border border-red-500/25'
                                : isOutOfService
                                ? 'bg-gray-500/10 text-gray-400 border border-gray-500/25'
                                : std.status === 'DUE_SOON'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                            }`}
                          >
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
                            value={selectedStandards.find((s) => s.referenceStandardId === std.id)?.usageNotes || ''}
                            onChange={(e) => handleNotesChange(e.target.value)}
                          />
                          {isInvalid && (
                            <p className="text-[10px] text-red-400 mt-1 font-medium flex items-center gap-1 font-sans">
                              <ShieldAlert size={11} />
                              Warning: Using an expired/out-of-service standard will block this record's review
                              submission.
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

          <div className="font-sans">
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

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 text-sm font-sans">
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
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Decommission Instrument"
        description="Decommissioning will remove this device from active tracking. This is an audited action."
        size="md"
      >
        <form onSubmit={handleDeleteInstrument} className="space-y-4 font-sans">
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
      </Modal>

      <Modal
        isOpen={isWoModalOpen}
        onClose={() => setIsWoModalOpen(false)}
        title="Create Calibration Work Order"
        description={`Schedule calibration validation maintenance task for ${instrument.tagNumber}.`}
        size="md"
        glow
        glowType="primary"
      >
        <form onSubmit={handleAddWorkOrder} className="space-y-4 font-sans">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Priority</label>
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
      </Modal>

      {/* Review Submission Modal */}
      {isSubmitReviewOpen && reviewCal && (
        <Modal
          isOpen={isSubmitReviewOpen}
          onClose={() => setIsSubmitReviewOpen(false)}
          title="Submit Calibration for Review"
          size="md"
        >
          <form onSubmit={handleSubmitReview}>
            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="p-3 bg-indigo-950/15 border border-indigo-900/20 text-gray-300 rounded-lg leading-relaxed">
                Submit this calibration record for compliance review. Signing certifies that the test points recorded
                represent the true and accurate verification measurements.
              </div>

              <div className="space-y-1">
                <label className="block text-gray-400 font-semibold">Technician Name (Signature)</label>
                <input
                  type="text"
                  required
                  value={submitReviewForm.signerName}
                  onChange={(e) => setSubmitReviewForm((prev) => ({ ...prev, signerName: e.target.value }))}
                  placeholder="Enter your full name"
                  className="w-full px-3.5 py-2.5 bg-[#090d16] text-white border border-gray-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-xs"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-800/80 flex justify-end gap-3 bg-[#080d16] text-xs font-sans">
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
        </Modal>
      )}

      {/* Review Approval Modal */}
      {isApproveReviewOpen && reviewCal && (
        <Modal
          isOpen={isApproveReviewOpen}
          onClose={() => setIsApproveReviewOpen(false)}
          title="Sign & Approve Calibration"
          size="md"
        >
          <form onSubmit={handleApproveReview}>
            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="p-3 bg-emerald-950/10 border border-emerald-900/20 text-gray-300 rounded-lg leading-relaxed">
                Confirm quality review check and approve this calibration record. This action recalculates instrument
                compliance due dates and closes active work orders.
              </div>

              <div className="space-y-1">
                <label className="block text-gray-400 font-semibold">Reviewer Name (Signature)</label>
                <input
                  type="text"
                  required
                  value={approveReviewForm.signerName}
                  onChange={(e) => setApproveReviewForm((prev) => ({ ...prev, signerName: e.target.value }))}
                  placeholder="Enter your full name"
                  className="w-full px-3.5 py-2.5 bg-[#090d16] text-white border border-gray-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-gray-400 font-semibold">Signer Role</label>
                <select
                  value={approveReviewForm.signerRole}
                  onChange={(e) => setApproveReviewForm((prev) => ({ ...prev, signerRole: e.target.value as any }))}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] text-white border border-gray-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-xs"
                >
                  <option value="SUPERVISOR">Supervisor / Approver</option>
                  <option value="QA">Quality Assurance (QA)</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-800/80 flex justify-end gap-3 bg-[#080d16] text-xs font-sans">
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
        </Modal>
      )}

      {/* Review Rejection Modal */}
      {isRejectReviewOpen && reviewCal && (
        <Modal
          isOpen={isRejectReviewOpen}
          onClose={() => setIsRejectReviewOpen(false)}
          title="Reject Compliance Record"
          size="md"
        >
          <form onSubmit={handleRejectReview}>
            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="p-3 bg-red-950/15 border border-red-900/20 text-gray-300 rounded-lg leading-relaxed">
                Reject this calibration record and return it to Draft/Rejected status for correction.
              </div>

              <div className="space-y-1">
                <label className="block text-gray-400 font-semibold">Reviewer Name (Signature)</label>
                <input
                  type="text"
                  required
                  value={rejectReviewForm.signerName}
                  onChange={(e) => setRejectReviewForm((prev) => ({ ...prev, signerName: e.target.value }))}
                  placeholder="Enter your full name"
                  className="w-full px-3.5 py-2.5 bg-[#090d16] text-white border border-gray-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-gray-400 font-semibold">Signer Role</label>
                <select
                  value={rejectReviewForm.signerRole}
                  onChange={(e) => setRejectReviewForm((prev) => ({ ...prev, signerRole: e.target.value as any }))}
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
                  onChange={(e) => setRejectReviewForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Describe the discrepancy/reasons..."
                  className="w-full px-3.5 py-2.5 bg-[#090d16] text-white border border-gray-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-xs resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-800/80 flex justify-end gap-3 bg-[#080d16] text-xs font-sans">
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
        </Modal>
      )}
    </div>
  );
}
