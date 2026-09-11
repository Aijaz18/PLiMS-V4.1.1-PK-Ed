import React, { useState } from 'react';
import {
  BookOpen,
  MapPin,
  Bookmark,
  Check,
  Share2,
  Eye,
  Calendar,
  Hash,
  ExternalLink,
  Heart,
  Tag,
  Building2
} from 'lucide-react';
import { BookRecord } from '../../types/alims';

interface BookCardProps {
  book: BookRecord;
  onSelectBook: (book: BookRecord) => void;
  onReserveBook: (book: BookRecord) => void;
  onToggleFavorite?: (bookId: string) => void;
  onIssueBook?: (book: BookRecord) => void;
  isFavorite?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onSelectBook,
  onReserveBook,
  onToggleFavorite,
  onIssueBook,
  isFavorite = false
}) => {
  const [copied, setCopied] = useState(false);
  const isAvailable = book.availableCopies > 0;

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `📚 ${book.title} by ${book.authors.join(', ')} | Call No: ${book.callNumber} | PLiMS Catalog`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group rounded-xl bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 p-3.5 transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-blue-500/5 flex flex-col justify-between">
      <div>
        {/* Header row: Status badge + Favorites & Share */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isAvailable
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
            <span>{isAvailable ? `Available (${book.availableCopies}/${book.totalCopies})` : 'Checked Out'}</span>
          </span>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onToggleFavorite && onToggleFavorite(book.id)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                  : 'border-[#27272a] text-[#71717a] hover:text-[#fafafa] hover:bg-[#27272a]'
              }`}
              title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            >
              <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-rose-400' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg border border-[#27272a] text-[#71717a] hover:text-[#fafafa] hover:bg-[#27272a] transition-all cursor-pointer"
              title="Share Book Record"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex space-x-3">
          {/* Cover image or Fallback Icon */}
          <div className="w-16 h-22 rounded-lg bg-[#09090b] border border-[#27272a] overflow-hidden flex-shrink-0 flex items-center justify-center relative group-hover:border-blue-500/40 transition-colors">
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
            <BookOpen className="h-6 w-6 text-blue-400/60 absolute" />
          </div>

          {/* Book Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <h4
              onClick={() => onSelectBook(book)}
              className="text-xs font-bold text-[#fafafa] hover:text-blue-400 transition-colors cursor-pointer line-clamp-2 leading-snug"
            >
              {book.title}
            </h4>
            <p className="text-[11px] text-[#a1a1aa] truncate">
              {book.authors.join(', ')}
            </p>

            <div className="pt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-[#71717a] font-mono">
              <div className="flex items-center space-x-1 truncate" title={`Call Number: ${book.callNumber}`}>
                <Hash className="h-3 w-3 text-blue-400 shrink-0" />
                <span className="truncate">{book.callNumber}</span>
              </div>
              <div className="flex items-center space-x-1 truncate" title={`Shelf Location: ${book.shelfLocation}`}>
                <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                <span className="truncate">{book.shelfLocation}</span>
              </div>
              <div className="flex items-center space-x-1 truncate" title={`Year: ${book.publisherYear}`}>
                <Calendar className="h-3 w-3 text-purple-400 shrink-0" />
                <span>{book.publisherYear || 2024}</span>
              </div>
              <div className="flex items-center space-x-1 truncate" title={`Department: ${book.department}`}>
                <Building2 className="h-3 w-3 text-emerald-400 shrink-0" />
                <span className="truncate">{book.department}</span>
              </div>
            </div>

            {book.subjects && book.subjects.length > 0 && (
              <div className="pt-1 flex flex-wrap gap-1">
                {book.subjects.slice(0, 2).map((sub, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[9px]"
                  >
                    <Tag className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate max-w-[100px]">{sub}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="pt-3 mt-2 border-t border-[#27272a] flex items-center justify-between space-x-1.5">
        <button
          onClick={() => onSelectBook(book)}
          className="flex-1 px-2 py-1.5 rounded-lg border border-[#27272a] hover:bg-[#27272a] text-[#fafafa] text-[11px] font-semibold flex items-center justify-center space-x-1 transition-all cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5 text-blue-400" />
          <span>Details</span>
        </button>

        {onIssueBook ? (
          <button
            onClick={() => onIssueBook(book)}
            className="flex-1 px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center justify-center space-x-1 transition-all cursor-pointer shadow-sm shadow-emerald-600/20"
            title="Issue this book via Circulation"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Issue</span>
          </button>
        ) : (
          <button
            onClick={() => onReserveBook(book)}
            className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1 transition-all cursor-pointer shadow-sm ${
              isAvailable
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>{isAvailable ? 'Reserve' : 'Hold'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
