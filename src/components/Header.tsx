import React, { useState } from 'react';
import { Search, LogOut, Building2, Palette, Globe, Bell, ChevronRight, Sparkles, CheckCircle2, AlertTriangle, Info, BookOpen, Sliders, Scale, User } from 'lucide-react';
import { UserProfile, AppTheme, SystemSettings } from '../types/alims';
import pslimsLogo from '../assets/images/plims_emblem_logo_1788759356534.jpg';
import { AppLanguage, LANGUAGES, getTranslation } from '../utils/i18n';
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
  onUpdateUser
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [bgConfig, setBgConfig] = useState<MainPageBgConfig>(() => loadSavedBgConfig());
  const [isThemeStudioOpen, setIsThemeStudioOpen] = useState(false);
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const notifications = [
    { id: 1, type: 'warning', title: 'Overdue Circulation Alert', msg: '3 items overdue for member STU-2024-001 (Pakistan Campus)', time: '10m ago' },
    { id: 2, type: 'info', title: 'New Reservation Placed', msg: 'Quantum Computing Fundamentals reserved by Dr. Sarah', time: '42m ago' },
    { id: 3, type: 'ai', title: 'AI Cataloguing Completed', msg: 'Automated RDA metadata generated for 12 new acquisitions', time: '1h ago' }
  ];

  return (
    <header className="h-16 bg-[#121214] border-b border-[#27272a] px-6 flex items-center justify-between shrink-0 relative z-30">
      {/* Search & System Brand & Breadcrumb */}
      <div className="flex items-center space-x-4 rtl:space-x-reverse">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-2.5 rtl:space-x-reverse px-3.5 py-2 rounded-xl bg-[#09090b] border border-[#27272a] text-xs text-[#a1a1aa] hover:border-emerald-500/40 hover:text-white transition-all cursor-pointer w-56 md:w-64"
        >
          <Search className="h-3.5 w-3.5 text-emerald-400" />
          <span className="flex-1 text-left rtl:text-right truncate">
            {getTranslation(currentLanguage, 'search_placeholder')}
          </span>
          <kbd className="px-1.5 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-[10px] font-mono">⌘K</kbd>
        </button>

        {/* Breadcrumb Trail */}
        <div className="hidden lg:flex items-center space-x-2 text-xs text-[#a1a1aa]">
          <span className="font-semibold text-emerald-400">PLiMS</span>
          <ChevronRight className="h-3 w-3 text-[#52525b]" />
          <span className="capitalize font-mono text-[#fafafa] bg-[#18181b] px-2 py-0.5 rounded-lg border border-[#27272a]">
            {currentTab.toLowerCase().replace('_', ' ')}
          </span>
        </div>

        {/* System Badge */}
        <div className="hidden xl:flex items-center space-x-2 rtl:space-x-reverse px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <img src={pslimsLogo} alt="PLiMS Logo" className="w-5 h-5 rounded-full object-cover border border-emerald-500/40" />
          <span>PLiMS V4.1.1 PK edition</span>
        </div>

        {/* Branch Selector & Add Branch Button */}
        <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs bg-[#09090b] px-3 py-1.5 rounded-xl border border-[#27272a]">
            <Building2 className="h-3.5 w-3.5 text-blue-400" />
            <select
              value={activeBranch}
              onChange={(e) => onChangeBranch(e.target.value)}
              className="bg-transparent text-[#fafafa] font-medium focus:outline-none cursor-pointer text-xs"
            >
              {branches.map(b => (
                <option key={b} value={b} className="bg-[#121214] text-[#fafafa]">
                  {b}
                </option>
              ))}
            </select>
          </div>

          {onOpenAddBranchModal && (
            <button
              onClick={onOpenAddBranchModal}
              title="Add New Library Branch & Staff"
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-1 rtl:space-x-reverse transition-all cursor-pointer shadow-sm shrink-0"
            >
              <span>{getTranslation(currentLanguage, 'add_branch')}</span>
            </button>
          )}
        </div>
      </div>

      {/* User Actions, Notifications, Language & Theme Selector */}
      <div className="flex items-center space-x-3.5 rtl:space-x-reverse">
        {/* Notification Center */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (unreadCount > 0) setUnreadCount(0);
            }}
            className="p-2 rounded-xl bg-[#09090b] border border-[#27272a] text-[#a1a1aa] hover:text-emerald-400 hover:border-emerald-500/40 transition-all cursor-pointer relative"
            title="Notification Center & Alerts"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-[9px] font-bold text-black flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#121214] border border-[#27272a] shadow-2xl p-4 z-50 space-y-3">
              <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
                <div className="font-bold text-xs text-[#fafafa] flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-emerald-400" />
                  <span>PLiMS Notification Center</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                  Live System Stream
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#fafafa] flex items-center space-x-1.5">
                        {n.type === 'warning' ? <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> :
                         n.type === 'ai' ? <Sparkles className="h-3.5 w-3.5 text-purple-400" /> :
                         <Info className="h-3.5 w-3.5 text-blue-400" />}
                        <span>{n.title}</span>
                      </span>
                      <span className="text-[10px] text-[#71717a] font-mono">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-[#a1a1aa] leading-snug">{n.msg}</p>
                  </div>
                ))}
              </div>

              <div className="text-center pt-1 border-t border-[#27272a]">
                <span className="text-[10px] text-[#71717a]">All alerts synchronized with Audit Log</span>
              </div>
            </div>
          )}
        </div>

        {/* Language Switcher */}
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse bg-[#09090b] px-2.5 py-1.5 rounded-xl border border-[#27272a] text-xs">
          <Globe className="h-3.5 w-3.5 text-blue-400" />
          <select
            value={currentLanguage}
            onChange={(e) => onChangeLanguage(e.target.value as AppLanguage)}
            className="bg-transparent text-[#fafafa] font-medium focus:outline-none cursor-pointer text-xs"
            title="Switch Language / زبان منتخب کریں"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code} className="bg-[#121214] text-[#fafafa]">
                {lang.flag} {lang.nativeName}
              </option>
            ))}
          </select>
        </div>

        {/* Background Theme Studio Button */}
        <button
          onClick={() => setIsThemeStudioOpen(true)}
          className="p-2 rounded-xl bg-[#09090b] border border-blue-500/40 text-blue-400 hover:text-white hover:bg-blue-600/20 transition-all cursor-pointer relative"
          title="Change Main Page Background Theme, Image or Video Loop"
        >
          <Sliders className="h-4 w-4" />
        </button>

        {/* Open Source License Button */}
        <button
          onClick={() => setIsLicenseOpen(true)}
          className="p-2 rounded-xl bg-[#09090b] border border-emerald-500/40 text-emerald-400 hover:text-white hover:bg-emerald-600/20 transition-all cursor-pointer relative"
          title="View PLiMS Open Source Software License (MIT)"
        >
          <Scale className="h-4 w-4" />
        </button>

        {/* Librarian Theme Switcher */}
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse bg-[#09090b] px-2.5 py-1.5 rounded-xl border border-[#27272a] text-xs">
          <Palette className="h-3.5 w-3.5 text-emerald-400" />
          <select
            value={currentTheme}
            onChange={(e) => onChangeTheme(e.target.value as AppTheme)}
            className="bg-transparent text-[#fafafa] font-medium focus:outline-none cursor-pointer text-xs"
            title="Choose Library System Theme"
          >
            <option value="pakistan-flag" className="bg-[#121214] text-[#fafafa]">🇵🇰 Pakistani Flag (Green & White)</option>
            <option value="pakistan-dark" className="bg-[#121214] text-[#fafafa]">🇵🇰 Emerald Night (Dark Green)</option>
            <option value="light-clean" className="bg-[#121214] text-[#fafafa]">☀️ Academic Clean (Light)</option>
            <option value="dark-slate" className="bg-[#121214] text-[#fafafa]">🌙 Executive Slate (Dark)</option>
            <option value="high-contrast" className="bg-[#121214] text-[#fafafa]">⚡ High Contrast Accessibility</option>
          </select>
        </div>

        <button
          onClick={() => setIsProfileModalOpen(true)}
          title="Click to manage profile, location & theme"
          className="flex items-center space-x-3 rtl:space-x-reverse text-right rtl:text-left pl-1 group p-1 rounded-xl hover:bg-zinc-800/60 transition-all cursor-pointer"
        >
          <div className="hidden sm:block">
            <div className="text-xs font-bold text-[#fafafa] group-hover:text-emerald-400 transition-colors">{currentUser.name}</div>
            <div className="text-[10px] text-[#a1a1aa] font-mono">{currentUser.role} • {currentUser.memberCode}</div>
          </div>
          <img
            src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={currentUser.name}
            className="w-9 h-9 rounded-full object-cover border border-emerald-500/30 group-hover:border-emerald-400 shadow-md transition-all"
          />
        </button>

        <button
          onClick={onLogout}
          title={getTranslation(currentLanguage, 'sign_out')}
          className="p-2 rounded-xl bg-[#09090b] border border-[#27272a] text-[#a1a1aa] hover:text-red-400 hover:border-red-500/40 transition-all cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* Main Page Theme Customizer Modal */}
      <ThemeCustomizerModal
        isOpen={isThemeStudioOpen}
        onClose={() => setIsThemeStudioOpen(false)}
        config={bgConfig}
        onChangeConfig={setBgConfig}
      />

      {/* User Profile & Theme Preferences Modal */}
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

      {/* Open Source License Modal */}
      <LicenseModal
        isOpen={isLicenseOpen}
        onClose={() => setIsLicenseOpen(false)}
      />
    </header>
  );
};


