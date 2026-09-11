import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  QrCode,
  Camera,
  Upload,
  Zap,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  RefreshCw,
  X,
  BookOpen,
  ArrowRightLeft,
  User,
  Users,
  Clock,
  ShieldCheck,
  Sparkles,
  Search,
  Check,
  Sliders,
  Maximize2,
  Minimize2,
  FileText,
  Copy,
  Lightbulb,
  CornerDownLeft
} from 'lucide-react';
import jsQR from 'jsqr';
import { UserProfile, CirculationTransaction, BookRecord, SystemSettings } from '../types/alims';
import { generateQrMatrix } from '../utils/qrBarcodeGenerator';

interface MemberQrScannerProps {
  users: UserProfile[];
  transactions: CirculationTransaction[];
  books: BookRecord[];
  settings?: SystemSettings;
  onReturnBook: (transactionId: string) => void;
  onIssueBook: (accession: string, memberId: string) => void;
  onRenewBook?: (txId: string) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const MemberQrScanner: React.FC<MemberQrScannerProps> = ({
  users,
  transactions,
  books,
  settings,
  onReturnBook,
  onIssueBook,
  onRenewBook,
  onClose,
  isModal = false
}) => {
  // Scanner Mode: Camera Stream, Image Upload, or Manual/USB Scanner
  const [scanMode, setScanMode] = useState<'CAMERA' | 'UPLOAD' | 'MANUAL' | 'SAMPLES'>('CAMERA');
  
  // Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Sound feedback
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Scanned / Selected Member
  const [scannedCode, setScannedCode] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);

  // Quick Book Action in Member Session
  const [bookAccessionInput, setBookAccessionInput] = useState<string>('');
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Session Activity History
  const [scanHistory, setScanHistory] = useState<Array<{
    id: string;
    timestamp: string;
    type: 'SCAN' | 'CHECKIN' | 'CHECKOUT' | 'RENEW';
    detail: string;
    status: 'SUCCESS' | 'WARNING';
  }>>([]);

  // Fullscreen / Expanded View
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [previewQrMember, setPreviewQrMember] = useState<UserProfile | null>(null);

  // Audio Beeper using Web Audio API
  const playBeep = useCallback((type: 'SUCCESS' | 'ERROR' | 'CHECKIN' = 'SUCCESS') => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'SUCCESS') {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // A6
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'CHECKIN') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  }, [soundEnabled]);

  // Handle Finding Member by Scanned QR Payload
  const processQrPayload = useCallback((rawPayload: string) => {
    const trimmed = rawPayload.trim();
    if (!trimmed) return;

    let memberCode = trimmed;
    // Handle JSON QR codes (e.g. {"memberCode": "STU-2024-001"} or {"id": "..."})
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        memberCode = parsed.memberCode || parsed.code || parsed.memberId || parsed.id || trimmed;
      } catch {
        // use as string
      }
    }

    // 1. Try finding matching member by memberCode, id, email, qrCodeData, or rfidTag
    const foundMember = users.find(u =>
      u.memberCode.toLowerCase() === memberCode.toLowerCase() ||
      u.id.toLowerCase() === memberCode.toLowerCase() ||
      u.email.toLowerCase() === memberCode.toLowerCase() ||
      (u.qrCodeData && u.qrCodeData.toLowerCase() === memberCode.toLowerCase()) ||
      (u.rfidTag && u.rfidTag.toLowerCase() === memberCode.toLowerCase())
    );

    if (foundMember) {
      playBeep('SUCCESS');
      setSelectedMember(foundMember);
      setScannedCode(memberCode);
      setScanSuccessMessage(`Verified Member: ${foundMember.name} (${foundMember.memberCode})`);
      setScanHistory(prev => [
        {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          type: 'SCAN',
          detail: `Scanned Member: ${foundMember.name} [${foundMember.memberCode}]`,
          status: 'SUCCESS'
        },
        ...prev.slice(0, 19)
      ]);
      return;
    }

    // 2. Try finding matching Book by ISBN, Accession, ID, or Barcode
    const cleanCode = memberCode.replace(/[*#]/g, '').trim();
    const foundBook = books.find(b =>
      (b.accessionNumber && b.accessionNumber.toLowerCase() === cleanCode.toLowerCase()) ||
      (b.isbn && b.isbn.replace(/[- ]/g, '').toLowerCase() === cleanCode.replace(/[- ]/g, '').toLowerCase()) ||
      b.id.toLowerCase() === cleanCode.toLowerCase()
    );

    // Also check active transactions for this accession/barcode
    const activeTx = transactions.find(t =>
      (t.accessionNumber && t.accessionNumber.toLowerCase() === cleanCode.toLowerCase()) ||
      (t.copyBarcode && t.copyBarcode.toLowerCase() === cleanCode.toLowerCase())
    );

    if (foundBook || activeTx) {
      playBeep('SUCCESS');
      const bookTitle = foundBook?.title || activeTx?.bookTitle || 'Library Book Item';
      const accessionStr = foundBook?.accessionNumber || activeTx?.accessionNumber || cleanCode;

      // If a member is already in session, automatically process Book Issue / Return for this member!
      if (selectedMember) {
        // Check if member already has this book borrowed (return it)
        const borrowedMatch = transactions.find(
          t => (t.memberId === selectedMember.id || t.memberCode === selectedMember.memberCode) &&
               t.status !== 'RETURNED' &&
               ((t.accessionNumber && t.accessionNumber.toLowerCase() === accessionStr.toLowerCase()) ||
                (t.copyBarcode && t.copyBarcode.toLowerCase() === accessionStr.toLowerCase()))
        );

        if (borrowedMatch) {
          onReturnBook(borrowedMatch.id);
          playBeep('CHECKIN');
          setActionSuccessNotice(`Checked in returned item: "${bookTitle}"`);
          setScanHistory(prev => [
            {
              id: Math.random().toString(),
              timestamp: new Date().toLocaleTimeString(),
              type: 'CHECKIN',
              detail: `Auto Check-in: "${bookTitle}" [${accessionStr}] for ${selectedMember.name}`,
              status: 'SUCCESS'
            },
            ...prev.slice(0, 19)
          ]);
        } else {
          // Issue book to this member
          onIssueBook(accessionStr, selectedMember.memberCode || selectedMember.id);
          playBeep('SUCCESS');
          setActionSuccessNotice(`Issued item: "${bookTitle}" to ${selectedMember.name}`);
          setScanHistory(prev => [
            {
              id: Math.random().toString(),
              timestamp: new Date().toLocaleTimeString(),
              type: 'CHECKOUT',
              detail: `Auto Issue: "${bookTitle}" [${accessionStr}] to ${selectedMember.name}`,
              status: 'SUCCESS'
            },
            ...prev.slice(0, 19)
          ]);
        }
      } else {
        // No member selected yet: Show book status notice and fill accession box
        setBookAccessionInput(accessionStr);
        setScanSuccessMessage(`Scanned Book: "${bookTitle}" (Acc: ${accessionStr})`);
        setScanHistory(prev => [
          {
            id: Math.random().toString(),
            timestamp: new Date().toLocaleTimeString(),
            type: 'SCAN',
            detail: `Scanned Book: "${bookTitle}" [${accessionStr}] - Status: ${activeTx && activeTx.status !== 'RETURNED' ? `ON LOAN to ${activeTx.memberName}` : 'AVAILABLE ON SHELF'}`,
            status: 'SUCCESS'
          },
          ...prev.slice(0, 19)
        ]);
      }
      return;
    }

    // 3. Fallback if not found
    playBeep('ERROR');
    setScanSuccessMessage(null);
    setScanHistory(prev => [
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'SCAN',
        detail: `Barcode/RFID not found in database: "${memberCode}"`,
        status: 'WARNING'
      },
      ...prev.slice(0, 19)
    ]);
    alert(`No matching Patron or Catalog Item found for Barcode / RFID: "${memberCode}". Please verify code in cataloguing records.`);
  }, [users, books, transactions, selectedMember, onIssueBook, onReturnBook, playBeep]);

  // Start Camera Stream
  const startCamera = useCallback(async (deviceId?: string) => {
    setCameraError(null);
    try {
      // Check if mediaDevices API is supported
      if (!navigator?.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraActive(false);
        setCameraError('Camera access is not supported by your browser or environment. Please use image upload or manual scanner.');
        return;
      }

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
      }

      // Check for torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : ({} as any);
        if ('torch' in capabilities) {
          setHasTorch(true);
        }
      }

      // Enumerate camera devices for selection
      if (navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setCameraDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      }
    } catch (err: any) {
      console.warn('Camera initialization notice:', err?.name || err?.message || err);
      setCameraActive(false);
      setCameraError(
        err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')
          ? 'Camera permission denied or camera unavailable in this preview. You can use USB/Manual Barcode input, image upload, or sample member profiles below.'
          : `Camera notice: ${err?.message || 'Could not access video feed'}. Please use manual search or image upload.`
      );
    }
  }, [selectedDeviceId]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  }, []);

  // Toggle Torch / Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const next = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: next }]
        });
        setTorchOn(next);
      } catch (e) {
        console.error('Failed to toggle torch:', e);
      }
    }
  };

  // Continuous Camera Frame Processing Loop
  useEffect(() => {
    let lastScanTime = 0;

    const scanFrame = () => {
      if (!cameraActive || !videoRef.current || !canvasRef.current) {
        animFrameIdRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const now = Date.now();
          // Rate limit scanning to once every 200ms for smooth performance
          if (now - lastScanTime > 200) {
            lastScanTime = now;
            try {
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert'
              });

              if (qrCode && qrCode.data) {
                processQrPayload(qrCode.data);
              }
            } catch (err) {
              console.error('Frame decode error:', err);
            }
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(scanFrame);
    };

    if (scanMode === 'CAMERA' && cameraActive) {
      animFrameIdRef.current = requestAnimationFrame(scanFrame);
    }

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [cameraActive, scanMode, processQrPayload]);

  // Handle Mode Change (start/stop camera)
  useEffect(() => {
    if (scanMode === 'CAMERA') {
      startCamera(selectedDeviceId);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scanMode, startCamera, stopCamera, selectedDeviceId]);

  // Handle Image File Upload Decode
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
          if (qrCode && qrCode.data) {
            processQrPayload(qrCode.data);
          } else {
            playBeep('ERROR');
            alert('No valid QR code detected in the uploaded image. Please try another image with good lighting and contrast.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Get active loans for the selected member
  const memberActiveLoans = selectedMember
    ? transactions.filter(t => (t.memberId === selectedMember.id || t.memberCode === selectedMember.memberCode) && t.status !== 'RETURNED')
    : [];

  const memberOverdueLoans = memberActiveLoans.filter(t => {
    if (t.status === 'OVERDUE') return true;
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  });

  // 1-Click Check-In Single Book
  const handleCheckInItem = (transactionId: string, bookTitle: string) => {
    onReturnBook(transactionId);
    playBeep('CHECKIN');
    setActionSuccessNotice(`Checked in: "${bookTitle}"`);
    setScanHistory(prev => [
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'CHECKIN',
        detail: `Returned "${bookTitle}" for ${selectedMember?.name || 'Member'}`,
        status: 'SUCCESS'
      },
      ...prev.slice(0, 19)
    ]);
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  // 1-Click Batch Check-In All Active Books for this member
  const handleBatchCheckInAll = () => {
    if (memberActiveLoans.length === 0) return;
    if (confirm(`Check-in all ${memberActiveLoans.length} borrowed book(s) for ${selectedMember?.name}?`)) {
      memberActiveLoans.forEach(t => {
        onReturnBook(t.id);
      });
      playBeep('CHECKIN');
      setActionSuccessNotice(`Successfully checked in all ${memberActiveLoans.length} item(s)!`);
      setScanHistory(prev => [
        {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          type: 'CHECKIN',
          detail: `Batch Return: ${memberActiveLoans.length} books returned for ${selectedMember?.name}`,
          status: 'SUCCESS'
        },
        ...prev.slice(0, 19)
      ]);
      setTimeout(() => setActionSuccessNotice(null), 4000);
    }
  };

  // Rapid Accession Barcode Action (Check-in or Check-out)
  const handleAccessionAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookAccessionInput.trim() || !selectedMember) return;
    const accession = bookAccessionInput.trim();

    // Check if this accession matches an active loan of this member (meaning they are returning it!)
    const activeLoanMatch = memberActiveLoans.find(
      t => t.accessionNumber?.toLowerCase() === accession.toLowerCase() ||
           t.copyBarcode?.toLowerCase() === accession.toLowerCase()
    );

    if (activeLoanMatch) {
      // Process Return
      handleCheckInItem(activeLoanMatch.id, activeLoanMatch.bookTitle);
    } else {
      // Process Issue / Checkout
      onIssueBook(accession, selectedMember.memberCode || selectedMember.id);
      playBeep('SUCCESS');
      setActionSuccessNotice(`Issued item "${accession}" to ${selectedMember.name}`);
      setScanHistory(prev => [
        {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          type: 'CHECKOUT',
          detail: `Issued "${accession}" to ${selectedMember.name}`,
          status: 'SUCCESS'
        },
        ...prev.slice(0, 19)
      ]);
    }
    setBookAccessionInput('');
  };

  // Render Member QR Matrix SVG
  const renderQrSvg = (code: string) => {
    const matrix = generateQrMatrix(code);
    const cellSize = 5;
    const size = matrix.length * cellSize;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="bg-white p-1 rounded-lg">
        {matrix.map((row, r) =>
          row.map((cell, c) => (
            cell ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#000000"
              />
            ) : null
          ))
        )}
      </svg>
    );
  };

  return (
    <div
      className={`rounded-2xl border border-emerald-500/30 bg-[#121214] text-xs shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-y-auto bg-[#0d0d0f] p-6' : 'p-5 space-y-5'
      }`}
    >
      {/* Hidden offscreen canvas for frame analysis */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a] pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <QrCode className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <span>Member QR Code Scanner & Fast Check-In Terminal</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                v3.0 Live Scan
              </span>
            </div>
            <p className="text-[11px] text-[#a1a1aa] mt-0.5">
              Scan member cards or digital mobile passes via camera/scanner gun to load borrower loans and process instant 1-click book check-ins.
            </p>
          </div>
        </div>

        {/* Action Controls & Sound Toggle */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Beep Feedback' : 'Enable Beep Feedback'}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                : 'bg-[#09090b] text-[#71717a] border-[#27272a]'
            }`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Scanner'}
            className="p-2 rounded-xl bg-[#09090b] border border-[#27272a] text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#09090b] border border-[#27272a] text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Scanner Viewport (Left 5/12) + Member Active Account Desk (Right 7/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Scanner Source Tabs & Video / Input Box */}
        <div className="lg:col-span-5 space-y-3">
          
          {/* Scanner Mode Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#09090b] border border-[#27272a]">
            <button
              type="button"
              onClick={() => setScanMode('CAMERA')}
              className={`py-1.5 px-2 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                scanMode === 'CAMERA'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
            >
              <Camera className="h-3 w-3" />
              <span>Camera</span>
            </button>

            <button
              type="button"
              onClick={() => setScanMode('UPLOAD')}
              className={`py-1.5 px-2 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                scanMode === 'UPLOAD'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
            >
              <Upload className="h-3 w-3" />
              <span>Photo</span>
            </button>

            <button
              type="button"
              onClick={() => setScanMode('MANUAL')}
              className={`py-1.5 px-2 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                scanMode === 'MANUAL'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
            >
              <Zap className="h-3 w-3" />
              <span>Gun/Code</span>
            </button>

            <button
              type="button"
              onClick={() => setScanMode('SAMPLES')}
              className={`py-1.5 px-2 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                scanMode === 'SAMPLES'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
            >
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>Test QRs</span>
            </button>
          </div>

          {/* Mode 1: Live Video Camera Feed */}
          {scanMode === 'CAMERA' && (
            <div className="relative rounded-2xl overflow-hidden border border-[#27272a] bg-black aspect-video flex items-center justify-center group shadow-inner">
              {/* Video Element */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />

              {/* Scanning Target Overlay */}
              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-emerald-400/80 rounded-2xl shadow-2xl flex items-center justify-center">
                    {/* Targeting Corner Marks */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                    {/* Animated Scanning Laser Line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-pulse" />
                    
                    {/* Central Target Crosshair */}
                    <div className="absolute w-2 h-2 rounded-full bg-emerald-400/60" />
                  </div>
                  
                  <span className="mt-3 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                    Align Member QR Code in Box
                  </span>
                </div>
              )}

              {/* Camera Error Display */}
              {cameraError && (
                <div className="absolute inset-0 bg-black/95 p-5 flex flex-col items-center justify-center text-center space-y-3 z-10">
                  <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <AlertCircle className="h-7 w-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">Camera Standby / Permission Notice</h4>
                    <p className="text-[11px] text-zinc-300 max-w-sm leading-relaxed">{cameraError}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setScanMode('MANUAL')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-md"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>⚡ USB / Manual Input</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScanMode('UPLOAD')}
                      className="px-3 py-1.5 rounded-xl bg-[#18181b] hover:bg-[#27272a] text-zinc-200 text-xs cursor-pointer border border-[#27272a] flex items-center space-x-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload QR Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScanMode('SAMPLES')}
                      className="px-3 py-1.5 rounded-xl bg-[#18181b] hover:bg-[#27272a] text-zinc-200 text-xs cursor-pointer border border-[#27272a] flex items-center space-x-1.5"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>Pick Sample Member</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => startCamera(selectedDeviceId)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs flex items-center space-x-1 cursor-pointer"
                      title="Retry requesting camera access"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Retry Camera</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Camera Control Bar: Device Switch & Torch */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-auto bg-black/60 backdrop-blur-sm p-1.5 rounded-xl border border-white/10 text-[10px]">
                {cameraDevices.length > 1 ? (
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => {
                      setSelectedDeviceId(e.target.value);
                      startCamera(e.target.value);
                    }}
                    className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-2 py-1 text-[10px] focus:outline-none max-w-[140px] truncate"
                  >
                    {cameraDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-zinc-400 font-mono text-[10px] px-1 flex items-center space-x-1">
                    <Camera className="h-3 w-3 text-emerald-400" />
                    <span>Live Scanner Ready</span>
                  </span>
                )}

                <div className="flex items-center space-x-1">
                  {hasTorch && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors ${
                        torchOn
                          ? 'bg-amber-500 text-black border-amber-400'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      <Lightbulb className="h-3 w-3" />
                      <span>{torchOn ? 'Torch ON' : 'Torch'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => startCamera(selectedDeviceId)}
                    className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white cursor-pointer"
                    title="Restart Stream"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Photo / Image File Upload */}
          {scanMode === 'UPLOAD' && (
            <div className="p-6 rounded-2xl border-2 border-dashed border-[#27272a] bg-[#09090b] hover:border-emerald-500/50 transition-colors text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <div className="font-bold text-white text-xs">Upload Member QR Code Image</div>
                <p className="text-[11px] text-[#a1a1aa] mt-0.5">
                  Select or drag & drop a snapshot, screenshot, or digital card image
                </p>
              </div>
              <label className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-emerald-500/20 transition-all">
                <Upload className="h-3.5 w-3.5" />
                <span>Browse Image File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Mode 3: Manual Code / USB Wedge Scanner */}
          {scanMode === 'MANUAL' && (
            <div className="p-4 rounded-2xl border border-[#27272a] bg-[#09090b] space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                <Zap className="h-4 w-4" />
                <span>Handheld Barcode / QR Scanner Input</span>
              </div>
              <p className="text-[11px] text-[#a1a1aa]">
                Connect any standard USB/Bluetooth 2D barcode scanner or manually type member code.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualCodeInput.trim()) {
                    processQrPayload(manualCodeInput.trim());
                    setManualCodeInput('');
                  }
                }}
                className="flex space-x-2"
              >
                <input
                  type="text"
                  autoFocus
                  placeholder="Scan QR or type STU-2024-001..."
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  className="flex-1 rounded-xl border border-[#27272a] bg-[#121214] px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Lookup
                </button>
              </form>
            </div>
          )}

          {/* Mode 4: Quick Member QR Chips for Testing & Simulation */}
          {scanMode === 'SAMPLES' && (
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-[#09090b] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Instant Test Member Profiles ({users.length})</span>
                </span>
                <span className="text-[10px] text-[#71717a]">Click to simulate scan</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {users.map((u) => {
                  const activeLoanCount = transactions.filter(t => (t.memberId === u.id || t.memberCode === u.memberCode) && t.status !== 'RETURNED').length;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => processQrPayload(u.memberCode)}
                      className="p-2 rounded-xl border border-[#27272a] hover:border-emerald-500/60 bg-[#121214] text-left flex items-center space-x-2.5 transition-all cursor-pointer group"
                    >
                      <img
                        src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover border border-emerald-500/30"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white truncate group-hover:text-emerald-400 transition-colors text-[11px]">
                          {u.name}
                        </div>
                        <div className="text-[9px] text-[#a1a1aa] font-mono truncate">
                          {u.memberCode} • <span className="text-emerald-400 font-bold">{activeLoanCount} loan(s)</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scanner Feedback Notification */}
          {scanSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center space-x-2 animate-fadeIn">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="font-medium text-xs truncate">{scanSuccessMessage}</span>
            </div>
          )}

          {actionSuccessNotice && (
            <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/40 text-blue-300 flex items-center space-x-2 animate-fadeIn">
              <Check className="h-4 w-4 shrink-0 text-blue-400" />
              <span className="font-medium text-xs truncate">{actionSuccessNotice}</span>
            </div>
          )}
        </div>

        {/* Right Column: Active Borrower Desk & 1-Click Return / Issue Interface */}
        <div className="lg:col-span-7 space-y-4">
          
          {selectedMember ? (
            <div className="p-5 rounded-2xl border border-emerald-500/30 bg-[#09090b] space-y-4 shadow-xl">
              
              {/* Member Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a] pb-4">
                <div className="flex items-center space-x-3.5">
                  <img
                    src={selectedMember.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={selectedMember.name}
                    className="w-13 h-13 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white">{selectedMember.name}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                        {selectedMember.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#a1a1aa] font-mono mt-0.5 flex items-center space-x-2">
                      <span>ID: <strong className="text-white">{selectedMember.memberCode}</strong></span>
                      <span>•</span>
                      <span>{selectedMember.department || 'Library Member'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPreviewQrMember(selectedMember)}
                    className="px-3 py-1.5 rounded-xl bg-[#121214] border border-[#27272a] hover:border-emerald-500/40 text-[#a1a1aa] hover:text-white text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <QrCode className="h-3.5 w-3.5 text-emerald-400" />
                    <span>View QR Pass</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMember(null);
                      setScannedCode('');
                      setScanSuccessMessage(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#121214] border border-[#27272a] hover:bg-zinc-800 text-[#a1a1aa] hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Clear Session
                  </button>
                </div>
              </div>

              {/* Member Loan Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#121214] border border-[#27272a] space-y-0.5">
                  <span className="text-[10px] uppercase font-mono text-[#a1a1aa]">Active Checked Out</span>
                  <div className="text-lg font-bold text-white font-mono flex items-center space-x-1.5">
                    <BookOpen className="h-4 w-4 text-blue-400" />
                    <span>{memberActiveLoans.length}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#121214] border border-[#27272a] space-y-0.5">
                  <span className="text-[10px] uppercase font-mono text-red-400">Overdue Items</span>
                  <div className="text-lg font-bold text-red-400 font-mono flex items-center space-x-1.5">
                    <Clock className="h-4 w-4 text-red-400" />
                    <span>{memberOverdueLoans.length}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#121214] border border-[#27272a] space-y-0.5">
                  <span className="text-[10px] uppercase font-mono text-emerald-400">Account Status</span>
                  <div className="text-sm font-bold text-emerald-400 flex items-center space-x-1">
                    <ShieldCheck className="h-4 w-4" />
                    <span>{selectedMember.status}</span>
                  </div>
                </div>
              </div>

              {/* Active Borrowed Books List & 1-Click Check-In Actions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h5 className="font-bold text-white text-xs">Currently Borrowed Books ({memberActiveLoans.length})</h5>
                    {memberOverdueLoans.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-mono font-bold">
                        {memberOverdueLoans.length} OVERDUE
                      </span>
                    )}
                  </div>

                  {memberActiveLoans.length > 0 && (
                    <button
                      type="button"
                      onClick={handleBatchCheckInAll}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>⚡ Check-In All ({memberActiveLoans.length})</span>
                    </button>
                  )}
                </div>

                {memberActiveLoans.length === 0 ? (
                  <div className="p-6 rounded-xl border border-[#27272a] bg-[#121214] text-center text-[#a1a1aa] space-y-1">
                    <CheckCircle2 className="h-7 w-7 text-emerald-400 mx-auto" />
                    <p className="font-bold text-white text-xs">All Clear! No Active Books Checked Out</p>
                    <p className="text-[11px]">This member currently has 0 active loans on their library card.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {memberActiveLoans.map((loan) => {
                      const isOver = loan.status === 'OVERDUE' || (loan.dueDate && new Date(loan.dueDate) < new Date());
                      return (
                        <div
                          key={loan.id}
                          className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                            isOver
                              ? 'border-red-500/40 bg-red-500/10'
                              : 'border-[#27272a] bg-[#121214]'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0 pr-2">
                            <div className="font-bold text-white text-xs truncate flex items-center space-x-1.5">
                              <span>{loan.bookTitle}</span>
                              {isOver && (
                                <span className="px-1.5 py-0.2 rounded bg-red-500/30 text-red-300 text-[9px] font-mono font-bold">
                                  OVERDUE
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#a1a1aa] font-mono flex items-center space-x-2">
                              <span>Acc: <strong className="text-zinc-300">{loan.accessionNumber || loan.copyBarcode || 'ACC-88001'}</strong></span>
                              <span>•</span>
                              <span>Due: <strong className={isOver ? 'text-red-400' : 'text-zinc-300'}>{loan.dueDate}</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            {onRenewBook && !isOver && (
                              <button
                                type="button"
                                onClick={() => {
                                  onRenewBook(loan.id);
                                  playBeep('SUCCESS');
                                  setActionSuccessNotice(`Renewed "${loan.bookTitle}"`);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold cursor-pointer transition-colors"
                              >
                                Renew
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleCheckInItem(loan.id, loan.bookTitle)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer shadow-md transition-all"
                            >
                              <CornerDownLeft className="h-3 w-3" />
                              <span>Check-In</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Fast Book Accession Barcode Bar (Scan Book to Check-in / Issue) */}
              <div className="pt-2 border-t border-[#27272a] space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-zinc-300 flex items-center space-x-1">
                    <Zap className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Scan Book Accession Barcode (Check-In or Issue)</span>
                  </span>
                </div>

                <form onSubmit={handleAccessionAction} className="flex space-x-2">
                  <input
                    type="text"
                    value={bookAccessionInput}
                    onChange={(e) => setBookAccessionInput(e.target.value)}
                    placeholder="Scan or enter book barcode (e.g. ACC-88001)..."
                    className="flex-1 rounded-xl border border-[#27272a] bg-[#121214] px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all"
                  >
                    Process
                  </button>
                </form>
              </div>

            </div>
          ) : (
            /* Empty State when no member scanned yet */
            <div className="p-8 rounded-2xl border border-[#27272a] bg-[#09090b] text-center space-y-4 flex flex-col items-center justify-center min-h-[300px]">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-bounce">
                <QrCode className="h-10 w-10" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="font-bold text-white text-sm">Ready to Scan Member QR Code</h4>
                <p className="text-xs text-[#a1a1aa]">
                  Point camera at patron's physical member card or digital phone QR pass to load active loans, compute overdue status, and perform instant check-ins.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScanMode('SAMPLES')}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold cursor-pointer border border-[#27272a] transition-colors"
                >
                  ✨ Select Test Member
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('CAMERA')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold cursor-pointer hover:bg-emerald-600/30 transition-colors"
                >
                  📷 Activate Camera
                </button>
              </div>
            </div>
          )}

          {/* Real-time Session Activity & Check-in Audit Trail */}
          <div className="p-4 rounded-2xl border border-[#27272a] bg-[#09090b] space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-mono font-bold text-[#a1a1aa] uppercase flex items-center space-x-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                <span>Live Scanner Session Log ({scanHistory.length})</span>
              </span>
              {scanHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => setScanHistory([])}
                  className="text-[#71717a] hover:text-white text-[10px] cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-28 overflow-y-auto font-mono text-[10px]">
              {scanHistory.length === 0 ? (
                <div className="text-[#71717a] italic p-1">No scan events recorded yet in this active session.</div>
              ) : (
                scanHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-[#121214] border border-[#27272a]/60 text-zinc-300"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="text-[#71717a]">[{item.timestamp}]</span>
                      <span
                        className={`font-bold px-1 rounded text-[9px] ${
                          item.type === 'CHECKIN'
                            ? 'bg-blue-500/20 text-blue-400'
                            : item.type === 'CHECKOUT'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="truncate">{item.detail}</span>
                    </div>
                    <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 ml-1" />
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Member QR Pass Modal / Digital ID Card Popup */}
      {previewQrMember && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#121214] border border-emerald-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                <ShieldCheck className="h-4 w-4" />
                <span>Digital Library Pass QR</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewQrMember(null)}
                className="p-1 rounded-lg text-[#a1a1aa] hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white flex items-center justify-center shadow-lg">
              {renderQrSvg(previewQrMember.memberCode)}
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">{previewQrMember.name}</h4>
              <p className="text-xs text-emerald-400 font-mono font-bold">{previewQrMember.memberCode}</p>
              <p className="text-[11px] text-[#a1a1aa]">{previewQrMember.role} • {previewQrMember.department || 'Main Campus'}</p>
            </div>

            <div className="p-2 rounded-xl bg-[#09090b] border border-[#27272a] text-[10px] text-zinc-400 font-mono">
              Scan this code using another device or the scanner above to instantly test recognition.
            </div>

            <button
              type="button"
              onClick={() => setPreviewQrMember(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
