import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  FileSpreadsheet,
  FileCode,
  FileText,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  ArrowRight,
  FolderUp
} from 'lucide-react';
import { BookRecord, BookCopy } from '../../types/alims';
import {
  parseAndIngestHoldingsFile,
  downloadSampleHoldingsTemplate,
  ExportProgress,
  ImportSummary
} from '../../services/holdingsIOEngine';
import { generateCatalogBookAtIndex, TOTAL_CATALOG_TARGET } from '../../services/catalog300kEngine';

interface HighCapacityImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (newBooks: BookRecord[], newCopies: BookCopy[]) => void;
}

export const HighCapacityImportModal: React.FC<HighCapacityImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [copiesPerTitle, setCopiesPerTitle] = useState<number>(2);
  const [defaultBranch, setDefaultBranch] = useState<string>('Central Library');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);
    setSummary(null);
  };

  const handleExecuteImport = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select a file to import.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setProgress({ processed: 0, total: 100, percentage: 5, currentAction: 'Reading upload file...' });

    try {
      const result = await parseAndIngestHoldingsFile(selectedFile, {
        autoCreatePhysicalCopies: true,
        copiesPerTitle,
        defaultBranch,
        onProgress: p => setProgress(p)
      });

      if (result.newBooks.length === 0) {
        throw new Error('No valid book records could be extracted from this file.');
      }

      onImportSuccess(result.newBooks, result.newCopies);
      setSummary(result.summary);
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMsg(err?.message || 'Failed to process file.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Instant seed generator for demonstration without requiring manual file upload
  const handleQuickSeedBatch = async (count: number) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setSummary(null);
    setProgress({ processed: 0, total: count, percentage: 5, currentAction: 'Generating academic titles...' });

    try {
      const startTime = Date.now();
      const generatedBooks: BookRecord[] = [];
      const generatedCopies: BookCopy[] = [];
      const disciplineCounts: Record<string, number> = {};

      const chunkSize = 500;
      for (let i = 0; i < count; i++) {
        const base = generateCatalogBookAtIndex((i * 13) % TOTAL_CATALOG_TARGET);
        const bookId = `bk_seeded_${Date.now()}_${i}`;
        const accNum = `ACC-SEED-${(100000 + i).toString()}`;

        const book: BookRecord = {
          ...base,
          id: bookId,
          accessionNumber: accNum,
          isCustomAdded: true,
          cataloguedDate: new Date().toISOString().split('T')[0]
        };

        generatedBooks.push(book);
        const lead = (book.ddcClassification || '000').charAt(0) + '00';
        disciplineCounts[lead] = (disciplineCounts[lead] || 0) + 1;

        for (let c = 1; c <= copiesPerTitle; c++) {
          generatedCopies.push({
            id: `copy_${bookId}_${c}`,
            bookId,
            accessionNumber: `${accNum}-C${c}`,
            barcode: `BC-SEED-${(100000 + generatedCopies.length + 1).toString()}`,
            branchLocation: defaultBranch,
            status: 'AVAILABLE'
          });
        }

        if (i % chunkSize === 0 || i === count - 1) {
          setProgress({
            processed: i + 1,
            total: count,
            percentage: Math.round(((i + 1) / count) * 100),
            currentAction: `Synthesized ${i + 1} / ${count} catalogued titles & ${generatedCopies.length} physical copies...`
          });
          await new Promise(r => setTimeout(r, 0));
        }
      }

      onImportSuccess(generatedBooks, generatedCopies);
      setSummary({
        totalBooks: generatedBooks.length,
        totalCopies: generatedCopies.length,
        timeTakenMs: Date.now() - startTime,
        disciplineCounts,
        sampleTitles: generatedBooks.slice(0, 5).map(b => b.title)
      });
    } catch (err: any) {
      console.error('Seeding error:', err);
      setErrorMsg(err?.message || 'Failed to seed records.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-[11px] font-bold tracking-wide uppercase text-emerald-200">
                Unlimited Storage Ingestion Engine
              </span>
            </div>
            <h2 className="text-xl font-bold flex items-center space-x-2">
              <UploadCloud className="h-5 w-5 text-emerald-300" />
              <span>Bulk Ingest Bibliographic Holdings</span>
            </h2>
            <p className="text-xs text-emerald-100 max-w-lg">
              Import thousands of books, MARC21/RDA records, and physical holdings directly into your unlimited IndexedDB database.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* File Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-8 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50/70 scale-[0.99]'
                : selectedFile
                ? 'border-blue-500 bg-blue-50/40'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.json,.xml,.marcxml,.mrc,.marc,.marc21,.dat,.mrk"
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelected(e.target.files[0]);
                }
              }}
            />

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-emerald-600">
              <FolderUp className="h-8 w-8" />
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 flex items-center justify-center space-x-1.5">
                  <span>Selected:</span>
                  <span className="text-blue-700 font-mono">{selectedFile.name}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Size: {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop another file to change
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  Drag and drop your spreadsheet or bibliographic file here
                </p>
                <p className="text-xs text-slate-500">
                  Supports CSV, Excel (.xlsx/.xls), MARCXML (.xml), MARC21 (.mrc), and JSON
                </p>
              </div>
            )}
          </div>

          {/* Holdings Ingestion Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Auto-Generate Copies Per Title:</label>
              <select
                value={copiesPerTitle}
                onChange={e => setCopiesPerTitle(parseInt(e.target.value, 10))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value={1}>1 Physical Copy</option>
                <option value={2}>2 Physical Copies (Recommended)</option>
                <option value={3}>3 Physical Copies</option>
                <option value={4}>4 Physical Copies</option>
                <option value={5}>5 Physical Copies</option>
              </select>
              <p className="text-[10px] text-slate-400">Generates unique accession numbers and barcodes.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Default Campus / Branch:</label>
              <select
                value={defaultBranch}
                onChange={e => setDefaultBranch(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="Central Library">Central Library</option>
                <option value="Law & Shariah Library">Law & Shariah Library</option>
                <option value="Medical & Health Sciences">Medical & Health Sciences</option>
                <option value="Engineering & IT Branch">Engineering & IT Branch</option>
                <option value="Digital Commons Stack">Digital Commons Stack</option>
              </select>
              <p className="text-[10px] text-slate-400">Assigned shelf location for physical copies.</p>
            </div>
          </div>

          {/* Quick-Seed Instant Generator (No file needed) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>Instant Ingestion Accelerator (Pre-built Academic Batches)</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                Unlimited DB Direct
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Don't have a spreadsheet right now? Ingest ready-to-circulate academic titles directly into your unlimited database with 1 click:
            </p>
            <div className="flex items-center space-x-2 pt-1 flex-wrap gap-y-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleQuickSeedBatch(1000)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                + Ingest 1,000 Titles
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleQuickSeedBatch(2500)}
                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                + Ingest 2,500 Titles
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleQuickSeedBatch(5000)}
                className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                + Ingest 5,000 Titles (~11k Copies)
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          {isProcessing && progress && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                <span className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  <span>{progress.currentAction}</span>
                </span>
                <span className="font-mono font-bold text-emerald-700">{progress.percentage}%</span>
              </div>
              <div className="w-full bg-emerald-200/80 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full transition-all duration-200"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-emerald-700 font-mono">
                <span>Ingested: {progress.processed.toLocaleString()}</span>
                <span>Total: {progress.total.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Summary Report */}
          {summary && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs flex-1">
                  <p className="font-bold text-sm">Batch Ingestion Completed Successfully!</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono">
                    <div className="p-2 rounded-xl bg-white border border-emerald-200">
                      <span className="text-[10px] text-slate-500 block">Titles Ingested</span>
                      <span className="text-sm font-bold text-emerald-800">{summary.totalBooks.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-emerald-200">
                      <span className="text-[10px] text-slate-500 block">Holdings Copies</span>
                      <span className="text-sm font-bold text-teal-800">{summary.totalCopies.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-emerald-200">
                      <span className="text-[10px] text-slate-500 block">Processing Speed</span>
                      <span className="text-sm font-bold text-slate-800">{(summary.timeTakenMs / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="text-[11px] text-emerald-700 font-semibold">Sample Ingested Titles:</p>
                    <ul className="list-disc pl-4 text-[11px] text-slate-700 space-y-0.5 pt-0.5">
                      {summary.sampleTitles.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-center space-x-3 text-xs">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sample Templates Quick-Link */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500">
            <span className="font-medium">Need import template files?</span>
            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
              <button
                type="button"
                onClick={() => downloadSampleHoldingsTemplate('CSV')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium cursor-pointer"
              >
                Download Sample CSV
              </button>
              <button
                type="button"
                onClick={() => downloadSampleHoldingsTemplate('HOLDINGS_LEDGER')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium cursor-pointer"
              >
                Download Holdings Ledger CSV
              </button>
              <button
                type="button"
                onClick={() => downloadSampleHoldingsTemplate('MARC21')}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold cursor-pointer"
              >
                Sample MARC21 (.mrc)
              </button>
              <button
                type="button"
                onClick={() => downloadSampleHoldingsTemplate('MARCXML')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium cursor-pointer"
              >
                Sample MARCXML (.xml)
              </button>
              <button
                type="button"
                onClick={() => downloadSampleHoldingsTemplate('JSON')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium cursor-pointer"
              >
                Download JSON Template
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/80 transition-all cursor-pointer"
          >
            {summary ? 'Finish & Return to Catalog' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={isProcessing || !selectedFile}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Ingesting Records...</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" />
                <span>Execute File Import</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
