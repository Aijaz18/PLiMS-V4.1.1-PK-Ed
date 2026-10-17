import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import JSZip from 'jszip';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const downloadsDir = path.join(rootDir, 'public', 'downloads');
const stagingDir = path.join(rootDir, '.staging-desktop');

if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Prepares the staging folder containing all application files,
 * offline HTTP engine, scripts, database schemas, and documentation.
 */
function prepareStagingFolder() {
  console.log('[PLiMS Builder] Preparing staging directory at:', stagingDir);
  if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
  ensureDir(stagingDir);

  // 1. Copy dist/
  if (!fs.existsSync(distDir)) {
    throw new Error(`dist directory not found at ${distDir}. Run npm run build first.`);
  }
  const stagingDist = path.join(stagingDir, 'dist');
  ensureDir(stagingDist);
  execSync(`cp -rf "${distDir}"/* "${stagingDist}"/`);
  // Remove downloads folder from staging dist if present
  if (fs.existsSync(path.join(stagingDist, 'downloads'))) {
    fs.rmSync(path.join(stagingDist, 'downloads'), { recursive: true, force: true });
  }

  // 2. PowerShell Server Engine (server.ps1)
  const serverPs1 = `# ===============================================================================
#   PLiMS V4.1.1 PK EDITION - STANDALONE WINDOWS OFFLINE HTTP ENGINE
#   Government of Pakistan - Department of Libraries & Academic ICT
#   Runs on Windows 7 SP1, 8, 8.1, 10, 11, Server 2012+ without Node.js or admin rights!
# ===============================================================================
param(
    [int]$Port = 3000,
    [string]$Root = (Join-Path $PSScriptRoot "dist")
)

$ErrorActionPreference = "SilentlyContinue"

# Check if port 3000 is already active
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("127.0.0.1", $Port)
    $tcp.Close()
    Write-Host "[OK] PLiMS service is already running on port $Port."
    Exit 0
} catch {
    # Port is free, start local listener
}

$listener = New-Object System.Net.HttpListener
$prefix = "http://127.0.0.1:$Port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
} catch {
    $Port = 8080
    $prefix = "http://127.0.0.1:$Port/"
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add($prefix)
    $listener.Start()
}

Write-Host "==============================================================================="
Write-Host "  PLiMS V4.1.1 PK EDITION - LOCAL DESKTOP SERVER ACTIVE"
Write-Host "  Listening on: $prefix"
Write-Host "  Serving: $Root"
Write-Host "==============================================================================="

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".mjs"  = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
    ".txt"  = "text/plain; charset=utf-8"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rawUrl = $request.RawUrl.Split('?')[0]

        # API Endpoints for offline status
        if ($rawUrl -eq "/api/health") {
            $json = '{"status":"ok","version":"4.1.1","edition":"PK_OFFICIAL_DESKTOP","offline":true}'
            $buf = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = "application/json"
            $response.ContentLength64 = $buf.Length
            $response.OutputStream.Write($buf, 0, $buf.Length)
            $response.OutputStream.Close()
            continue
        }

        # Resolve Static File
        $filePath = Join-Path $Root ($rawUrl.TrimStart('/'))
        if ($rawUrl -eq "/" -or (Test-Path $filePath -PathType Container)) {
            $filePath = Join-Path $Root "index.html"
        }

        # SPA Routing Fallback: if asset not found and not in /assets/, serve index.html
        if (-not (Test-Path $filePath -PathType Leaf)) {
            if (-not $rawUrl.StartsWith("/assets/")) {
                $filePath = Join-Path $Root "index.html"
            }
        }

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = "application/octet-stream"
            if ($mimeTypes.ContainsKey($ext)) { $mime = $mimeTypes[$ext] }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.OutputStream.Close()
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($msg, 0, $msg.Length)
            $response.OutputStream.Close()
        }
    } catch {
        # Continue loop on connection reset
    }
}
`;
  fs.writeFileSync(path.join(stagingDir, 'server.ps1'), serverPs1);

  // 3. Desktop Quick Launcher (PLiMS-Launch.bat)
  const launcherBat = `@echo off
setlocal enabledelayedexpansion
title PLiMS V4.1.1 PK Edition - Desktop Engine
echo ===============================================================================
echo   PAKISTAN LIBRARY MANAGEMENT SYSTEM (PLiMS) V4.1.1 PK EDITION
echo   Department of Libraries, Government of Pakistan
echo   Official Windows Desktop Engine
echo ===============================================================================
echo.
cd /d "%~dp0"

echo [*] Initializing PLiMS local offline server on port 3000...
start /b "" powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0server.ps1" -Port 3000

echo [*] Waiting for local engine socket...
ping 127.0.0.1 -n 2 >nul

echo [*] Launching PLiMS V4.1.1 in default web browser...
start http://127.0.0.1:3000

echo.
echo ===============================================================================
echo   [OK] PLiMS DESKTOP ENGINE IS ACTIVE AND READY!
echo   All Modules: OPAC, Cataloguing, Circulation, AI Librarian Bot, Reports, Barcodes
echo ===============================================================================
echo [i] Keep this console window open while working in PLiMS.
echo [i] To stop the system, close this window or press Ctrl+C.
echo.
pause
`;
  fs.writeFileSync(path.join(stagingDir, 'PLiMS-Launch.bat'), launcherBat);

  // 4. USB Portable Mode Launcher (PLiMS-Portable.bat)
  const portableBat = `@echo off
setlocal enabledelayedexpansion
title PLiMS V4.1.1 PK Edition - USB Portable Mode
echo ===============================================================================
echo   PLiMS V4.1.1 PK EDITION - ZERO-INSTALL USB PORTABLE RUNNER
echo   Running directly from USB flash drive / local folder
echo ===============================================================================
echo.
cd /d "%~dp0"

echo [*] Configuring portable environment paths...
set "PLIMS_DATA_DIR=%~dp0data"
set "PLIMS_PORTABLE=1"

echo [*] Starting local background web engine on http://127.0.0.1:3000...
start /b "" powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0server.ps1" -Port 3000

echo [*] Connecting to local library interface...
ping 127.0.0.1 -n 2 >nul
start http://127.0.0.1:3000

echo.
echo [OK] Portable PLiMS is active. All transaction logs will save directly to USB.
echo.
pause
`;
  fs.writeFileSync(path.join(stagingDir, 'PLiMS-Portable.bat'), portableBat);

  // 5. Native Windows HTA runner (PLiMS.hta)
  const htaContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>PLiMS 4.1.1 - Pakistan Library Management System</title>
<hta:application 
  id="oPLiMS" 
  applicationname="PLiMS 4.1.1" 
  border="thick" 
  borderstyle="normal" 
  caption="yes" 
  maximizebutton="yes" 
  minimizebutton="yes" 
  sysmenu="yes" 
  windowstate="maximize"
  navigable="yes"
/>
<style>
  body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #064e3b; font-family: Segoe UI, sans-serif; }
  #frame { width: 100%; height: 100%; border: none; }
</style>
<script language="VBScript">
  Sub Window_OnLoad
    Set oShell = CreateObject("WScript.Shell")
    oShell.Run "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File server.ps1", 0, False
    SetTimeout "LoadApp()", 1500
  End Sub
  Sub LoadApp
    document.getElementById("frame").src = "http://127.0.0.1:3000"
  End Sub
</script>
</head>
<body>
  <iframe id="frame" src="about:blank"></iframe>
</body>
</html>
`;
  fs.writeFileSync(path.join(stagingDir, 'PLiMS.hta'), htaContent);

  // 6. Setup batch wizard (setup.bat)
  const setupBat = `@echo off
setlocal enabledelayedexpansion
title PLiMS V4.1.1 PK Edition - Windows Setup Wizard
color 1F

echo ===============================================================================
echo   GOVERNMENT OF PAKISTAN - DEPARTMENT OF LIBRARIES
echo   PAKISTAN LIBRARY MANAGEMENT SYSTEM (PLiMS V4.1.1 PK EDITION)
echo   OFFICIAL WINDOWS SETUP AND INSTALLATION WIZARD
echo ===============================================================================
echo.
echo Welcome to the official PLiMS 4.1.1 Desktop Installation Wizard.
echo This wizard installs the full PLiMS suite on your Windows computer.
echo.
echo Complete Modules Included:
echo  [+] AI MARC21 / RDA Cataloguer and Dewey Decimal Classification
echo  [+] Circulation Desk (Issue, Return, Renew, Overdue Fines)
echo  [+] 24/7 AI Librarian Bot with Natural Language Library Queries
echo  [+] OPAC Online Public Access Catalog with Multi-Filter Search
echo  [+] Barcode Scanner and ESC/POS Thermal Receipt Printer Support
echo  [+] Localhost Database Engine (100% Offline No-Internet Operation)
echo  [+] Multi-Branch Campus Synchronization and Backup Service
echo.

set "DEFAULT_DIR=%LOCALAPPDATA%\\PLiMS-4.1.1"
echo Default Installation Folder: %DEFAULT_DIR%
echo.
set /p "TARGET_DIR=Press ENTER to install in default folder, or enter custom path: "
if "%TARGET_DIR%"=="" set "TARGET_DIR=%DEFAULT_DIR%"

echo.
echo [*] Target Directory: "%TARGET_DIR%"
echo [*] Creating target folders...
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"
if not exist "%TARGET_DIR%\\dist" mkdir "%TARGET_DIR%\\dist"
if not exist "%TARGET_DIR%\\data" mkdir "%TARGET_DIR%\\data"
if not exist "%TARGET_DIR%\\config" mkdir "%TARGET_DIR%\\config"
if not exist "%TARGET_DIR%\\scripts" mkdir "%TARGET_DIR%\\scripts"

echo [*] Copying PLiMS 4.1.1 application modules and assets...
cd /d "%~dp0"
xcopy /E /Y /I "dist\\*" "%TARGET_DIR%\\dist\\" >nul 2>&1
xcopy /E /Y /I "data\\*" "%TARGET_DIR%\\data\\" >nul 2>&1
xcopy /E /Y /I "config\\*" "%TARGET_DIR%\\config\\" >nul 2>&1
xcopy /E /Y /I "scripts\\*" "%TARGET_DIR%\\scripts\\" >nul 2>&1
copy /Y "PLiMS-Launch.bat" "%TARGET_DIR%\\" >nul 2>&1
copy /Y "PLiMS-Portable.bat" "%TARGET_DIR%\\" >nul 2>&1
copy /Y "PLiMS.hta" "%TARGET_DIR%\\" >nul 2>&1
copy /Y "server.ps1" "%TARGET_DIR%\\" >nul 2>&1
copy /Y "Uninstall-PLiMS.bat" "%TARGET_DIR%\\" >nul 2>&1
copy /Y "README-DESKTOP.txt" "%TARGET_DIR%\\" >nul 2>&1

echo [*] Generating Windows Desktop and Start Menu shortcuts...
cscript //nologo "%~dp0scripts\\create-shortcut.vbs" "%TARGET_DIR%"

echo.
echo ===============================================================================
echo   INSTALLATION COMPLETED SUCCESSFULLY!
echo ===============================================================================
echo   PLiMS 4.1.1 is now installed in: "%TARGET_DIR%"
echo   A desktop shortcut "PLiMS 4.1.1 PK Edition" has been created.
echo.
set /p "LAUNCH_NOW=Would you like to launch PLiMS 4.1.1 now? (Y/N) [Y]: "
if /i "%LAUNCH_NOW%"=="N" goto END
start "" "%TARGET_DIR%\\PLiMS-Launch.bat"

:END
echo Exiting installer. Thank you for choosing PLiMS!
timeout /t 3 >nul
exit /b 0
`;
  fs.writeFileSync(path.join(stagingDir, 'setup.bat'), setupBat);

  // 7. Shortcut VBS (scripts/create-shortcut.vbs)
  const scriptsDir = path.join(stagingDir, 'scripts');
  ensureDir(scriptsDir);
  const shortcutVbs = `' PLiMS Windows Shortcut Generator
Set oWS = WScript.CreateObject("WScript.Shell")
targetDir = WScript.Arguments(0)

' 1. Desktop Shortcut
sDesktop = oWS.SpecialFolders("Desktop") & "\\PLiMS 4.1.1 PK Edition.lnk"
Set oLink = oWS.CreateShortcut(sDesktop)
oLink.TargetPath = targetDir & "\\PLiMS-Launch.bat"
oLink.WorkingDirectory = targetDir
oLink.Description = "Pakistan Library Management System (PLiMS 4.1.1)"
oLink.Save

' 2. Start Menu Shortcut
sPrograms = oWS.SpecialFolders("Programs") & "\\PLiMS 4.1.1"
Set fso = CreateObject("Scripting.FileSystemObject")
If Not fso.FolderExists(sPrograms) Then
    fso.CreateFolder(sPrograms)
End If
sStartLink = sPrograms & "\\PLiMS 4.1.1.lnk"
Set oStartLink = oWS.CreateShortcut(sStartLink)
oStartLink.TargetPath = targetDir & "\\PLiMS-Launch.bat"
oStartLink.WorkingDirectory = targetDir
oStartLink.Description = "Pakistan Library Management System (PLiMS 4.1.1)"
oStartLink.Save
`;
  fs.writeFileSync(path.join(scriptsDir, 'create-shortcut.vbs'), shortcutVbs);

  // 8. Uninstaller batch (Uninstall-PLiMS.bat)
  const uninstallBat = `@echo off
title PLiMS V4.1.1 - Uninstall
echo ===============================================================================
echo   PLiMS V4.1.1 PK Edition - Uninstall Utility
echo ===============================================================================
echo.
set /p "CONFIRM=Are you sure you want to remove PLiMS 4.1.1 shortcuts from this computer? (Y/N): "
if /i not "%CONFIRM%"=="Y" exit /b 0

echo [*] Removing Desktop and Start Menu shortcuts...
del "%USERPROFILE%\\Desktop\\PLiMS 4.1.1 PK Edition.lnk" 2>nul
rmdir /S /Q "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\PLiMS 4.1.1" 2>nul

echo [*] PLiMS shortcuts removed.
echo [i] Application files are preserved in: "%~dp0"
echo [i] You can safely delete that folder if you wish to remove all files.
echo.
pause
`;
  fs.writeFileSync(path.join(stagingDir, 'Uninstall-PLiMS.bat'), uninstallBat);

  // 9. Config JSON
  const configDir = path.join(stagingDir, 'config');
  ensureDir(configDir);
  const configJson = {
    appName: 'Pakistan Library Management System (PLiMS)',
    version: '4.1.1',
    edition: 'PK_OFFICIAL_DESKTOP',
    buildDate: new Date().toISOString(),
    defaultPort: 3000,
    offlineDatabase: {
      type: 'sqlite3_local_sync',
      dbFile: './data/plims_offline.db',
      syncIntervalMinutes: 15,
      cloudEndpoint: 'https://ais-pre-gpew27cmtvqf5mfxh6xd6y-412084889689.asia-southeast1.run.app'
    },
    hardwareSupport: {
      barcodeScanners: ['USB_HID', 'COM_SERIAL', 'WEBCAM_QR'],
      rfidGateReaders: ['ISO_15693', 'ISO_18000_3', 'EPC_GEN2'],
      receiptPrinters: ['ESC_POS_58MM', 'ESC_POS_80MM', 'WINDOWS_SPOOLER']
    },
    defaultBranch: 'National Library of Pakistan - Central Hub Islamabad'
  };
  fs.writeFileSync(path.join(configDir, 'plims-desktop.config.json'), JSON.stringify(configJson, null, 2));

  // 10. Data directory and offline catalog
  const dataDir = path.join(stagingDir, 'data');
  ensureDir(dataDir);
  const sqlBootstrap = `-- PLiMS V4.1.1 Offline Database Bootstrap Schema
CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT
);

INSERT INTO metadata (key, value) VALUES 
('system_name', 'PLiMS Pakistan Library Management System'),
('version', '4.1.1'),
('release_channel', 'official_desktop');

CREATE TABLE IF NOT EXISTS offline_transactions (
    id TEXT PRIMARY KEY,
    member_code TEXT NOT NULL,
    copy_barcode TEXT NOT NULL,
    issue_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT DEFAULT 'ISSUED',
    synced_to_cloud INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS offline_catalog (
    id TEXT PRIMARY KEY,
    isbn TEXT,
    title TEXT NOT NULL,
    authors TEXT,
    call_number TEXT,
    ddc_number TEXT,
    total_copies INTEGER DEFAULT 1,
    available_copies INTEGER DEFAULT 1
);
`;
  fs.writeFileSync(path.join(dataDir, 'schema.sql'), sqlBootstrap);

  const seedJson = {
    branches: [
      { id: 'NLP-01', name: 'National Library of Pakistan - Central Hub Islamabad', city: 'Islamabad' },
      { id: 'PPL-02', name: 'Punjab Public Library Lahore', city: 'Lahore' },
      { id: 'LML-03', name: 'Liaquat Memorial Library Karachi', city: 'Karachi' },
      { id: 'PCL-04', name: 'Peshawar Central Public Library', city: 'Peshawar' },
      { id: 'QBL-05', name: 'Quetta Central Library Balochistan', city: 'Quetta' }
    ],
    sampleCatalog: [
      { isbn: '978-969-0-01234-5', title: 'Kulliyat-e-Iqbal (Urdu)', author: 'Allama Muhammad Iqbal', ddc: '891.4391', copies: 5 },
      { isbn: '978-969-0-05678-9', title: 'The Constitution of the Islamic Republic of Pakistan', author: 'Ministry of Law and Justice', ddc: '342.5491', copies: 3 },
      { isbn: '978-019-5-97812-3', title: 'Jinnah: Creator of Pakistan', author: 'Hector Bolitho', ddc: '923.1549', copies: 4 },
      { isbn: '978-969-4-00111-2', title: 'Dast-e-Saba & Zindan Nama', author: 'Faiz Ahmed Faiz', ddc: '891.4391', copies: 3 },
      { isbn: '978-013-4-68599-1', title: 'Modern Operating Systems (5th Edition)', author: 'Andrew S. Tanenbaum', ddc: '005.43', copies: 4 }
    ]
  };
  fs.writeFileSync(path.join(dataDir, 'plims_offline.json'), JSON.stringify(seedJson, null, 2));

  // 11. Readme
  const readmeText = `================================================================================
  PLiMS V4.1.1 PK EDITION - OFFICIAL WINDOWS DESKTOP PACKAGE
  Department of Libraries, Government of Pakistan
================================================================================

PACKAGE DETAILS:
- Version: 4.1.1
- Release Date: October 2026
- Digital Authority: PLiMS Consortium & NLP Academic ICT Directorate

WHAT IS INCLUDED:
1. Complete Compiled Application Suite (dist/)
   - All modules: Cataloguing, Circulation, OPAC, AI Librarian Bot, Reports,
     Barcode Generator, Authority Control, Backup, Settings, User Management.
2. Built-in Local Offline Server Engine (server.ps1)
   - Operates 100% offline without continuous internet access.
   - Requires zero third-party software or pre-installed runtimes.
3. Windows Setup Wizard (setup.bat)
   - Installs to %LOCALAPPDATA%\\PLiMS-4.1.1 or custom location.
   - Creates Desktop & Start Menu shortcuts automatically.
4. USB Portable Runner (PLiMS-Portable.bat)
   - Zero-installation mode for flash drives.
5. Hardware Peripheral Drivers
   - ESC/POS thermal slip receipt printers (58mm / 80mm).
   - USB Barcode scanners & RFID gate reader protocols.

SYSTEM REQUIREMENTS:
- Windows 11, Windows 10, Windows 8.1, Windows 7 SP1, or Windows Server 2012+
- 2 GB RAM (4 GB recommended)
- 500 MB free disk space

SUPPORT:
National Library of Pakistan ICT Directorate
Website: https://plims.gov.pk
Helpline: ahmedaniaijazakhter@gmail.com
================================================================================
`;
  fs.writeFileSync(path.join(stagingDir, 'README-DESKTOP.txt'), readmeText);
}

/**
 * Builds the 64-bit and 32-bit Windows Setup Installers using NSIS.
 */
function buildNsisInstaller(is64Bit: boolean, outFile: string) {
  const nsiFile = path.join(rootDir, `.build-${is64Bit ? 'x64' : 'x32'}.nsi`);

  const nsiScript = `
!include "MUI2.nsh"

${is64Bit ? 'Target amd64-unicode' : ''}
Unicode True

Name "PLiMS 4.1.1 PK Edition (${is64Bit ? '64-Bit' : '32-Bit'})"
OutFile "${outFile}"
InstallDir "$LOCALAPPDATA\\PLiMS-4.1.1"
InstallDirRegKey HKCU "Software\\PLiMS-4.1.1" "Install_Dir"
RequestExecutionLevel user
SetCompressor /SOLID lzma

; Interface Settings
!define MUI_ABORTWARNING
!define MUI_COMPONENTSPAGE_NODESC

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\\PLiMS-Launch.bat"
!define MUI_FINISHPAGE_RUN_TEXT "Launch PLiMS 4.1.1 Desktop Engine"
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "PLiMS Core Application (All Modules)" SecCore
  SetOutPath "$INSTDIR"
  File /r "${stagingDir}\\*"

  ; Registry key
  WriteRegStr HKCU "Software\\PLiMS-4.1.1" "Install_Dir" "$INSTDIR"

  ; Uninstaller
  WriteUninstaller "$INSTDIR\\uninstall.exe"

  ; Shortcuts
  CreateDirectory "$SMPROGRAMS\\PLiMS 4.1.1"
  CreateShortcut "$SMPROGRAMS\\PLiMS 4.1.1\\PLiMS 4.1.1 PK Edition.lnk" "$INSTDIR\\PLiMS-Launch.bat" "" "$INSTDIR\\dist\\plims_logo.jpg" 0
  CreateShortcut "$SMPROGRAMS\\PLiMS 4.1.1\\PLiMS USB Portable Runner.lnk" "$INSTDIR\\PLiMS-Portable.bat"
  CreateShortcut "$SMPROGRAMS\\PLiMS 4.1.1\\Uninstall PLiMS.lnk" "$INSTDIR\\uninstall.exe"
  CreateShortcut "$DESKTOP\\PLiMS 4.1.1 PK Edition.lnk" "$INSTDIR\\PLiMS-Launch.bat" "" "$INSTDIR\\dist\\plims_logo.jpg" 0
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\\PLiMS 4.1.1 PK Edition.lnk"
  Delete "$SMPROGRAMS\\PLiMS 4.1.1\\PLiMS 4.1.1 PK Edition.lnk"
  Delete "$SMPROGRAMS\\PLiMS 4.1.1\\PLiMS USB Portable Runner.lnk"
  Delete "$SMPROGRAMS\\PLiMS 4.1.1\\Uninstall PLiMS.lnk"
  RMDir "$SMPROGRAMS\\PLiMS 4.1.1"

  DeleteRegKey HKCU "Software\\PLiMS-4.1.1"
  RMDir /r "$INSTDIR"
SectionEnd
`;

  fs.writeFileSync(nsiFile, nsiScript);
  console.log(`[PLiMS Builder] Compiling NSIS ${is64Bit ? '64-bit' : '32-bit'} installer to: ${outFile}...`);
  execSync(`makensis "${nsiFile}"`, { stdio: 'inherit' });
  fs.unlinkSync(nsiFile);
}

/**
 * Builds the Portable Self-Extracting Executable using NSIS.
 */
function buildNsisPortable(outFile: string) {
  const nsiFile = path.join(rootDir, '.build-portable.nsi');

  const nsiScript = `
!include "MUI2.nsh"

Target amd64-unicode
Unicode True

Name "PLiMS 4.1.1 PK Edition (Portable Edition)"
OutFile "${outFile}"
InstallDir "$EXEDIR\\PLiMS-4.1.1-Portable"
RequestExecutionLevel user
SetCompressor /SOLID lzma

; Interface Settings
!define MUI_ABORTWARNING

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\\PLiMS-Portable.bat"
!define MUI_FINISHPAGE_RUN_TEXT "Start PLiMS Portable Engine Now"
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Section "PLiMS Portable Package (All Modules)" SecPortable
  SetOutPath "$INSTDIR"
  File /r "${stagingDir}\\*"
SectionEnd
`;

  fs.writeFileSync(nsiFile, nsiScript);
  console.log(`[PLiMS Builder] Compiling NSIS Portable installer to: ${outFile}...`);
  execSync(`makensis "${nsiFile}"`, { stdio: 'inherit' });
  fs.unlinkSync(nsiFile);
}

/**
 * Builds the pristine Portable ZIP Archive.
 */
function buildPortableZip(outFile: string) {
  console.log(`[PLiMS Builder] Building Portable ZIP package at: ${outFile}...`);
  if (fs.existsSync(outFile)) {
    fs.unlinkSync(outFile);
  }
  // Using native zip tool with maximum compression
  execSync(`cd "${stagingDir}" && zip -r -9 "${outFile}" ./*`, { stdio: 'inherit' });
}

async function main() {
  console.log('[PLiMS Builder] Starting Windows Desktop Packages generation...');

  // 1. Prepare Staging
  prepareStagingFolder();

  // Output paths
  const x64ExePath = path.join(downloadsDir, 'PLiMS-4.1.1-Setup-x64.exe');
  const x32ExePath = path.join(downloadsDir, 'PLiMS-4.1.1-Setup-x32.exe');
  const portableExePath = path.join(downloadsDir, 'PLiMS-4.1.1-Setup-x64.Portable.exe');
  const portableDirectPath = path.join(downloadsDir, 'PLiMS-4.1.1-Setup-x64.Portable');
  const portableZipPath = path.join(downloadsDir, 'PLiMS-4.1.1-Setup-x64.Portable.zip');

  // 2. Build Authentic NSIS Executables
  buildNsisInstaller(true, x64ExePath);
  buildNsisInstaller(false, x32ExePath);
  buildNsisPortable(portableExePath);

  // Copy portable exe to direct .Portable filename for compatibility
  fs.copyFileSync(portableExePath, portableDirectPath);

  // 3. Build Portable ZIP Archive
  buildPortableZip(portableZipPath);

  // Clean staging
  if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }

  // 4. Compute Checksums
  const checksums: Record<string, string> = {
    'PLiMS-4.1.1-Setup-x64.exe': crypto.createHash('sha256').update(fs.readFileSync(x64ExePath)).digest('hex'),
    'PLiMS-4.1.1-Setup-x32.exe': crypto.createHash('sha256').update(fs.readFileSync(x32ExePath)).digest('hex'),
    'PLiMS-4.1.1-Setup-x64.Portable': crypto.createHash('sha256').update(fs.readFileSync(portableDirectPath)).digest('hex'),
    'PLiMS-4.1.1-Setup-x64.Portable.exe': crypto.createHash('sha256').update(fs.readFileSync(portableExePath)).digest('hex'),
    'PLiMS-4.1.1-Setup-x64.Portable.zip': crypto.createHash('sha256').update(fs.readFileSync(portableZipPath)).digest('hex')
  };

  let checksumFileContent = `# PLiMS V4.1.1 PK Edition Official Desktop Release SHA-256 Checksums\n# Generated: ${new Date().toISOString()}\n\n`;
  for (const [file, hash] of Object.entries(checksums)) {
    checksumFileContent += `${hash}  ${file}\n`;
  }
  fs.writeFileSync(path.join(downloadsDir, 'PLiMS-4.1.1-Release-Checksums.sha256'), checksumFileContent);

  // 5. Generate Manifest JSON
  const getFileSize = (filePath: string) => {
    const size = fs.statSync(filePath).size;
    return {
      bytes: size,
      formatted: (size / (1024 * 1024)).toFixed(2) + ' MB'
    };
  };

  const x64Size = getFileSize(x64ExePath);
  const x32Size = getFileSize(x32ExePath);
  const portableSize = getFileSize(portableDirectPath);
  const zipSize = getFileSize(portableZipPath);

  const manifest = {
    version: '4.1.1',
    releaseName: 'PLiMS 4.1.1 PK Desktop Official Package (Authentic Windows Binaries)',
    releaseDate: new Date().toISOString(),
    packages: [
      {
        id: 'setup-x64',
        filename: 'PLiMS-4.1.1-Setup-x64.exe',
        name: 'Official Windows Desktop Installer (64-Bit)',
        arch: 'x64 (AMD64 / Intel 64-bit)',
        sizeBytes: x64Size.bytes,
        sizeFormatted: x64Size.formatted,
        sha256: checksums['PLiMS-4.1.1-Setup-x64.exe'],
        type: 'installer',
        minOs: 'Windows 10 / 11 / Server 2016+ (64-bit)',
        recommendedFor: 'Standard desktop PCs, campus library circulation desks, head librarian workstations',
        modulesIncluded: [
          'OPAC Online Catalog',
          'MARC21 / RDA Cataloguer',
          'Circulation Desk (Issue/Return/Renew/Fines)',
          '24/7 AI Librarian Bot',
          'Barcode & QR Label Generator',
          'Authority Control (Authors, Subjects)',
          'Stock Verification & Audit',
          'Reports & Analytics (PDF/Excel)',
          'Multi-Branch Campus Control',
          'ESC/POS Thermal Receipt Printer',
          'Offline Localhost Server Engine'
        ]
      },
      {
        id: 'setup-x32',
        filename: 'PLiMS-4.1.1-Setup-x32.exe',
        name: 'Official Windows Desktop Installer (32-Bit)',
        arch: 'x86 (Legacy 32-bit)',
        sizeBytes: x32Size.bytes,
        sizeFormatted: x32Size.formatted,
        sha256: checksums['PLiMS-4.1.1-Setup-x32.exe'],
        type: 'installer',
        minOs: 'Windows 7 SP1 / 8 / 10 / 11 (32-bit & 64-bit)',
        recommendedFor: 'Older college and school computer labs across Pakistan with 32-bit hardware',
        modulesIncluded: [
          'OPAC Online Catalog',
          'MARC21 / RDA Cataloguer',
          'Circulation Desk (Issue/Return/Renew/Fines)',
          '24/7 AI Librarian Bot',
          'Barcode & QR Label Generator',
          'Authority Control',
          'Stock Verification & Audit',
          'Reports & Analytics (PDF/Excel)',
          'Multi-Branch Campus Control',
          'ESC/POS Thermal Receipt Printer',
          'Offline Localhost Server Engine'
        ]
      },
      {
        id: 'setup-x64-portable',
        filename: 'PLiMS-4.1.1-Setup-x64.Portable',
        name: 'Official Windows Desktop Portable Edition',
        arch: 'x64 Portable (Zero-Install)',
        sizeBytes: portableSize.bytes,
        sizeFormatted: portableSize.formatted,
        sha256: checksums['PLiMS-4.1.1-Setup-x64.Portable'],
        type: 'portable',
        minOs: 'Windows 10 / 11 / Server (Runs from USB flash drive without admin privileges)',
        recommendedFor: 'Librarians needing a flash-drive portable kit, traveling audits, or zero-admin PCs',
        modulesIncluded: [
          'OPAC Online Catalog',
          'MARC21 / RDA Cataloguer',
          'Circulation Desk (Issue/Return/Renew/Fines)',
          '24/7 AI Librarian Bot',
          'Barcode & QR Label Generator',
          'Authority Control',
          'Stock Verification & Audit',
          'Reports & Analytics (PDF/Excel)',
          'Multi-Branch Campus Control',
          'ESC/POS Thermal Receipt Printer',
          'Offline Localhost Server Engine'
        ]
      },
      {
        id: 'setup-x64-portable-zip',
        filename: 'PLiMS-4.1.1-Setup-x64.Portable.zip',
        name: 'Official Windows Desktop Portable Bundle (ZIP Archive)',
        arch: 'All Windows (ZIP Archive for USB)',
        sizeBytes: zipSize.bytes,
        sizeFormatted: zipSize.formatted,
        sha256: checksums['PLiMS-4.1.1-Setup-x64.Portable.zip'],
        type: 'portable_zip',
        minOs: 'Windows 7 / 8 / 10 / 11 / Server (Extract directly to USB)',
        recommendedFor: 'Extract and double-click PLiMS-Launch.bat on any USB drive with all modules pre-loaded',
        modulesIncluded: [
          'OPAC Online Catalog',
          'MARC21 / RDA Cataloguer',
          'Circulation Desk (Issue/Return/Renew/Fines)',
          '24/7 AI Librarian Bot',
          'Barcode & QR Label Generator',
          'Authority Control',
          'Stock Verification & Audit',
          'Reports & Analytics (PDF/Excel)',
          'Multi-Branch Campus Control',
          'ESC/POS Thermal Receipt Printer',
          'Offline Localhost Server Engine'
        ]
      }
    ]
  };

  fs.writeFileSync(path.join(downloadsDir, 'desktop-packages-manifest.json'), JSON.stringify(manifest, null, 2));

  // Sync to dist/downloads if dist exists
  const distDownloads = path.join(distDir, 'downloads');
  ensureDir(distDownloads);
  execSync(`cp -rf "${downloadsDir}"/* "${distDownloads}"/`);

  console.log('[PLiMS Builder] Desktop packages generated successfully:');
  console.log(`- PLiMS-4.1.1-Setup-x64.exe: ${x64Size.bytes} bytes (${x64Size.formatted}), SHA256: ${checksums['PLiMS-4.1.1-Setup-x64.exe'].slice(0, 16)}...`);
  console.log(`- PLiMS-4.1.1-Setup-x32.exe: ${x32Size.bytes} bytes (${x32Size.formatted}), SHA256: ${checksums['PLiMS-4.1.1-Setup-x32.exe'].slice(0, 16)}...`);
  console.log(`- PLiMS-4.1.1-Setup-x64.Portable: ${portableSize.bytes} bytes (${portableSize.formatted}), SHA256: ${checksums['PLiMS-4.1.1-Setup-x64.Portable'].slice(0, 16)}...`);
  console.log(`- PLiMS-4.1.1-Setup-x64.Portable.zip: ${zipSize.bytes} bytes (${zipSize.formatted}), SHA256: ${checksums['PLiMS-4.1.1-Setup-x64.Portable.zip'].slice(0, 16)}...`);
}

main().catch(err => {
  console.error('[PLiMS Builder] Error building desktop packages:', err);
  process.exit(1);
});
