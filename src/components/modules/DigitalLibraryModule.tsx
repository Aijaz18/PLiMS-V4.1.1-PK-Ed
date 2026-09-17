import React, { useState } from 'react';
import {
  BookOpen,
  Download,
  PlusCircle,
  Search,
  FileText,
  GraduationCap,
  Sparkles,
  Eye,
  CheckCircle2,
  Lock,
  Globe,
  Share2,
  Copy,
  ExternalLink,
  Filter,
  Layers,
  FileCode,
  Tag,
  X,
  UploadCloud,
  Check,
  Building
} from 'lucide-react';
import { DigitalAsset } from '../../types/alims';

interface DigitalLibraryModuleProps {
  assets: DigitalAsset[];
  onAddAsset?: (asset: DigitalAsset) => void;
}

export const DigitalLibraryModule: React.FC<DigitalLibraryModuleProps> = ({ assets, onAddAsset }) => {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'ALL' | 'THESES' | 'RESEARCH' | 'EBOOKS'>('ALL');
  const [accessFilter, setAccessFilter] = useState<string>('ALL');
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<DigitalAsset | null>(null);
  const [citationAsset, setCitationAsset] = useState<DigitalAsset | null>(null);
  const [copiedCitationFormat, setCopiedCitationFormat] = useState<string | null>(null);
  const [expandedAbstractId, setExpandedAbstractId] = useState<string | null>(null);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  // New Resource Deposit Form State
  const [newResourceForm, setNewResourceForm] = useState({
    title: '',
    author: '',
    department: 'Computer Science & Software Engineering',
    category: 'Doctoral Dissertation',
    fileType: 'PDF',
    fileSize: '15.4 MB',
    accessLevel: 'OPEN' as 'OPEN' | 'STUDENT_ONLY' | 'FACULTY_ONLY',
    doi: '',
    abstract: '',
    keywords: '',
    downloadUrl: '#'
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Handle New Asset Submit
  const handleDepositResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResourceForm.title || !newResourceForm.author) {
      alert('Please provide at least a Resource Title and Author / Scholar Name.');
      return;
    }

    const keywordArray = newResourceForm.keywords
      ? newResourceForm.keywords.split(',').map(k => k.trim()).filter(Boolean)
      : ['Repository', 'Research', newResourceForm.category];

    const createdAsset: DigitalAsset = {
      id: `dig_${Date.now()}`,
      title: newResourceForm.title,
      author: newResourceForm.author,
      department: newResourceForm.department,
      category: newResourceForm.category,
      fileType: newResourceForm.fileType,
      fileSize: uploadedFileName ? '18.2 MB' : newResourceForm.fileSize,
      accessLevel: newResourceForm.accessLevel,
      downloadUrl: '#',
      year: new Date().getFullYear(),
      doi: newResourceForm.doi || `10.5281/zenodo.${Math.floor(1000000 + Math.random() * 9000000)}`,
      abstract: newResourceForm.abstract || 'Deposited into Institutional Digital Repository. Fully indexed for OCR full-text search.',
      ocrStatus: 'SEARCHABLE',
      downloadsCount: 0,
      keywords: keywordArray
    };

    if (onAddAsset) {
      onAddAsset(createdAsset);
    }

    setIsAddModalOpen(false);
    setUploadedFileName(null);
    setNewResourceForm({
      title: '',
      author: '',
      department: 'Computer Science & Software Engineering',
      category: 'Doctoral Dissertation',
      fileType: 'PDF',
      fileSize: '15.4 MB',
      accessLevel: 'OPEN',
      doi: '',
      abstract: '',
      keywords: '',
      downloadUrl: '#'
    });

    setDownloadSuccessToast(`✨ Successfully deposited "${createdAsset.title.substring(0, 30)}..." into the Repository!`);
    setTimeout(() => setDownloadSuccessToast(null), 4000);
  };

  // Filter Assets Logic
  const filteredAssets = assets.filter(a => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      a.title.toLowerCase().includes(query) ||
      a.author.toLowerCase().includes(query) ||
      (a.department && a.department.toLowerCase().includes(query)) ||
      (a.category && a.category.toLowerCase().includes(query)) ||
      (a.keywords && a.keywords.some(k => k.toLowerCase().includes(query))) ||
      (a.abstract && a.abstract.toLowerCase().includes(query));

    const matchesAccess = accessFilter === 'ALL' || a.accessLevel === accessFilter;

    let matchesCategory = true;
    if (selectedCategoryTab === 'THESES') {
      matchesCategory = a.fileType === 'THESIS' || (a.category && (a.category.includes('Thesis') || a.category.includes('Dissertation')));
    } else if (selectedCategoryTab === 'RESEARCH') {
      matchesCategory = a.fileType === 'JOURNAL' || (a.category && (a.category.includes('Journal') || a.category.includes('Research') || a.category.includes('Conference')));
    } else if (selectedCategoryTab === 'EBOOKS') {
      matchesCategory = a.fileType === 'EPUB' || a.fileType === 'PDF' || (a.category && a.category.includes('Books'));
    }

    return matchesSearch && matchesAccess && matchesCategory;
  });

  const handleSimulateDownload = (asset: DigitalAsset) => {
    setDownloadSuccessToast(`Downloading "${asset.title}" (${asset.fileSize})...`);
    setTimeout(() => setDownloadSuccessToast(null), 3500);
  };

  const copyCitationToClipboard = (text: string, formatName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCitationFormat(formatName);
    setTimeout(() => setCopiedCitationFormat(null), 2500);
  };

  // Quick Stats
  const totalTheses = assets.filter(a => a.fileType === 'THESIS' || (a.category && a.category.includes('Thesis'))).length;
  const openAccessCount = assets.filter(a => a.accessLevel === 'OPEN').length;
  const totalDownloads = assets.reduce((acc, a) => acc + (a.downloadsCount || 45), 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {downloadSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-400 text-xs font-semibold flex items-center space-x-2.5 animate-bounce">
          <CheckCircle2 className="h-4 w-4" />
          <span>{downloadSuccessToast}</span>
        </div>
      )}

      {/* Repository Header & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/90 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2.5">
            <GraduationCap className="h-6 w-6 text-indigo-400" />
            <span>Institutional Digital & Thesis Repository</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Archiving university dissertations, scholarly research papers, peer-reviewed journals, and digital media with OCR full-text search capabilities
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          <span>+ Deposit New Resource</span>
        </button>
      </div>

      {/* Institutional Repository Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Total Digital Assets</span>
            <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">{assets.length}</div>
          <div className="text-[10px] text-indigo-400 font-mono">Full-Text OCR Indexed</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Theses & Dissertations</span>
            <GraduationCap className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">{totalTheses}</div>
          <div className="text-[10px] text-purple-400 font-mono">Ph.D. & M.S. Repository</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Open Access Papers</span>
            <Globe className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">{openAccessCount}</div>
          <div className="text-[10px] text-emerald-400 font-mono">Public Downloadable</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Total Downloads</span>
            <Download className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">{totalDownloads}</div>
          <div className="text-[10px] text-blue-400 font-mono">Global Scholar Access</div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#f1f5f9] p-1 rounded-xl border border-slate-200/90">
            <button
              onClick={() => setSelectedCategoryTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategoryTab === 'ALL' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-white'
              }`}
            >
              All Assets ({assets.length})
            </button>
            <button
              onClick={() => setSelectedCategoryTab('THESES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategoryTab === 'THESES' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-white'
              }`}
            >
              🎓 Theses & Dissertations
            </button>
            <button
              onClick={() => setSelectedCategoryTab('RESEARCH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategoryTab === 'RESEARCH' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-white'
              }`}
            >
              🔬 Research Journals & Papers
            </button>
            <button
              onClick={() => setSelectedCategoryTab('EBOOKS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategoryTab === 'EBOOKS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-white'
              }`}
            >
              📚 E-Books & Reference
            </button>
          </div>

          {/* Search & Access Filter */}
          <div className="flex items-center space-x-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by title, scholar, DOI, department..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-[#71717a] focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <select
              value={accessFilter}
              onChange={e => setAccessFilter(e.target.value)}
              className="bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Access Types</option>
              <option value="OPEN">Open Access</option>
              <option value="STUDENT_ONLY">Students & Staff</option>
              <option value="FACULTY_ONLY">Faculty Scholars Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Asset Repository Cards */}
      {filteredAssets.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-200/90 bg-white space-y-3">
          <BookOpen className="h-10 w-10 text-[#52525b] mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No Repository Resources Found</h3>
          <p className="text-xs text-slate-500">Try adjusting your search keywords or deposit a new thesis using the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssets.map(a => {
            const isThesis = a.fileType === 'THESIS' || (a.category && a.category.includes('Thesis'));
            const isExpanded = expandedAbstractId === a.id;

            return (
              <div
                key={a.id}
                className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-500/40 transition-all space-y-3.5 flex flex-col justify-between shadow-sm hover:shadow-indigo-500/10"
              >
                <div className="space-y-2">
                  {/* Category & Access Badges Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-lg border ${
                        isThesis ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' :
                        a.fileType === 'JOURNAL' ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' :
                        'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                      }`}>
                        {a.fileType} • {a.fileSize}
                      </span>

                      <span className="text-[10px] text-slate-500 bg-[#f1f5f9] px-2 py-0.5 rounded border border-slate-200/90">
                        {a.category}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {a.ocrStatus && (
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center space-x-1">
                          <Sparkles className="h-2.5 w-2.5" />
                          <span>OCR Searchable</span>
                        </span>
                      )}

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                        a.accessLevel === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        a.accessLevel === 'STUDENT_ONLY' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                        'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                      }`}>
                        {a.accessLevel === 'OPEN' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                        <span>{a.accessLevel.replace('_', ' ')}</span>
                      </span>
                    </div>
                  </div>

                  {/* Resource Title */}
                  <h3 className="font-bold text-slate-900 text-sm leading-snug hover:text-indigo-400 transition-colors">
                    {a.title}
                  </h3>

                  {/* Scholar Author & Department info */}
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <div className="flex items-center space-x-1 text-emerald-400 font-medium">
                      <span>By {a.author}</span>
                      {a.year && <span className="text-slate-400">({a.year})</span>}
                    </div>
                    {a.department && (
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Building className="h-3 w-3 text-indigo-400" />
                        <span>{a.department}</span>
                      </div>
                    )}
                    {a.doi && (
                      <div className="text-[10px] font-mono text-blue-400 truncate">
                        DOI: {a.doi}
                      </div>
                    )}
                  </div>

                  {/* Abstract Section */}
                  {a.abstract && (
                    <div className="pt-1">
                      <p className={`text-[11px] text-slate-500 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {a.abstract}
                      </p>
                      <button
                        onClick={() => setExpandedAbstractId(isExpanded ? null : a.id)}
                        className="text-[10px] text-indigo-400 hover:underline mt-0.5 font-semibold cursor-pointer"
                      >
                        {isExpanded ? 'Show less' : 'Read full abstract...'}
                      </button>
                    </div>
                  )}

                  {/* Keywords Tags */}
                  {a.keywords && a.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {a.keywords.map((kw, idx) => (
                        <span key={idx} className="text-[9px] bg-[#f1f5f9] text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/90 font-mono">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="border-t border-slate-200/90 pt-3 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                    <Download className="h-3 w-3 text-blue-400" />
                    <span>{a.downloadsCount || 120} downloads</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCitationAsset(a)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#f1f5f9] hover:bg-slate-100 border border-slate-200/90 text-slate-900 text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-all"
                      title="Generate Citation (APA / IEEE / MLA)"
                    >
                      <Share2 className="h-3.5 w-3.5 text-purple-400" />
                      <span>Cite</span>
                    </button>

                    <button
                      onClick={() => setPreviewAsset(a)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#f1f5f9] hover:bg-slate-100 border border-slate-200/90 text-slate-900 text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-all"
                      title="Read Online Document Reader"
                    >
                      <Eye className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Read</span>
                    </button>

                    <button
                      onClick={() => handleSimulateDownload(a)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center space-x-1 cursor-pointer shadow-md shadow-indigo-600/20 transition-all"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* DEPOSIT NEW RESOURCE MODAL */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200/90 w-full max-w-2xl rounded-2xl shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Deposit Thesis / Digital Resource</h3>
                  <p className="text-xs text-slate-500">Archive scholarly publications directly into PLiMS Institutional Repository</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#f1f5f9] text-slate-500 hover:text-white border border-slate-200/90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleDepositResource} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-500 font-medium">Resource Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Next-Generation Neural Search Architectures for Academic Repositories"
                    value={newResourceForm.title}
                    onChange={e => setNewResourceForm({ ...newResourceForm, title: e.target.value })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Author / Scholar Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Aijaz Akhter / Scholar Name"
                    value={newResourceForm.author}
                    onChange={e => setNewResourceForm({ ...newResourceForm, author: e.target.value })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Academic Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science & LIS"
                    value={newResourceForm.department}
                    onChange={e => setNewResourceForm({ ...newResourceForm, department: e.target.value })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Repository Category</label>
                  <select
                    value={newResourceForm.category}
                    onChange={e => setNewResourceForm({ ...newResourceForm, category: e.target.value })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Doctoral Dissertation">Doctoral Dissertation (Ph.D.)</option>
                    <option value="Master's Thesis">Master's Thesis (M.S. / M.Phil)</option>
                    <option value="Research Journal Article">Peer-Reviewed Journal Article</option>
                    <option value="Conference Proceeding">Conference Proceeding Paper</option>
                    <option value="Institutional Monograph">Institutional Monograph / Book</option>
                    <option value="Technical Report">Technical Research Report</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">File Document Format</label>
                  <select
                    value={newResourceForm.fileType}
                    onChange={e => setNewResourceForm({ ...newResourceForm, fileType: e.target.value, category: e.target.value === 'THESIS' ? 'Doctoral Dissertation' : newResourceForm.category })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="THESIS">THESIS (Ph.D. / M.S. PDF)</option>
                    <option value="PDF">PDF Document</option>
                    <option value="EPUB">EPUB E-Book</option>
                    <option value="JOURNAL">JOURNAL Article</option>
                    <option value="DOCX">DOCX Word Document</option>
                    <option value="PPTX">PPTX Slide Deck</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Access Permission Level</label>
                  <select
                    value={newResourceForm.accessLevel}
                    onChange={e => setNewResourceForm({ ...newResourceForm, accessLevel: e.target.value as any })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="OPEN">🌐 Open Access (Public Global Download)</option>
                    <option value="STUDENT_ONLY">🎓 Students & University Members</option>
                    <option value="FACULTY_ONLY">🔒 Faculty & Senior Researchers Only</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">DOI / Handle URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 10.5281/zenodo.9876543"
                    value={newResourceForm.doi}
                    onChange={e => setNewResourceForm({ ...newResourceForm, doi: e.target.value })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-500 font-medium">Abstract / Executive Summary</label>
                  <textarea
                    rows={3}
                    placeholder="Provide a scholarly abstract of the research thesis or paper..."
                    value={newResourceForm.abstract}
                    onChange={e => setNewResourceForm({ ...newResourceForm, abstract: e.target.value })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-500 font-medium">Keywords (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Machine Learning, Information Retrieval, MARC21, DDC"
                    value={newResourceForm.keywords}
                    onChange={e => setNewResourceForm({ ...newResourceForm, keywords: e.target.value })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Drag & Drop File Upload Area */}
              <div className="border-2 border-dashed border-slate-200/90 hover:border-indigo-500/50 rounded-xl p-4 text-center bg-[#f1f5f9] transition-all">
                <input
                  type="file"
                  id="thesis-file-upload"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIsUploading(true);
                      setTimeout(() => {
                        setIsUploading(false);
                        setUploadedFileName(file.name);
                      }, 1000);
                    }
                  }}
                />
                <label htmlFor="thesis-file-upload" className="cursor-pointer space-y-1.5 block">
                  <UploadCloud className="h-7 w-7 text-indigo-400 mx-auto" />
                  <div className="text-xs font-semibold text-slate-900">
                    {uploadedFileName ? (
                      <span className="text-emerald-400 flex items-center justify-center space-x-1">
                        <Check className="h-4 w-4" />
                        <span>Uploaded: {uploadedFileName}</span>
                      </span>
                    ) : (
                      <span>Click to select or drag PDF/EPUB document here</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">Supports PDF, EPUB, DOCX up to 100MB • Automatic OCR indexing</div>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-200/90">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#f1f5f9] border border-slate-200/90 text-xs text-slate-500 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Archive Resource</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DOCUMENT PREVIEWER READER MODAL */}
      {/* ========================================================= */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-3.5 border-b border-slate-200/90 flex items-center justify-between bg-[#f1f5f9]">
              <div className="flex items-center space-x-3 overflow-hidden">
                <FileText className="h-5 w-5 text-indigo-400 shrink-0" />
                <div className="truncate">
                  <h3 className="font-bold text-sm text-slate-900 truncate">{previewAsset.title}</h3>
                  <div className="text-[11px] text-slate-500">By {previewAsset.author} • {previewAsset.fileType}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleSimulateDownload(previewAsset)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => setPreviewAsset(null)}
                  className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Document Reader Simulated Viewport */}
            <div className="flex-1 bg-slate-100 p-6 overflow-y-auto space-y-6">
              <div className="max-w-2xl mx-auto bg-white text-slate-900 p-8 rounded-lg shadow-xl space-y-6 min-h-[600px]">
                <div className="border-b border-slate-200 pb-4 text-center space-y-2">
                  <div className="text-[10px] font-mono tracking-widest text-indigo-600 uppercase font-bold">
                    PLiMS Institutional Repository Document Reader
                  </div>
                  <h1 className="text-xl font-serif font-bold leading-snug text-slate-900">{previewAsset.title}</h1>
                  <div className="text-xs font-semibold text-slate-700">Author: {previewAsset.author}</div>
                  {previewAsset.department && <div className="text-[11px] text-slate-500">{previewAsset.department}</div>}
                  {previewAsset.doi && <div className="text-[10px] font-mono text-indigo-600">DOI: {previewAsset.doi}</div>}
                </div>

                <div className="space-y-3 text-xs leading-relaxed text-slate-800">
                  <div className="font-bold text-sm text-slate-900 border-b pb-1">ABSTRACT</div>
                  <p>{previewAsset.abstract || 'No full abstract text provided.'}</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Full-Text Document Preview Mode</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono">Page 1 of 48</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    This scholarly paper has been full-text indexed using PLiMS High-Accuracy Optical Character Recognition (OCR). Keywords and formulas are fully searchable in the discovery index.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CITATION MODAL */}
      {/* ========================================================= */}
      {citationAsset && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
              <div className="flex items-center space-x-2">
                <Share2 className="h-5 w-5 text-purple-400" />
                <h3 className="font-bold text-sm text-slate-900">Academic Citation Formats</h3>
              </div>
              <button onClick={() => setCitationAsset(null)} className="text-slate-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* APA 7th */}
              <div className="p-3 rounded-xl bg-[#f1f5f9] border border-slate-200/90 space-y-1">
                <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px]">
                  <span>APA 7th Edition</span>
                  <button
                    onClick={() =>
                      copyCitationToClipboard(
                        `${citationAsset.author}. (${citationAsset.year || 2024}). ${citationAsset.title}. PLiMS Institutional Repository. https://doi.org/${citationAsset.doi || '10.5281/plims'}`,
                        'APA'
                      )
                    }
                    className="text-purple-400 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copiedCitationFormat === 'APA' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <p className="font-mono text-[11px] text-slate-900 leading-relaxed">
                  {citationAsset.author}. ({citationAsset.year || 2024}). <em>{citationAsset.title}</em>. PLiMS Institutional Repository.
                </p>
              </div>

              {/* IEEE */}
              <div className="p-3 rounded-xl bg-[#f1f5f9] border border-slate-200/90 space-y-1">
                <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px]">
                  <span>IEEE Standard</span>
                  <button
                    onClick={() =>
                      copyCitationToClipboard(
                        `${citationAsset.author}, "${citationAsset.title}," PLiMS Institutional Repository, ${citationAsset.year || 2024}.`,
                        'IEEE'
                      )
                    }
                    className="text-purple-400 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copiedCitationFormat === 'IEEE' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <p className="font-mono text-[11px] text-slate-900 leading-relaxed">
                  {citationAsset.author}, "{citationAsset.title}," PLiMS Institutional Repository, {citationAsset.year || 2024}.
                </p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setCitationAsset(null)}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
