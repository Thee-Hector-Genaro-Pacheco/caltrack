import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Documentation } from '@caltrack/types';
import { Search, Plus, ChevronRight, Tag, BookOpen, AlertCircle } from 'lucide-react';

export default function DocumentationLibrary() {
  const [documents, setDocuments] = useState<Documentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocType, setSelectedDocType] = useState('All');
  const [selectedManufacturer, setSelectedManufacturer] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('ACTIVE');

  // Available options for filters
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  
  const documentTypes = [
    'All',
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

  useEffect(() => {
    fetchDocuments();
  }, [selectedStatus]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await api.getAllDocumentation({ status: selectedStatus === 'All' ? undefined : selectedStatus });
      setDocuments(docs);
      
      // Extract unique manufacturers
      const uniqueMans: string[] = Array.from(
        new Set(
          docs
            .map(d => d.manufacturer)
            .filter((m): m is string => typeof m === 'string' && m.trim() !== '')
        )
      );
      setManufacturers(uniqueMans);
      
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch documentation.');
    } finally {
      setLoading(false);
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

  // Filter clientside to combine searches
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      doc.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDocType = selectedDocType === 'All' || doc.documentType === selectedDocType;
    const matchesManufacturer = selectedManufacturer === 'All' || doc.manufacturer === selectedManufacturer;

    return matchesSearch && matchesDocType && matchesManufacturer;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Documentation Library</h1>
          <p className="text-sm text-gray-400 mt-1">
            Access and manage operating procedures, datasheets, loop drawings, and manuals.
          </p>
        </div>
        <Link
          to="/documentation/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-600/15"
        >
          <Plus size={16} />
          Upload Document
        </Link>
      </div>

      {/* Filter panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-5 bg-[#0c1220]/60 border border-gray-800 rounded-xl backdrop-blur-md">
        {/* Search */}
        <div className="relative">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Search Library</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Title, doc #, or tag..."
              className="w-full pl-10 pr-4 py-2 bg-[#080d16] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
          </div>
        </div>

        {/* Document Type */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Document Type</label>
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#080d16] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
          >
            {documentTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Manufacturer */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Manufacturer</label>
          <select
            value={selectedManufacturer}
            onChange={(e) => setSelectedManufacturer(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#080d16] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
          >
            <option value="All">All Manufacturers</option>
            {manufacturers.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</label>
          <div className="flex gap-2">
            {['ACTIVE', 'ARCHIVED', 'All'].map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                  selectedStatus === status
                    ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/35 shadow-sm'
                    : 'bg-[#080d16] text-gray-400 border-gray-800 hover:text-white'
                }`}
              >
                {status === 'All' ? 'All' : status === 'ACTIVE' ? 'Active' : 'Archived'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Library listings */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-16 bg-[#0c1220]/30 border border-gray-800/80 border-dashed rounded-xl">
          <BookOpen size={40} className="mx-auto text-gray-600 mb-3" />
          <h3 className="text-sm font-semibold text-white">No documents found</h3>
          <p className="text-xs text-gray-500 mt-1">Try updating your filters or search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map(doc => (
            <div
              key={doc.id}
              className="group border border-gray-800 hover:border-gray-700 bg-[#0c1220]/40 hover:bg-[#0c1220]/60 rounded-xl p-5 flex flex-col justify-between transition-all duration-300"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-3.5">
                  <span className={`px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase border rounded-md ${getDocTypeColor(doc.documentType)}`}>
                    {doc.documentType}
                  </span>
                  <span className="text-xs font-mono font-medium text-gray-500">
                    Rev {doc.revision}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {doc.title}
                </h3>
                <span className="block text-[11px] font-mono font-semibold text-indigo-400/80 mt-1">
                  {doc.documentNumber}
                </span>

                <p className="text-xs text-gray-400 mt-2.5 line-clamp-2 min-h-[2rem]">
                  {doc.description || 'No description provided.'}
                </p>

                {/* Tags */}
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {doc.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="flex items-center gap-1 text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-white/5 font-medium">
                        <Tag size={8} />
                        {tag}
                      </span>
                    ))}
                    {doc.tags.length > 3 && (
                      <span className="text-[9px] text-gray-500 font-semibold self-center ml-1">
                        +{doc.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-800/80 mt-5 pt-4 flex items-center justify-between">
                <div className="text-[10px] text-gray-500">
                  Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
                </div>
                
                <Link
                  to={`/documentation/${doc.id}`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-all"
                >
                  View Details
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
