import { Link } from 'react-router-dom';
import { Instrument } from '@caltrack/types';
import { formatDate } from '@caltrack/utils';

export interface DeviceSpecsCardProps {
  instrument: Instrument;
}

export function DeviceSpecsCard({ instrument }: DeviceSpecsCardProps) {
  return (
    <>
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
    </>
  );
}

export default DeviceSpecsCard;
