import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Palette,
  Check,
  Building2,
  Plus,
  UserPlus,
  Users,
  ShieldCheck,
  Trash2,
  Video,
  Image as ImageIcon,
  Sparkles,
  Sliders,
  Link as LinkIcon,
  Upload,
  Eye,
  EyeOff,
  Layers,
  RefreshCw,
  Scale,
  FileText,
  MapPin,
  Mail,
  Phone,
  PhoneCall,
  Globe,
  Clock,
  UserCheck,
  Key,
  Lock,
  Shield,
  AlertCircle,
  CheckCircle2,
  User
} from 'lucide-react';
import { SystemSettings, AppTheme, UserProfile } from '../../types/alims';
import { LIBRARIAN_THEMES, getThemeConfig } from '../../utils/themeConfig';
import {
  MainPageBgConfig,
  loadSavedBgConfig,
  saveBgConfig,
  DEFAULT_BG_CONFIG,
  ThemeCustomizerModal
} from '../MainThemeBgSelector';
import { LicenseModal } from '../LicenseModal';

interface SettingsModuleProps {
  settings: SystemSettings;
  users?: UserProfile[];
  currentUser?: UserProfile;
  currentTheme?: AppTheme;
  onChangeTheme?: (theme: AppTheme) => void;
  onUpdateUser?: (id: string, updated: Partial<UserProfile>) => void;
  onUpdateSettings?: (newSettings: SystemSettings) => void;
  onSaveSettings?: (newSettings: SystemSettings) => void;
  onOpenAddBranchModal?: (mode?: 'BRANCH' | 'STAFF') => void;
  onAddBranch?: (branchName: string) => void;
  onDeleteBranch?: (branchName: string) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  settings,
  users = [],
  currentUser,
  currentTheme = 'pakistan-flag',
  onChangeTheme,
  onUpdateUser,
  onUpdateSettings,
  onSaveSettings,
  onOpenAddBranchModal,
  onAddBranch,
  onDeleteBranch
}) => {
  const [form, setForm] = useState<SystemSettings>(settings);
  const [bgConfig, setBgConfig] = useState<MainPageBgConfig>(() => loadSavedBgConfig());
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [customImgUrl, setCustomImgUrl] = useState<string>(bgConfig.imageUrl || '');
  const [customVidUrl, setCustomVidUrl] = useState<string>(bgConfig.videoUrl || '');
  const [bgStatusMessage, setBgStatusMessage] = useState<string | null>(null);

  // Password Management State
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentUser) {
      setPasswordError('No active user logged in.');
      return;
    }

    const expectedCurrent = currentUser.password || '';

    if (currentUser.password && currentPasswordInput !== expectedCurrent) {
      setPasswordError('Current password does not match account records.');
      return;
    }

    if (!newPasswordInput || newPasswordInput.length < 5) {
      setPasswordError('New password must be at least 5 characters long.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    if (onUpdateUser) {
      onUpdateUser(currentUser.id, { password: newPasswordInput });
    }

    setPasswordSuccess('Password successfully changed and saved to your account!');
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');

    setTimeout(() => {
      setPasswordSuccess(null);
    }, 4000);
  };

  const [themeCategoryFilter, setThemeCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    setCustomImgUrl(bgConfig.imageUrl || '');
    setCustomVidUrl(bgConfig.videoUrl || '');
  }, [bgConfig]);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleUpdateBgConfig = (updated: MainPageBgConfig, message?: string) => {
    setBgConfig(updated);
    saveBgConfig(updated);
    if (message) {
      setBgStatusMessage(message);
      setTimeout(() => setBgStatusMessage(null), 3000);
    }
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>, mediaType: 'IMAGE' | 'VIDEO') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('File size exceeds 50MB limit. Please choose a smaller file or paste an online URL.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (mediaType === 'IMAGE') {
        const updated: MainPageBgConfig = {
          ...bgConfig,
          bgType: 'image',
          imageUrl: dataUrl,
          presetId: 'SETTINGS_UPLOAD_IMAGE'
        };
        handleUpdateBgConfig(updated, 'Local image uploaded and set as application background!');
      } else {
        const updated: MainPageBgConfig = {
          ...bgConfig,
          bgType: 'video',
          videoUrl: dataUrl,
          presetId: 'SETTINGS_UPLOAD_VIDEO'
        };
        handleUpdateBgConfig(updated, 'Local video loop uploaded and set as application background!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSettings) onUpdateSettings(form);
    if (onSaveSettings) onSaveSettings(form);
    alert('System settings and configuration updated successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/90 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Settings className="h-5 w-5 text-emerald-400" />
          <span>System Settings & Visual Theme Choice</span>
        </h2>
        <p className="text-xs text-slate-500">Configure institution details, loan limits, fine rates, account password, and librarian visual theme preferences</p>
      </div>

      {/* Account Security & Password Management Card */}
      {currentUser && (
        <div className="p-6 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-[#121214] via-[#151518] to-emerald-950/20 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/90 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <Key className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-white">Account Security & Change Password</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase">
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your personal login password for <strong className="text-white">{currentUser.name}</strong> ({currentUser.email}).
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 bg-[#f1f5f9] px-3 py-1.5 rounded-xl border border-slate-200/90">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span>Status: <strong className="text-emerald-400">ACTIVE SESSION</strong></span>
            </div>
          </div>

          {passwordError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start space-x-2 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-start space-x-2 text-xs animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="font-bold">{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Current Account Password *</span>
                <span className="text-[10px] text-slate-400 font-mono">Verify identity</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={currentPasswordInput}
                  onChange={e => setCurrentPasswordInput(e.target.value)}
                  placeholder="Enter current password..."
                  className="w-full rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">New Password *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPasswordInput}
                onChange={e => setNewPasswordInput(e.target.value)}
                placeholder="Enter new password (min 5 chars)..."
                className="w-full rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Confirm New Password *</label>
              <div className="flex gap-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPasswordInput}
                  onChange={e => setConfirmPasswordInput(e.target.value)}
                  placeholder="Re-enter new password..."
                  className="w-full rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shrink-0 transition-all cursor-pointer shadow-md shadow-emerald-600/30"
                >
                  <Key className="h-3.5 w-3.5" />
                  <span>Update</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Theme Choice Selection Card */}
      {onChangeTheme && (
        <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <Palette className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Librarian Visual Theme Choice & Color Palettes
                </h3>
                <p className="text-xs text-slate-500">
                  10 curated color schemes optimized for librarians, research archives, and study halls
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsBgModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Theme Studio Modal</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
            {[
              { id: 'ALL', label: 'All Palettes (10)' },
              { id: 'National Heritage', label: '🇵🇰 National Heritage' },
              { id: 'Academic & Classical', label: '🏛️ Academic & Classical' },
              { id: 'Scholarly & Literature', label: '📜 Scholarly & Literature' },
              { id: 'Modern & Digital', label: '⚡ Modern & Digital' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setThemeCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  themeCategoryFilter === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Themes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {(themeCategoryFilter === 'ALL'
              ? LIBRARIAN_THEMES
              : LIBRARIAN_THEMES.filter((t) => t.category === themeCategoryFilter)
            ).map((t) => {
              const isSelected = currentTheme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChangeTheme(t.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between space-y-3 bg-white shadow-xs hover:shadow-md ${
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-600/30'
                      : 'border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                        <span>{t.name}</span>
                      </span>
                      {isSelected ? (
                        <span className="flex items-center space-x-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-bold shrink-0">
                          <Check className="h-3 w-3" />
                          <span>ACTIVE THEME</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-500 shrink-0">
                          {t.badgeText}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                      {t.subtitle}
                    </p>
                  </div>

                  {/* Tri-Color Swatch Ribbon */}
                  <div className="space-y-1.5 pt-1 w-full">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>PALETTE PREVIEW:</span>
                      <span className="text-slate-600 font-medium">{t.category}</span>
                    </div>
                    <div className="h-4 w-full rounded-md overflow-hidden flex border border-slate-200 shadow-inner">
                      <div
                        className="flex-1"
                        style={{ backgroundColor: t.swatchColors[0] }}
                        title={`Sidebar & Masthead: ${t.swatchColors[0]}`}
                      />
                      <div
                        className="flex-1"
                        style={{ backgroundColor: t.swatchColors[1] }}
                        title={`Accent & Buttons: ${t.swatchColors[1]}`}
                      />
                      <div
                        className="flex-1"
                        style={{ backgroundColor: t.swatchColors[2] }}
                        title={`Workspace Canvas: ${t.swatchColors[2]}`}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Page & Viewport Background Image & Video URL Settings Section */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
              <Video className="h-5 w-5 text-blue-600" />
              <span>Application Viewport Background Media & Atmosphere Settings</span>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Set custom web URLs or upload files for background images and ambient video loops across the portal.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsBgModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-xs shrink-0"
            >
              <Sliders className="h-4 w-4" />
              <span>Browse Preset Library Studio</span>
            </button>
          </div>
        </div>

        {/* Status Notification Message */}
        {bgStatusMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{bgStatusMessage}</span>
          </div>
        )}

        {/* Background Type Mode Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            1. Select Active Background Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                const updated: MainPageBgConfig = { ...bgConfig, bgType: 'gradient' };
                handleUpdateBgConfig(updated, 'Background mode changed to Librarian Theme Palette.');
              }}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                bgConfig.bgType === 'gradient'
                  ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600/30 font-bold'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Palette className="h-4 w-4 text-blue-600" />
                <span className="text-xs">Librarian Theme Palette</span>
              </div>
              {bgConfig.bgType === 'gradient' && <Check className="h-4 w-4 text-blue-600" />}
            </button>

            <button
              type="button"
              onClick={() => {
                const updated: MainPageBgConfig = { ...bgConfig, bgType: 'image' };
                handleUpdateBgConfig(updated, 'Background mode changed to Custom Image.');
              }}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                bgConfig.bgType === 'image'
                  ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600/30 font-bold'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <ImageIcon className="h-4 w-4 text-emerald-600" />
                <span className="text-xs">Custom Background Image</span>
              </div>
              {bgConfig.bgType === 'image' && <Check className="h-4 w-4 text-emerald-600" />}
            </button>

            <button
              type="button"
              onClick={() => {
                const updated: MainPageBgConfig = { ...bgConfig, bgType: 'video' };
                handleUpdateBgConfig(updated, 'Background mode changed to Custom Video Loop.');
              }}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                bgConfig.bgType === 'video'
                  ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600/30 font-bold'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Video className="h-4 w-4 text-cyan-600" />
                <span className="text-xs">Custom Video Loop</span>
              </div>
              {bgConfig.bgType === 'video' && <Check className="h-4 w-4 text-cyan-600" />}
            </button>
          </div>
        </div>

        {/* Custom Image URL Configuration */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center space-x-2">
              <ImageIcon className="h-4 w-4 text-emerald-600" />
              <span>2. Custom Background Image URL</span>
            </label>
            <label className="text-[11px] text-emerald-600 hover:underline flex items-center space-x-1 cursor-pointer">
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Local Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleCustomFileUpload(e, 'IMAGE')}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="url"
                value={customImgUrl}
                onChange={(e) => setCustomImgUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1920"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!customImgUrl.trim()) return;
                const updated: MainPageBgConfig = {
                  ...bgConfig,
                  bgType: 'image',
                  imageUrl: customImgUrl.trim(),
                  presetId: 'SETTINGS_URL_IMAGE'
                };
                handleUpdateBgConfig(updated, 'Custom image URL saved and applied to background!');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
            >
              Apply Image URL
            </button>
          </div>
        </div>

        {/* Custom Video Loop URL Configuration */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center space-x-2">
              <Video className="h-4 w-4 text-cyan-600" />
              <span>3. Custom Background Video Loop URL (MP4 / WebM)</span>
            </label>
            <label className="text-[11px] text-cyan-600 hover:underline flex items-center space-x-1 cursor-pointer">
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Local Video</span>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleCustomFileUpload(e, 'VIDEO')}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="url"
                value={customVidUrl}
                onChange={(e) => setCustomVidUrl(e.target.value)}
                placeholder="https://assets.mixkit.co/videos/preview/mixkit-dust-particles-floating-in-the-air-41551-large.mp4"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!customVidUrl.trim()) return;
                const updated: MainPageBgConfig = {
                  ...bgConfig,
                  bgType: 'video',
                  videoUrl: customVidUrl.trim(),
                  presetId: 'SETTINGS_URL_VIDEO'
                };
                handleUpdateBgConfig(updated, 'Custom video loop URL saved and applied to background!');
              }}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
            >
              Apply Video URL
            </button>
          </div>
        </div>

        {/* Viewport Contrast & Opacity Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Eye className="h-3.5 w-3.5 text-amber-500" />
                <span>Dark Tint Overlay Opacity</span>
              </label>
              <span className="text-xs font-mono font-bold text-amber-600">
                {Math.round(bgConfig.overlayOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={bgConfig.overlayOpacity}
              onChange={(e) => {
                const updated = { ...bgConfig, overlayOpacity: parseFloat(e.target.value) };
                handleUpdateBgConfig(updated);
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Layers className="h-3.5 w-3.5 text-blue-600" />
                <span>Background Blur Level</span>
              </label>
              <span className="text-xs font-mono font-bold text-blue-600">
                {bgConfig.blurAmount}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={bgConfig.blurAmount}
              onChange={(e) => {
                const updated = { ...bgConfig, blurAmount: parseInt(e.target.value, 10) };
                handleUpdateBgConfig(updated);
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>

        {/* Active Background Live Viewport Preview Bar */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <span className="text-slate-500">Active Background Config:</span>
            <span className="font-mono font-bold text-blue-700 uppercase px-2 py-0.5 rounded bg-blue-100 border border-blue-200">
              {bgConfig.bgType}
            </span>
            {bgConfig.presetId && (
              <span className="text-[10px] font-mono text-slate-500 truncate max-w-[200px]">
                [{bgConfig.presetId}]
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              handleUpdateBgConfig(DEFAULT_BG_CONFIG, 'Background reset to default.');
            }}
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center space-x-1 cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Reset Default</span>
          </button>
        </div>
      </div>

      <ThemeCustomizerModal
        isOpen={isBgModalOpen}
        onClose={() => setIsBgModalOpen(false)}
        config={bgConfig}
        onChangeConfig={setBgConfig}
        currentTheme={currentTheme}
        onChangeTheme={onChangeTheme}
      />

      {/* PLiMS Open Source Software License Information Card */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">PLiMS Open Source Software License</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-bold uppercase">
                  MIT License
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                PLiMS (Pakistan Library Information Management System) is released as 100% Free and Open Source Software (FOSS). Created by Mr. Aijaz Akhter Ahmedani & Sara Khan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsLicenseModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-xs shrink-0"
          >
            <FileText className="h-4 w-4" />
            <span>View Full License & Terms</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-emerald-700 font-bold block mb-1">✓ Commercial & Academic Use</span>
            <span className="text-[11px] text-slate-500">Free to run across any school, college, or university library.</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-blue-700 font-bold block mb-1">✓ Full Code Customization</span>
            <span className="text-[11px] text-slate-500">Modify components, catalog schemas, and workflows freely.</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-purple-700 font-bold block mb-1">✓ Open Distribution</span>
            <span className="text-[11px] text-slate-500">Share and contribute under standard MIT copyright notice terms.</span>
          </div>
        </div>
      </div>

      <LicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
      />

      {/* Library Branches & Staff Management Card */}
      <div className="p-6 rounded-2xl border border-slate-200/90 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/90 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
              <Building2 className="h-5 w-5 text-blue-400" />
              <span>Institutional Library Branches & Staff Management</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage physical campus branch libraries, access points, and assign staff members to branches.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onOpenAddBranchModal && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAddBranchModal('BRANCH')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-md transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Add New Branch</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAddBranchModal('STAFF')}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-md transition-all"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>+ Add Branch Staff</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Branch Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {settings.branches.map((branchName, idx) => {
            const branchStaff = users.filter(
              u =>
                u.assignedBranch === branchName ||
                (!u.assignedBranch && idx === 0) // Default first branch if unspecified
            );

            return (
              <div
                key={branchName}
                className="p-4 rounded-xl border border-slate-200/90 bg-[#f1f5f9] space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                      <Building2 className="h-4 w-4 text-emerald-400" />
                      <span>{branchName}</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold">
                      BRANCH #{idx + 1}
                    </span>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-500 flex items-center space-x-2">
                    <Users className="h-3.5 w-3.5 text-blue-400" />
                    <span>Assigned Staff: <strong className="text-slate-900">{branchStaff.length} Member(s)</strong></span>
                  </div>

                  {/* Staff List Preview */}
                  <div className="mt-2 space-y-1">
                    {branchStaff.slice(0, 3).map(staff => (
                      <div
                        key={staff.id}
                        className="p-1.5 rounded-lg bg-white border border-slate-200/90 flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <img
                            src={staff.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={staff.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="font-medium text-slate-900 truncate">{staff.name}</span>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300">
                          {staff.role}
                        </span>
                      </div>
                    ))}
                    {branchStaff.length > 3 && (
                      <p className="text-[10px] text-slate-500 font-mono pl-1">
                        + {branchStaff.length - 3} more staff member(s)
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/90/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">Status: ACTIVE NODE</span>
                  <div className="flex items-center space-x-2">
                    {onDeleteBranch && settings.branches.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove/delete library branch "${branchName}"?`)) {
                            onDeleteBranch(branchName);
                          }
                        }}
                        className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center space-x-1 cursor-pointer hover:bg-red-500/10 px-1.5 py-0.5 rounded transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Remove Branch</span>
                      </button>
                    )}
                    {onOpenAddBranchModal && (
                      <button
                        type="button"
                        onClick={() => onOpenAddBranchModal('STAFF')}
                        className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <span>+ Staff</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* XAMPP Localhost & Desktop Portable Edition Deployment Card */}
      <div className="p-6 rounded-2xl border border-emerald-500/30 bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900">XAMPP Localhost & Desktop Portable Setup Exporter</h3>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
            PLiMS V4.1.1 PK edition Offline Mode
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Easily install PLiMS on your Windows PC using <strong>XAMPP (Apache + MySQL/MariaDB)</strong> or run as a zero-installation Portable Edition from a USB flash drive.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              const sqlSchema = `-- PLiMS V4.1.1 PK edition (Pakistan Library Management System) MySQL Database Schema
-- Compatible with XAMPP MySQL / MariaDB / PostgreSQL

CREATE DATABASE IF NOT EXISTS \`plims_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`plims_db\`;

-- 1. Users & Members Table
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(255) NOT NULL UNIQUE,
  \`role\` ENUM('ADMINISTRATOR','HEAD_LIBRARIAN','LIBRARIAN','FACULTY','STUDENT','RESEARCH_SCHOLAR','GUEST') DEFAULT 'STUDENT',
  \`member_code\` VARCHAR(64) NOT NULL UNIQUE,
  \`department\` VARCHAR(128) DEFAULT 'General',
  \`status\` ENUM('ACTIVE','SUSPENDED','EXPIRED') DEFAULT 'ACTIVE',
  \`joined_date\` DATE,
  \`max_borrow_limit\` INT DEFAULT 5,
  \`fine_pending\` DECIMAL(10,2) DEFAULT 0.00,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Books & MARC21 Records Table
CREATE TABLE IF NOT EXISTS \`books\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`isbn\` VARCHAR(32) NOT NULL,
  \`title\` VARCHAR(512) NOT NULL,
  \`authors\` VARCHAR(512) NOT NULL,
  \`department\` VARCHAR(128),
  \`scheme_id\` VARCHAR(64) DEFAULT 'scheme_1',
  \`call_number\` VARCHAR(128) NOT NULL,
  \`edition\` VARCHAR(64),
  \`publisher_name\` VARCHAR(255),
  \`publisher_location\` VARCHAR(255),
  \`publisher_year\` INT,
  \`page_count\` INT,
  \`total_copies\` INT DEFAULT 1,
  \`available_copies\` INT DEFAULT 1,
  \`ddc_number\` VARCHAR(64),
  \`lcc_number\` VARCHAR(64),
  \`cover_url\` TEXT,
  \`marc21_leader\` TEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Book Copies Table
CREATE TABLE IF NOT EXISTS \`copies\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`book_id\` VARCHAR(64) NOT NULL,
  \`accession_number\` VARCHAR(64) NOT NULL UNIQUE,
  \`barcode\` VARCHAR(64) NOT NULL UNIQUE,
  \`rfid_tag\` VARCHAR(128),
  \`status\` ENUM('AVAILABLE','ISSUED','RESERVED','UNDER_MAINTENANCE','LOST') DEFAULT 'AVAILABLE',
  FOREIGN KEY (\`book_id\`) REFERENCES \`books\`(\`id\`) ON DELETE CASCADE
);

-- 4. Circulation Transactions Table
CREATE TABLE IF NOT EXISTS \`transactions\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`transaction_number\` VARCHAR(64) NOT NULL UNIQUE,
  \`copy_barcode\` VARCHAR(64) NOT NULL,
  \`book_title\` VARCHAR(512) NOT NULL,
  \`member_code\` VARCHAR(64) NOT NULL,
  \`member_name\` VARCHAR(255) NOT NULL,
  \`issue_date\` DATE NOT NULL,
  \`due_date\` DATE NOT NULL,
  \`return_date\` DATE NULL,
  \`status\` ENUM('ISSUED','RETURNED','OVERDUE','RENEWED') DEFAULT 'ISSUED',
  \`fine_amount\` DECIMAL(10,2) DEFAULT 0.00
);

-- Initial Admin Account
INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`role\`, \`member_code\`, \`department\`, \`status\`, \`joined_date\`, \`max_borrow_limit\`)
VALUES ('usr_admin_01', 'Prof. Sarah Jenkins (Head Librarian)', 'admin@university.edu.pk', 'HEAD_LIBRARIAN', 'MEM-2026-001', 'Central Library', 'ACTIVE', CURDATE(), 20)
ON DUPLICATE KEY UPDATE \`name\`=\`name\`;
`;
              const blob = new Blob([sqlSchema], { type: 'text/sql' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'plims_v4_xampp_database_schema.sql';
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="p-3.5 rounded-xl border border-emerald-500/40 bg-[#f1f5f9] hover:bg-emerald-500/10 text-emerald-300 font-bold text-xs flex flex-col space-y-1 text-left transition-all cursor-pointer"
          >
            <span className="flex items-center space-x-1.5">
              <span>📥 Download SQL Schema</span>
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              `plims_v4_xampp_database_schema.sql` (For phpMyAdmin import)
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              const configPhp = `<?php
// PLiMS V4.1.1 PK edition XAMPP Database Connection File (config.php)
$host = "localhost";
$user = "root";
$password = "";
$database = "plims_db";

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die("XAMPP Database Connection Failed: " . $conn->connect_error);
}
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
?>`;
              const blob = new Blob([configPhp], { type: 'application/x-httpd-php' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'config.php';
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="p-3.5 rounded-xl border border-blue-500/40 bg-[#f1f5f9] hover:bg-blue-500/10 text-blue-300 font-bold text-xs flex flex-col space-y-1 text-left transition-all cursor-pointer"
          >
            <span className="flex items-center space-x-1.5">
              <span>📄 Download XAMPP `config.php`</span>
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              Copy into `C:\\xampp\\htdocs\\plims\\config.php`
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              const dockerCompose = `version: '3.8'

services:
  plims-app:
    image: node:20-alpine
    container_name: plims_oss_ai
    working_dir: /app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: always

  plims-db:
    image: postgres:15-alpine
    container_name: plims_postgres
    environment:
      POSTGRES_DB: plims_db
      POSTGRES_USER: plims_user
      POSTGRES_PASSWORD: plims_secure_password
    ports:
      - "5432:5432"
    volumes:
      - plims_db_data:/var/lib/postgresql/data
    restart: always

volumes:
  plims_db_data:
`;
              const blob = new Blob([dockerCompose], { type: 'text/yaml' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'docker-compose.yml';
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="p-3.5 rounded-xl border border-purple-500/40 bg-[#f1f5f9] hover:bg-purple-500/10 text-purple-300 font-bold text-xs flex flex-col space-y-1 text-left transition-all cursor-pointer"
          >
            <span className="flex items-center space-x-1.5">
              <span>🐳 Download Docker Compose</span>
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              `docker-compose.yml` for OSS AI deployment
            </span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-emerald-500/30 bg-white space-y-6 text-xs shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/90 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Library Profile, Place, Location & Contact Customization</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure official Library Place, Geographic Location, Email, Mobile No, Office No, Website, and Theme settings.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsBgModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md"
            >
              <Sliders className="h-4 w-4" />
              <span>Change Main Page Theme</span>
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Save className="h-4 w-4" />
              <span>Save System Settings</span>
            </button>
          </div>
        </div>

        {/* Section 1: Library Identity & Institutional Names */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5 uppercase tracking-wider">
            <Building2 className="h-4 w-4" />
            <span>1. Library & Institution Identity</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-500 font-medium block">Library System Name</label>
              <input
                type="text"
                required
                value={form.libraryName || ''}
                onChange={e => setForm({ ...form, libraryName: e.target.value })}
                className="w-full rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-medium block">Parent Institution / University Name</label>
              <input
                type="text"
                required
                value={form.institutionName || ''}
                onChange={e => setForm({ ...form, institutionName: e.target.value })}
                className="w-full rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Library Place & Location Details */}
        <div className="space-y-3 pt-2 border-t border-slate-200/90">
          <h4 className="text-xs font-bold text-blue-400 flex items-center space-x-1.5 uppercase tracking-wider">
            <MapPin className="h-4 w-4" />
            <span>2. Library Place & Geographic Location</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-slate-500 font-medium flex items-center space-x-1">
                <Building2 className="h-3.5 w-3.5 text-blue-400" />
                <span>Library Place / Building Address</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Central Library Building, Sector H-9, Campus Block A"
                value={form.libraryPlace || ''}
                onChange={e => setForm({ ...form, libraryPlace: e.target.value })}
                className="w-full rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-medium flex items-center space-x-1">
                <MapPin className="h-3.5 w-3.5 text-red-400" />
                <span>Location / City & Country</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Islamabad, Pakistan"
                value={form.libraryLocation || ''}
                onChange={e => setForm({ ...form, libraryLocation: e.target.value })}
                className="w-full rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-3.5 py-2 text-slate-900 focus:outline-none focus:border-red-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-medium flex items-center space-x-1">
                <Globe className="h-3.5 w-3.5 text-emerald-400" />
                <span>Postal Code / Zip Code</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 44000"
                value={form.postalCode || ''}
                onChange={e => setForm({ ...form, postalCode: e.target.value })}
                className="w-full rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Contact Numbers & Communication Email */}
        <div className="space-y-3 pt-2 border-t border-slate-200/90">
          <h4 className="text-xs font-bold text-amber-400 flex items-center space-x-1.5 uppercase tracking-wider">
            <Phone className="h-4 w-4" />
            <span>3. Contact Numbers & Official Email</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-slate-500 font-medium flex items-center space-x-1">
                <Mail className="h-3.5 w-3.5 text-blue-400" />
                <span>Official Library Email</span>
              </label>
              <input
                type="email"
                placeholder="e.g. central.library@pslims.edu.pk"
                value={form.libraryEmail || ''}
                onChange={e => setForm({ ...form, libraryEmail: e.target.value })}
                className="w-full rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-medium flex items-center space-x-1">
                <Phone className="h-3.5 w-3.5 text-emerald-400" />
                <span>Mobile Phone No.</span>
              </label>
              <input
                type="text"
                placeholder="e.g. +92 300 9876543"
                value={form.libraryMobileNo || ''}
                onChange={e => setForm({ ...form, libraryMobileNo: e.target.value })}
                className="w-full rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-medium flex items-center space-x-1">
                <PhoneCall className="h-3.5 w-3.5 text-amber-400" />
                <span>Office Landline No.</span>
              </label>
              <input
                type="text"
                placeholder="e.g. +92 51 92654321"
                value={form.libraryOfficeNo || ''}
                onChange={e => setForm({ ...form, libraryOfficeNo: e.target.value })}
                className="w-full rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-3.5 py-2 text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Web Portal, Hours & Leadership */}
        <div className="space-y-3 pt-2 border-t border-slate-200/90">
          <h4 className="text-xs font-bold text-purple-400 flex items-center space-x-1.5 uppercase tracking-wider">
            <Clock className="h-4 w-4" />
            <span>4. Web Portal, Opening Hours & Administration</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-slate-500 font-medium flex items-center space-x-1">
                <Globe className="h-3.5 w-3.5 text-purple-400" />
                <span>Website Portal Link</span>
              </label>
              <input
                type="text"
                placeholder="e.g. https://pslims.edu.pk"
                value={form.websiteUrl || ''}
                onChange={e => setForm({ ...form, websiteUrl: e.target.value })}
                className="w-full rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-3.5 py-2 text-slate-900 focus:outline-none focus:border-purple-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-medium flex items-center space-x-1">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                <span>Operating Hours</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Mon - Sat: 08:00 AM - 08:00 PM"
                value={form.openingHours || ''}
                onChange={e => setForm({ ...form, openingHours: e.target.value })}
                className="w-full rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-medium flex items-center space-x-1">
                <UserCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>Chief Librarian / Head Officer</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Prof. Mr. Aijaz Akhter Ahmedani & Sara Khan"
                value={form.chiefLibrarianName || ''}
                onChange={e => setForm({ ...form, chiefLibrarianName: e.target.value })}
                className="w-full rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <label className="text-slate-500 font-medium block">Custom Portal Banner / Welcome Notice</label>
            <input
              type="text"
              placeholder="e.g. Welcome to Pakistan Library Management System (PSLiMS) Portal"
              value={form.customWelcomeNote || ''}
              onChange={e => setForm({ ...form, customWelcomeNote: e.target.value })}
              className="w-full rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>
        </div>

        {/* Section 5: Circulation Rules & Currency */}
        <div className="space-y-3 pt-2 border-t border-slate-200/90">
          <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1.5 uppercase tracking-wider">
            <Sliders className="h-4 w-4 text-emerald-400" />
            <span>5. Circulation Rules & Fine Parameters</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-slate-500 font-medium block">Student Max Issue Days</label>
              <input
                type="number"
                value={form.maxIssueDaysStudent || 14}
                onChange={e => setForm({ ...form, maxIssueDaysStudent: parseInt(e.target.value) || 1 })}
                className="w-full rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-medium block">Faculty Max Issue Days</label>
              <input
                type="number"
                value={form.maxIssueDaysFaculty || 30}
                onChange={e => setForm({ ...form, maxIssueDaysFaculty: parseInt(e.target.value) || 1 })}
                className="w-full rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-medium block">Overdue Fine Per Day ({form.currencySymbol || 'Rs.'})</label>
              <input
                type="number"
                value={form.finePerDay || 5}
                onChange={e => setForm({ ...form, finePerDay: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200/90 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            All changes apply globally across PSLiMS nodes and saved to local Indexed DB.
          </span>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center space-x-2 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all text-xs"
          >
            <Save className="h-4 w-4" />
            <span>Save All Configuration & Profile Details</span>
          </button>
        </div>
      </form>
    </div>
  );
};

