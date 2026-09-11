import React, { useState } from 'react';
import {
  Grid,
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
  Download,
  Layers,
  Sparkles,
  BookOpen
} from 'lucide-react';
import {
  LabelItemData,
  LabelRenderOptions,
  downloadMultiTitlePdfSheet
} from './barcodeLabelRenderer';
import { generateQrMatrix } from '../../utils/qrBarcodeGenerator';

interface BarcodeBatchSheetGridProps {
  items: LabelItemData[];
  options: LabelRenderOptions;
  onPrint: () => void;
  onDownloadPdf: () => void;
  onDownloadZip?: () => void;
  isZipDownloading?: boolean;
}

export const BarcodeBatchSheetGrid: React.FC<BarcodeBatchSheetGridProps> = ({
  items,
  options,
  onPrint,
  onDownloadPdf,
  onDownloadZip,
  isZipDownloading
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const labelsPerPage = 21; // 7 rows x 3 columns standard A4 sticker sheet
  const totalPages = Math.max(1, Math.ceil(items.length / labelsPerPage));

  const startIdx = currentPage * labelsPerPage;
  const currentItems = items.slice(startIdx, startIdx + labelsPerPage);

  return (
    <div className="p-6 rounded-2xl border border-emerald-500/50 bg-[#121214] space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a] pb-4">
        <div>
          <h3 className="text-sm font-bold text-[#fafafa] flex items-center space-x-2">
            <Grid className="h-5 w-5 text-emerald-400" />
            <span>A4 Printable Sticker Sheet Preview (21 Labels / Sheet)</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {items.length} Total Titles
            </span>
          </h3>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Showing Page {currentPage + 1} of {totalPages} ({currentItems.length} labels on this sheet)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center space-x-1 bg-[#09090b] border border-[#27272a] rounded-xl p-1">
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                className="p-1 rounded-lg text-[#a1a1aa] hover:text-white disabled:opacity-30 cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-mono font-bold text-[#fafafa] px-2">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                className="p-1 rounded-lg text-[#a1a1aa] hover:text-white disabled:opacity-30 cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {onDownloadZip && (
            <button
              type="button"
              onClick={onDownloadZip}
              disabled={isZipDownloading || items.length === 0}
              className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isZipDownloading ? 'Packaging ZIP...' : 'Download ZIP (PNGs)'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onDownloadPdf}
            className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Download Multi-Title PDF</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print All Sticker Sheets</span>
          </button>
        </div>
      </div>

      {/* 21-Label Interactive Sheet Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 bg-slate-200 p-6 rounded-2xl text-black">
        {currentItems.map((item, idx) => {
          const qr = generateQrMatrix(item.code);
          return (
            <div
              key={`${item.id}-${idx}`}
              className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-sm flex flex-col items-center text-center space-y-1.5 transition-all hover:shadow-md hover:border-emerald-500"
            >
              {options.showInstitution && (
                <div className="text-[8px] font-extrabold text-emerald-800 uppercase truncate max-w-full">
                  {options.libraryName}
                </div>
              )}

              {options.showTitle && (
                <div className="text-[10px] font-bold text-slate-900 line-clamp-1 max-w-full">
                  {item.title}
                </div>
              )}

              {options.showCallNo && (
                <div className="text-[9px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                  {item.callNo}
                </div>
              )}

              <div className="flex items-center justify-center gap-2 my-1">
                {/* Genuine QR preview */}
                <svg width="42" height="42" viewBox={`0 0 ${qr.length} ${qr.length}`}>
                  {qr.map((row, rIdx) =>
                    row.map((cell, cIdx) =>
                      cell ? (
                        <rect
                          key={`${rIdx}-${cIdx}`}
                          x={cIdx}
                          y={rIdx}
                          width="1"
                          height="1"
                          fill="#000"
                        />
                      ) : null
                    )
                  )}
                </svg>
              </div>

              {options.showAccession && (
                <div className="text-[9px] font-mono font-extrabold text-slate-900 tracking-wider">
                  *{item.code}*
                </div>
              )}
            </div>
          );
        })}

        {/* Empty slots placeholders up to 21 if on single sheet */}
        {currentItems.length < 9 &&
          Array.from({ length: 9 - currentItems.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 text-center min-h-[140px]"
            >
              <BookOpen className="h-5 w-5 opacity-40 mb-1" />
              <span className="text-[10px] font-medium">Sticker Slot {currentItems.length + i + 1}</span>
            </div>
          ))}
      </div>
    </div>
  );
};
