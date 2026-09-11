import React, { useState } from 'react';
import {
  X,
  BookOpen,
  MapPin,
  Bookmark,
  Calendar,
  Hash,
  Tag,
  Building2,
  FileText,
  Barcode,
  Layers,
  Sparkles,
  ExternalLink,
  Share2,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { BookRecord } from '../../types/alims';

interface BookDetailsModalProps {
  book: BookRecord;
  onClose: () => void;
  onReserve: (book: BookRecord) => void;
  onFindSimilar: (book: BookRecord) => void;
}

export const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  book,
  onClose,
  onReserve,
  onFindSimilar
}) => {
  const [showMarc, setShowMarc] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCitation = () => {
    const authors = book.authors.join(', ');
    const citation = `${authors} (${book.publisherYear || 2024}). ${book.title}. ${book.publisherName || 'PLiMS Press'}. [Call No: ${book.callNumber}]`;
    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#18181b] border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#fafafa]">Bibliographic Record Details</h3>
              <p className="text-[11px] text-[#a1a1aa] font-mono">PLiMS Accession #{book.accessionNumber || book.id.slice(0, 8)}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#27272a] text-[#71717a] hover:text-[#fafafa] hover:bg-[#27272a] transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-[#fafafa]">
          {/* Main Info Hero */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-5">
            {/* Book Cover */}
            <div className="w-32 h-44 rounded-xl bg-[#09090b] border border-[#27272a] overflow-hidden flex-shrink-0 flex items-center justify-center relative shadow-lg mx-auto sm:mx-0">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
              <BookOpen className="h-10 w-10 text-blue-400/40 absolute" />
            </div>

            {/* Core Metadata */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    book.availableCopies > 0
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {book.availableCopies > 0 ? `Available (${book.availableCopies}/${book.totalCopies})` : 'Checked Out'}
                </span>

                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-mono">
                  Format: {book.format || 'HARDCOVER'}
                </span>
              </div>

              <h2 className="text-base font-bold text-[#fafafa] leading-snug">{book.title}</h2>
              <p className="text-xs text-[#a1a1aa]">By {book.authors.join(', ')}</p>

              <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-[#a1a1aa] bg-[#18181b] p-3 rounded-xl border border-[#27272a] font-mono">
                <div><span className="text-[#71717a]">Call No:</span> {book.callNumber}</div>
                <div><span className="text-[#71717a]">ISBN:</span> {book.isbn || 'N/A'}</div>
                <div><span className="text-[#71717a]">Publisher:</span> {book.publisherName || 'N/A'}</div>
                <div><span className="text-[#71717a]">Year:</span> {book.publisherYear || 2024}</div>
                <div><span className="text-[#71717a]">Shelf:</span> {book.shelfLocation}</div>
                <div><span className="text-[#71717a]">Department:</span> {book.department}</div>
              </div>
            </div>
          </div>

          {/* Subjects & LCSH Tags */}
          {book.subjects && book.subjects.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider flex items-center space-x-1">
                <Tag className="h-3.5 w-3.5 text-blue-400" />
                <span>Subject Headings (LCSH)</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {book.subjects.map((subj, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded-lg bg-blue-600/10 text-blue-300 border border-blue-500/20 text-xs"
                  >
                    {subj}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#27272a]">
            <button
              onClick={() => onReserve(book)}
              className="flex-1 min-w-[140px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-lg shadow-blue-600/20"
            >
              <Bookmark className="h-4 w-4" />
              <span>{book.availableCopies > 0 ? 'Reserve Book' : 'Place Hold Queue'}</span>
            </button>

            <button
              onClick={() => onFindSimilar(book)}
              className="px-3.5 py-2 rounded-xl border border-[#27272a] bg-[#18181b] hover:bg-[#27272a] text-[#fafafa] font-semibold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>Find Similar Books</span>
            </button>

            <button
              onClick={handleCopyCitation}
              className="px-3.5 py-2 rounded-xl border border-[#27272a] bg-[#18181b] hover:bg-[#27272a] text-[#fafafa] font-semibold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
              <span>{copied ? 'Citation Copied' : 'Copy APA Citation'}</span>
            </button>
          </div>

          {/* MARC21 Tags Accordion */}
          <div className="border border-[#27272a] rounded-xl overflow-hidden bg-[#18181b]">
            <button
              onClick={() => setShowMarc(!showMarc)}
              className="w-full p-3 flex items-center justify-between text-xs font-bold text-[#fafafa] hover:bg-[#27272a] transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-amber-400" />
                <span>MARC21 Bibliographic Field Schema</span>
              </div>
              {showMarc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showMarc && (
              <div className="p-3 bg-[#09090b] border-t border-[#27272a] font-mono text-[11px] space-y-1 text-[#a1a1aa] overflow-x-auto">
                <div>020 ## $a {book.isbn || 'N/A'}</div>
                <div>082 04 $a {book.callNumber}</div>
                <div>100 1# $a {book.authors[0] || 'Unknown'}</div>
                <div>245 10 $a {book.title} / $c {book.authors.join(', ')}.</div>
                <div>264 #1 $a Islamabad : $b {book.publisherName || 'Academic Press'}, $c {book.publisherYear || 2024}.</div>
                <div>300 ## $a {book.pageCount || 350} pages ; $c 24 cm.</div>
                {book.subjects?.map((s, i) => (
                  <div key={i}>650 #0 $a {s}.</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
