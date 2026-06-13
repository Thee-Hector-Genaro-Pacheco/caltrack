import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { CreateInstrumentDto, ProcessArea, ControlLoop } from '@caltrack/types';
import { ArrowLeft, Check, ShieldAlert } from 'lucide-react';

export default function InstrumentNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [processAreas, setProcessAreas] = useState<ProcessArea[]>([]);
  const [controlLoops, setControlLoops] = useState<ControlLoop[]>([]);

  const [formData, setFormData] = useState<CreateInstrumentDto>({
    tagNumber: '',
    instrumentType: 'Pressure Transmitter',
    manufacturer: '',
    model: '',
    rangeMin: 0,
    rangeMax: 100,
    engineeringUnits: 'PSI',
    signalType: '4-20 mA',
    location: '',
    status: 'ACTIVE',
    maxPermissibleError: 0.5,
    processAreaId: null,
    controlLoopId: null,
    calibrationIntervalMonths: 12,
    lastCalibrationDate: null,
  });

  useEffect(() => {
    const loadHierarchy = async () => {
      try {
        const [areas, loops] = await Promise.all([
          api.getProcessAreas(),
          api.getControlLoops()
        ]);
        setProcessAreas(areas);
        setControlLoops(loops);
      } catch (err) {
        console.error('Failed to load hierarchy data', err);
      }
    };
    loadHierarchy();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: name === 'rangeMin' || name === 'rangeMax' || name === 'maxPermissibleError'
          ? parseFloat(value) || 0
          : name === 'calibrationIntervalMonths'
            ? parseInt(value) || 12
            : (name === 'processAreaId' || name === 'controlLoopId') && value === ''
              ? null
              : value,
      };

      // Smart UX Rules:
      // 1. If processAreaId changed, check if current controlLoop belongs to it. If not, reset it.
      if (name === 'processAreaId') {
        if (value === '') {
          next.controlLoopId = null;
        } else {
          const selectedLoop = controlLoops.find(l => l.id === prev.controlLoopId);
          if (selectedLoop && selectedLoop.processAreaId !== value) {
            next.controlLoopId = null;
          }
        }
      }

      // 2. If controlLoopId changed, auto-select its processAreaId if it has one.
      if (name === 'controlLoopId' && value !== '') {
        const selectedLoop = controlLoops.find(l => l.id === value);
        if (selectedLoop) {
          next.processAreaId = selectedLoop.processAreaId;
        }
      }

      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const inst = await api.createInstrument(formData);
      navigate(`/instruments/${inst.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to register instrument.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/instruments" className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Register New Instrument</h1>
          <p className="text-gray-400 mt-1">Insert parameters to enroll field device into database registry.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/30 text-red-200 text-sm rounded-lg flex gap-3">
          <ShieldAlert className="shrink-0" size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-8 rounded-xl border border-white/5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Tag Number *
            </label>
            <input
              type="text"
              name="tagNumber"
              required
              className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              placeholder="e.g. PT-101, TT-202"
              value={formData.tagNumber}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Instrument Type
            </label>
            <select
              name="instrumentType"
              className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              value={formData.instrumentType}
              onChange={handleChange}
            >
              <option value="Pressure Transmitter">Pressure Transmitter</option>
              <option value="Temperature Transmitter">Temperature Transmitter</option>
              <option value="Flow Transmitter">Flow Transmitter</option>
              <option value="Level Radar">Level Radar</option>
              <option value="Control Valve">Control Valve</option>
              <option value="Limit Switch">Limit Switch</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Manufacturer *
            </label>
            <input
              type="text"
              name="manufacturer"
              required
              className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              placeholder="e.g. Rosemount, Yokogawa"
              value={formData.manufacturer}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Model *
            </label>
            <input
              type="text"
              name="model"
              required
              className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              placeholder="e.g. 3051S, YTA610"
              value={formData.model}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Range Minimum *
            </label>
            <input
              type="number"
              step="any"
              name="rangeMin"
              required
              className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              value={formData.rangeMin}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Range Maximum *
            </label>
            <input
              type="number"
              step="any"
              name="rangeMax"
              required
              className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              value={formData.rangeMax}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Engineering Units *
            </label>
            <input
              type="text"
              name="engineeringUnits"
              required
              className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              placeholder="e.g. PSI, °C, GPM, FT"
              value={formData.engineeringUnits}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Signal Type *
            </label>
            <input
              type="text"
              name="signalType"
              required
              className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              placeholder="e.g. 4-20 mA, HART, Modbus"
              value={formData.signalType}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Process Area
            </label>
            <select
              name="processAreaId"
              className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              value={formData.processAreaId || ''}
              onChange={handleChange}
            >
              <option value="">-- Unassigned --</option>
              {processAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.areaCode} - {area.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Control Loop
            </label>
            <select
              name="controlLoopId"
              className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              value={formData.controlLoopId || ''}
              onChange={handleChange}
            >
              <option value="">-- Unassigned --</option>
              {controlLoops
                .filter((loop) => !formData.processAreaId || loop.processAreaId === formData.processAreaId)
                .map((loop) => (
                  <option key={loop.id} value={loop.id}>
                    {loop.loopTag} ({loop.loopNumber})
                  </option>
                ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Physical Location *
            </label>
            <input
              type="text"
              name="location"
              required
              className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              placeholder="e.g. Boiler House Feed Line, Crude Storage T-102"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Operational Status
            </label>
            <select
              name="status"
              className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="CALIBRATION_DUE">CALIBRATION DUE</option>
              <option value="OVERDUE">OVERDUE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Max Permissible Error (MPE %) *
            </label>
            <input
              type="number"
              step="any"
              name="maxPermissibleError"
              required
              className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              placeholder="e.g. 0.5 for ±0.5%"
              value={formData.maxPermissibleError}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Calibration Interval (Months) *
            </label>
            <input
              type="number"
              name="calibrationIntervalMonths"
              required
              min="1"
              className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono"
              value={formData.calibrationIntervalMonths || 12}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Last Calibration Date
            </label>
            <input
              type="date"
              name="lastCalibrationDate"
              className="w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono text-sm"
              value={formData.lastCalibrationDate ? new Date(formData.lastCalibrationDate).toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const { value } = e.target;
                setFormData(prev => ({
                  ...prev,
                  lastCalibrationDate: value ? new Date(value).toISOString() : null
                }));
              }}
            />
          </div>
        </div>

        <div className="flex gap-4 justify-end pt-4 border-t border-gray-800">
          <Link
            to="/instruments"
            className="btn-transition bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-semibold py-2.5 px-6 rounded-lg text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-transition bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/15 disabled:opacity-50"
          >
            <Check size={18} />
            {loading ? 'Creating...' : 'Register Device'}
          </button>
        </div>
      </form>
    </div>
  );
}
