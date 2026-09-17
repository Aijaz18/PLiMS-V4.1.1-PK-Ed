import React from 'react';
import {
  LayoutDashboard,
  Search,
  Repeat,
  FileCode,
  ShieldCheck,
  Users,
  BookOpen,
  ShoppingCart,
  Newspaper,
  FolderKanban,
  QrCode,
  BarChart3,
  Database,
  HardDrive,
  Sparkles,
  Settings,
  HelpCircle,
  BookMarked
} from 'lucide-react';
import { AppLanguage } from '../utils/i18n';
import { AppTheme } from '../types/alims';
import { getThemeConfig } from '../utils/themeConfig';

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
  currentTheme?: AppTheme;
}

interface NavItemDef {
  id: ModuleTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSectionDef {
  title?: string;
  items: NavItemDef[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  currentTab,
  onSelectTab,
  userRole = 'LIBRARIAN',
  currentTheme = 'oxford-navy'
}) => {
  const selected = activeTab || currentTab || 'DASHBOARD';
  const theme = getThemeConfig(currentTheme);

  const sections: NavSectionDef[] = [
    {
      items: [
        {
          id: 'DASHBOARD',
          label: 'Dashboard',
          icon: LayoutDashboard
        },
        {
          id: 'OPAC',
          label: 'OPAC / Online Catalog',
          icon: Search
        },
        {
          id: 'CIRCULATION',
          label: 'Circulation & Fines',
          icon: Repeat
        },
        {
          id: 'CATALOGUING',
          label: 'Catalogue (MARC21/RDA)',
          icon: FileCode
        },
        {
          id: 'AUTHORITY',
          label: 'Authority Control (LCSH)',
          icon: ShieldCheck
        },
        {
          id: 'MEMBERS',
          label: 'User & Member Control',
          icon: Users
        }
      ]
    },
    {
      title: 'COLLECTIONS & DIGITAL',
      items: [
        {
          id: 'DIGITAL_LIBRARY',
          label: 'Digital & Thesis Repository',
          icon: BookOpen
        },
        {
          id: 'ACQUISITIONS',
          label: 'Acquisition & Vendors',
          icon: ShoppingCart
        },
        {
          id: 'SERIALS',
          label: 'Serials & Periodicals',
          icon: Newspaper
        }
      ]
    },
    {
      title: 'TOOLS & ANALYTICS',
      items: [
        {
          id: 'INVENTORY',
          label: 'Stock Verification',
          icon: FolderKanban
        },
        {
          id: 'BARCODES',
          label: 'Barcode & RFID Labels',
          icon: QrCode
        },
        {
          id: 'REPORTS',
          label: 'Reports & Analytics',
          icon: BarChart3
        },
        {
          id: 'IMPORT_EXPORT',
          label: 'Import / Export & Migration',
          icon: Database
        },
        {
          id: 'BACKUP_LOGS',
          label: 'Backup & Security Logs',
          icon: HardDrive
        }
      ]
    },
    {
      title: 'AI & SYSTEM',
      items: [
        {
          id: 'AI_ASSISTANT',
          label: 'Gemini Library Copilot',
          icon: Sparkles
        },
        {
          id: 'SETTINGS',
          label: 'Settings & Profile',
          icon: Settings
        },
        {
          id: 'HELP_DOCS',
          label: 'Architecture Specs & Manual',
          icon: HelpCircle
        }
      ]
    }
  ];

  return (
    <aside className={`w-64 ${theme.sidebarGradient} text-slate-300 flex flex-col justify-between shrink-0 h-full border-r ${theme.sidebarBorder} select-none z-30 transition-colors duration-300`}>
      {/* Scrollable Nav Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {sections.map((sec, idx) => (
          <div key={sec.title || idx} className="space-y-1">
            {sec.title && (
              <div className={`text-[10px] font-bold ${theme.sidebarCategoryText} uppercase tracking-wider px-3 pt-2 pb-1`}>
                {sec.title}
              </div>
            )}

            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const IconComponent = item.icon;
                const isSelected =
                  selected === item.id ||
                  (item.id === 'DIGITAL_LIBRARY' && selected === 'DIGITAL') ||
                  (item.id === 'ACQUISITIONS' && selected === 'ACQUISITION') ||
                  (item.id === 'INVENTORY' && selected === 'STOCK');

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full group flex items-center space-x-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer font-medium ${
                      isSelected
                        ? `${theme.sidebarActivePill} font-semibold shadow-xs`
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <IconComponent
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isSelected ? 'text-white' : 'text-slate-400 group-hover:text-cyan-300'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Brand Card: PLiMS Knowledge • Access • Progress */}
      <div className={`p-3 border-t ${theme.sidebarBorder}`}>
        <div className={`${theme.sidebarBrandBg} p-3 rounded-2xl border border-white/5 text-center space-y-2 flex flex-col items-center shadow-inner`}>
          <img
            src="/plims_logo.jpg"
            alt="PLiMS Emblem Logo"
            className="w-12 h-12 rounded-full object-cover border-2 border-amber-400/60 shadow-md ring-2 ring-emerald-500/20"
          />
          <div>
            <div className="font-bold text-xs tracking-tight text-white">PLiMS V4.1.1</div>
            <div className="text-[10px] italic text-slate-400 font-serif">
              Knowledge • Access • Progress
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
