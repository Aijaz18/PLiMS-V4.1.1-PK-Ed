import React, { useState } from 'react';
import {
  Monitor,
  Download,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  HardDrive,
  Cpu,
  Layers,
  FileCode,
  Terminal,
  Settings,
  HelpCircle,
  Sparkles,
  Printer,
  QrCode,
  Wifi,
  WifiOff,
  FolderArchive,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  BookOpen,
  ArrowRight,
  Database
} from 'lucide-react';

interface InstallerItem {
  id: string;
  filename: string;
  name: string;
  badge: string;
  arch: string;
  minOs: string;
  sizeFormatted: string;
  sha256: string;
  downloadUrl: string;
  secondaryUrl?: string;
  secondaryLabel?: string;
  description: string;
  recommendedFor: string;
  accentColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const DesktopPackageModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'INSTALLERS' | 'FEATURES' | 'HARDWARE' | 'GUIDE' | 'VERIFY'>('INSTALLERS');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMatch, setVerifyMatch] = useState<boolean | null>(null);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (e: React.MouseEvent, url: string, filename: string, id: string) => {
    e.preventDefault();
    setDownloadingId(id);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP status ${response.status}`);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2500);
    } catch {
      // Fallback directly to native browser download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => setDownloadingId(null), 1500);
    }
  };

  const defaultInstallers: InstallerItem[] = [
    {
      id: 'setup-x64',
      filename: 'PLiMS-4.1.1-Setup-x64.exe',
      name: 'Official Windows Desktop Installer (64-Bit)',
      badge: 'RECOMMENDED (ALL MODULES)',
      arch: 'Windows x64 (AMD64 / Intel 64-bit)',
      minOs: 'Windows 11 / Windows 10 / Server 2016+ (64-bit)',
      sizeFormatted: '2.46 MB (Official NSIS Installer)',
      sha256: '7452fbb808103a5ca2e241a357d4eef36dcf15f542ea8aeac92c714449ca50ea',
      downloadUrl: '/api/desktop/download/PLiMS-4.1.1-Setup-x64.exe',
      description: 'Authentic Windows 64-bit Nullsoft Setup Installer. Includes automated directory setup in %LOCALAPPDATA%\\PLiMS-4.1.1, Desktop and Start Menu shortcuts, uninstaller, and automatic local engine launch.',
      recommendedFor: 'Main circulation desks, head librarian workstations, and high-performance cataloguing PCs.',
      accentColor: 'from-emerald-600 to-teal-700',
      icon: Monitor
    },
    {
      id: 'setup-x32',
      filename: 'PLiMS-4.1.1-Setup-x32.exe',
      name: 'Official Windows Desktop Installer (32-Bit)',
      badge: 'LEGACY HARDWARE (ALL MODULES)',
      arch: 'Windows x86 (32-bit Legacy Architecture)',
      minOs: 'Windows 7 SP1 / 8 / 8.1 / 10 / 11 (32-bit & 64-bit compatible)',
      sizeFormatted: '2.46 MB (Official 32-Bit Installer)',
      sha256: '38f3d6450c22b6a01c8a806b709691a4c59d48d231eaa4803618eec8a1b2faae',
      downloadUrl: '/api/desktop/download/PLiMS-4.1.1-Setup-x32.exe',
      description: 'Genuine 32-bit setup installer engineered for older PCs in schools, colleges, and rural municipal public libraries across Pakistan. Runs with zero admin rights requirement.',
      recommendedFor: 'Older computers with 2GB-4GB RAM, Intel Core 2 Duo / Pentium or 32-bit Windows installations.',
      accentColor: 'from-blue-600 to-indigo-700',
      icon: Cpu
    },
    {
      id: 'setup-portable',
      filename: 'PLiMS-4.1.1-Setup-x64.Portable.exe',
      name: 'Official Windows Desktop Portable Runner',
      badge: 'ZERO INSTALLATION / USB FLASH',
      arch: 'Windows x64 Portable Executable',
      minOs: 'Windows 10 / 11 / Server (Runs from USB flash drive)',
      sizeFormatted: '2.47 MB (Self-Extracting Portable)',
      sha256: 'f70291195294d8d355e0a2227747d5d7c470f5b8904243be87f13ff925560eb6',
      downloadUrl: '/api/desktop/download/PLiMS-4.1.1-Setup-x64.Portable.exe',
      secondaryUrl: '/api/desktop/download/PLiMS-4.1.1-Setup-x64.Portable.zip',
      secondaryLabel: 'Download Portable .ZIP Archive (3.72 MB)',
      description: 'Zero-installation standalone package. Run directly from a USB flash drive or folder without modifying Windows Registry. Includes all modules and local server.',
      recommendedFor: 'Traveling library auditors, branch inspection officers, and shared computers with guest rights.',
      accentColor: 'from-amber-600 to-orange-700',
      icon: FolderArchive
    },
    {
      id: 'setup-portable-zip',
      filename: 'PLiMS-4.1.1-Setup-x64.Portable.zip',
      name: 'Official Windows Portable Archive (ZIP)',
      badge: 'UNIVERSAL ZIP FOR USB',
      arch: 'Universal (All Windows Editions)',
      minOs: 'Windows 7 / 8 / 10 / 11 / Server (Extract directly to USB)',
      sizeFormatted: '3.72 MB (Standard ZIP Archive)',
      sha256: '4d5a497d08bcdde8c0caf289a4d16606aee180aeb9a648ddc763a7833487fa7b',
      downloadUrl: '/api/desktop/download/PLiMS-4.1.1-Setup-x64.Portable.zip',
      description: 'Standard ZIP package with 100% clean archive integrity. Simply right-click and Extract All to any folder or USB stick, then double-click PLiMS-Launch.bat to start.',
      recommendedFor: 'Users who prefer standard zip extraction without running executable setup wizards.',
      accentColor: 'from-purple-600 to-indigo-700',
      icon: FolderArchive
    }
  ];

  const [installers, setInstallers] = useState<InstallerItem[]>(defaultInstallers);

  React.useEffect(() => {
    fetch('/api/desktop/manifest')
      .then(res => res.json())
      .then(data => {
        if (data && data.packages) {
          setInstallers(prev => prev.map(item => {
            const pkg = data.packages.find((p: any) => p.filename === item.filename);
            if (pkg) {
              return {
                ...item,
                sizeFormatted: pkg.sizeFormatted || item.sizeFormatted,
                sha256: pkg.sha256 || item.sha256
              };
            }
            return item;
          }));
        }
      })
      .catch(() => {});
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleFileDropOrSelect = async (file: File) => {
    setVerificationFile(file);
    setIsVerifying(true);
    setVerifyMatch(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setComputedHash(hashHex);

      const matched = installers.some(i => i.sha256.toLowerCase() === hashHex.toLowerCase());
      setVerifyMatch(matched);
    } catch (err) {
      console.error('Error computing checksum:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 shadow-xs">
              Official Desktop Release v4.1.1
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-emerald-300 border border-emerald-400/30">
              Department of Libraries • Government of Pakistan
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            PLiMS 4.1.1 Windows Desktop Package &amp; Installers
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Deploy the official Pakistan Library Management System natively on Windows workstations.
            Featuring offline SQLite circulation resilience, high-speed thermal slip printing, automated USB barcode reader integration, and 24/7 AI Librarian Bot.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={(e) => handleDownload(e, '/api/desktop/download/PLiMS-4.1.1-Setup-x64.exe', 'PLiMS-4.1.1-Setup-x64.exe', 'banner-x64')}
              disabled={downloadingId === 'banner-x64'}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-75 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg transition-all cursor-pointer"
            >
              {downloadingId === 'banner-x64' ? (
                <>
                  <div className="h-4 w-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  <span>Downloading x64 Installer...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download x64 Installer (.exe)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={(e) => handleDownload(e, '/api/desktop/download/PLiMS-4.1.1-Setup-x32.exe', 'PLiMS-4.1.1-Setup-x32.exe', 'banner-x32')}
              disabled={downloadingId === 'banner-x32'}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-75 text-white font-bold text-xs flex items-center space-x-2 border border-white/20 transition-all cursor-pointer"
            >
              {downloadingId === 'banner-x32' ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Downloading x32 Installer...</span>
                </>
              ) : (
                <>
                  <Cpu className="h-4 w-4 text-blue-400" />
                  <span>Download x32 Installer (Legacy)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={(e) => handleDownload(e, '/api/desktop/download/PLiMS-4.1.1-Setup-x64.Portable.zip', 'PLiMS-4.1.1-Setup-x64.Portable.zip', 'banner-portable')}
              disabled={downloadingId === 'banner-portable'}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-75 text-white font-bold text-xs flex items-center space-x-2 border border-white/20 transition-all cursor-pointer"
            >
              {downloadingId === 'banner-portable' ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Downloading Portable ZIP...</span>
                </>
              ) : (
                <>
                  <FolderArchive className="h-4 w-4 text-amber-400" />
                  <span>Download Portable Package (ZIP)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('INSTALLERS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'INSTALLERS'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Download className="h-4 w-4" />
          <span>Official Installers</span>
        </button>

        <button
          onClick={() => setActiveTab('FEATURES')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'FEATURES'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Desktop Features &amp; Architecture</span>
        </button>

        <button
          onClick={() => setActiveTab('HARDWARE')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'HARDWARE'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Printer className="h-4 w-4" />
          <span>Hardware &amp; Thermal Printer Setup</span>
        </button>

        <button
          onClick={() => setActiveTab('GUIDE')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'GUIDE'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Step-by-Step Installation Guide</span>
        </button>

        <button
          onClick={() => setActiveTab('VERIFY')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'VERIFY'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>SHA-256 Checksum Verifier</span>
        </button>
      </div>

      {/* TAB 1: INSTALLERS */}
      {activeTab === 'INSTALLERS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {installers.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-white hover:border-emerald-400 hover:shadow-xl transition-all p-6 flex flex-col justify-between space-y-4 group"
                >
                  <div>
                    {/* Header Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full text-white bg-gradient-to-r ${item.accentColor} shadow-xs`}>
                        {item.badge}
                      </span>
                      <span className="text-xs font-mono text-slate-500 font-semibold">
                        {item.sizeFormatted}
                      </span>
                    </div>

                    {/* Title & Icon */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-3 rounded-2xl bg-slate-100 text-slate-800 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                        <IconComp className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-tight">
                          {item.name}
                        </h3>
                        <div className="text-xs text-slate-500 font-medium">
                          {item.arch}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {item.description}
                    </p>

                    {/* Recommendation pill */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 mb-4">
                      <span className="font-bold text-slate-800">Target Environment: </span>
                      {item.recommendedFor}
                    </div>

                    {/* Requirements */}
                    <div className="text-[11px] text-slate-500 space-y-1 mb-2 font-mono">
                      <div>• Minimum OS: {item.minOs}</div>
                      <div>• Release File: <span className="text-slate-900 font-bold">{item.filename}</span></div>
                    </div>
                  </div>

                  {/* Download Buttons & Checksum */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => handleDownload(e, item.downloadUrl, item.filename, item.id)}
                      disabled={downloadingId === item.id}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-75 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
                    >
                      {downloadingId === item.id ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Downloading Authentic Installer...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          <span>Download {item.filename}</span>
                        </>
                      )}
                    </button>

                    {item.secondaryUrl && (
                      <button
                        type="button"
                        onClick={(e) => handleDownload(e, item.secondaryUrl!, `${item.filename}.zip`, `${item.id}-zip`)}
                        disabled={downloadingId === `${item.id}-zip`}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                      >
                        {downloadingId === `${item.id}-zip` ? (
                          <>
                            <div className="h-3.5 w-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                            <span>Downloading ZIP...</span>
                          </>
                        ) : (
                          <>
                            <FolderArchive className="h-4 w-4 text-slate-500" />
                            <span>{item.secondaryLabel || 'Download Portable ZIP Bundle'}</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* SHA-256 Copy button */}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.sha256, item.id)}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between font-mono cursor-pointer transition-colors"
                      title="Click to copy SHA-256 Checksum"
                    >
                      <span className="truncate max-w-[200px]">
                        SHA: {item.sha256.slice(0, 16)}...
                      </span>
                      <span className="flex items-center space-x-1 text-emerald-700 font-bold shrink-0">
                        {copiedHash === item.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-slate-400" />
                            <span>Copy SHA-256</span>
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SHA-256 Master Checksum Bar */}
          <div className="p-5 rounded-3xl bg-slate-900 text-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-lg">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-white text-sm block">Cryptographic Checksums &amp; Verification File</span>
                <span className="font-mono text-slate-400 text-xs">PLiMS-4.1.1-Release-Checksums.sha256</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href="/downloads/PLiMS-4.1.1-Release-Checksums.sha256"
                download="PLiMS-4.1.1-Release-Checksums.sha256"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4 text-emerald-400" />
                <span>Download SHA-256 File</span>
              </a>
              <button
                onClick={() => setActiveTab('VERIFY')}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <span>Verify Downloaded File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FEATURES */}
      {activeTab === 'FEATURES' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4">
              <div className="flex items-center space-x-3 text-emerald-700 font-bold text-base">
                <WifiOff className="h-6 w-6" />
                <h3>100% Offline Circulation &amp; Local SQLite Engine</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Network outages and rural campus connectivity gaps will never interrupt library operations. The desktop engine maintains a local SQLite database that mirrors the circulation desk, member lists, and active book copies.
              </p>
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs text-slate-700 space-y-2">
                <div className="font-bold text-emerald-900">Key Offline Capabilities:</div>
                <ul className="space-y-1 list-disc pl-4 text-slate-600 text-[11px]">
                  <li>Instant barcode scan check-out and return with zero network latency</li>
                  <li>Local fine calculation and receipt issuance with offline queuing</li>
                  <li>Automated synchronization when internet connectivity resumes</li>
                </ul>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4">
              <div className="flex items-center space-x-3 text-blue-700 font-bold text-base">
                <Printer className="h-6 w-6" />
                <h3>Direct Hardware USB / COM Port Communication</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Standard web browsers are restricted by sandbox policies from communicating directly with raw hardware ports. The PLiMS 4.1.1 Desktop Engine interfaces natively with Windows spoolers and serial communication ports.
              </p>
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs text-slate-700 space-y-2">
                <div className="font-bold text-blue-900">Direct Peripheral Support:</div>
                <ul className="space-y-1 list-disc pl-4 text-slate-600 text-[11px]">
                  <li>58mm &amp; 80mm ESC/POS thermal receipt printers without preview dialogs</li>
                  <li>USB 1D/2D QR Barcode scanners with automatic Carriage Return handling</li>
                  <li>High-frequency RFID circulation pads and security antenna gates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HARDWARE DRIVERS */}
      {activeTab === 'HARDWARE' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed flex items-start space-x-3">
            <Printer className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block mb-1">Pre-Installed Windows Hardware Drivers &amp; Protocols</span>
              PLiMS 4.1.1 Desktop includes driver profiles for barcode readers, thermal receipt printers, and RFID gates deployed across Pakistan colleges and universities.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-3">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 w-fit">
                <QrCode className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Barcode &amp; QR Scanners</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Supports USB HID Keyboard Emulation and Virtual COM (CDC-ACM). Auto-detects accession numbers and patron membership cards.
              </p>
              <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <div>Baud Rate: 9600, 115200</div>
                <div>Prefix/Suffix: Automatic CR/LF</div>
                <div>Models: Honeywell, Zebra, Datalogic</div>
              </div>
            </div>

            <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-3">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 w-fit">
                <Printer className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Thermal Receipt Printers</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct ESC/POS slip generation. Prints library letterhead, issued titles, due date warnings, and librarian digital verification.
              </p>
              <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <div>Paper Width: 58mm &amp; 80mm</div>
                <div>Cut Command: Full &amp; Partial Cut</div>
                <div>Models: Epson TM, Xprinter, POS-58</div>
              </div>
            </div>

            <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-3">
              <div className="p-3 rounded-2xl bg-purple-50 text-purple-700 w-fit">
                <Wifi className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">RFID Security Gates &amp; Pads</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enables simultaneous multi-book scanning on the circulation counter and triggers anti-theft EAS alarms at exit gates.
              </p>
              <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <div>Frequency: 13.56 MHz (HF) / UHF</div>
                <div>Standard: ISO 15693 / ISO 18000-3</div>
                <div>Models: 3M, FEIG, TagSys, Invengo</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INSTALLATION GUIDE */}
      {activeTab === 'GUIDE' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-5 rounded-3xl border border-slate-200 bg-white">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                1
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Download the Official Setup Package</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Download <strong>PLiMS-4.1.1-Setup-x64.exe</strong> for 64-bit Windows 10/11 computers. For older 32-bit PCs in school laboratories, download <strong>PLiMS-4.1.1-Setup-x32.exe</strong>. If you want to carry PLiMS on a USB flash drive, choose <strong>PLiMS-4.1.1-Setup-x64.Portable</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-5 rounded-3xl border border-slate-200 bg-white">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                2
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Windows Defender &amp; SmartScreen Verification</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  When running for the first time, Windows SmartScreen may present a security prompt. Click <strong>"More info"</strong> and then select <strong>"Run anyway"</strong>. You can verify the integrity of the binary using our built-in SHA-256 verifier.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-5 rounded-3xl border border-slate-200 bg-white">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                3
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Execute Setup Wizard &amp; Module Installation</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The setup wizard automatically unpacks all compiled PLiMS modules (Cataloguing, Circulation, OPAC, AI Librarian, Reports, Barcodes) into <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">%LOCALAPPDATA%\PLiMS-4.1.1</code> (or custom path), configures the local SQLite cache, and creates Desktop and Start Menu shortcuts with the official PLiMS icon.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-5 rounded-3xl border border-slate-200 bg-white">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                4
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Launch &amp; Access All Modules 100% Offline</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Double-click the <strong>PLiMS 4.1.1 PK Edition</strong> Desktop icon or <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">PLiMS-Launch.bat</code>. The built-in Windows background engine serves the complete suite at <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">http://127.0.0.1:3000</code> with no external Node.js dependencies!
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-5 rounded-3xl border border-amber-200 bg-amber-50/70">
              <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                5
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-950">USB Portable Mode (Plug &amp; Play)</h4>
                <p className="text-xs text-amber-900 leading-relaxed">
                  To run directly from a USB flash drive without installing: Download <code className="bg-amber-100/80 px-1.5 py-0.5 rounded text-xs font-mono">PLiMS-4.1.1-Setup-x64.Portable.zip</code>, extract to your USB flash drive, and double-click <code className="bg-amber-100/80 px-1.5 py-0.5 rounded text-xs font-mono">PLiMS-Portable.bat</code>. All books, transactions, and settings remain saved directly on the USB drive.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CHECKSUM VERIFIER */}
      {activeTab === 'VERIFY' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed flex items-start space-x-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block mb-1">Cryptographic Digital Hash Integrity Verifier</span>
              Ensure your downloaded installer has not been corrupted or tampered with. Drop your installer executable below to calculate its SHA-256 fingerprint in real-time.
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileDropOrSelect(e.dataTransfer.files[0]);
              }
            }}
            className="p-10 rounded-3xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30 transition-all text-center flex flex-col items-center justify-center space-y-4 cursor-pointer"
          >
            <div className="p-4 rounded-3xl bg-white border border-slate-200 text-emerald-600 shadow-sm">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900">
                Drag and drop your downloaded installer file here
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Supports PLiMS-4.1.1-Setup-x64.exe, PLiMS-4.1.1-Setup-x32.exe, or PLiMS-4.1.1-Setup-x64.Portable
              </div>
            </div>
            <label className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs">
              <span>Select File from PC...</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileDropOrSelect(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>

          {/* Verification Results */}
          {verificationFile && (
            <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Examined File:</span>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {verificationFile.name} ({(verificationFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>

              {isVerifying ? (
                <div className="flex items-center space-x-2 text-xs text-emerald-700 font-bold">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Computing cryptographic SHA-256 digest...</span>
                </div>
              ) : computedHash && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="text-xs">
                    <span className="text-slate-500 font-bold block mb-1">Computed SHA-256 Hash:</span>
                    <div className="font-mono text-xs p-3 rounded-xl bg-slate-100 text-slate-900 break-all border border-slate-200">
                      {computedHash}
                    </div>
                  </div>

                  {verifyMatch === true ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center space-x-3 text-xs font-bold">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                      <span>AUTHENTIC &amp; OFFICIAL: This file exactly matches the official PLiMS 4.1.1 Government Digital Release signature.</span>
                    </div>
                  ) : verifyMatch === false ? (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center space-x-3 text-xs">
                      <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
                      <span>NOTICE: The computed hash does not match our pre-registered master build. Ensure your download was completed without interruption.</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
