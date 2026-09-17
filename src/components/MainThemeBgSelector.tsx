import React, { useState, useEffect } from 'react';
import {
  Palette,
  Image as ImageIcon,
  Video as VideoIcon,
  Upload,
  Sliders,
  Check,
  X,
  Sparkles,
  RefreshCw,
  Eye,
  Layers,
  Link as LinkIcon,
  BookOpen
} from 'lucide-react';
import { AppTheme } from '../types/alims';
import { LIBRARIAN_THEMES, LibrarianThemeDefinition, getThemeConfig, applyThemeToDocument } from '../utils/themeConfig';

export type BgType = 'gradient' | 'image' | 'video';

export interface MainPageBgConfig {
  bgType: BgType;
  presetId?: string;
  imageUrl?: string;
  videoUrl?: string;
  overlayOpacity: number; // 0.1 to 0.95
  blurAmount: number; // 0 to 12
}

export const STORAGE_KEY_BG = 'pslims_main_bg_config_v2';

export const DEFAULT_BG_CONFIG: MainPageBgConfig = {
  bgType: 'gradient',
  presetId: 'oxford-navy',
  imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1920',
  videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-dust-particles-floating-in-the-air-41551-large.mp4',
  overlayOpacity: 0.65,
  blurAmount: 0
};

export const PRESET_IMAGES = [
  {
    id: 'GRAND_LIBRARY',
    name: 'Grand Academic Library',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1920',
    category: 'Library Classic'
  },
  {
    id: 'MODERN_CAMPUS',
    name: 'Modern University Center',
    url: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&q=80&w=1920',
    category: 'Architecture'
  },
  {
    id: 'ATHENAEUM_HALL',
    name: 'Athenaeum Reading Stacks',
    url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=1920',
    category: 'Book Stacks'
  },
  {
    id: 'CYBER_MATRIX',
    name: 'Cybernetic Information Network',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1920',
    category: 'Digital Tech'
  }
];

export const PRESET_VIDEOS = [
  {
    id: 'AMBIENT_DUST',
    name: 'Atmospheric Library Particles',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-dust-particles-floating-in-the-air-41551-large.mp4',
    category: 'Atmospheric'
  },
  {
    id: 'DIGITAL_STREAM',
    name: 'Digital Information Stream',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-and-data-42864-large.mp4',
    category: 'Tech Data'
  },
  {
    id: 'NETWORK_NODES',
    name: 'Connected Knowledge Network',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-connection-dots-and-lines-41552-large.mp4',
    category: 'Abstract'
  },
  {
    id: 'SILK_PARTICLES',
    name: 'Glowing Fluid Motion',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-video-of-colored-ink-in-water-43187-large.mp4',
    category: 'Fluid Motion'
  }
];

export const loadSavedBgConfig = (): MainPageBgConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_BG);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to parse bg config:', e);
  }
  return DEFAULT_BG_CONFIG;
};

export const saveBgConfig = (config: MainPageBgConfig) => {
  try {
    localStorage.setItem(STORAGE_KEY_BG, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save bg config:', e);
  }
};

export interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MainPageBgConfig;
  onChangeConfig: (newConfig: MainPageBgConfig) => void;
  currentTheme?: AppTheme;
  onChangeTheme?: (theme: AppTheme) => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  currentTheme = 'oxford-navy',
  onChangeTheme
}) => {
  const [activeTab, setActiveTab] = useState<'THEMES' | 'PHOTOS' | 'VIDEOS' | 'CUSTOM' | 'OVERLAY'>('THEMES');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [customImageUrlInput, setCustomImageUrlInput] = useState<string>(config.imageUrl || '');
  const [customVideoUrlInput, setCustomVideoUrlInput] = useState<string>(config.videoUrl || '');
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    setCustomImageUrlInput(config.imageUrl || '');
    setCustomVideoUrlInput(config.videoUrl || '');
  }, [config]);

  if (!isOpen) return null;

  const categories = [
    { id: 'ALL', label: 'All Themes (10)' },
    { id: 'National Heritage', label: '🇵🇰 National Heritage' },
    { id: 'Academic & Classical', label: '🏛️ Academic & Classical' },
    { id: 'Scholarly & Literature', label: '📜 Scholarly & Literature' },
    { id: 'Modern & Digital', label: '⚡ Modern & Digital' }
  ];

  const filteredThemes = selectedCategory === 'ALL'
    ? LIBRARIAN_THEMES
    : LIBRARIAN_THEMES.filter(t => t.category === selectedCategory);

  const handleSelectTheme = (theme: LibrarianThemeDefinition) => {
    applyThemeToDocument(theme.id);
    if (onChangeTheme) {
      onChangeTheme(theme.id);
    } else {
      localStorage.setItem('pslims_theme', theme.id);
      window.dispatchEvent(new Event('storage'));
    }

    const updated: MainPageBgConfig = {
      ...config,
      bgType: 'gradient',
      presetId: theme.id
    };
    onChangeConfig(updated);
    saveBgConfig(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'IMAGE' | 'VIDEO') => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setFileError('File size exceeds 50MB. Please choose a smaller file or paste an external URL.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (fileType === 'IMAGE') {
        const updated: MainPageBgConfig = {
          ...config,
          bgType: 'image',
          imageUrl: dataUrl,
          presetId: 'CUSTOM_FILE_IMAGE'
        };
        onChangeConfig(updated);
        saveBgConfig(updated);
      } else {
        const updated: MainPageBgConfig = {
          ...config,
          bgType: 'video',
          videoUrl: dataUrl,
          presetId: 'CUSTOM_FILE_VIDEO'
        };
        onChangeConfig(updated);
        saveBgConfig(updated);
      }
    };
    reader.onerror = () => {
      setFileError('Failed to read local file. Please try another file.');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = (type: 'IMAGE' | 'VIDEO') => {
    if (type === 'IMAGE') {
      if (!customImageUrlInput.trim()) return;
      const updated: MainPageBgConfig = {
        ...config,
        bgType: 'image',
        imageUrl: customImageUrlInput.trim(),
        presetId: 'CUSTOM_URL_IMAGE'
      };
      onChangeConfig(updated);
      saveBgConfig(updated);
    } else {
      if (!customVideoUrlInput.trim()) return;
      const updated: MainPageBgConfig = {
        ...config,
        bgType: 'video',
        videoUrl: customVideoUrlInput.trim(),
        presetId: 'CUSTOM_URL_VIDEO'
      };
      onChangeConfig(updated);
      saveBgConfig(updated);
    }
  };

  const handleResetToDefault = () => {
    if (onChangeTheme) {
      onChangeTheme('oxford-navy');
    }
    onChangeConfig(DEFAULT_BG_CONFIG);
    saveBgConfig(DEFAULT_BG_CONFIG);
    setCustomImageUrlInput(DEFAULT_BG_CONFIG.imageUrl || '');
    setCustomVideoUrlInput(DEFAULT_BG_CONFIG.videoUrl || '');
  };

  const activeThemeDef = getThemeConfig(currentTheme);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">
                  Librarian Visual Theme Choice & Atmosphere Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold font-mono">
                  10 PALETTES
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Curated color combinations for academic librarians, research archives, and quiet study halls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-slate-200/70 border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center space-x-1 px-4 py-2 bg-white border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('THEMES')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'THEMES'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            <span>Curated Librarian Themes</span>
          </button>

          <button
            onClick={() => setActiveTab('PHOTOS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'PHOTOS'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Library Environments</span>
          </button>

          <button
            onClick={() => setActiveTab('VIDEOS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'VIDEOS'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <VideoIcon className="h-3.5 w-3.5" />
            <span>Ambient Study Loops</span>
          </button>

          <button
            onClick={() => setActiveTab('CUSTOM')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'CUSTOM'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Custom Upload & URL</span>
          </button>

          <button
            onClick={() => setActiveTab('OVERLAY')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'OVERLAY'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Contrast & Atmosphere</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          {activeTab === 'THEMES' && (
            <div className="space-y-4">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Theme Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredThemes.map((theme) => {
                  const isSelected = currentTheme === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => handleSelectTheme(theme)}
                      className={`group p-4 rounded-2xl border transition-all cursor-pointer bg-white relative flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md ${
                        isSelected
                          ? 'border-blue-600 ring-2 ring-blue-600/30'
                          : 'border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                              {theme.name}
                            </span>
                          </div>
                          {isSelected ? (
                            <span className="flex items-center space-x-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-bold shrink-0">
                              <Check className="h-3 w-3" />
                              <span>ACTIVE THEME</span>
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-500 shrink-0">
                              {theme.badgeText}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                          {theme.subtitle}
                        </p>
                      </div>

                      {/* Tri-Color Swatch Bar & Preview */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>PALETTE SWATCH:</span>
                          <span className="text-slate-600 font-medium">{theme.category}</span>
                        </div>
                        <div className="h-5 w-full rounded-lg overflow-hidden flex border border-slate-200 shadow-inner">
                          <div
                            className="flex-1 transition-transform group-hover:scale-105"
                            style={{ backgroundColor: theme.swatchColors[0] }}
                            title={`Sidebar & Masthead: ${theme.swatchColors[0]}`}
                          />
                          <div
                            className="flex-1 transition-transform group-hover:scale-105"
                            style={{ backgroundColor: theme.swatchColors[1] }}
                            title={`Accent & Highlighting: ${theme.swatchColors[1]}`}
                          />
                          <div
                            className="flex-1 transition-transform group-hover:scale-105"
                            style={{ backgroundColor: theme.swatchColors[2] }}
                            title={`Canvas & Cards: ${theme.swatchColors[2]}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'PHOTOS' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-600 font-medium">
                Select high-definition architectural library photographs to place behind the portal interface:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {PRESET_IMAGES.map((img) => {
                  const isSelected = config.bgType === 'image' && config.imageUrl === img.url;
                  return (
                    <div
                      key={img.id}
                      onClick={() => {
                        const updated: MainPageBgConfig = {
                          ...config,
                          bgType: 'image',
                          imageUrl: img.url,
                          presetId: img.id
                        };
                        onChangeConfig(updated);
                        saveBgConfig(updated);
                      }}
                      className={`group relative rounded-2xl border overflow-hidden cursor-pointer transition-all h-36 flex flex-col justify-end p-3 shadow-xs ${
                        isSelected
                          ? 'border-blue-600 ring-2 ring-blue-600/50 shadow-md'
                          : 'border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white drop-shadow-sm">{img.name}</div>
                          <div className="text-[10px] text-slate-300 font-medium">{img.category}</div>
                        </div>
                        {isSelected && (
                          <span className="p-1 rounded-full bg-blue-600 text-white shadow-md">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'VIDEOS' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-600 font-medium">
                Continuous ambient looping backgrounds creating an atmospheric, immersive study desk experience:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {PRESET_VIDEOS.map((vid) => {
                  const isSelected = config.bgType === 'video' && config.videoUrl === vid.url;
                  return (
                    <div
                      key={vid.id}
                      onClick={() => {
                        const updated: MainPageBgConfig = {
                          ...config,
                          bgType: 'video',
                          videoUrl: vid.url,
                          presetId: vid.id
                        };
                        onChangeConfig(updated);
                        saveBgConfig(updated);
                      }}
                      className={`group relative rounded-2xl border overflow-hidden cursor-pointer transition-all h-36 flex flex-col justify-end p-3 shadow-xs ${
                        isSelected
                          ? 'border-cyan-600 ring-2 ring-cyan-600/50 shadow-md'
                          : 'border-slate-200 hover:border-cyan-400'
                      }`}
                    >
                      <video
                        src={vid.url}
                        muted
                        loop
                        autoPlay
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white drop-shadow-sm">{vid.name}</div>
                          <div className="text-[10px] text-cyan-300 font-medium">{vid.category}</div>
                        </div>
                        {isSelected && (
                          <span className="p-1 rounded-full bg-cyan-500 text-white shadow-md">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'CUSTOM' && (
            <div className="space-y-5">
              {/* Custom Image URL */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                  <LinkIcon className="h-4 w-4 text-blue-600" />
                  <span>Option A: Paste External Image URL</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customImageUrlInput}
                    onChange={(e) => setCustomImageUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/your-library-photo.jpg"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                  <button
                    onClick={() => handleApplyCustomUrl('IMAGE')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition-all shrink-0 shadow-xs"
                  >
                    Apply Image
                  </button>
                </div>
              </div>

              {/* Upload Image from Device */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                  <Upload className="h-4 w-4 text-emerald-600" />
                  <span>Option B: Upload Image from Computer</span>
                </label>
                <label className="block w-full border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50 hover:bg-emerald-50/30">
                  <Upload className="h-7 w-7 text-emerald-600 mx-auto mb-2" />
                  <span className="text-xs font-bold text-slate-800 block">Click to Browse Local Image</span>
                  <span className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP (Max 50MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'IMAGE')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Custom Video URL */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                  <VideoIcon className="h-4 w-4 text-cyan-600" />
                  <span>Option C: Paste Ambient MP4 / WebM Video URL</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customVideoUrlInput}
                    onChange={(e) => setCustomVideoUrlInput(e.target.value)}
                    placeholder="https://assets.mixkit.co/videos/preview/your-ambient-loop.mp4"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none"
                  />
                  <button
                    onClick={() => handleApplyCustomUrl('VIDEO')}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer transition-all shrink-0 shadow-xs"
                  >
                    Apply Video
                  </button>
                </div>
              </div>

              {fileError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {fileError}
                </div>
              )}
            </div>
          )}

          {activeTab === 'OVERLAY' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-amber-500" />
                    <span>Overlay Tint Darkness</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-600">
                    {Math.round(config.overlayOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={config.overlayOpacity}
                  onChange={(e) => {
                    const updated = { ...config, overlayOpacity: parseFloat(e.target.value) };
                    onChangeConfig(updated);
                    saveBgConfig(updated);
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <p className="text-[11px] text-slate-500">
                  Controls the opacity layer over photographic and looping backgrounds for optimal text contrast.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                    <Layers className="h-4 w-4 text-blue-600" />
                    <span>Atmospheric Blur Level</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-blue-600">
                    {config.blurAmount}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="1"
                  value={config.blurAmount}
                  onChange={(e) => {
                    const updated = { ...config, blurAmount: parseInt(e.target.value, 10) };
                    onChangeConfig(updated);
                    saveBgConfig(updated);
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-[11px] text-slate-500">
                  Applies cinematic depth-of-field blur behind the library cards and data tables.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">Active Theme:</span>
            <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block border border-slate-300"
                style={{ backgroundColor: activeThemeDef.accentHex }}
              />
              <span>{activeThemeDef.name}</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetToDefault}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Default</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              Done & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface BackgroundLayerProps {
  config: MainPageBgConfig;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({ config }) => {
  if (config.bgType === 'image' && config.imageUrl) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src={config.imageUrl}
          alt="Main Background"
          className="w-full h-full object-cover"
          style={{ filter: config.blurAmount > 0 ? `blur(${config.blurAmount}px)` : 'none' }}
        />
        <div
          className="absolute inset-0 bg-black transition-opacity duration-300"
          style={{ opacity: config.overlayOpacity }}
        />
      </div>
    );
  }

  if (config.bgType === 'video' && config.videoUrl) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <video
          src={config.videoUrl}
          muted
          loop
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{ filter: config.blurAmount > 0 ? `blur(${config.blurAmount}px)` : 'none' }}
        />
        <div
          className="absolute inset-0 bg-black transition-opacity duration-300"
          style={{ opacity: config.overlayOpacity }}
        />
      </div>
    );
  }

  return null;
};
