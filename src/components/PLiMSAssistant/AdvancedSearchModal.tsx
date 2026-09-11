import React, { useState } from 'react';
import { Search, X, Filter, BookOpen, Building2, Calendar, Tag, Check } from 'lucide-react';
import { BookRecord } from '../../types/alims';

interface AdvancedSearchModalProps {
  branches: string[];
  onApplyFilters: (filters: AdvancedSearchFilters) => void;
  onClose: () => void;
}

export interface AdvancedSearchFilters {
  query: string;
  author: string;
  subject: string;
  isbn: string;
  language: string;
  format: string;
  branch: string;
  yearMin: string;
  availableOnly: boolean;
}

export const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  branches,
  onApplyFilters,
  onClose
}) => {
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    query: '',
    author: '',
    subject: '',
    isbn: '',
    language: 'ALL',
    format: 'ALL',
    branch: 'ALL',
    yearMin: '',
    availableOnly: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilters(filters);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 p-5 text-xs text-[#fafafa]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Filter className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#fafafa]">Advanced Bibliographic Search</h3>
              <p className="text-[11px] text-[#a1a1aa]">Filter PLiMS Catalog Holdings</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#27272a] text-[#71717a] hover:text-[#fafafa] hover:bg-[#27272a] transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] text-[#a1a1aa] mb-1 font-semibold">Keyword / Title Query</label>
            <input
              type="text"
              value={filters.query}
              onChange={e => setFilters({ ...filters, query: e.target.value })}
              placeholder="e.g. Artificial Intelligence, Digital Humanities, Algorithms"
              className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs text-[#fafafa] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#a1a1aa] mb-1 font-semibold">Author Name</label>
              <input
                type="text"
                value={filters.author}
                onChange={e => setFilters({ ...filters, author: e.target.value })}
                placeholder="e.g. Harari, Russell, Tanenbaum"
                className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs text-[#fafafa] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#a1a1aa] mb-1 font-semibold">Subject / LCSH</label>
              <input
                type="text"
                value={filters.subject}
                onChange={e => setFilters({ ...filters, subject: e.target.value })}
                placeholder="e.g. Machine Learning, Medicine"
                className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs text-[#fafafa] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#a1a1aa] mb-1 font-semibold">Language</label>
              <select
                value={filters.language}
                onChange={e => setFilters({ ...filters, language: e.target.value })}
                className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs text-[#fafafa] focus:outline-none"
              >
                <option value="ALL">All Languages (English/Urdu)</option>
                <option value="English">English</option>
                <option value="Urdu">Urdu (اردو)</option>
                <option value="Arabic">Arabic</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-[#a1a1aa] mb-1 font-semibold">Format / Material Type</label>
              <select
                value={filters.format}
                onChange={e => setFilters({ ...filters, format: e.target.value })}
                className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs text-[#fafafa] focus:outline-none"
              >
                <option value="ALL">All Formats (Print & Digital)</option>
                <option value="HARDCOVER">Hardcover</option>
                <option value="PAPERBACK">Paperback</option>
                <option value="DIGITAL">Digital E-Book / PDF</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#a1a1aa] mb-1 font-semibold">Campus Library Branch</label>
              <select
                value={filters.branch}
                onChange={e => setFilters({ ...filters, branch: e.target.value })}
                className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs text-[#fafafa] focus:outline-none"
              >
                <option value="ALL">All Campus Branches</option>
                {branches.map((b, i) => (
                  <option key={i} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-[#a1a1aa] mb-1 font-semibold">Min Publication Year</label>
              <input
                type="number"
                value={filters.yearMin}
                onChange={e => setFilters({ ...filters, yearMin: e.target.value })}
                placeholder="e.g. 2020"
                className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs text-[#fafafa] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center space-x-2">
            <input
              type="checkbox"
              id="chk_available"
              checked={filters.availableOnly}
              onChange={e => setFilters({ ...filters, availableOnly: e.target.checked })}
              className="rounded border-[#27272a] bg-[#09090b] text-blue-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="chk_available" className="text-xs text-[#fafafa] font-semibold cursor-pointer">
              Show available items only (copies &gt; 0)
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center space-x-2 pt-3 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#27272a] bg-[#18181b] hover:bg-[#27272a] text-[#fafafa] font-semibold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-lg shadow-blue-600/20"
            >
              <Search className="h-4 w-4" />
              <span>Apply Filters</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
