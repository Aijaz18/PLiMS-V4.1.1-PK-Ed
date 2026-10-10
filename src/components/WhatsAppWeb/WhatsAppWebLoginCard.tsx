import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Phone,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  User,
  ArrowRight,
  BookOpen,
  MessageSquare,
  Lock,
  ChevronRight,
  HelpCircle,
  Copy,
  Check,
  Smartphone,
  AlertTriangle
} from 'lucide-react';
import QRCode from 'qrcode';
import { UserProfile } from '../../types/alims';

export interface WhatsAppWebLoginCardProps {
  users: UserProfile[];
  selectedBranch: string;
  onLoginSuccess: (user: UserProfile, branch: string) => void;
  onSwitchToTraditionalLogin: () => void;
}

export const DEFAULT_OFFICIAL_HELPLINE_NUMBER = '+92 300 9876543';

export function getOfficialHelplineNumber(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('plims_official_helpline_whatsapp_number');
    if (saved && saved.trim()) return saved.trim();
  }
  return DEFAULT_OFFICIAL_HELPLINE_NUMBER;
}

export function saveOfficialHelplineNumber(phone: string): string {
  const trimmed = phone.trim();
  if (typeof window !== 'undefined' && trimmed) {
    localStorage.setItem('plims_official_helpline_whatsapp_number', trimmed);
    window.dispatchEvent(new CustomEvent('plims:helpline_number_updated', { detail: trimmed }));
  }
  return trimmed;
}

// Retain constant for backwards compatibility
export const OFFICIAL_LIBRARY_WHATSAPP_NUMBER = DEFAULT_OFFICIAL_HELPLINE_NUMBER;

/**
 * Normalizes phone numbers strictly into digits for WhatsApp URLs (e.g. 923009876543).
 * Strips all non-digit characters (+, -, spaces, brackets).
 * Handles 03xx -> 923xx, 0092xx -> 92xx, +9203xx -> 923xx, 3xx (10 digits) -> 923xx.
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (!cleaned) return '';

  // Remove leading 00 international dial code (e.g. 0092 -> 92)
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  }

  // Remove accidental 0 after country code 92 (e.g. 920300... -> 92300...)
  if (cleaned.startsWith('920') && cleaned.length >= 12) {
    cleaned = '92' + cleaned.slice(3);
  }

  // Convert Pakistani local 0300... (11 digits starting with 0) to 92300...
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '92' + cleaned.slice(1);
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '92' + cleaned.slice(1);
  } else if (!cleaned.startsWith('92') && cleaned.length === 10 && cleaned.startsWith('3')) {
    // 3001234567 (10 digits starting with 3)
    cleaned = '92' + cleaned;
  }

  return cleaned;
}

/**
 * Robust formatter for WhatsApp phone numbers.
 * Formats Pakistani mobile numbers (+92 3XX XXXXXXX) and international numbers cleanly.
 */
export function formatWhatsAppPhone(phone?: string): string {
  if (!phone || !phone.trim()) return getOfficialHelplineNumber();
  const raw = phone.trim();
  const normalized = normalizePhoneNumber(raw);
  if (!normalized) return raw;

  // Pakistani standard mobile numbers (923001234567 -> +92 300 1234567)
  if (normalized.startsWith('92') && normalized.length === 12) {
    return `+92 ${normalized.slice(2, 5)} ${normalized.slice(5, 8)} ${normalized.slice(8)}`;
  }
  if (normalized.startsWith('92') && normalized.length === 11) {
    return `+92 ${normalized.slice(2, 5)} ${normalized.slice(5)}`;
  }
  // North American (+1 XXX XXX-XXXX)
  if (normalized.startsWith('1') && normalized.length === 11) {
    return `+1 (${normalized.slice(1, 4)}) ${normalized.slice(4, 7)}-${normalized.slice(7)}`;
  }
  // UK (+44 XXXX XXXXXX)
  if (normalized.startsWith('44') && normalized.length >= 11) {
    return `+44 ${normalized.slice(2, 6)} ${normalized.slice(6)}`;
  }
  // Generic international
  if (normalized.length >= 9) {
    return `+${normalized.slice(0, 2)} ${normalized.slice(2, 5)} ${normalized.slice(5)}`;
  }
  return raw.startsWith('+') ? raw : `+${raw}`;
}

/**
 * Builds the official universal WhatsApp Click-to-Chat URL that works reliably across
 * mobile phones (native app deep link) and desktop browsers (app or WhatsApp Web).
 */
export function getWhatsAppUniversalUrl(phone: string, text: string = ''): string {
  const cleanPhone = normalizePhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  if (!encodedText) {
    return `https://wa.me/${cleanPhone}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Builds WhatsApp Web direct URL (for desktop users specifically requesting web.whatsapp.com).
 */
export function getWhatsAppWebDirectUrl(phone: string, text: string = ''): string {
  const cleanPhone = normalizePhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  if (!encodedText) {
    return `https://web.whatsapp.com/send?phone=${cleanPhone}`;
  }
  return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
}

export const WhatsAppWebLoginCard: React.FC<WhatsAppWebLoginCardProps> = ({
  users,
  selectedBranch,
  onLoginSuccess,
  onSwitchToTraditionalLogin
}) => {
  const [loginMethod, setLoginMethod] = useState<'QR' | 'ORIGINAL_PHONE'>('ORIGINAL_PHONE');
  const [officialHelpline, setOfficialHelpline] = useState<string>(() => getOfficialHelplineNumber());
  const [isEditingHelpline, setIsEditingHelpline] = useState<boolean>(false);
  const [helplineInput, setHelplineInput] = useState<string>(() => getOfficialHelplineNumber());
  const [helplineSavedFeedback, setHelplineSavedFeedback] = useState<boolean>(false);

  const [originalPhone, setOriginalPhone] = useState<string>(
    users[0]?.phone || users[0]?.mobileNo || users[0]?.whatsappPhone || '+92 300 9876543'
  );
  const [selectedPatronId, setSelectedPatronId] = useState<string>(users[0]?.id || '');
  const [pairingCode, setPairingCode] = useState('PL92-W8K4');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedOfficialNumber, setCopiedOfficialNumber] = useState(false);

  // Sync when official helpline updates globally
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setOfficialHelpline(e.detail);
        setHelplineInput(e.detail);
      }
    };
    window.addEventListener('plims:helpline_number_updated', handleUpdate);
    return () => window.removeEventListener('plims:helpline_number_updated', handleUpdate);
  }, []);

  // Save Official Helpline & Bot Number
  const handleSaveHelpline = (num: string) => {
    if (!num.trim()) return;
    saveOfficialHelplineNumber(num);
    setOfficialHelpline(num.trim());
    setIsEditingHelpline(false);
    setHelplineSavedFeedback(true);
    setTimeout(() => setHelplineSavedFeedback(false), 2500);
    generateQr();
  };

  // Generate real QR code for WhatsApp Web linking using current helpline number
  const generateQr = () => {
    const activeHelpline = getOfficialHelplineNumber();
    const sessionToken = `PLIMS_WA_WEB_AUTH_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const qrPayload = getWhatsAppUniversalUrl(
      activeHelpline,
      `Assalam-o-Alaikum PLiMS Library! Connecting session token ${sessionToken} for ${selectedBranch}.`
    );
    QRCode.toDataURL(qrPayload, {
      width: 250,
      margin: 1,
      color: {
        dark: '#008069',
        light: '#FFFFFF'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.warn('QR gen error:', err));
  };

  useEffect(() => {
    generateQr();
    const interval = setInterval(generateQr, 45000); // refresh QR every 45s
    return () => clearInterval(interval);
  }, [selectedBranch, officialHelpline]);

  // Check if entered original phone matches an existing member
  const cleanEntered = normalizePhoneNumber(originalPhone);
  const matchedPatron = cleanEntered.length >= 7
    ? users.find(u => {
        const uPhone = normalizePhoneNumber(u.phone || u.mobileNo || u.whatsappPhone || '');
        return uPhone.includes(cleanEntered) || cleanEntered.includes(uPhone);
      })
    : null;

  // Selected user fallback
  const activeTargetUser = matchedPatron || users.find(u => u.id === selectedPatronId) || users[0];

  // Execute WhatsApp Web Login with original number
  const [phoneValidationError, setPhoneValidationError] = useState<string | null>(null);

  const handleCompleteLogin = (targetUser: UserProfile, phoneToLink?: string) => {
    let raw = (phoneToLink || '').trim();
    if (!raw) {
      raw = (targetUser?.phone || targetUser?.mobileNo || targetUser?.whatsappPhone || officialHelpline || '').trim();
    }
    if (!raw) {
      setPhoneValidationError('Please enter your WhatsApp mobile phone number.');
      return;
    }
    const clean = normalizePhoneNumber(raw);
    if (clean.length < 7) {
      setPhoneValidationError('Please enter a valid phone number (at least 7 digits, e.g. 0300 1234567 or +92 300 1234567).');
      return;
    }

    setPhoneValidationError(null);
    setIsVerifying(true);
    const formatted = formatWhatsAppPhone(raw);

    setTimeout(() => {
      const waUser: UserProfile = {
        ...targetUser,
        authProvider: 'WHATSAPP_WEB',
        whatsappPhone: formatted,
        phone: formatted,
        whatsappLinkedAt: new Date().toISOString()
      };
      setIsVerifying(false);
      onLoginSuccess(waUser, selectedBranch);
    }, 600);
  };

  const copyOfficialNumber = () => {
    navigator.clipboard.writeText(officialHelpline);
    setCopiedOfficialNumber(true);
    setTimeout(() => setCopiedOfficialNumber(false), 2000);
  };

  // Student persona
  const studentUser = users.find(u => u.role === 'STUDENT') || users[0];
  // Faculty persona
  const facultyUser = users.find(u => u.role === 'FACULTY' || u.role === 'RESEARCH_SCHOLAR') || users[1] || users[0];
  // Staff persona
  const staffUser = users.find(u => ['SUPER_ADMIN', 'CHIEF_LIBRARIAN', 'LIBRARIAN'].includes(u.role)) || users[0];

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-200">
      {/* WhatsApp Web Iconic Green Banner */}
      <div className="bg-[#008069] px-6 py-4 flex items-center justify-between text-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-white text-[#008069] flex items-center justify-center font-bold shadow-md shrink-0">
            <MessageSquare className="h-5 w-5 fill-[#008069]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-base text-white">WhatsApp Web Library Agent</h3>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold border border-white/30">
                Official Hotline
              </span>
            </div>
            <p className="text-xs text-emerald-100">
              Connect your original phone number or scan the QR code to sync your library account.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSwitchToTraditionalLogin}
          className="text-xs text-emerald-100 hover:text-white underline font-medium cursor-pointer shrink-0"
        >
          Password Login
        </button>
      </div>

      {/* Official WhatsApp Web Number Strip */}
      <div className="bg-[#f0fbf7] px-6 py-2.5 border-b border-emerald-100 text-xs">
        {!isEditingHelpline ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-pulse"></span>
              <span className="text-slate-600 font-medium">Official Helpline &amp; Bot Number:</span>
              <span className="font-mono font-bold text-[#008069] text-sm">{officialHelpline}</span>
              <button
                type="button"
                onClick={() => {
                  setHelplineInput(officialHelpline);
                  setIsEditingHelpline(true);
                }}
                className="px-2 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-[#008069] font-bold text-[10px] transition-colors cursor-pointer"
                title="Edit Official Helpline & Bot Number"
              >
                Change / Add
              </button>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {helplineSavedFeedback && (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1 animate-in fade-in">
                  <Check className="h-3 w-3" />
                  <span>Helpline Saved!</span>
                </span>
              )}
              <button
                type="button"
                onClick={copyOfficialNumber}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center space-x-1 cursor-pointer"
              >
                {copiedOfficialNumber ? <Check className="h-3 w-3 text-[#00a884]" /> : <Copy className="h-3 w-3" />}
                <span>{copiedOfficialNumber ? 'Copied' : 'Copy'}</span>
              </button>
              <span>•</span>
              <a
                href={getWhatsAppUniversalUrl(
                  officialHelpline,
                  `Assalam-o-Alaikum PLiMS Library Assistant! Inquiring for ${selectedBranch}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-[#008069] hover:underline flex items-center space-x-1"
                title="Chat on WhatsApp (Mobile App or Web)"
              >
                <span>Chat on WhatsApp</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <span>•</span>
              <a
                href={getWhatsAppWebDirectUrl(
                  officialHelpline,
                  `Assalam-o-Alaikum PLiMS Library Assistant! Inquiring for ${selectedBranch}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-slate-500 hover:text-[#008069] flex items-center space-x-0.5"
                title="Open WhatsApp Web Client"
              >
                <span>Web Client</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-1.5 bg-white rounded-xl border border-emerald-300 shadow-2xs">
            <div className="flex items-center space-x-2 w-full sm:w-auto flex-1">
              <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">Official Helpline &amp; Bot:</span>
              <input
                type="text"
                value={helplineInput}
                onChange={e => setHelplineInput(e.target.value)}
                placeholder="+92 300 9876543"
                className="flex-1 bg-slate-50 border border-slate-300 focus:border-[#008069] rounded-lg px-2.5 py-1 text-xs font-mono text-slate-900 focus:outline-none"
              />
            </div>
            <div className="flex items-center space-x-1.5 shrink-0 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleSaveHelpline(helplineInput)}
                className="px-3 py-1 rounded-lg bg-[#008069] hover:bg-[#006a57] text-white font-bold text-xs cursor-pointer shadow-2xs"
              >
                Save Helpline
              </button>
              <button
                type="button"
                onClick={() => setIsEditingHelpline(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Body */}
      <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Column: Instructions & Details (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <Smartphone className="h-4 w-4 text-[#008069]" />
              <span>Connect Original Number or Scan QR</span>
            </h4>
            <p className="text-xs text-slate-500">
              Synchronize your personal mobile phone with the official 24/7 WhatsApp Web Agent at {selectedBranch}.
            </p>
          </div>

          {/* Stepper Instructions */}
          <ol className="space-y-2 text-xs text-slate-700">
            <li className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#008069] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <span>Enter your <strong>Original Mobile Number</strong> (e.g. <code>+92 300 XXXXXXX</code>)</span>
            </li>
            <li className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#008069] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <span>Our system matches your patron card or binds the original number</span>
            </li>
            <li className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#008069] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <span>Receive real-time <strong>due reminders</strong> and <strong>14-day renewals</strong></span>
            </li>
          </ol>

          {/* WhatsApp Web Agent Feature Highlights */}
          <div className="p-3 rounded-2xl bg-[#f0fbf7] border border-emerald-200/80 space-y-1 text-[11px] text-[#006a57]">
            <div className="font-bold flex items-center space-x-1.5 text-[#008069]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Direct WhatsApp Web Synchronization:</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="h-3 w-3 text-[#00a884] shrink-0" />
              <span>End-to-end synchronized alerts sent to your original number</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="h-3 w-3 text-[#00a884] shrink-0" />
              <span>Official Library Bot Hotline: {officialHelpline}</span>
            </div>
          </div>

          {/* Quick Demo Test Personas */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Quick One-Click Personas:
            </div>
            <div className="grid grid-cols-3 gap-2">
              {studentUser && (
                <button
                  type="button"
                  onClick={() => {
                    const phone = studentUser.phone || '+92 300 8765432';
                    setOriginalPhone(phone);
                    handleCompleteLogin(studentUser, phone);
                  }}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left transition-all cursor-pointer group"
                >
                  <div className="font-bold text-[11px] text-slate-800 group-hover:text-[#008069] truncate">
                    🎓 Student
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{studentUser.name.split(' ')[0]}</div>
                </button>
              )}

              {facultyUser && (
                <button
                  type="button"
                  onClick={() => {
                    const phone = facultyUser.phone || '+92 321 9876543';
                    setOriginalPhone(phone);
                    handleCompleteLogin(facultyUser, phone);
                  }}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left transition-all cursor-pointer group"
                >
                  <div className="font-bold text-[11px] text-slate-800 group-hover:text-[#008069] truncate">
                    👨‍🏫 Faculty
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{facultyUser.name.split(' ')[0]}</div>
                </button>
              )}

              {staffUser && (
                <button
                  type="button"
                  onClick={() => {
                    const phone = staffUser.phone || '+92 333 1122334';
                    setOriginalPhone(phone);
                    handleCompleteLogin(staffUser, phone);
                  }}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left transition-all cursor-pointer group"
                >
                  <div className="font-bold text-[11px] text-slate-800 group-hover:text-[#008069] truncate">
                    🛡️ Librarian
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{staffUser.name.split(' ')[0]}</div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Original Number Input & Verification (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center text-center space-y-3 p-4 bg-slate-50/80 rounded-3xl border border-slate-200/90">
          {/* Method Selector Tabs */}
          <div className="flex p-1 bg-slate-200/80 rounded-xl w-full text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setLoginMethod('ORIGINAL_PHONE')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                loginMethod === 'ORIGINAL_PHONE' ? 'bg-white text-[#008069] shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Original Number</span>
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('QR')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                loginMethod === 'QR' ? 'bg-white text-[#008069] shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>QR Code</span>
            </button>
          </div>

          {/* Original Number Entry */}
          {loginMethod === 'ORIGINAL_PHONE' && (
            <div className="space-y-3 w-full text-left">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                  <span>Enter Your Original WhatsApp Number:</span>
                  <span className="text-[10px] text-slate-400 font-normal">e.g. +92 300 1234567</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={originalPhone}
                    onChange={e => {
                      setOriginalPhone(e.target.value);
                      if (phoneValidationError) setPhoneValidationError(null);
                    }}
                    placeholder="+92 300 9876543"
                    className="w-full bg-white border border-slate-300 focus:border-[#008069] rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Formatted phone badge preview */}
                {originalPhone.trim() && (
                  <div className="text-[10px] text-slate-600 flex items-center justify-between font-mono bg-slate-100 px-2 py-1 rounded-lg">
                    <span className="text-slate-500">Formatted:</span>
                    <strong className="text-[#008069]">{formatWhatsAppPhone(originalPhone)}</strong>
                  </div>
                )}

                {/* Validation Error Banner */}
                {phoneValidationError && (
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-center space-x-1.5 animate-in fade-in">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                    <span>{phoneValidationError}</span>
                  </div>
                )}

                {/* Quick preset chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setOriginalPhone(officialHelpline)}
                    className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#008069] border border-emerald-200 text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    Use Helpline Number ({officialHelpline})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOriginalPhone('+92 300 9876543')}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition-colors cursor-pointer"
                  >
                    +92 300 9876543
                  </button>
                </div>
              </div>

              {/* Matched Patron Indicator or Selector */}
              {matchedPatron ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-0.5">
                  <div className="font-bold flex items-center space-x-1 text-[#008069]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Matched Patron: {matchedPatron.name}</span>
                  </div>
                  <div className="text-[10px] text-emerald-700">
                    {matchedPatron.memberCode || matchedPatron.id} • {matchedPatron.role.replace(/_/g, ' ')}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Link Original Number to Account:
                  </label>
                  <select
                    value={selectedPatronId}
                    onChange={e => setSelectedPatronId(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-[#008069] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.replace(/_/g, ' ')}) - {u.memberCode || u.id}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pairing code display */}
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 space-y-0.5 text-center">
                <div className="text-[10px] text-slate-400 font-medium">WhatsApp Link Pairing Code:</div>
                <div className="font-mono text-base font-extrabold text-[#008069] tracking-widest">
                  {pairingCode}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCompleteLogin(activeTargetUser, originalPhone)}
                disabled={isVerifying || !originalPhone.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-[#008069] hover:bg-[#006a57] disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center space-x-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isVerifying ? 'Connecting Original Number...' : 'Connect Original Number & Log In'}</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </button>
            </div>
          )}

          {/* QR Code Display */}
          {loginMethod === 'QR' && (
            <div className="space-y-2">
              <div className="relative p-3 bg-white rounded-2xl shadow-md border border-slate-200/80 inline-block group">
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} alt="WhatsApp Web QR Code" className="w-48 h-48 mx-auto" />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                    Generating QR...
                  </div>
                )}

                {/* Center WhatsApp icon */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-9 h-9 rounded-full bg-[#008069] border-2 border-white flex items-center justify-center text-white shadow-md">
                    <MessageSquare className="h-4 w-4 fill-white" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-[#00a884]" />
                <span>Point your phone camera to capture QR</span>
              </div>

              <button
                type="button"
                onClick={() => handleCompleteLogin(activeTargetUser, originalPhone)}
                disabled={isVerifying}
                className="w-full py-2 px-3 rounded-xl bg-[#008069] hover:bg-[#006a57] text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center space-x-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{isVerifying ? 'Verifying Session...' : 'Simulate Phone QR Scan'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppWebLoginCard;
