import React, { useState } from 'react';
import {
  LayoutDashboard,
  Search,
  BookOpen,
  Users,
  Repeat,
  FileCode,
  FolderKanban,
  BarChart3,
  Sparkles,
  Settings,
  BookMarked,
  Database,
  HardDrive,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Newspaper,
  Tags,
  ShieldCheck,
  QrCode,
  HelpCircle,
  Bell
} from 'lucide-react';

import pslimsLogo from '../assets/images/plims_emblem_logo_1788759356534.jpg';
import { AppLanguage, getTranslation } from '../utils/i18n';

export type ModuleTab =
  | 'MY_LIBRARY'
  | 'DASHBOARD'
  | 'OPAC'
  | 'CATALOGUING'
  | 'AUTHORITY'
  | 'CIRCULATION'
  | 'MEMBERS'
  | 'DIGITAL_LIBRARY'
  | 'DIGITAL'
  | 'ACQUISITION'
  | 'ACQUISITIONS'
  | 'SERIALS'
  | 'INVENTORY'
  | 'STOCK'
  | 'BARCODES'
  | 'REPORTS'
  | 'IMPORT_EXPORT'
  | 'BACKUP_LOGS'
  | 'AI_ASSISTANT'
  | 'SETTINGS'
  | 'HELP_DOCS';

interface SidebarProps {
  activeTab?: string;
  currentTab?: string;
  onSelectTab: (tab: ModuleTab) => void;
  userRole?: string;
  currentLanguage?: AppLanguage;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  currentTab,
  onSelectTab,
  userRole = 'LIBRARIAN',
  currentLanguage = 'en'
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const selected = activeTab || currentTab || 'DASHBOARD';
  const isPatron = ['STUDENT', 'FACULTY', 'RESEARCH_SCHOLAR', 'GUEST'].includes(userRole);
  const isSuperAdmin = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'CHIEF_LIBRARIAN', 'PRINCIPAL'].includes(userRole);

  const t = (key: string) => getTranslation(currentLanguage, key);

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-[#121214] border-r border-[#27272a] flex flex-col justify-between shrink-0 h-full transition-all duration-300 relative z-20`}>
      {/* Brand Header */}
      <div className="p-3.5 border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center space-x-3 rtl:space-x-reverse overflow-hidden">
          <img
            src={pslimsLogo}
            alt="PLiMS Logo"
            className="w-10 h-10 rounded-full object-cover border border-emerald-500/50 shadow-md shadow-emerald-500/20 shrink-0"
          />
          {!isCollapsed && (
            <div className="truncate">
              <div className="font-serif font-bold text-sm text-[#fafafa] tracking-tight truncate">PLiMS V4.1.1</div>
              <div className="text-[10px] text-emerald-400 font-mono truncate">PK edition</div>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-[#09090b] border border-[#27272a] text-[#a1a1aa] hover:text-white transition-all cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {/* Section: Core Navigation */}
        {!isCollapsed && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-2 pb-0.5">Core Modules</div>}

        {/* Main Dashboard - Available to all authenticated users */}
        <button
          onClick={() => onSelectTab('DASHBOARD')}
          title={t('dashboard')}
          className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selected === 'DASHBOARD'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa]'
          }`}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0 text-emerald-400" />
          {!isCollapsed && <span className="truncate">{t('dashboard')}</span>}
        </button>

        {isPatron && (
          <button
            onClick={() => onSelectTab('MY_LIBRARY')}
            title={t('my_library')}
            className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selected === 'MY_LIBRARY'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa]'
            }`}
          >
            <BookMarked className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="truncate">{t('my_library')}</span>}
          </button>
        )}

        <button
          onClick={() => onSelectTab('OPAC')}
          title={t('opac')}
          className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selected === 'OPAC'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa]'
          }`}
        >
          <Search className="h-4 w-4 text-amber-400 shrink-0" />
          {!isCollapsed && <span className="truncate">{t('opac')}</span>}
        </button>

        {!isPatron && (
          <>
            <button
              onClick={() => onSelectTab('CIRCULATION')}
              title={t('circulation')}
              className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selected === 'CIRCULATION'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa]'
              }`}
            >
              <Repeat className="h-4 w-4 text-emerald-400 shrink-0" />
              {!isCollapsed && <span className="truncate">{t('circulation')}</span>}
            </button>

            <button
              onClick={() => onSelectTab('CATALOGUING')}
              title={t('cataloguing')}
              className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selected === 'CATALOGUING'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa]'
              }`}
            >
              <FileCode className="h-4 w-4 text-blue-400 shrink-0" />
              {!isCollapsed && <span className="truncate">{t('cataloguing')}</span>}
            </button>

            <button
              onClick={() => onSelectTab('AUTHORITY')}
              title={t('authority_control')}
              className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selected === 'AUTHORITY'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa]'
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-teal-400 shrink-0" />
              {!isCollapsed && <span className="truncate">{t('authority_control')}</span>}
            </button>

            <button
              onClick={() => onSelectTab('MEMBERS')}
              title={t('users')}
              className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selected === 'MEMBERS'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa]'
              }`}
            >
              <Users className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="truncate">{t('users')}</span>}
            </button>
          </>
        )}

        {/* Section: Collections & Serials */}
        {!isCollapsed && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-2 pb-0.5">Collections & Digital</div>}

        <button
          onClick={() => onSelectTab('DIGITAL_LIBRARY')}
          title={t('digital_library')}
          className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selected === 'DIGITAL_LIBRARY' || selected === 'DIGITAL'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa]'
          }`}
        >
          <BookOpen className="h-4 w-4 text-indigo-400 shrink-0" />
          {!isCollapsed && <span className="truncate">{t('digital_library')}</span>}
        </button>

        {!isPatron && (
          <>
            <button
              onClick={() => onSelectTab('ACQUISITIONS')}
              title={t('acquisition')}
              className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selected === 'ACQUISITION' || selected === 'ACQUISITIONS'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa]'
              }`}
            >
              <ShoppingCart className="h-4 w-4 text-emerald-400 shrink-0" />
              {!isCollapsed && <span className="truncate">{t('acquisition')}</span>}
            </button>

            <button
              onClick={() => onSelectTab('SERIALS')}
              title={t('serials')}
              className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selected === 'SERIALS'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa]'
              }`}
            >
              <Newspaper className="h-4 w-4 text-rose-400 shrink-0" />
              {!isCollapsed && <span className="truncate">{t('serials')}</span>}
            </button>
          </>
        )}

        {/* Section: Technical Tools & Reports */}
        {!isPatron && (
          <>
            {!isCollapsed && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-2 pb-0.5">Tools & Analytics</div>}

            <button
              onClick={() => onSelectTab('INVENTORY')}
              title={t('stock_verification')}
              className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selected === 'INVENTORY' || selected === 'STOCK'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa]'
              }`}
            >
              <FolderKanban className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="truncate">{t('stock_verification')}</span>}
            </button>

            <button
              onClick={() => onSelectTab('BARCODES')}
              title={t('barcode_gen')}
              className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selected === 'BARCODES'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa]'
              }`}
            >
              <QrCode className="h-4 w-4 text-cyan-400 shrink-0" />
              {!isCollapsed && <span className="truncate">{t('barcode_gen')}</span>}
            </button>

            <button
              onClick={() => onSelectTab('REPORTS')}
              title={t('reports')}
              className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selected === 'REPORTS'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa]'
              }`}
            >
              <BarChart3 className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="truncate">{t('reports')}</span>}
            </button>

            <button
              onClick={() => onSelectTab('IMPORT_EXPORT')}
              title={t('import_export')}
              className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selected === 'IMPORT_EXPORT'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa]'
              }`}
            >
              <Database className="h-4 w-4 text-emerald-400 shrink-0" />
              {!isCollapsed && <span className="truncate">{t('import_export')}</span>}
            </button>

            <button
              onClick={() => onSelectTab('BACKUP_LOGS')}
              title={t('backup_logs')}
              className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selected === 'BACKUP_LOGS'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa]'
              }`}
            >
              <HardDrive className="h-4 w-4 text-purple-400 shrink-0" />
              {!isCollapsed && <span className="truncate">{t('backup_logs')}</span>}
            </button>
          </>
        )}

        {/* Section: Intelligence & Admin */}
        {!isCollapsed && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-2 pb-0.5">AI & System</div>}

        <button
          onClick={() => onSelectTab('AI_ASSISTANT')}
          title={t('ai_assistant')}
          className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selected === 'AI_ASSISTANT'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa]'
          }`}
        >
          <Sparkles className="h-4 w-4 text-purple-300 shrink-0" />
          {!isCollapsed && <span className="truncate">{t('ai_assistant')}</span>}
        </button>

        <button
          onClick={() => onSelectTab('SETTINGS')}
          title={t('settings')}
          className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selected === 'SETTINGS'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa]'
          }`}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="truncate">{t('settings')}</span>}
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => onSelectTab('HELP_DOCS')}
            title={t('help_docs')}
            className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selected === 'HELP_DOCS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa]'
            }`}
          >
            <HelpCircle className="h-4 w-4 text-indigo-400 shrink-0" />
            {!isCollapsed && <span className="truncate">{t('help_docs')}</span>}
          </button>
        )}
      </div>

      {/* Footer Role badge & Copyright */}
      {!isCollapsed ? (
        <div className="p-3 border-t border-[#27272a] space-y-2">
          <div className="p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] flex items-center justify-between text-[10px] text-[#a1a1aa]">
            <span className="font-mono text-blue-400 truncate">{userRole}</span>
            <span className="text-emerald-400 shrink-0">● Portable & Cloud</span>
          </div>
          <div className="text-[9px] text-[#71717a] text-center leading-tight">
            Created & Copyrighted by<br />
            <span className="text-[#a1a1aa] font-semibold">Mr. Aijaz Akhter Ahmedani</span> & <span className="text-[#a1a1aa] font-semibold">Sara Khan</span>
          </div>
        </div>
      ) : (
        <div className="p-2 border-t border-[#27272a] text-center">
          <div className="w-3 h-3 rounded-full bg-emerald-500 mx-auto" title="System Online" />
        </div>
      )}
    </aside>
  );
};

