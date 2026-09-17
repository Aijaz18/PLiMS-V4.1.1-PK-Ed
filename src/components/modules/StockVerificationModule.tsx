import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Barcode,
  RotateCcw,
  Download,
  ShieldCheck,
  Building2,
  Layers,
  Sparkles,
  Clock,
  XCircle,
  Check
} from 'lucide-react';
import { BookRecord } from '../../types/alims';

interface StockVerificationModuleProps {
  books?: BookRecord[];
}

interface ScannedRecord {
  id: string;
  accessionNo: string;
  bookTitle: string;
  callNumber: string;
  expectedShelf: string;
  scannedAt: string;
  status: 'VERIFIED' | 'MISPLACED' | 'EXTRA_COPY';
}

export const StockVerificationModule: React.FC<StockVerificationModuleProps> = ({ books = [] }) => {
  const [isAuditActive, setIsAuditActive] = useState<boolean>(false);
  const [auditTitle, setAuditTitle] = useState<string>('2026 Annual Central Library Inventory Audit');
  const [targetDepartment, setTargetDepartment] = useState<string>('Computer Science');
  const [auditMethod, setAuditMethod] = useState<'BARCODE' | 'RFID' | 'MANUAL'>('BARCODE');
  
  // Active Scan Input
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [scannedLog, setScannedLog] = useState<ScannedRecord[]>([]);
  const [auditStartTime, setAuditStartTime] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Timer effect for active audit
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isAuditActive) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuditActive]);

  // Start Audit Session Handler
  const handleStartAudit = () => {
    setIsAuditActive(true);
    setAuditStartTime(new Date().toLocaleTimeString());
    setElapsedSeconds(0);
  };

  // Stop / Finalize Audit Handler
  const handleFinalizeAudit = () => {
    if (confirm('Are you sure you want to finalize and reconcile this Stock Verification Audit?')) {
      setIsAuditActive(false);
      alert(`Audit Finalized!\nVerified Copies: ${verifiedCount}\nMissing Copies: ${missingCount}\nMisplaced Copies: ${misplacedCount}`);
    }
  };

  // Process Accession / Barcode Scan
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = scannedBarcode.trim();
    if (!code) return;

    // Check if book exists in catalog
    const matchedBook = books.find(b =>
      b.isbn.toLowerCase() === code.toLowerCase() ||
      b.id.toLowerCase() === code.toLowerCase() ||
      b.callNumber.toLowerCase().includes(code.toLowerCase()) ||
      b.title.toLowerCase().includes(code.toLowerCase())
    );

    const isCorrectDept = matchedBook ? matchedBook.department === targetDepartment : true;
    const status: 'VERIFIED' | 'MISPLACED' | 'EXTRA_COPY' = matchedBook
      ? (isCorrectDept ? 'VERIFIED' : 'MISPLACED')
      : 'EXTRA_COPY';

    const newScan: ScannedRecord = {
      id: `scan_${Date.now()}`,
      accessionNo: code,
      bookTitle: matchedBook ? matchedBook.title : 'Unmapped Copy / New Accession',
      callNumber: matchedBook ? matchedBook.callNumber : 'UNCLASSIFIED',
      expectedShelf: matchedBook ? matchedBook.shelfLocation : 'Stack CS-01',
      scannedAt: new Date().toLocaleTimeString(),
      status
    };

    setScannedLog(prev => [newScan, ...prev]);
    setScannedBarcode('');
  };

  // Total Expected Copies in Department
  const expectedDepartmentBooks = books.filter(b => b.department === targetDepartment || targetDepartment === 'ALL');
  const totalExpectedCount = expectedDepartmentBooks.reduce((sum, b) => sum + (b.totalCopies || 1), 0) || 120;

  const verifiedCount = scannedLog.filter(s => s.status === 'VERIFIED').length;
  const misplacedCount = scannedLog.filter(s => s.status === 'MISPLACED').length;
  const extraCount = scannedLog.filter(s => s.status === 'EXTRA_COPY').length;
  const missingCount = Math.max(0, totalExpectedCount - verifiedCount);

  // Format Elapsed Time
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90">
        <div>
          <div className="flex items-center space-x-2">
            <FolderKanban className="h-6 w-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-900">RFID & Barcode Stock Verification Engine</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Physical inventory reconciliation, misplaced book tracking, and missing copy audit desk
          </p>
        </div>

        {/* Start Stock Verification Button */}
        {!isAuditActive ? (
          <button
            type="button"
            onClick={handleStartAudit}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-600/25 cursor-pointer transition-all scale-105"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>Start Stock Verification Audit</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsAuditActive(false)}
              className="px-3.5 py-2 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Pause className="h-3.5 w-3.5" />
              <span>Pause Audit</span>
            </button>

            <button
              type="button"
              onClick={handleFinalizeAudit}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Finalize & Reconcile Audit</span>
            </button>
          </div>
        )}
      </div>

      {/* Active Audit Session Banner */}
      {isAuditActive && (
        <div className="p-5 rounded-2xl border border-emerald-500/50 bg-emerald-500/10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h3 className="text-sm font-bold text-emerald-300">STOCK VERIFICATION AUDIT IN PROGRESS</h3>
            </div>

            <div className="flex items-center space-x-4 text-xs font-mono text-emerald-200">
              <div className="flex items-center space-x-1">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                <span>Elapsed: {formatTime(elapsedSeconds)}</span>
              </div>
              <div>Started At: {auditStartTime}</div>
            </div>
          </div>

          {/* Quick Barcode / Accession Scanner Input */}
          <form onSubmit={handleScanSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
              <input
                type="text"
                autoFocus
                placeholder="Scan Accession Barcode or RFID Tag (e.g. 978-0132354165 or BAR88001)..."
                value={scannedBarcode}
                onChange={(e) => setScannedBarcode(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f1f5f9] border-2 border-emerald-500 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md"
            >
              Verify Copy
            </button>
          </form>
        </div>
      )}

      {/* Audit Target Config & Verification Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-1">
          <div className="text-[10px] font-mono font-bold uppercase text-slate-500 flex items-center justify-between">
            <span>Verified Copies</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">{verifiedCount}</div>
          <div className="text-[10px] text-slate-500">Present on active shelf</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-1">
          <div className="text-[10px] font-mono font-bold uppercase text-slate-500 flex items-center justify-between">
            <span>Missing Copies</span>
            <XCircle className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-extrabold text-red-400 font-mono">{missingCount}</div>
          <div className="text-[10px] text-slate-500">In catalog but unverified</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-1">
          <div className="text-[10px] font-mono font-bold uppercase text-slate-500 flex items-center justify-between">
            <span>Misplaced Copies</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">{misplacedCount}</div>
          <div className="text-[10px] text-slate-500">Scanned on wrong stack</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-1">
          <div className="text-[10px] font-mono font-bold uppercase text-slate-500 flex items-center justify-between">
            <span>Expected Total</span>
            <Layers className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{totalExpectedCount}</div>
          <div className="text-[10px] text-slate-500">Target dept stock count</div>
        </div>
      </div>

      {/* Audit Setup Parameters & Scanned Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Audit Setup Controls */}
        <div className="lg:col-span-4 p-5 rounded-2xl border border-slate-200/90 bg-white space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase text-slate-500 flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Audit Session Parameters</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-500">Audit Title / Reference</label>
              <input
                type="text"
                value={auditTitle}
                disabled={isAuditActive}
                onChange={(e) => setAuditTitle(e.target.value)}
                className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500">Target Department Stack</label>
              <select
                value={targetDepartment}
                disabled={isAuditActive}
                onChange={(e) => setTargetDepartment(e.target.value)}
                className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
              >
                <option value="Computer Science">Computer Science & IT Stack</option>
                <option value="Electrical Engineering">Electrical Engineering Stack</option>
                <option value="Medical & Health Sciences">Medical & Health Sciences</option>
                <option value="Library Science">Library Science Reference</option>
                <option value="ALL">All Library Departments</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500">Audit Scanning Mode</label>
              <select
                value={auditMethod}
                disabled={isAuditActive}
                onChange={(e) => setAuditMethod(e.target.value as any)}
                className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
              >
                <option value="BARCODE">Laser / Image Barcode Scanner</option>
                <option value="RFID">Handheld UHF RFID Wand Reader</option>
                <option value="MANUAL">Manual Accession Sheet Verification</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Audit Scanned Log Table */}
        <div className="lg:col-span-8 p-5 rounded-2xl border border-slate-200/90 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-500 flex items-center space-x-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              <span>Real-Time Audit Verification Log ({scannedLog.length})</span>
            </h3>

            {scannedLog.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const csv = 'Accession,Title,CallNumber,Status,Time\n' + scannedLog.map(s => `"${s.accessionNo}","${s.bookTitle}","${s.callNumber}","${s.status}","${s.scannedAt}"`).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Stock_Audit_${Date.now()}.csv`;
                  a.click();
                }}
                className="text-xs text-emerald-400 hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Audit CSV</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/90">
            <table className="w-full text-left text-xs text-slate-500">
              <thead className="bg-[#f1f5f9] text-slate-900 font-mono border-b border-slate-200/90">
                <tr>
                  <th className="p-3">Accession / Code</th>
                  <th className="p-3">Book Title</th>
                  <th className="p-3">Expected Shelf</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scannedLog.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No scanned items yet. Click <span className="text-emerald-400 font-bold">"Start Stock Verification Audit"</span> and scan accession barcodes to log copy verification.
                    </td>
                  </tr>
                ) : (
                  scannedLog.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-100/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">{item.accessionNo}</td>
                      <td className="p-3 font-medium text-slate-900">{item.bookTitle}</td>
                      <td className="p-3 font-mono text-[11px]">{item.expectedShelf}</td>
                      <td className="p-3 text-[11px] font-mono">{item.scannedAt}</td>
                      <td className="p-3">
                        {item.status === 'VERIFIED' && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                            ✓ VERIFIED
                          </span>
                        )}
                        {item.status === 'MISPLACED' && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                            ⚠ MISPLACED
                          </span>
                        )}
                        {item.status === 'EXTRA_COPY' && (
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold">
                            + EXTRA COPY
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
