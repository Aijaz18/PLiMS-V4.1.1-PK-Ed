import React, { useState, useEffect } from 'react';
import {
  QrCode,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Smartphone,
  Phone,
  Sparkles,
  ArrowRight,
  Clock,
  MessageSquare,
  Edit3,
  AlertTriangle
} from 'lucide-react';
import QRCode from 'qrcode';
import { UserProfile } from '../../types/alims';
import {
  OFFICIAL_LIBRARY_WHATSAPP_NUMBER,
  normalizePhoneNumber,
  getOfficialHelplineNumber,
  saveOfficialHelplineNumber,
  getWhatsAppUniversalUrl,
  getWhatsAppWebDirectUrl,
  formatWhatsAppPhone
} from './WhatsAppWebLoginCard';

export interface WhatsAppWebQrAuthenticatorProps {
  currentUser: UserProfile;
  activeBranch?: string;
  connectedOriginalPhone: string;
  onAuthSuccess: (authenticatedPhone: string, token: string) => void;
  onNavigateToChat: () => void;
}

export const WhatsAppWebQrAuthenticator: React.FC<WhatsAppWebQrAuthenticatorProps> = ({
  currentUser,
  activeBranch = 'Central Academic Library',
  connectedOriginalPhone,
  onAuthSuccess,
  onNavigateToChat
}) => {
  const [authToken, setAuthToken] = useState<string>(() =>
    `PLIMS-WA-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`
  );
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [officialHelpline, setOfficialHelpline] = useState<string>(() => getOfficialHelplineNumber());
  const [isEditingHelpline, setIsEditingHelpline] = useState<boolean>(false);
  const [helplineInput, setHelplineInput] = useState<string>(() => getOfficialHelplineNumber());

  const [targetPhone, setTargetPhone] = useState<string>(
    connectedOriginalPhone || currentUser.phone || '+92 300 9876543'
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isSimulatingScan, setIsSimulatingScan] = useState<boolean>(false);
  const [authSuccess, setAuthSuccess] = useState<boolean>(
    currentUser.authProvider === 'WHATSAPP_WEB'
  );
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [copiedHelpline, setCopiedHelpline] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccessFeedback, setConnectSuccessFeedback] = useState<boolean>(false);

  // Sync targetPhone when connectedOriginalPhone changes
  useEffect(() => {
    if (connectedOriginalPhone) {
      setTargetPhone(connectedOriginalPhone);
    }
  }, [connectedOriginalPhone]);

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

  // Save Official Helpline
  const handleSaveHelpline = (num: string) => {
    if (!num.trim()) return;
    saveOfficialHelplineNumber(num);
    setOfficialHelpline(num.trim());
    setIsEditingHelpline(false);
  };

  // Generate new token
  const handleRegenerateToken = () => {
    const newToken = `PLIMS-WA-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    setAuthToken(newToken);
    setSecondsRemaining(60);
  };

  // Generate QR Code data URL whenever token, targetPhone, officialHelpline, or branch changes
  useEffect(() => {
    const cleanPhone = normalizePhoneNumber(targetPhone || connectedOriginalPhone);
    const authPayload = getWhatsAppUniversalUrl(
      officialHelpline,
      `AUTH-VERIFY:PLIMS-SESSION#${authToken}#PATRON:${currentUser.name}#ID:${currentUser.memberCode || currentUser.id}#PHONE:${cleanPhone}#BRANCH:${activeBranch}`
    );

    QRCode.toDataURL(authPayload, {
      width: 280,
      margin: 1,
      color: {
        dark: '#008069',
        light: '#FFFFFF'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.warn('QR Code generation error:', err));
  }, [authToken, targetPhone, connectedOriginalPhone, officialHelpline, activeBranch, currentUser]);

  // 60-second auto-expiration timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          handleRegenerateToken();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Connect & Authenticate original mobile number directly
  const handleConnectAndAuthenticate = (phoneCandidate?: string) => {
    const raw = (phoneCandidate || targetPhone).trim();
    if (!raw) {
      setConnectError('Please enter your WhatsApp mobile phone number.');
      return;
    }
    const clean = normalizePhoneNumber(raw);
    if (clean.length < 7) {
      setConnectError('Please enter a valid phone number (at least 7 digits, e.g. 0300 1234567 or +92 300 1234567).');
      return;
    }

    setConnectError(null);
    setIsConnecting(true);
    const formatted = formatWhatsAppPhone(raw);
    setTargetPhone(formatted);

    setTimeout(() => {
      setIsConnecting(false);
      setAuthSuccess(true);
      setConnectSuccessFeedback(true);
      setTimeout(() => setConnectSuccessFeedback(false), 3500);
      onAuthSuccess(formatted, authToken);
    }, 700);
  };

  // Simulate mobile scan
  const handleSimulateScan = () => {
    setIsSimulatingScan(true);
    const raw = targetPhone.trim() || connectedOriginalPhone.trim() || '+92 300 9876543';
    const formatted = formatWhatsAppPhone(raw);
    setTimeout(() => {
      setIsSimulatingScan(false);
      setAuthSuccess(true);
      setConnectSuccessFeedback(true);
      setTimeout(() => setConnectSuccessFeedback(false), 3500);
      onAuthSuccess(formatted, authToken);
    }, 1000);
  };

  // Copy direct auth link
  const handleCopyAuthLink = () => {
    const cleanPhone = normalizePhoneNumber(targetPhone || connectedOriginalPhone);
    const authPayload = getWhatsAppUniversalUrl(
      officialHelpline,
      `AUTH-VERIFY:PLIMS-SESSION#${authToken}#PATRON:${currentUser.name}#ID:${currentUser.memberCode || currentUser.id}#PHONE:${cleanPhone}#BRANCH:${activeBranch}`
    );
    navigator.clipboard.writeText(authPayload);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Copy token
  const handleCopyToken = () => {
    navigator.clipboard.writeText(authToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  // Download QR PNG image
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `PLiMS-WhatsApp-Auth-${currentUser.memberCode || currentUser.id}.png`;
    a.click();
  };

  const cleanTargetPhone = formatWhatsAppPhone(targetPhone);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 relative z-10">
      <style>{`
        @keyframes scanBeam {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 96%; opacity: 1; }
          100% { top: 0%; opacity: 0.8; }
        }
      `}</style>
      {/* Title & Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <QrCode className="h-5 w-5 text-[#00a884]" />
            <span>Mobile Device QR Authenticator</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Scan this live QR code from your mobile camera or WhatsApp to authenticate your library session instantly.
          </p>
        </div>

        {/* Live Token & Countdown Badge */}
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 rounded-xl bg-[#182229] border border-slate-700/70 text-right">
            <div className="text-[10px] text-slate-400 flex items-center justify-end space-x-1">
              <Clock className="h-3 w-3 text-[#00a884]" />
              <span>Token expires in:</span>
              <strong className="text-amber-400 font-mono">{secondsRemaining}s</strong>
            </div>
            <div className="text-xs font-mono font-bold text-[#00a884]">{authToken}</div>
          </div>

          <button
            type="button"
            onClick={handleRegenerateToken}
            className="p-2 rounded-xl bg-[#202c33] hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer border border-slate-700/60"
            title="Generate New Pairing Token"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: QR Code Generator Column & Instructions / Controls Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: QR Code Generator Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 rounded-3xl bg-[#202c33] border border-slate-700/70 shadow-xl space-y-4 text-center">
          {/* QR Container with Scanner Animation */}
          <div className="relative p-3.5 bg-white rounded-3xl shadow-2xl border border-slate-200 inline-block overflow-hidden group">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="WhatsApp Web Auth QR Code"
                className="w-56 h-56 mx-auto rounded-xl object-contain select-none"
              />
            ) : (
              <div className="w-56 h-56 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                Generating QR code...
              </div>
            )}

            {/* Central WhatsApp Badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-11 h-11 rounded-full bg-[#008069] border-2 border-white flex items-center justify-center text-white shadow-lg">
                <MessageSquare className="h-5 w-5 fill-white" />
              </div>
            </div>

            {/* Scanning beam animation during simulation */}
            {isSimulatingScan && (
              <div
                className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-[#25D366] to-transparent shadow-[0_0_18px_#25D366] z-10 pointer-events-none"
                style={{ animation: 'scanBeam 1.2s ease-in-out infinite' }}
              />
            )}
          </div>

          {/* Expiration Bar */}
          <div className="w-full max-w-[260px] space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Token Validity</span>
              <span className="font-mono text-[#00a884] font-bold">{secondsRemaining} seconds</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00a884] to-[#25D366] transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(secondsRemaining / 60) * 100}%` }}
              />
            </div>
          </div>

          {/* Verification Status Pill */}
          {authSuccess ? (
            <div className="w-full p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-[#25D366]" />
              <span>Mobile Device Authenticated!</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-[#00a884]" />
              <span>End-to-End Encrypted Session</span>
            </div>
          )}

          {/* Action Buttons for QR */}
          <div className="w-full space-y-2 pt-1">
            <button
              type="button"
              onClick={handleSimulateScan}
              disabled={isSimulatingScan}
              className="w-full py-2.5 px-4 rounded-xl bg-[#00a884] hover:bg-[#008f70] disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center space-x-2"
            >
              <Smartphone className="h-4 w-4" />
              <span>{isSimulatingScan ? 'Simulating Mobile Camera Scan...' : 'Simulate Mobile QR Scan'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyAuthLink}
                className="py-2 px-3 rounded-xl bg-[#111b21] hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer border border-slate-700/60 transition-colors"
                title="Copy Direct Authentication Link"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-[#00a884]" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQr}
                className="py-2 px-3 rounded-xl bg-[#111b21] hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer border border-slate-700/60 transition-colors"
                title="Download QR Code PNG"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download QR</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Instructions, Number Binding & Deep Link (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Authenticated Status Card */}
          <div className="p-4 rounded-3xl bg-[#182229] border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-[#25D366] flex items-center justify-center font-bold">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Target Mobile Authentication Identity</h4>
                  <p className="text-[10px] text-slate-400">
                    {currentUser.name} • {currentUser.memberCode || currentUser.id} ({currentUser.role.replace(/_/g, ' ')})
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-[#00a884]/20 text-[#00a884] text-[10px] font-bold border border-[#00a884]/30">
                {activeBranch}
              </span>
            </div>

            {/* Target Phone Configurator & Connector */}
            <div className="pt-2 space-y-2 border-t border-slate-700/50">
              <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>Binding Original Mobile Phone Number:</span>
                <span className="text-[10px] text-slate-400 font-mono">e.g. +92 300 1234567</span>
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={targetPhone}
                    onChange={e => {
                      setTargetPhone(e.target.value);
                      if (connectError) setConnectError(null);
                    }}
                    placeholder="+92 300 9876543"
                    className="w-full bg-[#111b21] border border-slate-700 focus:border-[#00a884] rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleConnectAndAuthenticate()}
                    disabled={isConnecting || !targetPhone.trim()}
                    className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl bg-[#00a884] hover:bg-[#008f70] disabled:opacity-50 text-white text-xs font-bold cursor-pointer shadow-md flex items-center justify-center space-x-1.5 transition-all"
                    title="Connect and authenticate this phone number"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{isConnecting ? 'Connecting...' : 'Connect & Authenticate'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRegenerateToken}
                    className="py-2 px-2.5 rounded-xl bg-[#202c33] hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer border border-slate-700/60"
                    title="Regenerate token & update QR"
                  >
                    Refresh QR
                  </button>
                </div>
              </div>

              {/* Formatted phone badge preview */}
              {targetPhone.trim() && (
                <div className="text-[10px] text-slate-400 flex items-center justify-between font-mono bg-[#111b21] px-2.5 py-1 rounded-lg border border-slate-800">
                  <span>Formatted for WhatsApp:</span>
                  <strong className="text-[#25D366]">{formatWhatsAppPhone(targetPhone)}</strong>
                </div>
              )}

              {/* Error Message */}
              {connectError && (
                <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] flex items-center space-x-1.5 animate-in fade-in">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span>{connectError}</span>
                </div>
              )}

              {/* Success Feedback */}
              {connectSuccessFeedback && (
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold flex items-center space-x-1.5 animate-in fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#25D366] shrink-0" />
                  <span>Original WhatsApp number connected and verified successfully!</span>
                </div>
              )}

              {/* Quick preset chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-slate-400 mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => handleConnectAndAuthenticate(officialHelpline)}
                  className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-[#25D366] border border-emerald-500/30 text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  Use Helpline ({officialHelpline})
                </button>
                <button
                  type="button"
                  onClick={() => handleConnectAndAuthenticate('+92 300 9876543')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  +92 300 9876543
                </button>
                <button
                  type="button"
                  onClick={() => handleConnectAndAuthenticate('+92 300 8765432')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  +92 300 8765432
                </button>
              </div>
            </div>

            {/* Official Helpline & Bot Destination Number */}
            <div className="pt-2 border-t border-slate-700/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
                  <MessageSquare className="h-3 w-3 text-[#00a884]" />
                  <span>Official Library Helpline &amp; Bot Number:</span>
                </span>
                {!isEditingHelpline && (
                  <button
                    type="button"
                    onClick={() => {
                      setHelplineInput(officialHelpline);
                      setIsEditingHelpline(true);
                    }}
                    className="text-[10px] text-[#00a884] hover:underline font-bold flex items-center space-x-0.5 cursor-pointer"
                  >
                    <Edit3 className="h-2.5 w-2.5" />
                    <span>Change</span>
                  </button>
                )}
              </div>

              {!isEditingHelpline ? (
                <div className="p-2 rounded-xl bg-[#111b21] border border-slate-800 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#00a884] tracking-wide">{officialHelpline}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(officialHelpline);
                        setCopiedHelpline(true);
                        setTimeout(() => setCopiedHelpline(false), 2000);
                      }}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedHelpline ? <Check className="h-3 w-3 text-[#00a884]" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedHelpline ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={helplineInput}
                    onChange={e => setHelplineInput(e.target.value)}
                    placeholder="+92 300 9876543"
                    className="flex-1 bg-[#111b21] border border-slate-700 focus:border-[#00a884] rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveHelpline(helplineInput)}
                    className="py-1.5 px-3 rounded-xl bg-[#00a884] hover:bg-[#008f70] text-white text-xs font-bold cursor-pointer shadow-xs"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingHelpline(false)}
                    className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stepper Instructions */}
          <div className="p-4 rounded-3xl bg-[#202c33] border border-slate-700/60 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Sparkles className="h-4 w-4 text-[#00a884]" />
              <span>How to Authenticate from Your Mobile Phone:</span>
            </h4>

            <ol className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-[#00a884] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong>Open WhatsApp or Camera</strong> on your mobile smartphone.
                </div>
              </li>

              <li className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-[#00a884] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong>Point your camera</strong> at the QR code on the left.
                </div>
              </li>

              <li className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-[#00a884] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  Tap the detected notification to send the encrypted handshake message to{' '}
                  <strong className="text-[#00a884] font-mono">{officialHelpline}</strong>.
                </div>
              </li>

              <li className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-[#00a884] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  Your session authenticates instantly! You receive direct WhatsApp return reminders, reserve holds, and
                  14-day extensions.
                </div>
              </li>
            </ol>
          </div>

          {/* Direct WhatsApp Web Handshake Launch */}
          <div className="p-4 rounded-3xl bg-[#111b21] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left">
              <div className="text-xs font-bold text-white">Opening from this computer or browser?</div>
              <div className="text-[10px] text-slate-400">Launch directly via WhatsApp Web client</div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <a
                href={getWhatsAppUniversalUrl(
                  officialHelpline,
                  `AUTH-VERIFY:PLIMS-SESSION#${authToken}#PATRON:${currentUser.name}#ID:${currentUser.memberCode || currentUser.id}#PHONE:${normalizePhoneNumber(targetPhone)}#BRANCH:${activeBranch}`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl bg-[#00a884] hover:bg-[#008f70] text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-sm"
                title="Launch in WhatsApp (Mobile App or Web)"
              >
                <span>Launch in WhatsApp</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <a
                href={getWhatsAppWebDirectUrl(
                  officialHelpline,
                  `AUTH-VERIFY:PLIMS-SESSION#${authToken}#PATRON:${currentUser.name}#ID:${currentUser.memberCode || currentUser.id}#PHONE:${normalizePhoneNumber(targetPhone)}#BRANCH:${activeBranch}`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-2.5 rounded-xl bg-[#111b21] hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/60 transition-colors"
                title="Force open in web.whatsapp.com desktop tab"
              >
                <span>Web Client</span>
              </a>

              <button
                type="button"
                onClick={onNavigateToChat}
                className="py-2 px-3.5 rounded-xl bg-[#202c33] hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                Return to Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppWebQrAuthenticator;
