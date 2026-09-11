import React, { useState } from 'react';
import { User, Check, Search, Hash } from 'lucide-react';
import { BookRecord, UserProfile } from '../../types/alims';

interface MemberSelectionCardProps {
  book: BookRecord;
  users: UserProfile[];
  onSelectMember: (member: UserProfile) => void;
  onCancel?: () => void;
}

export const MemberSelectionCard: React.FC<MemberSelectionCardProps> = ({
  book,
  users,
  onSelectMember,
  onCancel
}) => {
  const [filterText, setFilterText] = useState('');

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(filterText.toLowerCase()) ||
    (u.memberCode && u.memberCode.toLowerCase().includes(filterText.toLowerCase())) ||
    (u.department && u.department.toLowerCase().includes(filterText.toLowerCase()))
  );

  return (
    <div className="mt-2.5 rounded-xl bg-[#18181b] border border-blue-500/40 p-3 text-xs text-zinc-200 shadow-lg space-y-2.5">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold">
            Select Borrower for Issue
          </div>
          <div className="text-white font-semibold text-xs truncate">
            Book: &ldquo;{book.title}&rdquo;
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-zinc-400 hover:text-white text-[10px] cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="h-3 w-3 text-zinc-400 absolute left-2.5 top-2" />
        <input
          type="text"
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          placeholder="Filter patron name, code, or department..."
          className="w-full bg-[#09090b] border border-zinc-700 rounded-lg pl-7 pr-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-0.5">
        {filteredUsers.length > 0 ? (
          filteredUsers.map(u => (
            <button
              key={u.id}
              type="button"
              onClick={() => onSelectMember(u)}
              className="w-full text-left p-2 rounded-lg bg-[#09090b] hover:bg-blue-600/15 border border-zinc-800 hover:border-blue-500/40 flex items-center justify-between transition-all cursor-pointer group"
            >
              <div className="min-w-0 flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] shrink-0 font-bold">
                  {u.name.charAt(0)}
                </div>
                <div className="truncate">
                  <div className="font-semibold text-white text-[11px] group-hover:text-blue-300 truncate">
                    {u.name}
                  </div>
                  <div className="text-[9px] text-zinc-400 font-mono truncate">
                    {u.memberCode || u.id} • {u.department || u.role}
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                Issue
              </span>
            </button>
          ))
        ) : (
          <div className="text-center text-[10px] text-zinc-500 py-2">
            No patrons match &ldquo;{filterText}&rdquo;.
          </div>
        )}
      </div>

      <p className="text-[10px] text-zinc-400 font-mono text-center pt-0.5">
        💡 You can also speak patron name directly into the microphone.
      </p>
    </div>
  );
};
