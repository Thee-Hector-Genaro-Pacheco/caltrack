import { Link } from 'react-router-dom';
import { Instrument } from '@caltrack/types';
import { formatDate } from '@caltrack/utils';
import { BookOpen, ChevronRight } from 'lucide-react';

export interface DocumentationCardProps {
  instrument: Instrument;
}

export function DocumentationCard({ instrument }: DocumentationCardProps) {
  const documents = instrument.documents || [];

  return (
    <div className="glass-card p-6 rounded-xl border border-white/5">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="text-indigo-400" size={20} />
          Associated Technical Documentation
        </h3>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-800 rounded-lg">
          No documents currently linked to this instrument.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-4 bg-[#090d16]/30 border border-gray-800/80 rounded-xl flex flex-col justify-between hover:border-gray-700 transition-colors"
            >
              <div>
                <span className="inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
                  {doc.documentType}
                </span>
                <h4 className="text-sm font-bold text-white line-clamp-1">{doc.title}</h4>
                <span className="block text-[10px] font-mono text-indigo-400/80 mt-0.5">
                  {doc.documentNumber} &bull; Rev {doc.revision}
                </span>
                {doc.description && (
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2">{doc.description}</p>
                )}
              </div>

              <div className="border-t border-gray-800/50 mt-4 pt-3 flex items-center justify-between text-[10px] text-gray-500">
                <span>Uploaded {formatDate(doc.uploadDate)}</span>
                <Link
                  to={`/documentation/${doc.id}`}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  View Details
                  <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DocumentationCard;
