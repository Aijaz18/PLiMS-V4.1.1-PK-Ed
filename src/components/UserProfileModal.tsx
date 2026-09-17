import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  PhoneCall,
  MapPin,
  Building2,
  Sliders,
  Save,
  CheckCircle2,
  Shield,
  Sparkles,
  Palette,
  Lock,
  Key,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { UserProfile, SystemSettings } from '../types/alims';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  initialTab?: 'PROFILE' | 'PASSWORD';
  onUpdateUser?: (id: string, updated: Partial<UserProfile>) => void;
  onOpenThemeStudio?: () => void;
  settings?: SystemSettings;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialTab = 'PROFILE',
  onUpdateUser,
  onOpenThemeStudio,
  settings
}) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'PASSWORD'>(initialTab);

  const [form, setForm] = useState<Partial<UserProfile>>({
    name: currentUser.name || '',
    email: currentUser.email || '',
    phone: currentUser.phone || '',
    mobileNo: currentUser.mobileNo || currentUser.phone || '',
    officeNo: currentUser.officeNo || '',
    location: currentUser.location || settings?.libraryLocation || '',
    department: currentUser.department || '',
    designation: currentUser.designation || '',
    avatarUrl: currentUser.avatarUrl || ''
  });

  // Password Change Form State
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (currentUser) {
      setForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        mobileNo: currentUser.mobileNo || currentUser.phone || '',
        officeNo: currentUser.officeNo || '',
        location: currentUser.location || settings?.libraryLocation || '',
        department: currentUser.department || '',
        designation: currentUser.designation || '',
        avatarUrl: currentUser.avatarUrl || ''
      });
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setPasswordError(null);
      setPasswordSuccess(null);
    }
  }, [currentUser, settings, isOpen]);

  if (!isOpen) return null;

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateUser) {
      onUpdateUser(currentUser.id, form);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    const expectedCurrentPassword = currentUser.password || '';

    if (currentUser.password && currentPasswordInput !== expectedCurrentPassword) {
      setPasswordError('Current password does not match our records. Please verify.');
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

    // Save updated password
    if (onUpdateUser) {
      onUpdateUser(currentUser.id, { password: newPasswordInput });
    }

    setPasswordSuccess('Password updated successfully! The previous temporary password is now deactivated.');
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');

    setTimeout(() => {
      setPasswordSuccess(null);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-emerald-500/30 bg-white p-6 shadow-2xl text-xs space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/90 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Account Settings & Security</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px]">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your user profile particulars, change default password, and customize theme settings.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#f1f5f9] text-slate-500 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-200/90 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('PROFILE')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'PROFILE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-500 hover:text-white bg-[#f1f5f9] border border-slate-200/90'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Profile Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PASSWORD')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'PASSWORD'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-emerald-400 hover:text-white bg-emerald-950/20 border border-emerald-500/30'
            }`}
          >
            <Key className="h-4 w-4 text-emerald-400" />
            <span>Change Password & Security</span>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] rounded font-mono">PIN</span>
          </button>
        </div>

        {/* Action Banner to Change Main Page Theme */}
        <div className="p-4 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/30 via-[#09090b] to-indigo-950/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-xs flex items-center space-x-1.5">
                <span>Main Page Theme & Background Studio</span>
                <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Customize main page background colors, video loops, preset images, and overlay darkness.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onOpenThemeStudio) {
                onOpenThemeStudio();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-2 shrink-0 cursor-pointer shadow-md transition-all"
          >
            <Sliders className="h-4 w-4" />
            <span>Change Main Page Theme</span>
          </button>
        </div>

        {/* Tab 1: Profile Details Form */}
        {activeTab === 'PROFILE' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {/* Google Authentication Status Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#f1f5f9] border border-slate-200/90">
              <div className="flex items-center space-x-2.5">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center p-1 shrink-0">
                  <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-semibold text-white flex items-center space-x-1.5">
                    <span>Google Authentication Status</span>
                    {currentUser.authProvider === 'GOOGLE' || currentUser.googleSub ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Linked & Verified</span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-slate-500 border border-zinc-700">Not Linked</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {currentUser.authProvider === 'GOOGLE' || currentUser.googleSub
                      ? `Identity verified via Google OpenID Connect (${currentUser.email})`
                      : 'You can sign in with your Google account at login to automatically link this profile.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-3 rounded-xl bg-[#f1f5f9] border border-slate-200/90">
              <img
                src={form.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={form.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/40"
              />
              <div className="flex-1 space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Avatar / Profile Photo URL</label>
                <input
                  type="text"
                  value={form.avatarUrl || ''}
                  onChange={e => setForm({ ...form, avatarUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-white border border-slate-200/90 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-500 flex items-center space-x-1 font-medium">
                  <User className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name || ''}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 flex items-center space-x-1 font-medium">
                  <Mail className="h-3.5 w-3.5 text-blue-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email || ''}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 flex items-center space-x-1 font-medium">
                  <Phone className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Mobile Number</span>
                </label>
                <input
                  type="text"
                  placeholder="+92 300 1234567"
                  value={form.mobileNo || form.phone || ''}
                  onChange={e => setForm({ ...form, mobileNo: e.target.value, phone: e.target.value })}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 flex items-center space-x-1 font-medium">
                  <PhoneCall className="h-3.5 w-3.5 text-amber-400" />
                  <span>Office / Landline Phone</span>
                </label>
                <input
                  type="text"
                  placeholder="+92 51 9260000"
                  value={form.officeNo || ''}
                  onChange={e => setForm({ ...form, officeNo: e.target.value })}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 flex items-center space-x-1 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-red-400" />
                  <span>Location / Campus Place</span>
                </label>
                <input
                  type="text"
                  placeholder="Central Library Building, Islamabad"
                  value={form.location || ''}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 flex items-center space-x-1 font-medium">
                  <Building2 className="h-3.5 w-3.5 text-purple-400" />
                  <span>Department / Faculty</span>
                </label>
                <input
                  type="text"
                  placeholder="Library Science / IT"
                  value={form.department || ''}
                  onChange={e => setForm({ ...form, department: e.target.value })}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            {/* Quick Security & Password Shortcut Card */}
            <div className="p-3.5 rounded-xl bg-[#f1f5f9] border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Login Password & Credentials</div>
                  <div className="text-[10px] text-slate-500">Need to change your account password or PIN?</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('PASSWORD')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all cursor-pointer"
              >
                Change Password →
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200/90">
              {savedSuccess ? (
                <span className="text-emerald-400 font-bold flex items-center space-x-1.5 animate-bounce">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Profile updated successfully!</span>
                </span>
              ) : (
                <span className="text-[#71717a] text-[11px]">
                  Member ID: <strong className="text-zinc-300 font-mono">{currentUser.memberCode}</strong>
                </span>
              )}

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-[#f1f5f9] border border-slate-200/90 text-slate-500 hover:text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Change Password Form */}
        {activeTab === 'PASSWORD' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="p-4 rounded-xl bg-[#f1f5f9] border border-slate-200/90 space-y-2">
              <div className="flex items-center space-x-2 text-white font-bold">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>Replace Temporary or Current Password</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Initial system credentials are automatically provided in the fields. You can replace and update your secure password anytime from the Dashboard and it will remain the same and secure. Once updated, your new password will be required for all future sign-ins.
              </p>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start space-x-2 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-start space-x-2 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-500 font-medium flex items-center justify-between">
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
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">New Password *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPasswordInput}
                    onChange={e => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new password (min 5 chars)..."
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Confirm New Password *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPasswordInput}
                    onChange={e => setConfirmPasswordInput(e.target.value)}
                    placeholder="Re-enter new password..."
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200/90">
              <span className="text-[#71717a] text-[11px]">
                Account: <strong className="text-zinc-300 font-mono">{currentUser.email}</strong>
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-[#f1f5f9] border border-slate-200/90 text-slate-500 hover:text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Key className="h-4 w-4" />
                  <span>Update Password</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
