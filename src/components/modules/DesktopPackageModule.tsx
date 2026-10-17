import React, { useState } from 'react';
import {
  Monitor,
  Download,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Cpu,
  HelpCircle,
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
  const [activeTab, setActiveTab] = useState<'REPAIR' | 'INSTALLERS' | 'FEATURES' | 'HARDWARE' | 'GUIDE' | 'VERIFY'>('REPAIR');
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 shadow-xs">
              Official Desktop Release v4.1.1 R2
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 shadow-xs">
              Installed Not Opening? 1-Click Fix Ready
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-emerald-300 border border-emerald-400/30">
              Department of Libraries • Government of Pakistan
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            PLiMS 4.1.1 PK Desktop — Instant Repair &amp; R2 Installers
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            If PLiMS 4.1.1 PK is already installed on your Windows PC in <code className="font-mono text-emerald-300">%LOCALAPPDATA%\PLiMS-4.1.1</code> and not opening, use the <strong>1-Click Repair Patch</strong> below to replace the Windows <code className="font-mono">HttpListener</code> with our zero-admin <strong>Winsock TcpListener Engine</strong> &amp; native <code className="font-mono">PLiMS.exe</code> launcher!
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={(e) => handleDownload(e, '/api/desktop/download/PLiMS-4.1.1-Repair.exe', 'PLiMS-4.1.1-Repair.exe', 'banner-repair')}
              disabled={downloadingId === 'banner-repair'}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-75 text-slate-950 font-extrabold text-xs flex items-center space-x-2 shadow-lg transition-all cursor-pointer"
            >
              <Wrench className="h-4 w-4" />
              <span>
                {downloadingId === 'banner-repair' ? 'Downloading Repair Patch...' : '1-Click Repair Existing Install (PLiMS-4.1.1-Repair.exe)'}
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => handleDownload(e, '/api/desktop/download/PLiMS-4.1.1-Setup-x64.exe', 'PLiMS-4.1.1-Setup-x64.exe', 'banner-x64')}
              disabled={downloadingId === 'banner-x64'}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-75 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>
                {downloadingId === 'banner-x64' ? 'Downloading x64 Installer...' : 'Download R2 x64 Installer (.exe)'}
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => handleDownload(e, '/api/desktop/download/PLiMS-4.1.1-Setup-x64.Portable.zip', 'PLiMS-4.1.1-Setup-x64.Portable.zip', 'banner-portable')}
              disabled={downloadingId === 'banner-portable'}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-75 text-white font-bold text-xs flex items-center space-x-2 border border-white/20 transition-all cursor-pointer"
            >
              <FolderArchive className="h-4 w-4 text-amber-400" />
              <span>
                {downloadingId === 'banner-portable' ? 'Downloading ZIP...' : 'Download R2 Portable Package (ZIP)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('REPAIR')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
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
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'INSTALLERS'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Download className="h-4 w-4" />
          <span>Official Installers (R2 Fixed)</span>
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
          <span>Installation Guide</span>
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

      {/* TAB 0: INSTANT REPAIR */}
      {activeTab === 'REPAIR' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-50 via-orange-50 to-emerald-50 border-2 border-amber-300 space-y-3">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 rounded-2xl bg-amber-600 text-white shrink-0">
                <Wrench className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900">
                  Root Cause Identified &amp; Fixed: Why Desktop 4.1.1 PK Was Not Opening After Installation
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  1. <strong>Windows HTTP.sys Access Denied (Error 5):</strong> The previous <code className="font-mono bg-white px-1.5 py-0.5 rounded border">server.ps1</code> used <code className="font-mono bg-white px-1.5 py-0.5 rounded border">System.Net.HttpListener</code>, which Windows 10/11 blocks on non-admin user accounts. We replaced it with <strong>Winsock <code className="font-mono">System.Net.Sockets.TcpListener</code></strong>, which never requires Administrator rights or URL ACL registration.<br />
                  2. <strong>Native <code className="font-mono">PLiMS.exe</code> Launcher &amp; <code className="font-mono">plims.ico</code> Icon:</strong> The installer Finish button and Desktop Shortcut now launch a compiled native Windows executable (<code className="font-mono bg-white px-1.5 py-0.5 rounded border">PLiMS.exe</code>) that starts the local server and opens a standalone Chromium App window (<code className="font-mono">--app=http://127.0.0.1:3000</code>).
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Method 1 */}
            <div className="p-6 rounded-3xl border-2 border-emerald-500 bg-white shadow-lg flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                    OPTION 1 • 1-CLICK REPAIR PATCH
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-700">~85 KB</span>
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Patch Your Existing Installation in 2 Seconds
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Download and run <strong>PLiMS-4.1.1-Repair.exe</strong> (or <strong>PLiMS-4.1.1-Repair.bat</strong>). It automatically updates your existing <code className="font-mono bg-slate-100 px-1 rounded">%LOCALAPPDATA%\PLiMS-4.1.1</code> folder with the new <code className="font-mono">PLiMS.exe</code> launcher and Winsock <code className="font-mono">server.ps1</code>, fixes your Desktop shortcut, and launches PLiMS 4.1.1 immediately!
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={(e) => handleDownload(e, '/api/desktop/download/PLiMS-4.1.1-Repair.exe', 'PLiMS-4.1.1-Repair.exe', 'mod-repair-exe')}
                  disabled={downloadingId === 'mod-repair-exe'}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-sm cursor-pointer transition-all"
                >
                  <Wrench className="h-4 w-4" />
                  <span>
                    {downloadingId === 'mod-repair-exe' ? 'Downloading Repair.exe...' : 'Download PLiMS-4.1.1-Repair.exe'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDownload(e, '/api/desktop/download/PLiMS-4.1.1-Repair.bat', 'PLiMS-4.1.1-Repair.bat', 'mod-repair-bat')}
                  disabled={downloadingId === 'mod-repair-bat'}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer transition-colors"
                >
                  <Terminal className="h-4 w-4 text-slate-600" />
                  <span>
                    {downloadingId === 'mod-repair-bat' ? 'Downloading Repair.bat...' : 'Download PLiMS-4.1.1-Repair.bat'}
                  </span>
                </button>
              </div>
            </div>

            {/* Method 2 */}
            <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">
                    OPTION 2 • ZERO DOWNLOAD
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-700">PowerShell</span>
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Launch Installed Files via PowerShell Command
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Since your files are already in <code className="font-mono bg-slate-100 px-1 rounded">%LOCALAPPDATA%\PLiMS-4.1.1\dist</code>, open <strong>Windows PowerShell</strong>, paste this command, and press <strong>Enter</strong>:
                </p>
                <div className="p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[10px] leading-relaxed max-h-28 overflow-y-auto break-all border border-slate-700">
                  {winRunOneLiner}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => copyToClipboard(winRunOneLiner, 'mod-win-run')}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-sm cursor-pointer transition-all"
                >
                  {copiedHash === 'mod-win-run' ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Copied! Paste in PowerShell</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy PowerShell Launch Command</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Method 3 */}
            <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-purple-600 text-white">
                    OPTION 3 • FULL R2 INSTALLER
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-700">v4.1.1 R2</span>
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Download Updated Full v4.1.1 R2 Setup
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Download the rebuilt Revision 2 (R2) full installer (<code className="font-mono">PLiMS-4.1.1-Setup-x64.exe</code>) or Portable ZIP (<code className="font-mono">PLiMS-4.1.1-Setup-x64.Portable.zip</code>) with all fixes pre-integrated.
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={(e) => handleDownload(e, '/api/desktop/download/PLiMS-4.1.1-Setup-x64.exe', 'PLiMS-4.1.1-Setup-x64.exe', 'mod-r2-x64')}
                  disabled={downloadingId === 'mod-r2-x64'}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-sm cursor-pointer transition-all"
                >
                  <Download className="h-4 w-4 text-emerald-400" />
                  <span>
                    {downloadingId === 'mod-r2-x64' ? 'Downloading R2 x64...' : 'Download R2 Setup x64 (.exe)'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('INSTALLERS')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer transition-colors"
                >
                  <Play className="h-4 w-4 text-slate-600" />
                  <span>View All 4 R2 Installers</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full text-white bg-gradient-to-r ${item.accentColor} shadow-xs`}>
                        {item.badge}
                      </span>
                      <span className="text-xs font-mono text-slate-500 font-semibold">
                        {item.sizeFormatted}
                      </span>
                    </div>

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

                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {item.description}
                    </p>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 mb-4">
                      <span className="font-bold text-slate-800">Target Environment: </span>
                      {item.recommendedFor}
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1 mb-2 font-mono">
                      <div>• Minimum OS: {item.minOs}</div>
                      <div>• Release File: <span className="text-slate-900 font-bold">{item.filename}</span></div>
                    </div>
                  </div>

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
                        onClick={(e) => handleDownload(e, item.secondaryUrl!, `PLiMS-4.1.1-Setup-x64.Portable.zip`, `${item.id}-zip`)}
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
        </div>
      )}

      {/* TAB 2: FEATURES */}
      {activeTab === 'FEATURES' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4">
              <div className="flex items-center space-x-3 text-emerald-700 font-bold text-base">
                <WifiOff className="h-6 w-6" />
                <h3>100% Offline Circulation &amp; Local Winsock TCP Engine</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Network outages and rural campus connectivity gaps will never interrupt library operations. The R2 desktop engine uses a zero-admin Winsock TcpListener server and local database.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4">
              <div className="flex items-center space-x-3 text-blue-700 font-bold text-base">
                <Printer className="h-6 w-6" />
                <h3>Direct Hardware USB / COM Port Communication</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Interfaces natively with Windows spoolers and serial communication ports for 58mm &amp; 80mm ESC/POS thermal receipt printers and USB barcode readers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HARDWARE DRIVERS */}
      {activeTab === 'HARDWARE' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-3">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 w-fit">
              <QrCode className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Barcode &amp; QR Scanners</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Supports USB HID Keyboard Emulation and Virtual COM (CDC-ACM). Auto-detects accession numbers and patron membership cards.
            </p>
          </div>

          <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 w-fit">
              <Printer className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Thermal Receipt Printers</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct ESC/POS slip generation (58mm &amp; 80mm) for circulation check-out and return receipts.
            </p>
          </div>

          <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-3">
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-700 w-fit">
              <Wifi className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">RFID Security Gates &amp; Pads</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enables simultaneous multi-book scanning on the circulation counter and triggers anti-theft EAS alarms at exit gates.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: GUIDE */}
      {activeTab === 'GUIDE' && (
        <div className="space-y-4">
          <div className="flex items-start space-x-4 p-5 rounded-3xl border border-slate-200 bg-white">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
              1
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Repair Existing Install OR Run R2 Setup</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                If you already installed v4.1.1, download and run <strong>PLiMS-4.1.1-Repair.exe</strong> to immediately patch <code className="font-mono">%LOCALAPPDATA%\PLiMS-4.1.1</code> and launch the app. For a fresh install, download <strong>PLiMS-4.1.1-Setup-x64.exe</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-5 rounded-3xl border border-slate-200 bg-white">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
              2
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Launch via Desktop Shortcut or PLiMS.exe</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Double-click the <strong>PLiMS 4.1.1 PK Edition</strong> shortcut on your Desktop. It runs <code className="font-mono">PLiMS.exe</code>, binds a local Winsock TCP socket on <code className="font-mono">http://127.0.0.1:3000</code>, and opens your standalone PLiMS desktop window.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: VERIFY */}
      {activeTab === 'VERIFY' && (
        <div className="space-y-6">
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
                Supports PLiMS-4.1.1-Setup-x64.exe, PLiMS-4.1.1-Setup-x32.exe, or PLiMS-4.1.1-Repair.exe
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
                      <span>AUTHENTIC &amp; OFFICIAL: This file matches the official PLiMS 4.1.1 R2 release signature.</span>
                    </div>
                  ) : verifyMatch === false ? (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center space-x-3 text-xs">
                      <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
                      <span>NOTICE: Checksum does not match current R2 master build (if this is an R1 installer, use the 1-Click Repair Patch above).</span>
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
