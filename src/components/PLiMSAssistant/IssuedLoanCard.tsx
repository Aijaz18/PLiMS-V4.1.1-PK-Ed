import React, { useState } from 'react';
import {
  CheckCircle2,
  Calendar,
  User,
  BookOpen,
  Hash,
  ExternalLink,
  Printer,
  Copy,
  Check
} from 'lucide-react';
import { BookRecord, UserProfile, CirculationTransaction } from '../../types/alims';

interface IssuedLoanCardProps {
  book: BookRecord;
  member: UserProfile;
  transaction?: CirculationTransaction;
  dueDate: string;
  issueDate?: string;
  isOffline?: boolean;
  onNavigateToCirculation?: () => void;
}

export const IssuedLoanCard: React.FC<IssuedLoanCardProps> = ({
  book,
  member,
  transaction,
  dueDate,
  issueDate = new Date().toISOString().split('T')[0],
  isOffline = false,
  onNavigateToCirculation
}) => {
  const [copiedId, setCopiedId] = useState(false);

  const loanId = transaction?.id || `TX-${Date.now().toString().slice(-6)}`;

  const handleCopySlip = () => {
    const slip = `PLiMS CIRCULATION LOAN RECEIPT\nTransaction ID: ${loanId}\nBook: ${book.title} (${book.callNumber})\nBorrower: ${member.name} (${member.memberCode || member.id})\nIssue Date: ${issueDate}\nDue Date: ${dueDate}\nStatus: ACTIVE LOAN`;
    navigator.clipboard.writeText(slip);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mt-2.5 rounded-xl bg-[#0e1713] border border-emerald-500/40 p-3.5 text-xs text-zinc-200 shadow-lg space-y-3">
      {/* Header with success badge */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div>
            <div className="font-bold text-emerald-300 text-xs flex items-center space-x-1.5">
              <span>Book Issued Successfully</span>
              {isOffline && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] border border-amber-500/30">
                  Offline Sync
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">Loan Ref: {loanId}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopySlip}
          className="p-1 rounded-lg border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer text-[10px] flex items-center space-x-1"
          title="Copy Loan Slip text"
        >
          {copiedId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          <span>{copiedId ? 'Copied' : 'Copy Slip'}</span>
        </button>
      </div>

      {/* Book and Patron Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
        {/* Book summary */}
        <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800 space-y-1">
          <div className="text-[10px] font-mono text-zinc-400 flex items-center space-x-1 uppercase tracking-wider">
            <BookOpen className="h-3 w-3 text-blue-400" />
            <span>Resource</span>
          </div>
          <div className="font-semibold text-white line-clamp-1">{book.title}</div>
          <div className="text-zinc-400 truncate text-[10px]">{book.authors?.join(', ') || 'Unknown Author'}</div>
          <div className="text-[10px] font-mono text-zinc-400 flex items-center space-x-1 pt-0.5">
            <Hash className="h-2.5 w-2.5 text-blue-400" />
            <span>Call No: {book.callNumber}</span>
          </div>
        </div>

        {/* Member summary */}
        <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800 space-y-1">
          <div className="text-[10px] font-mono text-zinc-400 flex items-center space-x-1 uppercase tracking-wider">
            <User className="h-3 w-3 text-purple-400" />
            <span>Patron</span>
          </div>
          <div className="font-semibold text-white truncate">{member.name}</div>
          <div className="text-zinc-400 truncate text-[10px]">{member.department || member.role}</div>
          <div className="text-[10px] font-mono text-zinc-400 pt-0.5">
            Code: {member.memberCode || member.id}
          </div>
        </div>
      </div>

      {/* Dates row */}
      <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-[10px] font-mono">
        <div className="flex items-center space-x-1 text-zinc-300">
          <Calendar className="h-3 w-3 text-emerald-400" />
          <span>Issued: {issueDate}</span>
        </div>
        <div className="flex items-center space-x-1 text-emerald-300 font-bold">
          <span>Due: {dueDate} (14 Days)</span>
        </div>
      </div>

      {/* Action shortcuts */}
      <div className="flex items-center justify-end space-x-2 pt-1">
        {onNavigateToCirculation && (
          <button
            type="button"
            onClick={onNavigateToCirculation}
            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-semibold flex items-center space-x-1 cursor-pointer transition-all border border-zinc-700"
          >
            <ExternalLink className="h-3 w-3 text-blue-400" />
            <span>Circulation Desk</span>
          </button>
        )}
        <button
          type="button"
          onClick={handlePrint}
          className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 text-[10px] font-semibold flex items-center space-x-1 cursor-pointer transition-all border border-emerald-500/40"
        >
          <Printer className="h-3 w-3 text-emerald-400" />
          <span>Print Slip</span>
        </button>
      </div>
    </div>
  );
};
