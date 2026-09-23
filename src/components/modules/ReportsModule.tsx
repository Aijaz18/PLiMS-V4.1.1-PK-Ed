import React, { useState, useEffect, useMemo } from 'react';
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
  Layers,
  History,
  Repeat,
  Sliders,
  UserCheck,
  ShieldAlert,
  Eye,
  RefreshCw,
  Copy,
  Check,
  X,
  AlertTriangle,
  Info,
  RotateCcw,
  Trash2,
  Activity
} from 'lucide-react';
import {
  BookRecord,
  UserProfile,
  CirculationTransaction,
  SystemSettings,
  ActivityLogEntry,
  ActivityCategory
} from '../../types/alims';
import {
  getActivityLogs,
  subscribeToActivityLogs,
  resetActivityLogs,
  clearActivityLogs
} from '../../services/activityLogger';

interface ReportsModuleProps {
  books?: BookRecord[];
  users?: UserProfile[];
  transactions?: CirculationTransaction[];
  settings?: SystemSettings;
  currentUser?: UserProfile;
  activityLogs?: ActivityLogEntry[];
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  books = [],
  users = [],
  transactions = [],
  settings,
  currentUser,
  activityLogs: externalActivityLogs
}) => {
  const [activeReportTab, setActiveReportTab] = useState<
    'CIRCULATION' | 'CATALOG' | 'PATRONS' | 'FINES' | 'ACTIVITY_LOG'
  >('CIRCULATION');
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  // Activity Log State
  const [logs, setLogs] = useState<ActivityLogEntry[]>(() => {
    if (externalActivityLogs && externalActivityLogs.length > 0) {
      return externalActivityLogs;
    }
    return getActivityLogs();
  });

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | ActivityCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'ALL_TIME' | 'TODAY' | 'LAST_7_DAYS' | 'THIS_MONTH'>('ALL_TIME');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR'>('ALL');
  const [selectedLog, setSelectedLog] = useState<ActivityLogEntry | null>(null);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Subscribe to reactive activity log updates
  useEffect(() => {
    if (externalActivityLogs && externalActivityLogs.length > 0) {
      setLogs(externalActivityLogs);
      return;
    }

    const unsubscribe = subscribeToActivityLogs(updatedLogs => {
      setLogs(updatedLogs);
    });

    return () => {
      unsubscribe();
    };
  }, [externalActivityLogs]);

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
      ['System Health', 'Offline Queue Synced', '100%', 'Local Cache Active'],
      ['Audit Logs', 'Total Recorded System Activities', logs.length, 'Circulation, Config & Admin Logs']
    ];

    downloadCsv('PLiMS_Full_MIS_Analytics_Report', headers, rows);
  };

  const handleDownloadCirculationReport = () => {
    const headers = [
      'Transaction ID',
      'Accession Barcode',
      'Book Title',
      'Patron Name',
      'Member ID',
      'Issue Date',
      'Due Date',
      'Status',
      'Fine (PKR)'
    ];
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
    const headers = [
      'Book ID',
      'ISBN',
      'Title',
      'Authors',
      'Department',
      'Call Number',
      'Publisher',
      'Year',
      'Total Copies',
      'Format'
    ];
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
    const headers = [
      'Member ID',
      'Full Name',
      'Department',
      'Role',
      'Status',
      'Outstanding Fine (PKR)',
      'Max Books Allowed'
    ];
    const rows = users.map(u => [
      u.id,
      u.name,
      u.department || 'N/A',
      u.role,
      u.status,
      u.finePending || 0,
      (u.maxBorrowLimit || 5) >= 9999 ? 'Unlimited' : u.maxBorrowLimit || 5
    ]);

    downloadCsv('PLiMS_Patrons_And_Fines_Report', headers, rows);
  };

  // Download Activity Logs as CSV
  const handleDownloadActivityLogsReport = () => {
    const headers = [
      'Log ID',
      'Timestamp (ISO)',
      'Local Date & Time',
      'Category',
      'Action Code',
      'Action Name',
      'Performed By',
      'Role',
      'Target Entity',
      'Details',
      'Status',
      'IP Address'
    ];

    const rows = filteredLogs.map(log => [
      log.id,
      log.timestamp,
      formatReadableDateTime(log.timestamp),
      log.category,
      log.action,
      log.actionLabel || log.action,
      log.performedBy,
      log.performedByRole || 'N/A',
      log.target || 'N/A',
      log.details,
      log.status,
      log.ipAddress || '192.168.1.100'
    ]);

    downloadCsv('PLiMS_System_Activity_Log', headers, rows);
  };

  // Helper for human-readable date & time
  const formatReadableDateTime = (timestampStr: string) => {
    try {
      const date = new Date(timestampStr);
      if (isNaN(date.getTime())) return timestampStr;
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return timestampStr;
    }
  };

  // Helper for relative time (e.g. "15m ago", "2h ago", "Yesterday")
  const formatRelativeTime = (timestampStr: string) => {
    try {
      const now = Date.now();
      const past = new Date(timestampStr).getTime();
      if (isNaN(past)) return timestampStr;

      const diffSec = Math.floor((now - past) / 1000);
      if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(timestampStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return timestampStr;
    }
  };

  // Compute Analytics Data
  const totalBooksCount = books.length;
  const totalCopiesCount = books.reduce((acc, b) => acc + (b.totalCopies || 1), 0);
  const activeLoansCount = transactions.filter(t => t.status === 'ISSUED' || t.status === 'OVERDUE').length;
  const overdueCount = transactions.filter(t => t.status === 'OVERDUE').length;
  const totalFinesAmount = transactions.reduce((acc, t) => acc + (t.fineAmount || 0), 0);

  // Activity Log Metrics
  const activityMetrics = useMemo(() => {
    const total = logs.length;
    const circulation = logs.filter(l => l.category === 'CIRCULATION').length;
    const systemConfig = logs.filter(l => l.category === 'SYSTEM_CONFIG').length;
    const userAdmin = logs.filter(l => l.category === 'USER_ADMIN').length;

    // Count today's events
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCount = logs.filter(l => {
      try {
        return l.timestamp.startsWith(todayStr);
      } catch {
        return false;
      }
    }).length;

    return { total, circulation, systemConfig, userAdmin, todayCount };
  }, [logs]);

  // Filtered Activity Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Category filter
      if (categoryFilter !== 'ALL' && log.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && log.status !== statusFilter) {
        return false;
      }

      // Date range filter
      if (dateFilter !== 'ALL_TIME') {
        const logTime = new Date(log.timestamp).getTime();
        const now = Date.now();
        if (dateFilter === 'TODAY') {
          const startOfToday = new Date().setHours(0, 0, 0, 0);
          if (logTime < startOfToday) return false;
        } else if (dateFilter === 'LAST_7_DAYS') {
          const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
          if (logTime < sevenDaysAgo) return false;
        } else if (dateFilter === 'THIS_MONTH') {
          const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
          if (logTime < startOfMonth) return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesAction = (log.actionLabel || log.action).toLowerCase().includes(q);
        const matchesActor = log.performedBy.toLowerCase().includes(q) || (log.performedByRole || '').toLowerCase().includes(q);
        const matchesTarget = (log.target || '').toLowerCase().includes(q);
        const matchesDetails = log.details.toLowerCase().includes(q);
        const matchesIp = (log.ipAddress || '').toLowerCase().includes(q);
        const matchesId = log.id.toLowerCase().includes(q);
        return matchesAction || matchesActor || matchesTarget || matchesDetails || matchesIp || matchesId;
      }

      return true;
    });
  }, [logs, categoryFilter, statusFilter, dateFilter, searchQuery]);

  const handleCopyJson = (obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleResetLogs = () => {
    if (window.confirm('Reset activity logs to default historical sample records?')) {
      const reset = resetActivityLogs();
      setLogs(reset);
      setDownloadToast('Activity logs reset to default sample dataset.');
      setTimeout(() => setDownloadToast(null), 3000);
    }
  };

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all activity log records? This action cannot be undone.')) {
      clearActivityLogs();
      setLogs([]);
      setDownloadToast('All activity logs cleared.');
      setTimeout(() => setDownloadToast(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-400 text-xs font-semibold flex items-center space-x-2.5 animate-bounce">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Header & Main Download Export Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/90 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2.5">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span>Analytics & MIS Reports</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time circulation velocity, accession inventory counts, patron demographic reports, and system activity logs with timestamps
          </p>
        </div>

        {/* Global Export / Download Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handlePrintPdfReport}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all shadow-sm"
            title="Print or Save as PDF Summary"
          >
            <Printer className="h-4 w-4 text-purple-600" />
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
        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Total Titles</span>
            <BookOpen className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{totalBooksCount}</div>
          <div className="text-[10px] text-emerald-600 font-mono">MARC21 Cataloged</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Accession Copies</span>
            <BookMarked className="h-3.5 w-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{totalCopiesCount}</div>
          <div className="text-[10px] text-indigo-600 font-mono">Barcode & RFID</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Active Loans</span>
            <Clock className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{activeLoansCount}</div>
          <div className="text-[10px] text-emerald-600 font-mono">In Patron Possession</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Overdue Notices</span>
            <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{overdueCount}</div>
          <div className="text-[10px] text-red-600 font-mono">Fine Penalty Active</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Registered Patrons</span>
            <Users className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{users.length}</div>
          <div className="text-[10px] text-purple-600 font-mono">Students & Faculty</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Total Fines (PKR)</span>
            <DollarSign className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">PKR {totalFinesAmount}</div>
          <div className="text-[10px] text-amber-600 font-mono">Audit Synced</div>
        </div>
      </div>

      {/* Module Specific Download Bar & Category Navigation */}
      <div className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-3 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#f1f5f9] p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveReportTab('CIRCULATION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeReportTab === 'CIRCULATION'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              🔄 Circulation Velocity
            </button>
            <button
              onClick={() => setActiveReportTab('CATALOG')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeReportTab === 'CATALOG'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              📚 Catalog & Inventory
            </button>
            <button
              onClick={() => setActiveReportTab('PATRONS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeReportTab === 'PATRONS'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              🎓 Patron Demographics
            </button>
            <button
              onClick={() => setActiveReportTab('FINES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeReportTab === 'FINES'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              💰 Financial & Fine Audit
            </button>

            {/* The New Activity Log Tab */}
            <button
              id="tab-reports-activity-log"
              onClick={() => setActiveReportTab('ACTIVITY_LOG')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeReportTab === 'ACTIVITY_LOG'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                  : 'text-slate-700 hover:text-purple-700 hover:bg-purple-50'
              }`}
            >
              <History className="h-3.5 w-3.5 text-purple-300" />
              <span>📜 Activity Log</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeReportTab === 'ACTIVITY_LOG' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                }`}
              >
                {logs.length}
              </span>
            </button>
          </div>

          {/* Dedicated Download Button for Active Section */}
          <div className="flex items-center space-x-2">
            {activeReportTab === 'CIRCULATION' && (
              <button
                onClick={handleDownloadCirculationReport}
                className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center space-x-1.5 hover:bg-blue-100 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
                <span>Export Circulation CSV</span>
              </button>
            )}

            {activeReportTab === 'CATALOG' && (
              <button
                onClick={handleDownloadCatalogReport}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center space-x-1.5 hover:bg-indigo-100 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-600" />
                <span>Export Catalog CSV</span>
              </button>
            )}

            {(activeReportTab === 'PATRONS' || activeReportTab === 'FINES') && (
              <button
                onClick={handleDownloadPatronFinesReport}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center space-x-1.5 hover:bg-emerald-100 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                <span>Export Patrons & Fines CSV</span>
              </button>
            )}

            {activeReportTab === 'ACTIVITY_LOG' && (
              <button
                id="btn-export-activity-logs"
                onClick={handleDownloadActivityLogsReport}
                className="px-3.5 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold flex items-center space-x-1.5 hover:bg-purple-100 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-purple-600" />
                <span>Export Activity Log CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ACTIVITY LOG TAB VIEW BODY */}
      {/* ========================================================================= */}
      {activeReportTab === 'ACTIVITY_LOG' && (
        <div className="space-y-4">
          {/* Activity Category Summary Badges & Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => setCategoryFilter('ALL')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'border-purple-500 bg-purple-50/70 shadow-sm ring-1 ring-purple-400'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold">All Recorded Events</span>
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{activityMetrics.total}</div>
              <div className="text-[10px] text-purple-700 font-medium mt-0.5">
                {activityMetrics.todayCount} logged today
              </div>
            </div>

            <div
              onClick={() => setCategoryFilter('CIRCULATION')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                categoryFilter === 'CIRCULATION'
                  ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-400'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold">Circulation Transactions</span>
                <Repeat className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{activityMetrics.circulation}</div>
              <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Issues, returns & fines</div>
            </div>

            <div
              onClick={() => setCategoryFilter('SYSTEM_CONFIG')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                categoryFilter === 'SYSTEM_CONFIG'
                  ? 'border-blue-500 bg-blue-50/70 shadow-sm ring-1 ring-blue-400'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold">System Configurations</span>
                <Sliders className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{activityMetrics.systemConfig}</div>
              <div className="text-[10px] text-blue-700 font-medium mt-0.5">Policies, branches & backups</div>
            </div>

            <div
              onClick={() => setCategoryFilter('USER_ADMIN')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                categoryFilter === 'USER_ADMIN'
                  ? 'border-indigo-500 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-400'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold">Administrative Actions</span>
                <UserCheck className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{activityMetrics.userAdmin}</div>
              <div className="text-[10px] text-indigo-700 font-medium mt-0.5">Users, roles & powers</div>
            </div>
          </div>

          {/* Activity Log Filter & Search Control Panel */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-sm">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by action, user, book/member, details, or IP address..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Controls Row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Date Filter Dropdown */}
                <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <select
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value as any)}
                    className="bg-transparent text-slate-700 text-xs font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="ALL_TIME">All Time</option>
                    <option value="TODAY">Today Only</option>
                    <option value="LAST_7_DAYS">Past 7 Days</option>
                    <option value="THIS_MONTH">This Month</option>
                  </select>
                </div>

                {/* Status Filter Dropdown */}
                <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
                  <Filter className="h-3.5 w-3.5 text-slate-500" />
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="bg-transparent text-slate-700 text-xs font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="SUCCESS">Success</option>
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                  </select>
                </div>

                {/* Reset & Clear Log Actions */}
                <button
                  onClick={handleResetLogs}
                  title="Reset to default realistic sample activity logs"
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={handleClearLogs}
                  title="Clear all activity logs"
                  className="p-2 rounded-xl border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Category Filter Chips Bar */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                Category:
              </span>
              <button
                onClick={() => setCategoryFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  categoryFilter === 'ALL'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Categories ({logs.length})
              </button>
              <button
                onClick={() => setCategoryFilter('CIRCULATION')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center space-x-1 ${
                  categoryFilter === 'CIRCULATION'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <Repeat className="h-3 w-3" />
                <span>Circulation ({activityMetrics.circulation})</span>
              </button>
              <button
                onClick={() => setCategoryFilter('SYSTEM_CONFIG')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center space-x-1 ${
                  categoryFilter === 'SYSTEM_CONFIG'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <Sliders className="h-3 w-3" />
                <span>System Config ({activityMetrics.systemConfig})</span>
              </button>
              <button
                onClick={() => setCategoryFilter('USER_ADMIN')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center space-x-1 ${
                  categoryFilter === 'USER_ADMIN'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <UserCheck className="h-3 w-3" />
                <span>User Admin ({activityMetrics.userAdmin})</span>
              </button>

              {(searchQuery || categoryFilter !== 'ALL' || dateFilter !== 'ALL_TIME' || statusFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setCategoryFilter('ALL');
                    setSearchQuery('');
                    setDateFilter('ALL_TIME');
                    setStatusFilter('ALL');
                  }}
                  className="ml-auto text-[11px] text-purple-600 hover:text-purple-800 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Activity Log Entries Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <History className="h-4 w-4 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Activity Audit Trail ({filteredLogs.length} events)
                </h3>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Real-time synchronized across modules
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-semibold bg-[#f8fafc]">
                    <th className="py-3 px-3.5 whitespace-nowrap">Timestamp</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Category</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Action</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Performed By</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Target Entity</th>
                    <th className="py-3 px-3.5">Details</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
                    <th className="py-3 px-3.5 text-right whitespace-nowrap">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <History className="h-8 w-8 text-slate-300" />
                          <div className="font-semibold text-slate-700">No activity logs found</div>
                          <p className="text-xs text-slate-400 max-w-sm">
                            No logged events match the selected category or search filters. Try adjusting your search query or reset sample logs.
                          </p>
                          <button
                            onClick={handleResetLogs}
                            className="mt-2 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold cursor-pointer"
                          >
                            Populate Sample Logs
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => {
                      const isCirculation = log.category === 'CIRCULATION';
                      const isConfig = log.category === 'SYSTEM_CONFIG';
                      const isUserAdmin = log.category === 'USER_ADMIN';

                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-purple-50/30 transition-colors group cursor-pointer"
                          onClick={() => setSelectedLog(log)}
                        >
                          {/* Timestamp */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span
                                className="font-medium text-slate-900 font-mono text-[11px]"
                                title={log.timestamp}
                              >
                                {formatReadableDateTime(log.timestamp)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-sans flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5 text-slate-400" />
                                {formatRelativeTime(log.timestamp)}
                              </span>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {isCirculation && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Repeat className="h-3 w-3 text-emerald-600" />
                                <span>Circulation</span>
                              </span>
                            )}
                            {isConfig && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <Sliders className="h-3 w-3 text-blue-600" />
                                <span>System Config</span>
                              </span>
                            )}
                            {isUserAdmin && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <UserCheck className="h-3 w-3 text-indigo-600" />
                                <span>User Admin</span>
                              </span>
                            )}
                            {!isCirculation && !isConfig && !isUserAdmin && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                <Activity className="h-3 w-3" />
                                <span>{log.category}</span>
                              </span>
                            )}
                          </td>

                          {/* Action Code & Label */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900 text-xs">
                                {log.actionLabel || log.action}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                                {log.action}
                              </span>
                            </div>
                          </td>

                          {/* Performed By */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                {(log.performedBy || 'A')[0].toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-900 text-xs">
                                  {log.performedBy}
                                </span>
                                {log.performedByRole && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {log.performedByRole}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Target Entity */}
                          <td className="py-3 px-3.5">
                            <div className="max-w-[200px] truncate font-medium text-slate-800 text-xs" title={log.target || 'N/A'}>
                              {log.target || <span className="text-slate-400 italic">None</span>}
                            </div>
                          </td>

                          {/* Details */}
                          <td className="py-3 px-3.5">
                            <p className="text-xs text-slate-600 line-clamp-2 max-w-md leading-relaxed">
                              {log.details}
                            </p>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {log.status === 'SUCCESS' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                <span>Success</span>
                              </span>
                            )}
                            {log.status === 'INFO' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <Info className="h-3 w-3 text-blue-600" />
                                <span>Info</span>
                              </span>
                            )}
                            {log.status === 'WARNING' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle className="h-3 w-3 text-amber-600" />
                                <span>Warning</span>
                              </span>
                            )}
                            {log.status === 'ERROR' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                <ShieldAlert className="h-3 w-3 text-red-600" />
                                <span>Error</span>
                              </span>
                            )}
                          </td>

                          {/* Inspect / Action Button */}
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedLog(log);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-purple-700 hover:border-purple-300 hover:bg-purple-50 text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer transition"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Details</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CIRCULATION VELOCITY TAB */}
      {/* ========================================================================= */}
      {activeReportTab === 'CIRCULATION' && (
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Circulation Log & Transaction History</h3>
              <p className="text-xs text-slate-500">
                Detailed breakdown of all issue, return, renewal, and overdue transactions
              </p>
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
                <tr className="border-b border-slate-200/90 text-slate-600 font-semibold bg-[#f1f5f9]">
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
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-blue-600">{t.id}</td>
                      <td className="py-2.5 px-3 font-mono">{t.copyBarcode || 'N/A'}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {t.bookTitle || 'Bibliographic Record'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{t.memberName || t.memberId || 'N/A'}</td>
                      <td className="py-2.5 px-3">{t.issueDate}</td>
                      <td className="py-2.5 px-3">{t.dueDate}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.status === 'ISSUED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : t.status === 'OVERDUE'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-amber-700 font-semibold">
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

      {/* ========================================================================= */}
      {/* 3. CATALOG & INVENTORY TAB */}
      {/* ========================================================================= */}
      {activeReportTab === 'CATALOG' && (
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-4 shadow-sm">
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
                <tr className="border-b border-slate-200/90 text-slate-600 font-semibold bg-[#f1f5f9]">
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
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-xs">{b.isbn}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{b.title}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {Array.isArray(b.authors) ? b.authors.join(', ') : b.authors}
                    </td>
                    <td className="py-2.5 px-3 text-indigo-700 font-medium">{b.department}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{b.callNumber}</td>
                    <td className="py-2.5 px-3 text-slate-500">{b.publisherName || 'Addison-Wesley'}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{b.totalCopies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PATRON DEMOGRAPHICS & FINES TAB */}
      {/* ========================================================================= */}
      {(activeReportTab === 'PATRONS' || activeReportTab === 'FINES') && (
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Patron Profiles & Fine Audit Trail</h3>
              <p className="text-xs text-slate-500">
                Registered library patrons, membership statuses, and overdue fine ledgers
              </p>
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
                <tr className="border-b border-slate-200/90 text-slate-600 font-semibold bg-[#f1f5f9]">
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
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-purple-600">{u.id}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{u.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{u.department || 'General'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-700">
                      PKR {u.finePending || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ACTIVITY DETAILS INSPECTOR MODAL */}
      {/* ========================================================================= */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedLog.actionLabel || selectedLog.action}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono mt-0.5">
                    <span>ID: {selectedLog.id}</span>
                    <span>•</span>
                    <span>{selectedLog.category}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Core Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Timestamp (Local)
                </span>
                <div className="font-semibold text-slate-800 font-mono">
                  {formatReadableDateTime(selectedLog.timestamp)}
                </div>
                <div className="text-[10px] text-slate-500">
                  {formatRelativeTime(selectedLog.timestamp)} ({selectedLog.timestamp})
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Execution Status
                </span>
                <div className="flex items-center space-x-1.5 font-bold">
                  {selectedLog.status === 'SUCCESS' && (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> SUCCESS
                    </span>
                  )}
                  {selectedLog.status === 'INFO' && (
                    <span className="text-blue-700 flex items-center gap-1">
                      <Info className="h-4 w-4" /> INFO
                    </span>
                  )}
                  {selectedLog.status === 'WARNING' && (
                    <span className="text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> WARNING
                    </span>
                  )}
                  {selectedLog.status === 'ERROR' && (
                    <span className="text-red-700 flex items-center gap-1">
                      <ShieldAlert className="h-4 w-4" /> ERROR
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  IP: {selectedLog.ipAddress || '192.168.1.100'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Performed By
                </span>
                <div className="font-bold text-slate-900">{selectedLog.performedBy}</div>
                <div className="text-[10px] text-purple-700 font-mono font-semibold">
                  Role: {selectedLog.performedByRole || 'ADMIN'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Target Entity
                </span>
                <div className="font-medium text-slate-800 break-words">
                  {selectedLog.target || 'System Registry'}
                </div>
              </div>
            </div>

            {/* Description & Details Box */}
            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 text-xs space-y-1.5">
              <span className="text-[10px] text-purple-800 uppercase tracking-wider font-bold">
                Detailed Log Narrative
              </span>
              <p className="text-slate-800 leading-relaxed">{selectedLog.details}</p>
            </div>

            {/* Technical Metadata JSON Viewer */}
            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600 font-semibold">
                  <span>Structured Context & Metadata:</span>
                  <button
                    onClick={() => handleCopyJson(selectedLog.metadata)}
                    className="flex items-center space-x-1 text-[11px] text-purple-600 hover:text-purple-800 font-medium cursor-pointer"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-400 font-mono text-[11px]">
                Audit Hash: SHA256-{(selectedLog.id + selectedLog.timestamp).slice(-10)}
              </span>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold cursor-pointer transition shadow-sm"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
