import { ReferenceStandard } from '@caltrack/types';
import { Award, AlertTriangle } from 'lucide-react';
import { ReferenceStandardStatusBadge } from '../../components/ui/Badge';
import Card from '../../components/ui/Card';

export interface ReferenceStandardsCardProps {
  standards: ReferenceStandard[];
  loading?: boolean;
}

export function ReferenceStandardsCard({ standards, loading }: ReferenceStandardsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Award className="text-indigo-400" size={20} />
          Traceable Reference Standards
        </h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      ) : standards.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-800 rounded-lg">
          No reference standards registered in this facility.
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {standards.map((std) => {
            const isExpired =
              std.status === 'EXPIRED' ||
              (new Date(std.calibrationDueDate) < new Date() && std.status !== 'OUT_OF_SERVICE');

            return (
              <div
                key={std.id}
                className="p-3 bg-slate-900/30 border border-gray-800/80 rounded-xl flex items-center justify-between text-xs font-sans"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-gray-300 flex items-center gap-1.5">
                    <span className="font-mono text-[9px] text-indigo-400 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10 font-bold">
                      {std.assetTag}
                    </span>
                    {std.manufacturer} {std.model}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    S/N: <span className="text-gray-400 font-mono">{std.serialNumber}</span> &bull; 
                    Cert: <span className="text-indigo-400/80 font-mono">{std.certificateNumber}</span>
                  </div>
                  <div className="text-[9px] text-gray-500 font-mono">
                    Accuracy: <span className="text-gray-400">{std.accuracyClass}</span> &bull; 
                    Due: <span className={isExpired ? 'text-red-400 font-semibold' : 'text-gray-400'}>
                      {new Date(std.calibrationDueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <ReferenceStandardStatusBadge status={std.status} />
                  {isExpired && (
                    <span className="text-[9px] text-red-400 flex items-center gap-1">
                      <AlertTriangle size={10} /> Expired Standard
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default ReferenceStandardsCard;
