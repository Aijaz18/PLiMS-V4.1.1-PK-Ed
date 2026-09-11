import React, { useState } from 'react';
import { Search, BookOpen, Users, Settings, X } from 'lucide-react';
import { ModuleTab } from './Sidebar';

import { BookRecord, UserProfile } from '../types/alims';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab?: (tab: ModuleTab) => void;
  onSelectModule?: (tab: ModuleTab) => void;
  books?: BookRecord[];
  users?: UserProfile[];
  onSelectBook?: (b: any) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const actions: { title: string; tab: ModuleTab; description: string }[] = [
    { title: 'Search OPAC Catalog', tab: 'OPAC', description: 'Browse books, e-books, and research records' },
    { title: 'Circulation Desk', tab: 'CIRCULATION', description: 'Issue, return, or renew book loans' },
    { title: 'MARC21 Cataloguing', tab: 'CATALOGUING', description: 'Add or modify MARC21 bibliographic records' },
    { title: 'Patron Directory', tab: 'MEMBERS', description: 'Manage student and faculty member accounts' },
    { title: 'Digital Library', tab: 'DIGITAL_LIBRARY', description: 'Access PDFs, e-journals, and digital assets' },
    { title: 'System Settings', tab: 'SETTINGS', description: 'Configure library parameters, fines, and branches' }
  ];

  const filtered = actions.filter(a =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        <div className="p-3 border-b border-[#27272a] flex items-center space-x-3">
          <Search className="h-4 w-4 text-blue-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a module command..."
            className="flex-1 bg-transparent text-xs text-[#fafafa] placeholder-[#a1a1aa] focus:outline-none"
          />
          <button onClick={onClose} className="text-[#a1a1aa] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
          {filtered.map(a => (
            <button
              key={a.tab}
              onClick={() => {
                onSelectTab(a.tab);
                onClose();
              }}
              className="w-full p-2.5 rounded-xl text-left hover:bg-[#18181b] transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="text-xs font-semibold text-[#fafafa] group-hover:text-blue-400">{a.title}</div>
                <div className="text-[10px] text-[#a1a1aa]">{a.description}</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#09090b] text-[#a1a1aa] border border-[#27272a]">Jump ↵</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
