import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Building2,
  Users,
  Globe,
  Sun,
  Bell,
  ChevronDown,
  BookOpen,
  LogOut,
  Sliders,
  CheckCircle2,
  Plus,
  AlertTriangle,
  Info,
  ShieldCheck,
  User,
  ExternalLink,
  Palette
} from 'lucide-react';
import { UserProfile, AppTheme, SystemSettings } from '../types/alims';
import { AppLanguage, LANGUAGES } from '../utils/i18n';
import { getThemeConfig } from '../utils/themeConfig';
import {
  MainPageBgConfig,
  loadSavedBgConfig,
  ThemeCustomizerModal
} from './MainThemeBgSelector';
import { LicenseModal } from './LicenseModal';
import { UserProfileModal } from './UserProfileModal';

interface HeaderProps {
  currentUser: UserProfile;
  activeBranch: string;
  branches: string[];
  currentTheme: AppTheme;
  currentLanguage: AppLanguage;
  currentTab?: string;
  settings?: SystemSettings;
  onChangeTheme: (theme: AppTheme) => void;
  onChangeLanguage: (lang: AppLanguage) => void;
  onChangeBranch: (branch: string) => void;
  onOpenCommandPalette: () => void;
  onLogout: () => void;
  onOpenAddBranchModal?: () => void;
  onUpdateUser?: (id: string, updated: Partial<UserProfile>) => void;
  onNavigateTab?: (tab: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeBranch,
  branches,
  currentTheme,
  currentLanguage,
  currentTab = 'DASHBOARD',
  settings,
  onChangeTheme,
  onChangeLanguage,
  onChangeBranch,
  onOpenCommandPalette,
  onLogout,
  onOpenAddBranchModal,
  onUpdateUser,
  onNavigateTab
}) => {
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');

  const [bgConfig, setBgConfig] = useState<MainPageBgConfig>(() => loadSavedBgConfig());
  const [isThemeStudioOpen, setIsThemeStudioOpen] = useState(false);
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const activeThemeDef = getThemeConfig(currentTheme);

  const branchRef = useRef<HTMLDivElement>(null);
  const staffRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
        setShowBranchDropdown(false);
      }
      if (staffRef.current && !staffRef.current.contains(e.target as Node)) {
        setShowStaffDropdown(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+Q / ⌘Q / ⌘K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'q' || e.key === 'Q' || e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        onOpenCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenCommandPalette]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onNavigateTab) {
      onNavigateTab('OPAC');
    }
  };

  const notifications = [
    {
      id: 1,
      title: 'Circulation Audit Active',
      msg: 'Stock audit in progress for Engineering Wing.',
      time: '10m ago',
      type: 'info'
    },
    {
      id: 2,
      title: 'Overdue Notice Queued',
      msg: '1 patron loan exceeded due date. Notice ready.',
      time: '24m ago',
      type: 'warning'
    },
    {
      id: 3,
      title: 'Z39.50 Telemetry Synced',
      msg: 'HEC central union database records refreshed.',
      time: '1h ago',
      type: 'info'
    }
  ];

  return (
    <header
      className={`h-16 px-4 lg:px-6 shrink-0 relative z-40 flex items-center justify-between gap-4 select-none shadow-xs transition-colors duration-300 ${activeThemeDef.isDark ? 'text-slate-100' : 'text-slate-800'}`}
      style={{
        backgroundColor: activeThemeDef.headerBgHex,
        borderBottom: `1px solid ${activeThemeDef.headerBorderHex}`
      }}
    >
      {/* 1. LEFT: Open Book Logo + PLiMS Title & Subtitle */}
      <div className="flex items-center space-x-3 shrink-0">
        <div
          onClick={() => onNavigateTab && onNavigateTab('DASHBOARD')}
          className="flex items-center space-x-2.5 cursor-pointer group"
          title="PLiMS Dashboard"
        >
          {/* Authentic Original Circular Emblem Logo */}
          <img
            src="/plims_logo.jpg"
            alt="PLiMS Emblem Logo"
            className="w-10 h-10 rounded-full object-cover shadow-xs border group-hover:scale-105 transition-transform shrink-0"
            style={{
              borderColor: activeThemeDef.primaryBorderHex,
              boxShadow: `0 0 0 2px ${activeThemeDef.primaryHex}40`
            }}
          />

          <div>
            <div className="flex items-center space-x-1.5 leading-none">
              <span
                className="font-black text-xl tracking-tight font-sans"
                style={{ color: activeThemeDef.isDark ? '#f8fafc' : '#0f2942' }}
              >
                PLiMS
              </span>
              <span
                className="text-[11px] font-bold font-mono px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: activeThemeDef.primaryLightHex,
                  color: activeThemeDef.primaryHex
                }}
              >
                V4.1.1
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium tracking-tight mt-0.5 whitespace-nowrap">
              Pakistan Library Management System
            </div>
          </div>
        </div>
      </div>

      {/* 2. CENTER: Global Search Bar */}
      <div className="flex-1 max-w-md hidden md:flex items-center">
        <form
          onSubmit={handleSearchSubmit}
          className="w-full relative flex items-center"
        >
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              // Optionally trigger command palette
            }}
            placeholder="Global Search (Ctrl + Q)..."
            className="w-full pl-10 pr-12 py-2 rounded-xl bg-[#f1f5f9] hover:bg-[#eaf0f6] focus:bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all font-medium"
          />
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="absolute right-2 px-1.5 py-0.5 rounded-md bg-slate-200/70 text-[10px] font-mono text-slate-600 hover:bg-slate-300 transition-colors"
            title="Open Command Palette"
          >
            ⌘K
          </button>
        </form>
      </div>

      {/* 3. RIGHT CONTROLS */}
      <div className="flex items-center space-x-2.5 shrink-0">
        {/* Public OPAC Quick Nav */}
        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('OPAC')}
          className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-xs font-semibold text-emerald-800 transition-colors cursor-pointer"
          title="Open Public OPAC Discovery Portal"
        >
          <Search className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-[11px]">Public OPAC</span>
        </button>

        {/* Branch Selector Pill */}
        <div className="relative" ref={branchRef}>
          <button
            onClick={() => setShowBranchDropdown(!showBranchDropdown)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#f1f5f9] hover:bg-slate-200/70 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="max-w-[140px] truncate text-[11px]">{activeBranch}</span>
            <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
          </button>

          {showBranchDropdown && (
            <div className="absolute right-0 mt-1.5 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 mb-1">
                <span>Campus Library Nodes</span>
                {onOpenAddBranchModal && (
                  <button
                    onClick={() => {
                      setShowBranchDropdown(false);
                      onOpenAddBranchModal();
                    }}
                    className="text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-0.5 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add</span>
                  </button>
                )}
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {branches.map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      onChangeBranch(b);
                      setShowBranchDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      activeBranch === b
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{b}</span>
                    {activeBranch === b && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Branch / Staff Pill */}
        <div className="relative hidden xl:block" ref={staffRef}>
          <button
            onClick={() => setShowStaffDropdown(!showStaffDropdown)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#f1f5f9] hover:bg-slate-200/70 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <Users className="h-3.5 w-3.5 text-purple-600 shrink-0" />
            <span className="text-[11px]">Branch / Staff</span>
            <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
          </button>

          {showStaffDropdown && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-xs">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Staff Desk Actions
              </div>
              <button
                onClick={() => {
                  setShowStaffDropdown(false);
                  onNavigateTab && onNavigateTab('CIRCULATION');
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Circulation Desk
              </button>
              <button
                onClick={() => {
                  setShowStaffDropdown(false);
                  onNavigateTab && onNavigateTab('MEMBERS');
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Manage Staff & Patrons
              </button>
              {onOpenAddBranchModal && (
                <button
                  onClick={() => {
                    setShowStaffDropdown(false);
                    onOpenAddBranchModal();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 font-semibold transition-colors cursor-pointer"
                >
                  + Add Staff / Branch
                </button>
              )}
            </div>
          )}
        </div>

        {/* Language Pill */}
        <div className="relative hidden sm:block" ref={langRef}>
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#f1f5f9] hover:bg-slate-200/70 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <span className="text-[11px]">
              {LANGUAGES.find((l) => l.code === currentLanguage)?.name || 'English'}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
          </button>

          {showLangDropdown && (
            <div className="absolute right-0 mt-1.5 w-40 rounded-2xl bg-white border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onChangeLanguage(lang.code as AppLanguage);
                    setShowLangDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center space-x-2 transition-colors cursor-pointer ${
                    currentLanguage === lang.code
                      ? 'bg-teal-50 text-teal-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Studio / Librarian Theme Palette Pill */}
        <button
          onClick={() => setIsThemeStudioOpen(true)}
          className="h-8 px-2.5 rounded-full border flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 shadow-2xs hover:scale-105"
          style={{
            backgroundColor: activeThemeDef.primaryLightHex,
            borderColor: activeThemeDef.primaryBorderHex,
            color: activeThemeDef.primaryHex
          }}
          title={`Librarian Visual Theme: ${activeThemeDef.name}. Click to change color palette.`}
        >
          <div className="flex items-center -space-x-1">
            <div
              className="w-2.5 h-2.5 rounded-full border border-white shadow-xs"
              style={{ backgroundColor: activeThemeDef.swatchColors[0] }}
            />
            <div
              className="w-2.5 h-2.5 rounded-full border border-white shadow-xs"
              style={{ backgroundColor: activeThemeDef.swatchColors[1] }}
            />
          </div>
          <Palette className="h-3.5 w-3.5" style={{ color: activeThemeDef.primaryHex }} />
          <span className="hidden xl:inline text-[11px] font-bold max-w-[110px] truncate">
            {activeThemeDef.name.split(' ')[0]}
          </span>
        </button>

        {/* Notifications Bell with Red Badge */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (unreadCount > 0) setUnreadCount(0);
            }}
            className="w-8 h-8 rounded-full bg-[#f1f5f9] hover:bg-slate-200/70 border border-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer relative shrink-0"
            title="System Telemetry Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 z-50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="font-bold text-xs text-slate-800 flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-blue-600" />
                  <span>PLiMS Live Telemetry</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-mono bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                  System Online
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span className="flex items-center space-x-1.5">
                        {n.type === 'warning' ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        ) : (
                          <Info className="h-3.5 w-3.5 text-blue-500" />
                        )}
                        <span>{n.title}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">{n.msg}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vertical Separator */}
        <div className="h-6 w-px bg-slate-200 mx-0.5" />

        {/* User Capsule: Avatar + Hi, Aijaz Akhter / Librarian (Admin) */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-left"
          >
            <div
              className="w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 ring-1 ring-slate-200"
              style={{ background: activeThemeDef.heroGradient }}
            >
              <User className="h-4 w-4 text-white" />
            </div>

            <div className="hidden lg:block leading-tight">
              <div className="font-bold text-xs text-slate-800 truncate max-w-[130px]">
                Hi, {currentUser.name || 'Aijaz Akhter'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium truncate max-w-[130px]">
                {currentUser.designation || 'Librarian (Admin)'}
              </div>
            </div>

            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 hidden lg:block" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-xs">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <div className="font-bold text-slate-800">{currentUser.name}</div>
                <div className="text-[11px] text-slate-500">{currentUser.email || 'ahmedaniaijazakhter@gmail.com'}</div>
                <span className="inline-block mt-1 text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                  {currentUser.role || 'CHIEF_LIBRARIAN'}
                </span>
              </div>

              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  setIsProfileModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center space-x-2"
              >
                <User className="h-3.5 w-3.5 text-slate-500" />
                <span>My Profile & Card</span>
              </button>

              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  onNavigateTab && onNavigateTab('OPAC');
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center space-x-2"
              >
                <Search className="h-3.5 w-3.5 text-emerald-600" />
                <span>Public OPAC Portal</span>
              </button>

              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  setIsThemeStudioOpen(true);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center space-x-2"
              >
                <Sliders className="h-3.5 w-3.5 text-slate-500" />
                <span>Theme Studio</span>
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  onLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold transition-colors cursor-pointer flex items-center space-x-2"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out Session</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Theme Studio Modal */}
      <ThemeCustomizerModal
        isOpen={isThemeStudioOpen}
        onClose={() => setIsThemeStudioOpen(false)}
        config={bgConfig}
        onChangeConfig={(newCfg) => {
          setBgConfig(newCfg);
          window.dispatchEvent(new Event('storage'));
        }}
        currentTheme={currentTheme}
        onChangeTheme={onChangeTheme}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={onUpdateUser}
        onOpenThemeStudio={() => {
          setIsProfileModalOpen(false);
          setIsThemeStudioOpen(true);
        }}
        settings={settings}
      />

      {/* License Modal */}
      <LicenseModal isOpen={isLicenseOpen} onClose={() => setIsLicenseOpen(false)} />
    </header>
  );
};
