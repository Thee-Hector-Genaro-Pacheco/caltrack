import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { UpdateInstrumentDto } from '@caltrack/types';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';

export default function InstrumentEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateInstrumentDto>({
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
    reason: '',
  });

  useEffect(() => {
    if (id) {
      api.getInstrument(id)
        .then(res => {
          setFormData({
            tagNumber: res.tagNumber,
            instrumentType: res.instrumentType,
            manufacturer: res.manufacturer,
            model: res.model,
            rangeMin: res.rangeMin,
            rangeMax: res.rangeMax,
            engineeringUnits: res.engineeringUnits,
            signalType: res.signalType,
            location: res.location,
            status: res.status,
            maxPermissibleError: res.maxPermissibleError,
            reason: '',
          });
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError('Failed to load instrument details.');
          setLoading(false);
        });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rangeMin' || name === 'rangeMax' || name === 'maxPermissibleError' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.updateInstrument(id!, formData);
      navigate(`/instruments/${id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update instrument registry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/instruments/${id}`} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Edit Instrument Parameter</h1>
          <p className="text-gray-400 mt-1">Modify device configuration. This change is fully recorded in the audit trail.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/30 text-red-200 text-sm rounded-lg flex gap-3">
          <AlertTriangle className="shrink-0" size={20} />
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
              value={formData.signalType}
              onChange={handleChange}
            />
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
              value={formData.maxPermissibleError}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="border-t border-indigo-500/10 pt-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
            Reason for Update *
          </label>
          <input
            type="text"
            name="reason"
            required
            className="w-full bg-indigo-950/10 border border-indigo-500/30 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            placeholder="Describe why you are modifying specifications (e.g., Range calibrated for CDU expansion)"
            value={formData.reason}
            onChange={handleChange}
          />
          <p className="text-[10px] text-gray-500 mt-1.5 leading-normal">
            This modification is logged to comply with ISO-9001 audit directives. Specify changes clearly.
          </p>
        </div>

        <div className="flex gap-4 justify-end pt-4 border-t border-gray-800">
          <Link
            to={`/instruments/${id}`}
            className="btn-transition bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-semibold py-2.5 px-6 rounded-lg text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !formData.reason}
            className="btn-transition bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/15 disabled:opacity-40"
          >
            <Save size={18} />
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
