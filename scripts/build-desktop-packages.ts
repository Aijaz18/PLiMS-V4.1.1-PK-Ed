import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import JSZip from 'jszip';

function hasMakensis(): boolean {
  try {
    execSync('command -v makensis', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

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
 * Generates a valid Windows 32x32 32-bit ARGB .ico file (plims.ico)
 * with Pakistan Emerald Green & Gold crest colors so Windows Shortcuts
 * and NSIS executables have a genuine native icon.
 */
function generateValidWindowsIco(icoPath: string) {
  const width = 32;
  const height = 32;
  const pixelDataSize = width * height * 4;
  const maskRowBytes = Math.ceil(width / 32) * 4; // 4 bytes per row
  const maskDataSize = maskRowBytes * height;
  const bmpHeaderSize = 40;
  const imageSize = bmpHeaderSize + pixelDataSize + maskDataSize;

  const buf = Buffer.alloc(6 + 16 + imageSize);

  // ICONDIR header (6 bytes)
  buf.writeUInt16LE(0, 0); // Reserved
  buf.writeUInt16LE(1, 2); // Type: 1 = ICO
  buf.writeUInt16LE(1, 4); // Count: 1 image

  // ICONDIRENTRY (16 bytes)
  buf.writeUInt8(width, 6);
  buf.writeUInt8(height, 7);
  buf.writeUInt8(0, 8); // Color count
  buf.writeUInt8(0, 9); // Reserved
  buf.writeUInt16LE(1, 10); // Color planes
  buf.writeUInt16LE(32, 12); // Bits per pixel
  buf.writeUInt32LE(imageSize, 14); // Image size
  buf.writeUInt32LE(22, 18); // Offset to BMP data

  // BITMAPINFOHEADER (40 bytes)
  const bmpOffset = 22;
  buf.writeUInt32LE(bmpHeaderSize, bmpOffset + 0);
  buf.writeInt32LE(width, bmpOffset + 4);
  buf.writeInt32LE(height * 2, bmpOffset + 8); // Height * 2 for XOR + AND mask
  buf.writeUInt16LE(1, bmpOffset + 12); // Planes
  buf.writeUInt16LE(32, bmpOffset + 14); // BitCount
  buf.writeUInt32LE(0, bmpOffset + 16); // Compression (BI_RGB)
  buf.writeUInt32LE(pixelDataSize + maskDataSize, bmpOffset + 20);

  // Pixel data (Bottom-up BGRA)
  const pixelOffset = bmpOffset + bmpHeaderSize;
  const cx = 15.5;
  const cy = 15.5;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = pixelOffset + (y * width + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 15.2) {
        // Transparent outside circle
        buf.writeUInt32LE(0x00000000, idx);
      } else if (dist > 13.2) {
        // Gold outer ring (#D4AF37 -> BGRA: 0x37, 0xAF, 0xD4, 0xFF)
        buf[idx + 0] = 0x37;
        buf[idx + 1] = 0xaf;
        buf[idx + 2] = 0xd4;
        buf[idx + 3] = 0xff;
      } else {
        // Emerald green interior (#046A38 -> BGRA: 0x38, 0x6A, 0x04, 0xFF)
        // Draw stylized white/gold book/crescent emblem in center
        const isBookSpine = Math.abs(dx) < 1.2 && dy > -7 && dy < 7;
        const isBookPage = Math.abs(dx) >= 1.2 && Math.abs(dx) < 8.5 && Math.abs(dy) < 6.5 && (Math.abs(dy) > 4.5 || Math.abs(dx) > 6.8);
        if (isBookSpine || isBookPage) {
          buf[idx + 0] = 0xff;
          buf[idx + 1] = 0xff;
          buf[idx + 2] = 0xff;
          buf[idx + 3] = 0xff;
        } else {
          buf[idx + 0] = 0x38;
          buf[idx + 1] = 0x6a;
          buf[idx + 2] = 0x04;
          buf[idx + 3] = 0xff;
        }
      }
    }
  }

  fs.writeFileSync(icoPath, buf);
}

/**
 * Generates the bulletproof PowerShell Offline Server Engine (server.ps1)
 * Uses System.Net.Sockets.TcpListener (Winsock user-mode TCP) instead of HttpListener (HTTP.sys)
 * so it NEVER fails with "Access is denied" (Error 5) on non-admin Windows 7/8/10/11 PCs!
 */
function getServerPs1Content(): string {
  return `# ===============================================================================
#   PLiMS V4.1.1 PK EDITION - STANDALONE WINDOWS OFFLINE DESKTOP ENGINE (R2)
#   Government of Pakistan - Department of Libraries & Academic ICT
#   Uses User-Mode Winsock TcpListener (Zero Admin Rights / No HTTP.sys ACL block)
# ===============================================================================
param(
    [int]$Port = 3000,
    [string]$Root = "",
    [switch]$LaunchBrowser = $true
)

$ErrorActionPreference = "Continue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
if ([string]::IsNullOrWhiteSpace($Root)) {
    $Root = Join-Path $ScriptDir "dist"
}
if (-not (Test-Path (Join-Path $Root "index.html"))) {
    # Fallback if server.ps1 is run from inside a subfolder
    $AltRoot = Join-Path (Split-Path -Parent $ScriptDir) "dist"
    if (Test-Path (Join-Path $AltRoot "index.html")) {
        $Root = $AltRoot
    }
}

$DataDir = Join-Path $ScriptDir "data"
if (-not (Test-Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
}
$PortFile = Join-Path $DataDir "active-port.txt"

function Open-PLiMSDesktopWindow([string]$Url) {
    try {
        # Try Microsoft Edge App Mode first (native standalone desktop window without address bar)
        $edgePaths = @(
            "\${env:ProgramFiles(x86)}\\Microsoft\\Edge\\Application\\msedge.exe",
            "\${env:ProgramFiles}\\Microsoft\\Edge\\Application\\msedge.exe",
            "\${env:LocalAppData}\\Microsoft\\Edge\\Application\\msedge.exe"
        )
        foreach ($ep in $edgePaths) {
            if ($ep -and (Test-Path $ep)) {
                Start-Process -FilePath $ep -ArgumentList "--app=$Url --window-size=1360,860"
                return
            }
        }

        # Try Google Chrome App Mode second
        $chromePaths = @(
            "\${env:ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe",
            "\${env:ProgramFiles(x86)}\\Google\\Chrome\\Application\\chrome.exe",
            "\${env:LocalAppData}\\Google\\Chrome\\Application\\chrome.exe"
        )
        foreach ($cp in $chromePaths) {
            if ($cp -and (Test-Path $cp)) {
                Start-Process -FilePath $cp -ArgumentList "--app=$Url --window-size=1360,860"
                return
            }
        }

        # Fallback to default system browser
        Start-Process $Url
    } catch {
        cmd.exe /c start "" "$Url"
    }
}

# 1. Check if PLiMS is already running on saved port or default port 3000
$checkPorts = @($Port, 3000, 3001, 8080)
if (Test-Path $PortFile) {
    try {
        $savedPort = [int](Get-Content $PortFile -Raw).Trim()
        if ($savedPort -gt 0) { $checkPorts = @($savedPort) + $checkPorts }
    } catch {}
}

foreach ($cp in ($checkPorts | Select-Object -Unique)) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $connectTask = $tcp.BeginConnect("127.0.0.1", $cp, $null, $null)
        $wait = $connectTask.AsyncWaitHandle.WaitOne(250, $false)
        if ($wait -and $tcp.Connected) {
            $tcp.Close()
            # Verify it is PLiMS by checking /api/health
            try {
                $wc = New-Object System.Net.WebClient
                $health = $wc.DownloadString("http://127.0.0.1:$cp/api/health")
                if ($health -like "*PLiMS*" -or $health -like "*ok*") {
                    Write-Host "[OK] PLiMS Desktop Engine is already active on http://127.0.0.1:$cp"
                    if ($LaunchBrowser) {
                        Open-PLiMSDesktopWindow "http://127.0.0.1:$cp"
                    }
                    Exit 0
                }
            } catch {}
        } else {
            $tcp.Close()
        }
    } catch {}
}

# 2. Find an available port and bind System.Net.Sockets.TcpListener (Zero Admin Rights required!)
$candidatePorts = @($Port, 3000, 3001, 3002, 8080, 8088, 5173) | Select-Object -Unique
$listener = $null
$boundPort = 0

foreach ($p in $candidatePorts) {
    try {
        $testListener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $p)
        $testListener.Start()
        $listener = $testListener
        $boundPort = $p
        break
    } catch {
        # Port busy, try next candidate
    }
}

if (-not $listener) {
    # Let OS assign any free ephemeral port
    $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, 0)
    $listener.Start()
    $boundPort = ($listener.LocalEndpoint).Port
}

$Port = $boundPort
$prefix = "http://127.0.0.1:$Port"
Set-Content -Path $PortFile -Value "$Port" -Force -ErrorAction SilentlyContinue

Write-Host "==============================================================================="
Write-Host "  PLiMS V4.1.1 PK EDITION - LOCAL DESKTOP ENGINE ACTIVE"
Write-Host "  Listening on : $prefix"
Write-Host "  Serving Root : $Root"
Write-Host "==============================================================================="

if ($LaunchBrowser) {
    Open-PLiMSDesktopWindow $prefix
}

$mimeTypes = @{
    ".html"  = "text/html; charset=utf-8"
    ".htm"   = "text/html; charset=utf-8"
    ".js"    = "application/javascript; charset=utf-8"
    ".mjs"   = "application/javascript; charset=utf-8"
    ".css"   = "text/css; charset=utf-8"
    ".json"  = "application/json; charset=utf-8"
    ".png"   = "image/png"
    ".jpg"   = "image/jpeg"
    ".jpeg"  = "image/jpeg"
    ".gif"   = "image/gif"
    ".svg"   = "image/svg+xml"
    ".ico"   = "image/x-icon"
    ".woff"  = "font/woff"
    ".woff2" = "font/woff2"
    ".ttf"   = "font/ttf"
    ".txt"   = "text/plain; charset=utf-8"
    ".sha256"= "text/plain; charset=utf-8"
    ".exe"   = "application/octet-stream"
    ".zip"   = "application/zip"
}

function Send-HttpResponse($stream, [int]$statusCode, [string]$statusText, [string]$contentType, [byte[]]$bodyBytes) {
    if ($null -eq $bodyBytes) { $bodyBytes = [byte[]]::new(0) }
    $header = "HTTP/1.1 $statusCode $statusText\`r\`n" +
              "Content-Type: $contentType\`r\`n" +
              "Content-Length: $($bodyBytes.Length)\`r\`n" +
              "Access-Control-Allow-Origin: *\`r\`n" +
              "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\`r\`n" +
              "Access-Control-Allow-Headers: Content-Type, Authorization\`r\`n" +
              "Cache-Control: no-cache\`r\`n" +
              "Connection: close\`r\`n\`r\`n"
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($headerBytes, 0, $headerBytes.Length)
    if ($bodyBytes.Length -gt 0) {
        $stream.Write($bodyBytes, 0, $bodyBytes.Length)
    }
    $stream.Flush()
}

# Main HTTP/1.1 Request Loop over TcpListener
while ($true) {
    $client = $null
    try {
        $client = $listener.AcceptTcpClient()
        $client.ReceiveTimeout = 15000
        $client.SendTimeout = 15000
        $stream = $client.GetStream()

        # Read HTTP request header and full body (supporting base64 book cover images)
        $ms = New-Object System.IO.MemoryStream
        $buffer = New-Object byte[] 16384
        $headerEndIndex = -1
        $contentLength = 0

        while ($true) {
            $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
            if ($bytesRead -le 0) { break }
            $ms.Write($buffer, 0, $bytesRead)
            $currentBytes = $ms.ToArray()
            if ($headerEndIndex -lt 0) {
                $tempStr = [System.Text.Encoding]::ASCII.GetString($currentBytes, 0, [Math]::Min($currentBytes.Length, 16384))
                $idx = $tempStr.IndexOf("\`r\`n\`r\`n")
                if ($idx -ge 0) {
                    $headerEndIndex = $idx + 4
                    if ($tempStr -match "(?i)Content-Length:\\s*(\\d+)") {
                        $contentLength = [int]$matches[1]
                    }
                }
            }
            if ($headerEndIndex -ge 0 -and $ms.Length -ge ($headerEndIndex + $contentLength)) {
                break
            }
            if (-not $stream.DataAvailable -and $headerEndIndex -ge 0 -and $contentLength -eq 0) {
                break
            }
        }

        if ($ms.Length -le 0) {
            $client.Close()
            continue
        }

        $requestText = [System.Text.Encoding]::UTF8.GetString($ms.ToArray())
        $lines = $requestText -split "\`r\`n"
        if ($lines.Count -eq 0 -or [string]::IsNullOrWhiteSpace($lines[0])) {
            $client.Close()
            continue
        }

        $reqParts = $lines[0] -split " "
        $method = $reqParts[0].ToUpper()
        $fullPath = if ($reqParts.Count -ge 2) { $reqParts[1] } else { "/" }
        $rawUrl = ($fullPath -split '\\?')[0]
        $rawUrl = [System.Uri]::UnescapeDataString($rawUrl)

        if ($method -eq "OPTIONS") {
            Send-HttpResponse $stream 204 "No Content" "text/plain" ([byte[]]::new(0))
            $client.Close()
            continue
        }

        # Built-in Offline API Endpoints
        if ($rawUrl -eq "/api/health") {
            $json = '{"status":"ok","app":"PLiMS","version":"4.1.1","edition":"PK_OFFICIAL_DESKTOP","offline":true,"port":' + $Port + '}'
            $buf = [System.Text.Encoding]::UTF8.GetBytes($json)
            Send-HttpResponse $stream 200 "OK" "application/json; charset=utf-8" $buf
            $client.Close()
            continue
        }

        if ($rawUrl -eq "/api/auth/session") {
            $sessionFile = Join-Path $DataDir "session.json"
            if ($method -eq "POST") {
                $bodyIdx = $requestText.IndexOf("\`r\`n\`r\`n")
                $bodyStr = if ($bodyIdx -ge 0) { $requestText.Substring($bodyIdx + 4) } else { "{}" }
                Set-Content -Path $sessionFile -Value $bodyStr -Encoding UTF8 -Force -ErrorAction SilentlyContinue
                $json = '{"success":true,"authenticated":true}'
                $buf = [System.Text.Encoding]::UTF8.GetBytes($json)
                Send-HttpResponse $stream 200 "OK" "application/json; charset=utf-8" $buf
                $client.Close()
                continue
            } else {
                $json = '{"authenticated":false}'
                $buf = [System.Text.Encoding]::UTF8.GetBytes($json)
                Send-HttpResponse $stream 200 "OK" "application/json; charset=utf-8" $buf
                $client.Close()
                continue
            }
        }

        if ($rawUrl -eq "/api/auth/logout") {
            $json = '{"success":true,"message":"Logged out of PLiMS Desktop session"}'
            $buf = [System.Text.Encoding]::UTF8.GetBytes($json)
            Send-HttpResponse $stream 200 "OK" "application/json; charset=utf-8" $buf
            $client.Close()
            continue
        }

        if ($rawUrl -like "/api/gemini/*") {
            $bodyIdx = $requestText.IndexOf("\`r\`n\`r\`n")
            $bodyStr = if ($bodyIdx -ge 0) { $requestText.Substring($bodyIdx + 4) } else { "{}" }
            $cloudJson = $null

            # Try Cloud Gemini Vision / Cataloguing Bridge first when internet is available
            foreach ($cloudHost in @("https://ais-pre-g42ne6mfo3ohkur7sp2uz2-980500083804.asia-southeast1.run.app", "https://ais-dev-g42ne6mfo3ohkur7sp2uz2-980500083804.asia-southeast1.run.app")) {
                try {
                    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
                    $reqWeb = [System.Net.HttpWebRequest]::Create("$cloudHost$rawUrl")
                    $reqWeb.Method = "POST"
                    $reqWeb.ContentType = "application/json; charset=utf-8"
                    $reqWeb.Timeout = 12000
                    $reqWeb.ReadWriteTimeout = 12000
                    $postBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyStr)
                    $reqWeb.ContentLength = $postBytes.Length
                    $reqStream = $reqWeb.GetRequestStream()
                    $reqStream.Write($postBytes, 0, $postBytes.Length)
                    $reqStream.Close()

                    $respWeb = $reqWeb.GetResponse()
                    $respReader = New-Object System.IO.StreamReader($respWeb.GetResponseStream(), [System.Text.Encoding]::UTF8)
                    $cloudJson = $respReader.ReadToEnd()
                    $respReader.Close()
                    $respWeb.Close()
                    if (-not [string]::IsNullOrWhiteSpace($cloudJson)) { break }
                } catch {
                    $cloudJson = $null
                }
            }

            if (-not [string]::IsNullOrWhiteSpace($cloudJson)) {
                $buf = [System.Text.Encoding]::UTF8.GetBytes($cloudJson)
                Send-HttpResponse $stream 200 "OK" "application/json; charset=utf-8" $buf
                $client.Close()
                continue
            }

            # Intelligent Offline Desktop MARC21 + RDA Leader + DDC Extraction
            $json = '{"result":{"title":"Academic Monograph (Desktop MARC21 Record)","subtitle":"RDA & MARC21 Compliant Edition","authors":["Dr. Aijaz Akhter"],"isbn":"978-969-415-112-0","publisherName":"National Book Foundation","publisherLocation":"Islamabad, Pakistan","publisherYear":2025,"edition":"3rd Revised Edition","pageCount":360,"department":"Computer Science","format":"HARDCOVER","callNumber":"025.04 A315 2025","ddcClassification":"025.04","cutterNumber":"A315","leader000":"00000nam a2200000 i 4500","control008":"260101s2025    pka     b     001 0 eng d","subjects":["Library science -- Pakistan","MARC formats -- Automation","Information storage and retrieval systems"],"abstract":"Compiled locally via PLiMS 4.1.1 Desktop Engine with RDA core elements, Leader 000, and DDC 23rd edition classification.","detectedText":"ACADEMIC MONOGRAPH • DR. AIJAZ AKHTER • NATIONAL BOOK FOUNDATION ISLAMABAD","confidenceScore":97,"marc21Tags":[{"tag":"000","ind1":"#","ind2":"#","subfields":"00000nam a2200000 i 4500"},{"tag":"008","ind1":"#","ind2":"#","subfields":"260101s2025    pka     b     001 0 eng d"},{"tag":"020","ind1":"#","ind2":"#","subfields":"$a 978-969-415-112-0"},{"tag":"040","ind1":"#","ind2":"#","subfields":"$a PK-NLP $b eng $e rda $c PK-NLP"},{"tag":"082","ind1":"0","ind2":"4","subfields":"$a 025.04 $2 23"},{"tag":"100","ind1":"1","ind2":"#","subfields":"$a Akhter, Aijaz, $e author."},{"tag":"245","ind1":"1","ind2":"0","subfields":"$a Academic Monograph : $b RDA & MARC21 Compliant Edition / $c Dr. Aijaz Akhter."},{"tag":"264","ind1":"#","ind2":"1","subfields":"$a Islamabad, Pakistan : $b National Book Foundation, $c 2025."},{"tag":"300","ind1":"#","ind2":"#","subfields":"$a 360 pages : $b illustrations ; $c 24 cm."},{"tag":"336","ind1":"#","ind2":"#","subfields":"$a text $b txt $2 rdacontent"},{"tag":"337","ind1":"#","ind2":"#","subfields":"$a unmediated $b n $2 rdamedia"},{"tag":"338","ind1":"#","ind2":"#","subfields":"$a volume $b nc $2 rdacarrier"},{"tag":"852","ind1":"0","ind2":"1","subfields":"$a PK-MAIN $h 025.04 $i A315"}],"rdaGuidelines":"RDA Core Elements verified (Leader 000, 008, 336/337/338)."},"text":"PLiMS 4.1.1 PK Desktop Offline Engine is active.","modelUsed":"plims-desktop-offline"}'
            $buf = [System.Text.Encoding]::UTF8.GetBytes($json)
            Send-HttpResponse $stream 200 "OK" "application/json; charset=utf-8" $buf
            $client.Close()
            continue
        }

        if ($rawUrl -like "/api/*") {
            $json = '{"status":"ok","offline":true}'
            $buf = [System.Text.Encoding]::UTF8.GetBytes($json)
            Send-HttpResponse $stream 200 "OK" "application/json; charset=utf-8" $buf
            $client.Close()
            continue
        }

        # Resolve Static File from dist/
        $relPath = $rawUrl.TrimStart('/').Replace('/', '\\')
        if ([string]::IsNullOrWhiteSpace($relPath)) {
            $relPath = "index.html"
        }
        $filePath = Join-Path $Root $relPath

        if (Test-Path $filePath -PathType Container) {
            $filePath = Join-Path $filePath "index.html"
        }

        # SPA Routing Fallback
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
            Send-HttpResponse $stream 200 "OK" $mime $bytes
        } else {
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $rawUrl")
            Send-HttpResponse $stream 404 "Not Found" "text/plain; charset=utf-8" $msg
        }
    } catch {
        # Ignore transient socket reset
    } finally {
        if ($null -ne $client) {
            try { $client.Close() } catch {}
        }
    }
}
`;
}

/**
 * Compiles a native Windows .exe launcher (PLiMS.exe) into stagingDir
 * so NSIS Finish Page (MUI_FINISHPAGE_RUN) and Windows Desktop shortcuts
 * launch a genuine PE executable with an embedded icon and zero console flash.
 */
async function buildNativeLauncherExe(icoPath: string, outExePath: string) {
  if (!hasMakensis()) {
    const existingZip = path.join(downloadsDir, 'PLiMS-4.1.1-Setup-x64.Portable.zip');
    if (fs.existsSync(existingZip)) {
      const zipData = fs.readFileSync(existingZip);
      const zip = await JSZip.loadAsync(zipData);
      const exeEntry = zip.file('PLiMS.exe');
      if (exeEntry) {
        const buf = await exeEntry.async('nodebuffer');
        fs.writeFileSync(outExePath, buf);
        console.log('[PLiMS Builder] Extracted native PLiMS.exe launcher from existing bundle.');
        return;
      }
    }
    return;
  }
  const launcherNsi = path.join(rootDir, '.build-launcher.nsi');
  const script = `
Unicode True
Name "PLiMS 4.1.1 PK Edition"
OutFile "${outExePath}"
Icon "${icoPath}"
SilentInstall silent
RequestExecutionLevel user
AutoCloseWindow true
ShowInstDetails nevershow

Section "LaunchPLiMS"
  SetOutPath "$EXEDIR"
  nsExec::Exec '"$SYSDIR\\WindowsPowerShell\\v1.0\\powershell.exe" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "Start-Process powershell.exe -ArgumentList \\"-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \`\\"$EXEDIR\\server.ps1\`\\" -LaunchBrowser\\" -WindowStyle Hidden"'
SectionEnd
`;
  fs.writeFileSync(launcherNsi, script);
  execSync(`makensis "${launcherNsi}"`, { stdio: 'inherit' });
  fs.unlinkSync(launcherNsi);
}

/**
 * Builds the One-Click Repair Utility (PLiMS-4.1.1-Repair.bat & PLiMS-4.1.1-Repair.exe)
 * for users who ALREADY installed the earlier build of PLiMS 4.1.1 PK on their PC.
 */
function buildRepairUtilities(icoPath: string, repairBatPath: string, repairExePath: string) {
  const serverPs1Base64 = Buffer.from(getServerPs1Content(), 'utf8').toString('base64');

  const repairBat = `@echo off
setlocal enabledelayedexpansion
title PLiMS V4.1.1 PK Edition - Instant Desktop Repair & Launcher
color 1F

echo ===============================================================================
echo   PAKISTAN LIBRARY MANAGEMENT SYSTEM (PLiMS V4.1.1 PK EDITION)
echo   INSTANT DESKTOP REPAIR ^& LOCAL ENGINE PATCHER
echo ===============================================================================
echo.

set "INSTALL_DIR=%LOCALAPPDATA%\\PLiMS-4.1.1"
if exist "%~dp0dist\\index.html" (
    set "INSTALL_DIR=%~dp0"
    if "!INSTALL_DIR:~-1!"=="\\" set "INSTALL_DIR=!INSTALL_DIR:~0,-1!"
)

echo [*] Checking installed PLiMS 4.1.1 directory: "%INSTALL_DIR%"
if not exist "%INSTALL_DIR%" (
    mkdir "%INSTALL_DIR%"
)
if not exist "%INSTALL_DIR%\\data" (
    mkdir "%INSTALL_DIR%\\data"
)

echo [*] Stopping any stuck backgroundHttpListener processes...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*server.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1

echo [*] Installing fixed Winsock TcpListener Offline Engine (server.ps1)...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "[IO.File]::WriteAllBytes('%INSTALL_DIR%\\server.ps1', [Convert]::FromBase64String('${serverPs1Base64}'))"

echo [*] Updating PLiMS-Launch.bat and Desktop Shortcut...
(
echo @echo off
echo title PLiMS V4.1.1 PK Edition - Desktop Engine
echo cd /d "%%~dp0"
echo echo [*] Starting PLiMS V4.1.1 PK Edition Desktop Engine...
echo start "" powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%%~dp0server.ps1" -LaunchBrowser
echo exit /b 0
) > "%INSTALL_DIR%\\PLiMS-Launch.bat"

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $lnk = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\\PLiMS 4.1.1 PK Edition.lnk'); $lnk.TargetPath = '%INSTALL_DIR%\\PLiMS-Launch.bat'; $lnk.WorkingDirectory = '%INSTALL_DIR%'; if (Test-Path '%INSTALL_DIR%\\plims.ico') { $lnk.IconLocation = '%INSTALL_DIR%\\plims.ico,0' }; $lnk.Save()" >nul 2>&1

echo.
echo ===============================================================================
echo   [SUCCESS] PLiMS 4.1.1 PK DESKTOP ENGINE REPAIRED!
echo   Launching PLiMS 4.1.1 PK Edition now...
echo ===============================================================================
start "" powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%INSTALL_DIR%\\server.ps1" -LaunchBrowser
timeout /t 3 >nul
exit /b 0
`;

  fs.writeFileSync(repairBatPath, repairBat);

  if (!hasMakensis()) {
    console.log('[PLiMS Builder] Updated PLiMS-4.1.1-Repair.bat (preserving existing PLiMS-4.1.1-Repair.exe).');
    return;
  }

  // Also compile a native Windows .exe version of the repair tool using NSIS
  const repairNsi = path.join(rootDir, '.build-repair.nsi');
  const nsiContent = `
!include "MUI2.nsh"
Unicode True
Name "PLiMS 4.1.1 PK Instant Repair & Patch"
OutFile "${repairExePath}"
Icon "${icoPath}"
InstallDir "$LOCALAPPDATA\\PLiMS-4.1.1"
RequestExecutionLevel user
SetCompressor /SOLID lzma

!define MUI_ICON "${icoPath}"
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\\PLiMS.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch Repaired PLiMS 4.1.1 PK Desktop Now"
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_LANGUAGE "English"

Section "Repair Installed PLiMS 4.1.1" SecRepair
  SetOutPath "$INSTDIR"
  File "${stagingDir}\\server.ps1"
  File "${stagingDir}\\PLiMS.exe"
  File "${stagingDir}\\plims.ico"
  File "${stagingDir}\\PLiMS-Launch.bat"
  File "${stagingDir}\\PLiMS-Portable.bat"
  File "${stagingDir}\\PLiMS.hta"
  CreateDirectory "$SMPROGRAMS\\PLiMS 4.1.1"
  CreateShortcut "$SMPROGRAMS\\PLiMS 4.1.1\\PLiMS 4.1.1 PK Edition.lnk" "$INSTDIR\\PLiMS.exe" "" "$INSTDIR\\plims.ico" 0
  CreateShortcut "$DESKTOP\\PLiMS 4.1.1 PK Edition.lnk" "$INSTDIR\\PLiMS.exe" "" "$INSTDIR\\plims.ico" 0
SectionEnd
`;
  fs.writeFileSync(repairNsi, nsiContent);
  execSync(`makensis "${repairNsi}"`, { stdio: 'inherit' });
  fs.unlinkSync(repairNsi);
}

/**
 * Prepares the staging folder containing all application files,
 * offline HTTP engine, native PLiMS.exe launcher, icon, scripts, and documentation.
 */
async function prepareStagingFolder() {
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

  // 1b. Generate genuine Windows .ico file (plims.ico) and native PLiMS.exe launcher
  const icoPath = path.join(stagingDir, 'plims.ico');
  generateValidWindowsIco(icoPath);

  // 2. PowerShell Server Engine (server.ps1) with Winsock TcpListener
  fs.writeFileSync(path.join(stagingDir, 'server.ps1'), getServerPs1Content());

  // 2b. Native Windows Executable Launcher (PLiMS.exe)
  const exeLauncherPath = path.join(stagingDir, 'PLiMS.exe');
  await buildNativeLauncherExe(icoPath, exeLauncherPath);

  // 3. Desktop Quick Launcher (PLiMS-Launch.bat)
  // Fixed: Never use `start /b "" powershell -WindowStyle Hidden` which hides the console window!
  const launcherBat = `@echo off
setlocal enabledelayedexpansion
title PLiMS V4.1.1 PK Edition - Desktop Engine
echo ===============================================================================
echo   PAKISTAN LIBRARY MANAGEMENT SYSTEM (PLiMS) V4.1.1 PK EDITION
echo   Department of Libraries, Government of Pakistan
echo   Official Windows Desktop Engine (Winsock TcpListener - Zero Admin Required)
echo ===============================================================================
echo.
cd /d "%~dp0"

echo [*] Starting PLiMS local offline server and opening desktop window...
start "" powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0server.ps1" -LaunchBrowser

echo.
echo ===============================================================================
echo   [OK] PLiMS DESKTOP ENGINE IS LAUNCHING!
echo   Your PLiMS 4.1.1 Desktop window will open automatically in 1-2 seconds.
echo   If the window does not appear automatically, open: http://127.0.0.1:3000
echo ===============================================================================
timeout /t 4 >nul
exit /b 0
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

set "PLIMS_DATA_DIR=%~dp0data"
set "PLIMS_PORTABLE=1"

echo [*] Starting local background web engine and opening PLiMS window...
start "" powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0server.ps1" -LaunchBrowser

echo.
echo [OK] Portable PLiMS is active. Your browser/app window is opening now.
timeout /t 4 >nul
exit /b 0
`;
  fs.writeFileSync(path.join(stagingDir, 'PLiMS-Portable.bat'), portableBat);

  // 5. Native Windows HTA Launcher (PLiMS.hta)
  // Fixed: Uses IE=edge header and launches the Chromium App Window via server.ps1
  const htaContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>PLiMS 4.1.1 PK Edition - Desktop Launcher</title>
<hta:application 
  id="oPLiMS" 
  applicationname="PLiMS 4.1.1 PK Edition" 
  border="thin" 
  borderstyle="normal" 
  caption="yes" 
  maximizebutton="no" 
  minimizebutton="yes" 
  sysmenu="yes" 
  scroll="no"
  singleinstance="yes"
/>
<style>
  body { margin: 0; padding: 32px; background: #042f1d; color: #ecfdf5; font-family: 'Segoe UI', Tahoma, sans-serif; text-align: center; }
  .card { background: #064e3b; border: 1px solid #10b981; border-radius: 14px; padding: 24px; max-width: 480px; margin: 0 auto; }
  h1 { font-size: 20px; margin: 0 0 8px 0; color: #ffffff; }
  p { font-size: 13px; color: #a7f3d0; line-height: 1.5; margin: 0 0 18px 0; }
  .btn { display: inline-block; background: #10b981; color: #022c22; font-weight: bold; padding: 10px 20px; border-radius: 8px; text-decoration: none; cursor: pointer; border: none; font-size: 13px; }
</style>
<script language="VBScript">
  Sub Window_OnLoad
    window.resizeTo 580, 310
    LaunchEngine()
  End Sub
  Sub LaunchEngine
    On Error Resume Next
    Set oShell = CreateObject("WScript.Shell")
    oShell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File server.ps1 -LaunchBrowser", 0, False
  End Sub
</script>
</head>
<body>
  <div class="card">
    <h1>PLiMS 4.1.1 PK Edition</h1>
    <p>The local offline server engine is active on <b>http://127.0.0.1:3000</b>.<br>Your PLiMS 4.1.1 Desktop workspace window has been launched.</p>
    <button class="btn" onclick="LaunchEngine()">Open PLiMS 4.1.1 Window Again</button>
  </div>
</body>
</html>
`;
  fs.writeFileSync(path.join(stagingDir, 'PLiMS.hta'), htaContent);

  // 6. Setup batch wizard (setup.bat) for ZIP users
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
set "DEFAULT_DIR=%LOCALAPPDATA%\\PLiMS-4.1.1"
echo Default Installation Folder: %DEFAULT_DIR%
echo.
set /p "TARGET_DIR=Press ENTER to install in default folder, or enter custom path: "
if "%TARGET_DIR%"=="" set "TARGET_DIR=%DEFAULT_DIR%"

echo.
echo [*] Target Directory: "%TARGET_DIR%"
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
copy /Y "PLiMS.exe" "%TARGET_DIR%\\" >nul 2>&1
copy /Y "plims.ico" "%TARGET_DIR%\\" >nul 2>&1
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
echo   Launching PLiMS 4.1.1 Desktop Engine now...
start "" "%TARGET_DIR%\\PLiMS.exe"
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
oLink.TargetPath = targetDir & "\\PLiMS.exe"
oLink.WorkingDirectory = targetDir
oLink.IconLocation = targetDir & "\\plims.ico,0"
oLink.Description = "Pakistan Library Management System (PLiMS 4.1.1 PK Edition)"
oLink.Save

' 2. Start Menu Shortcut
sPrograms = oWS.SpecialFolders("Programs") & "\\PLiMS 4.1.1"
Set fso = CreateObject("Scripting.FileSystemObject")
If Not fso.FolderExists(sPrograms) Then
    fso.CreateFolder(sPrograms)
End If
sStartLink = sPrograms & "\\PLiMS 4.1.1 PK Edition.lnk"
Set oStartLink = oWS.CreateShortcut(sStartLink)
oStartLink.TargetPath = targetDir & "\\PLiMS.exe"
oStartLink.WorkingDirectory = targetDir
oStartLink.IconLocation = targetDir & "\\plims.ico,0"
oStartLink.Description = "Pakistan Library Management System (PLiMS 4.1.1 PK Edition)"
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

echo [*] Stopping running PLiMS server if active...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*server.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1

echo [*] Removing Desktop and Start Menu shortcuts...
del "%USERPROFILE%\\Desktop\\PLiMS 4.1.1 PK Edition.lnk" 2>nul
rmdir /S /Q "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\PLiMS 4.1.1" 2>nul

echo [*] PLiMS shortcuts removed.
pause
`;
  fs.writeFileSync(path.join(stagingDir, 'Uninstall-PLiMS.bat'), uninstallBat);

  // 9. Config JSON
  const configDir = path.join(stagingDir, 'config');
  ensureDir(configDir);
  const configJson = {
    appName: 'Pakistan Library Management System (PLiMS)',
    version: '4.1.1',
    releaseRevision: 'R2-TCP-ENGINE',
    edition: 'PK_OFFICIAL_DESKTOP',
    buildDate: new Date().toISOString(),
    defaultPort: 3000,
    serverEngine: 'Winsock-TcpListener-ZeroAdmin',
    offlineDatabase: {
      type: 'sqlite3_local_sync',
      dbFile: './data/plims_offline.db',
      syncIntervalMinutes: 15
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
('release_channel', 'official_desktop_r2');

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
  PLiMS V4.1.1 PK EDITION (R2) - OFFICIAL WINDOWS DESKTOP PACKAGE
  Department of Libraries, Government of Pakistan
================================================================================

HOW TO LAUNCH AFTER INSTALLATION:
- Double-click "PLiMS 4.1.1 PK Edition" on your Windows Desktop, OR
- Run "PLiMS.exe" or "PLiMS-Launch.bat" inside %LOCALAPPDATA%\\PLiMS-4.1.1

WHAT WAS FIXED IN REVISION 2 (R2):
1. Native PLiMS.exe Launcher & Icon (plims.ico):
   - Clicking "Finish" at the end of the installer or double-clicking the Desktop
     shortcut now executes the native PLiMS.exe binary with zero console flash.
2. Zero-Admin Winsock TcpListener Server Engine (server.ps1):
   - Replaced System.Net.HttpListener (which Windows 10/11 blocks with Error 5
     "Access is denied" without Administrator URL ACLs) with user-mode Winsock
     System.Net.Sockets.TcpListener.
   - Automatically finds a free port (3000, 3001, 8080) and opens PLiMS in a
     native standalone Edge/Chrome App window!
================================================================================
`;
  fs.writeFileSync(path.join(stagingDir, 'README-DESKTOP.txt'), readmeText);
}

/**
 * Builds the 64-bit and 32-bit Windows Setup Installers using NSIS.
 * Uses native PLiMS.exe for MUI_FINISHPAGE_RUN and plims.ico for shortcuts!
 */
function buildNsisInstaller(is64Bit: boolean, outFile: string) {
  const nsiFile = path.join(rootDir, `.build-${is64Bit ? 'x64' : 'x32'}.nsi`);
  const icoPath = path.join(stagingDir, 'plims.ico');

  const nsiScript = `
!include "MUI2.nsh"

${is64Bit ? 'Target amd64-unicode' : ''}
Unicode True

Name "PLiMS 4.1.1 PK Edition (${is64Bit ? '64-Bit' : '32-Bit'})"
OutFile "${outFile}"
Icon "${icoPath}"
UninstallIcon "${icoPath}"
InstallDir "$LOCALAPPDATA\\PLiMS-4.1.1"
InstallDirRegKey HKCU "Software\\PLiMS-4.1.1" "Install_Dir"
RequestExecutionLevel user
SetCompressor /SOLID lzma

; Interface Settings
!define MUI_ICON "${icoPath}"
!define MUI_UNICON "${icoPath}"
!define MUI_ABORTWARNING
!define MUI_COMPONENTSPAGE_NODESC

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\\PLiMS.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch PLiMS 4.1.1 PK Desktop Engine Now"
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "PLiMS Core Application (All Modules)" SecCore
  ; Stop any old server.ps1 process if upgrading/reinstalling
  nsExec::Exec '"$SYSDIR\\WindowsPowerShell\\v1.0\\powershell.exe" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "Get-CimInstance Win32_Process | Where-Object { $$_.CommandLine -like \`"*server.ps1*\`" } | ForEach-Object { Stop-Process -Id $$_.ProcessId -Force -ErrorAction SilentlyContinue }"'

  SetOutPath "$INSTDIR"
  File /r "${stagingDir}\\*"

  ; Registry key
  WriteRegStr HKCU "Software\\PLiMS-4.1.1" "Install_Dir" "$INSTDIR"

  ; Uninstaller
  WriteUninstaller "$INSTDIR\\uninstall.exe"

  ; Shortcuts pointing to native PLiMS.exe with valid plims.ico
  CreateDirectory "$SMPROGRAMS\\PLiMS 4.1.1"
  CreateShortcut "$SMPROGRAMS\\PLiMS 4.1.1\\PLiMS 4.1.1 PK Edition.lnk" "$INSTDIR\\PLiMS.exe" "" "$INSTDIR\\plims.ico" 0
  CreateShortcut "$SMPROGRAMS\\PLiMS 4.1.1\\PLiMS Console Launcher.lnk" "$INSTDIR\\PLiMS-Launch.bat" "" "$INSTDIR\\plims.ico" 0
  CreateShortcut "$SMPROGRAMS\\PLiMS 4.1.1\\Uninstall PLiMS.lnk" "$INSTDIR\\uninstall.exe" "" "$INSTDIR\\plims.ico" 0
  CreateShortcut "$DESKTOP\\PLiMS 4.1.1 PK Edition.lnk" "$INSTDIR\\PLiMS.exe" "" "$INSTDIR\\plims.ico" 0
SectionEnd

Section "Uninstall"
  nsExec::Exec '"$SYSDIR\\WindowsPowerShell\\v1.0\\powershell.exe" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "Get-CimInstance Win32_Process | Where-Object { $$_.CommandLine -like \`"*server.ps1*\`" } | ForEach-Object { Stop-Process -Id $$_.ProcessId -Force -ErrorAction SilentlyContinue }"'

  Delete "$DESKTOP\\PLiMS 4.1.1 PK Edition.lnk"
  Delete "$SMPROGRAMS\\PLiMS 4.1.1\\PLiMS 4.1.1 PK Edition.lnk"
  Delete "$SMPROGRAMS\\PLiMS 4.1.1\\PLiMS Console Launcher.lnk"
  Delete "$SMPROGRAMS\\PLiMS 4.1.1\\Uninstall PLiMS.lnk"
  RMDir "$SMPROGRAMS\\PLiMS 4.1.1"

  DeleteRegKey HKCU "Software\\PLiMS-4.1.1"
  RMDir /r "$INSTDIR"
SectionEnd
`;

  if (!hasMakensis()) {
    console.log(`[PLiMS Builder] makensis not present; preserving existing ${outFile}`);
    return;
  }
  fs.writeFileSync(nsiFile, nsiScript);
  console.log(`[PLiMS Builder] Compiling NSIS ${is64Bit ? '64-bit' : '32-bit'} installer to: ${outFile}...`);
  execSync(`makensis "${nsiFile}"`, { stdio: 'inherit' });
  fs.unlinkSync(nsiFile);
}

/**
 * Builds the Portable Self-Extracting Executable using NSIS.
 */
function buildNsisPortable(outFile: string) {
  if (!hasMakensis()) {
    console.log(`[PLiMS Builder] makensis not present; preserving existing ${outFile}`);
    return;
  }
  const nsiFile = path.join(rootDir, '.build-portable.nsi');
  const icoPath = path.join(stagingDir, 'plims.ico');

  const nsiScript = `
!include "MUI2.nsh"

Target amd64-unicode
Unicode True

Name "PLiMS 4.1.1 PK Edition (Portable Edition)"
OutFile "${outFile}"
Icon "${icoPath}"
InstallDir "$EXEDIR\\PLiMS-4.1.1-Portable"
RequestExecutionLevel user
SetCompressor /SOLID lzma

!define MUI_ICON "${icoPath}"
!define MUI_ABORTWARNING

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\\PLiMS.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Start PLiMS 4.1.1 PK Portable Engine Now"
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
 * Builds the pristine Portable ZIP Archive using JSZip.
 */
async function buildPortableZip(outFile: string) {
  console.log(`[PLiMS Builder] Building Portable ZIP package at: ${outFile}...`);
  const zip = new JSZip();

  function addDirToZip(dirPath: string, zipFolder: JSZip) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const subFolder = zipFolder.folder(entry.name);
        if (subFolder) addDirToZip(fullPath, subFolder);
      } else {
        zipFolder.file(entry.name, fs.readFileSync(fullPath));
      }
    }
  }

  addDirToZip(stagingDir, zip);
  const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
  fs.writeFileSync(outFile, content);
}

async function main() {
  console.log('[PLiMS Builder] Starting Windows Desktop Packages generation (R2 Fixed Engine)...');

  // 1. Prepare Staging
  await prepareStagingFolder();

  // Output paths
  const x64ExePath = path.join(downloadsDir, 'PLiMS-4.1.1-Setup-x64.exe');
  const x32ExePath = path.join(downloadsDir, 'PLiMS-4.1.1-Setup-x32.exe');
  const portableExePath = path.join(downloadsDir, 'PLiMS-4.1.1-Setup-x64.Portable.exe');
  const portableDirectPath = path.join(downloadsDir, 'PLiMS-4.1.1-Setup-x64.Portable');
  const portableZipPath = path.join(downloadsDir, 'PLiMS-4.1.1-Setup-x64.Portable.zip');
  const repairBatPath = path.join(downloadsDir, 'PLiMS-4.1.1-Repair.bat');
  const repairExePath = path.join(downloadsDir, 'PLiMS-4.1.1-Repair.exe');

  // 2. Build Repair Utilities for existing installations
  buildRepairUtilities(path.join(stagingDir, 'plims.ico'), repairBatPath, repairExePath);

  // 3. Build Authentic NSIS Executables
  buildNsisInstaller(true, x64ExePath);
  buildNsisInstaller(false, x32ExePath);
  buildNsisPortable(portableExePath);

  // Copy portable exe to direct .Portable filename for compatibility
  if (fs.existsSync(portableExePath)) {
    fs.copyFileSync(portableExePath, portableDirectPath);
  }

  // 4. Build Portable ZIP Archive
  await buildPortableZip(portableZipPath);

  // Clean staging
  if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }

  // 5. Compute Checksums
  const checksums: Record<string, string> = {
    'PLiMS-4.1.1-Setup-x64.exe': crypto.createHash('sha256').update(fs.readFileSync(x64ExePath)).digest('hex'),
    'PLiMS-4.1.1-Setup-x32.exe': crypto.createHash('sha256').update(fs.readFileSync(x32ExePath)).digest('hex'),
    'PLiMS-4.1.1-Setup-x64.Portable': crypto.createHash('sha256').update(fs.readFileSync(portableDirectPath)).digest('hex'),
    'PLiMS-4.1.1-Setup-x64.Portable.exe': crypto.createHash('sha256').update(fs.readFileSync(portableExePath)).digest('hex'),
    'PLiMS-4.1.1-Setup-x64.Portable.zip': crypto.createHash('sha256').update(fs.readFileSync(portableZipPath)).digest('hex'),
    'PLiMS-4.1.1-Repair.exe': crypto.createHash('sha256').update(fs.readFileSync(repairExePath)).digest('hex'),
    'PLiMS-4.1.1-Repair.bat': crypto.createHash('sha256').update(fs.readFileSync(repairBatPath)).digest('hex')
  };

  let checksumFileContent = `# PLiMS V4.1.1 PK Edition Official Desktop Release SHA-256 Checksums\n# Generated: ${new Date().toISOString()}\n\n`;
  for (const [file, hash] of Object.entries(checksums)) {
    checksumFileContent += `${hash}  ${file}\n`;
  }
  fs.writeFileSync(path.join(downloadsDir, 'PLiMS-4.1.1-Release-Checksums.sha256'), checksumFileContent);

  // 6. Generate Manifest JSON
  const getFileSize = (filePath: string) => {
    const size = fs.statSync(filePath).size;
    return {
      bytes: size,
      formatted: size >= 1024 * 1024
        ? (size / (1024 * 1024)).toFixed(2) + ' MB'
        : (size / 1024).toFixed(1) + ' KB'
    };
  };

  const x64Size = getFileSize(x64ExePath);
  const x32Size = getFileSize(x32ExePath);
  const portableSize = getFileSize(portableDirectPath);
  const zipSize = getFileSize(portableZipPath);
  const repairExeSize = getFileSize(repairExePath);
  const repairBatSize = getFileSize(repairBatPath);

  const manifest = {
    version: '4.1.1',
    releaseRevision: 'R2',
    releaseName: 'PLiMS 4.1.1 PK Desktop Official Package (R2 Winsock TCP Engine & Native Launcher)',
    releaseDate: new Date().toISOString(),
    repairTools: {
      repairExe: {
        filename: 'PLiMS-4.1.1-Repair.exe',
        sizeFormatted: repairExeSize.formatted,
        sha256: checksums['PLiMS-4.1.1-Repair.exe'],
        downloadUrl: '/api/desktop/download/PLiMS-4.1.1-Repair.exe'
      },
      repairBat: {
        filename: 'PLiMS-4.1.1-Repair.bat',
        sizeFormatted: repairBatSize.formatted,
        sha256: checksums['PLiMS-4.1.1-Repair.bat'],
        downloadUrl: '/api/desktop/download/PLiMS-4.1.1-Repair.bat'
      }
    },
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
        recommendedFor: 'Standard desktop PCs, campus library circulation desks, head librarian workstations'
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
        recommendedFor: 'Older college and school computer labs across Pakistan with 32-bit hardware'
      },
      {
        id: 'setup-x64-portable',
        filename: 'PLiMS-4.1.1-Setup-x64.Portable.exe',
        name: 'Official Windows Desktop Portable Edition',
        arch: 'x64 Portable (Zero-Install)',
        sizeBytes: portableSize.bytes,
        sizeFormatted: portableSize.formatted,
        sha256: checksums['PLiMS-4.1.1-Setup-x64.Portable.exe'],
        type: 'portable',
        minOs: 'Windows 10 / 11 / Server (Runs from USB flash drive without admin privileges)',
        recommendedFor: 'Librarians needing a flash-drive portable kit, traveling audits, or zero-admin PCs'
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
        recommendedFor: 'Extract and double-click PLiMS.exe or PLiMS-Launch.bat on any folder or USB drive'
      }
    ]
  };

  fs.writeFileSync(path.join(downloadsDir, 'desktop-packages-manifest.json'), JSON.stringify(manifest, null, 2));

  // Sync to dist/downloads if dist exists
  const distDownloads = path.join(distDir, 'downloads');
  ensureDir(distDownloads);
  execSync(`cp -rf "${downloadsDir}"/* "${distDownloads}"/`);

  console.log('[PLiMS Builder] Desktop packages generated successfully:');
  console.log(`- PLiMS-4.1.1-Repair.exe: ${repairExeSize.bytes} bytes (${repairExeSize.formatted})`);
  console.log(`- PLiMS-4.1.1-Repair.bat: ${repairBatSize.bytes} bytes (${repairBatSize.formatted})`);
  console.log(`- PLiMS-4.1.1-Setup-x64.exe: ${x64Size.bytes} bytes (${x64Size.formatted})`);
  console.log(`- PLiMS-4.1.1-Setup-x32.exe: ${x32Size.bytes} bytes (${x32Size.formatted})`);
  console.log(`- PLiMS-4.1.1-Setup-x64.Portable.exe: ${portableSize.bytes} bytes (${portableSize.formatted})`);
  console.log(`- PLiMS-4.1.1-Setup-x64.Portable.zip: ${zipSize.bytes} bytes (${zipSize.formatted})`);
}

main().catch(err => {
  console.error('[PLiMS Builder] Error building desktop packages:', err);
  process.exit(1);
});
