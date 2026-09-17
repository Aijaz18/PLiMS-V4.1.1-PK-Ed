import React, { useState } from 'react';
import {
  Download,
  X,
  FileSpreadsheet,
  FileCode,
  FileText,
  Database,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Copy
} from 'lucide-react';
import { BookRecord, BookCopy } from '../../types/alims';
import { DDC_FACETS, TOTAL_CATALOG_TARGET } from '../../services/catalog300kEngine';
import {
  executeHoldingsExport,
  ExportFormat,
  ExportScope,
  ExportProgress,
  downloadSampleHoldingsTemplate
} from '../../services/holdingsIOEngine';

interface HighCapacityExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  customBooks: BookRecord[];
  filteredBooks: BookRecord[];
  existingCopies: BookCopy[];
  activeDdcFilter: string;
}

export const HighCapacityExportModal: React.FC<HighCapacityExportModalProps> = ({
  isOpen,
  onClose,
  customBooks,
  filteredBooks,
  existingCopies,
  activeDdcFilter
}) => {
  const [scope, setScope] = useState<ExportScope>('ALL_300K');
  const [format, setFormat] = useState<ExportFormat>('CSV');
  const [ddcDiscipline, setDdcDiscipline] = useState<string>(activeDdcFilter !== 'ALL' ? activeDdcFilter : '000');
  const [limitCount, setLimitCount] = useState<number>(5000);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [exportComplete, setExportComplete] = useState<{ filename: string; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgress({ processed: 0, total: limitCount, percentage: 0, currentAction: 'Initializing streaming export...' });
    setErrorMsg(null);
    setExportComplete(null);

    try {
      const result = await executeHoldingsExport({
        scope,
        format,
        limitCount,
        ddcDiscipline,
        customBooks,
        filteredBooks,
        existingCopies,
        onProgress: p => setProgress(p)
      });
      setExportComplete({ filename: result.filename, total: result.totalExported });
    } catch (err: any) {
      console.error('Export error:', err);
      setErrorMsg(err?.message || 'Failed to complete export operation.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/40 text-[11px] font-bold tracking-wide uppercase text-blue-200">
                Unlimited 300,000+ Titles / 6.6L Holdings
              </span>
            </div>
            <h2 className="text-xl font-bold flex items-center space-x-2">
              <Download className="h-5 w-5 text-blue-300" />
              <span>Export Holdings & Bibliographic Catalog</span>
            </h2>
            <p className="text-xs text-blue-100 max-w-lg">
              Stream and export large-scale MARC21/RDA records across 10 DDC disciplines with physical copies ledger.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Step 1: Select Export Scope */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
              <Layers className="h-4 w-4 text-blue-600" />
              <span>1. Choose Export Scope</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setScope('ALL_300K')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  scope === 'ALL_300K'
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">All 300,000 Titles (3.0 Lakhs)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                    Full Catalog
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Complete institution collection across all 10 Dewey Decimal classes.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScope('DDC_DISCIPLINE')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  scope === 'DDC_DISCIPLINE'
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Specific DDC Discipline</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
                    10 Disciplines
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Filter by Computer Science, Shariah/Religion, Law, Medicine, or Literature.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScope('HOLDINGS_LEDGER')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  scope === 'HOLDINGS_LEDGER'
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Physical Holdings & Accessions Ledger</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                    ~660k Copies
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Detailed copy barcodes, shelf locations, accession numbers, and statuses.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScope('CUSTOM_INGESTED')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  scope === 'CUSTOM_INGESTED'
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Librarian Custom Records</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    {customBooks.length} Ingested
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Titles manually added, ingested via Voice-to-MARC, or AI Cover Scanner.
                </p>
              </button>
            </div>

            {/* DDC Discipline Selector if DDC_DISCIPLINE is active */}
            {scope === 'DDC_DISCIPLINE' && (
              <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Select Dewey Decimal Discipline:</label>
                <select
                  value={ddcDiscipline}
                  onChange={e => setDdcDiscipline(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  {DDC_FACETS.filter(f => f.code !== 'ALL').map(facet => (
                    <option key={facet.code} value={facet.code}>
                      {facet.code} - {facet.name} ({facet.count.toLocaleString()} titles)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Step 2: Select Format */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
              <FileText className="h-4 w-4 text-indigo-600" />
              <span>2. Select Export Format</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat('CSV')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                  format === 'CSV'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <div>
                  <p className="text-xs">CSV Spreadsheet</p>
                  <p className="text-[10px] text-slate-400 font-normal">Excel / Sheets</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('MARC21')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                  format === 'MARC21'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <FileCode className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-xs">MARC21 (.mrc)</p>
                  <p className="text-[10px] text-slate-400 font-normal">ISO 2709 Library</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('MARCXML')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                  format === 'MARCXML'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <FileCode className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs">MARCXML (.xml)</p>
                  <p className="text-[10px] text-slate-400 font-normal">LoC Standard</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('EXCEL')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                  format === 'EXCEL'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs">Excel (.xlsx)</p>
                  <p className="text-[10px] text-slate-400 font-normal">Worksheet book</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('JSON')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                  format === 'JSON'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <FileCode className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-xs">JSON Schema</p>
                  <p className="text-[10px] text-slate-400 font-normal">Interchange API</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormat('HOLDINGS_LEDGER_CSV');
                  setScope('HOLDINGS_LEDGER');
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                  format === 'HOLDINGS_LEDGER_CSV'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <Copy className="h-4 w-4 text-rose-600" />
                <div>
                  <p className="text-xs">Holdings Ledger</p>
                  <p className="text-[10px] text-slate-400 font-normal">Accessions & Barcodes</p>
                </div>
              </button>
            </div>
          </div>

          {/* Step 3: Select Batch Volume / Limit */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Database className="h-4 w-4 text-amber-600" />
                <span>3. Select Record Volume Batch</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Limit: {limitCount.toLocaleString()} titles
              </span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { label: '1,000', value: 1000, desc: 'Quick sample' },
                { label: '5,000', value: 5000, desc: 'Department' },
                { label: '25,000', value: 25000, desc: 'Faculty' },
                { label: '50,000', value: 50000, desc: 'Major Class' },
                { label: 'All (300k)', value: 300000, desc: 'Complete' }
              ].map(item => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setLimitCount(item.value)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    limitCount === item.value
                      ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-800 bg-white'
                  }`}
                >
                  <p className="text-xs font-mono font-bold">{item.label}</p>
                  <p className={`text-[9px] ${limitCount === item.value ? 'text-blue-100' : 'text-slate-400'}`}>
                    {item.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Progress Indicator */}
          {isExporting && progress && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                <span className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span>{progress.currentAction}</span>
                </span>
                <span className="font-mono font-bold text-blue-700">{progress.percentage}%</span>
              </div>
              <div className="w-full bg-blue-200/80 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-200"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-blue-600 font-mono">
                <span>Processed: {progress.processed.toLocaleString()} records</span>
                <span>Target: {progress.total.toLocaleString()} records</span>
              </div>
            </div>
          )}

          {/* Success Notification */}
          {exportComplete && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <p className="font-bold">Export Successfully Triggered!</p>
                <p className="text-emerald-700 font-mono">
                  File: <span className="font-semibold">{exportComplete.filename}</span> ({exportComplete.total.toLocaleString()} records exported)
                </p>
                <p className="text-[11px] text-emerald-600 pt-1">
                  Check your browser downloads folder. The file has been streamed cleanly without memory bottleneck.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-center space-x-3 text-xs">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sample Templates Quick-Link */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500">
            <span className="font-medium">Download sample templates:</span>
            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
              <button
                type="button"
                onClick={() => downloadSampleHoldingsTemplate('CSV')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium cursor-pointer"
              >
                Sample CSV
              </button>
              <button
                type="button"
                onClick={() => downloadSampleHoldingsTemplate('HOLDINGS_LEDGER')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium cursor-pointer"
              >
                Holdings Ledger CSV
              </button>
              <button
                type="button"
                onClick={() => downloadSampleHoldingsTemplate('MARCXML')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium cursor-pointer"
              >
                Sample MARCXML
              </button>
              <button
                type="button"
                onClick={() => downloadSampleHoldingsTemplate('JSON')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium cursor-pointer"
              >
                Sample JSON
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/80 transition-all cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleStartExport}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Streaming Data...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Start Fast Export ({limitCount.toLocaleString()} Titles)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
