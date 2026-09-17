import React, { useState } from 'react';
import {
  BookOpen,
  PlusCircle,
  Layers,
  Sparkles,
  CheckCircle,
  Building2,
  Barcode,
  Hash,
  X,
  Play,
  ArrowRight,
  Database,
  UploadCloud,
  Mic,
  Camera
} from 'lucide-react';
import { BookRecord, BookCopy } from '../../types/alims';
import {
  generateInstitutionalHoldingsBatch,
  GenerateHoldingsOptions,
  DDC_FACETS
} from '../../services/catalog300kEngine';
import { idbSaveUnlimited } from '../../services/offlineStorage';

interface LibrarianHoldingsBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHoldings: (newBooks: BookRecord[], newCopies: BookCopy[]) => void;
  currentCatalogCount: number;
}

const PRESET_VOLUMES = [
  { label: '3.0 Lakhs (300,000 Titles)', value: 300000, desc: 'Full University Mega Library' },
  { label: '1.0 Lakh (100,000 Titles)', value: 100000, desc: 'Major Institutional Campus' },
  { label: '50,000 Titles', value: 50000, desc: 'College / Postgraduate Library' },
  { label: '25,000 Titles', value: 25000, desc: 'Departmental Faculty Collection' },
  { label: '10,000 Titles', value: 10000, desc: 'Targeted Branch Library' },
  { label: '2,500 Titles', value: 2500, desc: 'Rapid Test Seed Collection' },
  { label: '1,000 Titles', value: 1000, desc: 'Starter Curated Batch' }
];

const DISCIPLINE_PRESETS = [
  { code: 'ALL', name: 'Balanced University Library (All 10 DDC Disciplines)' },
  { code: '200', name: 'Shariah, Islamic Jurisprudence & Quranic Sciences (200 DDC)' },
  { code: '300', name: 'Pakistani Law, Constitution, Legal Precedents & Social Sciences (300 DDC)' },
  { code: '000', name: 'Computer Science, Artificial Intelligence & Cybersecurity (000 DDC)' },
  { code: '600', name: 'Technology, Engineering, Clinical Medicine & Health (600 DDC)' },
  { code: '500', name: 'Natural Sciences, Physics, Chemistry & Pure Mathematics (500 DDC)' },
  { code: '800', name: 'Literature, Urdu Adab, Iqbaliyat & World Classics (800 DDC)' },
  { code: '900', name: 'History, Pakistan Studies & Regional Geopolitics (900 DDC)' },
  { code: '100', name: 'Philosophy, Logic, Ethics & Applied Psychology (100 DDC)' },
  { code: '700', name: 'Arts, Architecture, Islamic Calligraphy & Design (700 DDC)' }
];

export const LibrarianHoldingsBuilderModal: React.FC<LibrarianHoldingsBuilderModalProps> = ({
  isOpen,
  onClose,
  onAddHoldings,
  currentCatalogCount
}) => {
  const [targetVolume, setTargetVolume] = useState<number>(10000);
  const [customVolumeInput, setCustomVolumeInput] = useState<string>('10000');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [copiesPerTitle, setCopiesPerTitle] = useState<number>(2);
  const [branchName, setBranchName] = useState<string>('Central Academic Library - Main Stacks');
  const [accessionPrefix, setAccessionPrefix] = useState<string>('LIB-2026-ACC-');
  const [barcodePrefix, setBarcodePrefix] = useState<string>('BC-');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [currentActionNotice, setCurrentActionNotice] = useState('');
  const [generationSummary, setGenerationSummary] = useState<{
    totalTitles: number;
    totalCopies: number;
    timeSeconds: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (vol: number) => {
    setTargetVolume(vol);
    setCustomVolumeInput(String(vol));
  };

  const handleCustomVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomVolumeInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setTargetVolume(Math.min(300000, parsed));
    }
  };

  // Start fast batch ingestion
  const handleStartGeneration = async () => {
    setIsGenerating(true);
    setProgressPercent(0);
    setProcessedCount(0);
    setGenerationSummary(null);
    setCurrentActionNotice('Initializing high-speed institutional synthesis engine...');

    const startTime = performance.now();
    const count = targetVolume;
    const chunkSize = Math.min(2500, Math.max(500, Math.floor(count / 10)));
    let accumulatedBooks: BookRecord[] = [];
    let accumulatedCopies: BookCopy[] = [];

    let generatedSoFar = 0;

    const runChunk = () => {
      const remaining = count - generatedSoFar;
      const thisBatchSize = Math.min(chunkSize, remaining);

      setCurrentActionNotice(
        `Synthesizing batch ${generatedSoFar.toLocaleString()} to ${(
          generatedSoFar + thisBatchSize
        ).toLocaleString()} of ${count.toLocaleString()}...`
      );

      const batch = generateInstitutionalHoldingsBatch({
        count: thisBatchSize,
        discipline: selectedDiscipline,
        copiesPerTitle,
        branchName,
        accessionPrefix,
        barcodePrefix,
        startingIndex: currentCatalogCount + generatedSoFar
      });

      accumulatedBooks = accumulatedBooks.concat(batch.books);
      accumulatedCopies = accumulatedCopies.concat(batch.copies);
      generatedSoFar += thisBatchSize;

      const pct = Math.min(99, Math.round((generatedSoFar / count) * 100));
      setProgressPercent(pct);
      setProcessedCount(generatedSoFar);

      if (generatedSoFar < count) {
        setTimeout(runChunk, 16);
      } else {
        // Complete
        setCurrentActionNotice('Committing holdings to Unlimited IndexedDB database...');
        setProgressPercent(100);

        // Async save to IndexedDB to guarantee unlimited persistence
        idbSaveUnlimited('pslims_db_books', accumulatedBooks).catch(() => {});
        idbSaveUnlimited('pslims_db_copies', accumulatedCopies).catch(() => {});

        // Pass to parent state
        onAddHoldings(accumulatedBooks, accumulatedCopies);

        const endTime = performance.now();
        const durationSec = Math.round(((endTime - startTime) / 1000) * 10) / 10;

        setIsGenerating(false);
        setGenerationSummary({
          totalTitles: accumulatedBooks.length,
          totalCopies: accumulatedCopies.length,
          timeSeconds: durationSec
        });
      }
    };

    setTimeout(runChunk, 50);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/90 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  Provision Holdings on Institution Needs
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  Up to 3.0 Lakhs (300,000)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Allows any librarian to rapidly generate or build holding books tailored to university departments and shelf locations.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Success Banner if complete */}
          {generationSummary && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <span className="text-sm font-bold">
                  Successfully Ingested {generationSummary.totalTitles.toLocaleString()} Titles &{' '}
                  {generationSummary.totalCopies.toLocaleString()} Physical Holdings!
                </span>
              </div>
              <p className="text-xs text-emerald-700">
                Processed in {generationSummary.timeSeconds}s. Records are active in the catalog and saved in unlimited IndexedDB storage.
              </p>
              <div className="pt-1 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-sm transition-all"
                >
                  View Holdings in Catalog Now
                </button>
              </div>
            </div>
          )}

          {/* Target Volume Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Select Target Volume Needed (Up to 3 Lakhs):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_VOLUMES.slice(0, 4).map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleSelectPreset(p.value)}
                  disabled={isGenerating}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    targetVolume === p.value
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold">{p.label.split('(')[0]}</div>
                  <div className="text-[10px] text-slate-500 font-normal">{p.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <span className="text-slate-600 text-xs shrink-0 font-medium">Or custom titles count:</span>
              <input
                type="number"
                min="10"
                max="300000"
                value={customVolumeInput}
                onChange={handleCustomVolumeChange}
                disabled={isGenerating}
                placeholder="e.g. 50000 or 300000"
                className="w-36 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-slate-400 text-[11px]">(Max: 300,000 / 3.0 Lakhs)</span>
            </div>
          </div>

          {/* Academic Discipline Focus */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Academic Discipline & Faculty Focus:
            </label>
            <select
              value={selectedDiscipline}
              onChange={e => setSelectedDiscipline(e.target.value)}
              disabled={isGenerating}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
            >
              {DISCIPLINE_PRESETS.map(d => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Physical Holdings & Copy Ledger Parameters */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Building2 className="h-4 w-4 text-emerald-600" />
              <span>3. Physical Copy Ledger & Branch Configuration:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Copies per Title:
                </label>
                <select
                  value={copiesPerTitle}
                  onChange={e => setCopiesPerTitle(parseInt(e.target.value, 10))}
                  disabled={isGenerating}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900"
                >
                  <option value={1}>1 Copy per Title</option>
                  <option value={2}>2 Copies per Title (Circulation + Reference)</option>
                  <option value={3}>3 Copies per Title</option>
                  <option value={4}>4 Copies per Title</option>
                  <option value={5}>5 Copies per Title</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Accession Prefix:
                </label>
                <input
                  type="text"
                  value={accessionPrefix}
                  onChange={e => setAccessionPrefix(e.target.value)}
                  disabled={isGenerating}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                  placeholder="ACC-"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Barcode Prefix:
                </label>
                <input
                  type="text"
                  value={barcodePrefix}
                  onChange={e => setBarcodePrefix(e.target.value)}
                  disabled={isGenerating}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                  placeholder="BC-"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Branch / Campus Location:
              </label>
              <input
                type="text"
                value={branchName}
                onChange={e => setBranchName(e.target.value)}
                disabled={isGenerating}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900"
                placeholder="e.g. Central Academic Library, Law Faculty Branch, etc."
              />
            </div>

            {/* Calculated Holding Volume */}
            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200">
              <span>Estimated Physical Copies to Generate:</span>
              <span className="font-mono font-bold text-emerald-700">
                {(targetVolume * copiesPerTitle).toLocaleString()} Physical Holdings
              </span>
            </div>
          </div>

          {/* Active Generation Progress Bar */}
          {isGenerating && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600 animate-spin" />
                  <span>Synthesizing Holdings at High Speed...</span>
                </span>
                <span className="font-mono">{progressPercent}%</span>
              </div>
              <div className="w-full bg-emerald-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full transition-all duration-150"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-emerald-700">
                <span>{currentActionNotice}</span>
                <span className="font-mono font-semibold">
                  {processedCount.toLocaleString()} / {targetVolume.toLocaleString()} titles
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-all"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleStartGeneration}
            disabled={isGenerating || targetVolume <= 0}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-md ${
              !isGenerating && targetVolume > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Play className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>
              {isGenerating
                ? 'Ingesting Holdings...'
                : `Provision ${targetVolume.toLocaleString()} Titles (${(
                    targetVolume * copiesPerTitle
                  ).toLocaleString()} Holdings)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
