import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  Globe,
  User,
  Building,
  Bookmark,
  Layers,
  Check,
  ChevronDown,
  ChevronUp,
  Sliders,
  HelpCircle,
  Copy
} from 'lucide-react';
import { MarcSubjectEntry, MarcSubjectTag } from '../../types/alims';
import {
  SUBJECT_THESAURI,
  COMMON_SUBDIVISIONS,
  PAKISTANI_ACADEMIC_SUBJECT_PRESETS,
  createMarcSubjectEntry,
  suggestRdaSubjects,
  parseRawSubjectStrings
} from '../../services/marcSubjectEngine';

interface MarcSubjectEntryDeskProps {
  entries: MarcSubjectEntry[];
  onChange: (newEntries: MarcSubjectEntry[]) => void;
  bookContext?: {
    title: string;
    ddc: string;
    description?: string;
  };
  onDictateRequest?: () => void;
  isListening?: boolean;
}

export const MarcSubjectEntryDesk: React.FC<MarcSubjectEntryDeskProps> = ({
  entries,
  onChange,
  bookContext,
  onDictateRequest,
  isListening = false
}) => {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [quickTextInput, setQuickTextInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active Builder State
  const [selectedTag, setSelectedTag] = useState<MarcSubjectTag>('650');
  const [selectedThesaurus, setSelectedThesaurus] = useState<string>('LCSH');
  const [term, setTerm] = useState('');
  const [subGeneral, setSubGeneral] = useState('');
  const [subGeographic, setSubGeographic] = useState('');
  const [subChronological, setSubChronological] = useState('');
  const [subForm, setSubForm] = useState('');
  const [activeTab, setActiveTab] = useState<'MANUAL' | 'QUICK_TEXT' | 'PRESETS'>('MANUAL');

  const handleAddEntry = () => {
    if (!term.trim()) return;

    const newEntry = createMarcSubjectEntry({
      tag: selectedTag,
      term: term.trim(),
      thesaurusSource: selectedThesaurus,
      subdivisions: {
        general: subGeneral.trim() || undefined,
        geographic: subGeographic.trim() || undefined,
        chronological: subChronological.trim() || undefined,
        form: subForm.trim() || undefined
      }
    });

    onChange([...entries, newEntry]);

    // Reset form fields
    setTerm('');
    setSubGeneral('');
    setSubGeographic('');
    setSubChronological('');
    setSubForm('');
  };

  const handleRemoveEntry = (id: string) => {
    onChange(entries.filter(e => e.id !== id));
  };

  const handleApplyPreset = (preset: typeof PAKISTANI_ACADEMIC_SUBJECT_PRESETS[0]) => {
    const newEntry = createMarcSubjectEntry({
      tag: preset.tag,
      term: preset.term,
      thesaurusSource: preset.thesaurus,
      subdivisions: preset.subdivisions
    });
    onChange([...entries, newEntry]);
  };

  const handleAutoSuggestRda = () => {
    if (!bookContext) return;
    const suggestions = suggestRdaSubjects(bookContext.title, bookContext.ddc, bookContext.description);
    // Append non-duplicate suggestions
    const existingTerms = new Set(entries.map(e => e.term.toLowerCase()));
    const toAdd = suggestions.filter(s => !existingTerms.has(s.term.toLowerCase()));
    if (toAdd.length > 0) {
      onChange([...entries, ...toAdd]);
    }
  };

  const handleBatchIngestText = () => {
    if (!quickTextInput.trim()) return;
    const parsed = parseRawSubjectStrings(quickTextInput, selectedTag);
    if (parsed.length > 0) {
      onChange([...entries, ...parsed]);
      setQuickTextInput('');
    }
  };

  const handleCopyMarc = (rawMarc: string, id: string) => {
    navigator.clipboard.writeText(rawMarc);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTagBadgeStyle = (tag: MarcSubjectTag) => {
    switch (tag) {
      case '650': // Topical
        return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-300', icon: <Bookmark className="h-3 w-3 text-emerald-600" />, label: '650 Topical Term' };
      case '651': // Geographic
        return { bg: 'bg-blue-50 text-blue-800 border-blue-300', icon: <Globe className="h-3 w-3 text-blue-600" />, label: '651 Geographic Name' };
      case '600': // Personal Name
        return { bg: 'bg-purple-50 text-purple-800 border-purple-300', icon: <User className="h-3 w-3 text-purple-600" />, label: '600 Personal Name' };
      case '610': // Corporate Name
        return { bg: 'bg-amber-50 text-amber-900 border-amber-300', icon: <Building className="h-3 w-3 text-amber-600" />, label: '610 Corporate Body' };
      case '655': // Genre/Form
        return { bg: 'bg-rose-50 text-rose-800 border-rose-300', icon: <BookOpen className="h-3 w-3 text-rose-600" />, label: '655 Genre / Form' };
      default:
        return { bg: 'bg-slate-100 text-slate-800 border-slate-300', icon: <Tag className="h-3 w-3 text-slate-600" />, label: `${tag} Subject` };
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
              <span>MARC21 / RDA Subject Access Points</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-mono">
                6XX Block ({entries.length})
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Topical terms (650), geographic areas (651), named entities (600/610), and RDA genre access (655).
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* AI / RDA Suggester */}
          {bookContext && (
            <button
              type="button"
              onClick={handleAutoSuggestRda}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              title="Automatically synthesize MARC21/RDA Subject Entries from Title, DDC, and Description"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>RDA Subject Assist</span>
            </button>
          )}

          {/* Preset Library Button */}
          <button
            type="button"
            onClick={() => setIsPresetModalOpen(!isPresetModalOpen)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5 text-slate-600" />
            <span>Academic Presets</span>
          </button>

          {/* Toggle Builder Button */}
          <button
            type="button"
            onClick={() => setIsBuilderOpen(!isBuilderOpen)}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isBuilderOpen ? 'Close Builder' : '+ Add Subject Entry'}</span>
          </button>
        </div>
      </div>

      {/* Preset Modal / Drawer */}
      {isPresetModalOpen && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
              <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
              <span>Pakistani University & RDA Standard Subject Presets</span>
            </h5>
            <button
              type="button"
              onClick={() => setIsPresetModalOpen(false)}
              className="text-[11px] text-slate-400 hover:text-slate-600 font-medium"
            >
              Dismiss
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
            {PAKISTANI_ACADEMIC_SUBJECT_PRESETS.map((p, idx) => {
              const style = getTagBadgeStyle(p.tag);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`px-2 py-1 rounded-lg border text-left text-xs flex items-center space-x-1.5 hover:shadow-sm transition-all cursor-pointer ${style.bg}`}
                >
                  <span className="font-mono text-[9px] font-bold opacity-80">{p.tag}</span>
                  <span className="font-medium text-[11px]">{p.term}</span>
                  {p.subdivisions?.geographic && (
                    <span className="text-[10px] text-slate-500">-- {p.subdivisions.geographic}</span>
                  )}
                  {p.subdivisions?.general && (
                    <span className="text-[10px] text-slate-500">-- {p.subdivisions.general}</span>
                  )}
                  <Plus className="h-3 w-3 ml-1 opacity-60" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Builder Panel */}
      {isBuilderOpen && (
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3.5">
          {/* Builder Mode Navigation */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center space-x-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('MANUAL')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'MANUAL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Structured Subfield Builder
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('QUICK_TEXT')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'QUICK_TEXT'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Fast Delimited Ingest / Voice
              </button>
            </div>

            <div className="flex items-center space-x-1 text-[11px] text-slate-500">
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
              <span>MARC21 6XX & RDA Ch. 23</span>
            </div>
          </div>

          {activeTab === 'MANUAL' ? (
            <div className="space-y-3">
              {/* Row 1: Tag & Authority Scheme */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    MARC21 Subject Tag
                  </label>
                  <select
                    value={selectedTag}
                    onChange={e => setSelectedTag(e.target.value as MarcSubjectTag)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="650">650 — Topical Term (Primary Subject)</option>
                    <option value="651">651 — Geographic Name (Country/Region/Place)</option>
                    <option value="600">600 — Personal Name as Subject (Author/Leader)</option>
                    <option value="610">610 — Corporate Body as Subject (Gov/Org/Court)</option>
                    <option value="655">655 — Index Term - Genre / Form (RDA Form)</option>
                    <option value="653">653 — Uncontrolled Index Term (Keyword)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Thesaurus / Subject Authority (Indicator 2 / $2)
                  </label>
                  <select
                    value={selectedThesaurus}
                    onChange={e => setSelectedThesaurus(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    {SUBJECT_THESAURI.map(t => (
                      <option key={t.code} value={t.code}>
                        {t.name} (ind2: {t.ind2})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Entry Element / Main Term ($a) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Subfield $a: Main Heading / Entry Element *
                  </label>
                  {onDictateRequest && (
                    <button
                      type="button"
                      onClick={onDictateRequest}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center space-x-1 cursor-pointer transition-all ${
                        isListening
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      <span>{isListening ? 'Listening...' : 'Dictate Subject'}</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={term}
                  onChange={e => setTerm(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEntry();
                    }
                  }}
                  placeholder="e.g. Constitutional law, Software architecture, Hadith, Pediatrics..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              {/* Row 3: Standard Subdivisions ($x, $z, $y, $v) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                {/* $x General */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    $x General Subdivision
                  </label>
                  <input
                    type="text"
                    value={subGeneral}
                    onChange={e => setSubGeneral(e.target.value)}
                    list="sub-general-list"
                    placeholder="e.g. Research, History"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-[11px] text-slate-800"
                  />
                  <datalist id="sub-general-list">
                    {COMMON_SUBDIVISIONS.general.map((s, i) => (
                      <option key={i} value={s} />
                    ))}
                  </datalist>
                </div>

                {/* $z Geographic */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    $z Geographic Subdivision
                  </label>
                  <input
                    type="text"
                    value={subGeographic}
                    onChange={e => setSubGeographic(e.target.value)}
                    list="sub-geo-list"
                    placeholder="e.g. Pakistan, South Asia"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-[11px] text-slate-800"
                  />
                  <datalist id="sub-geo-list">
                    {COMMON_SUBDIVISIONS.geographic.map((s, i) => (
                      <option key={i} value={s} />
                    ))}
                  </datalist>
                </div>

                {/* $y Chronological */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    $y Period / Time
                  </label>
                  <input
                    type="text"
                    value={subChronological}
                    onChange={e => setSubChronological(e.target.value)}
                    list="sub-chrono-list"
                    placeholder="e.g. 21st century, 1947-"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-[11px] text-slate-800"
                  />
                  <datalist id="sub-chrono-list">
                    {COMMON_SUBDIVISIONS.chronological.map((s, i) => (
                      <option key={i} value={s} />
                    ))}
                  </datalist>
                </div>

                {/* $v Form */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    $v Form / Genre
                  </label>
                  <input
                    type="text"
                    value={subForm}
                    onChange={e => setSubForm(e.target.value)}
                    list="sub-form-list"
                    placeholder="e.g. Textbooks, Manuals"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-[11px] text-slate-800"
                  />
                  <datalist id="sub-form-list">
                    {COMMON_SUBDIVISIONS.form.map((s, i) => (
                      <option key={i} value={s} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Live Preview & Add Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 flex-wrap gap-2">
                <div className="flex-1 min-w-[200px] text-[11px] text-slate-600 font-mono truncate">
                  <span className="text-slate-400">Preview: </span>
                  <span className="text-emerald-700 font-bold">
                    {term ? `${term}${subGeneral ? ` -- ${subGeneral}` : ''}${subGeographic ? ` -- ${subGeographic}` : ''}${subChronological ? ` -- ${subChronological}` : ''}${subForm ? ` -- ${subForm}` : ''}` : '(enter main term above)'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddEntry}
                  disabled={!term.trim()}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add to Catalogue</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Batch Delimited Input (comma, semicolon, or new line)
                </label>
                <textarea
                  value={quickTextInput}
                  onChange={e => setQuickTextInput(e.target.value)}
                  rows={3}
                  placeholder="e.g. Software architecture -- Design and construction, Machine learning -- Medical applications, Computer networks -- Security measures"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Tip: You can use double dashes (<code className="bg-slate-200 px-1 rounded">--</code>) between subfields or paste dictated keywords directly.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleBatchIngestText}
                  disabled={!quickTextInput.trim()}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Parse & Add All Subjects
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Subject Entries Chips Display */}
      <div className="space-y-2">
        {entries.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center space-y-1">
            <p className="text-xs font-bold text-slate-600">No MARC21/RDA Subject Entries Added Yet</p>
            <p className="text-[11px] text-slate-400">
              Click <strong className="text-blue-600">+ Add Subject Entry</strong> or use <strong className="text-emerald-600">RDA Subject Assist</strong> to automatically generate standardized access points for this record.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {entries.map((entry, idx) => {
              const style = getTagBadgeStyle(entry.tag);
              return (
                <div
                  key={entry.id || idx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${style.bg}`}
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <span className="p-1 rounded bg-white/70 shadow-2xs shrink-0">
                      {style.icon}
                    </span>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 shrink-0">
                      {entry.tag} {entry.ind1 || '#'}{entry.ind2 || '0'} {entry.thesaurusSource || 'LCSH'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {entry.formattedHeading}
                      </p>
                      {entry.rawMarcString && (
                        <p className="text-[10px] font-mono text-slate-500 truncate">
                          {entry.rawMarcString}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {entry.rawMarcString && (
                      <button
                        type="button"
                        onClick={() => handleCopyMarc(entry.rawMarcString!, entry.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/60 transition-all cursor-pointer"
                        title="Copy raw MARC 6XX tag string"
                      >
                        {copiedId === entry.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveEntry(entry.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-100/50 transition-all cursor-pointer"
                      title="Remove Subject Entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
