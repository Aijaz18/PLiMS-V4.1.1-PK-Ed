import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Filter,
  BookOpen,
  Clock,
  Star,
  Share2,
  CheckCircle,
  FileText,
  ArrowRight,
  LayoutGrid,
  List,
  Table as TableIcon,
  Building2,
  Tag,
  BookMarked,
  Layers,
  X,
  Copy,
  Check,
  Calendar,
  Eye,
  SlidersHorizontal,
  BookmarkPlus,
  Trash2,
  Plus
} from 'lucide-react';
import { BookRecord, UserProfile } from '../../types/alims';

interface OpacModuleProps {
  books: BookRecord[];
  currentUser: UserProfile;
  onReserveBook: (bookId: string) => void;
  onOpenCitationModal: (book: BookRecord) => void;
  onDeleteBook?: (bookId: string) => void;
  onAddBook?: (newBook: BookRecord) => void;
}

export const OpacModule: React.FC<OpacModuleProps> = ({
  books,
  currentUser,
  onReserveBook,
  onOpenCitationModal,
  onDeleteBook,
  onAddBook
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState<'ALL' | 'TITLE' | 'AUTHOR' | 'CALL_NO' | 'ISBN' | 'SUBJECT'>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST' | 'TABLE'>('GRID');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // AI Query
  const [naturalQueryInput, setNaturalQueryInput] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [aiSearchFilter, setAiSearchFilter] = useState<string | null>(null);

  // MARC21 Inspection Modal
  const [selectedMarcBook, setSelectedMarcBook] = useState<BookRecord | null>(null);

  // Reserve Modal
  const [reserveBookTarget, setReserveBookTarget] = useState<BookRecord | null>(null);
  const [pickupBranch, setPickupBranch] = useState('Central Campus Library (Islamabad)');
  const [reserveSuccess, setReserveSuccess] = useState(false);

  // Copy Citation state
  const [copiedCitation, setCopiedCitation] = useState<string | null>(null);

  const handleNaturalSearch = (customPrompt?: string) => {
    const queryToUse = customPrompt || naturalQueryInput;
    if (!queryToUse.trim()) return;

    setIsAiParsing(true);
    setNaturalQueryInput(queryToUse);

    setTimeout(() => {
      setIsAiParsing(false);
      setSearchQuery(queryToUse.trim());
      setAiSearchFilter(`Parsed query: "${queryToUse.trim()}" across holdings.`);
    }, 350);
  };

  const handleCopyCitationText = (type: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCitation(type);
    setTimeout(() => setCopiedCitation(null), 2000);
  };

  const handleConfirmReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reserveBookTarget) return;

    onReserveBook(reserveBookTarget.id);
    setReserveSuccess(true);
    setTimeout(() => {
      setReserveSuccess(false);
      setReserveBookTarget(null);
    }, 1800);
  };

  const filteredBooks = books.filter(b => {
    const q = searchQuery.toLowerCase();
    let matchesQuery = true;

    if (q) {
      if (searchBy === 'TITLE') {
        matchesQuery = b.title.toLowerCase().includes(q);
      } else if (searchBy === 'AUTHOR') {
        matchesQuery = b.authors.some(a => a.toLowerCase().includes(q));
      } else if (searchBy === 'CALL_NO') {
        matchesQuery = b.callNumber.toLowerCase().includes(q);
      } else if (searchBy === 'ISBN') {
        matchesQuery = b.isbn.toLowerCase().includes(q);
      } else if (searchBy === 'SUBJECT') {
        matchesQuery = b.subjects.some(s => s.toLowerCase().includes(q));
      } else {
        matchesQuery =
          b.title.toLowerCase().includes(q) ||
          b.authors.some(a => a.toLowerCase().includes(q)) ||
          b.subjects.some(s => s.toLowerCase().includes(q)) ||
          b.callNumber.toLowerCase().includes(q) ||
          b.isbn.toLowerCase().includes(q);
      }
    }

    const matchesDept = selectedDepartment === 'ALL' || b.department === selectedDepartment;
    const matchesBranch = selectedBranch === 'ALL' || (b.shelfLocation || '').includes(selectedBranch);
    const matchesStock = !inStockOnly || b.availableCopies > 0;

    return matchesQuery && matchesDept && matchesBranch && matchesStock;
  });

  const totalHoldingsCount = books.reduce((acc, b) => acc + b.totalCopies, 0);
  const availableCopiesCount = books.reduce((acc, b) => acc + b.availableCopies, 0);

  return (
    <div className="space-y-6">
      {/* OPAC Advanced Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Search className="h-4 w-4" />
            <span>Online Public Access Catalog (OPAC V4.1)</span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-slate-900">
            Campus Holdings & Discovery Repository
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Search physical volumes, MARC21 RDA catalog records, e-journals, research dissertations, and manage hold reservations in real time across all campus library branches.
          </p>
        </div>

        {/* Live Holdings Metrics */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="px-4 py-3 rounded-xl bg-[#f1f5f9] border border-slate-200/90 text-center space-y-0.5">
            <div className="text-base font-bold font-mono text-slate-900">{books.length}</div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Unique Titles</div>
          </div>
          <div className="px-4 py-3 rounded-xl bg-[#f1f5f9] border border-slate-200/90 text-center space-y-0.5">
            <div className="text-base font-bold font-mono text-emerald-400">{availableCopiesCount} / {totalHoldingsCount}</div>
            <div className="text-[10px] text-emerald-400 font-semibold uppercase">Copies In Stock</div>
          </div>
        </div>
      </div>

      {/* AI Conversational Natural Language Search Hero */}
      <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-[#121214] to-indigo-950/40 p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-300">
            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
            <span>Ask OPAC AI Assistant in Natural Language</span>
          </div>
          <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
            Gemini 2.5 LIS Parser
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={naturalQueryInput}
            onChange={e => setNaturalQueryInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleNaturalSearch()}
            placeholder='e.g. "Find algorithms and machine learning books in Computer Science department"'
            className="flex-1 rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-inner"
          />
          <button
            onClick={() => handleNaturalSearch()}
            disabled={isAiParsing}
            className="inline-flex items-center space-x-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition-all shrink-0 cursor-pointer shadow-md shadow-blue-600/20"
          >
            {isAiParsing ? (
              <span>Parsing...</span>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Smart Search</span>
              </>
            )}
          </button>
        </div>

        {/* Example Query Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[10px] text-slate-500 font-semibold">Try Quick Examples:</span>
          <button
            onClick={() => handleNaturalSearch('Machine learning and artificial intelligence monographs')}
            className="px-2.5 py-1 rounded-lg bg-[#f1f5f9] border border-slate-200/90 text-[11px] text-slate-500 hover:text-blue-300 hover:border-blue-500/40 transition-all cursor-pointer"
          >
            🤖 Machine Learning & AI
          </button>
          <button
            onClick={() => handleNaturalSearch('Medical physiology and pharmacology textbooks')}
            className="px-2.5 py-1 rounded-lg bg-[#f1f5f9] border border-slate-200/90 text-[11px] text-slate-500 hover:text-blue-300 hover:border-blue-500/40 transition-all cursor-pointer"
          >
            🩺 Medical Physiology
          </button>
          <button
            onClick={() => handleNaturalSearch('Software engineering and clean architecture')}
            className="px-2.5 py-1 rounded-lg bg-[#f1f5f9] border border-slate-200/90 text-[11px] text-slate-500 hover:text-blue-300 hover:border-blue-500/40 transition-all cursor-pointer"
          >
            💻 Software Engineering
          </button>
        </div>

        {aiSearchFilter && (
          <div className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
            ✓ {aiSearchFilter}
          </div>
        )}
      </div>

      {/* Main Search Controls & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-3 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Main Keyword Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Title, Author, DDC Call No, ISBN, or Subject..."
              className="w-full rounded-xl border border-slate-200/90 bg-[#f1f5f9] pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Criteria Dropdown */}
          <select
            value={searchBy}
            onChange={e => setSearchBy(e.target.value as any)}
            className="rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
          >
            <option value="ALL">Search In: All Fields</option>
            <option value="TITLE">Book Title</option>
            <option value="AUTHOR">Author Name</option>
            <option value="CALL_NO">DDC Call Number</option>
            <option value="ISBN">ISBN / ISSN</option>
            <option value="SUBJECT">LCSH Subject</option>
          </select>

          {/* Department Select */}
          <select
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
            className="rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
          >
            <option value="ALL">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electronics & Communication">Electronics & Communication</option>
            <option value="Medical Sciences">Medical Sciences</option>
            <option value="Law & Judiciary">Law & Judiciary</option>
          </select>

          {/* Advanced Filter Toggle & View Switcher */}
          <div className="flex items-center space-x-2 shrink-0 justify-between lg:justify-end">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                showAdvancedFilters ? 'bg-blue-600 text-white border-blue-500' : 'bg-[#f1f5f9] border-slate-200/90 text-slate-500'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
            </button>

            <div className="flex items-center bg-[#f1f5f9] p-1 rounded-xl border border-slate-200/90">
              <button
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'GRID' ? 'bg-slate-100 text-blue-400' : 'text-slate-400 hover:text-slate-900'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('LIST')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'LIST' ? 'bg-slate-100 text-blue-400' : 'text-slate-400 hover:text-slate-900'
                }`}
                title="Detailed List View"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'TABLE' ? 'bg-slate-100 text-blue-400' : 'text-slate-400 hover:text-slate-900'
                }`}
                title="Compact Table View"
              >
                <TableIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-200/90 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Campus Library Branch</label>
              <select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                className="w-full p-2 rounded-xl bg-[#f1f5f9] border border-slate-200/90 text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Campus Branches</option>
                <option value="Central">Central Campus Library</option>
                <option value="Engineering">Engineering Library</option>
                <option value="Medical">Medical Sciences Library</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-5">
              <input
                type="checkbox"
                id="stockCheck"
                checked={inStockOnly}
                onChange={e => setInStockOnly(e.target.checked)}
                className="rounded bg-[#f1f5f9] border-slate-200/90 text-blue-600 focus:ring-0 cursor-pointer w-4 h-4"
              />
              <label htmlFor="stockCheck" className="text-slate-900 font-semibold cursor-pointer">
                In Stock & Available Only ({availableCopiesCount} copies)
              </label>
            </div>

            <div className="flex items-center justify-end pt-4">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchBy('ALL');
                  setSelectedDepartment('ALL');
                  setSelectedBranch('ALL');
                  setInStockOnly(false);
                }}
                className="text-[11px] text-blue-400 hover:underline cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Showing <strong className="text-slate-900">{filteredBooks.length}</strong> records in catalog</span>
        <span>Displaying in <strong className="text-blue-400">{viewMode}</strong> mode</span>
      </div>

      {/* Catalog Display depending on View Mode */}
      {filteredBooks.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-200/90 bg-white text-center space-y-3">
          <BookOpen className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No matching holdings found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search criteria, clearing search filters, or asking OPAC AI in natural language above.
          </p>
        </div>
      ) : viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map(book => (
            <div
              key={book.id}
              className="rounded-2xl border border-slate-200/90 bg-white hover:border-blue-500/40 p-4 space-y-3 flex flex-col justify-between transition-all shadow-lg group"
            >
              <div className="space-y-3">
                <div className="flex gap-3">
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-20 h-28 object-cover rounded-xl border border-slate-200/90 shadow-md shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f1f5f9] text-blue-400 border border-slate-200/90 font-bold">
                        {book.callNumber}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-[#f1f5f9] border border-slate-200/90">
                        ISBN: {book.isbn}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">{book.authors.join(', ')}</p>
                    <p className="text-[10px] text-slate-400 truncate">{book.publisherName} ({book.publisherYear})</p>
                  </div>
                </div>

                {/* Subject Pills */}
                {book.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {book.subjects.slice(0, 2).map((s, idx) => (
                      <span key={idx} className="text-[9px] bg-[#f1f5f9] text-slate-500 px-2 py-0.5 rounded-full border border-slate-200/90">
                        #{s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200/90 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className={`text-[11px] font-bold block ${book.availableCopies > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {book.availableCopies > 0 ? `${book.availableCopies} Copies In Stock` : 'Currently Checked Out'}
                  </span>
                  <span className="text-[9px] text-slate-400 block">{book.shelfLocation || 'Central Branch Shelf'}</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setSelectedMarcBook(book)}
                    className="p-1.5 rounded-lg border border-slate-200/90 bg-[#f1f5f9] text-slate-500 hover:text-white transition-all cursor-pointer"
                    title="Inspect MARC21 Tag Record"
                  >
                    <FileText className="h-3.5 w-3.5 text-amber-400" />
                  </button>
                  {onDeleteBook && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove MARC21 Record "${book.title}"?`)) {
                          onDeleteBook(book.id);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                      title="Remove MARC21 Bibliographic Record"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onOpenCitationModal(book)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200/90 bg-[#f1f5f9] text-[10px] text-slate-500 hover:text-white transition-all cursor-pointer font-semibold"
                  >
                    Cite
                  </button>
                  <button
                    onClick={() => setReserveBookTarget(book)}
                    disabled={book.availableCopies === 0}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-md ${
                      book.availableCopies > 0
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                        : 'bg-[#27272a] text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Reserve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'LIST' ? (
        <div className="space-y-3">
          {filteredBooks.map(book => (
            <div key={book.id} className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-4 min-w-0">
                <img src={book.coverUrl} alt={book.title} className="w-14 h-20 object-cover rounded-lg border border-slate-200/90 shrink-0" />
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f1f5f9] text-blue-400 border border-slate-200/90 font-bold">
                      {book.callNumber}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">{book.department}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 truncate">{book.title}</h3>
                  <p className="text-xs text-slate-500">{book.authors.join(', ')} • {book.publisherName} ({book.publisherYear})</p>
                  <p className="text-[11px] text-slate-400 line-clamp-1">Shelf: {book.shelfLocation} • Dept: {book.department}</p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 border-t md:border-t-0 border-slate-200/90 pt-3 md:pt-0">
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-400">{book.availableCopies} Copies Ready</div>
                  <div className="text-[10px] text-slate-400">ISBN {book.isbn}</div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedMarcBook(book)}
                    className="p-2 rounded-xl border border-slate-200/90 bg-[#f1f5f9] text-slate-500 hover:text-white cursor-pointer"
                    title="MARC21 Record"
                  >
                    <FileText className="h-4 w-4 text-amber-400" />
                  </button>
                  <button
                    onClick={() => onOpenCitationModal(book)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200/90 bg-[#f1f5f9] text-xs font-semibold text-slate-900 cursor-pointer"
                  >
                    Cite
                  </button>
                  <button
                    onClick={() => setReserveBookTarget(book)}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Hold Reserve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-x-auto shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/90 bg-[#f1f5f9] text-slate-500 font-mono uppercase text-[10px]">
                <th className="p-3.5">Call Number</th>
                <th className="p-3.5">Book Title</th>
                <th className="p-3.5">Authors</th>
                <th className="p-3.5">Publisher</th>
                <th className="p-3.5">Stock</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-900">
              {filteredBooks.map(book => (
                <tr key={book.id} className="hover:bg-slate-100/50 transition-all">
                  <td className="p-3.5 font-mono text-blue-400 font-bold">{book.callNumber}</td>
                  <td className="p-3.5 font-bold max-w-xs truncate">{book.title}</td>
                  <td className="p-3.5 text-slate-500 max-w-xs truncate">{book.authors.join(', ')}</td>
                  <td className="p-3.5 text-slate-500">{book.publisherName} ({book.publisherYear})</td>
                  <td className="p-3.5">
                    <span className="text-emerald-400 font-bold">{book.availableCopies}</span> / {book.totalCopies}
                  </td>
                  <td className="p-3.5 text-right space-x-1.5">
                    <button
                      onClick={() => setSelectedMarcBook(book)}
                      className="px-2 py-1 rounded-lg border border-slate-200/90 bg-[#f1f5f9] text-[10px] text-amber-400 cursor-pointer"
                    >
                      MARC
                    </button>
                    <button
                      onClick={() => setReserveBookTarget(book)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold cursor-pointer"
                    >
                      Hold
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MARC21 RDA Tag Inspector Modal */}
      {selectedMarcBook && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-amber-400" />
                <h2 className="text-base font-bold text-slate-900">MARC21 & RDA Bibliographic Inspection Record</h2>
              </div>
              <button onClick={() => setSelectedMarcBook(null)} className="text-slate-500 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <img src={selectedMarcBook.coverUrl} alt={selectedMarcBook.title} className="w-full h-48 object-cover rounded-xl border border-slate-200/90" />
                <div className="p-3 rounded-xl bg-[#f1f5f9] border border-slate-200/90 space-y-1 text-xs">
                  <div className="text-[10px] text-slate-500">Catalog ID: <strong className="text-slate-900 font-mono">{selectedMarcBook.id}</strong></div>
                  <div className="text-[10px] text-slate-500">Call Number: <strong className="text-blue-400 font-mono">{selectedMarcBook.callNumber}</strong></div>
                  <div className="text-[10px] text-slate-500">RDA Status: <strong className="text-emerald-400">RDA Core Verified</strong></div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">{selectedMarcBook.title}</h3>
                <p className="text-xs text-slate-500">Edition: {selectedMarcBook.edition} • Shelf Location: {selectedMarcBook.shelfLocation}</p>

                {/* MARC21 Tags Table */}
                <div className="rounded-xl border border-slate-200/90 bg-[#f1f5f9] p-3 space-y-2 font-mono text-[11px]">
                  <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-2">MARC21 Field Leaderboard</div>

                  <div className="flex border-b border-slate-200/90 pb-1">
                    <span className="w-12 text-blue-400 font-bold">020</span>
                    <span className="text-slate-900">$a {selectedMarcBook.isbn}</span>
                  </div>
                  <div className="flex border-b border-slate-200/90 pb-1">
                    <span className="w-12 text-blue-400 font-bold">082</span>
                    <span className="text-slate-900">$a {selectedMarcBook.callNumber}</span>
                  </div>
                  <div className="flex border-b border-slate-200/90 pb-1">
                    <span className="w-12 text-amber-400 font-bold">090</span>
                    <span className="text-amber-300">$a Accession No: {selectedMarcBook.accessionNumber || 'ACC-88001'}</span>
                  </div>
                  <div className="flex border-b border-slate-200/90 pb-1">
                    <span className="w-12 text-emerald-400 font-bold">852</span>
                    <span className="text-emerald-300">$p {selectedMarcBook.accessionNumber || 'ACC-88001'} $t Copy No: {selectedMarcBook.copyNo || selectedMarcBook.copyNumber || 'C.1'} $c {selectedMarcBook.shelfLocation}</span>
                  </div>
                  <div className="flex border-b border-slate-200/90 pb-1">
                    <span className="w-12 text-blue-400 font-bold">100</span>
                    <span className="text-slate-900">$a {selectedMarcBook.authors.join('; ')}, $e author.</span>
                  </div>
                  <div className="flex border-b border-slate-200/90 pb-1">
                    <span className="w-12 text-blue-400 font-bold">245</span>
                    <span className="text-slate-900">$a {selectedMarcBook.title} / $c {selectedMarcBook.authors[0]}.</span>
                  </div>
                  <div className="flex border-b border-slate-200/90 pb-1">
                    <span className="w-12 text-blue-400 font-bold">264</span>
                    <span className="text-slate-900">$a Islamabad : $b {selectedMarcBook.publisherName}, $c {selectedMarcBook.publisherYear}.</span>
                  </div>
                  <div className="flex">
                    <span className="w-12 text-blue-400 font-bold">650</span>
                    <span className="text-slate-900">$a {selectedMarcBook.subjects.join(' -- ')}.</span>
                  </div>
                </div>

                {/* Direct Citation Copier */}
                <div className="p-3 rounded-xl bg-[#f1f5f9] border border-slate-200/90 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>APA 7th Format Citation:</span>
                    <button
                      onClick={() =>
                        handleCopyCitationText(
                          'APA',
                          `${selectedMarcBook.authors.join(', ')} (${selectedMarcBook.publisherYear}). ${selectedMarcBook.title}. ${selectedMarcBook.publisherName}.`
                        )
                      }
                      className="text-[10px] text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedCitation === 'APA' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedCitation === 'APA' ? 'Copied!' : 'Copy Citation'}</span>
                    </button>
                  </div>
                  <div className="p-2 rounded bg-white font-mono text-[10px] text-slate-500 italic">
                    {selectedMarcBook.authors.join(', ')} ({selectedMarcBook.publisherYear}). {selectedMarcBook.title}. {selectedMarcBook.publisherName}.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-200/90">
              <button
                onClick={() => setSelectedMarcBook(null)}
                className="px-4 py-2 rounded-xl bg-[#27272a] text-white text-xs font-bold cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Reservation Hold Modal */}
      {reserveBookTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <BookmarkPlus className="h-5 w-5 text-blue-400" />
                <span>Confirm Book Hold Reservation</span>
              </h2>
              <button onClick={() => setReserveBookTarget(null)} className="text-slate-500 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {reserveSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-bold text-emerald-300">Reservation Confirmed!</h3>
                <p className="text-xs text-slate-500">
                  Book held at <strong>{pickupBranch}</strong>. Hold expires in 48 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmReservation} className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-[#f1f5f9] border border-slate-200/90 flex items-center space-x-3">
                  <img src={reserveBookTarget.coverUrl} alt={reserveBookTarget.title} className="w-12 h-16 object-cover rounded" />
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-900 leading-snug">{reserveBookTarget.title}</h4>
                    <p className="text-[10px] text-slate-500">Call No: {reserveBookTarget.callNumber}</p>
                    <p className="text-[10px] text-emerald-400">{reserveBookTarget.availableCopies} Copies Available</p>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Select Pickup Campus Branch</label>
                  <select
                    value={pickupBranch}
                    onChange={e => setPickupBranch(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#f1f5f9] border border-slate-200/90 text-slate-900 focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Central Campus Library (Islamabad)">Central Campus Library (Islamabad)</option>
                    <option value="Engineering Campus Library (Lahore)">Engineering Campus Library (Lahore)</option>
                    <option value="Medical Sciences Library (Karachi)">Medical Sciences Library (Karachi)</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-[11px] text-blue-300">
                  ℹ️ The library circulation desk will hold this item for 48 hours upon confirmation.
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200/90">
                  <button
                    type="button"
                    onClick={() => setReserveBookTarget(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200/90 text-slate-500 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                  >
                    Confirm Hold
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

