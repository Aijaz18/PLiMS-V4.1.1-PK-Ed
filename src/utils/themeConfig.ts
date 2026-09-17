import { AppTheme } from '../types/alims';

export interface LibrarianThemeDefinition {
  id: AppTheme;
  name: string;
  subtitle: string;
  category: 'National Heritage' | 'Academic & Classical' | 'Scholarly & Literature' | 'Modern & Digital';
  sidebarGradient: string;
  sidebarBorder: string;
  sidebarBrandBg: string;
  sidebarActivePill: string;
  sidebarActiveSubPill: string;
  sidebarCategoryText: string;
  canvasBg: string;
  canvasBgHex: string;
  headerTopStripe: string;
  headerBadgeBg: string;
  headerBgHex: string;
  headerBorderHex: string;
  accentColor: string;
  accentHex: string;
  primaryHex: string;
  primaryHoverHex: string;
  primaryLightHex: string;
  primaryBorderHex: string;
  heroGradient: string;
  cardBgHex: string;
  cardBorderHex: string;
  swatchColors: [string, string, string]; // [primary, secondary, canvas/accent]
  badgeText: string;
  isDark?: boolean;
}

export const LIBRARIAN_THEMES: LibrarianThemeDefinition[] = [
  {
    id: 'oxford-navy',
    name: 'Royal Navy & Oxford Blue',
    subtitle: 'Classic British collegiate heritage with sapphire highlights',
    category: 'Academic & Classical',
    sidebarGradient: 'bg-gradient-to-b from-[#0a192f] via-[#0c2340] to-[#07172b]',
    sidebarBorder: 'border-[#1a385f]',
    sidebarBrandBg: 'bg-[#07172b]',
    sidebarActivePill: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950/40',
    sidebarActiveSubPill: 'bg-blue-600/25 text-blue-300 font-semibold',
    sidebarCategoryText: 'text-blue-300/60',
    canvasBg: 'bg-[#f4f7fb]',
    canvasBgHex: '#f4f7fb',
    headerTopStripe: 'bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600',
    headerBadgeBg: 'bg-blue-50 border-blue-200 text-blue-700',
    headerBgHex: '#ffffff',
    headerBorderHex: '#e2e8f0',
    accentColor: 'text-blue-600',
    accentHex: '#2563eb',
    primaryHex: '#2563eb',
    primaryHoverHex: '#1d4ed8',
    primaryLightHex: '#eff6ff',
    primaryBorderHex: '#bfdbfe',
    heroGradient: 'linear-gradient(135deg, #0c2340 0%, #0a192f 50%, #07172b 100%)',
    cardBgHex: '#ffffff',
    cardBorderHex: '#e2e8f0',
    swatchColors: ['#0a192f', '#2563eb', '#f4f7fb'],
    badgeText: 'OXFORD NAVY'
  },
  {
    id: 'pakistan-flag',
    name: 'Quaid Emerald & Gold',
    subtitle: 'National academic emerald green, gold laurels & crisp porcelain',
    category: 'National Heritage',
    sidebarGradient: 'bg-gradient-to-b from-[#06351e] via-[#042817] to-[#021f11]',
    sidebarBorder: 'border-[#0e5c36]/60',
    sidebarBrandBg: 'bg-[#021f11]',
    sidebarActivePill: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50',
    sidebarActiveSubPill: 'bg-emerald-600/25 text-emerald-300 font-semibold',
    sidebarCategoryText: 'text-emerald-300/60',
    canvasBg: 'bg-[#f0fdf4]',
    canvasBgHex: '#f0fdf4',
    headerTopStripe: 'bg-gradient-to-r from-emerald-600 via-amber-400 to-emerald-600',
    headerBadgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    headerBgHex: '#fbfdfc',
    headerBorderHex: '#d1fae5',
    accentColor: 'text-emerald-700',
    accentHex: '#059669',
    primaryHex: '#047857',
    primaryHoverHex: '#065f46',
    primaryLightHex: '#ecfdf5',
    primaryBorderHex: '#a7f3d0',
    heroGradient: 'linear-gradient(135deg, #06351e 0%, #042817 50%, #021f11 100%)',
    cardBgHex: '#ffffff',
    cardBorderHex: '#d1fae5',
    swatchColors: ['#064e3b', '#d97706', '#f0fdf4'],
    badgeText: 'NATIONAL EMERALD'
  },
  {
    id: 'persian-turquoise',
    name: 'Persian Turquoise & Lapis',
    subtitle: 'Silk Road & Islamic Manuscript illuminated lapis with turquoise glow',
    category: 'National Heritage',
    sidebarGradient: 'bg-gradient-to-b from-[#0c2f54] via-[#082340] to-[#05182d]',
    sidebarBorder: 'border-[#154d85]/60',
    sidebarBrandBg: 'bg-[#05182d]',
    sidebarActivePill: 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-950/40',
    sidebarActiveSubPill: 'bg-cyan-600/25 text-cyan-300 font-semibold',
    sidebarCategoryText: 'text-cyan-300/60',
    canvasBg: 'bg-[#f0fdfa]',
    canvasBgHex: '#f0fdfa',
    headerTopStripe: 'bg-gradient-to-r from-cyan-500 via-amber-400 to-teal-500',
    headerBadgeBg: 'bg-cyan-50 border-cyan-200 text-cyan-800',
    headerBgHex: '#fafdfd',
    headerBorderHex: '#ccfbf1',
    accentColor: 'text-cyan-700',
    accentHex: '#0891b2',
    primaryHex: '#0891b2',
    primaryHoverHex: '#0e7490',
    primaryLightHex: '#ecfeff',
    primaryBorderHex: '#a5f3fc',
    heroGradient: 'linear-gradient(135deg, #0c2f54 0%, #082340 50%, #05182d 100%)',
    cardBgHex: '#ffffff',
    cardBorderHex: '#ccfbf1',
    swatchColors: ['#0c2f54', '#0891b2', '#f0fdfa'],
    badgeText: 'PERSIAN TURQUOISE'
  },
  {
    id: 'antique-parchment',
    name: 'Antique Parchment & Mahogany',
    subtitle: 'Rich mahogany leather binding, warm bronze seals & aged vellum',
    category: 'Academic & Classical',
    sidebarGradient: 'bg-gradient-to-b from-[#3b1a0e] via-[#2d1309] to-[#1f0c05]',
    sidebarBorder: 'border-[#5c2b18]/60',
    sidebarBrandBg: 'bg-[#1f0c05]',
    sidebarActivePill: 'bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-md shadow-amber-950/50',
    sidebarActiveSubPill: 'bg-amber-700/25 text-amber-300 font-semibold',
    sidebarCategoryText: 'text-amber-300/60',
    canvasBg: 'bg-[#fdfbf7]',
    canvasBgHex: '#fdfbf7',
    headerTopStripe: 'bg-gradient-to-r from-amber-700 via-yellow-400 to-amber-700',
    headerBadgeBg: 'bg-amber-50 border-amber-200 text-amber-900',
    headerBgHex: '#fffdfa',
    headerBorderHex: '#fef3c7',
    accentColor: 'text-amber-800',
    accentHex: '#b45309',
    primaryHex: '#b45309',
    primaryHoverHex: '#92400e',
    primaryLightHex: '#fffbeb',
    primaryBorderHex: '#fde68a',
    heroGradient: 'linear-gradient(135deg, #3b1a0e 0%, #2d1309 50%, #1f0c05 100%)',
    cardBgHex: '#ffffff',
    cardBorderHex: '#fef3c7',
    swatchColors: ['#3b1a0e', '#d97706', '#fdfbf7'],
    badgeText: 'RARE ARCHIVES'
  },
  {
    id: 'nordic-spruce',
    name: 'Nordic Spruce & Sage Mint',
    subtitle: 'Calm Scandinavian minimalist reading pavilion with muted boreal tones',
    category: 'Academic & Classical',
    sidebarGradient: 'bg-gradient-to-b from-[#0f3d3e] via-[#092c2d] to-[#051c1d]',
    sidebarBorder: 'border-[#1b5e60]/60',
    sidebarBrandBg: 'bg-[#051c1d]',
    sidebarActivePill: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-950/40',
    sidebarActiveSubPill: 'bg-teal-600/25 text-teal-300 font-semibold',
    sidebarCategoryText: 'text-teal-300/60',
    canvasBg: 'bg-[#f8fafc]',
    canvasBgHex: '#f8fafc',
    headerTopStripe: 'bg-gradient-to-r from-teal-600 via-emerald-400 to-teal-600',
    headerBadgeBg: 'bg-teal-50 border-teal-200 text-teal-800',
    headerBgHex: '#f9fbfb',
    headerBorderHex: '#ccfbf1',
    accentColor: 'text-teal-700',
    accentHex: '#0f766e',
    primaryHex: '#0f766e',
    primaryHoverHex: '#115e59',
    primaryLightHex: '#f0fdfa',
    primaryBorderHex: '#99f6e4',
    heroGradient: 'linear-gradient(135deg, #0f3d3e 0%, #092c2d 50%, #051c1d 100%)',
    cardBgHex: '#ffffff',
    cardBorderHex: '#ccfbf1',
    swatchColors: ['#0f3d3e', '#10b981', '#f8fafc'],
    badgeText: 'NORDIC SPRUCE'
  },
  {
    id: 'royal-amethyst',
    name: 'Royal Amethyst & Velvet Rose',
    subtitle: 'Humanities, classical literature & poetry with regal purple twilight',
    category: 'Scholarly & Literature',
    sidebarGradient: 'bg-gradient-to-b from-[#330857] via-[#24043f] to-[#170229]',
    sidebarBorder: 'border-[#581c87]/60',
    sidebarBrandBg: 'bg-[#170229]',
    sidebarActivePill: 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-md shadow-purple-950/50',
    sidebarActiveSubPill: 'bg-purple-600/25 text-purple-300 font-semibold',
    sidebarCategoryText: 'text-purple-300/60',
    canvasBg: 'bg-[#faf5ff]',
    canvasBgHex: '#faf5ff',
    headerTopStripe: 'bg-gradient-to-r from-purple-600 via-rose-400 to-violet-600',
    headerBadgeBg: 'bg-purple-50 border-purple-200 text-purple-800',
    headerBgHex: '#fdfaff',
    headerBorderHex: '#f3e8ff',
    accentColor: 'text-purple-700',
    accentHex: '#7e22ce',
    primaryHex: '#7e22ce',
    primaryHoverHex: '#6b21a8',
    primaryLightHex: '#faf5ff',
    primaryBorderHex: '#e9d5ff',
    heroGradient: 'linear-gradient(135deg, #330857 0%, #24043f 50%, #170229 100%)',
    cardBgHex: '#ffffff',
    cardBorderHex: '#f3e8ff',
    swatchColors: ['#330857', '#e11d48', '#faf5ff'],
    badgeText: 'ROYAL AMETHYST'
  },
  {
    id: 'crimson-harvard',
    name: 'Harvard Crimson & Warm Ivory',
    subtitle: 'Ivy League research faculty atmosphere with deep crimson velvet',
    category: 'Scholarly & Literature',
    sidebarGradient: 'bg-gradient-to-b from-[#5b0d23] via-[#420818] to-[#29030d]',
    sidebarBorder: 'border-[#881337]/60',
    sidebarBrandBg: 'bg-[#29030d]',
    sidebarActivePill: 'bg-gradient-to-r from-rose-700 to-red-600 text-white shadow-md shadow-rose-950/50',
    sidebarActiveSubPill: 'bg-rose-700/25 text-rose-300 font-semibold',
    sidebarCategoryText: 'text-rose-300/60',
    canvasBg: 'bg-[#fffafa]',
    canvasBgHex: '#fffafa',
    headerTopStripe: 'bg-gradient-to-r from-rose-700 via-amber-400 to-red-700',
    headerBadgeBg: 'bg-rose-50 border-rose-200 text-rose-900',
    headerBgHex: '#fffbfc',
    headerBorderHex: '#ffe4e6',
    accentColor: 'text-rose-800',
    accentHex: '#be123c',
    primaryHex: '#be123c',
    primaryHoverHex: '#9f1239',
    primaryLightHex: '#fff1f2',
    primaryBorderHex: '#fecdd3',
    heroGradient: 'linear-gradient(135deg, #5b0d23 0%, #420818 50%, #29030d 100%)',
    cardBgHex: '#ffffff',
    cardBorderHex: '#ffe4e6',
    swatchColors: ['#5b0d23', '#be123c', '#fffafa'],
    badgeText: 'HARVARD CRIMSON'
  },
  {
    id: 'cashmere-amber',
    name: 'Cashmere & Honey Amber',
    subtitle: 'Cozy study alcove with toasted caramel espresso & amber warmth',
    category: 'Scholarly & Literature',
    sidebarGradient: 'bg-gradient-to-b from-[#3d2109] via-[#2c1705] to-[#1c0d02]',
    sidebarBorder: 'border-[#613612]/60',
    sidebarBrandBg: 'bg-[#1c0d02]',
    sidebarActivePill: 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md shadow-amber-950/50',
    sidebarActiveSubPill: 'bg-amber-600/25 text-amber-300 font-semibold',
    sidebarCategoryText: 'text-amber-300/60',
    canvasBg: 'bg-[#fffdf5]',
    canvasBgHex: '#fffdf5',
    headerTopStripe: 'bg-gradient-to-r from-amber-600 via-yellow-400 to-orange-500',
    headerBadgeBg: 'bg-amber-50 border-amber-200 text-amber-900',
    headerBgHex: '#fffdf7',
    headerBorderHex: '#fef3c7',
    accentColor: 'text-amber-800',
    accentHex: '#d97706',
    primaryHex: '#d97706',
    primaryHoverHex: '#b45309',
    primaryLightHex: '#fffbeb',
    primaryBorderHex: '#fde68a',
    heroGradient: 'linear-gradient(135deg, #3d2109 0%, #2c1705 50%, #1c0d02 100%)',
    cardBgHex: '#ffffff',
    cardBorderHex: '#fef3c7',
    swatchColors: ['#3d2109', '#d97706', '#fffdf5'],
    badgeText: 'CASHMERE AMBER'
  },
  {
    id: 'midnight-alexandria',
    name: 'Alexandria Cyber Midnight',
    subtitle: 'Digital informatics & nocturnal archives with electric cyan on obsidian',
    category: 'Modern & Digital',
    sidebarGradient: 'bg-gradient-to-b from-[#070b14] via-[#0a101d] to-[#04060c]',
    sidebarBorder: 'border-cyan-900/40',
    sidebarBrandBg: 'bg-[#04060c]',
    sidebarActivePill: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-950/50',
    sidebarActiveSubPill: 'bg-cyan-500/25 text-cyan-300 font-semibold',
    sidebarCategoryText: 'text-cyan-400/60',
    canvasBg: 'bg-[#0b0f19]',
    canvasBgHex: '#0b0f19',
    headerTopStripe: 'bg-gradient-to-r from-cyan-400 via-emerald-400 to-blue-500',
    headerBadgeBg: 'bg-cyan-950/40 border-cyan-700/50 text-cyan-300',
    headerBgHex: '#0c1220',
    headerBorderHex: '#162035',
    accentColor: 'text-cyan-400',
    accentHex: '#06b6d4',
    primaryHex: '#06b6d4',
    primaryHoverHex: '#0891b2',
    primaryLightHex: '#083344',
    primaryBorderHex: '#155e75',
    heroGradient: 'linear-gradient(135deg, #070b14 0%, #0a101d 50%, #04060c 100%)',
    cardBgHex: '#111827',
    cardBorderHex: '#1f293d',
    swatchColors: ['#070b14', '#06b6d4', '#10b981'],
    badgeText: 'CYBER MIDNIGHT',
    isDark: true
  },
  {
    id: 'light-clean',
    name: 'Academic Clean Slate',
    subtitle: 'Modern high-contrast architectural gray & crisp gallery white',
    category: 'Modern & Digital',
    sidebarGradient: 'bg-gradient-to-b from-[#1e293b] via-[#172033] to-[#0f172a]',
    sidebarBorder: 'border-slate-700',
    sidebarBrandBg: 'bg-[#0f172a]',
    sidebarActivePill: 'bg-blue-600 text-white shadow-md shadow-slate-900/40',
    sidebarActiveSubPill: 'bg-blue-600/25 text-blue-300 font-semibold',
    sidebarCategoryText: 'text-slate-400',
    canvasBg: 'bg-[#f8fafc]',
    canvasBgHex: '#f8fafc',
    headerTopStripe: 'bg-gradient-to-r from-slate-400 via-blue-500 to-slate-400',
    headerBadgeBg: 'bg-slate-100 border-slate-200 text-slate-800',
    headerBgHex: '#ffffff',
    headerBorderHex: '#e2e8f0',
    accentColor: 'text-blue-600',
    accentHex: '#3b82f6',
    primaryHex: '#2563eb',
    primaryHoverHex: '#1d4ed8',
    primaryLightHex: '#f1f5f9',
    primaryBorderHex: '#cbd5e1',
    heroGradient: 'linear-gradient(135deg, #1e293b 0%, #172033 50%, #0f172a 100%)',
    cardBgHex: '#ffffff',
    cardBorderHex: '#e2e8f0',
    swatchColors: ['#1e293b', '#3b82f6', '#f8fafc'],
    badgeText: 'CLEAN SLATE'
  }
];

export const getThemeConfig = (themeId?: AppTheme): LibrarianThemeDefinition => {
  // Default to oxford-navy which matches the reference image aesthetic
  if (!themeId) return LIBRARIAN_THEMES[0];
  
  // Aliases for backward compatibility
  if (themeId === 'pakistan-dark') {
    return LIBRARIAN_THEMES.find(t => t.id === 'pakistan-flag') || LIBRARIAN_THEMES[1];
  }
  if (themeId === 'dark-slate') {
    return LIBRARIAN_THEMES.find(t => t.id === 'midnight-alexandria') || LIBRARIAN_THEMES[8];
  }
  if (themeId === 'high-contrast') {
    return LIBRARIAN_THEMES.find(t => t.id === 'light-clean') || LIBRARIAN_THEMES[9];
  }

  const found = LIBRARIAN_THEMES.find(t => t.id === themeId);
  return found || LIBRARIAN_THEMES[0];
};

/**
 * Injects CSS variables onto document.documentElement so all components,
 * cards, headers, buttons, and modals on the entire panel match the active theme.
 */
export const applyThemeToDocument = (themeId?: AppTheme): LibrarianThemeDefinition => {
  const theme = getThemeConfig(themeId);
  if (typeof document === 'undefined') return theme;

  const root = document.documentElement;

  // Set class for scoped CSS overrides
  const oldClasses = Array.from(root.classList).filter(c => c.startsWith('theme-'));
  oldClasses.forEach(c => root.classList.remove(c));
  root.classList.add(`theme-${theme.id}`);

  // Set CSS Custom Properties for entire application
  root.style.setProperty('--theme-primary', theme.primaryHex);
  root.style.setProperty('--theme-primary-hover', theme.primaryHoverHex);
  root.style.setProperty('--theme-primary-light', theme.primaryLightHex);
  root.style.setProperty('--theme-primary-border', theme.primaryBorderHex);
  root.style.setProperty('--theme-accent', theme.accentHex);
  root.style.setProperty('--theme-hero-gradient', theme.heroGradient);
  root.style.setProperty('--theme-header-bg', theme.headerBgHex);
  root.style.setProperty('--theme-header-border', theme.headerBorderHex);
  root.style.setProperty('--theme-canvas-bg', theme.canvasBgHex);
  root.style.setProperty('--theme-card-bg', theme.cardBgHex);
  root.style.setProperty('--theme-card-border', theme.cardBorderHex);

  return theme;
};

