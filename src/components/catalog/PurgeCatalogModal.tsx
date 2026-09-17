import React, { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  CheckCircle,
  Database,
  Layers,
  BookOpen,
  X,
  PlusCircle,
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react';

interface PurgeCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalCatalogCount?: number;
  totalRecordsCount?: number;
  customBooksCount: number;
  copiesCount?: number;
  isReferenceActive: boolean;
  onPurgeAllToCleanSlate: () => void;
  onPurgeCustomOnly: () => void;
  onRestoreReferenceCatalog: () => void;
  onOpenHoldingsBuilder?: () => void;
}

export const PurgeCatalogModal: React.FC<PurgeCatalogModalProps> = ({
  isOpen,
  onClose,
  totalCatalogCount,
  totalRecordsCount,
  customBooksCount,
  copiesCount,
  isReferenceActive,
  onPurgeAllToCleanSlate,
  onPurgeCustomOnly,
  onRestoreReferenceCatalog,
  onOpenHoldingsBuilder
}) => {
  const effectiveTotalCount =
    totalCatalogCount ?? totalRecordsCount ?? (isReferenceActive ? 300000 + customBooksCount : customBooksCount);
  const effectiveCopiesCount = copiesCount ?? Math.round(effectiveTotalCount * 2.2);

  const [selectedMode, setSelectedMode] = useState<'WIPE_TO_ZERO' | 'PURGE_CUSTOM_ONLY' | 'RESTORE_REFERENCE'>('WIPE_TO_ZERO');
  const [confirmInput, setConfirmInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecute = () => {
    setIsExecuting(true);
    setSuccessMessage(null);

    // Fast asynchronous execution (under 1 second)
    setTimeout(() => {
      if (selectedMode === 'WIPE_TO_ZERO') {
        onPurgeAllToCleanSlate();
        setSuccessMessage('Library catalog completely purged to 0 records! A clean slate is now active.');
      } else if (selectedMode === 'PURGE_CUSTOM_ONLY') {
        onPurgeCustomOnly();
        setSuccessMessage('Custom ingested records and holdings ledger have been purged successfully.');
      } else if (selectedMode === 'RESTORE_REFERENCE') {
        onRestoreReferenceCatalog();
        setSuccessMessage('Default 300,000 (3.0 Lakhs) university reference catalog restored successfully.');
      }

      setIsExecuting(false);
      setConfirmInput('');

      // Auto close after brief display, or librarian can choose next step
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    }, 450);
  };

  const isConfirmed =
    selectedMode === 'RESTORE_REFERENCE' ||
    confirmInput.trim().toUpperCase() === 'DELETE' ||
    confirmInput.trim().toUpperCase() === 'PURGE';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 max-w-xl w-full space-y-5 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Purge & Reset Library Catalog
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Remove records instantly (&lt;1 minute) to establish a fresh slate for custom holdings (up to 3 Lakhs)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Message Banner */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2.5 animate-in fade-in">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Mode Selector Cards */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Select Purge / Reset Action:
          </div>

          {/* Option 1: Clean Slate (Wipe to 0) */}
          <div
            onClick={() => setSelectedMode('WIPE_TO_ZERO')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              selectedMode === 'WIPE_TO_ZERO'
                ? 'bg-red-50/70 border-red-300 ring-2 ring-red-500/20 shadow-sm'
                : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={selectedMode === 'WIPE_TO_ZERO'}
                  onChange={() => setSelectedMode('WIPE_TO_ZERO')}
                  className="accent-red-600 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-900">
                  Wipe Entire Catalog to Clean Slate (0 Records)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                Instant Clean Slate
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 pl-5">
              Permanently purges all current records from memory and unlimited storage. Leaves an empty database (0 Books, 0 Copies) so your librarian team can build your institution's catalog of up to 3 Lakhs books.
            </p>
          </div>

          {/* Option 2: Purge Custom Holdings Only */}
          <div
            onClick={() => setSelectedMode('PURGE_CUSTOM_ONLY')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              selectedMode === 'PURGE_CUSTOM_ONLY'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-sm'
                : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={selectedMode === 'PURGE_CUSTOM_ONLY'}
                  onChange={() => setSelectedMode('PURGE_CUSTOM_ONLY')}
                  className="accent-amber-600 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-900">
                  Purge Custom Ingested Records Only ({customBooksCount.toLocaleString()} Titles)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                Custom Only
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 pl-5">
              Clears only manually added or imported books and physical copy holdings, retaining the reference benchmark catalog if active.
            </p>
          </div>

          {/* Option 3: Restore 300k Benchmark Catalog */}
          <div
            onClick={() => setSelectedMode('RESTORE_REFERENCE')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              selectedMode === 'RESTORE_REFERENCE'
                ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-sm'
                : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={selectedMode === 'RESTORE_REFERENCE'}
                  onChange={() => setSelectedMode('RESTORE_REFERENCE')}
                  className="accent-blue-600 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-900">
                  Restore Default 300,000 (3.0 Lakhs) Benchmark Catalog
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                Benchmark Mode
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 pl-5">
              Re-activates the complete 300,000 academic titles and ~660,000 copy ledger across all 10 Dewey Decimal classes.
            </p>
          </div>
        </div>

        {/* Current Database Summary */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-600">
            <span>Currently Active Titles:</span>
            <span className="font-mono font-bold text-slate-900">
              {effectiveTotalCount.toLocaleString()} Titles
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Custom Librarian Records:</span>
            <span className="font-mono font-bold text-slate-900">
              {customBooksCount.toLocaleString()} Titles ({effectiveCopiesCount.toLocaleString()} Copies)
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Unlimited Storage Engine:</span>
            <span className="font-semibold text-emerald-600">IndexedDB 64-bit Active</span>
          </div>
        </div>

        {/* Confirmation Input for Destructive Modes */}
        {selectedMode !== 'RESTORE_REFERENCE' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Type <span className="font-mono text-red-600 font-bold">DELETE</span> or{' '}
              <span className="font-mono text-red-600 font-bold">PURGE</span> to confirm execution:
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={confirmInput}
                onChange={e => setConfirmInput(e.target.value)}
                placeholder="Type DELETE or PURGE"
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-red-500"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setConfirmInput('DELETE')}
                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold cursor-pointer"
                title="Quick Fill"
              >
                Auto-fill
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecute}
            disabled={!isConfirmed || isExecuting}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-md ${
              isConfirmed && !isExecuting
                ? selectedMode === 'RESTORE_REFERENCE'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {selectedMode === 'RESTORE_REFERENCE' ? (
              <>
                <RotateCcw className={`h-4 w-4 ${isExecuting ? 'animate-spin' : ''}`} />
                <span>{isExecuting ? 'Restoring...' : 'Restore 300k Benchmark Catalog'}</span>
              </>
            ) : (
              <>
                <Trash2 className={`h-4 w-4 ${isExecuting ? 'animate-spin' : ''}`} />
                <span>{isExecuting ? 'Purging in Seconds...' : 'Execute Purge Now (<1 Min)'}</span>
              </>
            )}
          </button>
        </div>

        {/* Post-Purge Guidance */}
        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-[11px] text-emerald-900 flex items-start space-x-2">
          <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <p>
            <span className="font-bold">After Purge:</span> Any librarian can immediately add holding books based on institutional needs (up to 3 Lakhs / 300,000 titles) using Voice-to-MARC, AI Cover Scanner, Bulk File Ingestion, or the Rapid Holdings Builder tool.
          </p>
        </div>
      </div>
    </div>
  );
};
