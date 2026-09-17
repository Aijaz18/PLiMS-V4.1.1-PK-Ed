import React, { useState, useEffect, useMemo } from 'react';
import {
  Repeat,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  Play,
  Check,
  Send,
  Eye,
  Trash2,
  Sparkles,
  Search,
  RefreshCw,
  User,
  BookOpen,
  DollarSign,
  Printer,
  X,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  QrCode,
  Settings2
} from 'lucide-react';
import { BookRecord, UserProfile, CirculationTransaction, OverdueNoticeDraft, BookCopy, SystemSettings } from '../../types/alims';
import { MemberQrScanner } from '../MemberQrScanner';
import { CirculationSlipModal } from '../CirculationSlipModal';
import { SlipReceiptData, printSlipInNewWindow } from '../../utils/printSlip';

interface CirculationModuleProps {
  books: BookRecord[];
  users: UserProfile[];
  transactions: CirculationTransaction[];
  copies?: BookCopy[];
  currentUser?: UserProfile;
  settings?: SystemSettings;
  onIssueBook: (accession: string, memberId: string) => void;
  onReturnBook: (transactionId: string) => void;
  onRenewBook?: (txId: string) => void;
  onPayFine?: (memberId: string, amount: number) => void;
}

export const CirculationModule: React.FC<CirculationModuleProps> = ({
  books,
  users,
  transactions,
  copies = [],
  currentUser,
  settings,
  onIssueBook,
  onReturnBook,
  onRenewBook,
  onPayFine
}) => {
  // Circulation Slip Modal State
  const [slipModalData, setSlipModalData] = useState<SlipReceiptData | null>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  const handleOpenSlip = (data: SlipReceiptData) => {
    setSlipModalData(data);
    setIsSlipModalOpen(true);
  };

  // Navigation Tabs: Focus primarily on simple ISSUE and simple RETURN
  const [activeTab, setActiveTab] = useState<'ISSUE' | 'RETURN' | 'HISTORY' | 'OVERDUE_NOTICES' | 'QR_KIOSK'>('ISSUE');

  // ----------------------------------------------------
  // SIMPLE ISSUE STATE
  // ----------------------------------------------------
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [customAccession, setCustomAccession] = useState<string>('');
  const [loanPeriodDays, setLoanPeriodDays] = useState<number>(14);
  const [customDueDate, setCustomDueDate] = useState<string>('');
  const [issueNotes, setIssueNotes] = useState<string>('');
  const [lastIssuedReceipt, setLastIssuedReceipt] = useState<{
    bookTitle: string;
    accessionNumber: string;
    patronName: string;
    memberCode: string;
    issueDate: string;
    dueDate: string;
    librarianName: string;
  } | null>(null);

  // Fast Barcode Direct Entry for Issue
  const [fastScanMemberCode, setFastScanMemberCode] = useState('');
  const [fastScanBookAccession, setFastScanBookAccession] = useState('');

  // ----------------------------------------------------
  // SIMPLE RETURN STATE
  // ----------------------------------------------------
  const [returnSearchQuery, setReturnSearchQuery] = useState('');
  const [selectedTxToReturn, setSelectedTxToReturn] = useState<CirculationTransaction | null>(null);
  const [waiveFine, setWaiveFine] = useState(false);
  const [lastReturnedReceipt, setLastReturnedReceipt] = useState<{
    bookTitle: string;
    accessionNumber: string;
    patronName: string;
    returnDate: string;
    overdueDays: number;
    fineAmount: number;
    fineStatus: string;
  } | null>(null);

  // ----------------------------------------------------
  // HISTORY & NOTICES STATE
  // ----------------------------------------------------
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'ISSUED' | 'RETURNED' | 'OVERDUE'>('ALL');
  const [drafts, setDrafts] = useState<OverdueNoticeDraft[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<OverdueNoticeDraft | null>(null);

  // Calculate default due date
  const calculateDueDate = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    setCustomDueDate(calculateDueDate(loanPeriodDays));
  }, [loanPeriodDays]);

  // Derive selected member and book objects
  const selectedMember = useMemo(() => {
    return users.find(u => u.id === selectedMemberId || u.memberCode === selectedMemberId);
  }, [users, selectedMemberId]);

  const selectedBook = useMemo(() => {
    return books.find(b => b.id === selectedBookId || b.accessionNumber === selectedBookId);
  }, [books, selectedBookId]);

  // Adjust loan period if selected member is faculty
  useEffect(() => {
    if (selectedMember) {
      if (selectedMember.role === 'FACULTY' || selectedMember.role === 'CHIEF_LIBRARIAN') {
        setLoanPeriodDays(settings?.maxBorrowDaysFaculty || 30);
      } else {
        setLoanPeriodDays(settings?.maxBorrowDaysStudent || 14);
      }
    }
  }, [selectedMember, settings]);

  // Helper to check if a date is overdue
  const isDateOverdue = (dueDateStr: string): boolean => {
    if (!dueDateStr) return false;
    const due = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Helper to compute overdue days
  const getOverdueDays = (dueDateStr: string): number => {
    if (!dueDateStr) return 0;
    const due = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  // Active Loans List (Not Returned)
  const activeLoans = useMemo(() => {
    return transactions.filter(t => t.status !== 'RETURNED');
  }, [transactions]);

  // Filtered Members for Issue
  const filteredMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return users;
    const q = memberSearchQuery.toLowerCase();
    return users.filter(
      u =>
        u.name.toLowerCase().includes(q) ||
        (u.memberCode && u.memberCode.toLowerCase().includes(q)) ||
        u.email.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q))
    );
  }, [users, memberSearchQuery]);

  // Filtered Books for Issue
  const filteredBooks = useMemo(() => {
    if (!bookSearchQuery.trim()) return books;
    const q = bookSearchQuery.toLowerCase();
    return books.filter(
      b =>
        b.title.toLowerCase().includes(q) ||
        (b.accessionNumber && b.accessionNumber.toLowerCase().includes(q)) ||
        (b.isbn && b.isbn.toLowerCase().includes(q)) ||
        (b.callNumber && b.callNumber.toLowerCase().includes(q)) ||
        b.authors.some(a => a.toLowerCase().includes(q))
    );
  }, [books, bookSearchQuery]);

  // Filtered Return Loans
  const filteredReturnLoans = useMemo(() => {
    if (!returnSearchQuery.trim()) return activeLoans;
    const q = returnSearchQuery.toLowerCase();
    return activeLoans.filter(
      t =>
        t.bookTitle.toLowerCase().includes(q) ||
        (t.accessionNumber && t.accessionNumber.toLowerCase().includes(q)) ||
        (t.copyBarcode && t.copyBarcode.toLowerCase().includes(q)) ||
        t.memberName.toLowerCase().includes(q) ||
        (t.memberCode && t.memberCode.toLowerCase().includes(q))
    );
  }, [activeLoans, returnSearchQuery]);

  // Filtered Circulation History
  const filteredHistory = useMemo(() => {
    return transactions.filter(t => {
      if (historyFilter !== 'ALL') {
        if (historyFilter === 'OVERDUE') {
          if (t.status !== 'OVERDUE' && !isDateOverdue(t.dueDate)) return false;
        } else if (t.status !== historyFilter) {
          return false;
        }
      }
      if (!historySearchQuery.trim()) return true;
      const q = historySearchQuery.toLowerCase();
      return (
        t.bookTitle.toLowerCase().includes(q) ||
        (t.accessionNumber && t.accessionNumber.toLowerCase().includes(q)) ||
        (t.copyBarcode && t.copyBarcode.toLowerCase().includes(q)) ||
        t.memberName.toLowerCase().includes(q) ||
        (t.memberCode && t.memberCode.toLowerCase().includes(q))
      );
    });
  }, [transactions, historyFilter, historySearchQuery]);

  // ----------------------------------------------------
  // EXECUTE ISSUE ACTION
  // ----------------------------------------------------
  const handleExecuteIssue = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const memberToUse = selectedMember;
    const bookToUse = selectedBook;

    if (!memberToUse) {
      alert('Please select a borrower / member from the list.');
      return;
    }

    if (!bookToUse && !customAccession.trim()) {
      alert('Please select a book or enter an accession number.');
      return;
    }

    const accessionToIssue = customAccession.trim() || bookToUse?.accessionNumber || `ACC-${Math.floor(10000 + Math.random() * 90000)}`;
    const memberCodeToUse = memberToUse.memberCode || memberToUse.id;
    const computedDueDate = customDueDate || calculateDueDate(loanPeriodDays);

    // Call the parent issue handler
    onIssueBook(accessionToIssue, memberCodeToUse);

    // Save receipt for confirmation modal/banner
    const receipt = {
      bookTitle: bookToUse?.title || 'Selected Library Book',
      accessionNumber: accessionToIssue,
      patronName: memberToUse.name,
      memberCode: memberCodeToUse,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: computedDueDate,
      librarianName: currentUser?.name || 'Chief Librarian'
    };
    setLastIssuedReceipt(receipt);

    // Prepare full printable slip data and open slip dialog
    const slipData: SlipReceiptData = {
      type: 'ISSUE',
      receiptNumber: `ISS-${Date.now().toString().slice(-6)}`,
      libraryName: settings?.libraryName || 'CENTRAL ACADEMIC LIBRARY',
      institutionName: settings?.institutionName || 'INSTITUTION OF HIGHER LEARNING',
      libraryLocation: settings?.libraryLocation || '',
      libraryPhone: settings?.libraryMobileNo || settings?.libraryOfficeNo || '',
      bookTitle: receipt.bookTitle,
      accessionNumber: accessionToIssue,
      copyBarcode: bookToUse?.isbn || accessionToIssue,
      callNumber: bookToUse?.callNumber || '',
      patronName: memberToUse.name,
      memberCode: memberCodeToUse,
      patronRole: memberToUse.role,
      patronDepartment: memberToUse.department,
      issueDate: receipt.issueDate,
      dueDate: computedDueDate,
      librarianName: receipt.librarianName,
      finePerDay: settings?.finePerDay || 50
    };
    setSlipModalData(slipData);
    setIsSlipModalOpen(true);

    // Reset selection for next issue
    setSelectedBookId('');
    setCustomAccession('');
    setBookSearchQuery('');
    setIssueNotes('');
  };

  // Fast Barcode Issue Form
  const handleFastScanIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fastScanMemberCode.trim()) {
      alert('Please enter member ID or scan member barcode.');
      return;
    }
    if (!fastScanBookAccession.trim()) {
      alert('Please enter or scan book accession number / barcode.');
      return;
    }

    const computedDueDate = customDueDate || calculateDueDate(loanPeriodDays);
    onIssueBook(fastScanBookAccession.trim(), fastScanMemberCode.trim());

    const receipt = {
      bookTitle: 'Scanned Catalog Item',
      accessionNumber: fastScanBookAccession.trim(),
      patronName: `Member (${fastScanMemberCode.trim()})`,
      memberCode: fastScanMemberCode.trim(),
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: computedDueDate,
      librarianName: currentUser?.name || 'Chief Librarian'
    };
    setLastIssuedReceipt(receipt);

    const slipData: SlipReceiptData = {
      type: 'ISSUE',
      receiptNumber: `ISS-${Date.now().toString().slice(-6)}`,
      libraryName: settings?.libraryName || 'CENTRAL ACADEMIC LIBRARY',
      institutionName: settings?.institutionName || 'INSTITUTION OF HIGHER LEARNING',
      libraryLocation: settings?.libraryLocation || '',
      libraryPhone: settings?.libraryMobileNo || settings?.libraryOfficeNo || '',
      bookTitle: receipt.bookTitle,
      accessionNumber: fastScanBookAccession.trim(),
      copyBarcode: fastScanBookAccession.trim(),
      patronName: receipt.patronName,
      memberCode: receipt.memberCode,
      issueDate: receipt.issueDate,
      dueDate: computedDueDate,
      librarianName: receipt.librarianName,
      finePerDay: settings?.finePerDay || 50
    };
    setSlipModalData(slipData);
    setIsSlipModalOpen(true);

    setFastScanBookAccession('');
  };

  // ----------------------------------------------------
  // EXECUTE RETURN ACTION (1-CLICK)
  // ----------------------------------------------------
  const handleExecuteReturn = (tx: CirculationTransaction, shouldWaive: boolean = false) => {
    const overdueDays = getOverdueDays(tx.dueDate);
    const finePerDay = settings?.finePerDay || 50;
    const computedFine = shouldWaive ? 0 : overdueDays * finePerDay;

    // Call parent return handler
    onReturnBook(tx.id);

    if (computedFine > 0 && onPayFine) {
      onPayFine(tx.memberId || tx.memberCode || '', computedFine);
    }

    const returnRec = {
      bookTitle: tx.bookTitle,
      accessionNumber: tx.accessionNumber || tx.copyBarcode || 'ACC-RETURNED',
      patronName: tx.memberName,
      returnDate: new Date().toISOString().split('T')[0],
      overdueDays,
      fineAmount: computedFine,
      fineStatus: shouldWaive ? 'Fine Waived (0 PKR)' : computedFine > 0 ? `${computedFine} PKR Settled` : 'No Fine / Cleared'
    };
    setLastReturnedReceipt(returnRec);

    const slipData: SlipReceiptData = {
      type: 'RETURN',
      receiptNumber: `RET-${Date.now().toString().slice(-6)}`,
      libraryName: settings?.libraryName || 'CENTRAL ACADEMIC LIBRARY',
      institutionName: settings?.institutionName || 'INSTITUTION OF HIGHER LEARNING',
      libraryLocation: settings?.libraryLocation || '',
      libraryPhone: settings?.libraryMobileNo || settings?.libraryOfficeNo || '',
      bookTitle: tx.bookTitle,
      accessionNumber: tx.accessionNumber || tx.copyBarcode || 'ACC-RETURNED',
      copyBarcode: tx.copyBarcode || tx.accessionNumber || '',
      patronName: tx.memberName,
      memberCode: tx.memberCode || tx.memberId,
      issueDate: tx.issueDate,
      returnDate: returnRec.returnDate,
      overdueDays,
      fineAmount: computedFine,
      fineStatus: returnRec.fineStatus,
      librarianName: currentUser?.name || 'Chief Librarian'
    };
    setSlipModalData(slipData);
    setIsSlipModalOpen(true);

    setSelectedTxToReturn(null);
    setWaiveFine(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Simple Mode Switcher */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Repeat className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Circulation & Loan Desk</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Simple 1-click book issue, fast barcode return check-in, and automated overdue tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Primary Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Main 1: Issue Book */}
          <button
            onClick={() => setActiveTab('ISSUE')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-md ${
              activeTab === 'ISSUE'
                ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400'
                : 'bg-slate-100 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/30'
            }`}
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Issue Book (Loan)</span>
          </button>

          {/* Main 2: Return Book */}
          <button
            onClick={() => setActiveTab('RETURN')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-md ${
              activeTab === 'RETURN'
                ? 'bg-blue-600 text-white shadow-blue-600/30 ring-2 ring-blue-400'
                : 'bg-slate-100 border border-blue-500/30 text-blue-400 hover:bg-blue-950/30'
            }`}
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span>Return Book (Check-In)</span>
            {activeLoans.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-mono font-bold">
                {activeLoans.length}
              </span>
            )}
          </button>

          {/* Secondary: History */}
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'HISTORY' ? 'bg-[#27272a] text-white' : 'text-slate-500 hover:text-white bg-[#f1f5f9]'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Loan History</span>
          </button>

          {/* Secondary: QR Kiosk */}
          <button
            onClick={() => setActiveTab('QR_KIOSK')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'QR_KIOSK' ? 'bg-purple-600 text-white' : 'text-purple-400 hover:bg-purple-500/10 bg-[#f1f5f9]'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>QR Scanner</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SIMPLE ISSUE WORKFLOW */}
      {/* ========================================================================= */}
      {activeTab === 'ISSUE' && (
        <div className="space-y-5">
          
          {/* Last Issued Receipt Alert */}
          {lastIssuedReceipt && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-300 uppercase font-mono">✓ Book Issued Successfully!</div>
                  <div className="text-sm font-bold text-white mt-0.5">"{lastIssuedReceipt.bookTitle}"</div>
                  <div className="text-xs text-slate-700 flex flex-wrap gap-x-3 gap-y-1 mt-0.5 font-mono">
                    <span>Borrower: <strong className="text-white">{lastIssuedReceipt.patronName} ({lastIssuedReceipt.memberCode})</strong></span>
                    <span>Accession: <strong className="text-amber-400">{lastIssuedReceipt.accessionNumber}</strong></span>
                    <span>Due Date: <strong className="text-emerald-400">{lastIssuedReceipt.dueDate}</strong></span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    if (slipModalData) {
                      handleOpenSlip(slipModalData);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/30 cursor-pointer transition-all"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLastIssuedReceipt(null)}
                  className="p-1.5 rounded-lg hover:bg-emerald-900/40 text-slate-500 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Simple 2-Step Issue Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Step 1: Member Selection (6 cols) */}
            <div className="lg:col-span-6 p-5 rounded-2xl bg-white border border-slate-200/90 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase font-mono text-emerald-400 flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Step 1: Select Member / Borrower</span>
                </h3>
                {selectedMember && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMemberId('');
                      setMemberSearchQuery('');
                    }}
                    className="text-[11px] text-slate-500 hover:text-red-400 flex items-center space-x-1 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                    <span>Change Member</span>
                  </button>
                )}
              </div>

              {/* Selected Member Highlight */}
              {selectedMember ? (
                <div className="p-4 rounded-xl bg-[#f1f5f9] border-2 border-emerald-500/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-11 w-11 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-sm">
                      {selectedMember.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm flex items-center space-x-2">
                        <span>{selectedMember.name}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold uppercase">
                          {selectedMember.role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        ID: <strong className="text-slate-800">{selectedMember.memberCode || selectedMember.id}</strong> • Dept: {selectedMember.department || 'General'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold">
                      ✓ Selected
                    </span>
                  </div>
                </div>
              ) : (
                /* Member Search & Selection List */
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Type Member Name, Roll No / ID (STU-2024-001), or Dept..."
                      value={memberSearchQuery}
                      onChange={e => setMemberSearchQuery(e.target.value)}
                      className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100/40">
                    {filteredMembers.map(u => (
                      <div
                        key={u.id}
                        onClick={() => setSelectedMemberId(u.id)}
                        className="p-3 rounded-xl hover:bg-slate-100 transition-all flex items-center justify-between text-xs cursor-pointer group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold text-xs">
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {u.name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {u.memberCode || u.id} • {u.department || 'Academics'} ({u.role})
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-bold"
                        >
                          Select →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Book Selection & Issue (6 cols) */}
            <div className="lg:col-span-6 p-5 rounded-2xl bg-white border border-slate-200/90 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase font-mono text-blue-400 flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Step 2: Select Book & Confirm Loan</span>
                </h3>
                {selectedBook && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBookId('');
                      setCustomAccession('');
                      setBookSearchQuery('');
                    }}
                    className="text-[11px] text-slate-500 hover:text-red-400 flex items-center space-x-1 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                    <span>Change Book</span>
                  </button>
                )}
              </div>

              {/* Selected Book Highlight */}
              {selectedBook ? (
                <div className="p-4 rounded-xl bg-[#f1f5f9] border-2 border-blue-500/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={selectedBook.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}
                      alt="cover"
                      className="h-12 w-9 rounded object-cover border border-slate-200/90 shrink-0"
                    />
                    <div>
                      <div className="font-bold text-white text-sm">
                        {selectedBook.title}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Accession: <strong className="text-amber-400">{customAccession || selectedBook.accessionNumber}</strong> • Call No: <strong className="text-blue-400">{selectedBook.callNumber}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-mono font-bold">
                      ✓ Selected
                    </span>
                  </div>
                </div>
              ) : (
                /* Book Search & Selection List */
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Type Book Title, Accession No (ACC-88001), ISBN, or Author..."
                      value={bookSearchQuery}
                      onChange={e => setBookSearchQuery(e.target.value)}
                      className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100/40">
                    {filteredBooks.map(b => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedBookId(b.id);
                          setCustomAccession(b.accessionNumber || `ACC-${Math.floor(10000 + Math.random() * 90000)}`);
                        }}
                        className="p-3 rounded-xl hover:bg-slate-100 transition-all flex items-center justify-between text-xs cursor-pointer group"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={b.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}
                            alt="cover"
                            className="h-9 w-7 rounded object-cover border border-slate-200/90 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-white group-hover:text-blue-400 transition-colors">
                              {b.title}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {b.authors.slice(0, 2).join(', ')} • <span className="text-amber-400">{b.accessionNumber || 'ACC-AUTO'}</span> • {b.availableCopies || 1} on shelf
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-[11px] font-bold"
                        >
                          Select →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loan Period Options & Final Issue Button */}
              <div className="pt-2 border-t border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Loan Period:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setLoanPeriodDays(14)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        loanPeriodDays === 14 ? 'bg-emerald-600 text-white' : 'bg-[#f1f5f9] text-slate-500 hover:text-white'
                      }`}
                    >
                      14 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoanPeriodDays(30)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        loanPeriodDays === 30 ? 'bg-emerald-600 text-white' : 'bg-[#f1f5f9] text-slate-500 hover:text-white'
                      }`}
                    >
                      30 Days (Faculty)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoanPeriodDays(7)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        loanPeriodDays === 7 ? 'bg-emerald-600 text-white' : 'bg-[#f1f5f9] text-slate-500 hover:text-white'
                      }`}
                    >
                      7 Days
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#f1f5f9] border border-slate-200/90 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Calculated Due Date:</span>
                  <strong className="text-emerald-400 text-sm">{customDueDate || calculateDueDate(loanPeriodDays)}</strong>
                </div>

                {/* Big Issue Button */}
                <button
                  type="button"
                  onClick={() => handleExecuteIssue()}
                  disabled={!selectedMember || (!selectedBook && !customAccession)}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Confirm & Issue Book</span>
                </button>
              </div>
            </div>

          </div>

          {/* Quick Handheld Barcode Scanner Box */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-3">
            <h4 className="text-xs font-bold uppercase font-mono text-slate-500 flex items-center space-x-2">
              <QrCode className="h-4 w-4 text-emerald-400" />
              <span>Or Rapid Issue via Barcode Scanner (Single Line)</span>
            </h4>
            <form onSubmit={handleFastScanIssue} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="Scan Member Card (STU-2024-001)..."
                  value={fastScanMemberCode}
                  onChange={e => setFastScanMemberCode(e.target.value)}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="Scan Book Barcode / Accession (ACC-88001)..."
                  value={fastScanBookAccession}
                  onChange={e => setFastScanBookAccession(e.target.value)}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full h-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer transition-all"
                >
                  Quick Issue
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SIMPLE RETURN WORKFLOW */}
      {/* ========================================================================= */}
      {activeTab === 'RETURN' && (
        <div className="space-y-5">
          
          {/* Last Returned Receipt Alert */}
          {lastReturnedReceipt && (
            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-6 w-6 text-blue-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-blue-300 uppercase font-mono">✓ Book Returned & Checked In Successfully!</div>
                  <div className="text-sm font-bold text-white mt-0.5">"{lastReturnedReceipt.bookTitle}" (Accession: {lastReturnedReceipt.accessionNumber})</div>
                  <div className="text-xs text-slate-700 flex flex-wrap gap-x-3 gap-y-1 mt-0.5 font-mono">
                    <span>Borrower: <strong className="text-white">{lastReturnedReceipt.patronName}</strong></span>
                    <span>Return Date: <strong className="text-blue-300">{lastReturnedReceipt.returnDate}</strong></span>
                    <span>Fine Status: <strong className={lastReturnedReceipt.overdueDays > 0 ? 'text-amber-400' : 'text-emerald-400'}>{lastReturnedReceipt.fineStatus}</strong></span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    if (slipModalData) {
                      handleOpenSlip(slipModalData);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-blue-600/30 cursor-pointer transition-all"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLastReturnedReceipt(null)}
                  className="p-1.5 rounded-lg hover:bg-blue-900/40 text-slate-500 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Return Search Box */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase font-mono text-blue-400 flex items-center space-x-2">
                <ArrowDownLeft className="h-4 w-4" />
                <span>Active Loans Awaiting Return ({activeLoans.length})</span>
              </h3>
              <span className="text-xs text-slate-500">
                Click <strong className="text-blue-400">"Return Book"</strong> on any row to immediately check it in.
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by Accession Number (ACC-88002), Barcode, Book Title, or Member Name..."
                value={returnSearchQuery}
                onChange={e => setReturnSearchQuery(e.target.value)}
                className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Active Loans Table with 1-Click Return on Every Row */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-4">
            {filteredReturnLoans.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto opacity-60" />
                <div className="font-bold text-white text-sm">All Loans Clear!</div>
                <p className="text-xs">There are no books currently on loan or matching your search.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/90 text-slate-500 font-mono text-[11px]">
                      <th className="pb-3 font-semibold">Book Title & Accession</th>
                      <th className="pb-3 font-semibold">Borrower Member</th>
                      <th className="pb-3 font-semibold">Issue Date</th>
                      <th className="pb-3 font-semibold">Due Date</th>
                      <th className="pb-3 font-semibold">Status & Fine</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                    {filteredReturnLoans.map(tx => {
                      const overdueDays = getOverdueDays(tx.dueDate);
                      const isLate = tx.status === 'OVERDUE' || overdueDays > 0;
                      const finePerDay = settings?.finePerDay || 50;
                      const fineAmount = overdueDays * finePerDay;

                      return (
                        <tr key={tx.id} className="hover:bg-slate-100/60 transition-colors">
                          {/* Book Title */}
                          <td className="py-3.5 pr-3">
                            <div className="font-bold text-white text-xs">{tx.bookTitle}</div>
                            <div className="text-[11px] font-mono text-amber-400 mt-0.5">
                              {tx.accessionNumber || tx.copyBarcode || 'ACC-88002'}
                            </div>
                          </td>

                          {/* Member */}
                          <td className="py-3.5 pr-3">
                            <div className="font-medium text-white">{tx.memberName}</div>
                            <div className="text-[11px] font-mono text-slate-500">
                              {tx.memberCode || tx.memberId}
                            </div>
                          </td>

                          {/* Issue Date */}
                          <td className="py-3.5 pr-3 font-mono text-slate-700">
                            {tx.issueDate}
                          </td>

                          {/* Due Date */}
                          <td className="py-3.5 pr-3 font-mono">
                            <span className={isLate ? 'text-red-400 font-bold' : 'text-slate-800'}>
                              {tx.dueDate}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 pr-3">
                            {isLate ? (
                              <div className="space-y-0.5">
                                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold font-mono inline-block">
                                  OVERDUE ({overdueDays}d late)
                                </span>
                                <div className="text-[11px] text-amber-400 font-mono font-bold">
                                  Fine: {fineAmount} PKR
                                </div>
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono inline-block">
                                ON TIME
                              </span>
                            )}
                          </td>

                          {/* 1-Click Return Action Button */}
                          <td className="py-3.5 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const slipData: SlipReceiptData = {
                                    type: 'ISSUE',
                                    receiptNumber: `ISS-${tx.id.slice(-6)}`,
                                    libraryName: settings?.libraryName || 'CENTRAL ACADEMIC LIBRARY',
                                    institutionName: settings?.institutionName || 'INSTITUTION OF HIGHER LEARNING',
                                    libraryLocation: settings?.libraryLocation || '',
                                    libraryPhone: settings?.libraryMobileNo || settings?.libraryOfficeNo || '',
                                    bookTitle: tx.bookTitle,
                                    accessionNumber: tx.copyBarcode || tx.accessionNumber || 'ACC-LOAN',
                                    copyBarcode: tx.copyBarcode || '',
                                    patronName: tx.memberName,
                                    memberCode: tx.memberCode || tx.memberId,
                                    issueDate: tx.issueDate,
                                    dueDate: tx.dueDate,
                                    librarianName: currentUser?.name || 'Chief Librarian',
                                    finePerDay: settings?.finePerDay || 50
                                  };
                                  handleOpenSlip(slipData);
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#27272a] border border-[#3f3f46] text-slate-700 hover:text-white cursor-pointer"
                                title="Print Loan Slip for this issue"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>

                              {isLate && (
                                <button
                                  type="button"
                                  onClick={() => handleExecuteReturn(tx, true)}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-amber-300 text-[11px] font-semibold cursor-pointer"
                                  title="Return book and waive overdue fine"
                                >
                                  Waive & Return
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleExecuteReturn(tx, false)}
                                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-blue-600/20 cursor-pointer transition-all"
                              >
                                <ArrowDownLeft className="h-3.5 w-3.5" />
                                <span>Return Book</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CIRCULATION HISTORY & LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'HISTORY' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-xs font-bold uppercase font-mono text-slate-700 flex items-center space-x-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span>Complete Circulation History Log</span>
            </h3>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 bg-[#f1f5f9] p-1 rounded-xl border border-slate-200/90">
              {(['ALL', 'ISSUED', 'RETURNED', 'OVERDUE'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold cursor-pointer transition-all ${
                    historyFilter === f ? 'bg-[#27272a] text-white' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search history by title, borrower, accession..."
              value={historySearchQuery}
              onChange={e => setHistorySearchQuery(e.target.value)}
              className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/90 text-slate-500 font-mono text-[11px]">
                  <th className="pb-3">Transaction</th>
                  <th className="pb-3">Book Title</th>
                  <th className="pb-3">Borrower</th>
                  <th className="pb-3">Issue Date</th>
                  <th className="pb-3">Due / Return Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {filteredHistory.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-100/50">
                    <td className="py-3 font-mono text-slate-500 text-[11px]">{tx.transactionNumber || tx.id}</td>
                    <td className="py-3 font-bold text-white">{tx.bookTitle}</td>
                    <td className="py-3 font-medium text-slate-700">{tx.memberName} ({tx.memberCode || tx.memberId})</td>
                    <td className="py-3 font-mono text-slate-500">{tx.issueDate}</td>
                    <td className="py-3 font-mono text-slate-700">
                      {tx.status === 'RETURNED' ? `Returned: ${tx.returnDate || 'Yes'}` : `Due: ${tx.dueDate}`}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          tx.status === 'RETURNED'
                            ? 'bg-blue-500/20 text-blue-400'
                            : tx.status === 'OVERDUE'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          const slipData: SlipReceiptData = {
                            type: tx.status === 'RETURNED' ? 'RETURN' : 'ISSUE',
                            receiptNumber: `${tx.status === 'RETURNED' ? 'RET' : 'ISS'}-${tx.id.slice(-6)}`,
                            libraryName: settings?.libraryName || 'CENTRAL ACADEMIC LIBRARY',
                            institutionName: settings?.institutionName || 'INSTITUTION OF HIGHER LEARNING',
                            libraryLocation: settings?.libraryLocation || '',
                            libraryPhone: settings?.libraryMobileNo || settings?.libraryOfficeNo || '',
                            bookTitle: tx.bookTitle,
                            accessionNumber: tx.copyBarcode || tx.accessionNumber || 'ACC',
                            copyBarcode: tx.copyBarcode || '',
                            patronName: tx.memberName,
                            memberCode: tx.memberCode || tx.memberId,
                            issueDate: tx.issueDate,
                            dueDate: tx.dueDate,
                            returnDate: tx.returnDate,
                            fineStatus: tx.status === 'RETURNED' ? 'Completed' : (tx.status === 'OVERDUE' ? 'Overdue Fine Due' : 'Active Loan'),
                            librarianName: currentUser?.name || 'Chief Librarian'
                          };
                          handleOpenSlip(slipData);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#27272a] border border-[#3f3f46] text-slate-700 hover:text-white text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                        title="Print receipt slip"
                      >
                        <Printer className="h-3 w-3" />
                        <span>Slip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. QR SCANNER & KIOSK */}
      {/* ========================================================================= */}
      {activeTab === 'QR_KIOSK' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90">
          <MemberQrScanner
            users={users}
            books={books}
            transactions={transactions}
            onIssueBook={onIssueBook}
            onReturnBook={onReturnBook}
          />
        </div>
      )}

      {/* Circulation Slip Preview & Print Modal */}
      <CirculationSlipModal
        isOpen={isSlipModalOpen}
        onClose={() => setIsSlipModalOpen(false)}
        data={slipModalData}
      />
    </div>
  );
};
