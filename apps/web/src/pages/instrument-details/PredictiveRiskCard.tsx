import { InstrumentIntelligenceSummary } from '@caltrack/types';
import { AlertTriangle, TrendingUp, CheckCircle2, XCircle, BrainCircuit } from 'lucide-react';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

export interface PredictiveRiskCardProps {
  summary: InstrumentIntelligenceSummary | null;
  loading?: boolean;
}

export default function PredictiveRiskCard({ summary, loading }: PredictiveRiskCardProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BrainCircuit className="text-indigo-400" size={20} />
          Predictive Risk Analysis
        </h3>
        <div className="flex items-center justify-center py-6">
          <Spinner size="md" />
        </div>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BrainCircuit className="text-indigo-400" size={20} />
          Predictive Risk Analysis
        </h3>
        <p className="text-gray-500 text-sm italic">No predictive telemetry available.</p>
      </Card>
    );
  }

  const getRiskBadgeStyles = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse';
      case 'HIGH':
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'LOW':
      default:
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    }
  };

  const getGlowStyle = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return 'glow-danger border-red-500/20';
      case 'HIGH':
        return 'glow-warning border-rose-500/20';
      case 'MEDIUM':
        return 'border-amber-500/20';
      case 'LOW':
      default:
        return 'border-emerald-500/10';
    }
  };

  const getDriftIcon = (drift: string) => {
    switch (drift) {
      case 'UPWARD':
        return <TrendingUp className="text-rose-400 inline shrink-0" size={16} />;
      case 'DOWNWARD':
        return <TrendingUp className="text-blue-400 rotate-90 inline shrink-0" size={16} />;
      case 'STABLE':
        return <CheckCircle2 className="text-emerald-400 inline shrink-0" size={16} />;
      case 'NONE':
      default:
        return null;
    }
  };

  return (
    <Card className={`p-6 relative overflow-hidden transition-all duration-300 ${getGlowStyle(summary.riskLevel)}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <BrainCircuit className="text-indigo-400" size={20} />
          Predictive Risk Analysis
        </h3>
        <span className={`px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider ${getRiskBadgeStyles(summary.riskLevel)}`}>
          {summary.riskLevel} RISK
        </span>
      </div>

      <div className="space-y-4">
        {/* Pass rate & failures stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/50 p-3 rounded-lg border border-gray-800">
            <span className="block text-[10px] uppercase font-bold text-gray-500">Historical Pass Rate</span>
            <span className={`block text-xl font-extrabold mt-1 ${summary.passRate < 0.8 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {Math.round(summary.passRate * 100)}%
            </span>
            <span className="block text-[9px] text-gray-400 mt-0.5">
              {summary.totalCalibrations - summary.failedCalibrations}/{summary.totalCalibrations} passed
            </span>
          </div>

          <div className="bg-slate-900/50 p-3 rounded-lg border border-gray-800">
            <span className="block text-[10px] uppercase font-bold text-gray-500">Last Outcome</span>
            <span className="block text-xl font-extrabold mt-1">
              {summary.lastCalibrationPass === null ? (
                <span className="text-gray-400">N/A</span>
              ) : summary.lastCalibrationPass ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={16} /> PASS
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <XCircle size={16} /> FAIL
                </span>
              )}
            </span>
            <span className="block text-[9px] text-gray-400 mt-0.5">
              {summary.lastCalibrationDate ? new Date(summary.lastCalibrationDate).toLocaleDateString() : 'No dates logged'}
            </span>
          </div>
        </div>

        {/* Drift Direction & Worst Point Error */}
        <div className="space-y-2 bg-slate-900/50 p-3 rounded-lg border border-gray-800">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">Drift Vector:</span>
            <span className="font-mono font-bold text-white flex items-center gap-1">
              {getDriftIcon(summary.driftDirection)}
              {summary.driftDirection}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs border-t border-gray-800/80 pt-2">
            <span className="text-gray-400">Max Error Spike:</span>
            <span className="font-mono font-bold text-white">
              {summary.worstTestPointError > 0 ? `${summary.worstTestPointError.toFixed(3)}%` : '0.000%'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs border-t border-gray-800/80 pt-2">
            <span className="text-gray-400">Avg Left Error Offset:</span>
            <span className="font-mono text-gray-300">
              {summary.avgAbsoluteAsLeftError > 0 ? `${summary.avgAbsoluteAsLeftError.toFixed(3)}%` : '0.000%'}
            </span>
          </div>
        </div>

        {/* Attention Items / Maintenance Guidelines */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recommended Attention Items</span>
          <div className="space-y-1.5">
            {summary.recommendedAttentionItems.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start text-xs p-2 rounded bg-indigo-950/20 border border-indigo-900/20 text-indigo-200">
                <AlertTriangle size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
