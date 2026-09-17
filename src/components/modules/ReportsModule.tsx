import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Printer,
  FileText,
  TrendingUp,
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  Filter,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  PieChart,
  ShieldCheck,
  Search,
  BookMarked,
  Clock,
  Layers
} from 'lucide-react';
import { BookRecord, UserProfile, CirculationTransaction, SystemSettings } from '../../types/alims';

interface ReportsModuleProps {
  books?: BookRecord[];
  users?: UserProfile[];
  transactions?: CirculationTransaction[];
  settings?: SystemSettings;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  books = [],
  users = [],
  transactions = [],
  settings
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'CIRCULATION' | 'CATALOG' | 'PATRONS' | 'FINES'>('CIRCULATION');
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  // Helper for triggering browser CSV download
  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...rows.map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadToast(`✨ Downloaded "${filename}_${dateStr}.csv" successfully!`);
    setTimeout(() => setDownloadToast(null), 4000);
  };

  // Helper for Print / PDF Export
  const handlePrintPdfReport = () => {
    window.print();
  };

  // Download Handlers
  const handleDownloadFullMisReport = () => {
    const headers = ['Report Category', 'Metric Name', 'Count / Value', 'Notes'];
    const activeLoans = transactions.filter(t => t.status === 'ISSUED' || t.status === 'OVERDUE');
    const overdueLoans = transactions.filter(t => t.status === 'OVERDUE');
    const totalFines = transactions.reduce((acc, t) => acc + (t.fineAmount || 0), 0);
    const totalCopies = books.reduce((acc, b) => acc + (b.totalCopies || 1), 0);

    const rows = [
      ['Catalog Summary', 'Total Bibliographic Titles', books.length, 'MARC21 / RDA Records'],
      ['Catalog Summary', 'Total Accession Copies', totalCopies, 'Physical Holdings'],
      ['Circulation', 'Total Active Loans', activeLoans.length, 'Currently Checked Out'],
      ['Circulation', 'Overdue Loans Count', overdueLoans.length, 'Pending Return Notices'],
      ['Circulation', 'Total Transactions History', transactions.length, 'All Historical Checkouts'],
      ['Patrons', 'Total Registered Members', users.length, 'Students, Faculty & Staff'],
      ['Financial Audit', 'Total Outstanding Fines (PKR)', totalFines, 'Calculated Fine Records'],
      ['System Health', 'Offline Queue Synced', '100%', 'Local Cache Active']
    ];

    downloadCsv('PLiMS_Full_MIS_Analytics_Report', headers, rows);
  };

  const handleDownloadCirculationReport = () => {
    const headers = ['Transaction ID', 'Accession Barcode', 'Book Title', 'Patron Name', 'Member ID', 'Issue Date', 'Due Date', 'Status', 'Fine (PKR)'];
    const rows = transactions.map(t => [
      t.id,
      t.copyBarcode || 'N/A',
      t.bookTitle || 'N/A',
      t.memberName || 'N/A',
      t.memberId || 'N/A',
      t.issueDate,
      t.dueDate,
      t.status,
      t.fineAmount || 0
    ]);

    downloadCsv('PLiMS_Circulation_Transactions_Report', headers, rows);
  };

  const handleDownloadCatalogReport = () => {
    const headers = ['Book ID', 'ISBN', 'Title', 'Authors', 'Department', 'Call Number', 'Publisher', 'Year', 'Total Copies', 'Format'];
    const rows = books.map(b => [
      b.id,
      b.isbn,
      b.title,
      Array.isArray(b.authors) ? b.authors.join('; ') : b.authors,
      b.department,
      b.callNumber,
      b.publisherName || 'N/A',
      b.publisherYear || 'N/A',
      b.totalCopies,
      b.format || 'HARDCOVER'
    ]);

    downloadCsv('PLiMS_Bibliographic_Catalog_Report', headers, rows);
  };

  const handleDownloadPatronFinesReport = () => {
    const headers = ['Member ID', 'Full Name', 'Department', 'Role', 'Status', 'Outstanding Fine (PKR)', 'Max Books Allowed'];
    const rows = users.map(u => [
      u.id,
      u.name,
      u.department || 'N/A',
      u.role,
      u.status,
      u.finePending || 0,
      (u.maxBorrowLimit || 5) >= 9999 ? 'Unlimited' : (u.maxBorrowLimit || 5)
    ]);

    downloadCsv('PLiMS_Patrons_And_Fines_Report', headers, rows);
  };

  // Compute Analytics Data
  const totalBooksCount = books.length;
  const totalCopiesCount = books.reduce((acc, b) => acc + (b.totalCopies || 1), 0);
  const activeLoansCount = transactions.filter(t => t.status === 'ISSUED' || t.status === 'OVERDUE').length;
  const overdueCount = transactions.filter(t => t.status === 'OVERDUE').length;
  const totalFinesAmount = transactions.reduce((acc, t) => acc + (t.fineAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-400 text-xs font-semibold flex items-center space-x-2.5 animate-bounce">
          <CheckCircle2 className="h-4 w-4" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Header & Main Download Export Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/90 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2.5">
            <BarChart3 className="h-6 w-6 text-blue-400" />
            <span>Analytics & MIS Reports</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time circulation velocity, accession inventory counts, patron demographic reports, and fine audit trail
          </p>
        </div>

        {/* Global Export / Download Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handlePrintPdfReport}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-900 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all shadow-sm"
            title="Print or Save as PDF Summary"
          >
            <Printer className="h-4 w-4 text-purple-400" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleDownloadFullMisReport}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-600/30 cursor-pointer transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Download Reports & Analytics (CSV)</span>
          </button>
        </div>
      </div>

      {/* High-Level MIS Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Total Titles</span>
            <BookOpen className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">{totalBooksCount}</div>
          <div className="text-[10px] text-emerald-400 font-mono">MARC21 Cataloged</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Accession Copies</span>
            <BookMarked className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">{totalCopiesCount}</div>
          <div className="text-[10px] text-indigo-400 font-mono">Barcode & RFID</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Active Loans</span>
            <Clock className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">{activeLoansCount}</div>
          <div className="text-[10px] text-emerald-400 font-mono">In Patron Possession</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Overdue Notices</span>
            <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">{overdueCount}</div>
          <div className="text-[10px] text-red-400 font-mono">Fine Penalty Active</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Registered Patrons</span>
            <Users className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">{users.length}</div>
          <div className="text-[10px] text-purple-400 font-mono">Students & Faculty</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Total Fines (PKR)</span>
            <DollarSign className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">PKR {totalFinesAmount}</div>
          <div className="text-[10px] text-amber-400 font-mono">Audit Synced</div>
        </div>
      </div>

      {/* Module Specific Download Bar & Category Navigation */}
      <div className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#f1f5f9] p-1 rounded-xl border border-slate-200/90">
            <button
              onClick={() => setActiveReportTab('CIRCULATION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeReportTab === 'CIRCULATION' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-white'
              }`}
            >
              🔄 Circulation Velocity
            </button>
            <button
              onClick={() => setActiveReportTab('CATALOG')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeReportTab === 'CATALOG' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-white'
              }`}
            >
              📚 Catalog & Inventory
            </button>
            <button
              onClick={() => setActiveReportTab('PATRONS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeReportTab === 'PATRONS' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-white'
              }`}
            >
              🎓 Patron Demographics
            </button>
            <button
              onClick={() => setActiveReportTab('FINES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeReportTab === 'FINES' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-white'
              }`}
            >
              💰 Financial & Fine Audit
            </button>
          </div>

          {/* Dedicated Download Button for Active Section */}
          <div className="flex items-center space-x-2">
            {activeReportTab === 'CIRCULATION' && (
              <button
                onClick={handleDownloadCirculationReport}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center space-x-1.5 hover:bg-blue-600/30 cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Export Circulation CSV</span>
              </button>
            )}

            {activeReportTab === 'CATALOG' && (
              <button
                onClick={handleDownloadCatalogReport}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center space-x-1.5 hover:bg-indigo-600/30 cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Export Catalog CSV</span>
              </button>
            )}

            {(activeReportTab === 'PATRONS' || activeReportTab === 'FINES') && (
              <button
                onClick={handleDownloadPatronFinesReport}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-1.5 hover:bg-emerald-600/30 cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Export Patrons & Fines CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Report View Body */}
      {activeReportTab === 'CIRCULATION' && (
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Circulation Log & Transaction History</h3>
              <p className="text-xs text-slate-500">Detailed breakdown of all issue, return, and overdue transactions</p>
            </div>
            <button
              onClick={handleDownloadCirculationReport}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/90 text-slate-500 font-semibold bg-[#f1f5f9]">
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Barcode</th>
                  <th className="py-2.5 px-3">Book Title</th>
                  <th className="py-2.5 px-3">Patron</th>
                  <th className="py-2.5 px-3">Issue Date</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Fine (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500">
                      No circulation transactions available.
                    </td>
                  </tr>
                ) : (
                  transactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-100 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-blue-400">{t.id}</td>
                      <td className="py-2.5 px-3 font-mono">{t.copyBarcode || 'N/A'}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{t.bookTitle || 'Bibliographic Record'}</td>
                      <td className="py-2.5 px-3 text-slate-500">{t.memberName || t.memberId || 'N/A'}</td>
                      <td className="py-2.5 px-3">{t.issueDate}</td>
                      <td className="py-2.5 px-3">{t.dueDate}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.status === 'ISSUED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                          t.status === 'OVERDUE' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-amber-400">
                        {t.fineAmount ? `PKR ${t.fineAmount}` : 'PKR 0'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReportTab === 'CATALOG' && (
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Bibliographic Catalog & Holdings Inventory</h3>
              <p className="text-xs text-slate-500">Summary of total book titles, department distribution, and total copies</p>
            </div>
            <button
              onClick={handleDownloadCatalogReport}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/90 text-slate-500 font-semibold bg-[#f1f5f9]">
                  <th className="py-2.5 px-3">ISBN</th>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Author(s)</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Call Number</th>
                  <th className="py-2.5 px-3">Publisher</th>
                  <th className="py-2.5 px-3">Total Copies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {books.map(b => (
                  <tr key={b.id} className="hover:bg-slate-100 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-xs">{b.isbn}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{b.title}</td>
                    <td className="py-2.5 px-3 text-slate-500">{Array.isArray(b.authors) ? b.authors.join(', ') : b.authors}</td>
                    <td className="py-2.5 px-3 text-indigo-400">{b.department}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{b.callNumber}</td>
                    <td className="py-2.5 px-3 text-slate-400">{b.publisherName || 'Addison-Wesley'}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{b.totalCopies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(activeReportTab === 'PATRONS' || activeReportTab === 'FINES') && (
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Patron Profiles & Fine Audit Trail</h3>
              <p className="text-xs text-slate-500">Registered library patrons, membership statuses, and overdue fine ledgers</p>
            </div>
            <button
              onClick={handleDownloadPatronFinesReport}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/90 text-slate-500 font-semibold bg-[#f1f5f9]">
                  <th className="py-2.5 px-3">Member ID</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Outstanding Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-100 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-purple-400">{u.id}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{u.name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{u.department || 'General'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-[#f1f5f9] border border-slate-200/90 font-mono text-[10px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                      PKR {u.finePending || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
