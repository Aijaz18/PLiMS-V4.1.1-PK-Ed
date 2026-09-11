import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Users,
  Repeat,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Bell,
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  ShieldAlert,
  Award,
  Sliders,
  RefreshCw,
  MoveUp,
  MoveDown,
  BookMarked,
  Building2,
  Trash2,
  Palette,
  QrCode,
  ArrowRightLeft,
  Search,
  Activity,
  Layers,
  BarChart3,
  Flame,
  FileSpreadsheet,
  Check,
  Send,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Compass,
  BookmarkCheck,
  Key,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { BookRecord, UserProfile, CirculationTransaction, SystemSettings } from '../../types/alims';
import {
  MainPageBgConfig,
  loadSavedBgConfig,
  ThemeCustomizerModal
} from '../MainThemeBgSelector';
import { UserProfileModal } from '../UserProfileModal';

interface DashboardModuleProps {
  books: BookRecord[];
  users: UserProfile[];
  transactions: CirculationTransaction[];
  currentUser?: UserProfile;
  settings?: SystemSettings;
  branches?: string[];
  onAddBranch?: (branchName: string) => void;
  onDeleteBranch?: (branchName: string) => void;
  onUpdateUser?: (id: string, updated: Partial<UserProfile>) => void;
  onNavigateTab?: (tab: any) => void;
  onOpenAiAssistant?: () => void;
}

export interface WidgetItem {
  id: string;
  title: string;
  description: string;
  visible: boolean;
  category: 'ANALYTICS' | 'CIRCULATION' | 'EVENTS' | 'AI_INSIGHTS';
  colSpan: string;
}

const DEFAULT_WIDGETS: WidgetItem[] = [
  {
    id: 'STATS_OVERVIEW',
    title: 'Executive Library Metrics & Telemetry',
    description: 'Real-time library volumes, members, active circulation load, and revenue',
    visible: true,
    category: 'ANALYTICS',
    colSpan: 'col-span-12'
  },
  {
    id: 'CIRCULATION_ANALYTICS',
    title: 'Circulation Flow & DDC Subject Breakdown',
    description: '7-day velocity chart, daily issues vs returns, and Dewey classification breakdown',
    visible: true,
    category: 'ANALYTICS',
    colSpan: 'col-span-12 lg:col-span-8'
  },
  {
    id: 'AI_COLLECTION',
    title: 'AI Collection Intelligence & Acquisition Alerts',
    description: 'Smart recommendations, demand surges, and automated purchase requisition drafts',
    visible: true,
    category: 'AI_INSIGHTS',
    colSpan: 'col-span-12 lg:col-span-4'
  },
  {
    id: 'RECENT_TRANSACTIONS',
    title: 'Live Circulation Feed & Quick Return Desk',
    description: 'Real-time stream of loans, overdue alerts, and direct check-in actions',
    visible: true,
    category: 'CIRCULATION',
    colSpan: 'col-span-12 lg:col-span-7'
  },
  {
    id: 'BRANCHES_CONTROL',
    title: 'National Campus Library Network',
    description: 'Multi-branch telemetry, load distribution, and branch node management',
    visible: true,
    category: 'ANALYTICS',
    colSpan: 'col-span-12 lg:col-span-5'
  },
  {
    id: 'LIBRARY_EVENTS',
    title: 'Upcoming Events, Workshops & Facility Schedule',
    description: 'Schedule for orientation sessions, book clubs, and system maintenance',
    visible: true,
    category: 'EVENTS',
    colSpan: 'col-span-12'
  }
];

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  books,
  users,
  transactions,
  currentUser,
  settings,
  branches = ['Central Campus Library (Islamabad)', 'Engineering Campus Library (Lahore)', 'Medical Sciences Library (Karachi)'],
  onAddBranch,
  onDeleteBranch,
  onUpdateUser,
  onNavigateTab,
  onOpenAiAssistant
}) => {
  const STORAGE_KEY = 'plims_dashboard_widget_layout_v4';
  const [newBranchInput, setNewBranchInput] = useState('');
  const [timeRange, setTimeRange] = useState<'TODAY' | '7D' | '30D' | 'TERM'>('7D');
  const [liveTxFilter, setLiveTxFilter] = useState<'ALL' | 'ISSUED' | 'OVERDUE' | 'RETURNED'>('ALL');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Time & date display
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAddBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchInput.trim()) return;
    if (onAddBranch) {
      onAddBranch(newBranchInput.trim());
      showActionToast(`Campus branch '${newBranchInput.trim()}' added successfully.`);
    }
    setNewBranchInput('');
  };

  const showActionToast = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  // Initialize widgets from localStorage or default
  const [widgets, setWidgets] = useState<WidgetItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load dashboard widgets preference', e);
    }
    return DEFAULT_WIDGETS;
  });

  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [bgConfig, setBgConfig] = useState<MainPageBgConfig>(() => loadSavedBgConfig());
  const [isThemeStudioOpen, setIsThemeStudioOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null);

  // Events list
  const [eventsList, setEventsList] = useState([
    {
      id: 'evt_1',
      title: 'HEC Pakistan RDA Cataloguing & Metadata Standards Seminar',
      date: '2026-08-20',
      time: '10:00 AM - 12:30 PM',
      location: 'Central Library Hall A (Islamabad)',
      category: 'WORKSHOP',
      attendees: 36,
      status: 'UPCOMING'
    },
    {
      id: 'evt_2',
      title: 'National Book Foundation Scholarly Exhibition 2026',
      date: '2026-08-25',
      time: '09:00 AM - 05:00 PM',
      location: 'Campus Main Auditorium & Lawns',
      category: 'EXHIBITION',
      attendees: 240,
      status: 'UPCOMING'
    },
    {
      id: 'evt_3',
      title: 'AI-Powered Digital Archiving & QR Member Pass Orientation',
      date: '2026-08-28',
      time: '02:00 PM - 04:00 PM',
      location: 'IT Resource Center & Online Stream',
      category: 'ORIENTATION',
      attendees: 90,
      status: 'UPCOMING'
    }
  ]);

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('10:00 AM - 12:00 PM');
  const [newEventLocation, setNewEventLocation] = useState('Main Library Seminar Room');

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    } catch (e) {
      console.error('Failed to save dashboard widgets layout', e);
    }
  }, [widgets]);

  // Derived metrics
  const totalCopies = books.reduce((acc, b) => acc + (b.totalCopies || 1), 0);
  const availableCopies = books.reduce((acc, b) => acc + (b.availableCopies !== undefined ? b.availableCopies : 1), 0);
  const activeLoans = transactions.filter(t => t.status === 'ISSUED' || t.status === 'OVERDUE');
  const overdueLoans = transactions.filter(t => t.status === 'OVERDUE');
  const returnedLoans = transactions.filter(t => t.status === 'RETURNED');
  const totalFine = users.reduce((acc, u) => acc + (u.finePending || 0), 0);
  const shelfOccupancyRate = totalCopies > 0 ? Math.round((availableCopies / totalCopies) * 100) : 100;
  const facultyMembers = users.filter(u => u.role === 'FACULTY').length;
  const studentMembers = users.filter(u => u.role === 'STUDENT' || u.role === 'RESEARCH_SCHOLAR').length;

  // DDC Subject Categories Calculation in Green/Mint theme tones
  const ddcCategories = [
    { code: '000', name: 'Computer Science & Information', color: '#00401A', count: Math.max(14, Math.round(books.length * 0.35)) },
    { code: '600', name: 'Technology & Applied Sciences', color: '#047857', count: Math.max(9, Math.round(books.length * 0.25)) },
    { code: '300', name: 'Social Sciences & Management', color: '#059669', count: Math.max(6, Math.round(books.length * 0.18)) },
    { code: '500', name: 'Pure & Natural Sciences', color: '#10B981', count: Math.max(5, Math.round(books.length * 0.12)) },
    { code: '800', name: 'Literature, Urdu & Islamic Studies', color: '#34D399', count: Math.max(4, Math.round(books.length * 0.10)) }
  ];
  const maxDdcCount = Math.max(...ddcCategories.map(d => d.count), 1);

  // 7-day simulated circulation flow data
  const velocityData = [
    { day: 'Mon', issues: 38, returns: 30 },
    { day: 'Tue', issues: 46, returns: 35 },
    { day: 'Wed', issues: 54, returns: 50 },
    { day: 'Thu', issues: 42, returns: 44 },
    { day: 'Fri', issues: 65, returns: 58 },
    { day: 'Sat', issues: 26, returns: 20 },
    { day: 'Sun', issues: 14, returns: 12 }
  ];
  const maxVelocity = Math.max(...velocityData.map(v => Math.max(v.issues, v.returns)), 1);

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedWidgetId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedWidgetId !== id) {
      setDragOverWidgetId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedWidgetId || draggedWidgetId === targetId) {
      setDraggedWidgetId(null);
      setDragOverWidgetId(null);
      return;
    }

    const updated = [...widgets];
    const dragIdx = updated.findIndex(w => w.id === draggedWidgetId);
    const targetIdx = updated.findIndex(w => w.id === targetId);

    if (dragIdx !== -1 && targetIdx !== -1) {
      const [removed] = updated.splice(dragIdx, 1);
      updated.splice(targetIdx, 0, removed);
      setWidgets(updated);
    }

    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const toggleWidgetVisibility = (id: string) => {
    setWidgets(prev => prev.map(w => (w.id === id ? { ...w, visible: !w.visible } : w)));
  };

  const moveWidgetPosition = (id: string, direction: 'UP' | 'DOWN') => {
    const updated = [...widgets];
    const index = updated.findIndex(w => w.id === id);
    if (index === -1) return;

    if (direction === 'UP' && index > 0) {
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
    } else if (direction === 'DOWN' && index < updated.length - 1) {
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
    }

    setWidgets(updated);
  };

  const handleResetLayout = () => {
    setWidgets(DEFAULT_WIDGETS);
    localStorage.removeItem(STORAGE_KEY);
    showActionToast('Dashboard layout reset to default.');
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle || !newEventDate) return;
    const newEvt = {
      id: `evt_${Date.now()}`,
      title: newEventTitle,
      date: newEventDate,
      time: newEventTime,
      location: newEventLocation,
      category: 'COMMUNITY',
      attendees: 1,
      status: 'UPCOMING'
    };
    setEventsList(prev => [newEvt, ...prev]);
    setNewEventTitle('');
    setNewEventDate('');
    showActionToast(`Event '${newEventTitle}' scheduled successfully.`);
  };

  const filteredTransactions = transactions.filter(t => {
    if (liveTxFilter === 'ALL') return true;
    if (liveTxFilter === 'ISSUED') return t.status === 'ISSUED';
    if (liveTxFilter === 'OVERDUE') return t.status === 'OVERDUE';
    if (liveTxFilter === 'RETURNED') return t.status === 'RETURNED';
    return true;
  });

  return (
    <div className="space-y-6 text-[#064e3b]">
      {/* Toast Notification */}
      {actionSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#00401a] text-white font-semibold text-xs shadow-2xl flex items-center space-x-2 border border-emerald-300 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* 1. PAKISTANI FLAG EXECUTIVE HERO BANNER (DEEP GREEN & CRISP WHITE) */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-600/30 bg-gradient-to-r from-[#00401a] via-[#004d20] to-[#047857] p-6 sm:p-7 shadow-xl text-white">
        {/* Flag Accent Shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-1/4 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Greeting & Title */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-white/20 border border-white/30 text-white text-[11px] font-mono font-bold tracking-wide backdrop-blur-sm">
                <span className="text-sm">🇵🇰</span>
                <span>PLiMS V4.1.1 PK edition • Academic Library Network</span>
              </span>

              <span className="inline-flex items-center space-x-1 px-3 py-0.5 rounded-full bg-emerald-900/50 border border-emerald-400/30 text-emerald-200 text-[11px] font-mono">
                <Building2 className="h-3 w-3 text-emerald-300" />
                <span>{branches[0] || 'Central Campus Library'}</span>
              </span>

              <span className="inline-flex items-center space-x-1 px-3 py-0.5 rounded-full bg-emerald-900/50 border border-emerald-400/30 text-emerald-200 text-[11px] font-mono">
                <Clock className="h-3 w-3 text-emerald-300" />
                <span>{currentDate} • {currentTime}</span>
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight flex items-center space-x-2">
                <span>Welcome, {currentUser?.name || 'Chief Librarian'}</span>
                <span className="text-xl">🌙⭐</span>
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
                National Academic Library Automation Platform compliant with HEC, MARC21, RDA & DDC standards across Pakistan's university network.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons on White & Emerald */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Rapid QR Scanner Launcher */}
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('CIRCULATION')}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-[#00401a] font-bold text-xs flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
            >
              <QrCode className="h-4 w-4 text-[#00401a] group-hover:scale-110 transition-transform" />
              <span>⚡ Fast QR Check-In</span>
            </button>

            {/* AI Assistant Button */}
            <button
              type="button"
              onClick={() => {
                if (onOpenAiAssistant) onOpenAiAssistant();
                else if (onNavigateTab) onNavigateTab('AI_ASSISTANT');
              }}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-300/40 text-white font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="h-4 w-4 text-emerald-300" />
              <span>AI Copilot</span>
            </button>

            {/* Theme Studio Button */}
            <button
              type="button"
              onClick={() => setIsThemeStudioOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-300/40 text-white font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-sm"
              title="Change Background Theme or Color Palette"
            >
              <Palette className="h-4 w-4 text-emerald-300" />
              <span className="hidden sm:inline">Theme Studio</span>
            </button>

            {/* Update Password / Security Button */}
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/40 text-white font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-sm backdrop-blur-sm"
              title="Replace and update your secure password"
            >
              <Lock className="h-4 w-4 text-white" />
              <span className="hidden sm:inline">Update Password</span>
            </button>

            {/* Customize Layout Button */}
            <button
              type="button"
              onClick={() => setIsCustomizeModalOpen(!isCustomizeModalOpen)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isCustomizeModalOpen
                  ? 'bg-white text-[#00401a] border-white'
                  : 'bg-emerald-900/60 border-emerald-300/40 text-white hover:bg-emerald-800'
              }`}
              title="Customize Layout & Widget Order"
            >
              <Sliders className="h-4 w-4" />
            </button>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleResetLayout}
              className="p-2.5 rounded-xl bg-emerald-900/60 border border-emerald-300/40 text-white hover:bg-emerald-800 transition-all cursor-pointer"
              title="Reset to default widget layout"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Operational Quick Launcher Strip (Green & White) */}
        <div className="mt-6 pt-5 border-t border-emerald-500/40 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
          <button
            onClick={() => onNavigateTab && onNavigateTab('CIRCULATION')}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-between transition-all cursor-pointer group text-left backdrop-blur-sm"
          >
            <div className="flex items-center space-x-2">
              <ArrowRightLeft className="h-3.5 w-3.5 text-emerald-300" />
              <span className="font-semibold text-[11px]">Issue & Return</span>
            </div>
            <ChevronRight className="h-3 w-3 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('CATALOGUING')}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-between transition-all cursor-pointer group text-left backdrop-blur-sm"
          >
            <div className="flex items-center space-x-2">
              <BookOpen className="h-3.5 w-3.5 text-emerald-300" />
              <span className="font-semibold text-[11px]">Add MARC21</span>
            </div>
            <ChevronRight className="h-3 w-3 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('MEMBERS')}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-between transition-all cursor-pointer group text-left backdrop-blur-sm"
          >
            <div className="flex items-center space-x-2">
              <Users className="h-3.5 w-3.5 text-emerald-300" />
              <span className="font-semibold text-[11px]">Patron Directory</span>
            </div>
            <ChevronRight className="h-3 w-3 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('OPAC')}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-between transition-all cursor-pointer group text-left backdrop-blur-sm"
          >
            <div className="flex items-center space-x-2">
              <Search className="h-3.5 w-3.5 text-emerald-300" />
              <span className="font-semibold text-[11px]">Public OPAC</span>
            </div>
            <ChevronRight className="h-3 w-3 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('DIGITAL_LIBRARY')}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-between transition-all cursor-pointer group text-left backdrop-blur-sm"
          >
            <div className="flex items-center space-x-2">
              <Layers className="h-3.5 w-3.5 text-emerald-300" />
              <span className="font-semibold text-[11px]">Digital Assets</span>
            </div>
            <ChevronRight className="h-3 w-3 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('STOCK_AUDIT')}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-between transition-all cursor-pointer group text-left backdrop-blur-sm"
          >
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-3.5 w-3.5 text-emerald-300" />
              <span className="font-semibold text-[11px]">RFID Stock Audit</span>
            </div>
            <ChevronRight className="h-3 w-3 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* SYSTEM CREDENTIALS & SECURITY NOTICE BANNER */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#003816] via-[#004d20] to-[#047857] border border-emerald-500/40 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-emerald-300 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-sm text-white">System Security & Access Credentials</h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Current User: {currentUser?.memberCode || currentUser?.email || 'Active Member'} ({currentUser?.name})
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 leading-relaxed max-w-3xl">
              Your PLiMS session is authenticated and secured. You can manage your profile, security credentials, and access settings anytime.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-[#00401a] font-bold text-xs flex items-center space-x-2 shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Key className="h-4 w-4 text-[#00401a]" />
            <span>Update Secure Password</span>
          </button>
        </div>
      </div>

      {/* 2. TIME RANGE SELECTOR & TELEMETRY INDICATOR (LIGHT MINT) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-emerald-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-[#064e3b]">Analytics Horizon:</span>
          <div className="flex items-center bg-emerald-50 p-1 rounded-xl border border-emerald-200 text-xs">
            {(['TODAY', '7D', '30D', 'TERM'] as const).map(range => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-[#00401a] text-white shadow-sm'
                    : 'text-[#065f46] hover:bg-emerald-100'
                }`}
              >
                {range === 'TODAY' && 'Today (Live)'}
                {range === '7D' && 'Last 7 Days'}
                {range === '30D' && 'Last 30 Days'}
                {range === 'TERM' && 'Academic Term'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-[#065f46] font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00401a] animate-pulse"></span>
          <span>HEC Pakistan National Z39.50 Telemetry Synced</span>
        </div>
      </div>

      {/* Customize Drawer / Panel (Light White & Emerald) */}
      {isCustomizeModalOpen && (
        <div className="p-5 rounded-2xl border border-emerald-300 bg-white space-y-4 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="h-4 w-4 text-[#00401a]" />
              <h3 className="text-sm font-bold text-[#064e3b]">Dashboard Widget Layout Customizer</h3>
            </div>
            <span className="text-[11px] text-[#065f46] font-mono">
              Toggle card visibility or click arrows to reorder
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {widgets.map((widget, idx) => (
              <div
                key={widget.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  widget.visible
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-red-200 bg-red-50/50 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-2 overflow-hidden">
                  <div className="flex flex-col space-y-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => moveWidgetPosition(widget.id, 'UP')}
                      className="text-[#065f46] hover:text-[#00401a] disabled:opacity-20 cursor-pointer"
                    >
                      <MoveUp className="h-3 w-3" />
                    </button>
                    <button
                      disabled={idx === widgets.length - 1}
                      onClick={() => moveWidgetPosition(widget.id, 'DOWN')}
                      className="text-[#065f46] hover:text-[#00401a] disabled:opacity-20 cursor-pointer"
                    >
                      <MoveDown className="h-3 w-3" />
                    </button>
                  </div>
                  <div>
                    <div className="font-bold text-[#064e3b] truncate">{widget.title}</div>
                    <div className="text-[10px] text-[#065f46] font-mono">{widget.category}</div>
                  </div>
                </div>

                <button
                  onClick={() => toggleWidgetVisibility(widget.id)}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    widget.visible
                      ? 'bg-[#00401a] text-white border-[#00401a]'
                      : 'bg-slate-100 border-slate-300 text-slate-500'
                  }`}
                >
                  {widget.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. MAIN DRAGGABLE WIDGET GRID (LIGHT CRISP WHITE & GREEN) */}
      <div className="grid grid-cols-12 gap-6">
        {widgets
          .filter(w => w.visible)
          .map(widget => (
            <div
              key={widget.id}
              draggable
              onDragStart={e => handleDragStart(e, widget.id)}
              onDragOver={e => handleDragOver(e, widget.id)}
              onDrop={e => handleDrop(e, widget.id)}
              className={`${widget.colSpan} transition-all duration-200 ${
                dragOverWidgetId === widget.id ? 'scale-[0.99] border-2 border-[#00401a] rounded-2xl' : ''
              }`}
            >
              {/* WIDGET 1: STATS_OVERVIEW */}
              {widget.id === 'STATS_OVERVIEW' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* Card 1: Catalog Titles */}
                    <div className="p-4 rounded-2xl border border-emerald-200 bg-white hover:border-[#00401a] hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#065f46]">Total Catalog Titles</span>
                        <div className="p-2 rounded-xl bg-emerald-50 text-[#00401a] border border-emerald-200 group-hover:scale-110 transition-transform">
                          <BookOpen className="h-4 w-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-serif text-[#064e3b] tracking-tight">{books.length}</div>
                        <div className="text-[11px] text-[#065f46] mt-0.5 flex items-center space-x-1">
                          <span className="text-[#00401a] font-bold font-mono">+{totalCopies}</span>
                          <span>total barcoded copies</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-[10px] text-[#065f46] font-mono">
                        <span>MARC21 / RDA</span>
                        <span className="text-[#00401a] font-bold">100% Synced</span>
                      </div>
                    </div>

                    {/* Card 2: Total Physical Copies */}
                    <div className="p-4 rounded-2xl border border-emerald-200 bg-white hover:border-[#00401a] hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#065f46]">Inventory Volumes</span>
                        <div className="p-2 rounded-xl bg-emerald-50 text-[#00401a] border border-emerald-200 group-hover:scale-110 transition-transform">
                          <BookMarked className="h-4 w-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-serif text-[#064e3b] tracking-tight">{totalCopies}</div>
                        <div className="text-[11px] text-[#065f46] mt-0.5 flex items-center space-x-1">
                          <span className="text-[#00401a] font-bold font-mono">{availableCopies}</span>
                          <span>on-shelf ready</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-[10px] text-[#065f46] font-mono">
                        <span>Shelf Capacity</span>
                        <span className="text-[#00401a] font-bold">{shelfOccupancyRate}% Available</span>
                      </div>
                    </div>

                    {/* Card 3: Active Loans */}
                    <div className="p-4 rounded-2xl border border-emerald-200 bg-white hover:border-[#00401a] hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#065f46]">Active Circulation</span>
                        <div className="p-2 rounded-xl bg-emerald-50 text-[#00401a] border border-emerald-200 group-hover:scale-110 transition-transform">
                          <Repeat className="h-4 w-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-serif text-[#064e3b] tracking-tight">{activeLoans.length}</div>
                        <div className="text-[11px] text-[#065f46] mt-0.5 flex items-center space-x-1">
                          <span className="text-[#00401a] font-bold font-mono">+{returnedLoans.length}</span>
                          <span>returns processed</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-[10px] text-[#065f46] font-mono">
                        <span>Turnover Rate</span>
                        <span className="text-[#00401a] font-bold">High (3.4x)</span>
                      </div>
                    </div>

                    {/* Card 4: Overdue Alert */}
                    <div className="p-4 rounded-2xl border border-red-200 bg-red-50/40 hover:border-red-400 hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-red-700">Overdue Notices</span>
                        <div className="p-2 rounded-xl bg-red-100 text-red-600 border border-red-200 group-hover:scale-110 transition-transform">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-serif text-red-700 tracking-tight">{overdueLoans.length}</div>
                        <div className="text-[11px] text-red-600 mt-0.5 flex items-center space-x-1">
                          <span className="font-semibold font-mono">Action Required</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-red-100 flex items-center justify-between text-[10px] text-red-600 font-mono">
                        <span>Drafts Ready</span>
                        <button
                          onClick={() => onNavigateTab && onNavigateTab('CIRCULATION')}
                          className="text-red-700 hover:underline font-bold cursor-pointer"
                        >
                          Send Drafts →
                        </button>
                      </div>
                    </div>

                    {/* Card 5: Registered Members */}
                    <div className="p-4 rounded-2xl border border-emerald-200 bg-white hover:border-[#00401a] hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#065f46]">Patron Directory</span>
                        <div className="p-2 rounded-xl bg-emerald-50 text-[#00401a] border border-emerald-200 group-hover:scale-110 transition-transform">
                          <Users className="h-4 w-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-serif text-[#064e3b] tracking-tight">{users.length}</div>
                        <div className="text-[11px] text-[#065f46] mt-0.5 flex items-center space-x-1">
                          <span className="text-[#00401a] font-bold font-mono">{studentMembers}</span>
                          <span>Stu • </span>
                          <span className="text-[#00401a] font-bold font-mono">{facultyMembers}</span>
                          <span>Fac</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-[10px] text-[#065f46] font-mono">
                        <span>Digital Pass QR</span>
                        <span className="text-[#00401a] font-bold">Active (100%)</span>
                      </div>
                    </div>

                    {/* Card 6: Fine & Accounts Audit */}
                    <div className="p-4 rounded-2xl border border-emerald-200 bg-white hover:border-[#00401a] hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#065f46]">Fines & Revenue</span>
                        <div className="p-2 rounded-xl bg-emerald-50 text-[#00401a] border border-emerald-200 group-hover:scale-110 transition-transform">
                          <DollarSign className="h-4 w-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-serif text-[#064e3b] tracking-tight">PKR {totalFine}</div>
                        <div className="text-[11px] text-[#065f46] mt-0.5 flex items-center space-x-1">
                          <span className="text-[#00401a] font-semibold font-mono">Accounts Synced</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-[10px] text-[#065f46] font-mono">
                        <span>50 PKR/day rule</span>
                        <span className="text-[#00401a] font-bold">Auto-Billed</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* WIDGET 2: CIRCULATION_ANALYTICS (Light Green & White 7-Day Chart) */}
              {widget.id === 'CIRCULATION_ANALYTICS' && (
                <div className="p-6 rounded-3xl border border-emerald-200 bg-white space-y-6 shadow-sm h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                      <div className="flex items-center space-x-2.5">
                        <GripVertical className="h-4 w-4 text-emerald-400 cursor-grab active:cursor-grabbing" />
                        <div className="p-2 rounded-xl bg-emerald-50 text-[#00401a] border border-emerald-200">
                          <TrendingUp className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#064e3b]">Circulation Flow & DDC Subject Breakdown</h3>
                          <p className="text-[11px] text-[#065f46]">Daily checkouts vs check-ins & Dewey Decimal catalog composition</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 text-[11px] font-mono font-bold">
                        <span className="flex items-center space-x-1.5 text-[#00401a]">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#00401a] inline-block"></span>
                          <span>Issues</span>
                        </span>
                        <span className="flex items-center space-x-1.5 text-emerald-600">
                          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
                          <span>Returns</span>
                        </span>
                      </div>
                    </div>

                    {/* Interactive 7-Day SVG Bar Visualizer */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-[#065f46]">
                        <span className="font-bold text-[#064e3b]">Daily Velocity (Issues vs Returns)</span>
                        <span className="font-mono text-[#00401a] font-bold">Avg: 39 transactions / day</span>
                      </div>

                      <div className="h-44 w-full bg-emerald-50/40 rounded-2xl p-4 border border-emerald-200 flex items-end justify-between gap-3">
                        {velocityData.map((item, idx) => {
                          const issueHeight = Math.round((item.issues / maxVelocity) * 100);
                          const returnHeight = Math.round((item.returns / maxVelocity) * 100);
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer">
                              <div className="w-full flex items-end justify-center space-x-1 h-32 relative">
                                {/* Tooltip */}
                                <div className="absolute -top-8 bg-[#00401a] text-white text-[10px] font-mono px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap shadow-xl">
                                  {item.day}: {item.issues} Out / {item.returns} In
                                </div>

                                {/* Issue Bar (Pakistani Deep Green) */}
                                <div
                                  style={{ height: `${issueHeight}%` }}
                                  className="w-2.5 sm:w-3.5 bg-[#00401a] hover:bg-[#005522] rounded-t-md transition-all shadow-sm"
                                />
                                {/* Return Bar (Bright Mint Emerald) */}
                                <div
                                  style={{ height: `${returnHeight}%` }}
                                  className="w-2.5 sm:w-3.5 bg-emerald-500 hover:bg-emerald-400 rounded-t-md transition-all shadow-sm"
                                />
                              </div>
                              <span className="text-[10px] text-[#065f46] font-mono font-bold mt-2 group-hover:text-[#00401a] transition-colors">
                                {item.day}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* DDC Classification Progress Bars in Pakistani Green tones */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#064e3b]">Dewey Decimal Classification (DDC) Distribution</span>
                        <span className="text-[11px] text-[#065f46] font-mono font-bold">{books.length} Total Titles</span>
                      </div>

                      <div className="space-y-2">
                        {ddcCategories.map(cat => {
                          const percent = Math.round((cat.count / maxDdcCount) * 100);
                          return (
                            <div key={cat.code} className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono font-bold text-[#00401a] bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                                    {cat.code}
                                  </span>
                                  <span className="text-[#064e3b] font-semibold">{cat.name}</span>
                                </div>
                                <span className="font-mono text-[#065f46] text-[10px] font-bold">{cat.count} titles</span>
                              </div>
                              <div className="h-2.5 w-full bg-emerald-100/60 rounded-full overflow-hidden border border-emerald-200">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${percent}%`, backgroundColor: cat.color }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-emerald-100 flex items-center justify-between text-[11px] text-[#065f46]">
                    <span className="flex items-center space-x-1.5 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#00401a]" />
                      <span>HEC Pakistan Library Standards Compliant</span>
                    </span>
                    <button
                      onClick={() => onNavigateTab && onNavigateTab('REPORTS')}
                      className="text-[#00401a] hover:underline font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Full Analytics Report</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* WIDGET 3: AI_COLLECTION (AI Curated Intelligence - Green & White) */}
              {widget.id === 'AI_COLLECTION' && (
                <div className="p-6 rounded-3xl border border-emerald-200 bg-white space-y-5 shadow-sm h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <GripVertical className="h-4 w-4 text-emerald-400 cursor-grab active:cursor-grabbing" />
                        <div className="p-1.5 rounded-xl bg-emerald-100 text-[#00401a] border border-emerald-200">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-bold text-[#064e3b]">AI Collection Advisor</h3>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-[#00401a] border border-emerald-300">
                        GEMINI 2.5
                      </span>
                    </div>

                    {/* AI Health Score Card */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-[#065f46] font-medium">Curriculum Alignment Index</div>
                        <div className="text-xl font-bold font-serif text-[#064e3b] mt-0.5">96.4% Match</div>
                        <div className="text-[10px] text-[#00401a] font-bold">HEC Syllabus Approved</div>
                      </div>
                      <div className="h-10 w-10 rounded-full border-2 border-[#00401a] flex items-center justify-center font-mono font-bold text-xs text-[#00401a] bg-emerald-100">
                        A+
                      </div>
                    </div>

                    {/* Recommendation Card 1 */}
                    <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#00401a] flex items-center space-x-1">
                          <Flame className="h-3.5 w-3.5 text-amber-500" />
                          <span>High Waitlist Alert</span>
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                          14 in queue
                        </span>
                      </div>

                      <div className="text-xs font-bold text-[#064e3b]">
                        "Designing Data-Intensive Applications" (Kleppmann)
                      </div>
                      <p className="text-[11px] text-[#065f46] leading-relaxed">
                        Surge in Computer Science & SE senior project checkouts. Recommend acquiring 5 extra hardcover copies.
                      </p>

                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => showActionToast('Purchase Order Requisition drafted for 5 copies!')}
                          className="px-3 py-1.5 rounded-xl bg-[#00401a] hover:bg-[#005522] text-white font-bold text-[10px] transition-all cursor-pointer shadow-sm"
                        >
                          Draft Requisition
                        </button>
                        <button
                          onClick={() => onNavigateTab && onNavigateTab('AI_ASSISTANT')}
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-[#00401a] text-[10px] font-bold cursor-pointer"
                        >
                          Ask AI Copilot
                        </button>
                      </div>
                    </div>

                    {/* Recommendation Card 2 */}
                    <div className="p-3 rounded-2xl border border-emerald-200 bg-white space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[#064e3b] font-bold">
                        <span>Interdisciplinary Trend</span>
                        <span className="text-[10px] text-[#00401a] font-mono bg-emerald-100 px-1.5 py-0.2 rounded font-bold">AI + Medicine</span>
                      </div>
                      <p className="text-[11px] text-[#065f46]">
                        Higher correlation of Medical Physics scholars requesting Deep Learning & Bio-informatics reference monographs.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-emerald-100 flex items-center justify-between text-[11px] text-[#065f46]">
                    <span>Model: Gemini 2.5 Flash</span>
                    <span className="text-[#00401a] font-mono font-bold">Live Synced</span>
                  </div>
                </div>
              )}

              {/* WIDGET 4: RECENT_TRANSACTIONS (Live Circulation Feed - Green & White) */}
              {widget.id === 'RECENT_TRANSACTIONS' && (
                <div className="p-6 rounded-3xl border border-emerald-200 bg-white space-y-5 shadow-sm h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-3">
                      <div className="flex items-center space-x-2.5">
                        <GripVertical className="h-4 w-4 text-emerald-400 cursor-grab active:cursor-grabbing" />
                        <div className="p-2 rounded-xl bg-emerald-50 text-[#00401a] border border-emerald-200">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#064e3b]">Live Circulation Stream</h3>
                          <p className="text-[11px] text-[#065f46]">Recent checkouts, returns, and overdue loan alerts</p>
                        </div>
                      </div>

                      {/* Filter Tabs */}
                      <div className="flex items-center bg-emerald-50 p-1 rounded-xl border border-emerald-200 text-xs">
                        {(['ALL', 'ISSUED', 'OVERDUE', 'RETURNED'] as const).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setLiveTxFilter(tab)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              liveTxFilter === tab
                                ? 'bg-[#00401a] text-white shadow-sm'
                                : 'text-[#065f46] hover:text-[#00401a]'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Transaction List */}
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {filteredTransactions.slice(0, 7).map(tx => {
                        const isOverdue = tx.status === 'OVERDUE';
                        const isReturned = tx.status === 'RETURNED';

                        return (
                          <div
                            key={tx.id}
                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between text-xs ${
                              isOverdue
                                ? 'border-red-200 bg-red-50/50'
                                : isReturned
                                ? 'border-emerald-100 bg-emerald-50/30 opacity-70'
                                : 'border-emerald-200 bg-white hover:border-[#00401a]'
                            }`}
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className={`p-2 rounded-xl border shrink-0 ${
                                isOverdue
                                  ? 'bg-red-100 text-red-700 border-red-200'
                                  : isReturned
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : 'bg-emerald-50 text-[#00401a] border-emerald-200'
                              }`}>
                                {isOverdue ? <AlertTriangle className="h-4 w-4" /> : isReturned ? <Check className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                              </div>

                              <div className="min-w-0">
                                <div className="font-bold text-[#064e3b] truncate flex items-center space-x-2">
                                  <span className="truncate">{tx.bookTitle}</span>
                                  {isOverdue && (
                                    <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 text-[9px] font-mono font-extrabold uppercase shrink-0 border border-red-200">
                                      OVERDUE
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[#065f46] flex items-center space-x-2 mt-0.5">
                                  <span>Borrower: <strong className="text-[#064e3b]">{tx.memberName}</strong></span>
                                  <span>•</span>
                                  <span className="font-mono text-[#065f46]">Due: {tx.dueDate}</span>
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 ml-3">
                              {tx.status === 'ISSUED' || tx.status === 'OVERDUE' ? (
                                <button
                                  onClick={() => onNavigateTab && onNavigateTab('CIRCULATION')}
                                  className="px-3 py-1.5 rounded-xl bg-[#00401a] hover:bg-[#005522] text-white text-[11px] font-bold cursor-pointer transition-all shadow-sm"
                                >
                                  Desk Action
                                </button>
                              ) : (
                                <span className="text-emerald-700 text-[10px] font-mono font-bold uppercase flex items-center space-x-1">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-[#00401a]" />
                                  <span>Completed</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-emerald-100 flex items-center justify-between text-[11px] text-[#065f46]">
                    <span>Showing {Math.min(7, filteredTransactions.length)} of {transactions.length} circulation records</span>
                    <button
                      onClick={() => onNavigateTab && onNavigateTab('CIRCULATION')}
                      className="text-[#00401a] hover:underline font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Open Desk Terminal</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* WIDGET 5: BRANCHES_CONTROL (Campus Branches Network - Green & White) */}
              {widget.id === 'BRANCHES_CONTROL' && (
                <div className="p-6 rounded-3xl border border-emerald-200 bg-white space-y-5 shadow-sm h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                      <div className="flex items-center space-x-2.5">
                        <GripVertical className="h-4 w-4 text-emerald-400 cursor-grab active:cursor-grabbing" />
                        <div className="p-2 rounded-xl bg-emerald-50 text-[#00401a] border border-emerald-200">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#064e3b]">National Campus Network</h3>
                          <p className="text-[11px] text-[#065f46]">{branches.length} interconnected libraries</p>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-[#00401a] text-[10px] font-mono font-bold">
                        MULTI-NODE SYNC
                      </span>
                    </div>

                    {/* Add Branch Inline Form */}
                    <form onSubmit={handleAddBranchSubmit} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Add campus branch (e.g. Quetta Sub-Campus)..."
                        value={newBranchInput}
                        onChange={e => setNewBranchInput(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs text-[#064e3b] placeholder-emerald-400 focus:outline-none focus:border-[#00401a] font-medium"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-2 rounded-xl bg-[#00401a] hover:bg-[#005522] text-white font-bold text-xs flex items-center space-x-1 shadow-sm cursor-pointer shrink-0 transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add</span>
                      </button>
                    </form>

                    {/* Branches List */}
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {branches.map((bName, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/30 flex items-center justify-between text-xs hover:border-[#00401a] transition-all"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#00401a] shrink-0 ring-4 ring-emerald-200"></div>
                            <div className="min-w-0">
                              <div className="font-bold text-[#064e3b] truncate">{bName}</div>
                              <div className="text-[10px] text-[#065f46] font-mono mt-0.5">
                                Node #{idx + 1} • Auto-Sync Active
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                            <button
                              onClick={() => {
                                if (branches.length <= 1) {
                                  alert('At least one primary campus library branch must remain active.');
                                  return;
                                }
                                if (confirm(`Are you sure you want to remove campus branch '${bName}'?`)) {
                                  if (onDeleteBranch) onDeleteBranch(bName);
                                  showActionToast(`Branch '${bName}' removed.`);
                                }
                              }}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-all cursor-pointer"
                              title="Remove Campus Branch"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-emerald-100 flex items-center justify-between text-[11px] text-[#065f46]">
                    <span>Inter-Library Loan Routing</span>
                    <span className="text-[#00401a] font-mono font-bold">Real-time Z39.50</span>
                  </div>
                </div>
              )}

              {/* WIDGET 6: LIBRARY_EVENTS (Green & White Events Timeline) */}
              {widget.id === 'LIBRARY_EVENTS' && (
                <div className="p-6 rounded-3xl border border-emerald-200 bg-white space-y-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <GripVertical className="h-4 w-4 text-emerald-400 cursor-grab active:cursor-grabbing" />
                      <div className="p-2 rounded-xl bg-emerald-50 text-[#00401a] border border-emerald-200">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#064e3b]">Upcoming Library Events & Academic Schedule</h3>
                        <p className="text-[11px] text-[#065f46]">Workshops, book fairs, and digital literacy orientations</p>
                      </div>
                    </div>

                    <span className="text-[10px] text-[#00401a] font-mono bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 font-bold">
                      {eventsList.length} Scheduled Sessions
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {eventsList.map(evt => (
                      <div
                        key={evt.id}
                        className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 hover:border-[#00401a] hover:bg-white transition-all space-y-2.5 text-xs flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-[#00401a] text-[10px] font-mono font-bold">
                              {evt.category}
                            </span>
                            <span className="text-[10px] text-[#065f46] font-mono font-bold">{evt.attendees} Registered</span>
                          </div>

                          <h4 className="font-bold text-[#064e3b] leading-snug">{evt.title}</h4>
                        </div>

                        <div className="pt-2 border-t border-emerald-200/80 space-y-1 text-[11px] text-[#065f46] font-mono">
                          <div className="flex items-center space-x-1.5">
                            <Calendar className="h-3.5 w-3.5 text-[#00401a]" />
                            <span>{evt.date} • {evt.time}</span>
                          </div>
                          <div className="text-[10px] text-[#065f46] truncate">
                            📍 {evt.location}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Event Inline Form */}
                  <form onSubmit={handleAddEvent} className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 space-y-3">
                    <div className="text-xs font-bold text-[#064e3b] flex items-center space-x-1.5">
                      <Plus className="h-3.5 w-3.5 text-[#00401a]" />
                      <span>Schedule New Library Event or Academic Workshop:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                      <input
                        type="text"
                        required
                        placeholder="Event title (e.g. HEC Digital Library Orientation)..."
                        value={newEventTitle}
                        onChange={e => setNewEventTitle(e.target.value)}
                        className="sm:col-span-6 px-3 py-2 rounded-xl bg-white border border-emerald-200 text-[#064e3b] placeholder-emerald-400 focus:outline-none focus:border-[#00401a]"
                      />

                      <input
                        type="date"
                        required
                        value={newEventDate}
                        onChange={e => setNewEventDate(e.target.value)}
                        className="sm:col-span-3 px-3 py-2 rounded-xl bg-white border border-emerald-200 text-[#064e3b] focus:outline-none focus:border-[#00401a]"
                      />

                      <button
                        type="submit"
                        className="sm:col-span-3 py-2 rounded-xl bg-[#00401a] hover:bg-[#005522] text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
                      >
                        Publish Event
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* 4. THEME CUSTOMIZER STUDIO MODAL */}
      <ThemeCustomizerModal
        isOpen={isThemeStudioOpen}
        onClose={() => setIsThemeStudioOpen(false)}
        config={bgConfig}
        onChangeConfig={setBgConfig}
      />

      {/* 5. USER PROFILE & PASSWORD SECURITY MODAL */}
      {currentUser && (
        <UserProfileModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          currentUser={currentUser}
          initialTab="PASSWORD"
          onUpdateUser={(id, updated) => {
            if (onUpdateUser) {
              onUpdateUser(id, updated);
            }
            showActionToast('Password updated securely! Your new password is now active.');
          }}
          settings={settings}
        />
      )}
    </div>
  );
};
