import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { Documentation } from '@caltrack/types';
import { ArrowLeft, Trash2, Tag, Database, AlertCircle, Link as LinkIcon } from 'lucide-react';

export default function DocumentationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<Documentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) fetchDocumentDetails();
  }, [id]);

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true);
      const data = await api.getDocumentationById(id!);
      setDocument(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load document details.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!document || !id) return;
    try {
      setActionLoading(true);
      const nextStatus = document.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
      const updated = await api.updateDocumentation(id, { status: nextStatus });
      setDocument(updated);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to change document status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmDelete = window.confirm('Are you sure you want to delete this document? This action is audited.');
    if (!confirmDelete) return;

    try {
      setActionLoading(true);
      await api.deleteDocumentation(id, 'Document deleted by technician');
      navigate('/documentation');
    } catch (err: any) {
      setError(err.message || 'Failed to delete document.');
      setActionLoading(false);
    }
  };

  const getDocTypeColor = (type: string) => {
    switch (type) {
      case 'Calibration Procedures':
      case 'SOPs':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Manufacturer Manuals':
      case 'Installation Guides':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Wiring Diagrams':
      case 'P&IDs':
      case 'Loop Drawings':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Safety Procedures':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/documentation" className="p-2 border border-gray-800 hover:border-gray-700 bg-[#0c1220]/40 text-gray-400 hover:text-white rounded-lg transition-all">
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-xl font-bold text-white">Error Loading Document</h1>
        </div>
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error || 'Document not found.'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/documentation"
            className="p-2 border border-gray-800 hover:border-gray-700 bg-[#0c1220]/40 text-gray-400 hover:text-white rounded-lg transition-all"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight leading-tight">{document.title}</h1>
            <span className="text-xs font-mono font-semibold text-indigo-400 mt-1 block">
              {document.documentNumber}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status badge & toggle */}
          <span className={`text-xs px-3 py-1 font-semibold uppercase tracking-wider rounded-full border ${
            document.status === 'ACTIVE' 
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
              : 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
          }`}>
            {document.status}
          </span>
          <button
            onClick={handleToggleStatus}
            disabled={actionLoading}
            className="px-3.5 py-1.5 border border-gray-800 bg-[#0c1220]/40 hover:bg-slate-800 text-xs font-semibold text-white rounded-lg transition-all"
          >
            {document.status === 'ACTIVE' ? 'Archive' : 'Activate'}
          </button>
          <button
            onClick={handleDelete}
            disabled={actionLoading}
            className="p-2 border border-red-500/20 hover:border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
            title="Delete Document"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Main detail section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Metadata Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0c1220]/60 border border-gray-800 rounded-xl p-6 backdrop-blur-md space-y-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800 pb-3">
              Document Specifications
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Document Type</span>
                <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase border rounded-md mt-1 ${getDocTypeColor(document.documentType)}`}>
                  {document.documentType}
                </span>
              </div>
              
              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Revision</span>
                <span className="text-white font-mono font-medium">Rev {document.revision}</span>
              </div>

              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Equipment Category</span>
                <span className="text-white font-medium">{document.equipmentCategory || 'N/A'}</span>
              </div>

              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Upload Date</span>
                <span className="text-white font-medium">{new Date(document.uploadDate).toLocaleDateString()}</span>
              </div>

              {document.manufacturer && (
                <div>
                  <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Associated Manufacturer</span>
                  <span className="text-white font-medium">{document.manufacturer}</span>
                </div>
              )}

              {document.instrumentType && (
                <div>
                  <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Associated Instrument Type</span>
                  <span className="text-white font-medium">{document.instrumentType}</span>
                </div>
              )}

              <div className="md:col-span-2 border-t border-gray-800/80 pt-4">
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</span>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {document.description || 'No description provided.'}
                </p>
              </div>

              <div className="md:col-span-2 border-t border-gray-800/80 pt-4">
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">File Location</span>
                <span className="text-indigo-400 font-mono text-xs break-all bg-slate-900 px-2 py-1.5 rounded-lg border border-white/5 block mt-1">
                  {document.fileLocation}
                </span>
              </div>
            </div>

            {/* Tags section */}
            {document.tags && document.tags.length > 0 && (
              <div className="border-t border-gray-800/80 pt-4">
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Search Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {document.tags.map((tag, idx) => (
                    <span key={idx} className="flex items-center gap-1 text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-white/5 font-medium">
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Linked Instruments list */}
        <div className="bg-[#0c1220]/60 border border-gray-800 rounded-xl p-6 backdrop-blur-md flex flex-col min-h-[350px]">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Associated Instruments
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            This document will be retrieved when calibrating any of the linked instruments.
          </p>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[350px] border border-gray-800 bg-[#080d16] rounded-lg p-3">
            {!document.instruments || document.instruments.length === 0 ? (
              <div className="text-center py-10">
                <Database size={24} className="mx-auto text-gray-700 mb-2" />
                <p className="text-xs text-gray-600">No linked instruments</p>
              </div>
            ) : (
              document.instruments.map(inst => (
                <Link
                  key={inst.id}
                  to={`/instruments/${inst.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-gray-800 bg-[#090d16]/30 hover:bg-[#0c1220] hover:border-gray-700 text-gray-400 hover:text-white transition-all group"
                >
                  <div className="min-w-0">
                    <span className="block text-xs font-bold leading-tight group-hover:text-indigo-400 transition-colors">
                      {inst.tagNumber}
                    </span>
                    <span className="block text-[10px] text-gray-500 truncate mt-0.5">
                      {inst.manufacturer} - {inst.model}
                    </span>
                  </div>
                  <LinkIcon size={12} className="text-gray-600 group-hover:text-indigo-400 transition-colors" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
