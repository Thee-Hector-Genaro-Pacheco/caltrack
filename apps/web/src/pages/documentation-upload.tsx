import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { Instrument } from '@caltrack/types';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export default function DocumentationUpload() {
  const navigate = useNavigate();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [revision, setRevision] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [instrumentType, setInstrumentType] = useState('');
  const [equipmentCategory, setEquipmentCategory] = useState('Pressure');
  const [documentType, setDocumentType] = useState('Calibration Procedures');
  const [tagsInput, setTagsInput] = useState('');
  const [fileLocation, setFileLocation] = useState('');
  const [selectedInstrumentIds, setSelectedInstrumentIds] = useState<string[]>([]);

  const documentTypes = [
    'Calibration Procedures',
    'Manufacturer Manuals',
    'Installation Guides',
    'Maintenance Procedures',
    'Wiring Diagrams',
    'P&IDs',
    'Loop Drawings',
    'SOPs',
    'Troubleshooting Guides',
    'Safety Procedures'
  ];

  const categories = ['Pressure', 'Temperature', 'Flow', 'Level', 'Valve', 'Other'];

  useEffect(() => {
    fetchInstruments();
  }, []);

  const fetchInstruments = async () => {
    try {
      const list = await api.getInstruments();
      setInstruments(list);
      setError(null);
    } catch (err: any) {
      setError('Failed to load instrument registry for linkage.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstrumentToggle = (id: string) => {
    setSelectedInstrumentIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !documentNumber || !revision || !documentType || !fileLocation) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await api.createDocumentation({
        title,
        description: description || undefined,
        documentNumber,
        revision,
        manufacturer: manufacturer || undefined,
        instrumentType: instrumentType || undefined,
        equipmentCategory: equipmentCategory || undefined,
        documentType,
        tags,
        fileLocation,
        instrumentIds: selectedInstrumentIds,
      });

      navigate('/documentation');
    } catch (err: any) {
      setError(err.message || 'Failed to save document.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          to="/documentation"
          className="p-2 border border-gray-800 hover:border-gray-700 bg-[#0c1220]/40 text-gray-400 hover:text-white rounded-lg transition-all"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Upload Engineering Document</h1>
          <p className="text-sm text-gray-400 mt-1">
            Register metadata and configure access rules for documents.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: metadata inputs */}
        <div className="lg:col-span-2 space-y-6 bg-[#0c1220]/60 border border-gray-800 rounded-xl p-6 backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Document Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fluke 754 Documenting Calibrator Operating Manual"
                className="w-full px-3.5 py-2.5 bg-[#080d16] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of document contents and purpose..."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-[#080d16] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
              />
            </div>

            {/* Document Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Document Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="e.g. SOP-CAL-P-022"
                className="w-full px-3.5 py-2.5 bg-[#080d16] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                required
              />
            </div>

            {/* Revision */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Revision <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                placeholder="e.g. 1.0 or Rev A"
                className="w-full px-3.5 py-2.5 bg-[#080d16] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                required
              />
            </div>

            {/* Document Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#080d16] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                required
              >
                {documentTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Equipment Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Equipment Category</label>
              <select
                value={equipmentCategory}
                onChange={(e) => setEquipmentCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#080d16] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Manufacturer */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Associated Manufacturer</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. ABB or Rosemount"
                className="w-full px-3.5 py-2.5 bg-[#080d16] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>

            {/* Instrument Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Associated Instrument Type</label>
              <input
                type="text"
                value={instrumentType}
                onChange={(e) => setInstrumentType(e.target.value)}
                placeholder="e.g. Pressure Transmitter"
                className="w-full px-3.5 py-2.5 bg-[#080d16] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>

            {/* File Location */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                File Location / Path <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fileLocation}
                onChange={(e) => setFileLocation(e.target.value)}
                placeholder="e.g. /documents/manuals/abb-266.pdf"
                className="w-full px-3.5 py-2.5 bg-[#080d16] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                required
              />
            </div>

            {/* Tags */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tags (Comma-separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="boiler, safety, loop-101"
                className="w-full px-3.5 py-2.5 bg-[#080d16] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Right column: Instrument association check list */}
        <div className="flex flex-col h-[520px] bg-[#0c1220]/60 border border-gray-800 rounded-xl p-6 backdrop-blur-md">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Associate Instruments
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Link this document directly to specific instruments.
          </p>

          <div className="flex-1 overflow-y-auto border border-gray-800 rounded-lg bg-[#080d16] p-3 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-indigo-500"></div>
              </div>
            ) : instruments.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-10">No instruments registered.</p>
            ) : (
              instruments.map(inst => (
                <label
                  key={inst.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    selectedInstrumentIds.includes(inst.id)
                      ? 'bg-indigo-600/10 border-indigo-500/30 text-white'
                      : 'border-gray-800/80 text-gray-400 hover:border-gray-800 hover:bg-white/5'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedInstrumentIds.includes(inst.id)}
                    onChange={() => handleInstrumentToggle(inst.id)}
                    className="rounded border-gray-800 bg-[#080d16] text-indigo-600 focus:ring-indigo-500/30"
                  />
                  <div className="min-w-0">
                    <span className="block text-xs font-bold leading-tight">{inst.tagNumber}</span>
                    <span className="block text-[10px] text-gray-500 truncate mt-0.5">{inst.manufacturer} - {inst.model}</span>
                  </div>
                </label>
              ))
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 mt-6 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-600/15"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Document
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
