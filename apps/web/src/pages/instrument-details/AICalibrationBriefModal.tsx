import { Link } from 'react-router-dom';
import { Instrument, TechnicianBriefing } from '@caltrack/types';
import {
  X,
  Sparkles,
  ShieldAlert,
  Cpu,
  AlertTriangle,
  FileText,
  BookOpen,
  Activity,
  Calendar,
  Award,
  CheckSquare,
} from 'lucide-react';

export interface AICalibrationBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  briefingData: TechnicianBriefing | null;
  instrument: Instrument;
}

export function AICalibrationBriefModal({
  isOpen,
  onClose,
  loading,
  error,
  briefingData,
  instrument,
}: AICalibrationBriefModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 overflow-y-auto py-8">
      <div className="w-full max-w-4xl glass-panel p-6 rounded-2xl glow-primary relative my-auto border border-indigo-500/20 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
            <p className="text-xs text-gray-400">Orchestrating agents & querying plant database...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex gap-3 text-xs leading-relaxed">
            <ShieldAlert className="shrink-0 text-red-500" size={18} />
            <div>
              <span className="font-semibold uppercase tracking-wider block mb-0.5">Briefing Generation Failed</span>
              {error}
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
                              <td className="p-2">
                                {pt.expectedOutput.toFixed(2)}{' '}
                                {instrument.signalType === '4-20 mA' ? 'mA' : instrument.engineeringUnits}
                              </td>
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
                          <span className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                            Recommended Procedure
                          </span>
                          {briefingData.technicalDocumentation.recommendedProcedure ? (
                            <Link
                              to={`/documentation/${briefingData.technicalDocumentation.recommendedProcedure.id}`}
                              className="text-indigo-400 hover:text-indigo-300 font-bold block mt-1 hover:underline"
                              onClick={onClose}
                            >
                              {briefingData.technicalDocumentation.recommendedProcedure.title}
                            </Link>
                          ) : (
                            <span className="text-gray-500 italic block mt-1 font-sans">No procedure linked</span>
                          )}
                        </div>
                        {briefingData.technicalDocumentation.recommendedProcedure && (
                          <span className="text-[10px] text-gray-500 font-mono mt-1.5 block">
                            {briefingData.technicalDocumentation.recommendedProcedure.documentNumber} (Rev{' '}
                            {briefingData.technicalDocumentation.recommendedProcedure.revision})
                          </span>
                        )}
                      </div>

                      {/* Manufacturer Manual */}
                      <div className="p-3 bg-[#090d16]/40 border border-gray-800/60 rounded-lg flex flex-col justify-between">
                        <div>
                          <span className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                            Manufacturer Manual
                          </span>
                          {briefingData.technicalDocumentation.manufacturerManual ? (
                            <Link
                              to={`/documentation/${briefingData.technicalDocumentation.manufacturerManual.id}`}
                              className="text-indigo-400 hover:text-indigo-300 font-bold block mt-1 hover:underline"
                              onClick={onClose}
                            >
                              {briefingData.technicalDocumentation.manufacturerManual.title}
                            </Link>
                          ) : (
                            <span className="text-gray-500 italic block mt-1 font-sans">No manual linked</span>
                          )}
                        </div>
                        {briefingData.technicalDocumentation.manufacturerManual && (
                          <span className="text-[10px] text-gray-500 font-mono mt-1.5 block">
                            {briefingData.technicalDocumentation.manufacturerManual.documentNumber} (Rev{' '}
                            {briefingData.technicalDocumentation.manufacturerManual.revision})
                          </span>
                        )}
                      </div>

                      {/* Installation Guide */}
                      <div className="p-3 bg-[#090d16]/40 border border-gray-800/60 rounded-lg flex flex-col justify-between">
                        <div>
                          <span className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                            Installation Guide
                          </span>
                          {briefingData.technicalDocumentation.installationGuide ? (
                            <Link
                              to={`/documentation/${briefingData.technicalDocumentation.installationGuide.id}`}
                              className="text-indigo-400 hover:text-indigo-300 font-bold block mt-1 hover:underline"
                              onClick={onClose}
                            >
                              {briefingData.technicalDocumentation.installationGuide.title}
                            </Link>
                          ) : (
                            <span className="text-gray-500 italic block mt-1 font-sans">No installation guide linked</span>
                          )}
                        </div>
                        {briefingData.technicalDocumentation.installationGuide && (
                          <span className="text-[10px] text-gray-500 font-mono mt-1.5 block">
                            {briefingData.technicalDocumentation.installationGuide.documentNumber} (Rev{' '}
                            {briefingData.technicalDocumentation.installationGuide.revision})
                          </span>
                        )}
                      </div>

                      {/* Safety Notes */}
                      <div className="p-3 bg-[#090d16]/40 border border-gray-800/60 rounded-lg flex flex-col justify-between">
                        <div>
                          <span className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                            Safety Notes
                          </span>
                          {briefingData.technicalDocumentation.safetyNotes ? (
                            <Link
                              to={`/documentation/${briefingData.technicalDocumentation.safetyNotes.id}`}
                              className="text-indigo-400 hover:text-indigo-300 font-bold block mt-1 hover:underline"
                              onClick={onClose}
                            >
                              {briefingData.technicalDocumentation.safetyNotes.title}
                            </Link>
                          ) : (
                            <span className="text-gray-500 italic block mt-1 font-sans">No safety notes linked</span>
                          )}
                        </div>
                        {briefingData.technicalDocumentation.safetyNotes && (
                          <span className="text-[10px] text-gray-500 font-mono mt-1.5 block">
                            {briefingData.technicalDocumentation.safetyNotes.documentNumber} (Rev{' '}
                            {briefingData.technicalDocumentation.safetyNotes.revision})
                          </span>
                        )}
                      </div>

                      {/* Troubleshooting Guide */}
                      <div className="p-3 bg-[#090d16]/40 border border-gray-800/60 rounded-lg flex flex-col justify-between">
                        <div>
                          <span className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                            Troubleshooting Guide
                          </span>
                          {briefingData.technicalDocumentation.troubleshootingGuide ? (
                            <Link
                              to={`/documentation/${briefingData.technicalDocumentation.troubleshootingGuide.id}`}
                              className="text-indigo-400 hover:text-indigo-300 font-bold block mt-1 hover:underline"
                              onClick={onClose}
                            >
                              {briefingData.technicalDocumentation.troubleshootingGuide.title}
                            </Link>
                          ) : (
                            <span className="text-gray-500 italic block mt-1 font-sans">No troubleshooting guide linked</span>
                          )}
                        </div>
                        {briefingData.technicalDocumentation.troubleshootingGuide && (
                          <span className="text-[10px] text-gray-500 font-mono mt-1.5 block">
                            {briefingData.technicalDocumentation.troubleshootingGuide.documentNumber} (Rev{' '}
                            {briefingData.technicalDocumentation.troubleshootingGuide.revision})
                          </span>
                        )}
                      </div>

                      {/* Related Drawings */}
                      <div className="p-3 bg-[#090d16]/40 border border-gray-800/60 rounded-lg flex flex-col justify-between">
                        <div>
                          <span className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">
                            Related Drawings
                          </span>
                          {briefingData.technicalDocumentation.relatedDrawings &&
                          briefingData.technicalDocumentation.relatedDrawings.length > 0 ? (
                            <div className="space-y-1.5 mt-1">
                              {briefingData.technicalDocumentation.relatedDrawings.map((drawing) => (
                                <div key={drawing.id} className="flex items-center justify-between text-[11px] font-sans">
                                  <Link
                                    to={`/documentation/${drawing.id}`}
                                    className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline truncate max-w-[170px]"
                                    onClick={onClose}
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
                      <span className="text-white font-mono font-bold">
                        {briefingData.calibrationHistory.numberOfHistoricalCalibrations} records
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                      <span className="text-gray-500">Last Calibrated</span>
                      <span className="text-white font-medium">
                        {briefingData.calibrationHistory.lastCalibrationDate}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800/40 pb-1.5">
                      <span className="text-gray-500">Last Outcome</span>
                      <span
                        className={`font-bold ${
                          briefingData.calibrationHistory.passFail === 'PASS'
                            ? 'text-emerald-400'
                            : briefingData.calibrationHistory.passFail === 'FAIL'
                            ? 'text-rose-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {briefingData.calibrationHistory.passFail}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Previous Tech</span>
                      <span className="text-white font-medium">
                        {briefingData.calibrationHistory.previousTechnician}
                      </span>
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
                        <div
                          key={idx}
                          className="p-2.5 bg-[#090d16]/30 border border-gray-800/60 rounded-xl space-y-1 font-sans"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10 font-bold">
                              {std.assetTag}
                            </span>
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                std.isExpired
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/25'
                                  : std.status === 'DUE_SOON'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                              }`}
                            >
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
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-2 bg-[#090d16]/20 border border-gray-800/40 rounded-lg text-xs text-gray-300 select-none"
                  >
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
                Generated guidance must be verified against site procedures, manufacturer documentation, and approved quality
                requirements. This assistant supports technician preparation but does not replace official procedures or
                qualified review.
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 text-sm mt-5">
          <button
            type="button"
            onClick={onClose}
            className="btn-transition bg-[#1f2937] hover:bg-[#374151] border border-white/5 text-gray-300 font-semibold py-2 px-6 rounded-lg text-xs font-sans"
          >
            Close Briefing
          </button>
        </div>
      </div>
    </div>
  );
}

export default AICalibrationBriefModal;
