import React from 'react';
import { jsPDF } from 'jspdf';
import { BookRecord } from '../../types/alims';
import {
  getCode128BarElements,
  getCode39BarElements,
  generateQrMatrix
} from '../../utils/qrBarcodeGenerator';

export interface LabelRenderOptions {
  libraryName: string;
  codeType: 'QR_CODE' | 'CODE128' | 'CODE39' | 'BOTH';
  showInstitution: boolean;
  showTitle: boolean;
  showCallNo: boolean;
  showAccession: boolean;
  labelSize?: 'SPINE' | 'ACCESSION' | 'CARD' | 'SHELF';
}

export interface LabelItemData {
  id: string;
  title: string;
  code: string;
  callNo: string;
  department?: string;
  author?: string;
}

export const getBookLabelData = (book: BookRecord): LabelItemData => {
  return {
    id: book.id,
    title: book.title,
    code: book.isbn || book.accessionNumber || `ACC-${book.id}`,
    callNo: book.callNumber || '000 GEN',
    department: book.department,
    author: Array.isArray(book.authors) && book.authors.length > 0 ? book.authors.join(', ') : undefined
  };
};

/**
 * Draws a single book label onto a canvas context
 */
export const drawLabelToCanvas = (
  ctx: CanvasRenderingContext2D,
  data: LabelItemData,
  options: LabelRenderOptions,
  width: number,
  height: number
) => {
  const {
    libraryName,
    codeType,
    showInstitution,
    showTitle,
    showCallNo,
    showAccession
  } = options;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Outer Border
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, width - 12, height - 12);

  let currentY = 24;

  // Institution Header
  if (showInstitution) {
    ctx.fillStyle = '#065f46';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(libraryName, width / 2, currentY);
    currentY += 8;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, currentY);
    ctx.lineTo(width - 16, currentY);
    ctx.stroke();
    currentY += 18;
  }

  // Book Title
  if (showTitle) {
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    const maxLen = 38;
    const truncated = data.title.length > maxLen ? data.title.substring(0, maxLen - 3) + '...' : data.title;
    ctx.fillText(truncated, width / 2, currentY);
    currentY += 20;
  }

  // Call Number Box
  if (showCallNo) {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(width / 2 - 70, currentY - 14, 140, 20);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(width / 2 - 70, currentY - 14, 140, 20);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(data.callNo, width / 2, currentY);
    currentY += 24;
  }

  // Codes Area (QR Code + Barcode)
  const qrMatrix = generateQrMatrix(data.code);
  const code128Elements = getCode128BarElements(data.code);
  const code39Elements = getCode39BarElements(data.code);
  const activeBarElements = codeType === 'CODE39' ? code39Elements : code128Elements;

  if (codeType === 'QR_CODE' || codeType === 'BOTH') {
    const qrSize = 64;
    const qrX = codeType === 'BOTH' ? (width / 4) - (qrSize / 2) + 10 : (width / 2) - (qrSize / 2);
    const cellSize = qrSize / (qrMatrix.length || 1);

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
    const barH = 42;
    const barX = codeType === 'BOTH' ? (width / 2) + 15 : (width / 2) - 80;
    const totalUnits = activeBarElements.reduce((acc, el) => acc + el.width, 0);
    const barTargetW = codeType === 'BOTH' ? 120 : 160;
    const unitW = barTargetW / (totalUnits || 1);

    let drawX = barX;
    for (const el of activeBarElements) {
      const elW = el.width * unitW;
      if (el.isBar) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(drawX, currentY + 4, elW, barH);
      }
      drawX += elW;
    }
  }

  currentY += 76;

  // Accession Text
  if (showAccession) {
    ctx.fillStyle = '#0369a1';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`*${data.code}*`, width / 2, currentY);
  }
};

/**
 * Creates high-res DataURL for single label
 */
export const generateLabelDataUrl = (
  item: LabelItemData,
  options: LabelRenderOptions,
  scale = 2
): string => {
  const canvas = document.createElement('canvas');
  const width = 360;
  const height = 240;

  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(scale, scale);
  drawLabelToCanvas(ctx, item, options, width, height);

  return canvas.toDataURL('image/png');
};

/**
 * Generates and downloads multi-page A4 PDF sticker sheets for all selected titles
 */
export const downloadMultiTitlePdfSheet = (
  items: LabelItemData[],
  options: LabelRenderOptions,
  fileName = 'PLiMS_A4_Barcode_Stickers_Batch'
) => {
  if (items.length === 0) return;

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const labelsPerPage = 21; // 7 rows x 3 columns
  const totalPages = Math.ceil(items.length / labelsPerPage);

  const labelMMW = 58;
  const labelMMH = 34;
  const gapX = 6;
  const gapY = 4;
  const startX = (210 - (3 * labelMMW + 2 * gapX)) / 2;
  const startY = 24;

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      doc.addPage('a4', 'p');
    }

    // Page Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(6, 95, 70);
    doc.text(options.libraryName, 105, 10, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const startIdx = page * labelsPerPage;
    const endIdx = Math.min(items.length, startIdx + labelsPerPage);
    doc.text(
      `A4 Barcode Sticker Sheet - Page ${page + 1} of ${totalPages} (Titles ${startIdx + 1} to ${endIdx} of ${items.length})`,
      105,
      15,
      { align: 'center' }
    );

    // Render up to 21 labels on this page
    const pageItems = items.slice(startIdx, endIdx);

    pageItems.forEach((item, idx) => {
      const row = Math.floor(idx / 3);
      const col = idx % 3;
      const x = startX + col * (labelMMW + gapX);
      const y = startY + row * (labelMMH + gapY);

      const imgData = generateLabelDataUrl(item, options, 2.5);
      if (imgData) {
        doc.addImage(imgData, 'PNG', x, y, labelMMW, labelMMH);
      }
    });

    // Page Footer
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `PLiMS V4.1.1 PK edition ISO 28560 / Code 128 Compliant | Generated on ${new Date().toLocaleDateString()}`,
      105,
      290,
      { align: 'center' }
    );
  }

  doc.save(`${fileName}_${items.length}_Titles.pdf`);
};

/**
 * Universal Print Engine for Barcode Sticker Sheets (Works reliably in iframes and standalone)
 */
export const printBarcodeStickerSheets = (
  items: LabelItemData[],
  options: LabelRenderOptions
): void => {
  if (items.length === 0) return;

  const labelsPerPage = 21; // 7 rows x 3 columns
  const totalPages = Math.ceil(items.length / labelsPerPage);

  // Generate HTML for each page
  let pagesHtml = '';

  for (let page = 0; page < totalPages; page++) {
    const startIdx = page * labelsPerPage;
    const endIdx = Math.min(items.length, startIdx + labelsPerPage);
    const pageItems = items.slice(startIdx, endIdx);

    let labelsHtml = '';
    pageItems.forEach((item, idx) => {
      const imgData = generateLabelDataUrl(item, options, 2.5);
      labelsHtml += `
        <div class="sticker-cell">
          <img src="${imgData}" alt="Label for ${item.title}" class="label-img" />
        </div>
      `;
    });

    pagesHtml += `
      <div class="sheet-page">
        <div class="sheet-header">
          <div class="lib-title">${options.libraryName}</div>
          <div class="sheet-sub">A4 Barcode Sticker Sheet • Page ${page + 1} of ${totalPages} (${pageItems.length} Labels)</div>
        </div>
        <div class="labels-grid">
          ${labelsHtml}
        </div>
        <div class="sheet-footer">PLiMS V4.1.1 PK edition ISO 28560 Compliant • Printed on ${new Date().toLocaleString()}</div>
      </div>
    `;
  }

  const printDocumentHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PLiMS V4.1.1 PK edition Barcode Sticker Sheet</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 6mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #000000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet-page {
      width: 198mm;
      min-height: 280mm;
      margin: 0 auto 10mm auto;
      padding: 4mm 2mm;
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .sheet-page:last-child {
      page-break-after: avoid;
      break-after: avoid;
      margin-bottom: 0;
    }
    .sheet-header {
      text-align: center;
      margin-bottom: 3mm;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 1.5mm;
    }
    .lib-title {
      font-size: 11pt;
      font-weight: bold;
      color: #065f46;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .sheet-sub {
      font-size: 8pt;
      color: #475569;
      margin-top: 0.5mm;
    }
    .labels-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-auto-rows: 35mm;
      gap: 3mm 4mm;
      width: 100%;
      flex-grow: 1;
    }
    .sticker-cell {
      width: 100%;
      height: 35mm;
      display: flex;
      align-items: center;
      justify-content: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .label-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    .sheet-footer {
      text-align: center;
      font-size: 7pt;
      color: #94a3b8;
      margin-top: 2mm;
      border-top: 0.5px solid #e2e8f0;
      padding-top: 1mm;
    }
    @media screen {
      body {
        background: #e2e8f0;
        padding: 20px 10px;
      }
      .sheet-page {
        background: #ffffff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border-radius: 4px;
        margin-bottom: 20px;
      }
      .screen-toolbar {
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 9999;
        display: flex;
        gap: 8px;
      }
      .print-btn {
        background: #059669;
        color: #ffffff;
        border: none;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: bold;
        border-radius: 6px;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      }
      .close-btn {
        background: #334155;
        color: #ffffff;
        border: none;
        padding: 8px 14px;
        font-size: 13px;
        border-radius: 6px;
        cursor: pointer;
      }
    }
    @media print {
      .screen-toolbar {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="screen-toolbar no-print">
    <button class="print-btn" onclick="window.print()">🖨️ Print Sticker Sheet</button>
    <button class="close-btn" onclick="window.close()">✕ Close</button>
  </div>
  ${pagesHtml}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 400);
    };
  </script>
</body>
</html>
  `;

  // 1. Try hidden iframe printing first (instant, non-blocking, reliable)
  try {
    const existingIframe = document.getElementById('plims-barcode-print-iframe');
    if (existingIframe) {
      document.body.removeChild(existingIframe);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'plims-barcode-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(printDocumentHtml);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print error, falling back to window.open or window.print:', e);
          window.print();
        }
      }, 500);
      return;
    }
  } catch (err) {
    console.warn('Could not use print iframe, trying fallback:', err);
  }

  // Fallback to window.print() directly
  window.print();
};

