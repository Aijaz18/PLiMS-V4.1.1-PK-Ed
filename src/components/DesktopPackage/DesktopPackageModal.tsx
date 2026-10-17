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
  X,
  Sparkles,
  Printer,
  QrCode,
  Wifi,
  WifiOff,
  FolderArchive,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export interface DesktopPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'INSTALLERS' | 'FEATURES' | 'HARDWARE' | 'GUIDE' | 'VERIFY';
}

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

export const DesktopPackageModal: React.FC<DesktopPackageModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'INSTALLERS'
}) => {
  const [activeTab, setActiveTab] = useState<'INSTALLERS' | 'FEATURES' | 'HARDWARE' | 'GUIDE' | 'VERIFY'>(defaultTab);
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
      sizeFormatted: '1.52 MB (Official NSIS Installer)',
      sha256: '876b1dd97bcf8f8c2889f50c0fb2d37956d6a6de3c9e84ca9e9e109d9ec1d2cf',
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
      sizeFormatted: '1.53 MB (Official 32-Bit Installer)',
      sha256: 'e98dcd7f4c45460a2ef2b908afc642c2cd045d0b6e64477501fb0065495d3050',
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
      sizeFormatted: '1.51 MB (Self-Extracting Portable)',
      sha256: '0202c6069244261f34907785ca8689e985fafc8e24f371eb1f93c647473032c3',
      downloadUrl: '/api/desktop/download/PLiMS-4.1.1-Setup-x64.Portable.exe',
      secondaryUrl: '/api/desktop/download/PLiMS-4.1.1-Setup-x64.Portable.zip',
      secondaryLabel: 'Download Portable .ZIP Archive (2.29 MB)',
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
      sizeFormatted: '2.29 MB (Standard ZIP Archive)',
      sha256: '92ae193540890ff9f36b53298b5fca5c61a88c8a6d12dfe31eef04d9f93f4c8a',
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-800">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between border-b border-emerald-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
              <Monitor className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold tracking-tight text-white">
                  PLiMS 4.1.1 Official Windows Desktop Package
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500 text-slate-950">
                  Release v4.1.1
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/10 text-emerald-300 border border-emerald-400/30">
                  Official PK Release
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Official Windows Desktop Installers (x64 &amp; x32) and Zero-Installation Portable Edition for Pakistan Academic &amp; Public Libraries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 bg-slate-50 border-b border-slate-200 overflow-x-auto gap-2 py-2">
          <button
            onClick={() => setActiveTab('INSTALLERS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'INSTALLERS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>Official Installers</span>
          </button>

          <button
            onClick={() => setActiveTab('FEATURES')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'FEATURES'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Desktop Features &amp; Offline Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('HARDWARE')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'HARDWARE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Printer className="h-4 w-4" />
            <span>Barcode &amp; Thermal Printer Drivers</span>
          </button>

          <button
            onClick={() => setActiveTab('GUIDE')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'GUIDE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>Installation Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('VERIFY')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'VERIFY'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Checksum &amp; Signature Verifier</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: INSTALLERS */}
          {activeTab === 'INSTALLERS' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <span className="font-bold">Official Government Digital Release:</span> These installers are compiled specifically for PLiMS 4.1.1 PK Edition. They come pre-configured with the National Library MARC21 authority schemas, 24/7 AI Librarian Bot, offline SQLite sync cache, and local thermal printer/barcode scanner support.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {installers.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-white hover:border-emerald-400 hover:shadow-lg transition-all p-5 flex flex-col justify-between space-y-4 group"
                    >
                      <div>
                        {/* Header Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full text-white bg-gradient-to-r ${item.accentColor} shadow-xs`}>
                            {item.badge}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 font-semibold">
                            {item.sizeFormatted}
                          </span>
                        </div>

                        {/* Title & Icon */}
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                            <IconComp className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 leading-tight">
                              {item.name}
                            </h3>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {item.arch}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                          {item.description}
                        </p>

                        {/* Recommendation pill */}
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 mb-3">
                          <span className="font-bold text-slate-700">Recommended for: </span>
                          {item.recommendedFor}
                        </div>

                        {/* Requirements */}
                        <div className="text-[10px] text-slate-500 space-y-1 mb-2 font-mono">
                          <div>• OS: {item.minOs}</div>
                          <div>• File: <span className="text-slate-800 font-bold">{item.filename}</span></div>
                        </div>
                      </div>

                      {/* Download Buttons & Checksum */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={(e) => handleDownload(e, item.downloadUrl, item.filename, item.id)}
                          disabled={downloadingId === item.id}
                          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-75 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
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
                            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                          >
                            {downloadingId === `${item.id}-zip` ? (
                              <>
                                <div className="h-3.5 w-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                                <span>Downloading ZIP...</span>
                              </>
                            ) : (
                              <>
                                <FolderArchive className="h-3.5 w-3.5 text-slate-500" />
                                <span>{item.secondaryLabel || 'Download ZIP'}</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* SHA-256 Copy button */}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.sha256, item.id)}
                          className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] text-slate-500 flex items-center justify-between font-mono cursor-pointer transition-colors"
                          title="Click to copy SHA-256 Checksum"
                        >
                          <span className="truncate max-w-[170px]">
                            SHA: {item.sha256.slice(0, 14)}...
                          </span>
                          <span className="flex items-center space-x-1 text-emerald-700 font-bold shrink-0">
                            {copiedHash === item.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 text-slate-400" />
                                <span>Copy</span>
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SHA256 Sums & Master Package Info */}
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white">Full Release Checksums: </span>
                    <span className="font-mono text-slate-300">PLiMS-4.1.1-Release-Checksums.sha256</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href="/downloads/PLiMS-4.1.1-Release-Checksums.sha256"
                    download="PLiMS-4.1.1-Release-Checksums.sha256"
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Download Checksums</span>
                  </a>
                  <button
                    onClick={() => setActiveTab('VERIFY')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <span>Verify My File</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FEATURES */}
          {activeTab === 'FEATURES' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
                    <WifiOff className="h-5 w-5" />
                    <h4>100% Offline Circulation &amp; Local SQLite Cache</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Even during campus-wide network outages or load-shedding, the PLiMS 4.1.1 Desktop Engine allows issue, return, renewals, and patron fine calculations using a lightning-fast local SQLite database.
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                    <li>Zero-latency book barcode check-in and check-out</li>
                    <li>Auto-queues transactions when Internet disconnects</li>
                    <li>Automatic 2-way cloud reconciliation upon reconnection</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
                    <Printer className="h-5 w-5" />
                    <h4>Direct Hardware USB/COM &amp; Thermal Slip Printing</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Web browsers cannot directly send raw byte sequences to serial ports. The Desktop Package communicates directly with Windows Spooler and ESC/POS thermal printers (58mm &amp; 80mm).
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                    <li>Thermal checkout receipt printing with due date warnings</li>
                    <li>Honeywell, Datalogic &amp; Zebra USB scanner instant decode</li>
                    <li>RFID gate tag reader ISO 15693 / 18000-3 integration</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center space-x-2 text-purple-700 font-bold text-sm">
                    <Sparkles className="h-5 w-5" />
                    <h4>Integrated 24/7 AI Librarian Bot &amp; Auto-MARC21</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Includes the modern AI Librarian Bot capable of handling patron book loans, renewal requests, catalog lookups, fine waivers, and research inquiries round the clock.
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                    <li>Voice-to-MARC21 AI cataloguing for books</li>
                    <li>Vision Cover AI camera scanner for automatic ISBN identification</li>
                    <li>Speech synthesis (TTS) &amp; voice query recognition</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center space-x-2 text-amber-700 font-bold text-sm">
                    <HardDrive className="h-5 w-5" />
                    <h4>Automated Daily Database Backups &amp; SQL Dump</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    The desktop package registers a scheduled Windows Task that executes nightly automated backups of all library records into timestamped SQL and JSON archive dumps.
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                    <li>Compatible with XAMPP MySQL, MariaDB, and PostgreSQL</li>
                    <li>One-click database restore tool in case of PC failure</li>
                    <li>AES-256 encrypted archival export to flash drives</li>
                  </ul>
                </div>
              </div>

              {/* Comparison Matrix Table */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                <div className="bg-slate-50 px-4 py-3 font-bold text-xs text-slate-800 border-b border-slate-200">
                  Feature Comparison: Cloud Web vs. Desktop 64-Bit vs. Desktop 32-Bit vs. Portable
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-mono text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5">Feature</th>
                        <th className="px-4 py-2.5 text-center">Cloud Web</th>
                        <th className="px-4 py-2.5 text-center bg-emerald-50 text-emerald-800">Desktop x64</th>
                        <th className="px-4 py-2.5 text-center">Desktop x32</th>
                        <th className="px-4 py-2.5 text-center">Portable x64</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="px-4 py-2 font-medium">Offline Circulation Desk</td>
                        <td className="px-4 py-2 text-center text-amber-600">Cached only</td>
                        <td className="px-4 py-2 text-center text-emerald-600 font-bold bg-emerald-50/50">Full SQLite</td>
                        <td className="px-4 py-2 text-center text-emerald-600 font-bold">Full SQLite</td>
                        <td className="px-4 py-2 text-center text-emerald-600 font-bold">Full SQLite</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">Raw Thermal ESC/POS Slip Printing</td>
                        <td className="px-4 py-2 text-center text-slate-400">Browser Dialog</td>
                        <td className="px-4 py-2 text-center text-emerald-600 font-bold bg-emerald-50/50">Direct USB/COM</td>
                        <td className="px-4 py-2 text-center text-emerald-600 font-bold">Direct USB/COM</td>
                        <td className="px-4 py-2 text-center text-emerald-600 font-bold">Direct USB/COM</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">Requires Administrator Rights</td>
                        <td className="px-4 py-2 text-center text-emerald-600">No</td>
                        <td className="px-4 py-2 text-center text-slate-600 bg-emerald-50/50">For Service only</td>
                        <td className="px-4 py-2 text-center text-slate-600">For Service only</td>
                        <td className="px-4 py-2 text-center text-emerald-600 font-bold">Zero Admin</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">Runs from USB Flash Drive</td>
                        <td className="px-4 py-2 text-center text-slate-400">N/A</td>
                        <td className="px-4 py-2 text-center text-slate-400 bg-emerald-50/50">Installed to C:\</td>
                        <td className="px-4 py-2 text-center text-slate-400">Installed to C:\</td>
                        <td className="px-4 py-2 text-center text-emerald-600 font-bold">Yes (Plug &amp; Play)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">Windows 7/8 32-bit Compatibility</td>
                        <td className="px-4 py-2 text-center text-slate-400">Browser dependent</td>
                        <td className="px-4 py-2 text-center text-slate-400 bg-emerald-50/50">No (64-bit only)</td>
                        <td className="px-4 py-2 text-center text-emerald-600 font-bold">Yes (Tested on x86)</td>
                        <td className="px-4 py-2 text-center text-slate-400">64-bit only</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HARDWARE DRIVERS */}
          {activeTab === 'HARDWARE' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                <span className="font-bold">Plug-and-Play Hardware Engine:</span> PLiMS 4.1.1 Desktop includes pre-compiled serial and HID drivers for Pakistani university and college library equipment.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 w-fit">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Barcode Scanners (1D &amp; 2D QR)</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Supports USB HID keyboard emulation and Virtual COM ports. Instant scan-to-checkout without pressing enter.
                  </p>
                  <div className="text-[10px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    Baud: 9600 / 115200<br />
                    Supported: Honeywell Orbit, Zebra DS2208, Datalogic QuickScan
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 w-fit">
                    <Printer className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Thermal Slip Receipt Printers</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Prints checkout slips with library header, book title, accession number, due date, fine warning, and QR code.
                  </p>
                  <div className="text-[10px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    Protocols: ESC/POS 58mm &amp; 80mm<br />
                    Supported: Epson TM-T20, Xprinter, POS-58, Citizen
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 w-fit">
                    <Wifi className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">RFID Security Gates &amp; Card Readers</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Controls anti-theft EAS bit activation and multi-tag bulk book checkout pad scanning.
                  </p>
                  <div className="text-[10px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    Standards: ISO 15693, ISO 18000-3<br />
                    Supported: 3M Library Systems, FEIG Electronic, Invengo
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INSTALLATION GUIDE */}
          {activeTab === 'GUIDE' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 rounded-2xl border border-slate-200 bg-white">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">Step 1: Download the installer for your PC</h4>
                    <p className="text-xs text-slate-600">
                      Choose <strong>PLiMS-4.1.1-Setup-x64.exe</strong> for modern 64-bit PCs, <strong>PLiMS-4.1.1-Setup-x32.exe</strong> for older 32-bit PCs, or <strong>PLiMS-4.1.1-Setup-x64.Portable</strong> to run from a USB drive.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 rounded-2xl border border-slate-200 bg-white">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">Step 2: Windows Defender SmartScreen notice</h4>
                    <p className="text-xs text-slate-600">
                      If Windows displays "Windows protected your PC", click <strong>More info</strong> and then click <strong>Run anyway</strong>. The file is cryptographically signed and verified by the PLiMS Consortium.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 rounded-2xl border border-slate-200 bg-white">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">Step 3: Run the Setup Wizard &amp; Module Installation</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Follow the on-screen steps. The wizard installs all compiled PLiMS modules (Cataloguing, Circulation, OPAC, AI Librarian, Reports, Barcodes) into <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">%LOCALAPPDATA%\PLiMS-4.1.1</code> (or custom path), creates a Windows Desktop shortcut with icon, and installs the offline database.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 rounded-2xl border border-slate-200 bg-white">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    4
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">Step 4: Launch and Access All Modules 100% Offline</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Double-click the <strong>PLiMS 4.1.1 PK Edition</strong> desktop shortcut or <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">PLiMS-Launch.bat</code>. The built-in Windows background engine automatically serves the complete suite at <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">http://127.0.0.1:3000</code> without requiring Node.js or internet connectivity!
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 rounded-2xl border border-amber-200 bg-amber-50/70">
                  <div className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    5
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-amber-950">USB Portable Mode (Plug &amp; Play)</h4>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      To run from a flash drive without installing: Download <code className="bg-amber-100/80 px-1 py-0.5 rounded text-[11px] font-mono">PLiMS-4.1.1-Setup-x64.Portable.zip</code>, extract directly to your USB drive, and double-click <code className="bg-amber-100/80 px-1 py-0.5 rounded text-[11px] font-mono">PLiMS-Portable.bat</code>. All books, transactions, and settings stay safely stored on the USB drive.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CHECKSUM VERIFIER */}
          {activeTab === 'VERIFY' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <span className="font-bold">Cryptographic SHA-256 Verifier:</span> Verify that your downloaded file is authentic and unaltered. Drop your downloaded file below to compute its SHA-256 hash in real-time in your browser without uploading any data over the network.
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
                className="p-8 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30 transition-all text-center flex flex-col items-center justify-center space-y-3 cursor-pointer"
              >
                <div className="p-3 rounded-2xl bg-white border border-slate-200 text-emerald-600 shadow-xs">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    Drag and drop your downloaded installer here
                  </div>
                  <div className="text-xs text-slate-500">
                    Supports PLiMS-4.1.1-Setup-x64.exe, PLiMS-4.1.1-Setup-x32.exe, or PLiMS-4.1.1-Setup-x64.Portable
                  </div>
                </div>
                <label className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer transition-colors">
                  <span>Browse File...</span>
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
                <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">File Selected:</span>
                    <span className="text-xs font-mono font-bold text-slate-900">{verificationFile.name} ({(verificationFile.size / 1024).toFixed(1)} KB)</span>
                  </div>

                  {isVerifying ? (
                    <div className="flex items-center space-x-2 text-xs text-emerald-700">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Computing SHA-256 cryptographic digest...</span>
                    </div>
                  ) : computedHash && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="text-xs">
                        <span className="text-slate-500 font-bold block mb-1">Computed SHA-256 Hash:</span>
                        <div className="font-mono text-[11px] p-2.5 rounded-xl bg-slate-100 text-slate-800 break-all border border-slate-200">
                          {computedHash}
                        </div>
                      </div>

                      {verifyMatch === true ? (
                        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center space-x-2 text-xs font-bold">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                          <span>AUTHENTIC &amp; VERIFIED: This file matches the official Government of Pakistan PLiMS 4.1.1 release checksum!</span>
                        </div>
                      ) : verifyMatch === false ? (
                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 flex items-center space-x-2 text-xs">
                          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                          <span>NOTICE: Checksum does not match official release build. Ensure you downloaded the complete file.</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            PLiMS V4.1.1 Pakistan Library Management System • Windows Desktop Release
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
