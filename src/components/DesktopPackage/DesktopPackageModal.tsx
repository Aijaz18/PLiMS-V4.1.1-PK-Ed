import React, { useState } from 'react';
import {
  Monitor,
  Download,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  HardDrive,
  Cpu,
  HelpCircle,
  X,
  Sparkles,
  Printer,
  QrCode,
  Wifi,
  WifiOff,
  FolderArchive,
  RefreshCw,
  AlertCircle,
  Wrench,
  Terminal,
  Play
} from 'lucide-react';

export interface DesktopPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'REPAIR' | 'INSTALLERS' | 'FEATURES' | 'HARDWARE' | 'GUIDE' | 'VERIFY';
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
  defaultTab = 'REPAIR'
}) => {
  const [activeTab, setActiveTab] = useState<'REPAIR' | 'INSTALLERS' | 'FEATURES' | 'HARDWARE' | 'GUIDE' | 'VERIFY'>(defaultTab);
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

  // Instant PowerShell one-liner that fixes an existing %LOCALAPPDATA%\PLiMS-4.1.1 installation on Windows
  // by starting a user-mode Winsock TcpListener on 127.0.0.1:3000 serving %LOCALAPPDATA%\PLiMS-4.1.1\dist
  const winRunOneLiner = `powershell -NoProfile -ExecutionPolicy Bypass -Command "$r=Join-Path $env:LOCALAPPDATA 'PLiMS-4.1.1\\dist'; if(!(Test-Path $r)){Write-Host 'PLiMS folder not found at' $r -ForegroundColor Red; pause; exit}; $l=[Net.Sockets.TcpListener]::new([IPAddress]::Loopback,3000); try{$l.Start();$p=3000}catch{$l=[Net.Sockets.TcpListener]::new([IPAddress]::Loopback,3001);$l.Start();$p=3001}; Start-Process ('http://127.0.0.1:'+$p); Write-Host ('PLiMS 4.1.1 Running on http://127.0.0.1:'+$p) -ForegroundColor Green; $m=@{'.html'='text/html;charset=utf-8';'.js'='application/javascript;charset=utf-8';'.css'='text/css;charset=utf-8';'.json'='application/json';'.jpg'='image/jpeg';'.png'='image/png';'.svg'='image/svg+xml';'.ico'='image/x-icon'}; while($true){try{$c=$l.AcceptTcpClient();$s=$c.GetStream();$b=New-Object byte[] 4096;$n=$s.Read($b,0,4096);if($n -gt 0){$q=[Text.Encoding]::UTF8.GetString($b,0,$n);$u=(($q -split ' ')[1] -split '\\?')[0];if($u -like '/api/*'){$d=[Text.Encoding]::UTF8.GetBytes('{\"status\":\"ok\",\"authenticated\":false}');$h=\"HTTP/1.1 200 OK\`r\`nContent-Type: application/json\`r\`nContent-Length: $($d.Length)\`r\`nConnection: close\`r\`n\`r\`n\";$hb=[Text.Encoding]::ASCII.GetBytes($h);$s.Write($hb,0,$hb.Length);$s.Write($d,0,$d.Length)}else{$f=Join-Path $r ($u.TrimStart('/').Replace('/','\\'));if($u -eq '/' -or !(Test-Path $f -PathType Leaf)){if(!$u.StartsWith('/assets/')){$f=Join-Path $r 'index.html'}};if(Test-Path $f -PathType Leaf){$x=[IO.Path]::GetExtension($f).ToLower();$ct=if($m[$x]){$m[$x]}else{'application/octet-stream'};$d=[IO.File]::ReadAllBytes($f);$h=\"HTTP/1.1 200 OK\`r\`nContent-Type: $ct\`r\`nContent-Length: $($d.Length)\`r\`nConnection: close\`r\`n\`r\`n\";$hb=[Text.Encoding]::ASCII.GetBytes($h);$s.Write($hb,0,$hb.Length);$s.Write($d,0,$d.Length)}}};$c.Close()}catch{}}"`;

  const defaultInstallers: InstallerItem[] = [
    {
      id: 'setup-x64',
      filename: 'PLiMS-4.1.1-Setup-x64.exe',
      name: 'Official Windows Desktop Installer (64-Bit R2 Fixed)',
      badge: 'RECOMMENDED (R2 FIXED ENGINE)',
      arch: 'Windows x64 (AMD64 / Intel 64-bit)',
      minOs: 'Windows 11 / Windows 10 / Server 2016+ (64-bit)',
      sizeFormatted: '1.60 MB (Official NSIS Installer)',
      sha256: '876b1dd97bcf8f8c2889f50c0fb2d37956d6a6de3c9e84ca9e9e109d9ec1d2cf',
      downloadUrl: '/api/desktop/download/PLiMS-4.1.1-Setup-x64.exe',
      description: 'Updated Revision 2 (R2) 64-bit Windows Setup Installer. Includes native PLiMS.exe launcher, valid plims.ico icon, and Winsock TcpListener offline engine (eliminates Windows Error 5 HTTP.sys Access Denied).',
      recommendedFor: 'Main circulation desks, head librarian workstations, and high-performance cataloguing PCs.',
      accentColor: 'from-emerald-600 to-teal-700',
      icon: Monitor
    },
    {
      id: 'setup-x32',
      filename: 'PLiMS-4.1.1-Setup-x32.exe',
      name: 'Official Windows Desktop Installer (32-Bit R2 Fixed)',
      badge: 'LEGACY HARDWARE (R2 FIXED)',
      arch: 'Windows x86 (32-bit & 64-bit Compatible)',
      minOs: 'Windows 7 SP1 / 8 / 8.1 / 10 / 11 (32-bit & 64-bit)',
      sizeFormatted: '1.60 MB (Official 32-Bit Installer)',
      sha256: 'e98dcd7f4c45460a2ef2b908afc642c2cd045d0b6e64477501fb0065495d3050',
      downloadUrl: '/api/desktop/download/PLiMS-4.1.1-Setup-x32.exe',
      description: 'Updated Revision 2 (R2) 32-bit setup installer with native PLiMS.exe launcher and Winsock TcpListener server. Runs on all Windows versions with zero admin rights requirement.',
      recommendedFor: 'Older computers with 2GB-4GB RAM, Intel Core 2 Duo / Pentium or 32-bit Windows installations.',
      accentColor: 'from-blue-600 to-indigo-700',
      icon: Cpu
    },
    {
      id: 'setup-portable',
      filename: 'PLiMS-4.1.1-Setup-x64.Portable.exe',
      name: 'Official Windows Desktop Portable Runner (R2)',
      badge: 'ZERO INSTALLATION / USB FLASH',
      arch: 'Windows x64 Portable Executable',
      minOs: 'Windows 10 / 11 / Server (Runs from USB flash drive)',
      sizeFormatted: '1.60 MB (Self-Extracting Portable)',
      sha256: '0202c6069244261f34907785ca8689e985fafc8e24f371eb1f93c647473032c3',
      downloadUrl: '/api/desktop/download/PLiMS-4.1.1-Setup-x64.Portable.exe',
      secondaryUrl: '/api/desktop/download/PLiMS-4.1.1-Setup-x64.Portable.zip',
      secondaryLabel: 'Download Portable .ZIP Archive',
      description: 'Zero-installation standalone package with native PLiMS.exe launcher and Winsock TcpListener server. Run directly from a USB flash drive or folder without modifying Windows Registry.',
      recommendedFor: 'Traveling library auditors, branch inspection officers, and shared computers with guest rights.',
      accentColor: 'from-amber-600 to-orange-700',
      icon: FolderArchive
    },
    {
      id: 'setup-portable-zip',
      filename: 'PLiMS-4.1.1-Setup-x64.Portable.zip',
      name: 'Official Windows Portable Archive (ZIP R2)',
      badge: 'UNIVERSAL ZIP FOR USB',
      arch: 'Universal (All Windows Editions)',
      minOs: 'Windows 7 / 8 / 10 / 11 / Server (Extract directly to USB)',
      sizeFormatted: '2.35 MB (Standard ZIP Archive)',
      sha256: '92ae193540890ff9f36b53298b5fca5c61a88c8a6d12dfe31eef04d9f93f4c8a',
      downloadUrl: '/api/desktop/download/PLiMS-4.1.1-Setup-x64.Portable.zip',
      description: 'Standard ZIP package containing PLiMS.exe, PLiMS-Launch.bat, server.ps1 (Winsock TcpListener), and dist/. Simply Extract All to any folder and double-click PLiMS.exe to start.',
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
                  PLiMS 4.1.1 PK Desktop — Instant Repair &amp; Official Installers
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500 text-slate-950">
                  Release v4.1.1 R2
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-400 text-slate-950">
                  Launch Fix Included
                </span>
              </div>
              <p className="text-xs text-slate-300">
                1-Click Repair for Existing Installations + Updated R2 Windows Desktop Installers (Winsock TCP Engine &amp; Native PLiMS.exe Launcher)
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
            onClick={() => setActiveTab('REPAIR')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'REPAIR'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Wrench className="h-4 w-4" />
            <span>Fix Installed Desktop 4.1.1 (Instant Repair)</span>
          </button>

          <button
            onClick={() => setActiveTab('INSTALLERS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'INSTALLERS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>Official Installers (R2 Fixed)</span>
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
            <span>Checksum Verifier</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 0: INSTANT REPAIR FOR EXISTING INSTALLATION */}
          {activeTab === 'REPAIR' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-emerald-50 border-2 border-amber-300 space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 rounded-xl bg-amber-600 text-white shrink-0 mt-0.5">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Why was Desktop 4.1.1 PK installed on your computer but not opening?
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      In the initial v4.1.1 build, the local background engine (<code className="font-mono bg-white px-1.5 py-0.5 rounded border">server.ps1</code>) used <code className="font-mono bg-white px-1.5 py-0.5 rounded border">System.Net.HttpListener</code>, which Windows 10/11 blocks with <strong>Error 5 (HTTP.sys Access Denied)</strong> when run without Administrator URL ACLs, and the NSIS Finish button targeted a <code className="font-mono bg-white px-1.5 py-0.5 rounded border">.bat</code> file instead of a native <code className="font-mono bg-white px-1.5 py-0.5 rounded border">.exe</code>.
                    </p>
                    <p className="text-xs font-bold text-emerald-800">
                      Choose any of the 3 instant methods below to fix and launch your installed PLiMS 4.1.1 PK right now:
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Method 1: 1-Click Repair Patch */}
                <div className="p-5 rounded-2xl border-2 border-emerald-500 bg-white shadow-md flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                        METHOD 1 • FASTEST (85 KB)
                      </span>
                      <span className="text-[11px] font-mono font-bold text-emerald-700">2 Seconds</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      1-Click Instant Repair Tool (Fixes Existing Installation)
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Already have PLiMS 4.1.1 installed in <code className="font-mono bg-slate-100 px-1 rounded">%LOCALAPPDATA%\PLiMS-4.1.1</code>? Download and run this lightweight patch. It replaces the broken <code className="font-mono">HttpListener</code> with the fixed <strong>Winsock TcpListener</strong> engine, installs the native <code className="font-mono">PLiMS.exe</code> launcher &amp; icon, fixes your Desktop shortcut, and opens PLiMS immediately!
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => handleDownload(e, '/api/desktop/download/PLiMS-4.1.1-Repair.exe', 'PLiMS-4.1.1-Repair.exe', 'repair-exe')}
                      disabled={downloadingId === 'repair-exe'}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-sm cursor-pointer transition-all"
                    >
                      <Wrench className="h-4 w-4" />
                      <span>
                        {downloadingId === 'repair-exe' ? 'Downloading Repair.exe...' : 'Download PLiMS-4.1.1-Repair.exe'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDownload(e, '/api/desktop/download/PLiMS-4.1.1-Repair.bat', 'PLiMS-4.1.1-Repair.bat', 'repair-bat')}
                      disabled={downloadingId === 'repair-bat'}
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                    >
                      <Terminal className="h-3.5 w-3.5 text-slate-600" />
                      <span>
                        {downloadingId === 'repair-bat' ? 'Downloading Repair.bat...' : 'Or Download PLiMS-4.1.1-Repair.bat'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Method 2: Zero-Download Win+R / PowerShell Command */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">
                        METHOD 2 • ZERO DOWNLOAD
                      </span>
                      <span className="text-[11px] font-mono font-bold text-blue-700">Instant Launch</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Start Installed PLiMS Directly via Windows PowerShell
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Since the files are already installed in your <code className="font-mono bg-slate-100 px-1 rounded">%LOCALAPPDATA%\PLiMS-4.1.1\dist</code> folder, press <strong>Win + X</strong> &rarr; <strong>Terminal / PowerShell</strong> (or <strong>Win + R</strong>), paste this command, and press <strong>Enter</strong>:
                    </p>
                    <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[10px] leading-relaxed max-h-24 overflow-y-auto break-all border border-slate-700">
                      {winRunOneLiner}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(winRunOneLiner, 'win-run-cmd')}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-sm cursor-pointer transition-all"
                    >
                      {copiedHash === 'win-run-cmd' ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Copied! Paste in PowerShell &amp; Press Enter</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy Instant Launch Command</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Method 3: Download Updated R2 Full Installer */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-600 text-white">
                        METHOD 3 • FULL R2 INSTALLER
                      </span>
                      <span className="text-[11px] font-mono font-bold text-purple-700">v4.1.1 R2</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Reinstall with Updated v4.1.1 R2 Setup Package
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      All official installers (<code className="font-mono">x64.exe</code>, <code className="font-mono">x32.exe</code>, <code className="font-mono">Portable.exe</code>, <code className="font-mono">Portable.zip</code>) have been rebuilt with the new <code className="font-mono">PLiMS.exe</code> native launcher, <code className="font-mono">plims.ico</code> icon, and Winsock TCP offline server.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => handleDownload(e, '/api/desktop/download/PLiMS-4.1.1-Setup-x64.exe', 'PLiMS-4.1.1-Setup-x64.exe', 'repair-tab-x64')}
                      disabled={downloadingId === 'repair-tab-x64'}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-sm cursor-pointer transition-all"
                    >
                      <Download className="h-4 w-4 text-emerald-400" />
                      <span>
                        {downloadingId === 'repair-tab-x64' ? 'Downloading R2 x64...' : 'Download R2 Setup x64 (.exe)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('INSTALLERS')}
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                    >
                      <Play className="h-3.5 w-3.5 text-slate-600" />
                      <span>View All 4 R2 Installers (x64, x32, ZIP)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: INSTALLERS */}
          {activeTab === 'INSTALLERS' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 leading-relaxed">
                    <span className="font-bold">Official Release v4.1.1 R2 (Fixed Launch &amp; Winsock TCP Engine):</span> All installers below include the native <code className="font-mono font-bold">PLiMS.exe</code> desktop launcher, official <code className="font-mono font-bold">plims.ico</code> icon, and user-mode Winsock <code className="font-mono font-bold">TcpListener</code> offline server that starts immediately on Windows 7/8/10/11 without Administrator rights.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('REPAIR')}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Repair Existing Install
                </button>
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
                            onClick={(e) => handleDownload(e, item.secondaryUrl!, `PLiMS-4.1.1-Setup-x64.Portable.zip`, `${item.id}-zip`)}
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
                    <h4>100% Offline Circulation &amp; Local Winsock TCP Engine</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Even during campus-wide network outages or load-shedding, the PLiMS 4.1.1 R2 Desktop Engine allows issue, return, renewals, and patron fine calculations using a local database and Winsock TcpListener server.
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                    <li>Zero-latency book barcode check-in and check-out</li>
                    <li>Auto-queues transactions when Internet disconnects</li>
                    <li>Opens in a standalone Chromium desktop window (--app mode)</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
                    <Printer className="h-5 w-5" />
                    <h4>Direct Hardware USB/COM &amp; Thermal Slip Printing</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    The Desktop Package communicates directly with Windows Spooler and ESC/POS thermal printers (58mm &amp; 80mm).
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
                    Supports scheduled nightly backups of all library records into timestamped SQL and JSON archive dumps.
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                    <li>Compatible with XAMPP MySQL, MariaDB, and PostgreSQL</li>
                    <li>One-click database restore tool in case of PC failure</li>
                    <li>AES-256 encrypted archival export to flash drives</li>
                  </ul>
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
                    <h4 className="text-xs font-bold text-slate-900">Step 1: Repair Existing Install OR Download R2 Installer</h4>
                    <p className="text-xs text-slate-600">
                      If PLiMS 4.1.1 is already installed in <code className="font-mono bg-slate-100 px-1 rounded">%LOCALAPPDATA%\PLiMS-4.1.1</code>, simply download and run <strong>PLiMS-4.1.1-Repair.exe</strong> (from the Repair tab). For a fresh install, download <strong>PLiMS-4.1.1-Setup-x64.exe</strong>.
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
                      If Windows displays "Windows protected your PC", click <strong>More info</strong> and then click <strong>Run anyway</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 rounded-2xl border border-slate-200 bg-white">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">Step 3: Native PLiMS.exe Launcher &amp; Desktop Shortcut</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Click <strong>Finish</strong> at the end of the setup wizard, or double-click the <strong>PLiMS 4.1.1 PK Edition</strong> shortcut on your Desktop. It runs <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">PLiMS.exe</code>, starts the Winsock TCP server on <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">http://127.0.0.1:3000</code>, and opens PLiMS in a native desktop window!
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
                <span className="font-bold">Cryptographic SHA-256 Verifier:</span> Drop your downloaded file below to compute its SHA-256 hash in real-time in your browser.
              </div>

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
                    Supports PLiMS-4.1.1-Setup-x64.exe, PLiMS-4.1.1-Setup-x32.exe, or PLiMS-4.1.1-Repair.exe
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
                          <span>NOTICE: Checksum does not match current R2 build (if this is an older R1 installer, please use the Instant Repair tool or download R2).</span>
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
            PLiMS V4.1.1 R2 Pakistan Library Management System • Windows Desktop Release (Winsock TCP Engine)
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
