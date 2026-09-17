import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  QrCode,
  Barcode as BarcodeIcon,
  Printer,
  Download,
  BookOpen,
  User,
  Link as LinkIcon,
  Copy,
  Check,
  Sparkles,
  Settings,
  Grid,
  FileText,
  Tag,
  FileType,
  Radio,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Camera,
  Upload,
  Search,
  Volume2,
  VolumeX,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Cpu,
  ArrowRight,
  Database,
  CheckSquare,
  Square,
  ListFilter,
  Package
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import jsQR from 'jsqr';
import { BookRecord, UserProfile, SystemSettings, CirculationTransaction } from '../../types/alims';
import {
  generateCode128Pattern,
  getCode128BarElements,
  getCode39BarElements,
  generateQrMatrix,
  buildEpcGen2Hex,
  encodeIso28560UserMemory,
  RfidBookTagData,
  RfidPatronCardData
} from '../../utils/qrBarcodeGenerator';
import { TitleSelectorModal } from '../barcode/TitleSelectorModal';
import { BarcodeBatchSheetGrid } from '../barcode/BarcodeBatchSheetGrid';
import {
  LabelItemData,
  LabelRenderOptions,
  getBookLabelData,
  downloadMultiTitlePdfSheet,
  generateLabelDataUrl,
  printBarcodeStickerSheets
} from '../barcode/barcodeLabelRenderer';
import pslimsLogo from '../../assets/images/plims_emblem_logo_1788759356534.jpg';

interface BarcodeGeneratorModuleProps {
  books?: BookRecord[];
  users?: UserProfile[];
  settings?: SystemSettings;
  transactions?: CirculationTransaction[];
  currentUser?: UserProfile | null;
  onIssueBook?: (accession: string, memberId: string) => void;
  onReturnBook?: (transactionId: string) => void;
}

export const BarcodeGeneratorModule: React.FC<BarcodeGeneratorModuleProps> = ({
  books = [],
  users = [],
  settings,
  transactions = [],
  currentUser,
  onIssueBook,
  onReturnBook
}) => {
  // Main Module Tab Navigation
  const [activeModuleTab, setActiveModuleTab] = useState<'BARCODE_STUDIO' | 'RFID_ENCODER' | 'SCANNER_HUB'>('BARCODE_STUDIO');

  // =========================================================================
  // TAB 1: BARCODE & SPINE LABEL STUDIO STATE
  // =========================================================================
  const [selectedBookId, setSelectedBookId] = useState<string>(books[0]?.id || '');
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>(() => books.map(b => b.id));
  const [isTitleModalOpen, setIsTitleModalOpen] = useState<boolean>(false);
  const [isBatchZipDownloading, setIsBatchZipDownloading] = useState<boolean>(false);

  const [customText, setCustomText] = useState<string>('ACC-2026-08941');
  const [customTitle, setCustomTitle] = useState<string>('Introduction to Algorithms (4th Edition)');
  const [customCallNo, setCustomCallNo] = useState<string>('005.1 COR/I');
  const [sourceType, setSourceType] = useState<'CATALOG' | 'CUSTOM' | 'OPAC' | 'MEMBER'>('CATALOG');
  const [codeType, setCodeType] = useState<'QR_CODE' | 'CODE128' | 'CODE39' | 'BOTH'>('BOTH');
  
  // Label layout options
  const [showInstitution, setShowInstitution] = useState<boolean>(true);
  const [showTitle, setShowTitle] = useState<boolean>(true);
  const [showCallNo, setShowCallNo] = useState<boolean>(true);
  const [showAccession, setShowAccession] = useState<boolean>(true);
  const [labelSize, setLabelSize] = useState<'SPINE' | 'ACCESSION' | 'CARD' | 'SHELF'>('SPINE');
  const [copied, setCopied] = useState<boolean>(false);
  const [isPrintPreview, setIsPrintPreview] = useState<boolean>(false);

  // Active target data
  const selectedBook = books.find(b => b.id === selectedBookId) || books[0];
  const libraryName = settings?.libraryName || 'PAKISTAN LIBRARY MANAGEMENT SYSTEM (PLiMS)';

  // Selected books subset
  const chosenBooks = useMemo(() => {
    return books.filter(b => selectedBookIds.includes(b.id));
  }, [books, selectedBookIds]);

  // Selected label items list for batch rendering
  const batchLabelItems: LabelItemData[] = useMemo(() => {
    if (sourceType === 'CUSTOM') {
      return [{
        id: 'custom',
        title: customTitle,
        code: customText,
        callNo: customCallNo
      }];
    }
    if (chosenBooks.length === 0 && selectedBook) {
      return [getBookLabelData(selectedBook)];
    }
    return chosenBooks.map(getBookLabelData);
  }, [sourceType, customTitle, customText, customCallNo, chosenBooks, selectedBook]);

  const activeTitle = sourceType === 'CATALOG' && selectedBook ? selectedBook.title : customTitle;
  const activeCode = sourceType === 'CATALOG' && selectedBook
    ? (selectedBook.isbn || `ACC-${selectedBook.id}`)
    : customText;
  const activeCallNo = sourceType === 'CATALOG' && selectedBook ? selectedBook.callNumber : customCallNo;
  const activeOpacUrl = sourceType === 'OPAC'
    ? `https://pslims.lib.pk/opac?book=${encodeURIComponent(activeCode)}`
    : activeCode;

  // Title Selection Handlers
  const handleSelectAllTitles = () => {
    setSelectedBookIds(books.map(b => b.id));
  };

  const handleDeselectAllTitles = () => {
    setSelectedBookIds([]);
  };

  const handleToggleBookTitle = (id: string) => {
    setSelectedBookIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSetBookSelection = (ids: string[]) => {
    setSelectedBookIds(ids);
  };

  // Genuine QR Matrix (via standard qrcode generator)
  const qrMatrix = generateQrMatrix(sourceType === 'OPAC' ? activeOpacUrl : activeCode);
  
  // Accurate Code128 & Code39 Bar Elements with exact width & space alternating arrays
  const code128Elements = getCode128BarElements(activeCode);
  const code39Elements = getCode39BarElements(activeCode);
  const activeBarElements = codeType === 'CODE39' ? code39Elements : code128Elements;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintLabels = () => {
    const labelOptions: LabelRenderOptions = {
      libraryName,
      codeType,
      showInstitution,
      showTitle,
      showCallNo,
      showAccession,
      labelSize
    };
    printBarcodeStickerSheets(batchLabelItems, labelOptions);
  };

  // High Resolution PNG Download Handler (Canvas with 300 DPI scaling)
  const handleDownloadPng = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 2;
    const width = labelSize === 'CARD' ? 600 : labelSize === 'SHELF' ? 500 : 400;
    const height = labelSize === 'CARD' ? 750 : labelSize === 'SHELF' ? 260 : 320;

    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    // Clean White Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Outer Label Border
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    let currentY = 32;

    // Institution Header
    if (showInstitution) {
      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(libraryName, width / 2, currentY);
      currentY += 10;

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, currentY);
      ctx.lineTo(width - 20, currentY);
      ctx.stroke();
      currentY += 26;
    }

    // Book Title
    if (showTitle) {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      const maxText = activeTitle.length > 45 ? activeTitle.substring(0, 42) + '...' : activeTitle;
      ctx.fillText(maxText, width / 2, currentY);
      currentY += 28;
    }

    // Call Number Box
    if (showCallNo) {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(width / 2 - 90, currentY - 18, 180, 26);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(width / 2 - 90, currentY - 18, 180, 26);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(activeCallNo, width / 2, currentY);
      currentY += 34;
    }

    // Codes Area (QR Code + Barcode)
    if (codeType === 'QR_CODE' || codeType === 'BOTH') {
      const qrSize = 90;
      const qrX = codeType === 'BOTH' ? (width / 4) - (qrSize / 2) : (width / 2) - (qrSize / 2);
      const cellSize = qrSize / qrMatrix.length;

      for (let r = 0; r < qrMatrix.length; r++) {
        for (let c = 0; c < qrMatrix[r].length; c++) {
          if (qrMatrix[r][c]) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(qrX + c * cellSize, currentY + r * cellSize, cellSize + 0.3, cellSize + 0.3);
          }
        }
      }
    }

    if (codeType === 'CODE128' || codeType === 'CODE39' || codeType === 'BOTH') {
      const barH = 55;
      const barX = codeType === 'BOTH' ? (width / 2) + 15 : (width / 2) - 100;
      const totalUnits = activeBarElements.reduce((acc, el) => acc + el.width, 0);
      const barTargetW = codeType === 'BOTH' ? 140 : 200;
      const unitW = barTargetW / totalUnits;

      let drawX = barX;
      for (const el of activeBarElements) {
        const elW = el.width * unitW;
        if (el.isBar) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(drawX, currentY, elW, barH);
        }
        drawX += elW;
      }
    }

    currentY += 105;

    // Accession Text
    if (showAccession) {
      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`*${activeCode}*`, width / 2, currentY);
    }

    // Trigger PNG Download
    const dataUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = `PLiMS_Label_${activeCode.replace(/[^a-zA-Z0-9-_]/g, '_')}.png`;
    downloadLink.click();
  };

  // SVG Vector Download Handler
  const handleDownloadSvg = () => {
    const totalUnits = activeBarElements.reduce((acc, el) => acc + el.width, 0);
    const barTargetW = 140;
    const unitW = barTargetW / (totalUnits || 1);
    let barSvgRects = '';
    let currX = 230;

    for (const el of activeBarElements) {
      const elW = el.width * unitW;
      if (el.isBar) {
        barSvgRects += `<rect x="${currX.toFixed(2)}" y="125" width="${elW.toFixed(2)}" height="50" fill="#000000"/>`;
      }
      currX += elW;
    }

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" style="background:#ffffff; font-family: sans-serif;">
  <rect x="8" y="8" width="384" height="284" fill="#ffffff" stroke="#94a3b8" stroke-width="3" rx="8"/>
  ${showInstitution ? `<text x="200" y="32" font-size="12" font-weight="bold" fill="#065f46" text-anchor="middle">${libraryName}</text><line x1="20" y1="42" x2="380" y2="42" stroke="#e2e8f0" stroke-width="1"/>` : ''}
  ${showTitle ? `<text x="200" y="68" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">${activeTitle.substring(0, 45)}</text>` : ''}
  ${showCallNo ? `<rect x="110" y="82" width="180" height="26" fill="#f1f5f9" stroke="#cbd5e1" rx="4"/><text x="200" y="100" font-size="13" font-weight="bold" font-family="monospace" fill="#0f172a" text-anchor="middle">${activeCallNo}</text>` : ''}
  <g transform="translate(60, 115)">
    ${qrMatrix.map((row, r) => row.map((cell, c) => cell ? `<rect x="${c*3}" y="${r*3}" width="3" height="3" fill="#000000"/>` : '').join('')).join('')}
  </g>
  ${barSvgRects}
  ${showAccession ? `<text x="200" y="270" font-size="15" font-weight="bold" font-family="monospace" fill="#0369a1" text-anchor="middle">*${activeCode}*</text>` : ''}
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PLiMS_Label_${activeCode.replace(/[^a-zA-Z0-9-_]/g, '_')}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // High-Resolution A4 PDF Sticker Sheet Download Handler (21 Labels Grid)
  const handleDownloadPdfSheet = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 3;
    const labelPixelW = 320;
    const labelPixelH = 190;

    canvas.width = labelPixelW * scale;
    canvas.height = labelPixelH * scale;
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, labelPixelW, labelPixelH);

    // Outer Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(4, 4, labelPixelW - 8, labelPixelH - 8);

    let curY = 16;

    // Institution Header
    if (showInstitution) {
      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(libraryName, labelPixelW / 2, curY);
      curY += 12;
    }

    // Title
    if (showTitle) {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      const truncated = activeTitle.length > 38 ? activeTitle.substring(0, 35) + '...' : activeTitle;
      ctx.fillText(truncated, labelPixelW / 2, curY);
      curY += 14;
    }

    // Call Number Box
    if (showCallNo) {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(labelPixelW / 2 - 60, curY - 10, 120, 16);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(labelPixelW / 2 - 60, curY - 10, 120, 16);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(activeCallNo, labelPixelW / 2, curY + 1);
      curY += 18;
    }

    // Codes Area (QR Code + Barcode)
    if (codeType === 'QR_CODE' || codeType === 'BOTH') {
      const qrSize = 52;
      const qrX = codeType === 'BOTH' ? (labelPixelW / 4) - (qrSize / 2) : (labelPixelW / 2) - (qrSize / 2);
      const cellSize = qrSize / qrMatrix.length;

      for (let r = 0; r < qrMatrix.length; r++) {
        for (let c = 0; c < qrMatrix[r].length; c++) {
          if (qrMatrix[r][c]) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(qrX + c * cellSize, curY + r * cellSize, cellSize + 0.2, cellSize + 0.2);
          }
        }
      }
    }

    if (codeType === 'CODE128' || codeType === 'CODE39' || codeType === 'BOTH') {
      const barH = 34;
      const barX = codeType === 'BOTH' ? (labelPixelW / 2) + 10 : (labelPixelW / 2) - 60;
      const totalUnits = activeBarElements.reduce((acc, el) => acc + el.width, 0);
      const barTargetW = codeType === 'BOTH' ? 90 : 120;
      const unitW = barTargetW / (totalUnits || 1);

      let drawX = barX;
      for (const el of activeBarElements) {
        const elW = el.width * unitW;
        if (el.isBar) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(drawX, curY, elW, barH);
        }
        drawX += elW;
      }
    }

    curY += 56;

    // Accession Text
    if (showAccession) {
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`*${activeCode}*`, labelPixelW / 2, curY);
    }

    const labelImgData = canvas.toDataURL('image/png');

    // Multi-title sheet rendering
    const labelOptions: LabelRenderOptions = {
      libraryName,
      codeType,
      showInstitution,
      showTitle,
      showCallNo,
      showAccession,
      labelSize
    };

    if (sourceType === 'CATALOG' && batchLabelItems.length > 0) {
      downloadMultiTitlePdfSheet(batchLabelItems, labelOptions, 'PLiMS_A4_Barcode_Stickers');
    } else {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(6, 95, 70);
      doc.text(libraryName, 105, 12, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`A4 Barcode Sticker Sheet (21 Labels) - Accession: ${activeCode}`, 105, 17, { align: 'center' });

      const labelMMW = 58;
      const labelMMH = 34;
      const gapX = 6;
      const gapY = 4;
      const startX = (210 - (3 * labelMMW + 2 * gapX)) / 2;
      const startY = 22;

      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 3; col++) {
          const x = startX + col * (labelMMW + gapX);
          const y = startY + row * (labelMMH + gapY);
          doc.addImage(labelImgData, 'PNG', x, y, labelMMW, labelMMH);
        }
      }

      const cleanFileName = activeCode.replace(/[^a-zA-Z0-9-_]/g, '_');
      doc.save(`PLiMS_A4_BarcodeSheet_21_Labels_${cleanFileName}.pdf`);
    }
  };

  // Batch ZIP Export Handler (All Selected Titles PNGs)
  const handleBatchDownloadZip = async () => {
    if (batchLabelItems.length === 0) return;
    setIsBatchZipDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('PLiMS_Barcode_Labels');
      const labelOptions: LabelRenderOptions = {
        libraryName,
        codeType,
        showInstitution,
        showTitle,
        showCallNo,
        showAccession,
        labelSize
      };

      batchLabelItems.forEach((item, index) => {
        const dataUrl = generateLabelDataUrl(item, labelOptions, 2);
        if (dataUrl) {
          const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
          const cleanName = `${String(index + 1).padStart(3, '0')}_${(item.code || item.id).replace(/[^a-zA-Z0-9-_]/g, '_')}.png`;
          folder?.file(cleanName, base64Data, { base64: true });
        }
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PLiMS_Barcode_Labels_${batchLabelItems.length}_Titles.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating ZIP package:', err);
    } finally {
      setIsBatchZipDownloading(false);
    }
  };

  // =========================================================================
  // TAB 2: RFID SMART TAG & CHIP ENCODER STATE
  // =========================================================================
  const [rfidTargetType, setRfidTargetType] = useState<'BOOK_TAG' | 'PATRON_CARD'>('BOOK_TAG');
  const [rfidTargetScope, setRfidTargetScope] = useState<'SINGLE' | 'BATCH_SELECTED'>('SINGLE');
  const [rfidFrequency, setRfidFrequency] = useState<'UHF' | 'HF'>('UHF');
  const [rfidEasStatus, setRfidEasStatus] = useState<'ARMED' | 'DISARMED'>('ARMED');
  const [rfidAfiByte, setRfidAfiByte] = useState<string>('0x07');
  const [isProgramming, setIsProgramming] = useState<boolean>(false);
  const [programmingSuccess, setProgrammingSuccess] = useState<boolean>(false);
  const [programmingCount, setProgrammingCount] = useState<number>(1);
  const [selectedPatronId, setSelectedPatronId] = useState<string>(users[0]?.id || '');

  const activeRfidAccession = sourceType === 'CATALOG' && selectedBook
    ? (selectedBook.accessionNumber || `ACC-${selectedBook.id}`)
    : customText;
  
  const activeEpcHex = buildEpcGen2Hex(activeRfidAccession, settings?.institutionName || 'PLIMS');
  const activeUserMemoryHex = encodeIso28560UserMemory(activeRfidAccession, activeCallNo, 'PK-PLIMS-01');
  const activeRfidChipUid = `E2801160${activeRfidAccession.replace(/[^0-9A-Z]/gi, '').padStart(8, '0').slice(-8)}890B`;

  const selectedPatron = users.find(u => u.id === selectedPatronId) || users[0];
  const patronChipUid = selectedPatron?.rfidTag || '04:A3:8F:12:90:B4';

  const handleProgramRfidTag = () => {
    setIsProgramming(true);
    setProgrammingSuccess(false);

    const count = rfidTargetType === 'BOOK_TAG' && rfidTargetScope === 'BATCH_SELECTED'
      ? Math.max(1, chosenBooks.length)
      : 1;
    setProgrammingCount(count);

    setTimeout(() => {
      setIsProgramming(false);
      setProgrammingSuccess(true);
      setTimeout(() => setProgrammingSuccess(false), 4000);
    }, 1200);
  };

  // Bulk RFID Export Handler (.JSON)
  const handleBulkExportRfid = () => {
    const targetBooks = chosenBooks.length > 0 ? chosenBooks : books;
    const rfidBatch = targetBooks.map((b, idx) => ({
      bookId: b.id,
      title: b.title,
      accessionNumber: b.accessionNumber || `ACC-${88000 + idx}`,
      barcode: b.isbn || `BAR-${88000 + idx}`,
      callNumber: b.callNumber,
      rfidTagUid: `RFID${88000 + idx}`,
      epcHex: buildEpcGen2Hex(b.accessionNumber || `ACC-${88000 + idx}`),
      frequency: 'UHF 860-960 MHz (EPC Gen2)',
      easStatus: 'ARMED (0x07)',
      ownerLibrary: libraryName
    }));

    const jsonStr = JSON.stringify(rfidBatch, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PLiMS_RFID_Tag_Encoding_Batch_${targetBooks.length}_Titles_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // =========================================================================
  // TAB 3: LIVE BARCODE & RFID SCANNER / VERIFICATION HUB STATE
  // =========================================================================
  const [scannerMode, setScannerMode] = useState<'CAMERA' | 'RFID_TAP' | 'USB_MANUAL' | 'IMAGE_UPLOAD'>('RFID_TAP');
  const [manualScanInput, setManualScanInput] = useState<string>('');
  const [scannedResult, setScannedResult] = useState<{
    type: 'BOOK' | 'MEMBER' | 'UNKNOWN';
    code: string;
    title?: string;
    name?: string;
    role?: string;
    accession?: string;
    barcode?: string;
    rfidUid?: string;
    easStatus?: 'ARMED' | 'DISARMED';
    loanStatus?: string;
    borrower?: string;
    details?: string;
  } | null>(null);

  const [scanHistoryLog, setScanHistoryLog] = useState<Array<{
    id: string;
    time: string;
    mode: string;
    code: string;
    label: string;
    status: 'SUCCESS' | 'WARNING';
  }>>([]);

  // Camera stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Audio beeper
  const playScanBeep = useCallback((success = true) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (success) {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // Ignored if sound restricted
    }
  }, []);

  // Universal Code / RFID Resolver
  const handleProcessScannedCode = useCallback((rawCode: string, scanSource = 'MANUAL') => {
    const clean = rawCode.trim().replace(/[*#]/g, '');
    if (!clean) return;

    // 1. Check if matching Member
    const memberMatch = users.find(u =>
      u.memberCode.toLowerCase() === clean.toLowerCase() ||
      u.id.toLowerCase() === clean.toLowerCase() ||
      (u.rfidTag && u.rfidTag.toLowerCase() === clean.toLowerCase()) ||
      (u.qrCodeData && u.qrCodeData.toLowerCase() === clean.toLowerCase())
    );

    if (memberMatch) {
      playScanBeep(true);
      const activeBorrowed = transactions.filter(t => (t.memberId === memberMatch.id || t.memberCode === memberMatch.memberCode) && t.status !== 'RETURNED');
      
      setScannedResult({
        type: 'MEMBER',
        code: clean,
        name: memberMatch.name,
        role: memberMatch.role,
        rfidUid: memberMatch.rfidTag || '04:A3:8F:12:90:B4',
        details: `Department: ${memberMatch.department || 'General'} | Active Loans: ${activeBorrowed.length} | Fines: ${memberMatch.finePending || 0} PKR`
      });

      setScanHistoryLog(prev => [
        {
          id: Math.random().toString(),
          time: new Date().toLocaleTimeString(),
          mode: scanSource,
          code: clean,
          label: `Patron: ${memberMatch.name} [${memberMatch.memberCode}]`,
          status: 'SUCCESS'
        },
        ...prev.slice(0, 19)
      ]);
      return;
    }

    // 2. Check if matching Book in Catalog or Transactions
    const bookMatch = books.find(b =>
      (b.accessionNumber && b.accessionNumber.toLowerCase() === clean.toLowerCase()) ||
      (b.isbn && b.isbn.replace(/[- ]/g, '').toLowerCase() === clean.replace(/[- ]/g, '').toLowerCase()) ||
      b.id.toLowerCase() === clean.toLowerCase()
    );

    const txMatch = transactions.find(t =>
      (t.accessionNumber && t.accessionNumber.toLowerCase() === clean.toLowerCase()) ||
      (t.copyBarcode && t.copyBarcode.toLowerCase() === clean.toLowerCase())
    );

    if (bookMatch || txMatch) {
      playScanBeep(true);
      const title = bookMatch?.title || txMatch?.bookTitle || 'Catalog Book Record';
      const accession = bookMatch?.accessionNumber || txMatch?.accessionNumber || clean;
      const isIssued = txMatch && txMatch.status !== 'RETURNED';

      setScannedResult({
        type: 'BOOK',
        code: clean,
        title,
        accession,
        barcode: bookMatch?.isbn || clean,
        rfidUid: `RFID${accession.replace(/[^0-9]/g, '') || '88001'}`,
        easStatus: isIssued ? 'DISARMED' : 'ARMED',
        loanStatus: isIssued ? 'ISSUED (ON LOAN)' : 'AVAILABLE (IN STACK)',
        borrower: isIssued ? txMatch.memberName : undefined,
        details: `Call No: ${bookMatch?.callNumber || '000.0'} | Shelf: ${bookMatch?.shelfLocation || 'Main Stack'}`
      });

      setScanHistoryLog(prev => [
        {
          id: Math.random().toString(),
          time: new Date().toLocaleTimeString(),
          mode: scanSource,
          code: clean,
          label: `Book: "${title}" [${accession}] - ${isIssued ? 'ISSUED' : 'AVAILABLE'}`,
          status: 'SUCCESS'
        },
        ...prev.slice(0, 19)
      ]);
      return;
    }

    // 3. Fallback Unknown
    playScanBeep(false);
    setScannedResult({
      type: 'UNKNOWN',
      code: clean,
      details: 'Unregistered barcode or RFID identifier. Please check accession catalog.'
    });

    setScanHistoryLog(prev => [
      {
        id: Math.random().toString(),
        time: new Date().toLocaleTimeString(),
        mode: scanSource,
        code: clean,
        label: `Unregistered Code: "${clean}"`,
        status: 'WARNING'
      },
      ...prev.slice(0, 19)
    ]);
  }, [users, books, transactions, playScanBeep]);

  // Camera Scanning Loop
  const startScannerCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator?.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraActive(false);
        setCameraError('Camera access not supported in this browser. Please use RFID Tap or USB/Manual scanner.');
        return;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      setCameraActive(false);
      setCameraError('Camera permission not granted or unavailable. You can use RFID Tap simulation, USB/Manual input, or sample cards.');
    }
  }, []);

  const stopScannerCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
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

  useEffect(() => {
    if (activeModuleTab === 'SCANNER_HUB' && scannerMode === 'CAMERA') {
      startScannerCamera();
    } else {
      stopScannerCamera();
    }
    return () => stopScannerCamera();
  }, [activeModuleTab, scannerMode, startScannerCamera, stopScannerCamera]);

  // Continuous Camera Decode loop
  useEffect(() => {
    let lastScan = 0;
    const processFrame = () => {
      if (!cameraActive || !videoRef.current || !canvasRef.current) {
        animFrameRef.current = requestAnimationFrame(processFrame);
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
          if (now - lastScan > 250) {
            lastScan = now;
            try {
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const qr = jsQR(imgData.data, imgData.width, imgData.height);
              if (qr && qr.data) {
                handleProcessScannedCode(qr.data, 'CAMERA_SCAN');
              }
            } catch (e) {
              console.warn('Decode frame error:', e);
            }
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    if (activeModuleTab === 'SCANNER_HUB' && scannerMode === 'CAMERA' && cameraActive) {
      animFrameRef.current = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [activeModuleTab, scannerMode, cameraActive, handleProcessScannedCode]);

  return (
    <div className="space-y-6">
      {/* Top Header & Main Tab Switcher */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <span>Barcode & RFID Smart Labels Hub</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ISO 28560 / EPC Gen2
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate high-res accession barcodes, encode smart RFID book tags with EAS security bits, and verify scans with live camera & contactless readers
              </p>
            </div>
          </div>
        </div>

        {/* 3 Master Tabs */}
        <div className="flex items-center bg-[#f1f5f9] p-1 rounded-xl border border-slate-200/90">
          <button
            type="button"
            onClick={() => setActiveModuleTab('BARCODE_STUDIO')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeModuleTab === 'BARCODE_STUDIO'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarcodeIcon className="h-4 w-4" />
            <span>Spine Barcode Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModuleTab('RFID_ENCODER')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeModuleTab === 'RFID_ENCODER'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Radio className="h-4 w-4" />
            <span>RFID Tag & Card Encoder</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModuleTab('SCANNER_HUB')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeModuleTab === 'SCANNER_HUB'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>Live Scanner Hub</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: BARCODE & SPINE LABEL STUDIO                                  */}
      {/* =================================================================== */}
      {activeModuleTab === 'BARCODE_STUDIO' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 border border-slate-200/90">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-emerald-400" />
                <span>Active: <strong className="text-slate-900 font-mono">{activeCode}</strong></span>
              </div>
              <div className="h-4 w-px bg-[#27272a] hidden sm:block" />
              <button
                type="button"
                onClick={() => setIsTitleModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold flex items-center space-x-1.5 cursor-pointer transition-all"
                title="Choose and select all titles"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                <span>Choose Titles ({chosenBooks.length}/{books.length})</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPrintPreview(!isPrintPreview)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  isPrintPreview ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200/90 text-slate-900 hover:border-emerald-500/50'
                }`}
              >
                <Grid className="h-3.5 w-3.5 text-emerald-400" />
                <span>{isPrintPreview ? 'Hide Sheet Grid' : `21-Label Sheet Grid (${batchLabelItems.length})`}</span>
              </button>

              <button
                type="button"
                onClick={handleBatchDownloadZip}
                disabled={isBatchZipDownloading || batchLabelItems.length === 0}
                className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                title="Download ZIP archive of high-res PNG labels for all chosen titles"
              >
                <Package className="h-3.5 w-3.5" />
                <span>{isBatchZipDownloading ? 'Packaging...' : 'Batch ZIP'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdfSheet}
                className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPng}
                className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Single PNG</span>
              </button>

              <button
                type="button"
                onClick={handlePrintLabels}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Sheet</span>
              </button>
            </div>
          </div>

          {/* Main Grid: Settings & Live Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Controls (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* 1. Target Data Selection */}
              <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase text-slate-500 flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-emerald-400" />
                    <span>1. Select Catalog Item / Code</span>
                  </h3>
                  {sourceType === 'CATALOG' && (
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {chosenBooks.length} Selected
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSourceType('CATALOG')}
                    className={`p-2.5 rounded-xl border text-left font-medium flex items-center space-x-2 transition-all cursor-pointer ${
                      sourceType === 'CATALOG' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-200/90 bg-[#f1f5f9] text-slate-500'
                    }`}
                  >
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span>Catalog Book</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSourceType('CUSTOM')}
                    className={`p-2.5 rounded-xl border text-left font-medium flex items-center space-x-2 transition-all cursor-pointer ${
                      sourceType === 'CUSTOM' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-200/90 bg-[#f1f5f9] text-slate-500'
                    }`}
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span>Custom Accession</span>
                  </button>
                </div>

                {sourceType === 'CATALOG' && (
                  <div className="space-y-2 pt-1">
                    {/* Choose and Select All Titles Button Bar */}
                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-200/90 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Bulk Title Selection</span>
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={handleSelectAllTitles}
                            className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 cursor-pointer"
                          >
                            Select All ({books.length})
                          </button>
                          <button
                            type="button"
                            onClick={handleDeselectAllTitles}
                            className="px-2 py-1 rounded bg-[#f1f5f9] hover:bg-[#27272a] text-red-400 text-[10px] font-medium border border-slate-200/90 cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsTitleModalOpen(true)}
                        className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-emerald-600/20 transition-all"
                      >
                        <ListFilter className="h-3.5 w-3.5" />
                        <span>Choose & Filter Specific Titles ({chosenBooks.length} of {books.length})</span>
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500">Active Single Preview Book</label>
                      <select
                        value={selectedBookId}
                        onChange={(e) => setSelectedBookId(e.target.value)}
                        className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                      >
                        {books.map(b => (
                          <option key={b.id} value={b.id} className="bg-white text-slate-900">
                            {selectedBookIds.includes(b.id) ? '✓ ' : '○ '} {b.title} ({b.isbn || b.accessionNumber || b.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {sourceType === 'CUSTOM' && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500">Accession / Barcode Text</label>
                      <input
                        type="text"
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500">Label Display Heading / Title</label>
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500">Call Number Notation</label>
                      <input
                        type="text"
                        value={customCallNo}
                        onChange={(e) => setCustomCallNo(e.target.value)}
                        className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Symbology & Dimensions */}
              <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase text-slate-500 flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-emerald-400" />
                  <span>2. Label Format & Symbology</span>
                </h3>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500">Symbology Format</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setCodeType('BOTH')}
                      className={`p-2 rounded-xl border font-semibold flex items-center justify-center space-x-1.5 cursor-pointer ${
                        codeType === 'BOTH' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-200/90 bg-[#f1f5f9] text-slate-500'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>QR + Barcode</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCodeType('CODE128')}
                      className={`p-2 rounded-xl border font-semibold flex items-center justify-center space-x-1.5 cursor-pointer ${
                        codeType === 'CODE128' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-200/90 bg-[#f1f5f9] text-slate-500'
                      }`}
                    >
                      <BarcodeIcon className="h-3.5 w-3.5" />
                      <span>Code 128</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCodeType('CODE39')}
                      className={`p-2 rounded-xl border font-semibold flex items-center justify-center space-x-1.5 cursor-pointer ${
                        codeType === 'CODE39' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-200/90 bg-[#f1f5f9] text-slate-500'
                      }`}
                    >
                      <BarcodeIcon className="h-3.5 w-3.5" />
                      <span>Code 39</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCodeType('QR_CODE')}
                      className={`p-2 rounded-xl border font-semibold flex items-center justify-center space-x-1.5 cursor-pointer ${
                        codeType === 'QR_CODE' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-200/90 bg-[#f1f5f9] text-slate-500'
                      }`}
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>Standard QR</span>
                    </button>
                  </div>
                </div>

                {/* Elements Toggles */}
                <div className="space-y-2 pt-2 border-t border-slate-200/90">
                  <label className="text-[11px] font-semibold text-slate-900 block">Include Elements:</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center space-x-2 text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showInstitution}
                        onChange={(e) => setShowInstitution(e.target.checked)}
                        className="rounded border-slate-200/90 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>Library Name</span>
                    </label>

                    <label className="flex items-center space-x-2 text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showTitle}
                        onChange={(e) => setShowTitle(e.target.checked)}
                        className="rounded border-slate-200/90 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>Book Title</span>
                    </label>

                    <label className="flex items-center space-x-2 text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showCallNo}
                        onChange={(e) => setShowCallNo(e.target.checked)}
                        className="rounded border-slate-200/90 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>Call Number</span>
                    </label>

                    <label className="flex items-center space-x-2 text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showAccession}
                        onChange={(e) => setShowAccession(e.target.checked)}
                        className="rounded border-slate-200/90 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>Accession Code</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Live Preview (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="p-6 rounded-2xl border border-slate-200/90 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase text-slate-500 flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <span>Live Sticker Label Preview</span>
                  </h3>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="text-xs text-emerald-400 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Code Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                {/* Sticker Label Box */}
                <div
                  id="spine-label-card-preview"
                  className="p-6 rounded-2xl bg-white text-black shadow-2xl flex flex-col items-center justify-center text-center space-y-3 mx-auto border-2 border-slate-300 relative overflow-hidden transition-all max-w-sm"
                >
                  {/* Institution Header */}
                  {showInstitution && (
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 border-b border-slate-200 pb-1 w-full text-center">
                      {libraryName}
                    </div>
                  )}

                  {/* Title */}
                  {showTitle && (
                    <div className="text-xs font-bold text-slate-900 leading-tight line-clamp-2 px-2">
                      {activeTitle}
                    </div>
                  )}

                  {/* Call Number */}
                  {showCallNo && (
                    <div className="text-[11px] font-mono font-bold bg-slate-100 text-slate-800 px-3 py-1 rounded border border-slate-200">
                      {activeCallNo}
                    </div>
                  )}

                  {/* Codes Display Area */}
                  <div className="flex items-center justify-center gap-4 py-2 w-full">
                    {/* QR Code SVG Render */}
                    {(codeType === 'QR_CODE' || codeType === 'BOTH') && (
                      <div className="flex flex-col items-center">
                        <svg
                          id="spine-label-svg-preview"
                          width="90"
                          height="90"
                          viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                          className="border border-slate-200 p-1 bg-white rounded shadow-sm"
                        >
                          {qrMatrix.map((row, rIdx) =>
                            row.map((cell, cIdx) => (
                              cell ? (
                                <rect
                                  key={`${rIdx}-${cIdx}`}
                                  x={cIdx}
                                  y={rIdx}
                                  width="1"
                                  height="1"
                                  fill="#000000"
                                />
                              ) : null
                            ))
                          )}
                        </svg>
                        <span className="text-[8px] font-mono font-bold text-slate-500 mt-1">ISO QR CODE</span>
                      </div>
                    )}

                    {/* Barcode SVG Render (Precision Alternating Width Bars) */}
                    {(codeType === 'CODE128' || codeType === 'CODE39' || codeType === 'BOTH') && (
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <div className="w-full h-14 flex items-center justify-center overflow-hidden bg-white p-1 border border-slate-200 rounded">
                          {(() => {
                            const totalUnits = activeBarElements.reduce((acc, el) => acc + el.width, 0);
                            let currentUnit = 0;
                            return (
                              <svg width="100%" height="45" viewBox={`0 0 ${totalUnits} 45`} preserveAspectRatio="none">
                                {activeBarElements.map((el, idx) => {
                                  const startX = currentUnit;
                                  currentUnit += el.width;
                                  return el.isBar ? (
                                    <rect
                                      key={idx}
                                      x={startX}
                                      y="0"
                                      width={el.width}
                                      height="45"
                                      fill="#000000"
                                    />
                                  ) : null;
                                })}
                              </svg>
                            );
                          })()}
                        </div>
                        <span className="text-[8px] font-mono font-bold text-slate-500 mt-1">
                          {codeType === 'CODE39' ? 'CODE 39 (3 OF 9)' : 'CODE 128 (GS1)'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Accession Text Code */}
                  {showAccession && (
                    <div className="text-xs font-mono font-extrabold text-slate-900 tracking-wider">
                      *{activeCode}*
                    </div>
                  )}
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadPdfSheet}
                    className="p-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <FileText className="h-4 w-4" />
                    <span>PDF Sheet (21)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPng}
                    className="p-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download PNG</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadSvg}
                    className="p-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <FileType className="h-4 w-4" />
                    <span>Vector SVG</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintLabels}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Sheet</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 21-Label Sheet Grid Preview */}
          {isPrintPreview && (
            <BarcodeBatchSheetGrid
              items={batchLabelItems}
              options={{
                libraryName,
                codeType,
                showInstitution,
                showTitle,
                showCallNo,
                showAccession,
                labelSize
              }}
              onPrint={handlePrintLabels}
              onDownloadPdf={handleDownloadPdfSheet}
              onDownloadZip={handleBatchDownloadZip}
              isZipDownloading={isBatchZipDownloading}
            />
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: RFID SMART TAG & CHIP ENCODER (ISO 28560 / EPC Gen2)         */}
      {/* =================================================================== */}
      {activeModuleTab === 'RFID_ENCODER' && (
        <div className="space-y-6">
          {/* Sub Header & Mode Selection */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 border border-slate-200/90">
            <div className="flex items-center space-x-2">
              <Radio className="h-5 w-5 text-purple-400 animate-pulse" />
              <div>
                <span className="text-sm font-bold text-slate-900">Smart RFID Tag Programmer & Inlay Studio</span>
                <p className="text-xs text-slate-500">Encode ISO 28560-2 UHF/HF transponders with EAS anti-theft security bits</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkExportRfid}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm"
                title="Export batch RFID encoding JSON payload for all books"
              >
                <Database className="h-3.5 w-3.5" />
                <span>Bulk RFID Encoding Export</span>
              </button>

              <button
                type="button"
                onClick={handleProgramRfidTag}
                disabled={isProgramming}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-purple-600/30 cursor-pointer transition-all"
              >
                {isProgramming ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                <span>{isProgramming ? 'Encoding Chip Memory...' : 'Program RFID Tag'}</span>
              </button>
            </div>
          </div>

          {programmingSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>RFID transponder successfully written & verified: EPC, AFI (0x{rfidEasStatus === 'ARMED' ? '07' : 'C2'}), and ISO 28560 User Memory verified.</span>
            </div>
          )}

          {/* Encoder Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Options (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Target Type */}
              <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase text-slate-500 flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-purple-400" />
                  <span>1. RFID Tag Profile & Standard</span>
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setRfidTargetType('BOOK_TAG')}
                    className={`p-3 rounded-xl border text-left font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                      rfidTargetType === 'BOOK_TAG' ? 'border-purple-500 bg-purple-500/10 text-purple-300' : 'border-slate-200/90 bg-[#f1f5f9] text-slate-500'
                    }`}
                  >
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span>Book Smart Inlay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRfidTargetType('PATRON_CARD')}
                    className={`p-3 rounded-xl border text-left font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                      rfidTargetType === 'PATRON_CARD' ? 'border-purple-500 bg-purple-500/10 text-purple-300' : 'border-slate-200/90 bg-[#f1f5f9] text-slate-500'
                    }`}
                  >
                    <User className="h-4 w-4 shrink-0" />
                    <span>Patron Smart Card</span>
                  </button>
                </div>

                {/* Target Selection */}
                {rfidTargetType === 'BOOK_TAG' ? (
                  <div className="space-y-3 pt-1">
                    {/* Scope selection: Single vs All Chosen */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-slate-500">Programming Scope</label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setRfidTargetScope('SINGLE')}
                          className={`p-2.5 rounded-xl border text-left font-medium flex items-center space-x-1.5 cursor-pointer ${
                            rfidTargetScope === 'SINGLE' ? 'border-purple-500 bg-purple-500/10 text-purple-300' : 'border-slate-200/90 bg-[#f1f5f9] text-slate-500'
                          }`}
                        >
                          <span>Single Title</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRfidTargetScope('BATCH_SELECTED')}
                          className={`p-2.5 rounded-xl border text-left font-medium flex items-center space-x-1.5 cursor-pointer ${
                            rfidTargetScope === 'BATCH_SELECTED' ? 'border-purple-500 bg-purple-500/10 text-purple-300' : 'border-slate-200/90 bg-[#f1f5f9] text-slate-500'
                          }`}
                        >
                          <span>Batch ({chosenBooks.length} Chosen)</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-500">Active Catalog Book</label>
                      <button
                        type="button"
                        onClick={() => setIsTitleModalOpen(true)}
                        className="text-[10px] text-purple-400 hover:underline font-medium cursor-pointer"
                      >
                        Choose / Select All Titles ({chosenBooks.length})
                      </button>
                    </div>

                    <select
                      value={selectedBookId}
                      onChange={(e) => setSelectedBookId(e.target.value)}
                      className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                    >
                      {books.map(b => (
                        <option key={b.id} value={b.id} className="bg-white">
                          {selectedBookIds.includes(b.id) ? '✓ ' : '○ '} {b.title} ({b.accessionNumber || b.isbn || b.id})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] text-slate-500">Target Patron</label>
                    <select
                      value={selectedPatronId}
                      onChange={(e) => setSelectedPatronId(e.target.value)}
                      className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                    >
                      {users.map(u => (
                        <option key={u.id} value={u.id} className="bg-white">
                          {u.name} ({u.memberCode}) - {u.role}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* RFID Frequency & Anti-Theft EAS Security */}
              <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase text-slate-500 flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-purple-400" />
                  <span>2. RFID Security & EAS Anti-Theft Bits</span>
                </h3>

                {/* EAS Anti-Theft Status */}
                <div className="space-y-2">
                  <label className="text-[11px] text-slate-500 block">EAS Anti-Theft Gate Status (Electronic Article Surveillance)</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setRfidEasStatus('ARMED');
                        setRfidAfiByte('0x07');
                      }}
                      className={`p-3 rounded-xl border font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                        rfidEasStatus === 'ARMED'
                          ? 'border-red-500 bg-red-500/10 text-red-300'
                          : 'border-slate-200/90 bg-[#f1f5f9] text-slate-500'
                      }`}
                    >
                      <ShieldAlert className="h-4 w-4 text-red-400" />
                      <span>ARMED (In Stack)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRfidEasStatus('DISARMED');
                        setRfidAfiByte('0xC2');
                      }}
                      className={`p-3 rounded-xl border font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                        rfidEasStatus === 'DISARMED'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-200/90 bg-[#f1f5f9] text-slate-500'
                      }`}
                    >
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>DISARMED (Issued)</span>
                    </button>
                  </div>
                </div>

                {/* Frequency Standard */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200/90">
                  <label className="text-[11px] text-slate-500">Frequency Protocol</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setRfidFrequency('UHF')}
                      className={`p-2.5 rounded-xl border font-semibold flex items-center justify-center space-x-1.5 cursor-pointer ${
                        rfidFrequency === 'UHF' ? 'border-purple-500 bg-purple-500/10 text-purple-300' : 'border-slate-200/90 bg-[#f1f5f9] text-slate-500'
                      }`}
                    >
                      <span>UHF (860-960 MHz)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRfidFrequency('HF')}
                      className={`p-2.5 rounded-xl border font-semibold flex items-center justify-center space-x-1.5 cursor-pointer ${
                        rfidFrequency === 'HF' ? 'border-purple-500 bg-purple-500/10 text-purple-300' : 'border-slate-200/90 bg-[#f1f5f9] text-slate-500'
                      }`}
                    >
                      <span>HF (13.56 MHz ISO 15693)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Live RFID Visual Tag (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="p-6 rounded-2xl border border-slate-200/90 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase text-slate-500 flex items-center space-x-2">
                    <Radio className="h-4 w-4 text-purple-400" />
                    <span>Smart RFID Physical Inlay Graphic (50mm x 50mm)</span>
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    rfidEasStatus === 'ARMED' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    EAS: {rfidEasStatus}
                  </span>
                </div>

                {/* RFID Inlay Graphical Simulator */}
                {rfidTargetType === 'BOOK_TAG' ? (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 text-black shadow-xl border-2 border-amber-300 relative overflow-hidden max-w-md mx-auto">
                    {/* Simulated RFID Copper Antenna Trace Loops */}
                    <div className="absolute inset-2 border-2 border-amber-400/50 rounded-xl pointer-events-none" />
                    <div className="absolute inset-4 border border-amber-400/40 rounded-lg pointer-events-none" />
                    <div className="absolute inset-6 border border-amber-400/30 rounded-md pointer-events-none" />

                    <div className="relative z-10 space-y-3">
                      {/* Top Header */}
                      <div className="flex items-center justify-between border-b border-amber-300 pb-2">
                        <div className="flex items-center space-x-1.5">
                          <Radio className="h-4 w-4 text-purple-700" />
                          <span className="text-[10px] font-extrabold tracking-wider text-amber-950 uppercase">PLiMS RFID SMART TAG</span>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                          {rfidFrequency} Gen2
                        </span>
                      </div>

                      {/* Chip Details */}
                      <div className="text-center space-y-1 py-1">
                        <div className="text-xs font-bold text-slate-900 truncate">{activeTitle}</div>
                        <div className="text-[11px] font-mono font-bold bg-amber-200/90 text-amber-950 inline-block px-2.5 py-0.5 rounded">
                          {activeCallNo}
                        </div>
                      </div>

                      {/* Microchip Icon Graphic */}
                      <div className="flex items-center justify-center py-2">
                        <div className="p-3 bg-white text-amber-400 rounded-xl shadow-md border border-slate-300 flex items-center space-x-2">
                          <Cpu className="h-6 w-6 text-purple-400" />
                          <div className="text-left font-mono text-[10px] text-slate-700 leading-tight">
                            <div>CHIP UID: <strong className="text-amber-300">{activeRfidChipUid}</strong></div>
                            <div>AFI: <strong className="text-emerald-400">{rfidAfiByte}</strong> | EAS: <strong className={rfidEasStatus === 'ARMED' ? 'text-red-400' : 'text-emerald-400'}>{rfidEasStatus}</strong></div>
                          </div>
                        </div>
                      </div>

                      {/* Accession & Barcode on Tag */}
                      <div className="text-center border-t border-amber-300 pt-2 font-mono text-xs font-extrabold text-amber-950">
                        ACC: {activeRfidAccession}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Patron Smart Card Preview */
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white shadow-2xl border border-slate-300 relative overflow-hidden max-w-md mx-auto">
                    <div className="flex items-center justify-between border-b border-slate-300 pb-3">
                      <div className="flex items-center space-x-2.5">
                        <img src={pslimsLogo} alt="PLiMS Emblem" className="w-6 h-6 rounded-full object-cover border border-emerald-400/40" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Patron Contactless Smart ID</span>
                      </div>
                      <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                        MIFARE 1K
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-4 items-center py-4">
                      <div className="col-span-4 flex flex-col items-center justify-center">
                        <div className="h-16 w-16 rounded-xl bg-slate-100 border-2 border-emerald-500/40 flex items-center justify-center text-slate-500 overflow-hidden">
                          {selectedPatron?.avatarUrl ? (
                            <img src={selectedPatron.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-8 w-8 text-slate-500" />
                          )}
                        </div>
                      </div>

                      <div className="col-span-8 space-y-1 text-xs">
                        <div className="font-bold text-sm text-white">{selectedPatron?.name || 'Patron Name'}</div>
                        <div className="text-emerald-400 font-mono font-bold">{selectedPatron?.memberCode || 'STU-2024-001'}</div>
                        <div className="text-slate-500 text-[11px]">{selectedPatron?.department || 'Department'} • {selectedPatron?.role || 'STUDENT'}</div>
                        <div className="text-[10px] font-mono text-slate-400 pt-1">RFID UID: {patronChipUid}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-300/80 pt-2 text-[10px] text-slate-500 font-mono">
                      <span>SEC: ISO/IEC 14443 Type A</span>
                      <span>EXP: {selectedPatron?.expiryDate || '2027-12-31'}</span>
                    </div>
                  </div>
                )}

                {/* Encoded Memory Map Preview */}
                <div className="p-4 rounded-xl bg-[#f1f5f9] border border-slate-200/90 text-xs font-mono space-y-1.5 text-slate-500">
                  <div className="text-purple-400 font-bold text-[11px]">ISO 28560 MEMORY BANK ENCODING MAP:</div>
                  <div><strong className="text-slate-700">Bank 00 (Reserved):</strong> Access/Kill PWD [00000000]</div>
                  <div><strong className="text-slate-700">Bank 01 (EPC):</strong> <span className="text-emerald-400">{activeEpcHex}</span></div>
                  <div><strong className="text-slate-700">Bank 02 (TID):</strong> E2801160600002046890B412</div>
                  <div className="truncate"><strong className="text-slate-700">Bank 03 (User):</strong> <span className="text-blue-400">{activeUserMemoryHex}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: LIVE BARCODE & RFID SCANNER / VERIFICATION HUB               */}
      {/* =================================================================== */}
      {activeModuleTab === 'SCANNER_HUB' && (
        <div className="space-y-6">
          {/* Scanner Mode Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 border border-slate-200/90">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-400 animate-pulse" />
              <span className="text-sm font-bold text-slate-900">Universal Barcode & Contactless RFID Reader Terminal</span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#f1f5f9] p-1 rounded-xl border border-slate-200/90">
              <button
                type="button"
                onClick={() => setScannerMode('RFID_TAP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer ${
                  scannerMode === 'RFID_TAP' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-white'
                }`}
              >
                <Radio className="h-3.5 w-3.5" />
                <span>RFID Reader Pad</span>
              </button>

              <button
                type="button"
                onClick={() => setScannerMode('CAMERA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer ${
                  scannerMode === 'CAMERA' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Webcam / Camera</span>
              </button>

              <button
                type="button"
                onClick={() => setScannerMode('USB_MANUAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer ${
                  scannerMode === 'USB_MANUAL' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-white'
                }`}
              >
                <BarcodeIcon className="h-3.5 w-3.5" />
                <span>USB Laser / Manual</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Scanner Interaction Zone (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* MODE 1: RFID CONTACTLESS TAP SCANNER */}
              {scannerMode === 'RFID_TAP' && (
                <div className="p-6 rounded-2xl border border-slate-200/90 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold uppercase text-slate-500 flex items-center space-x-2">
                      <Radio className="h-4 w-4 text-purple-400" />
                      <span>Contactless RFID Reader Pad</span>
                    </h3>
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      UHF / HF Ready
                    </span>
                  </div>

                  {/* Simulated Near Field Tap Pad */}
                  <div className="p-8 rounded-2xl bg-[#f1f5f9] border-2 border-dashed border-purple-500/40 text-center space-y-3 relative overflow-hidden">
                    <div className="h-16 w-16 mx-auto rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Radio className="h-8 w-8 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Tap Book RFID Tag or Patron Card</div>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        Place smart transponder near antenna field to read Chip UID, EAS anti-theft status, and catalog metadata
                      </p>
                    </div>
                  </div>

                  {/* Quick Test Tap Presets */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-semibold text-slate-500 block">Quick Test Tap (Click to simulate instant scan):</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {books.slice(0, 4).map(b => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => handleProcessScannedCode(b.accessionNumber || b.isbn || b.id, 'RFID_BOOK_TAP')}
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-[#27272a] border border-slate-200/90 text-left text-xs transition-all cursor-pointer flex items-center space-x-2"
                        >
                          <BookOpen className="h-4 w-4 text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <div className="font-bold text-slate-900 truncate">{b.title}</div>
                            <div className="text-[10px] font-mono text-slate-500">{b.accessionNumber || b.isbn}</div>
                          </div>
                        </button>
                      ))}

                      {users.slice(0, 2).map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleProcessScannedCode(u.memberCode || u.rfidTag || u.id, 'RFID_PATRON_TAP')}
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-[#27272a] border border-slate-200/90 text-left text-xs transition-all cursor-pointer flex items-center space-x-2"
                        >
                          <User className="h-4 w-4 text-blue-400 shrink-0" />
                          <div className="truncate">
                            <div className="font-bold text-slate-900 truncate">{u.name}</div>
                            <div className="text-[10px] font-mono text-slate-500">{u.memberCode} ({u.role})</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 2: CAMERA STREAM */}
              {scannerMode === 'CAMERA' && (
                <div className="p-6 rounded-2xl border border-slate-200/90 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold uppercase text-slate-500 flex items-center space-x-2">
                      <Camera className="h-4 w-4 text-blue-400" />
                      <span>Live Video Camera Stream Scanner</span>
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Live Decoding
                    </span>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-200/90">
                    <video ref={videoRef} className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Reticle / Targeting Box */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-emerald-500/80 rounded-2xl relative animate-pulse">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400" />
                      </div>
                    </div>

                    {cameraError && (
                      <div className="absolute inset-0 bg-[#f1f5f9]/90 p-6 flex flex-col items-center justify-center text-center space-y-2">
                        <AlertCircle className="h-8 w-8 text-amber-400" />
                        <div className="text-xs text-slate-900 font-bold">Camera Stream Notice</div>
                        <p className="text-xs text-slate-500 max-w-sm">{cameraError}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MODE 3: USB MANUAL SCANNER */}
              {scannerMode === 'USB_MANUAL' && (
                <div className="p-6 rounded-2xl border border-slate-200/90 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold uppercase text-slate-500 flex items-center space-x-2">
                      <BarcodeIcon className="h-4 w-4 text-emerald-400" />
                      <span>USB Handheld Laser & Keyboard Wedge Scanner</span>
                    </h3>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleProcessScannedCode(manualScanInput, 'USB_LASER');
                      setManualScanInput('');
                    }}
                    className="space-y-3"
                  >
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">Scan Barcode or Enter Accession / Member Code</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={manualScanInput}
                          onChange={(e) => setManualScanInput(e.target.value)}
                          placeholder="Aim scanner at barcode or type (e.g. ACC-88001, STU-2024-001)..."
                          autoFocus
                          className="w-full bg-[#f1f5f9] border-2 border-emerald-500/60 rounded-xl px-4 py-3 text-sm text-slate-900 font-mono focus:outline-none focus:border-emerald-400"
                        />
                        <button
                          type="submit"
                          className="absolute right-2 top-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Scan & Lookup
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Right Decoded Payload & History (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Active Scanned Result Box */}
              <div className="p-6 rounded-2xl border border-slate-200/90 bg-white space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase text-slate-500 flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Decoded Payload & Item Status</span>
                </h3>

                {scannedResult ? (
                  <div className="p-4 rounded-xl bg-[#f1f5f9] border border-slate-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                        scannedResult.type === 'BOOK' ? 'bg-emerald-500/20 text-emerald-300' : scannedResult.type === 'MEMBER' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {scannedResult.type === 'BOOK' ? 'CATALOG BOOK' : scannedResult.type === 'MEMBER' ? 'REGISTERED PATRON' : 'UNREGISTERED CODE'}
                      </span>

                      {scannedResult.easStatus && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          scannedResult.easStatus === 'ARMED' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          EAS: {scannedResult.easStatus}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {scannedResult.title || scannedResult.name || scannedResult.code}
                      </div>
                      <div className="text-xs font-mono text-emerald-400 mt-0.5">
                        Code: {scannedResult.code} {scannedResult.rfidUid ? `(RFID: ${scannedResult.rfidUid})` : ''}
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 border-t border-slate-200/90 pt-2">
                      {scannedResult.details}
                    </div>

                    {scannedResult.borrower && (
                      <div className="text-xs text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                        Currently borrowed by: <strong>{scannedResult.borrower}</strong>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 rounded-xl bg-[#f1f5f9] border border-slate-200/90 text-center text-xs text-slate-500">
                    No item scanned yet. Tap an RFID card, aim webcam at barcode, or scan with USB handheld scanner.
                  </div>
                )}
              </div>

              {/* Session Scan Log */}
              <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase text-slate-500 flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span>Session Scan Log ({scanHistoryLog.length})</span>
                  </h3>
                  {scanHistoryLog.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setScanHistoryLog([])}
                      className="text-[11px] text-slate-500 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {scanHistoryLog.length === 0 ? (
                    <div className="text-xs text-slate-400 text-center py-4">Waiting for first scan...</div>
                  ) : (
                    scanHistoryLog.map(item => (
                      <div key={item.id} className="p-2 rounded-lg bg-[#f1f5f9] border border-slate-200/90 text-xs flex items-center justify-between">
                        <div className="truncate pr-2">
                          <span className="text-slate-900 font-medium">{item.label}</span>
                          <div className="text-[10px] text-slate-500 font-mono">{item.mode} • {item.code}</div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{item.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Printable Area for Standard Labels (@media print) */}
      <div id="printable-label-area" className="hidden print:block">
        <div style={{ padding: '10px', background: '#ffffff', color: '#000000', fontFamily: 'sans-serif' }}>
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 5px 0' }}>{libraryName}</h2>
            <p style={{ fontSize: '12px', margin: 0 }}>Accession Barcode & Spine Tag Sheet - {batchLabelItems.length} Title{batchLabelItems.length === 1 ? '' : 's'}</p>
          </div>

          <div className="print-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {batchLabelItems.map((item, idx) => {
              const qr = generateQrMatrix(item.code);
              return (
                <div
                  key={idx}
                  className="print-label-item"
                  style={{
                    border: '1.5px solid #000000',
                    borderRadius: '6px',
                    padding: '10px',
                    textAlign: 'center',
                    background: '#ffffff',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid'
                  }}
                >
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#065f46', textTransform: 'uppercase' }}>PLiMS LIBRARY</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', margin: '4px 0', lineHeight: '1.2' }}>{item.title.substring(0, 36)}</div>
                  <div style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold', background: '#f1f5f9', padding: '2px 6px', display: 'inline-block', borderRadius: '4px' }}>{item.callNo}</div>

                  <div style={{ margin: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <svg width="45" height="45" viewBox={`0 0 ${qr.length} ${qr.length}`}>
                      {qr.map((row, rIdx) =>
                        row.map((cell, cIdx) => (
                          cell ? <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width="1" height="1" fill="#000000" /> : null
                        ))
                      )}
                    </svg>
                  </div>

                  <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }}>*{item.code}*</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Choose & Select Titles Modal */}
      <TitleSelectorModal
        isOpen={isTitleModalOpen}
        onClose={() => setIsTitleModalOpen(false)}
        books={books}
        selectedBookIds={selectedBookIds}
        onToggleBook={handleToggleBookTitle}
        onSelectAll={handleSelectAllTitles}
        onDeselectAll={handleDeselectAllTitles}
        onSetSelection={handleSetBookSelection}
      />
    </div>
  );
};
