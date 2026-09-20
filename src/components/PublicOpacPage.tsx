import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Globe,
  User,
  ExternalLink,
  LogIn,
  Filter,
  CheckCircle2,
  XCircle,
  Sparkles,
  Share2,
  Copy,
  Check,
  Bookmark,
  ChevronRight,
  Layers,
  GraduationCap,
  Calendar,
  FileText,
  Tag,
  Hash,
  ArrowRight,
  SlidersHorizontal,
  Info,
  Library,
  Compass,
  Award,
  Send,
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
  Menu,
  Bell,
  Newspaper,
  ShieldCheck,
  Laptop,
  Wifi,
  Printer,
  AlertCircle
} from 'lucide-react';
import { BookRecord, BookCopy, SystemSettings, UserProfile } from '../types/alims';
import pslimsLogo from '../assets/images/plims_emblem_logo_1788759356534.jpg';
import { PakistanFlyingFlag } from './PakistanFlyingFlag';

interface PublicOpacPageProps {
  books: BookRecord[];
  copies: BookCopy[];
  settings: SystemSettings;
  currentUser?: UserProfile | null;
  isAuthenticated?: boolean;
  onOpenLogin: () => void;
  onReturnToDashboard?: () => void;
}

export const PublicOpacPage: React.FC<PublicOpacPageProps> = ({
  books,
  copies,
  settings,
  currentUser,
  isAuthenticated = false,
  onOpenLogin,
  onReturnToDashboard
}) => {
  // Navigation Section State: 'HOME' | 'OPAC' | 'BROWSE' | 'INFO' | 'ABOUT' | 'CONTACT'
  const [activeSection, setActiveSection] = useState<'HOME' | 'OPAC' | 'BROWSE' | 'INFO' | 'ABOUT' | 'CONTACT'>('HOME');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'ALL' | 'TITLE' | 'AUTHOR' | 'SUBJECT' | 'CALL_NO' | 'ISBN' | 'PUBLISHER'>('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'TITLE' | 'YEAR_DESC' | 'AVAILABLE'>('TITLE');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

  // Selected Book for Bibliographic Detail Modal
  const [selectedBook, setSelectedBook] = useState<BookRecord | null>(null);

  // Citation Copy State
  const [copiedCitationFormat, setCopiedCitationFormat] = useState<string | null>(null);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('GENERAL');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccessMsg, setContactSuccessMsg] = useState(false);

  // Browse Section Interactive Filtering State
  const [browseDdcFilter, setBrowseDdcFilter] = useState<string | null>(null);
  const [browseLetterFilter, setBrowseLetterFilter] = useState<string | null>(null);
  const [browseFormatFilter, setBrowseFormatFilter] = useState<string | null>(null);

  // FAQ Accordion State (Contact / Library Info)
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);

  // Mobile Navigation Drawer State
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Quick Tags
  const quickSearchTags = [
    'Computer Science',
    'Artificial Intelligence',
    'Medical Sciences',
    'Urdu Literature',
    'Pakistan Studies',
    'Civil Engineering',
    'Islamic Jurisprudence',
    'Business Management'
  ];

  // Distinct Departments from Catalog
  const departments = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => {
      if (b.department) set.add(b.department);
    });
    return Array.from(set).sort();
  }, [books]);

  // Filtered & Sorted Books
  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return books.filter(b => {
      // 1. Text Query Filter
      if (q) {
        if (searchField === 'TITLE') {
          if (!b.title.toLowerCase().includes(q) && !(b.subtitle && b.subtitle.toLowerCase().includes(q))) return false;
        } else if (searchField === 'AUTHOR') {
          if (!b.authors.some(a => a.toLowerCase().includes(q))) return false;
        } else if (searchField === 'SUBJECT') {
          if (!b.subjects.some(s => s.toLowerCase().includes(q))) return false;
        } else if (searchField === 'CALL_NO') {
          if (!b.callNumber.toLowerCase().includes(q)) return false;
        } else if (searchField === 'ISBN') {
          if (!b.isbn.toLowerCase().includes(q)) return false;
        } else if (searchField === 'PUBLISHER') {
          if (!b.publisherName.toLowerCase().includes(q)) return false;
        } else {
          // ALL fields
          const matchTitle = b.title.toLowerCase().includes(q) || (b.subtitle && b.subtitle.toLowerCase().includes(q));
          const matchAuthor = b.authors.some(a => a.toLowerCase().includes(q));
          const matchSubject = b.subjects.some(s => s.toLowerCase().includes(q));
          const matchCallNo = b.callNumber.toLowerCase().includes(q);
          const matchIsbn = b.isbn.toLowerCase().includes(q);
          const matchPub = b.publisherName.toLowerCase().includes(q);
          const matchDept = b.department && b.department.toLowerCase().includes(q);
          if (!matchTitle && !matchAuthor && !matchSubject && !matchCallNo && !matchIsbn && !matchPub && !matchDept) {
            return false;
          }
        }
      }

      // 2. Department Filter
      if (selectedDept !== 'ALL' && b.department !== selectedDept) {
        return false;
      }

      // 3. Availability Filter
      if (availableOnly && b.availableCopies <= 0) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'YEAR_DESC') {
        return (b.publisherYear || 0) - (a.publisherYear || 0);
      }
      if (sortBy === 'AVAILABLE') {
        return b.availableCopies - a.availableCopies;
      }
      return a.title.localeCompare(b.title);
    });
  }, [books, searchQuery, searchField, selectedDept, availableOnly, sortBy]);

  // Overall Statistics
  const totalHoldings = useMemo(() => {
    return books.reduce((acc, b) => acc + (b.totalCopies || 1), 0);
  }, [books]);

  const totalAvailable = useMemo(() => {
    return books.reduce((acc, b) => acc + (b.availableCopies || 0), 0);
  }, [books]);

  // Copies associated with selected book
  const selectedBookCopies = useMemo(() => {
    if (!selectedBook) return [];
    return copies.filter(c => c.bookId === selectedBook.id || c.bookId === selectedBook.title);
  }, [selectedBook, copies]);

  // Copy citation helper
  const handleCopyCitation = (format: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCitationFormat(format);
    setTimeout(() => setCopiedCitationFormat(null), 2000);
  };

  // Generate citations
  const generateCitation = (b: BookRecord, style: 'APA' | 'MLA' | 'CHICAGO' | 'HARVARD') => {
    const authorsStr = b.authors.join(', ');
    const year = b.publisherYear || new Date().getFullYear();
    const title = b.title;
    const publisher = b.publisherName;
    const place = b.publisherLocation || b.publisherPlace || 'Pakistan';

    switch (style) {
      case 'APA':
        return `${authorsStr} (${year}). ${title} (${b.edition || '1st ed.'}). ${publisher}.`;
      case 'MLA':
        return `${authorsStr}. ${title}. ${b.edition ? b.edition + ', ' : ''}${publisher}, ${year}.`;
      case 'CHICAGO':
        return `${authorsStr}. ${year}. ${title}. ${place}: ${publisher}.`;
      case 'HARVARD':
        return `${authorsStr}, ${year}. ${title}, ${b.edition || '1st edn'}, ${publisher}, ${place}.`;
      default:
        return `${authorsStr} (${year}). ${title}. ${publisher}.`;
    }
  };

  // Handle contact form submit
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccessMsg(true);
    setContactName('');
    setContactEmail('');
    setContactMessage('');
    setTimeout(() => setContactSuccessMsg(false), 5000);
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-zinc-900 font-sans flex flex-col selection:bg-emerald-600 selection:text-white antialiased">
      
      {/* ========================================================================= */}
      {/* 1. TOP ANNOUNCEMENT & STAFF SESSION BANNER                                */}
      {/* ========================================================================= */}
      <div className="bg-[#063a22] text-emerald-100 text-xs py-2 px-4 border-b border-emerald-800/60 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-center sm:text-left">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white tracking-wide">
              {settings.libraryName || 'Pakistan Central Academic Library'}
            </span>
            <span className="hidden md:inline text-emerald-300/80">•</span>
            <span className="hidden md:inline text-emerald-200/90 font-medium">
              {settings.institutionName || 'National Higher Education & Technology Portal'}
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            {isAuthenticated && currentUser ? (
              <div className="flex items-center space-x-2 bg-emerald-950/70 px-3 py-1 rounded-full border border-emerald-500/40">
                <span className="text-emerald-300 font-medium">
                  Logged in as: <strong>{currentUser.name}</strong> ({currentUser.role})
                </span>
                {onReturnToDashboard && (
                  <button
                    onClick={onReturnToDashboard}
                    className="ml-2 text-white font-bold underline hover:text-emerald-200 cursor-pointer"
                  >
                    Return to Dashboard →
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="hidden lg:flex items-center space-x-1.5 text-emerald-200">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{settings.openingHours || 'Mon - Sat: 08:00 AM - 08:00 PM'}</span>
                </div>
                <button
                  onClick={onOpenLogin}
                  className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Staff / Member Login</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN PUBLIC HEADER & NAVIGATION BAR                                    */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/90 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Institutional Emblem */}
          <div
            onClick={() => setActiveSection('HOME')}
            className="flex items-center space-x-3.5 cursor-pointer group"
          >
            <img
              src={pslimsLogo}
              alt="PLiMS National Logo"
              className="w-11 h-11 rounded-xl object-contain shadow-xs border border-zinc-200 p-0.5 group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-black tracking-tight text-[#095733] font-sans">
                  PLiMS
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  4.1.1 PK
                </span>
              </div>
              <h1 className="text-xs font-bold text-zinc-800 tracking-tight line-clamp-1">
                {settings.libraryName || 'Pakistan Central Academic Library'}
              </h1>
              <p className="text-[10px] text-zinc-500 hidden sm:block">
                Online Public Access Catalogue (OPAC)
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 font-medium text-xs text-zinc-700">
            <button
              onClick={() => setActiveSection('HOME')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeSection === 'HOME'
                  ? 'bg-emerald-50 text-[#095733] font-bold shadow-xs'
                  : 'hover:bg-zinc-100 text-zinc-700'
              }`}
            >
              HOME
            </button>
            <button
              onClick={() => setActiveSection('OPAC')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1 ${
                activeSection === 'OPAC'
                  ? 'bg-emerald-50 text-[#095733] font-bold shadow-xs'
                  : 'hover:bg-zinc-100 text-zinc-700'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-emerald-600" />
              <span>OPAC / SEARCH</span>
            </button>
            <button
              onClick={() => setActiveSection('BROWSE')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeSection === 'BROWSE'
                  ? 'bg-emerald-50 text-[#095733] font-bold shadow-xs'
                  : 'hover:bg-zinc-100 text-zinc-700'
              }`}
            >
              BROWSE
            </button>
            <button
              onClick={() => setActiveSection('INFO')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeSection === 'INFO'
                  ? 'bg-emerald-50 text-[#095733] font-bold shadow-xs'
                  : 'hover:bg-zinc-100 text-zinc-700'
              }`}
            >
              LIBRARY INFORMATION
            </button>
            <button
              onClick={() => setActiveSection('ABOUT')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeSection === 'ABOUT'
                  ? 'bg-emerald-50 text-[#095733] font-bold shadow-xs'
                  : 'hover:bg-zinc-100 text-zinc-700'
              }`}
            >
              ABOUT
            </button>
            <button
              onClick={() => setActiveSection('CONTACT')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeSection === 'CONTACT'
                  ? 'bg-emerald-50 text-[#095733] font-bold shadow-xs'
                  : 'hover:bg-zinc-100 text-zinc-700'
              }`}
            >
              CONTACT
            </button>
          </nav>

          {/* Right Action: Flag + Login Button + Mobile Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden sm:block p-1 rounded-xl bg-zinc-50 border border-zinc-200 shadow-2xs">
              <PakistanFlyingFlag size="sm" showMast={false} />
            </div>

            {isAuthenticated ? (
              <button
                onClick={onReturnToDashboard}
                className="px-3 sm:px-4 py-2 rounded-xl bg-[#095733] hover:bg-[#074729] text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center space-x-1.5 cursor-pointer"
              >
                <Library className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </button>
            ) : (
              <button
                id="btn-public-login"
                onClick={onOpenLogin}
                className="px-3 sm:px-4 py-2 rounded-xl bg-[#095733] hover:bg-[#074729] text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center space-x-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}

            {/* Mobile Nav Button */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileNavOpen && (
          <div className="md:hidden bg-white border-t border-zinc-200 px-4 py-3 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
            {[
              { id: 'HOME', label: 'HOME', icon: BookOpen },
              { id: 'OPAC', label: 'OPAC / SEARCH', icon: Search },
              { id: 'BROWSE', label: 'BROWSE', icon: Compass },
              { id: 'INFO', label: 'LIBRARY INFORMATION', icon: Building2 },
              { id: 'ABOUT', label: 'ABOUT', icon: Award },
              { id: 'CONTACT', label: 'CONTACT', icon: Mail }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id as any);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-[#095733] border border-emerald-200'
                      : 'text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#095733]' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Mobile / Tablet Horizontal Navigation Tabs */}
        <div className="md:hidden overflow-x-auto no-scrollbar py-2 px-3 bg-zinc-50/95 border-t border-zinc-200 flex items-center space-x-1.5 shrink-0 text-xs">
          <button
            onClick={() => { setActiveSection('HOME'); setMobileNavOpen(false); }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold text-xs transition-all cursor-pointer ${
              activeSection === 'HOME'
                ? 'bg-[#095733] text-white shadow-xs'
                : 'bg-white text-zinc-700 border border-zinc-200'
            }`}
          >
            HOME
          </button>
          <button
            onClick={() => { setActiveSection('OPAC'); setMobileNavOpen(false); }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold text-xs transition-all cursor-pointer flex items-center space-x-1 ${
              activeSection === 'OPAC'
                ? 'bg-[#095733] text-white shadow-xs'
                : 'bg-white text-zinc-700 border border-zinc-200'
            }`}
          >
            <Search className="w-3 h-3" />
            <span>OPAC / SEARCH</span>
          </button>
          <button
            onClick={() => { setActiveSection('BROWSE'); setMobileNavOpen(false); }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold text-xs transition-all cursor-pointer ${
              activeSection === 'BROWSE'
                ? 'bg-[#095733] text-white shadow-xs'
                : 'bg-white text-zinc-700 border border-zinc-200'
            }`}
          >
            BROWSE
          </button>
          <button
            onClick={() => { setActiveSection('INFO'); setMobileNavOpen(false); }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold text-xs transition-all cursor-pointer ${
              activeSection === 'INFO'
                ? 'bg-[#095733] text-white shadow-xs'
                : 'bg-white text-zinc-700 border border-zinc-200'
            }`}
          >
            LIBRARY INFORMATION
          </button>
          <button
            onClick={() => { setActiveSection('ABOUT'); setMobileNavOpen(false); }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold text-xs transition-all cursor-pointer ${
              activeSection === 'ABOUT'
                ? 'bg-[#095733] text-white shadow-xs'
                : 'bg-white text-zinc-700 border border-zinc-200'
            }`}
          >
            ABOUT
          </button>
          <button
            onClick={() => { setActiveSection('CONTACT'); setMobileNavOpen(false); }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold text-xs transition-all cursor-pointer ${
              activeSection === 'CONTACT'
                ? 'bg-[#095733] text-white shadow-xs'
                : 'bg-white text-zinc-700 border border-zinc-200'
            }`}
          >
            CONTACT
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. HERO & SEARCH EXPERIENCE (APPEARS ON HOME & OPAC)                      */}
      {/* ========================================================================= */}
      <section className="relative bg-gradient-to-b from-[#095733] via-[#074729] to-[#042e1b] text-white py-12 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-inner">
        {/* Subtle patterned backdrop */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          
          {/* Badges */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-900/60 border border-emerald-400/30 text-emerald-200 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Official Public Online Catalog (OPAC)</span>
            <span className="text-emerald-400 font-mono">• HEC Union Catalog Connected</span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">
              {settings.libraryName || 'Pakistan Central Academic Library'}
            </h2>
            <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto font-medium">
              {settings.customWelcomeNote ||
                'Discover books, research journals, academic dissertations, and digital archives across all physical and digital holdings.'}
            </p>
          </div>

          {/* Search Bar Container */}
          <div className="max-w-3xl mx-auto bg-white rounded-2xl p-2 sm:p-2.5 shadow-2xl border border-emerald-200/40 text-zinc-900">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              
              {/* Category Dropdown */}
              <div className="w-full sm:w-44 shrink-0">
                <select
                  value={searchField}
                  onChange={e => setSearchField(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-700 focus:outline-none focus:border-emerald-600 focus:bg-white cursor-pointer"
                >
                  <option value="ALL">All Fields</option>
                  <option value="TITLE">Title</option>
                  <option value="AUTHOR">Author / Contributor</option>
                  <option value="SUBJECT">Subject / Keyword</option>
                  <option value="CALL_NO">Call Number / DDC</option>
                  <option value="ISBN">ISBN / Barcode</option>
                  <option value="PUBLISHER">Publisher</option>
                </select>
              </div>

              {/* Text Input */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    if (activeSection !== 'OPAC') {
                      setActiveSection('OPAC');
                    }
                  }}
                  placeholder="Search by Title, Author, ISBN, Subject, or Call Number..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-8 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-emerald-600 focus:bg-white font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={() => setActiveSection('OPAC')}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#095733] hover:bg-[#074729] text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>

            {/* Quick Search Suggestions */}
            <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center flex-wrap gap-1.5 text-[11px] text-zinc-500 justify-center sm:justify-start px-1">
              <span className="font-semibold text-zinc-600">Quick Topics:</span>
              {quickSearchTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSearchQuery(tag);
                    setSearchField('ALL');
                    setActiveSection('OPAC');
                  }}
                  className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-emerald-50 hover:text-emerald-700 text-zinc-700 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Collection Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-2 text-center text-xs">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
              <div className="text-xl sm:text-2xl font-black text-white">{books.length}</div>
              <div className="text-[11px] text-emerald-200/90 font-medium">Catalogue Titles</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
              <div className="text-xl sm:text-2xl font-black text-white">{totalHoldings}</div>
              <div className="text-[11px] text-emerald-200/90 font-medium">Total Copies</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
              <div className="text-xl sm:text-2xl font-black text-white">{totalAvailable}</div>
              <div className="text-[11px] text-emerald-200/90 font-medium">Available on Shelf</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
              <div className="text-xl sm:text-2xl font-black text-white">{settings.branches?.length || 1}</div>
              <div className="text-[11px] text-emerald-200/90 font-medium">Campus Branches</div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CONTENT SECTIONS BASED ON ACTIVE TAB                                   */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ----------------------------------------------------------------------- */}
        {/* SECTION A: HOME OVERVIEW (CARDS, QUICK SERVICES, FEATURED TITLES)       */}
        {/* ----------------------------------------------------------------------- */}
        {activeSection === 'HOME' && (
          <div className="space-y-10">
            
            {/* Quick Access Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div
                onClick={() => setActiveSection('OPAC')}
                className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-sm hover:shadow-md transition-all hover:border-emerald-500/40 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#095733] border border-emerald-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 group-hover:text-[#095733] transition-colors">
                  Search Union Catalogue
                </h3>
                <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                  Search through physical books, references, standard MARC21 records, and check live real-time shelf availability.
                </p>
                <div className="mt-4 flex items-center text-xs font-bold text-[#095733]">
                  <span>Explore Catalogue</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div
                onClick={() => setActiveSection('BROWSE')}
                className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-sm hover:shadow-md transition-all hover:border-blue-500/40 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 group-hover:text-blue-700 transition-colors">
                  Browse by Academic Discipline
                </h3>
                <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                  Explore titles categorized under Computer Science, Medical Sciences, Law, Humanities, Engineering, and Social Sciences.
                </p>
                <div className="mt-4 flex items-center text-xs font-bold text-blue-700">
                  <span>Browse Departments</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div
                onClick={() => setActiveSection('INFO')}
                className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-sm hover:shadow-md transition-all hover:border-amber-500/40 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 group-hover:text-amber-700 transition-colors">
                  Library Hours & Locations
                </h3>
                <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                  View physical campus address, study room operating hours, library contact person, and directions.
                </p>
                <div className="mt-4 flex items-center text-xs font-bold text-amber-700">
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

            </div>

            {/* Academic Bulletins & Important Notices */}
            <div className="p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-[#095733]" />
                  <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                    Library News, Academic Bulletins & Notices
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Active Academic Semester
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 hover:border-emerald-500/40 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      HEC E-Resources
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Sep 2026</span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-900">
                    National Digital Library & E-Journal Access Activated
                  </h4>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    Over 30,000+ peer-reviewed scientific journals, IEEE Xplore, ScienceDirect, and ProQuest dissertations are accessible across all campus Wi-Fi networks and remote student credentials.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 hover:border-emerald-500/40 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Exhibition
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Fall 2026</span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-900">
                    Annual Academic Book Fair & New Arrivals Display
                  </h4>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    Explore newly catalogued physical acquisitions in Computer Science, Law, AI, Medicine, and Humanities on display in the Central Library Ground Floor Exhibition Hall.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 hover:border-emerald-500/40 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      Research & Theses
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Ongoing</span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-900">
                    Postgraduate Thesis Archival & Similarity Clearance
                  </h4>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    Graduating MS, MPhil, and PhD scholars must submit digital PDF copies and obtain official Turnitin anti-plagiarism clearance certificates from the Reference Division.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 hover:border-emerald-500/40 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      Extended Hours
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Exam Season</span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-900">
                    Extended 24/7 Reading Hall & Study Pods Schedule
                  </h4>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    The Central Academic Reading Hall remains open 24 hours daily during examination preparatory weeks with quiet zones, power sockets, and research carrel access.
                  </p>
                </div>
              </div>
            </div>

            {/* Core Academic Library Services Grid */}
            <div className="p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Library className="w-4 h-4 text-[#095733]" />
                  <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                    Core Academic Services & Facilities
                  </h3>
                </div>
                <button
                  onClick={() => setActiveSection('INFO')}
                  className="text-xs font-bold text-[#095733] hover:underline"
                >
                  Full Directory & Policies →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/60 flex flex-col items-center space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-zinc-800">RFID Circulation</span>
                  <p className="text-[10px] text-zinc-500">Automated borrowing & fast returns</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/60 flex flex-col items-center space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-zinc-800">Digital OPAC Kiosks</span>
                  <p className="text-[10px] text-zinc-500">Dedicated catalogue terminals</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/60 flex flex-col items-center space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-zinc-800">Turnitin Clearance</span>
                  <p className="text-[10px] text-zinc-500">Official plagiarism check</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/60 flex flex-col items-center space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-zinc-800">Campus PERN Wi-Fi</span>
                  <p className="text-[10px] text-zinc-500">High-speed research network</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/60 flex flex-col items-center space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-zinc-800">Inter-Library Loan</span>
                  <p className="text-[10px] text-zinc-500">National union sharing</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/60 flex flex-col items-center space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                    <Printer className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-zinc-800">Reprographics</span>
                  <p className="text-[10px] text-zinc-500">Copying, scanning & binding</p>
                </div>
              </div>
            </div>

            {/* Featured Recent Acquisitions Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-[#095733]" />
                    <span>Featured & Recent Library Holdings</span>
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Latest acquisitions catalogued across the library system.
                  </p>
                </div>

                <button
                  onClick={() => setActiveSection('OPAC')}
                  className="text-xs font-bold text-[#095733] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>View Full Catalogue ({books.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {books.slice(0, 8).map(book => (
                  <div
                    key={book.id}
                    onClick={() => setSelectedBook(book)}
                    className="p-4 rounded-2xl bg-white border border-zinc-200/90 hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                          {book.callNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            book.availableCopies > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {book.availableCopies > 0 ? `${book.availableCopies} Available` : 'Issued'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-zinc-900 group-hover:text-[#095733] transition-colors line-clamp-2">
                        {book.title}
                      </h4>

                      <p className="text-xs text-zinc-500 line-clamp-1">
                        {book.authors.join(', ')}
                      </p>

                      <div className="text-[11px] text-zinc-400 flex items-center space-x-2 pt-1 border-t border-zinc-100">
                        <span>{book.publisherYear}</span>
                        <span>•</span>
                        <span className="truncate">{book.department}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-[#095733] font-semibold">
                      <span>Inspect Record</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Institutional Information Summary Section */}
            <div className="p-8 rounded-3xl bg-white border border-zinc-200/90 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
                <div>
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[#095733] text-[11px] font-bold mb-2">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Official Library Information</span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 tracking-tight">
                    {settings.libraryName || 'Pakistan Central Academic Library'}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Parent Institution: <strong className="text-zinc-700">{settings.institutionName}</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveSection('INFO')}
                    className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    View All Branches & Hours
                  </button>
                  <button
                    onClick={onOpenLogin}
                    className="px-4 py-2 rounded-xl bg-[#095733] hover:bg-[#074729] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Staff / Admin Login</span>
                  </button>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                  <span className="text-zinc-500 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>Library Address</span>
                  </span>
                  <p className="font-bold text-zinc-800 pt-1">
                    {settings.libraryPlace || 'Central Library Building, Sector H-9, Main Campus'}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {settings.libraryLocation || 'Islamabad, Pakistan'} {settings.postalCode ? `(${settings.postalCode})` : ''}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                  <span className="text-zinc-500 flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Contact Phone</span>
                  </span>
                  <p className="font-bold text-zinc-800 pt-1">
                    {settings.libraryMobileNo || '+92 300 9876543'}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Office: {settings.libraryOfficeNo || '+92 51 92654321'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                  <span className="text-zinc-500 flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Official Email</span>
                  </span>
                  <p className="font-bold text-zinc-800 pt-1 truncate">
                    {settings.libraryEmail || 'central.library@pslims.edu.pk'}
                  </p>
                  <a
                    href={settings.websiteUrl || 'https://pslims.edu.pk'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center space-x-1 pt-0.5"
                  >
                    <span>Visit Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                  <span className="text-zinc-500 flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    <span>Head Officer / Librarian</span>
                  </span>
                  <p className="font-bold text-zinc-800 pt-1">
                    {settings.chiefLibrarianName || 'Prof. Mr. Aijaz Akhter Ahmedani & Sara Khan'}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Chief Librarian Services
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* SECTION B: OPAC / CATALOGUE SEARCH RESULTS & FILTERS                    */}
        {/* ----------------------------------------------------------------------- */}
        {activeSection === 'OPAC' && (
          <div className="space-y-6">
            
            {/* Filter Controls Bar */}
            <div className="p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4 text-xs">
              
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                {/* Department Filter */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-zinc-500 font-medium">Department:</span>
                  <select
                    value={selectedDept}
                    onChange={e => setSelectedDept(e.target.value)}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="ALL">All Departments ({books.length})</option>
                    {departments.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Branch Filter */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-zinc-500 font-medium">Branch:</span>
                  <select
                    value={selectedBranch}
                    onChange={e => setSelectedBranch(e.target.value)}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="ALL">All Library Branches</option>
                    {settings.branches?.map(b => (
                      <option key={b} value={b}>
                        🏢 {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Available Only Toggle */}
                <label className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={availableOnly}
                    onChange={e => setAvailableOnly(e.target.checked)}
                    className="rounded text-[#095733] focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="font-semibold text-zinc-700">Available on Shelf Only</span>
                </label>
              </div>

              {/* Sort & View Mode */}
              <div className="flex items-center space-x-3 w-full lg:w-auto justify-between lg:justify-end">
                <div className="flex items-center space-x-1.5">
                  <span className="text-zinc-500 font-medium">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="TITLE">Title (A - Z)</option>
                    <option value="YEAR_DESC">Publication Year (Newest)</option>
                    <option value="AVAILABLE">Available Copies</option>
                  </select>
                </div>

                <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 p-0.5">
                  <button
                    onClick={() => setViewMode('GRID')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      viewMode === 'GRID' ? 'bg-white shadow-2xs text-[#095733]' : 'text-zinc-500'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('LIST')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      viewMode === 'LIST' ? 'bg-white shadow-2xs text-[#095733]' : 'text-zinc-500'
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>

            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
              <span>
                Showing <strong>{filteredBooks.length}</strong> matching catalogue records
                {searchQuery ? ` for query "${searchQuery}"` : ''}
              </span>
              {(searchQuery || selectedDept !== 'ALL' || selectedBranch !== 'ALL' || availableOnly) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDept('ALL');
                    setSelectedBranch('ALL');
                    setAvailableOnly(false);
                  }}
                  className="text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>

            {/* Empty State */}
            {filteredBooks.length === 0 && (
              <div className="p-12 text-center rounded-3xl bg-white border border-zinc-200/90 shadow-sm space-y-3">
                <BookOpen className="w-12 h-12 text-zinc-300 mx-auto" />
                <h4 className="text-base font-bold text-zinc-800">No Catalogue Records Found</h4>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  No library items matched your current search filters. Try using broader keywords or clearing specific department constraints.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDept('ALL');
                    setSelectedBranch('ALL');
                    setAvailableOnly(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#095733] text-white text-xs font-bold cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Books Grid Mode */}
            {viewMode === 'GRID' && filteredBooks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredBooks.map(book => (
                  <div
                    key={book.id}
                    className="p-5 rounded-2xl bg-white border border-zinc-200/90 hover:border-emerald-500/60 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                          {book.callNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            book.availableCopies > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {book.availableCopies > 0
                            ? `${book.availableCopies} of ${book.totalCopies} Available`
                            : 'All Copies Issued'}
                        </span>
                      </div>

                      <div>
                        <h4
                          onClick={() => setSelectedBook(book)}
                          className="text-sm font-bold text-zinc-900 group-hover:text-[#095733] transition-colors cursor-pointer line-clamp-2"
                        >
                          {book.title}
                        </h4>
                        {book.subtitle && (
                          <p className="text-xs text-zinc-500 italic line-clamp-1 mt-0.5">
                            {book.subtitle}
                          </p>
                        )}
                        <p className="text-xs text-zinc-600 mt-1">
                          By <strong className="text-zinc-800">{book.authors.join(', ')}</strong>
                        </p>
                      </div>

                      <div className="text-[11px] text-zinc-500 space-y-1 pt-1 border-t border-zinc-100">
                        <div className="flex items-center justify-between">
                          <span>Publisher:</span>
                          <span className="font-medium text-zinc-700 truncate max-w-[170px]">
                            {book.publisherName} ({book.publisherYear})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>ISBN:</span>
                          <span className="font-mono text-zinc-700">{book.isbn}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Discipline:</span>
                          <span className="font-medium text-zinc-700 truncate max-w-[170px]">
                            {book.department}
                          </span>
                        </div>
                      </div>

                      {book.subjects && book.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {book.subjects.slice(0, 3).map(s => (
                            <span
                              key={s}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedBook(book)}
                        className="flex-1 py-2 px-3 rounded-xl bg-zinc-100 hover:bg-emerald-50 hover:text-emerald-800 text-zinc-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Bibliographic Record</span>
                      </button>

                      <button
                        type="button"
                        onClick={onOpenLogin}
                        title="Login to place hold or borrow"
                        className="py-2 px-3 rounded-xl bg-[#095733] hover:bg-[#074729] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Request</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Books List Mode */}
            {viewMode === 'LIST' && filteredBooks.length > 0 && (
              <div className="rounded-2xl bg-white border border-zinc-200/90 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Call Number</th>
                        <th className="py-3 px-4">Title & Subtitle</th>
                        <th className="py-3 px-4">Author(s)</th>
                        <th className="py-3 px-4">Publisher & Year</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Availability</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-700">
                      {filteredBooks.map(book => (
                        <tr key={book.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-zinc-900 whitespace-nowrap">
                            {book.callNumber}
                          </td>
                          <td className="py-3 px-4 font-bold text-zinc-900 max-w-xs">
                            <span
                              onClick={() => setSelectedBook(book)}
                              className="hover:text-[#095733] cursor-pointer"
                            >
                              {book.title}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-600">
                            {book.authors.join(', ')}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-zinc-600">
                            {book.publisherName} ({book.publisherYear})
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {book.department}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                book.availableCopies > 0
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {book.availableCopies > 0 ? `${book.availableCopies} Available` : 'Issued'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                            <button
                              onClick={() => setSelectedBook(book)}
                              className="text-xs font-bold text-[#095733] hover:underline cursor-pointer"
                            >
                              Details
                            </button>
                            <button
                              onClick={onOpenLogin}
                              className="px-2.5 py-1 rounded-lg bg-[#095733] text-white text-[11px] font-bold cursor-pointer"
                            >
                              Request
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* SECTION C: BROWSE CATALOGUE BY DISCIPLINE & DEWEY DECIMAL               */}
        {/* ----------------------------------------------------------------------- */}
        {activeSection === 'BROWSE' && (
          <div className="space-y-8">
            <div className="border-b border-zinc-200 pb-4">
              <h3 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center space-x-2">
                <Compass className="w-6 h-6 text-[#095733]" />
                <span>Browse Library Collections by Academic Discipline</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Select any academic faculty or discipline to inspect all catalogued bibliographic items.
              </p>
            </div>

            {/* Department Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {departments.map(dept => {
                const count = books.filter(b => b.department === dept).length;
                return (
                  <div
                    key={dept}
                    onClick={() => {
                      setSelectedDept(dept);
                      setActiveSection('OPAC');
                    }}
                    className="p-5 rounded-2xl bg-white border border-zinc-200 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group flex items-start justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#095733] border border-emerald-100 flex items-center justify-center font-bold">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-zinc-900 group-hover:text-[#095733] transition-colors pt-1">
                        {dept}
                      </h4>
                      <p className="text-xs text-zinc-500">
                        {count} Catalogue Record(s)
                      </p>
                    </div>

                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                      Explore →
                    </span>
                  </div>
                );
              })}
            </div>

            {/* A-Z Alphabetical Index Bar */}
            <div className="p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-zinc-900 flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-[#095733]" />
                  <span>A–Z Alphabetical Title Index</span>
                </h4>
                {browseLetterFilter && (
                  <button
                    onClick={() => setBrowseLetterFilter(null)}
                    className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear Letter Filter ({browseLetterFilter})
                  </button>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                Quickly locate books by initial title character.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  onClick={() => setBrowseLetterFilter(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    browseLetterFilter === null
                      ? 'bg-[#095733] text-white shadow-xs'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                >
                  ALL
                </button>
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(char => {
                  const hasBooks = books.some(b => b.title.trim().toUpperCase().startsWith(char));
                  const isSelected = browseLetterFilter === char;
                  return (
                    <button
                      key={char}
                      disabled={!hasBooks}
                      onClick={() => setBrowseLetterFilter(isSelected ? null : char)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#095733] text-white shadow-xs'
                          : hasBooks
                          ? 'bg-zinc-100 hover:bg-emerald-50 hover:text-[#095733] text-zinc-800'
                          : 'bg-zinc-50 text-zinc-300 cursor-not-allowed'
                      }`}
                    >
                      {char}
                    </button>
                  );
                })}
              </div>

              {/* Letter Filtered Books Preview */}
              {browseLetterFilter && (
                <div className="mt-4 pt-4 border-t border-zinc-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-800">
                      Books beginning with "{browseLetterFilter}" (
                      {books.filter(b => b.title.trim().toUpperCase().startsWith(browseLetterFilter)).length} items)
                    </span>
                    <button
                      onClick={() => {
                        setSearchQuery(browseLetterFilter);
                        setSearchField('TITLE');
                        setActiveSection('OPAC');
                      }}
                      className="text-[#095733] font-bold hover:underline"
                    >
                      View in OPAC Search →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {books
                      .filter(b => b.title.trim().toUpperCase().startsWith(browseLetterFilter))
                      .slice(0, 6)
                      .map(book => (
                        <div
                          key={book.id}
                          onClick={() => setSelectedBook(book)}
                          className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-emerald-500 hover:bg-white transition-all cursor-pointer space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-mono text-zinc-500">{book.callNumber}</span>
                            <span className={book.availableCopies > 0 ? 'text-emerald-700 font-bold' : 'text-rose-600'}>
                              {book.availableCopies > 0 ? 'Available' : 'Issued'}
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-zinc-900 line-clamp-1">{book.title}</h5>
                          <p className="text-[11px] text-zinc-500 line-clamp-1">{book.authors.join(', ')}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* DDC Classification Reference & Interactive Filter */}
            <div className="p-6 rounded-3xl bg-white border border-zinc-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-zinc-900 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-[#095733]" />
                  <span>Dewey Decimal Classification (DDC 000–900) Navigator</span>
                </h4>
                {browseDdcFilter && (
                  <button
                    onClick={() => setBrowseDdcFilter(null)}
                    className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear DDC Filter
                  </button>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                Click any DDC division below to filter catalogued holdings by classification class.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                {[
                  { code: '000', prefix: '0', title: 'Computer Science & General Works' },
                  { code: '100', prefix: '1', title: 'Philosophy & Psychology' },
                  { code: '200', prefix: '2', title: 'Religion & Islamic Studies' },
                  { code: '300', prefix: '3', title: 'Social Sciences & Law' },
                  { code: '400', prefix: '4', title: 'Language & Linguistics' },
                  { code: '500', prefix: '5', title: 'Natural Sciences & Mathematics' },
                  { code: '600', prefix: '6', title: 'Technology & Applied Sciences' },
                  { code: '700', prefix: '7', title: 'Arts & Recreation' },
                  { code: '800', prefix: '8', title: 'Literature & Rhetoric' },
                  { code: '900', prefix: '9', title: 'History & Geography' },
                ].map(ddc => {
                  const matchCount = books.filter(b => b.callNumber?.trim().startsWith(ddc.prefix)).length;
                  const isSelected = browseDdcFilter === ddc.code;
                  return (
                    <button
                      key={ddc.code}
                      onClick={() => setBrowseDdcFilter(isSelected ? null : ddc.code)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-[#095733] shadow-xs'
                          : 'bg-zinc-50 hover:bg-emerald-50/50 hover:border-emerald-300 border-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#095733]">{ddc.code}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-zinc-200/70 text-zinc-700">
                          {matchCount}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-700 font-medium mt-1 leading-snug">{ddc.title}</p>
                    </button>
                  );
                })}
              </div>

              {/* DDC Filtered Books Preview */}
              {browseDdcFilter && (
                <div className="mt-4 pt-4 border-t border-zinc-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-800">
                      Holdings under DDC {browseDdcFilter} Class (
                      {books.filter(b => b.callNumber?.trim().startsWith(browseDdcFilter.charAt(0))).length} titles)
                    </span>
                    <button
                      onClick={() => {
                        setSearchQuery(browseDdcFilter.charAt(0));
                        setSearchField('CALL_NO');
                        setActiveSection('OPAC');
                      }}
                      className="text-[#095733] font-bold hover:underline"
                    >
                      Search in Full OPAC →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {books
                      .filter(b => b.callNumber?.trim().startsWith(browseDdcFilter.charAt(0)))
                      .slice(0, 6)
                      .map(book => (
                        <div
                          key={book.id}
                          onClick={() => setSelectedBook(book)}
                          className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-emerald-500 hover:bg-white transition-all cursor-pointer space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-mono text-zinc-500">{book.callNumber}</span>
                            <span className={book.availableCopies > 0 ? 'text-emerald-700 font-bold' : 'text-rose-600'}>
                              {book.availableCopies > 0 ? `${book.availableCopies} Copies` : 'Issued'}
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-zinc-900 line-clamp-1">{book.title}</h5>
                          <p className="text-[11px] text-zinc-500 line-clamp-1">{book.authors.join(', ')}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* SECTION D: LIBRARY & INSTITUTION INFORMATION                            */}
        {/* ----------------------------------------------------------------------- */}
        {activeSection === 'INFO' && (
          <div className="space-y-8">
            <div className="border-b border-zinc-200 pb-4">
              <h3 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center space-x-2">
                <Building2 className="w-6 h-6 text-[#095733]" />
                <span>Institutional Directory & Branch Information</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Official institutional profile, campus branches, opening hours, and contact points configured in PLiMS.
              </p>
            </div>

            {/* Main Institutional Profile Card */}
            <div className="p-8 rounded-3xl bg-white border border-zinc-200 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-100 pb-6">
                <div className="flex items-center space-x-4">
                  <img
                    src={pslimsLogo}
                    alt="Logo"
                    className="w-16 h-16 rounded-2xl border border-zinc-200 p-1 shadow-xs"
                  />
                  <div>
                    <h4 className="text-2xl font-black text-zinc-900 tracking-tight">
                      {settings.libraryName || 'Pakistan Central Academic Library'}
                    </h4>
                    <p className="text-sm font-semibold text-emerald-800">
                      {settings.institutionName || 'National Higher Education & Technology Portal'}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Pakistan Library Management System (PLiMS) V4.1.1 PK edition
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
                  <span className="text-zinc-400 font-medium">Head Librarian:</span>
                  <p className="font-bold text-zinc-800">
                    {settings.chiefLibrarianName || 'Prof. Mr. Aijaz Akhter Ahmedani & Sara Khan'}
                  </p>
                </div>
              </div>

              {/* Contact & Hours Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                
                <div className="space-y-3 p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                  <div className="flex items-center space-x-2 text-[#095733] font-bold">
                    <MapPin className="w-4 h-4" />
                    <span>Physical Address & Location</span>
                  </div>
                  <div className="space-y-1 text-zinc-700">
                    <p className="font-medium text-sm">
                      {settings.libraryPlace || 'Central Library Building, Sector H-9, Main Campus'}
                    </p>
                    <p className="text-zinc-500">
                      {settings.libraryLocation || 'Islamabad, Pakistan'}
                    </p>
                    <p className="text-zinc-500 font-mono">
                      Postal Code: {settings.postalCode || '44000'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                  <div className="flex items-center space-x-2 text-[#095733] font-bold">
                    <Clock className="w-4 h-4" />
                    <span>Operating Hours</span>
                  </div>
                  <div className="space-y-1.5 text-zinc-700">
                    <p className="font-medium text-sm text-zinc-900">
                      {settings.openingHours || 'Mon - Sat: 08:00 AM - 08:00 PM'}
                    </p>
                    <p className="text-zinc-500">
                      Sunday: Reserved for Digital Research & Quiet Reading
                    </p>
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Digital Portal: 24/7 Available
                    </span>
                  </div>
                </div>

                <div className="space-y-3 p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                  <div className="flex items-center space-x-2 text-[#095733] font-bold">
                    <Phone className="w-4 h-4" />
                    <span>Contact Information</span>
                  </div>
                  <div className="space-y-1 text-zinc-700">
                    <p>Mobile: <strong className="text-zinc-900">{settings.libraryMobileNo || '+92 300 9876543'}</strong></p>
                    <p>Office: <strong className="text-zinc-900">{settings.libraryOfficeNo || '+92 51 92654321'}</strong></p>
                    <p>Email: <strong className="text-zinc-900">{settings.libraryEmail || 'central.library@pslims.edu.pk'}</strong></p>
                    <p>Portal: <a href={settings.websiteUrl || '#'} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-mono">{settings.websiteUrl || 'https://pslims.edu.pk'}</a></p>
                  </div>
                </div>

              </div>
            </div>

            {/* Campus Branches List */}
            <div className="space-y-4">
              <h4 className="text-base font-bold text-zinc-900">
                Institutional Campus Branch Libraries ({settings.branches?.length || 1})
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.branches?.map((branchName, idx) => (
                  <div
                    key={branchName}
                    className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-zinc-900 flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-[#095733]" />
                          <span>{branchName}</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Branch #{idx + 1}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-2">
                        Physical circulation desk, open shelf stacks, study carrels, and RFID automated book-drop.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
                      <span className="text-[11px]">Inter-Branch Loan Supported</span>
                      <button
                        onClick={() => {
                          setSelectedBranch(branchName);
                          setActiveSection('OPAC');
                        }}
                        className="text-xs font-bold text-[#095733] hover:underline cursor-pointer"
                      >
                        Search Holdings →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Academic Membership & Borrowing Privileges Matrix */}
            <div className="p-8 rounded-3xl bg-white border border-zinc-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div>
                  <h4 className="text-base font-bold text-zinc-900 flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5 text-[#095733]" />
                    <span>Academic Membership & Borrowing Privileges Matrix</span>
                  </h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Official borrowing allowances, loan durations, and renewal rules for registered institutional members.
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-emerald-50 text-[#095733] px-2 py-1 rounded border border-emerald-200">
                  HEC Pakistan Compliant
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Borrower Category</th>
                      <th className="py-3 px-4">Item Limit</th>
                      <th className="py-3 px-4">Loan Duration</th>
                      <th className="py-3 px-4">Renewals</th>
                      <th className="py-3 px-4">Special Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    <tr className="hover:bg-zinc-50/70">
                      <td className="py-3 px-4 font-bold text-zinc-900">
                        Undergraduate Students (BS / Associate Degree)
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">4 Books</td>
                      <td className="py-3 px-4">14 Days</td>
                      <td className="py-3 px-4">1 Time (Self-Service)</td>
                      <td className="py-3 px-4 text-zinc-500">Main Stacks, Textbooks, Wi-Fi</td>
                    </tr>
                    <tr className="hover:bg-zinc-50/70">
                      <td className="py-3 px-4 font-bold text-zinc-900">
                        Postgraduate Scholars (MS / MPhil / PhD)
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">8 Books</td>
                      <td className="py-3 px-4">30 Days</td>
                      <td className="py-3 px-4">2 Times</td>
                      <td className="py-3 px-4 text-zinc-500">Research Carrels, Turnitin, HEC E-Lib</td>
                    </tr>
                    <tr className="hover:bg-zinc-50/70">
                      <td className="py-3 px-4 font-bold text-zinc-900">
                        Faculty Members (Professors, Lecturers, Instructors)
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">15 Books</td>
                      <td className="py-3 px-4">Full Semester</td>
                      <td className="py-3 px-4">Unlimited Upon Request</td>
                      <td className="py-3 px-4 text-zinc-500">All Collections, ILL Priority, Departmental Loans</td>
                    </tr>
                    <tr className="hover:bg-zinc-50/70">
                      <td className="py-3 px-4 font-bold text-zinc-900">
                        Institutional Staff & Administrative Officers
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">3 Books</td>
                      <td className="py-3 px-4">21 Days</td>
                      <td className="py-3 px-4">1 Time</td>
                      <td className="py-3 px-4 text-zinc-500">General Circulation & Digital Terminals</td>
                    </tr>
                    <tr className="hover:bg-zinc-50/70">
                      <td className="py-3 px-4 font-bold text-zinc-900">
                        Alumni & Visiting External Scholars
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-zinc-500">Reference Only</td>
                      <td className="py-3 px-4">In-House Daily</td>
                      <td className="py-3 px-4">N/A</td>
                      <td className="py-3 px-4 text-zinc-500">Reading Room Access with Visitor Badge</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Library Physical Facilities & Amenities */}
            <div className="p-8 rounded-3xl bg-white border border-zinc-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h4 className="text-base font-bold text-zinc-900 flex items-center space-x-2">
                  <Library className="w-5 h-5 text-[#095733]" />
                  <span>Library Facilities, Study Rooms & Amenities</span>
                </h4>
                <span className="text-xs text-zinc-500">Ground & Upper Levels</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                  <div className="flex items-center space-x-2 text-[#095733] font-bold">
                    <BookOpen className="w-4 h-4" />
                    <span>Central Academic Reading Hall</span>
                  </div>
                  <p className="text-zinc-600">
                    Spacious air-conditioned halls seating 350+ readers with natural illumination, power ports at every desk, and quiet study standards.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                  <div className="flex items-center space-x-2 text-[#095733] font-bold">
                    <Laptop className="w-4 h-4" />
                    <span>Computer Lab & OPAC Terminals</span>
                  </div>
                  <p className="text-zinc-600">
                    60 high-performance workstations connected to the campus backbone for searching the PLiMS catalogue, IEEE, and science databases.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                  <div className="flex items-center space-x-2 text-[#095733] font-bold">
                    <Building2 className="w-4 h-4" />
                    <span>Doctoral Research Cubicles</span>
                  </div>
                  <p className="text-zinc-600">
                    Dedicated private carrels for MPhil/PhD scholars conducting continuous dissertation writing and deep literature reviews.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                  <div className="flex items-center space-x-2 text-[#095733] font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>RFID Smart Book Drop Kiosks</span>
                  </div>
                  <p className="text-zinc-600">
                    24-hour return book-drops installed outside the library porch for instant automated check-in and fine waiver receipt.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                  <div className="flex items-center space-x-2 text-[#095733] font-bold">
                    <Printer className="w-4 h-4" />
                    <span>Reprographics & Thesis Binding</span>
                  </div>
                  <p className="text-zinc-600">
                    Digital document scanning, laser printing, and HEC standard hardbound thesis binding services at subsidized institutional rates.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                  <div className="flex items-center space-x-2 text-[#095733] font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Library Clearance / No-Dues Desk</span>
                  </div>
                  <p className="text-zinc-600">
                    Fast computerized clearance verification for graduating students, faculty contract completions, and official transcripts.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* SECTION E: ABOUT THE LIBRARY & PLiMS                                    */}
        {/* ----------------------------------------------------------------------- */}
        {activeSection === 'ABOUT' && (
          <div className="space-y-8">
            <div className="border-b border-zinc-200 pb-4">
              <h3 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center space-x-2">
                <Award className="w-6 h-6 text-[#095733]" />
                <span>About the Library & PLiMS Portal</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Serving the scholarly research, education, and knowledge needs of students, faculty, and scholars.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              <div className="lg:col-span-8 space-y-6">
                <div className="p-8 rounded-3xl bg-white border border-zinc-200 shadow-sm space-y-4 text-xs text-zinc-700 leading-relaxed">
                  <h4 className="text-base font-bold text-zinc-900">
                    Mission & Library Philosophy
                  </h4>
                  <p>
                    {settings.libraryName || 'Pakistan Central Academic Library'} provides equitable, seamless, and dignified access to information resources across all academic disciplines. Our comprehensive collections support undergraduate learning, postgraduate scientific research, and faculty scholarship.
                  </p>
                  <p>
                    Powered by <strong>PLiMS (Pakistan Library Management System) V4.1.1 PK edition</strong>, our union catalogue strictly implements international MARC21 standard bibliographic tags, AACR2/RDA descriptive cataloguing, Dewey Decimal Classification (DDC), and automated RFID circulation.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                      <h5 className="font-bold text-zinc-900 mb-1">Open Access & Research Support</h5>
                      <p className="text-[11px] text-zinc-500">
                        Assisting scholars with citations, bibliographic verification, inter-library resource sharing, and thesis archiving.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                      <h5 className="font-bold text-zinc-900 mb-1">Digital Infrastructure</h5>
                      <p className="text-[11px] text-zinc-500">
                        Integrated HEC Digital Library repositories, electronic journal indexes, and automated member self-services.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm space-y-3">
                  <h4 className="text-sm font-bold text-zinc-900 flex items-center space-x-2">
                    <Library className="w-4 h-4 text-[#095733]" />
                    <span>Free and Open Source Software (FOSS) & National Heritage</span>
                  </h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    PLiMS is developed as free, open-source software under the MIT license to empower colleges, universities, and schools across Pakistan without expensive proprietary subscription lock-in. It strictly observes standard MARC21 metadata and AACR2/RDA descriptive cataloguing rules.
                  </p>
                  <p className="text-[11px] text-zinc-500 italic">
                    Principal Systems Architect & Lead Authors: Mr. Aijaz Akhter Ahmedani & Sara Khan.
                  </p>
                </div>

                {/* Special Archival Collections */}
                <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm space-y-4 text-xs">
                  <h4 className="text-sm font-bold text-zinc-900 flex items-center space-x-2">
                    <Bookmark className="w-4 h-4 text-[#095733]" />
                    <span>Special Archival & Heritage Collections</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-700">
                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-1">
                      <span className="font-bold text-zinc-900 block">Pakistan Studies Depository</span>
                      <p className="text-[11px] text-zinc-500">
                        Official gazettes, national constitutional documents, historical maps, and census reports dating back to 1947.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-1">
                      <span className="font-bold text-zinc-900 block">Rare Manuscripts & Islamic Classics</span>
                      <p className="text-[11px] text-zinc-500">
                        Preserved Arabic, Persian, and Urdu manuscripts, Quranic commentaries, and classical jurisprudential treatises.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-1">
                      <span className="font-bold text-zinc-900 block">United Nations & World Bank Depository</span>
                      <p className="text-[11px] text-zinc-500">
                        Socio-economic research monographs, demographic surveys, and UNESCO educational development reports.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-1">
                      <span className="font-bold text-zinc-900 block">Institutional Doctoral Dissertations</span>
                      <p className="text-[11px] text-zinc-500">
                        Archived original MPhil and PhD theses completed at the university, available for scholarly review and inter-library loan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-5">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-[#095733] to-[#042e1b] text-white shadow-md space-y-4">
                  <div className="flex items-center space-x-3">
                    <img src={pslimsLogo} alt="PLiMS" className="w-10 h-10 rounded-xl bg-white p-0.5" />
                    <div>
                      <h5 className="font-bold text-sm text-white">PLiMS 4.1.1 PK</h5>
                      <p className="text-[10px] text-emerald-200">Pakistan Library Management System</p>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-100 leading-relaxed">
                    Designed for academic librarians, researchers, and students to simplify cataloguing, circulation, and OPAC discovery.
                  </p>
                  <button
                    onClick={onOpenLogin}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-[#095733] font-bold text-xs transition-all cursor-pointer shadow-sm"
                  >
                    Access Staff Portal
                  </button>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-zinc-200 space-y-3 text-xs">
                  <h5 className="font-bold text-zinc-900">Key Library Highlights</h5>
                  <ul className="space-y-2 text-zinc-600">
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{books.length} Catalogued Bibliographic Records</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{totalHoldings} Physical Volumes on Stacks</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{settings.branches?.length || 1} Networked Library Branches</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>RFID Circulation & Security Desks</span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* SECTION F: CONTACT US & PATRON INQUIRY FORM                             */}
        {/* ----------------------------------------------------------------------- */}
        {activeSection === 'CONTACT' && (
          <div className="space-y-8">
            <div className="border-b border-zinc-200 pb-4">
              <h3 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center space-x-2">
                <Mail className="w-6 h-6 text-[#095733]" />
                <span>Contact the Library & Patron Helpdesk</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Reach out to library reference staff, request book acquisitions, or inquire regarding membership.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Contact Information Cards */}
              <div className="lg:col-span-5 space-y-4">
                
                <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm space-y-4 text-xs">
                  <h4 className="text-sm font-bold text-zinc-900">
                    Direct Contact Channels
                  </h4>

                  <div className="space-y-3 text-zinc-700">
                    <div className="flex items-start space-x-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
                      <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-zinc-900 block">Library Location</span>
                        <p className="text-zinc-600 mt-0.5">
                          {settings.libraryPlace || 'Central Library Building, Sector H-9, Main Campus'}
                        </p>
                        <p className="text-zinc-500">
                          {settings.libraryLocation || 'Islamabad, Pakistan'} {settings.postalCode}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
                      <Phone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-zinc-900 block">Telephones</span>
                        <p className="text-zinc-600 mt-0.5">
                          Mobile: {settings.libraryMobileNo || '+92 300 9876543'}
                        </p>
                        <p className="text-zinc-500">
                          Office: {settings.libraryOfficeNo || '+92 51 92654321'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
                      <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-zinc-900 block">Official Inquiries</span>
                        <p className="text-zinc-600 mt-0.5">
                          {settings.libraryEmail || 'central.library@pslims.edu.pk'}
                        </p>
                        <p className="text-zinc-500">
                          {settings.chiefLibrarianName || 'Prof. Mr. Aijaz Akhter Ahmedani & Sara Khan'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
                      <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-zinc-900 block">Circulation Desk Hours</span>
                        <p className="text-zinc-600 mt-0.5">
                          {settings.openingHours || 'Mon - Sat: 08:00 AM - 08:00 PM'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Inquiry & Book Suggestion Form */}
              <div className="lg:col-span-7">
                <div className="p-8 rounded-3xl bg-white border border-zinc-200 shadow-sm space-y-6">
                  <div>
                    <h4 className="text-base font-bold text-zinc-900">
                      Send a Message or Book Acquisition Request
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      Our reference librarian will respond to your query or purchase recommendation.
                    </p>
                  </div>

                  {contactSuccessMsg && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Thank you! Your inquiry has been dispatched to the library administration.</span>
                    </div>
                  )}

                  <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-zinc-700">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={e => setContactName(e.target.value)}
                          placeholder="e.g. Tariq Mehmood"
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-zinc-700">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={e => setContactEmail(e.target.value)}
                          placeholder="e.g. tariq@student.edu.pk"
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-zinc-700">Inquiry Purpose</label>
                      <select
                        value={contactSubject}
                        onChange={e => setContactSubject(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                      >
                        <option value="GENERAL">General Reference Inquiry</option>
                        <option value="BOOK_SUGGESTION">Recommend Book for Purchase / Acquisition</option>
                        <option value="MEMBERSHIP">Library Membership Card Question</option>
                        <option value="INTER_LIBRARY">Inter-Library Loan Request</option>
                        <option value="DIGITAL_ACCESS">Digital Repository Access Support</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-zinc-700">Your Message or Title Details *</label>
                      <textarea
                        required
                        rows={4}
                        value={contactMessage}
                        onChange={e => setContactMessage(e.target.value)}
                        placeholder="Please write your inquiry or specify book title, author, edition and ISBN..."
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-5 rounded-xl bg-[#095733] hover:bg-[#074729] text-white font-bold text-xs transition-all shadow-md active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Inquiry</span>
                    </button>
                  </form>
                </div>
              </div>

            </div>

            {/* Departmental & Reference Section Staff Directory */}
            <div className="p-8 rounded-3xl bg-white border border-zinc-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-[#095733]" />
                  <span>Library Departmental & Section Contacts</span>
                </h4>
                <span className="text-[11px] text-zinc-500">Official Extensions</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 space-y-1">
                  <span className="font-bold text-zinc-900 block">Circulation Desk</span>
                  <p className="text-zinc-600">Borrowing, returns, and RFID renewals</p>
                  <p className="text-emerald-800 font-mono text-[11px] pt-1">Ext: 101 / 102</p>
                  <p className="text-zinc-500 font-mono text-[11px]">circulation@pslims.edu.pk</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 space-y-1">
                  <span className="font-bold text-zinc-900 block">Reference & Research</span>
                  <p className="text-zinc-600">Literature search, Turnitin & citations</p>
                  <p className="text-emerald-800 font-mono text-[11px] pt-1">Ext: 103 / 104</p>
                  <p className="text-zinc-500 font-mono text-[11px]">reference@pslims.edu.pk</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 space-y-1">
                  <span className="font-bold text-zinc-900 block">Technical Processing</span>
                  <p className="text-zinc-600">Cataloguing, MARC21 & acquisitions</p>
                  <p className="text-emerald-800 font-mono text-[11px] pt-1">Ext: 105 / 106</p>
                  <p className="text-zinc-500 font-mono text-[11px]">cataloguing@pslims.edu.pk</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 space-y-1">
                  <span className="font-bold text-zinc-900 block">Systems & Automation</span>
                  <p className="text-zinc-600">PLiMS portal, Wi-Fi & database servers</p>
                  <p className="text-emerald-800 font-mono text-[11px] pt-1">Ext: 107 / 108</p>
                  <p className="text-zinc-500 font-mono text-[11px]">systems@pslims.edu.pk</p>
                </div>
              </div>
            </div>

            {/* Patron Frequently Asked Questions (FAQ) Accordion */}
            <div className="p-8 rounded-3xl bg-white border border-zinc-200 shadow-sm space-y-5">
              <div className="border-b border-zinc-100 pb-3">
                <h4 className="text-base font-bold text-zinc-900 flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5 text-[#095733]" />
                  <span>Frequently Asked Questions (FAQ)</span>
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Common queries regarding public OPAC searching, library membership, and borrowing regulations.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    q: 'How do I register for an institutional library membership card?',
                    a: 'All newly enrolled undergraduate, postgraduate, and faculty members are automatically provisioned in PLiMS upon departmental admission verification. Bring your official University Student/Faculty ID Card and two passport-sized photographs to the Central Library Circulation Desk to collect your RFID barcoded library smart card.'
                  },
                  {
                    q: 'How do I search for a specific textbook, call number, or author in the OPAC?',
                    a: 'Navigate to the OPAC / SEARCH tab above. You can search by Title, Author, Subject Keyword, or Call Number / DDC. Use the dropdown filter to restrict results to a specific branch library or department, or toggle "Available on Shelf Only" to find physical volumes immediately ready for loan.'
                  },
                  {
                    q: 'How do I obtain Turnitin anti-plagiarism clearance for my research thesis?',
                    a: 'Postgraduate scholars submitting MS, MPhil, or PhD dissertations must present an approved soft copy (PDF) to the Reference & Research Section. The reference officer will generate the official HEC-standard similarity report and provide the formal clearance certificate required by the Examination Board.'
                  },
                  {
                    q: 'What is the library policy on late returns, overdue fines, and renewals?',
                    a: 'Books borrowed by students have a loan period of 14 days. If a book is not reserved by another patron, it may be renewed once. An overdue fine of PKR 10 per day per book applies after the due date. Reminders are automatically dispatched to the member’s registered email.'
                  },
                  {
                    q: 'Can I suggest a book, journal, or reference work for library purchase?',
                    a: 'Yes! Faculty members and enrolled students can recommend titles directly through the inquiry form on this page by selecting "Recommend Book for Purchase / Acquisition". Please include the author, edition, publisher, and ISBN if available.'
                  },
                  {
                    q: 'Can alumni, researchers, or external visitors use the library facilities?',
                    a: 'Yes, alumni and visiting scholars from other HEC-recognized institutions are welcome to use our reading halls and in-house reference collections during regular working hours. A temporary visitor pass is issued at the entrance reception upon presenting original CNIC and institutional credentials.'
                  }
                ].map((item, idx) => {
                  const isOpen = faqOpenIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-zinc-200 overflow-hidden transition-all bg-zinc-50/50"
                    >
                      <button
                        onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                        className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs font-bold text-zinc-800 hover:text-[#095733] hover:bg-zinc-100/50 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#095733] flex items-center justify-center text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <span>{item.q}</span>
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 pt-1 text-xs text-zinc-600 leading-relaxed border-t border-zinc-100 bg-white">
                          <p>{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* 5. PUBLIC BIBLIOGRAPHIC DETAILS MODAL                                     */}
      {/* ========================================================================= */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-zinc-200 flex flex-col overflow-hidden text-xs">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#095733] via-[#074729] to-[#042e1b] text-white flex items-start justify-between gap-3 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-400/30">
                    {selectedBook.callNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedBook.availableCopies > 0
                        ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                        : 'bg-rose-500/20 text-rose-200 border border-rose-400/40'
                    }`}
                  >
                    {selectedBook.availableCopies > 0
                      ? `${selectedBook.availableCopies} Available on Shelf`
                      : 'All Copies Issued'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                  {selectedBook.title}
                </h3>
                {selectedBook.subtitle && (
                  <p className="text-xs text-emerald-200/90 italic">
                    {selectedBook.subtitle}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-700">
              
              {/* Bibliographic Core Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                <div className="space-y-2">
                  <div>
                    <span className="text-[11px] text-zinc-400 font-semibold block">Author(s) / Contributors:</span>
                    <span className="font-bold text-zinc-900">{selectedBook.authors.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400 font-semibold block">Standard ISBN:</span>
                    <span className="font-mono text-zinc-800">{selectedBook.isbn}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400 font-semibold block">Edition & Format:</span>
                    <span className="text-zinc-800">{selectedBook.edition || '1st Standard Academic Edition'} • {selectedBook.format || 'Hardcover'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400 font-semibold block">Extent / Pages:</span>
                    <span className="text-zinc-800">{selectedBook.pageCount || 'N/A'} Pages</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[11px] text-zinc-400 font-semibold block">Publisher & Place:</span>
                    <span className="text-zinc-800">
                      {selectedBook.publisherName} ({selectedBook.publisherYear})
                      {selectedBook.publisherLocation ? ` • ${selectedBook.publisherLocation}` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400 font-semibold block">Academic Department:</span>
                    <span className="font-medium text-emerald-800">{selectedBook.department}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400 font-semibold block">Classification & Call No:</span>
                    <span className="font-mono text-zinc-800">
                      {selectedBook.ddcClassification ? `DDC: ${selectedBook.ddcClassification} | ` : ''}
                      Call No: {selectedBook.callNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400 font-semibold block">Shelf Location:</span>
                    <span className="text-zinc-800">{selectedBook.shelfLocation || 'Main Stacks • Wing A'}</span>
                  </div>
                </div>
              </div>

              {/* Subjects / Keywords */}
              {selectedBook.subjects && selectedBook.subjects.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-zinc-900 text-xs flex items-center space-x-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#095733]" />
                    <span>Subject Headings (LCSH / MARC 650)</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBook.subjects.map(s => (
                      <span
                        key={s}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description / Summary */}
              <div className="space-y-2">
                <h4 className="font-bold text-zinc-900 text-xs flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#095733]" />
                  <span>Summary & Annotation</span>
                </h4>
                <p className="text-xs text-zinc-600 leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                  {selectedBook.description ||
                    selectedBook.generalNotes ||
                    'Comprehensive scholarly treatise published for university education, curriculum reference, and advanced research documentation. Physical copy available on library open-shelf stacks for loan or in-house reading.'}
                </p>
              </div>

              {/* Physical Copy Inventory Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-zinc-900 text-xs flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#095733]" />
                    <span>Physical Copy Holdings & Location Status</span>
                  </h4>
                  <span className="text-[11px] text-zinc-500">
                    Total Copies: {selectedBook.totalCopies}
                  </span>
                </div>

                <div className="rounded-xl border border-zinc-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-100 text-zinc-700 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Accession / Barcode</th>
                        <th className="py-2.5 px-3">Campus Branch</th>
                        <th className="py-2.5 px-3">Location / Shelf</th>
                        <th className="py-2.5 px-3">Availability</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {selectedBookCopies.length > 0 ? (
                        selectedBookCopies.map(copy => (
                          <tr key={copy.id} className="hover:bg-zinc-50">
                            <td className="py-2.5 px-3 font-mono text-zinc-800">
                              {copy.accessionNumber || copy.barcode}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-700">
                              {copy.branchLocation || settings.branches?.[0] || 'Central Academic Library'}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-600">
                              {selectedBook.shelfLocation || 'Open Stacks'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  copy.status === 'AVAILABLE'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {copy.status === 'AVAILABLE' ? 'On Shelf' : 'Issued'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        // Fallback synthesized row if separate copy table isn't populated
                        Array.from({ length: selectedBook.totalCopies || 1 }).map((_, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50">
                            <td className="py-2.5 px-3 font-mono text-zinc-800">
                              ACC-{selectedBook.isbn.slice(-4)}-{idx + 1}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-700">
                              {settings.branches?.[0] || 'Central Academic Library'}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-600">
                              {selectedBook.shelfLocation || 'Open Stacks'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  idx < selectedBook.availableCopies
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {idx < selectedBook.availableCopies ? 'On Shelf' : 'Issued'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Formatted Citation Generator */}
              <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                <h4 className="font-bold text-zinc-900 text-xs flex items-center space-x-1.5">
                  <Share2 className="w-3.5 h-3.5 text-[#095733]" />
                  <span>Academic Citation Generator</span>
                </h4>

                <div className="space-y-2">
                  {(['APA', 'MLA', 'CHICAGO', 'HARVARD'] as const).map(style => {
                    const citText = generateCitation(selectedBook, style);
                    const isCopied = copiedCitationFormat === style;
                    return (
                      <div
                        key={style}
                        className="p-2.5 rounded-xl bg-white border border-zinc-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5 truncate flex-1">
                          <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase block">
                            {style} 7th/9th Format:
                          </span>
                          <p className="text-zinc-700 truncate font-mono text-[11px]">
                            {citText}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyCitation(style, citText)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-emerald-50 hover:text-emerald-800 text-zinc-700 font-semibold text-[11px] transition-colors cursor-pointer flex items-center space-x-1 shrink-0"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Guidance Notice */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start space-x-3">
                <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">How to Borrow or Reserve This Title:</span>
                  <p className="text-emerald-800">
                    To check out physical copies or place a reservation hold on this book, please sign in with your PLiMS member account or visit the circulation desk at any campus branch with your patron card.
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-zinc-500 font-mono">
                MARC21 Tag: 245 $a {selectedBook.title}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedBook(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-semibold text-xs cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBook(null);
                    onOpenLogin();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#095733] hover:bg-[#074729] text-white font-bold text-xs shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login to Request Item</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PUBLIC FOOTER                                                          */}
      {/* ========================================================================= */}
      <footer className="bg-zinc-900 text-zinc-400 text-xs border-t border-zinc-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-zinc-800">
            
            {/* Col 1: System Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2.5">
                <img src={pslimsLogo} alt="Logo" className="w-8 h-8 rounded-lg" />
                <span className="text-white font-bold text-base">PLiMS 4.1.1 PK</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Pakistan Library Management System (PLiMS) provides international-standard library discovery, circulation, cataloguing, and digital repository services.
              </p>
              <div className="pt-1 flex items-center space-x-2">
                <PakistanFlyingFlag size="sm" showMast={false} />
                <span className="text-[11px] text-zinc-300 font-medium">Islamic Republic of Pakistan</span>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div className="space-y-2.5">
              <h5 className="text-white font-bold text-xs uppercase tracking-wider">Quick Navigation</h5>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <button onClick={() => setActiveSection('HOME')} className="hover:text-emerald-400 cursor-pointer">
                    Home Page
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveSection('OPAC')} className="hover:text-emerald-400 cursor-pointer">
                    Search Catalogue (OPAC)
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveSection('BROWSE')} className="hover:text-emerald-400 cursor-pointer">
                    Browse by Department
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveSection('INFO')} className="hover:text-emerald-400 cursor-pointer">
                    Library Branches & Hours
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveSection('ABOUT')} className="hover:text-emerald-400 cursor-pointer">
                    About the Library
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveSection('CONTACT')} className="hover:text-emerald-400 cursor-pointer">
                    Contact Us & Inquiries
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Institutional Contacts */}
            <div className="space-y-2.5">
              <h5 className="text-white font-bold text-xs uppercase tracking-wider">Library Contacts</h5>
              <div className="space-y-1.5 text-[11px]">
                <p className="text-zinc-300 font-medium">{settings.libraryName}</p>
                <p>{settings.libraryPlace}</p>
                <p>{settings.libraryLocation} {settings.postalCode}</p>
                <p>Phone: {settings.libraryMobileNo || settings.libraryOfficeNo}</p>
                <p>Email: {settings.libraryEmail}</p>
              </div>
            </div>

            {/* Col 4: Staff Authentication Access */}
            <div className="space-y-2.5">
              <h5 className="text-white font-bold text-xs uppercase tracking-wider">Staff & Administration</h5>
              <p className="text-[11px] text-zinc-400">
                Authorized librarians, cataloguers, circulation officers, and academic members:
              </p>
              <button
                onClick={onOpenLogin}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Staff & Member Portal Login</span>
              </button>
              <p className="text-[10px] text-zinc-500 text-center">
                Supports Google Account & Username+Password
              </p>
            </div>

          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-2">
            <p>© {new Date().getFullYear()} {settings.libraryName || 'Pakistan Central Academic Library'}. Released under Open Source MIT License.</p>
            <p>Authored by Mr. Aijaz Akhter Ahmedani & Sara Khan</p>
          </div>
        </div>
      </footer>

    </div>
  );
};
