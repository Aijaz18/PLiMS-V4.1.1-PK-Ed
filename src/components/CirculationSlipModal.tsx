import React, { useState } from 'react';
import {
  Printer,
  Download,
  Copy,
  Check,
  X,
  BookOpen,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { SlipReceiptData, printSlipInNewWindow, downloadSlipAsText, generateSlipText } from '../utils/printSlip';

interface CirculationSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SlipReceiptData | null;
}

export const CirculationSlipModal: React.FC<CirculationSlipModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  const isIssue = data.type === 'ISSUE';

  const handlePrint = () => {
    const success = printSlipInNewWindow(data);
    if (!success) {
      // Fallback to local window print if popup was blocked
      window.print();
    }
  };

  const handleCopy = () => {
    const text = generateSlipText(data);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadSlipAsText(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xl space-y-5 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl border ${isIssue ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isIssue ? 'Official Book Issue Slip (Borrow Receipt)' : 'Official Book Return Receipt (Check-In)'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">Receipt No: {data.receiptNumber}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-800 text-slate-500 hover:text-white cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Card Preview */}
        <div className="p-5 rounded-xl bg-white text-zinc-900 border-2 border-zinc-300 font-mono text-xs shadow-inner space-y-3">
          {/* Institutional Branding */}
          <div className="text-center border-b-2 border-dashed border-zinc-400 pb-3">
            <div className="font-bold text-sm tracking-wide text-zinc-950 uppercase">
              {data.libraryName || 'CENTRAL ACADEMIC LIBRARY'}
            </div>
            <div className="text-[11px] text-zinc-600 font-sans">
              {data.institutionName || 'INSTITUTION OF HIGHER LEARNING'}
            </div>
            {data.libraryLocation && (
              <div className="text-[10px] text-slate-400">{data.libraryLocation}</div>
            )}
            <div className="mt-2 inline-block px-2.5 py-0.5 rounded bg-white text-white font-bold text-[10px] uppercase">
              {isIssue ? '*** BOOK ISSUE SLIP ***' : '*** BOOK RETURN RECEIPT ***'}
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-zinc-300 pb-2">
            <div className="flex justify-between">
              <span className="text-zinc-600">Receipt No:</span>
              <span className="font-bold">{data.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Date & Time:</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Librarian:</span>
              <span className="font-bold">{data.librarianName || 'Chief Librarian'}</span>
            </div>
          </div>

          {/* Borrower */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-zinc-300 pb-2">
            <div className="font-bold text-zinc-900 uppercase text-[10px]">Borrower Information</div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Name:</span>
              <span className="font-bold text-zinc-900">{data.patronName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Member ID / Roll:</span>
              <span className="font-bold text-emerald-800">{data.memberCode}</span>
            </div>
            {data.patronRole && (
              <div className="flex justify-between">
                <span className="text-zinc-600">Role / Status:</span>
                <span>{data.patronRole}</span>
              </div>
            )}
            {data.patronDepartment && (
              <div className="flex justify-between">
                <span className="text-zinc-600">Department:</span>
                <span>{data.patronDepartment}</span>
              </div>
            )}
          </div>

          {/* Book Details */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-zinc-300 pb-2">
            <div className="font-bold text-zinc-900 uppercase text-[10px]">Book Particulars</div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Title:</span>
              <span className="font-bold text-zinc-950 text-right max-w-[65%] truncate">{data.bookTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Accession No:</span>
              <span className="font-bold text-amber-700">{data.accessionNumber}</span>
            </div>
            {data.copyBarcode && (
              <div className="flex justify-between">
                <span className="text-zinc-600">Barcode:</span>
                <span>{data.copyBarcode}</span>
              </div>
            )}
            {data.callNumber && (
              <div className="flex justify-between">
                <span className="text-zinc-600">Call No:</span>
                <span>{data.callNumber}</span>
              </div>
            )}
          </div>

          {/* Status & Due Date */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-600">Issue Date:</span>
              <span className="font-bold">{data.issueDate}</span>
            </div>

            {isIssue && data.dueDate && (
              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-300 text-center">
                <div className="text-[10px] text-emerald-800 font-bold uppercase">Return Due Date:</div>
                <div className="text-sm font-bold text-emerald-950">{data.dueDate}</div>
              </div>
            )}

            {!isIssue && data.returnDate && (
              <div className="p-2.5 rounded bg-blue-50 border border-blue-300 text-center space-y-0.5">
                <div className="text-[10px] text-blue-800 font-bold uppercase">Return Date:</div>
                <div className="text-sm font-bold text-blue-950">{data.returnDate}</div>
                <div className="text-[11px] font-bold text-zinc-800">Fine Status: {data.fineStatus || 'Cleared'}</div>
              </div>
            )}
          </div>

          {/* Barcode Mock */}
          <div className="text-center pt-2 font-mono text-zinc-900 tracking-widest text-xs font-bold border-t border-dashed border-zinc-300">
            |||| | ||| ||||| || |||| |<br />
            <span className="text-[10px] tracking-normal font-normal text-zinc-600">{data.accessionNumber}</span>
          </div>

          {/* Signature Line */}
          <div className="pt-4 text-center">
            <div className="border-t border-zinc-900 w-44 mx-auto pt-1 text-[10px] text-zinc-700">
              Authorized Librarian Signature
            </div>
          </div>

          <div className="text-[9px] text-slate-400 text-center pt-1 font-sans">
            {isIssue
              ? `Please retain this receipt. Overdue fine is PKR ${data.finePerDay || 50}/day.`
              : 'Book returned into active library catalog inventory.'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>Print Slip (Dialog)</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="w-full py-2.5 px-3 rounded-xl bg-[#18181b] hover:bg-[#27272a] border border-slate-200/90 text-zinc-200 font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer transition-all"
          >
            <Download className="h-4 w-4 text-blue-400" />
            <span>Download .TXT</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full py-2.5 px-3 rounded-xl bg-[#18181b] hover:bg-[#27272a] border border-slate-200/90 text-zinc-200 font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer transition-all"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-amber-400" />
                <span>Copy Receipt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
