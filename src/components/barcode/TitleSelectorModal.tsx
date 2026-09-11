import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckSquare,
  Square,
  CheckCircle2,
  X,
  BookOpen,
  Filter,
  Layers,
  ArrowUpDown,
  Barcode as BarcodeIcon,
  Tag,
  Hash
} from 'lucide-react';
import { BookRecord } from '../../types/alims';

interface TitleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: BookRecord[];
  selectedBookIds: string[];
  onToggleBook: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSetSelection: (ids: string[]) => void;
}

export const TitleSelectorModal: React.FC<TitleSelectorModalProps> = ({
  isOpen,
  onClose,
  books,
  selectedBookIds,
  onToggleBook,
  onSelectAll,
  onDeselectAll,
  onSetSelection
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'TITLE' | 'ACCESSION' | 'CALLNO'>('TITLE');

  // Extract unique departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => {
      if (b.department) set.add(b.department);
    });
    return Array.from(set).sort();
  }, [books]);

  // Filtered and sorted books
  const filteredBooks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return books
      .filter(b => {
        const authorsStr = Array.isArray(b.authors) ? b.authors.join(' ') : '';
        const matchesQuery =
          !q ||
          b.title.toLowerCase().includes(q) ||
          authorsStr.toLowerCase().includes(q) ||
          (b.isbn && b.isbn.toLowerCase().includes(q)) ||
          (b.accessionNumber && b.accessionNumber.toLowerCase().includes(q)) ||
          (b.callNumber && b.callNumber.toLowerCase().includes(q)) ||
          b.id.toLowerCase().includes(q);

        const matchesDept = departmentFilter === 'ALL' || b.department === departmentFilter;

        return matchesQuery && matchesDept;
      })
      .sort((a, b) => {
        if (sortBy === 'ACCESSION') {
          return (a.accessionNumber || a.id).localeCompare(b.accessionNumber || b.id);
        }
        if (sortBy === 'CALLNO') {
          return (a.callNumber || '').localeCompare(b.callNumber || '');
        }
        return a.title.localeCompare(b.title);
      });
  }, [books, searchQuery, departmentFilter, sortBy]);

  if (!isOpen) return null;

  const allFilteredSelected =
    filteredBooks.length > 0 &&
    filteredBooks.every(b => selectedBookIds.includes(b.id));

  const someFilteredSelected =
    filteredBooks.some(b => selectedBookIds.includes(b.id)) && !allFilteredSelected;

  const handleToggleFiltered = () => {
    if (allFilteredSelected) {
      // Remove all filtered from selection
      const filteredIdSet = new Set(filteredBooks.map(b => b.id));
      onSetSelection(selectedBookIds.filter(id => !filteredIdSet.has(id)));
    } else {
      // Add all filtered to selection
      const newSelection = Array.from(
        new Set([...selectedBookIds, ...filteredBooks.map(b => b.id)])
      );
      onSetSelection(newSelection);
    }
  };

  const handleInvertFiltered = () => {
    const filteredIdSet = new Set(filteredBooks.map(b => b.id));
    const newSelected: string[] = [];

    // Keep items not in filtered list as they were
    selectedBookIds.forEach(id => {
      if (!filteredIdSet.has(id)) {
        newSelected.push(id);
      }
    });

    // Invert items in filtered list
    filteredBooks.forEach(b => {
      if (!selectedBookIds.includes(b.id)) {
        newSelected.push(b.id);
      }
    });

    onSetSelection(newSelected);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-[#121214] border border-[#27272a] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#27272a] flex items-center justify-between bg-[#18181b]/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#fafafa] flex items-center space-x-2">
                <span>Choose & Select Titles for Barcode / RFID Labels</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {selectedBookIds.length} of {books.length} Selected
                </span>
              </h3>
              <p className="text-xs text-[#a1a1aa] mt-0.5">
                Pick specific book titles or select all titles to batch generate spine barcodes, QR codes, and RFID smart labels
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar: Search, Filters, Bulk Select Buttons */}
        <div className="p-4 border-b border-[#27272a] bg-[#141417] space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717a]" />
              <input
                type="text"
                placeholder="Search by title, author, accession no, call no, ISBN..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-[#09090b] border border-[#27272a] rounded-xl text-xs text-[#fafafa] placeholder-[#71717a] focus:outline-none focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Department Filter */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="h-3.5 w-3.5 text-[#a1a1aa]" />
              <select
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
                className="bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-[#fafafa] focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {/* Sort selector */}
              <div className="flex items-center space-x-1 bg-[#09090b] border border-[#27272a] rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setSortBy('TITLE')}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    sortBy === 'TITLE'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-[#a1a1aa] hover:text-white'
                  }`}
                  title="Sort by Title"
                >
                  Title
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('ACCESSION')}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    sortBy === 'ACCESSION'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-[#a1a1aa] hover:text-white'
                  }`}
                  title="Sort by Accession Number"
                >
                  Accession
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('CALLNO')}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    sortBy === 'CALLNO'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-[#a1a1aa] hover:text-white'
                  }`}
                  title="Sort by Call Number"
                >
                  Call No
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action Selection Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Select All Catalog Button */}
              <button
                type="button"
                onClick={onSelectAll}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                <span>Select All Titles ({books.length})</span>
              </button>

              {/* Select All Filtered Button (if search is active) */}
              {filteredBooks.length < books.length && (
                <button
                  type="button"
                  onClick={handleToggleFiltered}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>
                    {allFilteredSelected
                      ? `Deselect Filtered (${filteredBooks.length})`
                      : `Select Filtered (${filteredBooks.length})`}
                  </span>
                </button>
              )}

              {/* Invert Selection */}
              <button
                type="button"
                onClick={handleInvertFiltered}
                className="px-2.5 py-1.5 rounded-lg bg-[#09090b] hover:bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-white text-xs font-medium flex items-center space-x-1 cursor-pointer"
              >
                <ArrowUpDown className="h-3 w-3" />
                <span>Invert</span>
              </button>

              {/* Deselect All */}
              <button
                type="button"
                onClick={onDeselectAll}
                className="px-2.5 py-1.5 rounded-lg bg-[#09090b] hover:bg-[#18181b] border border-[#27272a] text-red-400 hover:text-red-300 text-xs font-medium flex items-center space-x-1 cursor-pointer"
              >
                <Square className="h-3 w-3" />
                <span>Clear All</span>
              </button>
            </div>

            <div className="text-xs text-[#a1a1aa]">
              Showing <strong className="text-[#fafafa]">{filteredBooks.length}</strong> of{' '}
              <strong className="text-[#fafafa]">{books.length}</strong> titles
            </div>
          </div>
        </div>

        {/* Book List with Checkboxes */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-[#27272a]/60">
          {filteredBooks.length === 0 ? (
            <div className="p-12 text-center text-[#71717a] space-y-2">
              <BookOpen className="h-8 w-8 mx-auto text-[#3f3f46]" />
              <p className="text-sm font-medium">No book titles matching your filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDepartmentFilter('ALL');
                }}
                className="text-xs text-emerald-400 hover:underline cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            filteredBooks.map(book => {
              const isSelected = selectedBookIds.includes(book.id);
              const accessionCode = book.accessionNumber || book.isbn || `ACC-${book.id}`;

              return (
                <div
                  key={book.id}
                  onClick={() => onToggleBook(book.id)}
                  className={`p-3 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer select-none my-1 ${
                    isSelected
                      ? 'bg-emerald-500/10 border border-emerald-500/40 text-[#fafafa]'
                      : 'hover:bg-[#18181b] border border-transparent text-[#d4d4d8]'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Checkbox Icon */}
                    <div
                      className={`h-5 w-5 rounded-md flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-[#3f3f46] bg-[#09090b] text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </div>

                    {/* Book Cover or Fallback */}
                    <div className="h-10 w-8 rounded bg-[#1f1f23] border border-[#27272a] shrink-0 overflow-hidden flex items-center justify-center">
                      {book.coverUrl ? (
                        <img
                          src={book.coverUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BookOpen className="h-4 w-4 text-emerald-400/70" />
                      )}
                    </div>

                    {/* Book Metadata */}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#fafafa] truncate">
                        {book.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#a1a1aa] mt-0.5">
                        <span>{Array.isArray(book.authors) && book.authors.length > 0 ? book.authors.join(', ') : 'Library Collection'}</span>
                        {book.department && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400/80">{book.department}</span>
                          </>
                        )}
                        {book.publisherYear && (
                          <>
                            <span>•</span>
                            <span>{book.publisherYear}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badges / Code Preview */}
                  <div className="flex items-center space-x-2 shrink-0 text-right">
                    <div className="hidden sm:block">
                      <div className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 rounded">
                        {book.callNumber || '000 GEN'}
                      </div>
                      <div className="text-[9px] font-mono text-[#a1a1aa] mt-0.5">
                        {accessionCode}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#27272a] bg-[#18181b] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#a1a1aa] flex items-center space-x-2">
            <Tag className="h-4 w-4 text-emerald-400" />
            <span>
              <strong className="text-emerald-400">{selectedBookIds.length}</strong> title{selectedBookIds.length === 1 ? '' : 's'} chosen for label printing & RFID encoding
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Apply Selection ({selectedBookIds.length} Titles)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
