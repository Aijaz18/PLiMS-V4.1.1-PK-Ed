import React, { useState, useRef } from 'react';
import {
  X,
  FileCode,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  ArrowRight,
  Layers,
  ChevronLeft,
  ChevronRight,
  Download,
  Info
} from 'lucide-react';
import { BookRecord, BookCopy } from '../../types/alims';
import {
  ParsedMarcRecord,
  parseUniversalMarcFile,
  parseRawMarcText,
  convertMarcRecordToBook,
  SAMPLE_MARC21_DEMO_TEXT
} from '../../services/marc21Parser';
import { downloadSampleHoldingsTemplate } from '../../services/holdingsIOEngine';

interface ImportMarcModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInEditor?: (record: ParsedMarcRecord) => void;
  onSaveDirectly?: (book: BookRecord, copies: BookCopy[]) => void;
  onBulkSaveDirectly?: (books: BookRecord[], copies: BookCopy[]) => void;
  defaultBranch?: string;
}

export const ImportMarcModal: React.FC<ImportMarcModalProps> = ({
  isOpen,
  onClose,
  onOpenInEditor,
  onSaveDirectly,
  onBulkSaveDirectly,
  defaultBranch = 'Central Academic Library'
}) => {
  const [tab, setTab] = useState<'UPLOAD' | 'PASTE'>('UPLOAD');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [parsedRecords, setParsedRecords] = useState<ParsedMarcRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [copiesPerTitle, setCopiesPerTitle] = useState<number>(2);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedRaw, setCopiedRaw] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const currentRecord: ParsedMarcRecord | undefined = parsedRecords[currentIndex];

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

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsProcessing(true);

    try {
      const records = await parseUniversalMarcFile(file);
      if (records.length === 0) {
        throw new Error(`No valid MARC21 / ISO 2709 / MARCXML records could be identified in "${file.name}".`);
      }
      setParsedRecords(records);
      setCurrentIndex(0);
      setSuccessMsg(`Successfully parsed ${records.length} MARC21 bibliographic ${records.length === 1 ? 'record' : 'records'} from ${file.name}`);
    } catch (err: any) {
      console.warn('MARC parsing notice:', err);
      setErrorMsg(err.message || 'Failed to parse MARC file.');
      setParsedRecords([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParseRawText = () => {
    if (!rawText.trim()) {
      setErrorMsg('Please paste raw MARC text or MARCXML content.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsProcessing(true);

    try {
      const records = parseRawMarcText(rawText);
      if (records.length === 0) {
        throw new Error('Could not parse any MARC tags. Please verify format (=LDR or =245 or <record>).');
      }
      setParsedRecords(records);
      setCurrentIndex(0);
      setSuccessMsg(`Successfully parsed ${records.length} MARC21 bibliographic ${records.length === 1 ? 'record' : 'records'}`);
    } catch (err: any) {
      console.warn('Raw MARC parse notice:', err);
      setErrorMsg(err.message || 'Failed to parse text.');
      setParsedRecords([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = () => {
    setTab('PASTE');
    setRawText(SAMPLE_MARC21_DEMO_TEXT);
    setErrorMsg(null);
    setSuccessMsg(null);
    const records = parseRawMarcText(SAMPLE_MARC21_DEMO_TEXT);
    setParsedRecords(records);
    setCurrentIndex(0);
    setSuccessMsg('Loaded sample MARC21 bibliographic record for Library Automation & Cognitive Systems.');
  };

  const handleSendToEditor = () => {
    if (!currentRecord) return;
    if (onOpenInEditor) {
      onOpenInEditor(currentRecord);
    }
    onClose();
  };

  const handleSaveCurrent = () => {
    if (!currentRecord) return;
    const { book, copies } = convertMarcRecordToBook(currentRecord, currentIndex, {
      defaultBranch,
      copiesCount: copiesPerTitle,
      generateCopies: true
    });
    if (onSaveDirectly) {
      onSaveDirectly(book, copies);
    }
    onClose();
  };

  const handleSaveAllRecords = () => {
    if (parsedRecords.length === 0) return;
    const allBooks: BookRecord[] = [];
    const allCopies: BookCopy[] = [];

    parsedRecords.forEach((rec, idx) => {
      const { book, copies } = convertMarcRecordToBook(rec, idx, {
        defaultBranch,
        copiesCount: copiesPerTitle,
        generateCopies: true
      });
      allBooks.push(book);
      allCopies.push(...copies);
    });

    if (onBulkSaveDirectly) {
      onBulkSaveDirectly(allBooks, allCopies);
    } else if (onSaveDirectly) {
      allBooks.forEach((b, i) => {
        const bookCopies = allCopies.filter(c => c.bookId === b.id);
        onSaveDirectly(b, bookCopies);
      });
    }
    onClose();
  };

  const handleCopyRaw = () => {
    if (!currentRecord) return;
    let text = `=LDR  ${currentRecord.leader}\n`;
    for (const [tag, val] of Object.entries(currentRecord.controlFields)) {
      text += `=${tag}  ${val}\n`;
    }
    for (const df of currentRecord.dataFields) {
      const sfStr = df.subfields.map(s => `$${s.code}${s.value}`).join('');
      text += `=${df.tag}  ${df.ind1}${df.ind2}${sfStr}\n`;
    }
    navigator.clipboard.writeText(text);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#063a22] to-[#0a5231] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center text-emerald-300 shrink-0">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight">Import MARC21 Record</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  ISO-2709 & RDA
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Load international standard bibliographic records into cataloguing desk or inventory
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Mode Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-3 bg-slate-50 gap-4 shrink-0">
          <button
            type="button"
            onClick={() => setTab('UPLOAD')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 cursor-pointer ${
              tab === 'UPLOAD'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload File (.mrc, .mrk, .xml)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('PASTE')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 cursor-pointer ${
              tab === 'PASTE'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Paste Raw MARC Text / MARCXML</span>
          </button>

          <div className="ml-auto flex items-center space-x-2 pb-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="px-2.5 py-1 rounded-lg bg-emerald-100/70 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] border border-emerald-300 flex items-center space-x-1 cursor-pointer transition-all"
            >
              <Sparkles className="h-3 w-3 text-emerald-600" />
              <span>Load Sample Record</span>
            </button>

            <button
              type="button"
              onClick={() => downloadSampleHoldingsTemplate('MARC21')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] border border-slate-300 flex items-center space-x-1 cursor-pointer transition-all"
              title="Download standard .mrc sample file"
            >
              <Download className="h-3 w-3 text-slate-500" />
              <span>Sample .mrc</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: FILE UPLOAD */}
          {tab === 'UPLOAD' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".mrc,.marc,.marc21,.dat,.mrk,.xml,.marcxml,.txt,.json"
                className="hidden"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelected(e.target.files[0]);
                  }
                }}
              />

              <div
                onDragOver={handleDrag}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed text-center space-y-3 transition-all cursor-pointer ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                    : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100 hover:border-emerald-600'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">
                    Drop your MARC21 record file here or click to browse
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Supports <strong className="text-emerald-700">.mrc</strong> (ISO 2709 binary), <strong className="text-emerald-700">.mrk</strong> (MarcEdit mnemonic), <strong className="text-emerald-700">.xml</strong> (MARCXML), and <strong className="text-emerald-700">.marc21</strong>.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">ISO-2709 (.mrc)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">MarcEdit (.mrk)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">MARCXML (.xml)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">MARC-in-JSON</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE RAW TEXT */}
          {tab === 'PASTE' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold">Paste raw MARC21 format (=LDR, =245, etc.) or MARCXML:</span>
                <span className="text-[11px] text-slate-400">MarcEdit / Library of Congress format</span>
              </div>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder={`=LDR  00000nam a2200000 u 4500\n=020  \\\\$a9780132350884\n=100  1\\$aMartin, Robert C.\n=245  10$aClean code :$ba handbook of agile software craftsmanship\n=260  \\\\$aUpper Saddle River, NJ :$bPrentice Hall,$c2008\n=650  \\0$aComputer software$xDevelopment.`}
                rows={7}
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600"
              />
              <button
                type="button"
                onClick={handleParseRawText}
                disabled={isProcessing || !rawText.trim()}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Parse MARC21 Text</span>
              </button>
            </div>
          )}

          {/* PARSED RECORD INSPECTOR */}
          {currentRecord && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              {/* Record Selector if multiple */}
              {parsedRecords.length > 1 && (
                <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-xl text-xs text-slate-700">
                  <div className="flex items-center space-x-2 font-bold">
                    <Layers className="h-4 w-4 text-emerald-700" />
                    <span>Record {currentIndex + 1} of {parsedRecords.length}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      disabled={currentIndex === 0}
                      onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                      className="p-1 rounded bg-white hover:bg-slate-200 disabled:opacity-40 border border-slate-300 cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={currentIndex === parsedRecords.length - 1}
                      onClick={() => setCurrentIndex(i => Math.min(parsedRecords.length - 1, i + 1))}
                      className="p-1 rounded bg-white hover:bg-slate-200 disabled:opacity-40 border border-slate-300 cursor-pointer"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Bibliographic Summary Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded">
                      MARC21 Tag: 245
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {currentRecord.title} {currentRecord.subtitle ? `: ${currentRecord.subtitle}` : ''}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      By <strong>{currentRecord.authors.join(', ') || 'Unknown'}</strong> &bull; {currentRecord.publisher || 'Publisher'} ({currentRecord.publisherYear || '2024'})
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyRaw}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs flex items-center space-x-1 cursor-pointer shrink-0"
                    title="Copy raw MARC text"
                  >
                    {copiedRaw ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className="text-[10px]">Copy MARC</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-slate-400 block font-mono">020 (ISBN)</span>
                    <strong className="text-slate-800 truncate block">{currentRecord.isbn || 'N/A'}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-slate-400 block font-mono">082 (DDC)</span>
                    <strong className="text-slate-800 truncate block">{currentRecord.ddc || '000'}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-slate-400 block font-mono">090 (Call No)</span>
                    <strong className="text-slate-800 truncate block">{currentRecord.callNumber || 'N/A'}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-slate-400 block font-mono">300 (Pages)</span>
                    <strong className="text-slate-800 truncate block">{currentRecord.pageCount || 280} p.</strong>
                  </div>
                </div>

                {currentRecord.subjects.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-1">
                    <span className="text-[10px] font-mono text-emerald-800">650 Subjects:</span>
                    {currentRecord.subjects.map((s, idx) => (
                      <span key={idx} className="text-[10px] bg-white border border-emerald-200 px-1.5 py-0.5 rounded text-slate-700">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* MARC21 Raw Tags Table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>MARC21 Bibliographic Field Map</span>
                  <span className="text-[11px] font-mono text-slate-400">Leader: {currentRecord.leader}</span>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono">
                  <table className="w-full text-left">
                    <thead className="bg-slate-200 text-slate-700 sticky top-0 text-[10px]">
                      <tr>
                        <th className="py-1 px-2.5 w-14">Tag</th>
                        <th className="py-1 px-2 w-10">Ind</th>
                        <th className="py-1 px-2.5">Subfields & Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {/* Control fields */}
                      {Object.entries(currentRecord.controlFields).map(([tag, val]) => (
                        <tr key={tag} className="hover:bg-slate-100">
                          <td className="py-1 px-2.5 font-bold text-blue-600">{tag}</td>
                          <td className="py-1 px-2 text-slate-400">--</td>
                          <td className="py-1 px-2.5 text-slate-800">{val}</td>
                        </tr>
                      ))}
                      {/* Data fields */}
                      {currentRecord.dataFields.map((df, i) => (
                        <tr key={i} className="hover:bg-slate-100">
                          <td className="py-1 px-2.5 font-bold text-emerald-700">{df.tag}</td>
                          <td className="py-1 px-2 text-slate-500">{df.ind1}{df.ind2}</td>
                          <td className="py-1 px-2.5 text-slate-800 break-all">
                            {df.subfields.map((sf, sIdx) => (
                              <span key={sIdx} className="mr-1.5">
                                <span className="text-purple-600 font-bold">${sf.code}</span>
                                <span className="text-slate-900">{sf.value}</span>
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Physical Copies configuration */}
              <div className="flex items-center space-x-3 text-xs text-slate-600 pt-1">
                <span>Holdings copies to accession:</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={copiesPerTitle}
                  onChange={e => setCopiesPerTitle(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-16 px-2 py-1 rounded-lg border border-slate-300 font-bold text-slate-800 text-xs"
                />
                <span className="text-slate-400 text-[11px]">(at {defaultBranch})</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
          >
            Cancel
          </button>

          {currentRecord && (
            <div className="flex flex-wrap items-center gap-2">
              {parsedRecords.length > 1 && (
                <button
                  type="button"
                  onClick={handleSaveAllRecords}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Import All {parsedRecords.length} Records</span>
                </button>
              )}

              {onOpenInEditor && (
                <button
                  type="button"
                  onClick={handleSendToEditor}
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Open in MARC21 Editor</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveCurrent}
                className="px-5 py-2 rounded-xl bg-[#063a22] hover:bg-[#084a2c] text-white font-bold text-xs flex items-center space-x-1.5 shadow-md cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Save Directly to Catalogue</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
