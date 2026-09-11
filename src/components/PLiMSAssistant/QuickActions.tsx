import React from 'react';
import {
  BookOpen,
  Search,
  BookMarked,
  RotateCcw,
  Bookmark,
  Sparkles,
  FileText,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

interface QuickActionsProps {
  onSelectAction: (actionKey: string, promptText: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onSelectAction }) => {
  const actions = [
    {
      key: 'SEARCH_BOOKS',
      label: '📚 Search Books',
      prompt: 'Search books about Artificial Intelligence and Library Automation'
    },
    {
      key: 'ADVANCED_SEARCH',
      label: '🔎 Advanced Search',
      prompt: 'OPEN_ADVANCED_SEARCH_MODAL'
    },
    {
      key: 'MY_LOANS',
      label: '📖 My Loans',
      prompt: 'Show my current borrowed books and due dates'
    },
    {
      key: 'RENEW_BOOKS',
      label: '🔄 Renew Books',
      prompt: 'Show my books eligible for renewal'
    },
    {
      key: 'MY_RESERVATIONS',
      label: '📌 My Holds',
      prompt: 'Show my active book reservations and holds queue'
    },
    {
      key: 'RECOMMENDATIONS',
      label: '💡 Recommendations',
      prompt: 'Recommend books for me based on library catalog subjects'
    },
    {
      key: 'DIGITAL_RESOURCES',
      label: '📰 Digital Resources',
      prompt: 'Search digital library resources, e-books, and research PDFs'
    },
    {
      key: 'LIBRARY_HELP',
      label: '❓ Library FAQ & Hours',
      prompt: 'What are the library operating hours and borrowing fine policies?'
    }
  ];

  return (
    <div className="flex flex-wrap gap-1.5 py-1">
      {actions.map(act => (
        <button
          key={act.key}
          onClick={() => onSelectAction(act.key, act.prompt)}
          className="px-2.5 py-1 rounded-xl bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap shadow-sm hover:shadow"
        >
          {act.label}
        </button>
      ))}
    </div>
  );
};
