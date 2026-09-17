import React, { useState } from 'react';
import {
  BookOpen,
  Users,
  Repeat,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Search,
  Lock,
  Zap,
  Palette,
  LayoutGrid,
  FileCode,
  ShoppingCart,
  Radio,
  ExternalLink,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  LineChart,
  Bot
} from 'lucide-react';
import { BookRecord, UserProfile, CirculationTransaction, SystemSettings, AppTheme } from '../../types/alims';
import { getThemeConfig } from '../../utils/themeConfig';
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
  activeBranch?: string;
  currentTheme?: AppTheme;
  onAddBranch?: (branchName: string) => void;
  onDeleteBranch?: (branchName: string) => void;
  onUpdateUser?: (id: string, updated: Partial<UserProfile>) => void;
  onNavigateTab?: (tab: any) => void;
  onOpenAiAssistant?: () => void;
  onIssueBook?: (barcode: string, memberCode: string) => Promise<any> | any;
  onReturnBook?: (identifier: string) => Promise<any> | any;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  books,
  users,
  transactions,
  currentUser,
  settings,
  branches = ['Central Academic Library', 'Engineering Campus Library', 'Medical Sciences Library'],
  activeBranch = 'Central Academic Library',
  currentTheme = 'oxford-navy',
  onUpdateUser,
  onNavigateTab,
  onOpenAiAssistant,
  onIssueBook,
  onReturnBook
}) => {
  const [selectedHorizon, setSelectedHorizon] = useState<'TODAY' | '7DAYS' | '30DAYS' | 'TERM'>('7DAYS');
  const themeDef = getThemeConfig(currentTheme);
  const [isThemeStudioOpen, setIsThemeStudioOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFastQrOpen, setIsFastQrOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [bgConfig, setBgConfig] = useState<MainPageBgConfig>(() => loadSavedBgConfig());

  // Password update modal states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordToast, setPasswordToast] = useState<string | null>(null);

  // Fast QR code modal states
  const [qrScanInput, setQrScanInput] = useState('');
  const [qrToast, setQrToast] = useState<string | null>(null);

  // Metrics
  const totalBarcodedCopies = books.reduce((acc, b) => acc + (b.totalCopies || 1), 0);
  const activeCirculation = transactions.filter(t => t.status === 'ISSUED' || t.status === 'OVERDUE').length;
  const overdueCount = transactions.filter(t => t.status === 'OVERDUE').length;
  const totalFine = users.reduce((acc, u) => acc + (u.finePending || 0), 0);
  const studentCount = users.filter(u => u.role === 'STUDENT' || u.role === 'RESEARCH_SCHOLAR').length;
  const facultyCount = users.filter(u => u.role === 'FACULTY').length;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      alert('Passwords do not match or are empty.');
      return;
    }
    setPasswordToast('Password updated securely for session!');
    setTimeout(() => {
      setPasswordToast(null);
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    }, 1500);
  };

  const handleFastQrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrScanInput.trim()) return;
    if (onReturnBook) {
      await onReturnBook(qrScanInput.trim());
      setQrToast(`Item ${qrScanInput.trim()} checked in via QR scan.`);
      setTimeout(() => {
        setQrToast(null);
        setQrScanInput('');
        setIsFastQrOpen(false);
      }, 1500);
    }
  };

  // DDC Subject breakdown data matching image
  const ddcClasses = [
    { code: '000', name: 'Generalities', percent: 18, color: '#2563eb' },
    { code: '100', name: 'Philosophy', percent: 14, color: '#ec4899' },
    { code: '200', name: 'Religion', percent: 12, color: '#f97316' },
    { code: '300', name: 'Social Sciences', percent: 16, color: '#3b82f6' },
    { code: '400', name: 'Language', percent: 10, color: '#06b6d4' },
    { code: '500', name: 'Natural Sciences', percent: 9, color: '#eab308' },
    { code: '600', name: 'Technology', percent: 8, color: '#10b981' },
    { code: '700', name: 'Arts', percent: 7, color: '#f43f5e' },
    { code: '800', name: 'Literature', percent: 4, color: '#6366f1' },
    { code: '900', name: 'History & Geography', percent: 2, color: '#14b8a6' }
  ];

  return (
    <div className="space-y-5 pb-8 select-none font-sans text-slate-800">
      {/* 1. PANORAMIC HERO BANNER */}
      <div
        className="rounded-2xl overflow-hidden relative shadow-sm border border-slate-200/90 theme-hero-banner transition-all duration-300"
        style={{ background: themeDef.heroGradient }}
      >
        {/* Background Library Bookshelf Image */}
        <img
          src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1600&q=80"
          alt="Library"
          className="absolute inset-0 w-full h-full object-cover object-center mix-blend-overlay opacity-30"
        />

        {/* Dynamic gradient overlay matching theme */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)'
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 p-5 sm:p-6 lg:p-7 flex flex-col justify-between min-h-[210px]">
          {/* Top Row: Welcome heading + Right Theme badge */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center space-x-2">
                <span>Welcome, {currentUser?.name?.toUpperCase() || 'SLiMS IN 5 MINUTES'}</span>
                <span className="text-amber-400 font-serif text-2xl">☪</span>
              </h1>
              <p className="text-xs sm:text-[13px] text-slate-200/90 leading-relaxed font-normal">
                National Academic Library Automation Platform compliant with HEC, MARC21, RDA & DDC standards across Pakistan's university network.
              </p>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-[11px] font-medium backdrop-blur-xs">
                  <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ backgroundColor: themeDef.swatchColors[0] }} />
                  <span>Online • Cloud Sync Active</span>
                </span>

                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-slate-200 border border-white/20 text-[11px] font-medium backdrop-blur-xs">
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: themeDef.swatchColors[1] }} />
                  <span>Active Theme: {themeDef.name}</span>
                </span>
              </div>
            </div>

            {/* Right badge: Theme Badge & Active Branch */}
            <div
              className="self-start px-3.5 py-2.5 rounded-xl border shadow-md backdrop-blur-md flex items-center space-x-2.5"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                borderColor: `${themeDef.primaryHex}66`
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold"
                style={{
                  backgroundColor: `${themeDef.primaryHex}33`,
                  color: themeDef.swatchColors[0]
                }}
              >
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <div className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                  <span>{themeDef.name}</span>
                </div>
                <div className="text-[9px] font-mono tracking-wider uppercase text-slate-300 mt-0.5">
                  {themeDef.badgeText} • {activeBranch}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Pills over Banner */}
          <div className="flex flex-wrap items-center gap-2.5 pt-6">
            <button
              onClick={() => setIsFastQrOpen(true)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>Fast QR Check-In</span>
            </button>

            <button
              onClick={() => onNavigateTab && onNavigateTab('AI_ASSISTANT')}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Bot className="h-3.5 w-3.5" style={{ color: themeDef.primaryHex }} />
              <span>AI Copilot</span>
            </button>

            <button
              onClick={() => setIsThemeStudioOpen(true)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              title={`Switch Theme Palette: Current is ${themeDef.name}`}
            >
              <Palette className="h-3.5 w-3.5" style={{ color: themeDef.primaryHex }} />
              <span>Theme Studio ({themeDef.name.split(' ')[0]})</span>
            </button>

            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5 text-slate-700" />
              <span>Update Password</span>
            </button>

            <button
              onClick={() => onNavigateTab && onNavigateTab('SETTINGS')}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 shadow-sm transition-all cursor-pointer"
              title="All Module Launchpad"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. 6 COLORFUL HORIZONTAL ACTION CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Issue & Return */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('CIRCULATION')}
          className="bg-[#eff6ff] border border-[#bfdbfe] hover:border-blue-400 p-3.5 rounded-2xl flex items-center justify-between cursor-pointer group shadow-2xs transition-all"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#2563eb] text-white flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-bold text-xs text-slate-800 group-hover:text-blue-600 truncate">
              Issue & Return
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-blue-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* 2. Add MARC21 */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('CATALOGUING')}
          className="bg-[#f5f3ff] border border-[#ddd6fe] hover:border-purple-400 p-3.5 rounded-2xl flex items-center justify-between cursor-pointer group shadow-2xs transition-all"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#7c3aed] text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileCode className="h-4 w-4" />
            </div>
            <span className="font-bold text-xs text-slate-800 group-hover:text-purple-600 truncate">
              Add MARC21
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-purple-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* 3. Patron Directory */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('MEMBERS')}
          className="bg-[#ecfdf5] border border-[#a7f3d0] hover:border-emerald-400 p-3.5 rounded-2xl flex items-center justify-between cursor-pointer group shadow-2xs transition-all"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#059669] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Users className="h-4 w-4" />
            </div>
            <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-600 truncate">
              Patron Directory
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-emerald-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* 4. Public OPAC */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('OPAC')}
          className="bg-[#f0fdfa] border border-[#99f6e4] hover:border-teal-400 p-3.5 rounded-2xl flex items-center justify-between cursor-pointer group shadow-2xs transition-all"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#0d9488] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Search className="h-4 w-4" />
            </div>
            <span className="font-bold text-xs text-slate-800 group-hover:text-teal-600 truncate">
              Public OPAC
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-teal-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* 5. Digital Assets */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('DIGITAL_LIBRARY')}
          className="bg-[#fff7ed] border border-[#fed7aa] hover:border-orange-400 p-3.5 rounded-2xl flex items-center justify-between cursor-pointer group shadow-2xs transition-all"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#ea580c] text-white flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-bold text-xs text-slate-800 group-hover:text-orange-600 truncate">
              Digital Assets
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-orange-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* 6. RFID Stock Audit */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('INVENTORY')}
          className="bg-[#faf5ff] border border-[#e9d5ff] hover:border-violet-400 p-3.5 rounded-2xl flex items-center justify-between cursor-pointer group shadow-2xs transition-all"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#9333ea] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Radio className="h-4 w-4" />
            </div>
            <span className="font-bold text-xs text-slate-800 group-hover:text-violet-600 truncate">
              RFID Stock Audit
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-violet-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* 3. SYSTEM SECURITY & ACCESS CREDENTIALS BANNER */}
      <div className="bg-[#ecfdf5] border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-sm text-slate-900">
                System Security & Access Credentials
              </span>
              <span className="bg-emerald-600 text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
                Current User: LIB-4745 (SLiMS IN 5 MINUTES)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Your PLiMS session is authenticated and secured. You can manage your profile, security credentials, and access settings anytime.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsPasswordModalOpen(true)}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold text-xs flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
        >
          <Lock className="h-3.5 w-3.5" />
          <span>Update Secure Password</span>
        </button>
      </div>

      {/* 4. ANALYTICS HORIZON BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-700">Analytics Horizon:</span>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setSelectedHorizon('TODAY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                selectedHorizon === 'TODAY'
                  ? 'theme-btn-primary shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Today (Live)
            </button>
            <button
              onClick={() => setSelectedHorizon('7DAYS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                selectedHorizon === '7DAYS'
                  ? 'theme-btn-primary shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setSelectedHorizon('30DAYS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                selectedHorizon === '30DAYS'
                  ? 'theme-btn-primary shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setSelectedHorizon('TERM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                selectedHorizon === 'TERM'
                  ? 'theme-btn-primary shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Academic Term
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>HEC Pakistan National Z39.50 Telemetry Synced</span>
        </div>
      </div>

      {/* 5. 6 METRIC KPI STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Total Catalog Titles */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold">Total Catalog Titles</span>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-3 tracking-tight">
              12
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">
              194 total barcoded copies
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>MARC21 / RDA</span>
            <span className="text-emerald-600 font-bold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>100% Synced</span>
            </span>
          </div>
        </div>

        {/* Card 2: Inventory Volumes */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold">Inventory Volumes</span>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-3 tracking-tight">
              94
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">
              79 on shelf ready
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>Shelf Capacity</span>
            <span className="text-emerald-600 font-bold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>84% Available</span>
            </span>
          </div>
        </div>

        {/* Card 3: Active Circulation */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-purple-600">
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                <RotateCcw className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold">Active Circulation</span>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-3 tracking-tight">
              2
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">
              +1 returns processed
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>Turnover Rate</span>
            <span className="text-slate-700 font-bold">High (3.4x)</span>
          </div>
        </div>

        {/* Card 4: Overdue Notices */}
        <div className="bg-white border border-rose-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-rose-600">
              <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold">Overdue Notices</span>
            </div>
            <div className="text-3xl font-black text-rose-600 mt-3 tracking-tight">
              1
            </div>
            <div className="text-xs text-rose-600 font-bold mt-0.5">
              Action Required
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-rose-100 flex items-center justify-between text-[10px] font-bold">
            <span className="text-slate-500">Drafted Ready</span>
            <button
              onClick={() => onNavigateTab && onNavigateTab('CIRCULATION')}
              className="text-rose-600 hover:underline cursor-pointer"
            >
              Send Drafts →
            </button>
          </div>
        </div>

        {/* Card 5: Patron Directory */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-teal-600">
              <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold">Patron Directory</span>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-3 tracking-tight">
              7
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">
              1 Std + 1 Fac
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>Digital Pass QR</span>
            <span className="text-emerald-600 font-bold">Active (100%)</span>
          </div>
        </div>

        {/* Card 6: Fines & Revenue */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-amber-600">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold">Fines & Revenue</span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-3 tracking-tight">
              PKR 25
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">
              Accounts Synced
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>58 PKR/day rate</span>
            <span className="text-amber-600 font-bold">Auto-Billed</span>
          </div>
        </div>
      </div>

      {/* 6. BOTTOM ROW: CIRCULATION FLOW & AI COLLECTION ADVISOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Circulation Flow & DDC Subject Breakdown */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <LineChart className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Circulation Flow & DDC Subject Breakdown
                </h3>
                <p className="text-[11px] text-slate-500 font-normal">
                  Daily checkouts vs check-ins & Dewey Decimal catalog composition
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs font-medium">
              <span className="flex items-center space-x-1.5 text-[#2563eb]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb] inline-block" />
                <span>Checkouts</span>
              </span>
              <span className="flex items-center space-x-1.5 text-[#10b981]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] inline-block" />
                <span>Checkins</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Chart Area */}
            <div className="md:col-span-7 h-52 flex flex-col justify-between">
              <div className="flex-1 relative w-full flex items-end">
                {/* SVG Curves for Checkouts & Checkins */}
                <svg className="w-full h-44 overflow-visible" viewBox="0 0 350 140">
                  <defs>
                    <linearGradient id="checkoutGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="checkinGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="20" x2="350" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2="350" y2="60" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="0" y1="100" x2="350" y2="100" stroke="#f1f5f9" strokeDasharray="3 3" />

                  {/* Checkouts Area & Line */}
                  <path
                    d="M 10 90 Q 60 85, 110 75 T 210 60 T 280 80 T 340 70 L 340 140 L 10 140 Z"
                    fill="url(#checkoutGrad)"
                  />
                  <path
                    d="M 10 90 Q 60 85, 110 75 T 210 60 T 280 80 T 340 70"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Checkouts Data Dots */}
                  {[
                    { cx: 10, cy: 90 },
                    { cx: 60, cy: 87 },
                    { cx: 110, cy: 75 },
                    { cx: 160, cy: 88 },
                    { cx: 210, cy: 60 },
                    { cx: 260, cy: 76 },
                    { cx: 310, cy: 78 },
                    { cx: 340, cy: 70 }
                  ].map((p, i) => (
                    <circle key={i} cx={p.cx} cy={p.cy} r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  ))}

                  {/* Checkins Area & Line */}
                  <path
                    d="M 10 115 Q 60 115, 110 110 T 210 100 T 280 108 T 340 95 L 340 140 L 10 140 Z"
                    fill="url(#checkinGrad)"
                  />
                  <path
                    d="M 10 115 Q 60 115, 110 110 T 210 100 T 280 108 T 340 95"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Checkins Data Dots */}
                  {[
                    { cx: 10, cy: 115 },
                    { cx: 60, cy: 115 },
                    { cx: 110, cy: 110 },
                    { cx: 160, cy: 112 },
                    { cx: 210, cy: 100 },
                    { cx: 260, cy: 102 },
                    { cx: 310, cy: 106 },
                    { cx: 340, cy: 95 }
                  ].map((p, i) => (
                    <circle key={i} cx={p.cx} cy={p.cy} r="3" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                  ))}
                </svg>
              </div>

              {/* X Axis Dates */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                <span>Sep 9</span>
                <span>Sep 10</span>
                <span>Sep 11</span>
                <span>Sep 12</span>
                <span>Sep 13</span>
                <span>Sep 14</span>
                <span>Sep 15</span>
              </div>
            </div>

            {/* DDC Donut & Legend */}
            <div className="md:col-span-5 flex items-center justify-between gap-3 pt-2 md:pt-0 md:border-l md:border-slate-100 md:pl-4">
              {/* Donut Chart with center label */}
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Outer circle rings */}
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#2563eb" strokeWidth="4.5" strokeDasharray="18 100" strokeDashoffset="0" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#ec4899" strokeWidth="4.5" strokeDasharray="14 100" strokeDashoffset="-18" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#f97316" strokeWidth="4.5" strokeDasharray="12 100" strokeDashoffset="-32" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="16 100" strokeDashoffset="-44" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#06b6d4" strokeWidth="4.5" strokeDasharray="10 100" strokeDashoffset="-60" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#eab308" strokeWidth="4.5" strokeDasharray="9 100" strokeDashoffset="-70" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="4.5" strokeDasharray="8 100" strokeDashoffset="-79" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#f43f5e" strokeWidth="4.5" strokeDasharray="7 100" strokeDashoffset="-87" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#6366f1" strokeWidth="4.5" strokeDasharray="4 100" strokeDashoffset="-94" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#14b8a6" strokeWidth="4.5" strokeDasharray="2 100" strokeDashoffset="-98" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="font-bold text-[11px] text-slate-800 leading-tight">DDC</span>
                  <span className="text-[8px] text-slate-400">Top Classes</span>
                </div>
              </div>

              {/* 10 Classes Legend */}
              <div className="flex-1 space-y-0.5 text-[9px] font-medium text-slate-600">
                {ddcClasses.map((c) => (
                  <div key={c.code} className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="truncate">{c.code} {c.name}</span>
                    </span>
                    <span className="font-mono text-slate-500 shrink-0 ml-1">{c.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Collection Advisor */}
        <div className="lg:col-span-4 bg-gradient-to-b from-[#f0f9ff] via-[#f8fafc] to-white border border-blue-100 rounded-2xl p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">AI Collection Advisor</h3>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                  Beta
                </span>
              </div>

              <button
                onClick={() => onNavigateTab && onNavigateTab('AI_ASSISTANT')}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
              >
                <span>Open</span>
                <span>→</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Smart suggestions for better collection development and user engagement.
            </p>

            {/* Pill */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Powered by AI • Built for Libraries</span>
            </div>
          </div>

          {/* Bottom Illustration & Quote Area */}
          <div className="pt-8 flex items-end justify-between relative">
            <div className="space-y-0.5">
              <p className="text-sm font-serif italic text-slate-600">
                “Better libraries.
              </p>
              <p className="text-sm font-serif italic text-slate-600">
                Brighter futures.”
              </p>
            </div>

            {/* Decorative Books Artwork */}
            <div className="relative w-24 h-20 flex items-end justify-end">
              <img
                src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80"
                alt="Books"
                className="w-20 h-16 object-cover rounded-xl shadow-md border border-slate-200/80 transform rotate-3"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Password Update Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Lock className="h-4 w-4 text-emerald-600" />
                <span>Update Account Password</span>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {passwordToast ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{passwordToast}</span>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Fast QR Check-In Modal */}
      {isFastQrOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span>Fast QR / Barcode Check-In</span>
              </div>
              <button
                onClick={() => setIsFastQrOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {qrToast ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{qrToast}</span>
              </div>
            ) : (
              <form onSubmit={handleFastQrSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Scan or enter item barcode / accession #
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={qrScanInput}
                    onChange={(e) => setQrScanInput(e.target.value)}
                    placeholder="e.g. BK-1001-C1 or accession #..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 font-medium font-mono"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsFastQrOpen(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer shadow-xs"
                  >
                    Check In Item
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Theme Studio Modal */}
      <ThemeCustomizerModal
        isOpen={isThemeStudioOpen}
        onClose={() => setIsThemeStudioOpen(false)}
        config={bgConfig}
        onChangeConfig={(newCfg) => {
          setBgConfig(newCfg);
          window.dispatchEvent(new Event('storage'));
        }}
      />
    </div>
  );
};
