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
  FileCode,
  Link as LinkIcon
} from 'lucide-react';

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
  presetId: 'DEFAULT_DARK',
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

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MainPageBgConfig;
  onChangeConfig: (newConfig: MainPageBgConfig) => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig
}) => {
  const [activeTab, setActiveTab] = useState<'PRESETS' | 'CUSTOM_IMAGE' | 'CUSTOM_VIDEO' | 'OVERLAY'>('PRESETS');
  const [customImageUrlInput, setCustomImageUrlInput] = useState<string>(config.imageUrl || '');
  const [customVideoUrlInput, setCustomVideoUrlInput] = useState<string>(config.videoUrl || '');
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    setCustomImageUrlInput(config.imageUrl || '');
    setCustomVideoUrlInput(config.videoUrl || '');
  }, [config]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'IMAGE' | 'VIDEO') => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) return;

    // Validate size (max 50MB for videos/images in localStorage/dataURL)
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
    onChangeConfig(DEFAULT_BG_CONFIG);
    saveBgConfig(DEFAULT_BG_CONFIG);
    setCustomImageUrlInput(DEFAULT_BG_CONFIG.imageUrl || '');
    setCustomVideoUrlInput(DEFAULT_BG_CONFIG.videoUrl || '');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#27272a] flex items-center justify-between bg-[#18181b]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Main Page Background Theme Studio</span>
                <Sparkles className="h-4 w-4 text-amber-400" />
              </h2>
              <p className="text-xs text-[#a1a1aa]">Customize image, video loop, or gradient background for the portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center space-x-1 p-2 bg-[#09090b] border-b border-[#27272a] overflow-x-auto">
          <button
            onClick={() => setActiveTab('PRESETS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'PRESETS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Preset Backgrounds</span>
          </button>

          <button
            onClick={() => setActiveTab('CUSTOM_IMAGE')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'CUSTOM_IMAGE'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Custom Image</span>
          </button>

          <button
            onClick={() => setActiveTab('CUSTOM_VIDEO')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'CUSTOM_VIDEO'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]'
            }`}
          >
            <VideoIcon className="h-3.5 w-3.5" />
            <span>Custom Video Loop</span>
          </button>

          <button
            onClick={() => setActiveTab('OVERLAY')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'OVERLAY'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Opacity & Contrast</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'PRESETS' && (
            <div className="space-y-6">
              {/* Theme Options */}
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Color & Flag Presets</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Pakistani Flag Light Preset */}
                  <div
                    onClick={() => {
                      const updated: MainPageBgConfig = {
                        ...config,
                        bgType: 'gradient',
                        presetId: 'PAKISTAN_FLAG_LIGHT'
                      };
                      onChangeConfig(updated);
                      saveBgConfig(updated);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      config.presetId === 'PAKISTAN_FLAG_LIGHT'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white ring-2 ring-emerald-500/30'
                        : 'border-[#27272a] bg-[#18181b] hover:border-emerald-500 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#00401a] via-[#047857] to-white border border-emerald-400 flex items-center justify-center text-xs">
                        🇵🇰
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">🇵🇰 Pakistani Flag (Green & White)</div>
                        <div className="text-[10px] text-emerald-400">Lite National Emerald & Crisp White</div>
                      </div>
                    </div>
                    {config.presetId === 'PAKISTAN_FLAG_LIGHT' && <Check className="h-4 w-4 text-emerald-400" />}
                  </div>

                  {/* Pakistani Emerald Night */}
                  <div
                    onClick={() => {
                      const updated: MainPageBgConfig = {
                        ...config,
                        bgType: 'gradient',
                        presetId: 'PAKISTAN_EMERALD_NIGHT'
                      };
                      onChangeConfig(updated);
                      saveBgConfig(updated);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      config.presetId === 'PAKISTAN_EMERALD_NIGHT'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white ring-2 ring-emerald-500/30'
                        : 'border-[#27272a] bg-[#18181b] hover:border-emerald-500 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00401a] via-[#022c22] to-black border border-emerald-500/40" />
                      <div>
                        <div className="text-xs font-bold text-white">🇵🇰 Emerald Night (Dark)</div>
                        <div className="text-[10px] text-emerald-400">Deep forest academic glow</div>
                      </div>
                    </div>
                    {config.presetId === 'PAKISTAN_EMERALD_NIGHT' && <Check className="h-4 w-4 text-emerald-400" />}
                  </div>

                  {/* Classic Obsidian */}
                  <div
                    onClick={() => {
                      const updated: MainPageBgConfig = {
                        ...config,
                        bgType: 'gradient',
                        presetId: 'DEFAULT_DARK'
                      };
                      onChangeConfig(updated);
                      saveBgConfig(updated);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      config.presetId === 'DEFAULT_DARK'
                        ? 'border-blue-500 bg-blue-500/10 text-white ring-2 ring-blue-500/30'
                        : 'border-[#27272a] bg-[#18181b] hover:border-zinc-500 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-900 via-indigo-950 to-zinc-950 border border-blue-500/30" />
                      <div>
                        <div className="text-xs font-bold text-white">Classic Obsidian Gradient</div>
                        <div className="text-[10px] text-zinc-400">Deep indigo space gradient</div>
                      </div>
                    </div>
                    {config.presetId === 'DEFAULT_DARK' && <Check className="h-4 w-4 text-blue-400" />}
                  </div>
                </div>
              </div>

              {/* High Res Image Presets */}
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Preset Photo Backgrounds</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all h-28 flex flex-col justify-end p-3 ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-lg'
                            : 'border-[#27272a] hover:border-zinc-400'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        <div className="relative z-10 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-white leading-tight">{img.name}</div>
                            <div className="text-[10px] text-zinc-300">{img.category}</div>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-blue-400 bg-blue-500/30 p-0.5 rounded-full" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Video Loop Presets */}
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Preset Motion Video Loops</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all h-28 flex flex-col justify-end p-3 ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-lg'
                            : 'border-[#27272a] hover:border-zinc-400'
                        }`}
                      >
                        <video
                          src={vid.url}
                          muted
                          loop
                          autoPlay
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                        <div className="relative z-10 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-white leading-tight flex items-center space-x-1">
                              <VideoIcon className="h-3 w-3 text-cyan-400" />
                              <span>{vid.name}</span>
                            </div>
                            <div className="text-[10px] text-zinc-300">{vid.category}</div>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-cyan-400 bg-cyan-500/30 p-0.5 rounded-full" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CUSTOM_IMAGE' && (
            <div className="space-y-6">
              {/* External Image URL Input */}
              <div className="p-4 rounded-xl border border-[#27272a] bg-[#18181b] space-y-3">
                <label className="text-xs font-bold text-white flex items-center space-x-2">
                  <LinkIcon className="h-4 w-4 text-blue-400" />
                  <span>Option A: Paste Custom Image Web URL</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customImageUrlInput}
                    onChange={(e) => setCustomImageUrlInput(e.target.value)}
                    placeholder="https://example.com/my-background.jpg"
                    className="flex-1 rounded-xl border border-[#27272a] bg-[#09090b] px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleApplyCustomUrl('IMAGE')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-all"
                  >
                    Set Background
                  </button>
                </div>
              </div>

              {/* Local File Upload Input */}
              <div className="p-4 rounded-xl border border-[#27272a] bg-[#18181b] space-y-3">
                <label className="text-xs font-bold text-white flex items-center space-x-2">
                  <Upload className="h-4 w-4 text-emerald-400" />
                  <span>Option B: Upload Image from Computer</span>
                </label>
                <p className="text-[11px] text-zinc-400">Select any image file (PNG, JPG, WebP) from your device.</p>
                <label className="block w-full border-2 border-dashed border-[#27272a] hover:border-emerald-500/50 rounded-xl p-6 text-center cursor-pointer transition-all bg-[#09090b]">
                  <Upload className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <span className="text-xs font-semibold text-white block">Click to Browse Local Image</span>
                  <span className="text-[10px] text-zinc-500">Supports JPG, PNG, WEBP, GIF</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'IMAGE')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Current Active Preview */}
              {config.bgType === 'image' && config.imageUrl && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-400">Active Background Image Preview:</span>
                  <div className="h-36 rounded-xl border border-blue-500/40 relative overflow-hidden">
                    <img src={config.imageUrl} alt="Custom Background" className="w-full h-full object-cover" />
                    <div
                      className="absolute inset-0 bg-black pointer-events-none"
                      style={{ opacity: config.overlayOpacity }}
                    />
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/70 text-[10px] font-mono text-emerald-300 border border-white/20">
                      Active Image Theme Applied
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'CUSTOM_VIDEO' && (
            <div className="space-y-6">
              {/* External Video URL Input */}
              <div className="p-4 rounded-xl border border-[#27272a] bg-[#18181b] space-y-3">
                <label className="text-xs font-bold text-white flex items-center space-x-2">
                  <LinkIcon className="h-4 w-4 text-cyan-400" />
                  <span>Option A: Paste Custom MP4 / WebM Video URL</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customVideoUrlInput}
                    onChange={(e) => setCustomVideoUrlInput(e.target.value)}
                    placeholder="https://example.com/ambient-loop.mp4"
                    className="flex-1 rounded-xl border border-[#27272a] bg-[#09090b] px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleApplyCustomUrl('VIDEO')}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer transition-all"
                  >
                    Set Video Loop
                  </button>
                </div>
              </div>

              {/* Local Video File Upload Input */}
              <div className="p-4 rounded-xl border border-[#27272a] bg-[#18181b] space-y-3">
                <label className="text-xs font-bold text-white flex items-center space-x-2">
                  <Upload className="h-4 w-4 text-cyan-400" />
                  <span>Option B: Upload Video File from Device</span>
                </label>
                <p className="text-[11px] text-zinc-400">Select an MP4, WebM, or MOV video loop to play continuously in the background.</p>
                <label className="block w-full border-2 border-dashed border-[#27272a] hover:border-cyan-500/50 rounded-xl p-6 text-center cursor-pointer transition-all bg-[#09090b]">
                  <VideoIcon className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
                  <span className="text-xs font-semibold text-white block">Click to Browse Local Video Loop</span>
                  <span className="text-[10px] text-zinc-500">Supports MP4, WEBM (Max 50MB)</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e, 'VIDEO')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Current Active Video Preview */}
              {config.bgType === 'video' && config.videoUrl && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-400">Active Video Loop Preview:</span>
                  <div className="h-36 rounded-xl border border-cyan-500/40 relative overflow-hidden">
                    <video
                      src={config.videoUrl}
                      muted
                      loop
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0 bg-black pointer-events-none"
                      style={{ opacity: config.overlayOpacity }}
                    />
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/70 text-[10px] font-mono text-cyan-300 border border-white/20">
                      Active Video Theme Playing
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'OVERLAY' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-[#27272a] bg-[#18181b] space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-amber-400" />
                    <span>Dark Overlay Tint Opacity</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400">
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
                  className="w-full h-2 bg-[#09090b] rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <p className="text-[10px] text-zinc-400">
                  Higher opacity improves text contrast and legibility over vibrant backgrounds or fast video loops.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#27272a] bg-[#18181b] space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center space-x-2">
                    <Layers className="h-4 w-4 text-blue-400" />
                    <span>Background Blur Level</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-blue-400">
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
                  className="w-full h-2 bg-[#09090b] rounded-lg appearance-none cursor-pointer accent-blue-400"
                />
                <p className="text-[10px] text-zinc-400">
                  Adds cinematic depth-of-field blur to background images or videos.
                </p>
              </div>
            </div>
          )}

          {fileError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {fileError}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#27272a] bg-[#18181b] flex items-center justify-between">
          <button
            onClick={handleResetToDefault}
            className="px-3.5 py-2 rounded-xl border border-[#27272a] bg-[#09090b] hover:bg-[#27272a] text-zinc-300 text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset to Default</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-500/20"
          >
            Done & Apply
          </button>
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

  // Default Gradient Blobs
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#09090b]/80 -z-10" />
    </div>
  );
};
