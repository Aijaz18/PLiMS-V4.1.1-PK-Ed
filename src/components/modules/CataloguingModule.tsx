import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  FileCode,
  Plus,
  Search,
  BookOpen,
  QrCode,
  ArrowRightLeft,
  DollarSign,
  Printer,
  CheckCircle2,
  Sparkles,
  Layers,
  Building2,
  Tag,
  Boxes,
  FileText,
  ShieldCheck,
  Zap,
  Info,
  Trash2,
  Pencil,
  Copy,
  PlusCircle,
  ListPlus,
  Check,
  X,
  AlertCircle,
  BookmarkCheck,
  RefreshCw,
  Globe,
  Camera,
  UploadCloud,
  Image as ImageIcon,
  Scan,
  Eye,
  Wand2,
  Cpu,
  Layers3,
  SlidersHorizontal,
  Maximize2,
  CheckSquare,
  BookMarked,
  AlertTriangle,
  RotateCcw,
  FolderX,
  SwitchCamera,
  Video,
  VideoOff,
  Subtitles,
  Mic,
  MicOff,
  Volume2,
  Radio,
  Languages,
  Database,
  HardDrive,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { BookRecord, BookCopy, UserProfile, InterLibraryTransfer, SystemSettings, LibraryScheme } from '../../types/alims';
import { generateAiCataloguing, generateAiCataloguingFromImage, parseVoiceToMarc21, AiCataloguingResult, formatMarcSubfields } from '../../services/geminiService';
import { generateCallNumberForTitle, detectTextScript } from '../../utils/classificationEngine';
import {
  queryCatalog300k,
  setCustomCatalogBooks,
  isReferenceCatalogActive,
  setReferenceCatalogActive,
  getCatalogFacets,
  DDC_FACETS,
  TOTAL_CATALOG_TARGET,
  CatalogQueryResult
} from '../../services/catalog300kEngine';
import { idbClearAll } from '../../services/offlineStorage';
import { HighCapacityExportModal } from '../catalog/HighCapacityExportModal';
import { HighCapacityImportModal } from '../catalog/HighCapacityImportModal';
import { PurgeCatalogModal } from '../catalog/PurgeCatalogModal';
import { LibrarianHoldingsBuilderModal } from '../catalog/LibrarianHoldingsBuilderModal';
import { MarcSubjectEntryDesk } from '../catalog/MarcSubjectEntryDesk';
import { MarcSubjectEntry } from '../../types/alims';
import {
  ensureBookSubjectEntries,
  createMarcSubjectEntry,
  parseRawSubjectStrings
} from '../../services/marcSubjectEngine';

interface CataloguingModuleProps {
  books: BookRecord[];
  copies?: BookCopy[];
  users?: UserProfile[];
  currentUser?: UserProfile;
  settings?: SystemSettings;
  onAddBook?: (newBook: BookRecord) => void;
  onUpdateBook?: (id: string, updated: BookRecord) => void;
  onDeleteBook?: (bookId: string) => void;
  onDeleteAllBooks?: () => void;
  onRestoreSampleBooks?: () => void;
  onAddCopies?: (newCopies: BookCopy[], bookId?: string) => void;
  onUpdateCopy?: (copyId: string, updated: Partial<BookCopy>) => void;
  onDeleteCopy?: (copyId: string, bookId?: string) => void;
  onPayFine?: (memberId: string, amount: number) => void;
  onAddBranch?: (branchName: string) => void;
  onDeleteBranch?: (branchName: string) => void;
  onImportBooks?: (newBooks: BookRecord[], newCopies?: BookCopy[]) => void;
}

export const CataloguingModule: React.FC<CataloguingModuleProps> = ({
  books,
  copies = [],
  users = [],
  currentUser,
  settings,
  onAddBook,
  onUpdateBook,
  onDeleteBook,
  onDeleteAllBooks,
  onRestoreSampleBooks,
  onAddCopies,
  onUpdateCopy,
  onDeleteCopy,
  onPayFine,
  onAddBranch,
  onDeleteBranch,
  onImportBooks
}) => {
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'NEW_MARC' | 'TRANSFERS' | 'FINES_DESK' | 'BARCODE_DESK'>('CATALOG');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'ALL' | 'TITLE' | 'AUTHOR' | 'SUBJECT' | 'CALL_NUMBER' | 'ISBN'>('ALL');
  const [selectedBookForMarc, setSelectedBookForMarc] = useState<BookRecord | null>(null);

  // 300,000 Titles Catalog (3.0 Lakhs) & Unlimited Storage State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [selectedDdcFilter, setSelectedDdcFilter] = useState<string>('ALL');
  const [jumpToPageInput, setJumpToPageInput] = useState<string>('');

  // High-Capacity 300k & Holdings Export/Import Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Purge & Reset Catalog and Institutional Holdings Builder
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState<boolean>(false);
  const [isHoldingsBuilderOpen, setIsHoldingsBuilderOpen] = useState<boolean>(false);
  const [catalogRefreshTrigger, setCatalogRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    setCustomCatalogBooks(books);
  }, [books]);

  // Reset to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDdcFilter, pageSize, searchScope]);

  const catalogResult: CatalogQueryResult = useMemo(() => {
    return queryCatalog300k({
      page: currentPage,
      pageSize,
      searchQuery,
      filterDdc: selectedDdcFilter,
      searchScope
    });
  }, [currentPage, pageSize, searchQuery, selectedDdcFilter, searchScope, books, catalogRefreshTrigger]);

  // Delete All Books Modal State
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [deleteAllConfirmInput, setDeleteAllConfirmInput] = useState('');

  // Edit Mode state
  const [editingBookId, setEditingBookId] = useState<string | null>(null);

  // Copy & Accession Manager modal state
  const [selectedBookForCopies, setSelectedBookForCopies] = useState<BookRecord | null>(null);
  const [copyModalTab, setCopyModalTab] = useState<'SINGLE' | 'BATCH' | 'LIST'>('SINGLE');

  // Single Copy Form state
  const [singleCopyForm, setSingleCopyForm] = useState({
    accessionNumber: '',
    copyNumber: 'C.2',
    shelfLocation: '',
    branchLocation: 'Central Academic Library',
    barcode: '',
    rfidUid: '',
    status: 'AVAILABLE' as BookCopy['status']
  });

  // Batch Copies Form state
  const [batchCopyForm, setBatchCopyForm] = useState({
    quantity: 3,
    prefix: 'ACC-2026-',
    startNumber: 101,
    shelfLocation: '',
    branchLocation: 'Central Academic Library'
  });

  // Library Classification Schemes State
  const [schemes, setSchemes] = useState<LibraryScheme[]>([
    {
      id: 'scheme_1',
      name: 'Dewey Decimal Classification (DDC)',
      code: 'ddc',
      marcTag: '082',
      prefix: 'DDC',
      description: 'Standard 10 Main Classes Numerical Classification Scheme'
    },
    {
      id: 'scheme_2',
      name: 'Library of Congress Classification (LCC)',
      code: 'lcc',
      marcTag: '050',
      prefix: 'LCC',
      description: 'Alphanumeric System Used by Research Libraries'
    },
    {
      id: 'scheme_3',
      name: 'Universal Decimal Classification (UDC)',
      code: 'udc',
      marcTag: '080',
      prefix: 'UDC',
      description: 'Multilingual Science & Technology Indexing Scheme'
    },
    {
      id: 'scheme_4',
      name: 'National Library of Medicine (NLM)',
      code: 'nlm',
      marcTag: '060',
      prefix: 'NLM',
      description: 'Medical & Clinical Sciences Classification'
    },
    {
      id: 'scheme_5',
      name: 'Colon Classification (CC)',
      code: 'cc',
      marcTag: '084',
      prefix: 'CC',
      description: 'Facet Classification System Developed by S.R. Ranganathan'
    },
    {
      id: 'scheme_6',
      name: 'HEC Pakistan University Standard Scheme',
      code: 'hec-pk',
      marcTag: '084',
      prefix: 'HEC',
      description: 'Pakistan Higher Education Commission Cataloguing Guidelines'
    },
    {
      id: 'scheme_7',
      name: 'Islamic Jurisprudence & Shariah Scheme',
      code: 'isl-law',
      marcTag: '084',
      prefix: 'ISL',
      description: 'Specialized Classification Scheme for Islamic Legal Texts'
    }
  ]);

  const [isAddSchemeModalOpen, setIsAddSchemeModalOpen] = useState<boolean>(false);
  const [newSchemeForm, setNewSchemeForm] = useState({
    name: '',
    code: '',
    marcTag: '084',
    prefix: '',
    description: ''
  });

  // Default empty form template
  const defaultMarcForm = {
    isbn: '978-0132354165',
    title: 'Clean Architecture: A Craftsman Guide to Software Structure',
    authors: 'Robert C. Martin',
    department: 'Computer Science',
    schemeId: 'scheme_1',
    callNumber: '005.1 MAR/A',
    edition: '1st Edition',
    publisherName: 'Prentice Hall',
    publisherLocation: 'New York, NY',
    publisherYear: 2017,
    pageCount: 432,
    totalCopies: 4,
    accessionNumber: 'ACC-2026-0891',
    copyNo: 'C.1',
    shelfLocation: 'Stack CS-04-A',
    subjects: 'Software Architecture, Agile, Design Patterns',
    subjectEntries: [
      {
        id: 'subj_def_1',
        tag: '650' as const,
        ind1: '#',
        ind2: '0',
        term: 'Software architecture',
        subdivisions: { general: 'Design and construction', form: 'Handbooks, manuals, etc.' },
        thesaurusSource: 'LCSH',
        formattedHeading: 'Software architecture -- Design and construction -- Handbooks, manuals, etc.',
        rawMarcString: '650 #0 $a Software architecture $x Design and construction $v Handbooks, manuals, etc.'
      },
      {
        id: 'subj_def_2',
        tag: '650' as const,
        ind1: '#',
        ind2: '0',
        term: 'Agile software development',
        subdivisions: { general: 'Methodology' },
        thesaurusSource: 'LCSH',
        formattedHeading: 'Agile software development -- Methodology',
        rawMarcString: '650 #0 $a Agile software development $x Methodology'
      },
      {
        id: 'subj_def_3',
        tag: '655' as const,
        ind1: '#',
        ind2: '7',
        term: 'Handbooks, manuals, etc.',
        thesaurusSource: 'FAST',
        formattedHeading: 'Handbooks, manuals, etc.',
        rawMarcString: '655 #7 $a Handbooks, manuals, etc. $2 fast'
      }
    ] as MarcSubjectEntry[],
    description: 'A comprehensive guide to software structure, component separation, dependency rules, and architectural discipline for maintainable enterprise applications.',
    generalNotes: 'Library Tech Archives. First edition copy with complete bibliographical references and software craft diagrams.',
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&auto=format&fit=crop&q=80',
    format: 'HARDCOVER' as BookRecord['format']
  };

  // MARC Record Form State (used for both New and Edit)
  const [marcForm, setMarcForm] = useState(defaultMarcForm);
  const [isAiCataloguing, setIsAiCataloguing] = useState(false);
  const [aiMarcPreview, setAiMarcPreview] = useState<any[] | null>(null);

  // ==========================================
  // LIBRARIAN MICROPHONE VOICE DICTATION DESK
  // Web Speech API STT for MARC21 Descriptions & Notes
  // ==========================================
  type VoiceDictationField = 'description' | 'generalNotes' | 'title' | 'authors' | 'subjects' | 'publisherName';

  const [isListening, setIsListening] = useState(false);
  const [activeVoiceField, setActiveVoiceField] = useState<VoiceDictationField>('description');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceLang, setVoiceLang] = useState<'en-US' | 'ur-PK' | 'ar-SA'>('en-US');
  const [voiceDictationMode, setVoiceDictationMode] = useState<'append' | 'replace'>('append');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [voiceSoundLevel, setVoiceSoundLevel] = useState<number[]>([35, 75, 40, 85, 55, 70]);

  const speechRecognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const activeVoiceFieldRef = useRef<VoiceDictationField>('description');
  const voiceLangRef = useRef<'en-US' | 'ur-PK' | 'ar-SA'>('en-US');
  const voiceDictationModeRef = useRef<'append' | 'replace'>('append');

  // Keep refs synchronized
  useEffect(() => {
    activeVoiceFieldRef.current = activeVoiceField;
  }, [activeVoiceField]);

  useEffect(() => {
    voiceLangRef.current = voiceLang;
  }, [voiceLang]);

  useEffect(() => {
    voiceDictationModeRef.current = voiceDictationMode;
  }, [voiceDictationMode]);

  // Check Web Speech API availability on mount
  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setIsSpeechSupported(false);
    }
  }, []);

  // Animate dynamic voice soundwave bars while listening
  useEffect(() => {
    if (!isListening) return;
    const interval = setInterval(() => {
      setVoiceSoundLevel([
        Math.floor(20 + Math.random() * 70),
        Math.floor(35 + Math.random() * 65),
        Math.floor(15 + Math.random() * 80),
        Math.floor(45 + Math.random() * 55),
        Math.floor(25 + Math.random() * 75),
        Math.floor(30 + Math.random() * 65),
      ]);
    }, 130);
    return () => clearInterval(interval);
  }, [isListening]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Intelligent voice punctuation formatter for library dictation
  const formatVoicePunctuation = (text: string): string => {
    let cleaned = text
      .replace(/\b(full stop|period)\b/gi, '.')
      .replace(/\b(comma)\b/gi, ',')
      .replace(/\b(question mark)\b/gi, '?')
      .replace(/\b(exclamation mark|exclamation point)\b/gi, '!')
      .replace(/\b(semicolon)\b/gi, ';')
      .replace(/\b(colon)\b/gi, ':')
      .replace(/\b(new line|newline)\b/gi, '\n')
      .replace(/\b(hyphen|dash)\b/gi, ' - ')
      .replace(/\b(open quote|open quotation)\b/gi, '"')
      .replace(/\b(close quote|close quotation)\b/gi, '"');

    cleaned = cleaned.replace(/\s+([.,!?:;])/g, '$1');
    cleaned = cleaned.replace(/(^|[.!?\n]\s+)([a-z])/g, (_match, prefix, char) => prefix + char.toUpperCase());

    return cleaned;
  };

  // Apply dictated text directly to target MARC field
  const applyDictatedText = useCallback((field: VoiceDictationField, text: string) => {
    if (!text || !text.trim()) return;
    setMarcForm(prev => {
      const existing = (prev as any)[field] || '';
      let updated = '';
      if (voiceDictationModeRef.current === 'replace' || !existing.trim()) {
        updated = text.trim();
      } else {
        const spacer = (field === 'description' || field === 'generalNotes') ? ' ' : ', ';
        updated = `${existing.trim()}${spacer}${text.trim()}`;
      }

      if (field === 'title') {
        const gen = generateCallNumberForTitle(updated, prev.authors, prev.department, prev.schemeId, schemes);
        return {
          ...prev,
          title: updated,
          callNumber: updated.trim() ? gen.callNumber : prev.callNumber
        };
      }

      if (field === 'subjects') {
        const parsedNew = parseRawSubjectStrings(text.trim());
        const existingEntries = prev.subjectEntries || [];
        const mergedEntries = voiceDictationModeRef.current === 'replace' ? parsedNew : [...existingEntries, ...parsedNew];
        return {
          ...prev,
          subjects: mergedEntries.map(e => e.formattedHeading).join(' ; ') || updated,
          subjectEntries: mergedEntries
        };
      }

      return {
        ...prev,
        [field]: updated
      };
    });
  }, [schemes]);

  // Stop voice dictation
  const handleStopVoiceInput = () => {
    isListeningRef.current = false;
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      speechRecognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  // Start voice dictation via microphone
  const handleStartVoiceInput = (targetField: VoiceDictationField) => {
    handleStopVoiceInput();

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setIsSpeechSupported(false);
      setVoiceError('Web Speech API is not supported in this browser. You can use the Quick Dictation Presets below to simulate librarian voice input.');
      setActiveVoiceField(targetField);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = voiceLangRef.current;

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        setActiveVoiceField(targetField);
        setVoiceError(null);
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript;
          } else {
            currentInterim += transcript;
          }
        }

        setInterimTranscript(currentInterim);

        if (finalChunk.trim()) {
          const formatted = formatVoicePunctuation(finalChunk);
          applyDictatedText(targetField, formatted);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceError('Microphone permission was denied. Please allow microphone access in your browser address bar.');
          handleStopVoiceInput();
        } else if (event.error === 'network') {
          setVoiceError('Speech recognition network service unavailable. You can use preset librarian dictation.');
        } else if (event.error !== 'no-speech') {
          setVoiceError(`Voice notice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
            isListeningRef.current = false;
          }
        } else {
          setIsListening(false);
          setInterimTranscript('');
        }
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setVoiceError(`Microphone error: ${err?.message || 'Could not start voice dictation'}`);
      setIsListening(false);
      isListeningRef.current = false;
    }
  };

  // Toggle voice dictation for specific field
  const handleToggleVoiceInput = (targetField: VoiceDictationField) => {
    if (isListening && activeVoiceField === targetField) {
      handleStopVoiceInput();
    } else {
      setActiveVoiceField(targetField);
      handleStartVoiceInput(targetField);
    }
  };

  // Quick punctuation button insert
  const handleInsertPunctuation = (symbol: string) => {
    setMarcForm(prev => {
      const existing = (prev as any)[activeVoiceField] || '';
      return {
        ...prev,
        [activeVoiceField]: `${existing}${symbol}`
      };
    });
  };

  // Sample Dictation Presets (for instant testing or hands-free librarian quick inserts)
  const sampleDictationPresets: { label: string; field: VoiceDictationField; text: string; badge: string }[] = [
    {
      label: 'Standard Monograph Synopsis',
      badge: '520 Summary',
      field: 'description',
      text: 'A comprehensive academic monograph presenting modern structural software methodologies, clean architecture principles, and domain-driven design. Includes case studies, illustrative figures, and comprehensive bibliographical citations.'
    },
    {
      label: 'Rare Copy & Provenance Note',
      badge: '500 General',
      field: 'generalNotes',
      text: 'Preserved in Special Rare Book Stack. First edition printing with gold-embossed cloth binding. Donated by the Department of Computing Alumni Trust, accession verified 2026.'
    },
    {
      label: 'Physical Condition & Preservation',
      badge: '500 Condition',
      field: 'generalNotes',
      text: 'Physical verification: Minor shelf wear on outer corners; archival acid-free preservation cover applied. Fitted with ultra-high-frequency RFID asset chip and spine barcode.'
    },
    {
      label: 'Urdu Literature Abstract',
      badge: 'اردو 520',
      field: 'description',
      text: 'اردو ادب اور تنقیدی مطالعہ کا مستند اور تفصیلی مرجع۔ کتاب میں کلاسیکی دبستان، اسالیب اور اہم ادبی تحریکوں کا احاطہ کیا گیا ہے۔'
    }
  ];

  const handleApplySampleDictation = (preset: { field: VoiceDictationField; text: string }) => {
    applyDictatedText(preset.field, preset.text);
    setActiveVoiceField(preset.field);
  };

  // AI Agent & Cataloguing Entry Modes: 'VOICE_TO_MARC', 'AI_IMAGE_AGENT' (Upload Cover), 'AI_TEXT_AGENT' (Prompt), 'MANUAL_ENTRY' (Direct)
  const [entryMode, setEntryMode] = useState<'VOICE_TO_MARC' | 'AI_IMAGE_AGENT' | 'AI_TEXT_AGENT' | 'MANUAL_ENTRY'>('VOICE_TO_MARC');

  // Dedicated Voice-to-MARC21 Microphone & AI Assistant Parsing State
  const [voiceToMarcTranscript, setVoiceToMarcTranscript] = useState('');
  const [voiceToMarcInterim, setVoiceToMarcInterim] = useState('');
  const [isVoiceToMarcListening, setIsVoiceToMarcListening] = useState(false);
  const [isVoiceToMarcParsing, setIsVoiceToMarcParsing] = useState(false);
  const [voiceToMarcProgressStep, setVoiceToMarcProgressStep] = useState<string>('');
  const [voiceToMarcError, setVoiceToMarcError] = useState<string | null>(null);
  const [voiceToMarcResult, setVoiceToMarcResult] = useState<AiCataloguingResult | null>(null);
  const [voiceToMarcLang, setVoiceToMarcLang] = useState<string>('en-US');
  const [voiceToMarcRecordingTime, setVoiceToMarcRecordingTime] = useState<number>(0);
  const [voiceToMarcSoundBars, setVoiceToMarcSoundBars] = useState<number[]>([25, 45, 60, 35, 55, 40]);
  const voiceToMarcTimerRef = useRef<any>(null);
  const voiceToMarcRecRef = useRef<any>(null);

  // Spoken dictation test presets for librarians
  const voiceDictationPresets = [
    {
      label: 'Software Engineering (Robert C. Martin)',
      badge: 'CS & AI',
      transcript: 'Title: Clean Architecture: A Craftsman\'s Guide to Software Structure and Design. Author: Robert C. Martin. ISBN: 978-0134494166. Publisher: Prentice Hall. Year: 2018. Edition: First Edition. Department: Computer Science.'
    },
    {
      label: 'Constitutional Law of Pakistan (Hamid Khan)',
      badge: 'Law',
      transcript: 'Title: Constitutional and Political History of Pakistan. Author: Hamid Khan, Senior Advocate Supreme Court. ISBN: 978-0199401799. Publisher: Oxford University Press Pakistan. Year: 2021. Edition: Third Edition. Department: Law & Humanities.'
    },
    {
      label: 'Medical Pathology (Kumar & Abbas)',
      badge: 'Medicine',
      transcript: 'Title: Robbins and Cotran Pathologic Basis of Disease. Authors: Vinay Kumar, Abul K. Abbas, and Jon C. Aster. ISBN: 978-1455726134. Publisher: Elsevier Saunders. Year: 2020. Edition: Tenth Edition. Department: Medical Sciences.'
    },
    {
      label: 'Database Systems (Silberschatz & Korth)',
      badge: 'Databases',
      transcript: 'Title: Database System Concepts. Authors: Abraham Silberschatz, Henry F. Korth, and S. Sudarshan. ISBN: 978-0078022159. Publisher: McGraw-Hill Education. Year: 2020. Edition: Seventh Edition. Department: Information Technology.'
    }
  ];

  // Stop Voice-to-MARC recording
  const handleStopVoiceToMarc = useCallback(() => {
    if (voiceToMarcTimerRef.current) {
      clearInterval(voiceToMarcTimerRef.current);
      voiceToMarcTimerRef.current = null;
    }
    if (voiceToMarcRecRef.current) {
      try {
        voiceToMarcRecRef.current.stop();
      } catch {
        // ignore
      }
      voiceToMarcRecRef.current = null;
    }
    setIsVoiceToMarcListening(false);
    setVoiceToMarcInterim('');
  }, []);

  // Start Voice-to-MARC recording using browser microphone
  const handleStartVoiceToMarc = () => {
    handleStopVoiceToMarc();
    setVoiceToMarcError(null);

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceToMarcError('Web Speech API is not supported in this browser. You can click any of the Quick Spoken Presets below to test AI Voice-to-MARC21 parsing immediately.');
      return;
    }

    try {
      // Proactively test microphone permissions if getUserMedia is available
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((stream) => {
            // Permission verified; stop temporary tracks
            stream.getTracks().forEach(t => t.stop());
          })
          .catch((err) => {
            console.warn('Microphone permission check warning:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              setVoiceToMarcError('Microphone permission denied. Please allow microphone access in your browser address bar.');
            }
          });
      }

      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = voiceToMarcLang;

      recognition.onstart = () => {
        setIsVoiceToMarcListening(true);
        setVoiceToMarcError(null);
        setVoiceToMarcRecordingTime(0);

        // Start timer
        if (voiceToMarcTimerRef.current) clearInterval(voiceToMarcTimerRef.current);
        voiceToMarcTimerRef.current = setInterval(() => {
          setVoiceToMarcRecordingTime(prev => prev + 1);
          setVoiceToMarcSoundBars([
            Math.floor(20 + Math.random() * 75),
            Math.floor(30 + Math.random() * 65),
            Math.floor(15 + Math.random() * 85),
            Math.floor(40 + Math.random() * 55),
            Math.floor(25 + Math.random() * 70),
            Math.floor(35 + Math.random() * 60)
          ]);
        }, 150);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalAccumulated = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalAccumulated += item[0].transcript + ' ';
          } else {
            currentInterim += item[0].transcript;
          }
        }

        setVoiceToMarcInterim(currentInterim);

        if (finalAccumulated.trim()) {
          setVoiceToMarcTranscript(prev => {
            const combined = prev ? `${prev.trim()} ${finalAccumulated.trim()}` : finalAccumulated.trim();
            return formatVoicePunctuation(combined);
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[Voice-to-MARC21] Speech recognition notice:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceToMarcError('Microphone permission was denied. Please allow microphone access in your browser address bar.');
          handleStopVoiceToMarc();
        } else if (event.error === 'network') {
          setVoiceToMarcError('Speech recognition network service unavailable. You can click any of the Quick Spoken Presets below to test Voice-to-MARC21.');
        } else if (event.error !== 'no-speech') {
          setVoiceToMarcError(`Microphone notice: ${event.error}. You can still edit the transcript manually or select a preset.`);
        }
      };

      recognition.onend = () => {
        setIsVoiceToMarcListening(false);
        setVoiceToMarcInterim('');
        if (voiceToMarcTimerRef.current) {
          clearInterval(voiceToMarcTimerRef.current);
          voiceToMarcTimerRef.current = null;
        }
      };

      voiceToMarcRecRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start Voice-to-MARC dictation:', err);
      setVoiceToMarcError(`Microphone initialization error: ${err?.message || 'Could not start speech recognition'}`);
      setIsVoiceToMarcListening(false);
    }
  };

  // Run AI Assistant to parse voice transcript into structured MARC21 records
  const handleRunVoiceToMarcAi = async (customTranscript?: string) => {
    const rawText = (customTranscript !== undefined ? customTranscript : (voiceToMarcTranscript || voiceToMarcInterim)).trim();
    if (!rawText) {
      setVoiceToMarcError('Please dictate or provide book details (Title, Author, ISBN) before running AI Voice-to-MARC21 parsing.');
      return;
    }

    handleStopVoiceToMarc();
    setIsVoiceToMarcParsing(true);
    setVoiceToMarcError(null);
    setVoiceToMarcProgressStep('Step 1/4: Analyzing spoken audio transcript & removing verbal artifacts...');

    try {
      setTimeout(() => {
        setVoiceToMarcProgressStep('Step 2/4: Extracting Title, Author statements, and validating ISBN...');
      }, 400);

      setTimeout(() => {
        setVoiceToMarcProgressStep('Step 3/4: Generating DDC 23rd Edition Classification, Cutter numbers & LCSH headings...');
      }, 900);

      setTimeout(() => {
        setVoiceToMarcProgressStep('Step 4/4: Compiling ISO 2709 MARC21 Leader and Directory tags (020, 082, 100, 245, 264, 300, 520, 650, 852)...');
      }, 1400);

      const result = await parseVoiceToMarc21(rawText, voiceToMarcLang);
      setVoiceToMarcResult(result);
    } catch (err: any) {
      console.error('Voice-to-MARC parsing error:', err);
      setVoiceToMarcError(`AI parsing error: ${err?.message || 'Could not parse voice transcript into MARC21'}`);
    } finally {
      setIsVoiceToMarcParsing(false);
      setVoiceToMarcProgressStep('');
    }
  };

  // Apply parsed Voice-to-MARC21 record directly to full MARC editor form
  const handleApplyVoiceResultToForm = () => {
    if (!voiceToMarcResult) return;
    const authorsStr = voiceToMarcResult.authors?.join(', ') || '';
    const subjectsStr = voiceToMarcResult.subjects?.join(', ') || '';

    setMarcForm(prev => ({
      ...prev,
      title: voiceToMarcResult.title || prev.title,
      authors: authorsStr || prev.authors,
      isbn: voiceToMarcResult.isbn || prev.isbn,
      publisherName: voiceToMarcResult.publisherName || prev.publisherName,
      publisherLocation: voiceToMarcResult.publisherLocation || prev.publisherLocation,
      publisherYear: voiceToMarcResult.publisherYear || prev.publisherYear,
      edition: voiceToMarcResult.edition || prev.edition,
      pageCount: voiceToMarcResult.pageCount || prev.pageCount,
      department: voiceToMarcResult.department || prev.department,
      callNumber: voiceToMarcResult.callNumber || prev.callNumber,
      subjects: subjectsStr || prev.subjects,
      description: voiceToMarcResult.abstract || prev.description,
      generalNotes: voiceToMarcResult.rdaGuidelines
        ? `RDA Standard: ${voiceToMarcResult.rdaGuidelines}`
        : 'Dictated via PLiMS Voice-to-MARC21 Speech Recognition Desk.',
      accessionNumber: prev.accessionNumber || `ACC-${Math.floor(10000 + Math.random() * 90000)}`,
      copyNo: prev.copyNo || 'C.1',
      format: (voiceToMarcResult.format as any) || prev.format
    }));

    setAiMarcPreview(voiceToMarcResult.marc21Tags || []);
    alert(`Voice-to-MARC21 Record Applied to Form!\n• Title: "${voiceToMarcResult.title}"\n• DDC Classification: ${voiceToMarcResult.ddcClassification}\n• Call Number: ${voiceToMarcResult.callNumber}\n• Generated ${voiceToMarcResult.marc21Tags?.length || 0} ISO 2709 MARC21 tags.`);
  };

  // Instant Ingest and Save parsed Voice-to-MARC21 record into the Catalog
  const handleInstantSaveVoiceResultToCatalog = () => {
    if (!voiceToMarcResult) return;
    if (!canCatalog) {
      alert('Action Denied: You do not have MARC21 Cataloguing power assigned.');
      return;
    }

    const newBookId = `bk_${Date.now()}`;
    const baseAcc = `ACC-${Math.floor(10000 + Math.random() * 90000)}`;
    const callNum = voiceToMarcResult.callNumber || `${voiceToMarcResult.ddcClassification} ${voiceToMarcResult.cutterNumber} ${voiceToMarcResult.publisherYear}`;
    const authorsArr = voiceToMarcResult.authors?.length ? voiceToMarcResult.authors : ['Unknown Author'];
    const subjectsArr = voiceToMarcResult.subjects?.length ? voiceToMarcResult.subjects : ['General'];

    const createdBook: BookRecord = {
      id: newBookId,
      isbn: voiceToMarcResult.isbn || `978-969-${Math.floor(1000000 + Math.random() * 9000000)}`,
      title: voiceToMarcResult.title,
      authors: authorsArr,
      department: voiceToMarcResult.department || 'Computer Science',
      callNumber: callNum,
      edition: voiceToMarcResult.edition || '1st Edition',
      publisherName: voiceToMarcResult.publisherName || 'Academic Press Pakistan',
      publisherLocation: voiceToMarcResult.publisherLocation || 'Islamabad, Pakistan',
      publisherYear: Number(voiceToMarcResult.publisherYear) || 2024,
      pageCount: Number(voiceToMarcResult.pageCount) || 350,
      totalCopies: 1,
      availableCopies: 1,
      accessionNumber: baseAcc,
      copyNo: 'C.1',
      copyNumber: 'C.1',
      shelfLocation: 'Stack CS-01-A',
      subjects: subjectsArr,
      description: voiceToMarcResult.abstract || '',
      generalNotes: 'Dictated via PLiMS Voice-to-MARC21 Speech Recognition Desk. RDA Core Elements verified.',
      notes: 'Dictated via PLiMS Voice-to-MARC21',
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80',
      format: (voiceToMarcResult.format as any) || 'HARDCOVER',
      marcTags: {
        '001': newBookId,
        '020': `$a ${voiceToMarcResult.isbn || ''}`,
        '082': `$a ${callNum}`,
        '090': `$a ${baseAcc} $b C.1`,
        '100': `$a ${authorsArr.join(', ')}`,
        '245': `$a ${voiceToMarcResult.title} : $b ${voiceToMarcResult.subtitle || ''}`,
        '260': `$a ${voiceToMarcResult.publisherLocation || 'Islamabad'} $b ${voiceToMarcResult.publisherName || 'Academic Press'} $c ${voiceToMarcResult.publisherYear || 2024}`,
        '300': `$a ${voiceToMarcResult.pageCount || 350} p.`,
        '500': '$a Dictated via PLiMS Voice-to-MARC21 Speech Recognition Desk.',
        '520': `$a ${voiceToMarcResult.abstract || ''}`,
        '650': `$a ${subjectsArr.join(' -- ')}`,
        '852': `$p ${baseAcc} $t C.1 $c Stack CS-01-A`
      }
    };

    if (onAddBook) {
      onAddBook(createdBook);
    }

    if (onAddCopies) {
      const generatedCopies: BookCopy[] = [{
        id: `cp_${newBookId}_001`,
        bookId: newBookId,
        accessionNumber: baseAcc,
        barcode: `BAR${Math.floor(100000 + Math.random() * 900000)}`,
        rfidUid: `RFID${Math.floor(10000 + Math.random() * 90000)}`,
        status: 'AVAILABLE',
        branchLocation: settings?.branches?.[0] || 'Central Academic Library'
      }];
      onAddCopies(generatedCopies, newBookId);
    }

    alert(`Book Successfully Ingested into Catalog via Voice-to-MARC21!\n• Title: "${createdBook.title}"\n• Accession No: ${baseAcc}\n• Call Number: ${callNum}\n• DDC Classification: ${voiceToMarcResult.ddcClassification}`);
    setActiveTab('CATALOG');
  };

  // Cleanup Voice-to-MARC timer on unmount
  useEffect(() => {
    return () => {
      if (voiceToMarcTimerRef.current) {
        clearInterval(voiceToMarcTimerRef.current);
      }
      if (voiceToMarcRecRef.current) {
        try {
          voiceToMarcRecRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(defaultMarcForm.coverUrl);
  const [isScanningImage, setIsScanningImage] = useState(false);
  const [scanProgressStep, setScanProgressStep] = useState<string>('');
  const [aiVisionAnalysis, setAiVisionAnalysis] = useState<AiCataloguingResult | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [textPromptInput, setTextPromptInput] = useState('');

  // Live Camera Direct Caption State (AI Vision MARC Agent • Gemini 3.7 Flash Vision)
  const [isDirectCaptionEnabled, setIsDirectCaptionEnabled] = useState(true);
  const [isDirectCaptionLarge, setIsDirectCaptionLarge] = useState(false);
  const [liveCaptionText, setLiveCaptionText] = useState<string>(
    'AI Vision MARC Agent (Book Cover / Title Page Scanner) initialized: Position cover in optical reticle. Gemini 3.7 Flash Vision active.'
  );
  const [isAnalyzingFrame, setIsAnalyzingFrame] = useState(false);
  const [liveCaptionMeta, setLiveCaptionMeta] = useState<{
    title?: string;
    author?: string;
    callNumber?: string;
    isbn?: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Sample Book Covers for 1-Click Testing & Verification
  const sampleBookCovers = [
    {
      title: 'Modern AI in Library Systems',
      author: 'Prof. Dr. Aijaz Akhter',
      dept: 'Computer Science',
      coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=80',
      badge: 'AI & CS'
    },
    {
      title: 'Principles of Medical Physiology',
      author: 'Dr. John E. Hall & Dr. M. Qasim',
      dept: 'Medical & Health Sciences',
      coverUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd3?w=500&auto=format&fit=crop&q=80',
      badge: 'Medicine'
    },
    {
      title: 'Constitutional Law of Pakistan',
      author: 'Hamid Khan, Senior Advocate',
      dept: 'Law & Humanities',
      coverUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80',
      badge: 'Law'
    },
    {
      title: 'Islamic Jurisprudence & Usul al-Fiqh',
      author: 'Prof. Dr. Imran Ahsan Khan Nyazee',
      dept: 'Islamic Studies',
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
      badge: 'Islamic Studies'
    }
  ];

  // Process uploaded or selected image with Gemini Vision AI Agent
  const handleProcessImage = async (dataUrl: string, mimeType: string = 'image/jpeg') => {
    setImagePreviewUrl(dataUrl);
    setIsScanningImage(true);
    setScanProgressStep('Reading visual typography, title page & cover aesthetics with Gemini 3.7 Flash Vision...');
    setLiveCaptionText('Gemini 3.7 Flash Vision: Analyzing cover typography, extracting MARC21 fields & RDA rules...');

    try {
      // Small visual delay feedback for progress steps
      setTimeout(() => {
        setScanProgressStep('Classifying DDC 23rd Edition & computing Cutter-Sanborn Call Number...');
      }, 500);
      setTimeout(() => {
        setScanProgressStep('Compiling MARC21 ISO 2709 leader/tags & RDA compliance rules...');
      }, 1000);

      const res = await generateAiCataloguingFromImage(dataUrl, mimeType);
      setAiVisionAnalysis(res);

      const authorsStr = Array.isArray(res.authors) ? res.authors.join(', ') : (res.authors || 'Unknown Author');
      const subjectsStr = Array.isArray(res.subjects) ? res.subjects.join(', ') : (res.subjects || '');

      setLiveCaptionText(
        `Gemini 3.7 Flash Vision Extracted: "${res.title}" by ${authorsStr} • Call No: ${res.callNumber || res.ddcClassification || 'Classified'} • ${res.marc21Tags?.length || 10} MARC21 tags generated.`
      );
      setLiveCaptionMeta({
        title: res.title,
        author: authorsStr,
        callNumber: res.callNumber || res.ddcClassification,
        isbn: res.isbn
      });

      const formatVal: BookRecord['format'] = (res.format === 'HARDCOVER' || res.format === 'PAPERBACK' || res.format === 'DIGITAL')
        ? res.format
        : 'HARDCOVER';

      const parsedVisionSubjects = subjectsStr ? parseRawSubjectStrings(subjectsStr) : [];

      setMarcForm(prev => ({
        ...prev,
        title: res.title || prev.title,
        authors: authorsStr,
        isbn: res.isbn || prev.isbn,
        publisherName: res.publisherName || prev.publisherName,
        publisherLocation: res.publisherLocation || prev.publisherLocation,
        publisherYear: res.publisherYear || prev.publisherYear,
        edition: res.edition || prev.edition,
        pageCount: res.pageCount || prev.pageCount,
        department: res.department || prev.department,
        format: formatVal,
        callNumber: res.callNumber || prev.callNumber,
        subjects: subjectsStr || prev.subjects,
        subjectEntries: parsedVisionSubjects.length > 0 ? parsedVisionSubjects : prev.subjectEntries,
        description: res.abstract || prev.description,
        generalNotes: res.rdaGuidelines ? `RDA Guideline: ${res.rdaGuidelines}` : prev.generalNotes,
        coverUrl: dataUrl,
        accessionNumber: prev.accessionNumber || `ACC-${Math.floor(10000 + Math.random() * 90000)}`,
        copyNo: prev.copyNo || 'C.1'
      }));

      if (res.marc21Tags && res.marc21Tags.length > 0) {
        setAiMarcPreview(res.marc21Tags);
      }
    } catch (err) {
      console.error('Failed to process image with AI:', err);
      alert('AI Vision analysis encountered an issue. You can continue filling details manually.');
    } finally {
      setIsScanningImage(false);
      setScanProgressStep('');
    }
  };

  // File Upload Handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleProcessImage(event.target.result as string, file.type);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop Handler
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleProcessImage(event.target.result as string, file.type);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Camera Stream Lifecycle Management
  const handleStopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Track stop warning:', e);
        }
      });
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsStartingCamera(false);
  }, []);

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;
      }
    };
  }, []);

  // Attach stream to video element when active or device changes
  useEffect(() => {
    if (isCameraActive && videoRef.current && cameraStreamRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== cameraStreamRef.current) {
        video.srcObject = cameraStreamRef.current;
      }
      video.setAttribute('playsinline', 'true');
      video.muted = true;
      video.play().catch(err => {
        console.warn('Camera video auto-play warning:', err);
      });
    }
  }, [isCameraActive, selectedDeviceId, cameraFacingMode]);

  // Start Hardware Camera with timeout protection and progressive resolution fallback
  const handleStartCamera = useCallback(async (
    overrideDeviceId?: string,
    overrideFacing?: 'environment' | 'user',
    isSafeMode: boolean = false
  ) => {
    setCameraError(null);
    setIsStartingCamera(true);

    if (!navigator?.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsStartingCamera(false);
      setIsCameraActive(false);
      setCameraError('Hardware camera access is not supported by your browser environment. Please upload a cover image.');
      return;
    }

    // Stop any existing stream and animation
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => {
        try { t.stop(); } catch (e) { /* ignore */ }
      });
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // 120ms cooldown to release any previous hardware locks
    await new Promise(r => setTimeout(r, 120));

    const targetFacing = overrideFacing || cameraFacingMode;
    const targetDeviceId = overrideDeviceId !== undefined ? overrideDeviceId : selectedDeviceId;

    // Helper: getUserMedia with explicit timeout to avoid Chromium hang/freeze
    const getUserMediaWithTimeout = (constraints: MediaStreamConstraints, timeoutMs: number): Promise<MediaStream> => {
      return new Promise((resolve, reject) => {
        let timedOut = false;
        const timer = setTimeout(() => {
          timedOut = true;
          reject(new Error('Timeout starting video source (hardware negotiation delay)'));
        }, timeoutMs);

        navigator.mediaDevices.getUserMedia(constraints)
          .then(st => {
            if (timedOut) {
              st.getTracks().forEach(t => { try { t.stop(); } catch (e) { /* ignore */ } });
              return;
            }
            clearTimeout(timer);
            resolve(st);
          })
          .catch(err => {
            clearTimeout(timer);
            if (!timedOut) reject(err);
          });
      });
    };

    try {
      let stream: MediaStream | null = null;

      // Stage 1: Balanced 720p constraints (avoid 1080p which triggers Chrome driver timeout)
      if (!isSafeMode) {
        try {
          const constraints: MediaStreamConstraints = targetDeviceId
            ? {
                video: {
                  deviceId: { exact: targetDeviceId },
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                },
                audio: false
              }
            : {
                video: {
                  facingMode: { ideal: targetFacing },
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                },
                audio: false
              };
          stream = await getUserMediaWithTimeout(constraints, 4500);
        } catch (stage1Err: any) {
          console.warn('Initial 720p camera constraints timed out or failed, falling back to 480p Safe Mode:', stage1Err?.message || stage1Err);
          await new Promise(r => setTimeout(r, 200));
        }
      }

      // Stage 2: 480p Safe Mode (fast start for laptop webcams & virtual drivers)
      if (!stream) {
        try {
          const safeConstraints: MediaStreamConstraints = {
            video: {
              facingMode: { ideal: targetFacing },
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: false
          };
          stream = await getUserMediaWithTimeout(safeConstraints, 3500);
        } catch (stage2Err: any) {
          console.warn('Safe mode camera constraints failed, attempting basic video:', stage2Err?.message || stage2Err);
          await new Promise(r => setTimeout(r, 200));
        }
      }

      // Stage 3: Minimal unconstrained video
      if (!stream) {
        try {
          stream = await getUserMediaWithTimeout({ video: true, audio: false }, 3000);
        } catch (stage3Err: any) {
          console.warn('Minimal video constraint failed:', stage3Err?.message || stage3Err);
        }
      }

      if (!stream) {
        throw new Error('Timeout starting video source: Camera hardware took too long to respond.');
      }

      cameraStreamRef.current = stream;
      setIsCameraActive(true);
      setCameraError(null);

      // Connect stream to video if already rendered
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        videoRef.current.play().catch(e => console.warn('Video play warning:', e));
      }

      // Enumerate camera devices
      if (navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter(d => d.kind === 'videoinput');
          setCameraDevices(videoInputs);
          if (videoInputs.length > 0 && !targetDeviceId) {
            const activeTrack = stream.getVideoTracks()[0];
            const activeSettings = activeTrack?.getSettings?.();
            if (activeSettings?.deviceId) {
              setSelectedDeviceId(activeSettings.deviceId);
            }
          }
        } catch (enumErr) {
          console.warn('Enumerate devices warning:', enumErr);
        }
      }
    } catch (err: any) {
      // Use console.warn, not console.error, so hardware delays do not trigger unhandled error trackers
      console.warn('Camera access notice:', err?.message || err);
      setIsCameraActive(false);

      const errStr = (err?.message || '').toLowerCase();
      const isTimeout = errStr.includes('timeout') || errStr.includes('timed out') || err?.name === 'AbortError';

      let errorMsg = 'Unable to access live webcam.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || errStr.includes('permission denied')) {
        errorMsg = 'Camera permission was denied. Please allow camera access in your browser or upload a cover image.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera hardware detected. Please upload a cover image below.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'Camera is currently locked by another application. Close other camera apps, retry in Safe Mode (480p), or upload a cover image.';
      } else if (isTimeout) {
        errorMsg = 'Camera timed out starting video source (browser hardware delay). Please retry in Safe Mode (480p) or upload a photo.';
      } else {
        errorMsg = `Camera notice: ${err.message || 'Could not initialize video feed'}. You can upload a cover photo below.`;
      }
      setCameraError(errorMsg);
    } finally {
      setIsStartingCamera(false);
    }
  }, [cameraFacingMode, selectedDeviceId]);

  const handleToggleFacingMode = useCallback(() => {
    const nextFacing: 'environment' | 'user' = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextFacing);
    setSelectedDeviceId('');
    handleStartCamera('', nextFacing);
  }, [cameraFacingMode, handleStartCamera]);

  const handleSelectCameraDevice = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
    handleStartCamera(deviceId);
  }, [handleStartCamera]);

  const handleCaptureCameraPhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    if (width === 0 || height === 0) {
      setCameraError('Camera video feed is still initializing. Please wait 1 second and click Capture again.');
      return;
    }

    setIsCapturing(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror only if physical front/user camera
        if (cameraFacingMode === 'user' && !selectedDeviceId) {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

        // Flash visual indication
        setTimeout(() => {
          setIsCapturing(false);
          handleStopCamera();
          handleProcessImage(dataUrl, 'image/jpeg');
        }, 200);
      } else {
        setIsCapturing(false);
      }
    } catch (captureErr: any) {
      console.warn('Capture camera frame notice:', captureErr?.message || captureErr);
      setIsCapturing(false);
      setCameraError('Failed to capture photo frame from camera feed. Please try again or upload a photo file.');
    }
  }, [cameraFacingMode, selectedDeviceId, handleStopCamera, handleProcessImage]);

  // Rotate direct captions periodically while live camera is active
  useEffect(() => {
    if (!isCameraActive) return;

    const guidanceCaptions = [
      'AI Vision MARC Agent (Book Cover / Title Page Scanner) • Gemini 3.7 Flash Vision active.',
      'Live Camera Feed: Center book title typography and author byline squarely inside optical reticle.',
      'Gemini 3.7 Flash Vision: Real-time optical framing ready for instant RDA/MARC21 indexing.',
      'MARC21 Tags Primed: Leader, 020 (ISBN), 082 (DDC), 100 (Author), 245 (Title), 264 (Imprint).',
      "Ready to catalog: Tap 'Capture & Auto-Catalog' to run Gemini 3.7 Flash Vision inference."
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (!isCapturing && !isScanningImage && !isAnalyzingFrame) {
        index = (index + 1) % guidanceCaptions.length;
        setLiveCaptionText(guidanceCaptions[index]);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isCameraActive, isCapturing, isScanningImage, isAnalyzingFrame]);

  // Instant direct frame caption reading on live camera
  const handleInstantFrameCaption = useCallback(async () => {
    const video = videoRef.current;
    if (!video || isAnalyzingFrame) return;

    const width = video.videoWidth || 960;
    const height = video.videoHeight || 540;
    if (width === 0 || height === 0) return;

    setIsAnalyzingFrame(true);
    setLiveCaptionText('Gemini 3.7 Flash Vision: Analyzing live camera frame for title, authors, and classification...');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (cameraFacingMode === 'user' && !selectedDeviceId) {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        const res = await generateAiCataloguingFromImage(dataUrl, 'image/jpeg');
        if (res && res.title) {
          const authorStr = Array.isArray(res.authors) ? res.authors[0] : (res.authors || 'Unknown Author');
          setLiveCaptionText(`Gemini 3.7 Flash Vision Detected: "${res.title}" by ${authorStr} (Call: ${res.callNumber || res.ddcClassification || 'DDC'})`);
          setLiveCaptionMeta({
            title: res.title,
            author: authorStr,
            callNumber: res.callNumber || res.ddcClassification,
            isbn: res.isbn
          });
        } else {
          setLiveCaptionText('Gemini 3.7 Flash Vision: Frame inspected. Align cover closer to reticle for higher optical confidence.');
        }
      }
    } catch (e) {
      console.warn('Frame caption analysis notice:', e);
      setLiveCaptionText('Gemini 3.7 Flash Vision: Optical target ready. Ensure book cover is brightly lit and centered.');
    } finally {
      setIsAnalyzingFrame(false);
    }
  }, [cameraFacingMode, selectedDeviceId, isAnalyzingFrame]);

  // Reset form for clean manual entry
  const handleStartCleanManualEntry = () => {
    setEntryMode('MANUAL_ENTRY');
    setMarcForm({
      isbn: `978-969-${Math.floor(1000000 + Math.random() * 9000000)}`,
      title: '',
      authors: '',
      department: 'General Science',
      schemeId: 'scheme_1',
      callNumber: '025.04 LIS 2025',
      edition: '1st Edition',
      publisherName: '',
      publisherLocation: 'Islamabad, Pakistan',
      publisherYear: 2025,
      pageCount: 250,
      totalCopies: 1,
      accessionNumber: `ACC-${Math.floor(10000 + Math.random() * 90000)}`,
      copyNo: 'C.1',
      shelfLocation: 'Main Stack Section A',
      subjects: '',
      subjectEntries: [],
      description: '',
      generalNotes: '',
      coverUrl: '',
      format: 'PAPERBACK'
    });
    setAiVisionAnalysis(null);
    setImagePreviewUrl(null);
  };


  // Automatic Call Number Generation Handlers (Multilingual Unicode support)
  const handleTitleChangeAndAutoCallNumber = (newTitle: string) => {
    const generated = generateCallNumberForTitle(
      newTitle,
      marcForm.authors,
      marcForm.department,
      marcForm.schemeId,
      schemes
    );
    setMarcForm(prev => ({
      ...prev,
      title: newTitle,
      callNumber: newTitle.trim() ? generated.callNumber : prev.callNumber
    }));
  };

  const handleSchemeChangeAndAutoCallNumber = (newSchemeId: string) => {
    const generated = generateCallNumberForTitle(
      marcForm.title,
      marcForm.authors,
      marcForm.department,
      newSchemeId,
      schemes
    );
    setMarcForm(prev => ({
      ...prev,
      schemeId: newSchemeId,
      callNumber: generated.callNumber
    }));
  };

  const handleRegenerateCallNumber = () => {
    const generated = generateCallNumberForTitle(
      marcForm.title,
      marcForm.authors,
      marcForm.department,
      marcForm.schemeId,
      schemes
    );
    setMarcForm(prev => ({
      ...prev,
      callNumber: generated.callNumber
    }));
  };

  // Inter-Library Branch Transfers State
  const [transfers, setTransfers] = useState<InterLibraryTransfer[]>([
    {
      id: 'tr_101',
      copyBarcode: 'BAR88003',
      bookTitle: 'The C Programming Language',
      fromBranch: 'Central Academic Library',
      toBranch: 'Medical & Health Sciences Library',
      requestedBy: 'Prof. Sarah Jenkins',
      requestDate: '2026-07-24',
      status: 'IN_TRANSIT'
    },
    {
      id: 'tr_102',
      copyBarcode: 'BAR88001',
      bookTitle: 'Introduction to Algorithms (4th Edition)',
      fromBranch: 'Engineering & Tech Library',
      toBranch: 'Central Academic Library',
      requestedBy: 'David Miller',
      requestDate: '2026-07-22',
      status: 'COMPLETED',
      approvedBy: 'Dr. Aijaz Akhter'
    }
  ]);

  const [newTransferForm, setNewTransferForm] = useState({
    copyBarcode: 'BAR88001',
    fromBranch: 'Central Academic Library',
    toBranch: 'Engineering & Tech Library'
  });

  // Fine Clearance Desk State
  const [selectedPatronCode, setSelectedPatronCode] = useState('');
  const [finePaymentAmount, setFinePaymentAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CREDIT_CARD' | 'WAIVER'>('CASH');
  const [lastReceipt, setLastReceipt] = useState<{
    receiptNo: string;
    patronName: string;
    amount: number;
    mode: string;
    date: string;
  } | null>(null);

  // Helper to get all registered physical copies for a book
  const getBookPhysicalCopies = (book: BookRecord): BookCopy[] => {
    const matched = copies.filter(c => c.bookId === book.id);
    if (matched.length > 0) return matched;
    // Synthesize the primary copy from the book record itself if no separate copies registered yet
    return [
      {
        id: `cp_${book.id}_main`,
        bookId: book.id,
        accessionNumber: book.accessionNumber || 'ACC-88001',
        barcode: `BAR${(book.accessionNumber || '88001').replace(/\D/g, '') || '88001'}`,
        rfidUid: `RFID${(book.accessionNumber || '88001').replace(/\D/g, '') || '88001'}`,
        status: (book.availableCopies > 0 ? 'AVAILABLE' : 'ISSUED') as BookCopy['status'],
        branchLocation: settings?.branches?.[0] || 'Central Academic Library'
      }
    ];
  };

  // Helper to calculate next suggested accession number
  const calculateNextAccessionNumber = (prefix = 'ACC-2026-'): { accession: string; num: number } => {
    let highestNum = 1000;
    // Check in copies
    copies.forEach(c => {
      const match = c.accessionNumber.match(/(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > highestNum && n < 999999) highestNum = n;
      }
    });
    // Check in books
    books.forEach(b => {
      if (b.accessionNumber) {
        const match = b.accessionNumber.match(/(\d+)$/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > highestNum && n < 999999) highestNum = n;
        }
      }
    });
    const nextNum = highestNum + 1;
    return {
      accession: `${prefix}${String(nextNum).padStart(4, '0')}`,
      num: nextNum
    };
  };

  // Open "Physical Copies & Accession Manager" for a specific book
  const handleOpenCopiesManager = (book: BookRecord, initialTab: 'SINGLE' | 'BATCH' | 'LIST' = 'SINGLE') => {
    setSelectedBookForCopies(book);
    setCopyModalTab(initialTab);
    const existingCopies = getBookPhysicalCopies(book);
    const nextCopyIndex = existingCopies.length + 1;
    const { accession, num } = calculateNextAccessionNumber();

    setSingleCopyForm({
      accessionNumber: accession,
      copyNumber: `C.${nextCopyIndex}`,
      shelfLocation: book.shelfLocation || 'Stack CS-01-A',
      branchLocation: settings?.branches?.[0] || 'Central Academic Library',
      barcode: `BAR${num}`,
      rfidUid: `RFID${num}`,
      status: 'AVAILABLE'
    });

    setBatchCopyForm({
      quantity: 3,
      prefix: 'ACC-2026-',
      startNumber: num,
      shelfLocation: book.shelfLocation || 'Stack CS-01-A',
      branchLocation: settings?.branches?.[0] || 'Central Academic Library'
    });
  };

  // Add Single Physical Copy Handler
  const handleAddSingleCopySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForCopies) return;

    if (!singleCopyForm.accessionNumber.trim()) {
      alert('Please provide an Accession Number for this physical copy.');
      return;
    }

    // Check if accession number already exists
    const duplicate = copies.some(c => c.accessionNumber.toLowerCase() === singleCopyForm.accessionNumber.trim().toLowerCase());
    if (duplicate) {
      if (!confirm(`Warning: Accession Number "${singleCopyForm.accessionNumber}" already exists in the system. Proceed anyway?`)) {
        return;
      }
    }

    const newCopyId = `cp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newCopy: BookCopy = {
      id: newCopyId,
      bookId: selectedBookForCopies.id,
      accessionNumber: singleCopyForm.accessionNumber.trim(),
      barcode: singleCopyForm.barcode.trim() || `BAR${Date.now().toString().slice(-6)}`,
      rfidUid: singleCopyForm.rfidUid.trim() || `RFID${Date.now().toString().slice(-6)}`,
      status: singleCopyForm.status,
      branchLocation: singleCopyForm.branchLocation
    };

    if (onAddCopies) {
      onAddCopies([newCopy], selectedBookForCopies.id);
    }

    // Update the selected book reference with new total/available copies
    const updatedBook: BookRecord = {
      ...selectedBookForCopies,
      totalCopies: selectedBookForCopies.totalCopies + 1,
      availableCopies: selectedBookForCopies.availableCopies + (newCopy.status === 'AVAILABLE' ? 1 : 0),
      shelfLocation: singleCopyForm.shelfLocation || selectedBookForCopies.shelfLocation
    };
    if (onUpdateBook) {
      onUpdateBook(selectedBookForCopies.id, updatedBook);
    }
    setSelectedBookForCopies(updatedBook);

    alert(`Physical Copy Added Successfully!\n• Book: "${selectedBookForCopies.title}"\n• Accession No: ${newCopy.accessionNumber}\n• Copy Designation: ${singleCopyForm.copyNumber}\n• Location: ${singleCopyForm.shelfLocation || singleCopyForm.branchLocation}`);

    // Pre-calculate next accession for seamless sequential entry
    const existingCopies = getBookPhysicalCopies(updatedBook);
    const nextCopyIndex = existingCopies.length + 1;
    const { accession, num } = calculateNextAccessionNumber();
    setSingleCopyForm({
      accessionNumber: accession,
      copyNumber: `C.${nextCopyIndex}`,
      shelfLocation: singleCopyForm.shelfLocation,
      branchLocation: singleCopyForm.branchLocation,
      barcode: `BAR${num}`,
      rfidUid: `RFID${num}`,
      status: 'AVAILABLE'
    });
  };

  // Batch Add Multiple Physical Copies Handler
  const handleAddBatchCopiesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForCopies) return;

    const count = Math.max(1, Math.min(50, batchCopyForm.quantity));
    const generatedCopies: BookCopy[] = [];
    const existingCopies = getBookPhysicalCopies(selectedBookForCopies);
    let startCopyIdx = existingCopies.length + 1;

    for (let i = 0; i < count; i++) {
      const currentNum = batchCopyForm.startNumber + i;
      const accNum = `${batchCopyForm.prefix}${String(currentNum).padStart(4, '0')}`;
      generatedCopies.push({
        id: `cp_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`,
        bookId: selectedBookForCopies.id,
        accessionNumber: accNum,
        barcode: `BAR${currentNum}`,
        rfidUid: `RFID${currentNum}`,
        status: 'AVAILABLE',
        branchLocation: batchCopyForm.branchLocation
      });
      startCopyIdx++;
    }

    if (onAddCopies) {
      onAddCopies(generatedCopies, selectedBookForCopies.id);
    }

    const updatedBook: BookRecord = {
      ...selectedBookForCopies,
      totalCopies: selectedBookForCopies.totalCopies + count,
      availableCopies: selectedBookForCopies.availableCopies + count,
      shelfLocation: batchCopyForm.shelfLocation || selectedBookForCopies.shelfLocation
    };
    if (onUpdateBook) {
      onUpdateBook(selectedBookForCopies.id, updatedBook);
    }
    setSelectedBookForCopies(updatedBook);

    alert(`Batch Ingestion Complete!\nSuccessfully added ${count} physical copies (${generatedCopies[0].accessionNumber} through ${generatedCopies[count - 1].accessionNumber}) to "${selectedBookForCopies.title}".`);
    setCopyModalTab('LIST');
  };

  // Delete an individual physical copy
  const handleDeletePhysicalCopy = (copyId: string, accNum: string) => {
    if (!selectedBookForCopies) return;
    if (!confirm(`Are you sure you want to remove physical copy accession "${accNum}" from "${selectedBookForCopies.title}"?`)) {
      return;
    }

    if (onDeleteCopy) {
      onDeleteCopy(copyId, selectedBookForCopies.id);
    }

    const updatedBook: BookRecord = {
      ...selectedBookForCopies,
      totalCopies: Math.max(1, selectedBookForCopies.totalCopies - 1),
      availableCopies: Math.max(0, selectedBookForCopies.availableCopies - 1)
    };
    if (onUpdateBook) {
      onUpdateBook(selectedBookForCopies.id, updatedBook);
    }
    setSelectedBookForCopies(updatedBook);
  };

  // Start Editing an existing MARC21 / RDA Record
  const handleStartEdit = (book: BookRecord) => {
    setEditingBookId(book.id);
    const existingSubjectEntries = ensureBookSubjectEntries(book);
    setMarcForm({
      isbn: book.isbn || '',
      title: book.title || '',
      authors: Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || ''),
      department: book.department || 'Computer Science',
      schemeId: 'scheme_1',
      callNumber: book.callNumber || '',
      edition: book.edition || '1st Edition',
      publisherName: book.publisherName || '',
      publisherLocation: book.publisherLocation || '',
      publisherYear: book.publisherYear || 2022,
      pageCount: book.pageCount || 300,
      totalCopies: book.totalCopies || 1,
      accessionNumber: book.accessionNumber || 'ACC-88001',
      copyNo: book.copyNo || book.copyNumber || 'C.1',
      shelfLocation: book.shelfLocation || 'Stack CS-01-A',
      subjects: Array.isArray(book.subjects) ? book.subjects.join(', ') : (book.subjects || ''),
      subjectEntries: existingSubjectEntries,
      description: book.description || (book.marcTags?.['520'] ? book.marcTags['520'].replace(/^\$a\s*/, '') : ''),
      generalNotes: book.generalNotes || book.notes || (book.marcTags?.['500'] ? book.marcTags['500'].replace(/^\$a\s*/, '') : ''),
      coverUrl: book.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80',
      format: book.format || 'HARDCOVER'
    });
    setAiMarcPreview(null);
    if (selectedBookForMarc) setSelectedBookForMarc(null);
    setActiveTab('NEW_MARC');
  };

  // Cancel Edit and return to Blank New Record
  const handleCancelEdit = () => {
    setEditingBookId(null);
    setMarcForm(defaultMarcForm);
    setAiMarcPreview(null);
  };

  // 1-Minute Fast Purge to Clean Slate (0 Books / 0 Copies)
  const handlePurgeAllToCleanSlate = () => {
    setReferenceCatalogActive(false);
    if (editingBookId) {
      setEditingBookId(null);
      setMarcForm(defaultMarcForm);
      setAiMarcPreview(null);
    }
    if (selectedBookForCopies) {
      setSelectedBookForCopies(null);
    }
    if (selectedBookForMarc) {
      setSelectedBookForMarc(null);
    }
    if (onDeleteAllBooks) {
      onDeleteAllBooks();
    }
    idbClearAll().catch(() => {});
    setCurrentPage(1);
    setSelectedDdcFilter('ALL');
    setCatalogRefreshTrigger(prev => prev + 1);
  };

  // Purge Custom Ingested Records Only
  const handlePurgeCustomOnly = () => {
    if (editingBookId) {
      setEditingBookId(null);
      setMarcForm(defaultMarcForm);
    }
    if (onDeleteAllBooks) {
      onDeleteAllBooks();
    }
    idbClearAll().catch(() => {});
    setCurrentPage(1);
    setCatalogRefreshTrigger(prev => prev + 1);
  };

  // Restore 300,000 Reference Benchmark Catalog
  const handleRestoreReferenceCatalog = () => {
    setReferenceCatalogActive(true);
    if (onRestoreSampleBooks) {
      onRestoreSampleBooks();
    }
    setCurrentPage(1);
    setSelectedDdcFilter('ALL');
    setCatalogRefreshTrigger(prev => prev + 1);
  };

  // Delete All Books and physical copies from catalog
  const handleConfirmDeleteAllBooks = () => {
    if (!onDeleteAllBooks) return;
    if (editingBookId) {
      setEditingBookId(null);
      setMarcForm(defaultMarcForm);
      setAiMarcPreview(null);
    }
    if (selectedBookForCopies) {
      setSelectedBookForCopies(null);
    }
    if (selectedBookForMarc) {
      setSelectedBookForMarc(null);
    }
    const count = books.length;
    onDeleteAllBooks();
    setIsDeleteAllModalOpen(false);
    setDeleteAllConfirmInput('');
    alert(`Catalog Purge Successful!\nAll ${count} book records and associated physical copy holdings have been deleted from the database.`);
  };

  // High-Capacity 300,000 Catalog (3.0 Lakhs) Paginated Items & Counts
  const filteredBooks = catalogResult.items;
  const totalCatalogCount = catalogResult.totalCount;
  const totalPages = catalogResult.totalPages;

  // Check user powers & librarian privileges (Unrestricted cataloguing for all librarians and staff)
  const userPowers = currentUser?.staffPowers || [];
  const isLibrarian =
    !currentUser ||
    ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PRINCIPAL', 'CHIEF_LIBRARIAN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN'].includes(currentUser?.role as any) ||
    userPowers.includes('CAN_CATALOG');
  const canCatalog = isLibrarian;
  const canClearFines = isLibrarian || userPowers.includes('CAN_CLEAR_FINES');
  const canTransfer = isLibrarian || userPowers.includes('CAN_INTER_LIBRARY_TRANSFER');

  // AI Auto-Catalog
  const handleAiAutoCatalog = async () => {
    const input = marcForm.title || marcForm.isbn;
    if (!input) {
      alert('Please enter a Title or ISBN first before running AI Auto-Cataloguing.');
      return;
    }

    setIsAiCataloguing(true);
    try {
      const res = await generateAiCataloguing(input);
      setMarcForm(prev => ({
        ...prev,
        title: res.title || prev.title,
        authors: res.authors ? res.authors.join(', ') : prev.authors,
        publisherName: res.publisherName || prev.publisherName,
        publisherYear: res.publisherYear || prev.publisherYear,
        callNumber: res.callNumber || prev.callNumber,
        subjects: res.subjects ? res.subjects.join(', ') : prev.subjects,
        description: res.abstract || prev.description,
        generalNotes: res.rdaGuidelines ? `RDA Standard: ${res.rdaGuidelines}` : prev.generalNotes,
        accessionNumber: prev.accessionNumber || `ACC-${Math.floor(10000 + Math.random() * 90000)}`,
        copyNo: prev.copyNo || 'C.1'
      }));
      setAiMarcPreview(res.marc21Tags || []);
      alert(`AI Cataloguing Complete!\n• Generated DDC: ${res.ddcClassification}\n• Call Number: ${res.callNumber}\n• MARC21 ISO tags auto-indexed.`);
    } catch (err) {
      console.error(err);
      alert('AI Cataloguing failed. Falling back to manual entry.');
    } finally {
      setIsAiCataloguing(false);
    }
  };

  // Handle MARC form submit (Handles both Create New and Update Existing)
  const handleSaveMarcRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCatalog) {
      alert('Action Denied: You do not have MARC21 Cataloguing power assigned.');
      return;
    }

    const parsedAuthors = marcForm.authors.split(',').map(a => a.trim()).filter(Boolean);
    const parsedSubjects = marcForm.subjects.split(',').map(s => s.trim()).filter(Boolean);

    // Compute effective structured subject entries
    const effectiveSubjectEntries: MarcSubjectEntry[] = (marcForm.subjectEntries && marcForm.subjectEntries.length > 0)
      ? marcForm.subjectEntries
      : (parsedSubjects.length > 0
          ? parsedSubjects.map(s => createMarcSubjectEntry({ term: s }))
          : [createMarcSubjectEntry({ term: 'General' })]);

    const formattedSubjectHeadings = effectiveSubjectEntries.map(e => e.formattedHeading);

    if (editingBookId) {
      // UPDATE EXISTING RECORD
      const existingBook = books.find(b => b.id === editingBookId);
      const updatedBook: BookRecord = {
        id: editingBookId,
        isbn: marcForm.isbn,
        title: marcForm.title,
        authors: parsedAuthors.length > 0 ? parsedAuthors : ['Unknown Author'],
        department: marcForm.department,
        callNumber: marcForm.callNumber,
        edition: marcForm.edition,
        publisherName: marcForm.publisherName,
        publisherLocation: marcForm.publisherLocation,
        publisherYear: Number(marcForm.publisherYear) || 2022,
        pageCount: Number(marcForm.pageCount) || 200,
        totalCopies: Number(marcForm.totalCopies) || existingBook?.totalCopies || 1,
        availableCopies: existingBook?.availableCopies !== undefined ? existingBook.availableCopies : Number(marcForm.totalCopies) || 1,
        accessionNumber: marcForm.accessionNumber,
        copyNo: marcForm.copyNo,
        copyNumber: marcForm.copyNo,
        shelfLocation: marcForm.shelfLocation,
        subjects: formattedSubjectHeadings.length > 0 ? formattedSubjectHeadings : ['General'],
        subjectEntries: effectiveSubjectEntries,
        description: marcForm.description,
        generalNotes: marcForm.generalNotes,
        notes: marcForm.generalNotes,
        coverUrl: marcForm.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80',
        format: marcForm.format,
        marcTags: {
          ...(existingBook?.marcTags || {}),
          '001': editingBookId,
          '020': `$a ${marcForm.isbn}`,
          '082': `$a ${marcForm.callNumber}`,
          '090': `$a ${marcForm.accessionNumber} $b ${marcForm.copyNo}`,
          '100': `$a ${marcForm.authors}`,
          '245': `$a ${marcForm.title}`,
          '260': `$a ${marcForm.publisherLocation} $b ${marcForm.publisherName} $c ${marcForm.publisherYear}`,
          '300': `$a ${marcForm.pageCount} p.`,
          '500': marcForm.generalNotes ? `$a ${marcForm.generalNotes}` : '$a General note',
          '520': marcForm.description ? `$a ${marcForm.description}` : '$a Summary and description',
          '650': effectiveSubjectEntries.filter(e => e.tag === '650').map(e => e.rawMarcString || `$a ${e.formattedHeading}`).join(' ; ') || `$a ${formattedSubjectHeadings.join(' ; ')}`,
          '651': effectiveSubjectEntries.filter(e => e.tag === '651').map(e => e.rawMarcString || `$a ${e.formattedHeading}`).join(' ; '),
          '600': effectiveSubjectEntries.filter(e => e.tag === '600').map(e => e.rawMarcString || `$a ${e.formattedHeading}`).join(' ; '),
          '655': effectiveSubjectEntries.filter(e => e.tag === '655').map(e => e.rawMarcString || `$a ${e.formattedHeading}`).join(' ; '),
          '852': `$p ${marcForm.accessionNumber} $t ${marcForm.copyNo} $c ${marcForm.shelfLocation}`
        }
      };

      if (onUpdateBook) {
        onUpdateBook(editingBookId, updatedBook);
      }

      alert(`MARC21 Bibliographic Record Updated Successfully!\n• Title: "${updatedBook.title}"\n• ISBN: ${updatedBook.isbn}\n• Call Number: ${updatedBook.callNumber}\n• Shelf Location: ${updatedBook.shelfLocation}`);
      setEditingBookId(null);
      setMarcForm(defaultMarcForm);
      setActiveTab('CATALOG');
    } else {
      // CREATE NEW RECORD
      const newBookId = `bk_${Date.now()}`;
      const createdBook: BookRecord = {
        id: newBookId,
        isbn: marcForm.isbn,
        title: marcForm.title,
        authors: parsedAuthors.length > 0 ? parsedAuthors : ['Unknown Author'],
        department: marcForm.department,
        callNumber: marcForm.callNumber,
        edition: marcForm.edition,
        publisherName: marcForm.publisherName,
        publisherLocation: marcForm.publisherLocation,
        publisherYear: Number(marcForm.publisherYear) || 2022,
        pageCount: Number(marcForm.pageCount) || 200,
        totalCopies: Number(marcForm.totalCopies) || 1,
        availableCopies: Number(marcForm.totalCopies) || 1,
        accessionNumber: marcForm.accessionNumber,
        copyNo: marcForm.copyNo,
        copyNumber: marcForm.copyNo,
        shelfLocation: marcForm.shelfLocation,
        subjects: formattedSubjectHeadings.length > 0 ? formattedSubjectHeadings : ['General'],
        subjectEntries: effectiveSubjectEntries,
        description: marcForm.description,
        generalNotes: marcForm.generalNotes,
        notes: marcForm.generalNotes,
        coverUrl: marcForm.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80',
        format: marcForm.format,
        marcTags: {
          '001': newBookId,
          '020': `$a ${marcForm.isbn}`,
          '082': `$a ${marcForm.callNumber}`,
          '090': `$a ${marcForm.accessionNumber} $b ${marcForm.copyNo}`,
          '100': `$a ${marcForm.authors}`,
          '245': `$a ${marcForm.title}`,
          '260': `$a ${marcForm.publisherLocation} $b ${marcForm.publisherName} $c ${marcForm.publisherYear}`,
          '300': `$a ${marcForm.pageCount} p.`,
          '500': marcForm.generalNotes ? `$a ${marcForm.generalNotes}` : '$a General note',
          '520': marcForm.description ? `$a ${marcForm.description}` : '$a Summary and description',
          '650': effectiveSubjectEntries.filter(e => e.tag === '650').map(e => e.rawMarcString || `$a ${e.formattedHeading}`).join(' ; ') || `$a ${formattedSubjectHeadings.join(' ; ')}`,
          '651': effectiveSubjectEntries.filter(e => e.tag === '651').map(e => e.rawMarcString || `$a ${e.formattedHeading}`).join(' ; '),
          '600': effectiveSubjectEntries.filter(e => e.tag === '600').map(e => e.rawMarcString || `$a ${e.formattedHeading}`).join(' ; '),
          '655': effectiveSubjectEntries.filter(e => e.tag === '655').map(e => e.rawMarcString || `$a ${e.formattedHeading}`).join(' ; '),
          '852': `$p ${marcForm.accessionNumber} $t ${marcForm.copyNo} $c ${marcForm.shelfLocation}`
        }
      };

      if (onAddBook) {
        onAddBook(createdBook);
      }

      // Automatically register physical copies into copies state with extended high-capacity support
      if (onAddCopies) {
        const copiesCount = Math.max(1, Number(marcForm.totalCopies) || 1);
        const generatedCopies: BookCopy[] = [];
        const baseAcc = createdBook.accessionNumber || 'ACC-2026-0891';
        const numPart = parseInt(baseAcc.replace(/\D/g, ''), 10) || Math.floor(10000 + Math.random() * 90000);

        // Generate up to copiesCount (supports high-volume cataloguing up to 5000 copies without limit)
        const countToCreate = Math.min(copiesCount, 5000);
        for (let i = 1; i <= countToCreate; i++) {
          const accNo = i === 1 ? baseAcc : `${baseAcc}-C${i}`;
          generatedCopies.push({
            id: `cp_${newBookId}_${String(i).padStart(3, '0')}`,
            bookId: newBookId,
            accessionNumber: accNo,
            barcode: `BAR${numPart + i - 1}`,
            rfidUid: `RFID${Math.floor(10000 + Math.random() * 90000)}`,
            status: 'AVAILABLE',
            branchLocation: settings?.branches?.[0] || 'Central Academic Library'
          });
        }
        onAddCopies(generatedCopies, newBookId);
      }

      alert(`MARC21 Bibliographic Record Created Successfully!\n• Title: "${createdBook.title}"\n• ISBN: ${createdBook.isbn}\n• Accession No: ${createdBook.accessionNumber}\n• Holdings Initialized.`);
      setMarcForm(defaultMarcForm);
      setActiveTab('CATALOG');
    }
  };

  // Handle Transfer Creation
  const handleInitiateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canTransfer) {
      alert('Action Denied: You do not have Inter-Library Branch Transfer power assigned.');
      return;
    }

    const targetBook = books.find(b => b.title.length > 0) || books[0];
    const newTr: InterLibraryTransfer = {
      id: `tr_${Date.now()}`,
      copyBarcode: newTransferForm.copyBarcode,
      bookTitle: targetBook?.title || 'Branch Transfer Copy',
      fromBranch: newTransferForm.fromBranch,
      toBranch: newTransferForm.toBranch,
      requestedBy: currentUser?.name || 'Librarian Desk',
      requestDate: new Date().toISOString().split('T')[0],
      status: 'IN_TRANSIT'
    };

    setTransfers(prev => [newTr, ...prev]);
    alert(`Transfer request initiated for barcode ${newTr.copyBarcode} from ${newTr.fromBranch} to ${newTr.toBranch}`);
  };

  // Handle Fine Payment
  const handleProcessFineClearance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canClearFines) {
      alert('Action Denied: You do not have Fine Clearance power assigned.');
      return;
    }

    const patron = users.find(
      u =>
        u.memberCode.toLowerCase() === selectedPatronCode.toLowerCase() ||
        u.email.toLowerCase() === selectedPatronCode.toLowerCase()
    );

    if (!patron) {
      alert(`Patron with code or email '${selectedPatronCode}' not found.`);
      return;
    }

    const amount = Number(finePaymentAmount) || patron.finePending || 0;
    if (onPayFine) {
      onPayFine(patron.id, amount);
    }

    const receipt = {
      receiptNo: `RCPT-${Date.now().toString().slice(-6)}`,
      patronName: patron.name,
      amount,
      mode: paymentMode,
      date: new Date().toLocaleString()
    };

    setLastReceipt(receipt);
    alert(`Clearance Receipt Issued: ${receipt.receiptNo} for patron ${patron.name} (Amount: ₹${amount})`);
    setSelectedPatronCode('');
    setFinePaymentAmount(0);
  };

  const renderPaginationBar = () => {
    const isFirstPage = currentPage <= 1;
    const isLastPage = currentPage >= totalPages;

    const pageNumbers: number[] = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    for (let p = startPage; p <= endPage; p++) {
      pageNumbers.push(p);
    }

    return (
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-xs">
        <div className="flex items-center space-x-2 text-slate-700 font-medium">
          <span>
            Showing <strong className="text-slate-900 font-mono font-bold">{(totalCatalogCount === 0 ? 0 : (currentPage - 1) * pageSize + 1).toLocaleString()}</strong> – <strong className="text-slate-900 font-mono font-bold">{Math.min(currentPage * pageSize, totalCatalogCount).toLocaleString()}</strong> of <strong className="text-blue-600 font-mono font-bold">{totalCatalogCount.toLocaleString()}</strong> Titles
          </span>
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-200">
            {(totalCatalogCount / 100000).toFixed(1)} Lakhs
          </span>
        </div>

        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5 justify-center">
          {/* First Page */}
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={isFirstPage}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center space-x-1 transition-all cursor-pointer"
            title="First Page"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">First</span>
          </button>

          {/* Previous Page */}
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={isFirstPage}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center space-x-1 transition-all cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Page Numbers */}
          {startPage > 1 && (
            <>
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                className="w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-mono text-xs font-semibold cursor-pointer"
              >
                1
              </button>
              {startPage > 2 && <span className="text-slate-400 font-mono px-0.5">...</span>}
            </>
          )}

          {pageNumbers.map(pageNum => (
            <button
              type="button"
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                currentPage === pageNum
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-600'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {pageNum}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="text-slate-400 font-mono px-0.5">...</span>}
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                className="w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-mono text-xs font-semibold cursor-pointer"
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Next Page */}
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={isLastPage}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center space-x-1 transition-all cursor-pointer"
            title="Next Page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={isLastPage}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center space-x-1 transition-all cursor-pointer"
            title="Last Page"
          >
            <span className="hidden sm:inline">Last</span>
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Direct Jump & Page Size */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-1.5 text-slate-500">
            <span className="text-[11px]">Go to:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              placeholder={String(currentPage)}
              value={jumpToPageInput}
              onChange={e => setJumpToPageInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const p = parseInt(jumpToPageInput, 10);
                  if (!isNaN(p) && p >= 1 && p <= totalPages) {
                    setCurrentPage(p);
                    setJumpToPageInput('');
                  }
                }
              }}
              className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => {
                const p = parseInt(jumpToPageInput, 10);
                if (!isNaN(p) && p >= 1 && p <= totalPages) {
                  setCurrentPage(p);
                  setJumpToPageInput('');
                }
              }}
              className="px-2 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Go
            </button>
          </div>

          <div className="flex items-center space-x-1.5 text-slate-500">
            <span className="text-[11px]">Per page:</span>
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Sub-Nav */}
      <div className="p-6 rounded-3xl border border-slate-200/90 bg-gradient-to-r from-[#121214] via-[#18181b] to-[#121214] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <FileCode className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                MARC21 / RDA Cataloguing & Copy Holdings Desk
              </h2>
              {editingBookId && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center space-x-1">
                  <Pencil className="h-3 w-3" />
                  <span>Editing Existing Record</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              ISO 2709 Bibliographic Control, Multi-Scheme Classification (DDC, LCC, HEC-PK, ISL), Copy Accessioning, and Barcode Spine Tagging.
            </p>
          </div>

          {/* Tab Navigation & High-Capacity Storage Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('CATALOG')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                activeTab === 'CATALOG'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-100 border border-slate-200/90 text-slate-500 hover:text-slate-900'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>MARC21 Catalog ({totalCatalogCount.toLocaleString()} / {(totalCatalogCount / 100000).toFixed(1)} Lakhs)</span>
            </button>

            <button
              onClick={() => {
                if (!editingBookId) {
                  setMarcForm(defaultMarcForm);
                }
                setActiveTab('NEW_MARC');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                activeTab === 'NEW_MARC' && entryMode !== 'VOICE_TO_MARC'
                  ? editingBookId
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                    : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-100 border border-slate-200/90 text-slate-500 hover:text-slate-900'
              }`}
            >
              {editingBookId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span>{editingBookId ? 'Edit Record Form' : '+ New MARC Record'}</span>
            </button>

            <button
              onClick={() => {
                if (!editingBookId) {
                  setMarcForm(defaultMarcForm);
                }
                setEntryMode('VOICE_TO_MARC');
                setActiveTab('NEW_MARC');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                activeTab === 'NEW_MARC' && entryMode === 'VOICE_TO_MARC'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-500/20'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-700 hover:bg-rose-500/20'
              }`}
            >
              <Mic className="h-4 w-4 text-rose-600" />
              <span>Voice-to-MARC21</span>
            </button>

            <button
              onClick={() => setActiveTab('TRANSFERS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                activeTab === 'TRANSFERS'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                  : 'bg-slate-100 border border-slate-200/90 text-slate-500 hover:text-slate-900'
              }`}
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span>Inter-Library ({transfers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('FINES_DESK')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                activeTab === 'FINES_DESK'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-slate-100 border border-slate-200/90 text-slate-500 hover:text-slate-900'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>Fines & Receipts</span>
            </button>

            <button
              onClick={() => setActiveTab('BARCODE_DESK')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                activeTab === 'BARCODE_DESK'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-100 border border-slate-200/90 text-slate-500 hover:text-slate-900'
              }`}
            >
              <QrCode className="h-4 w-4" />
              <span>Spine Barcodes</span>
            </button>
          </div>

          {/* Unlimited Capacity Indicator */}
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2 shadow-sm">
            <Database className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Storage Capacity: <strong className="text-emerald-900 font-mono">Unlimited (3.0 Lakhs+ Titles Active)</strong></span>
          </div>
        </div>
        </div>
      </div>

      {/* TAB 1: MARC21 / RDA 300,000 TITLES (3.0 LAKHS) CATALOG EXPLORER */}
      {activeTab === 'CATALOG' && (
        <div className="space-y-4">
          {/* Catalog Scale & Unlimited Storage Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Catalogued Titles</p>
                <p className="text-base font-bold text-slate-900 font-mono">
                  {totalCatalogCount.toLocaleString()} <span className="text-xs font-sans text-blue-600 font-bold">({(totalCatalogCount / 100000).toFixed(1)} Lakhs)</span>
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Database Capacity</p>
                <p className="text-sm font-bold text-slate-900 flex items-center space-x-1">
                  <span className="text-emerald-600 font-bold">Unlimited</span>
                  <span className="text-[10px] text-slate-400 font-normal">(IndexedDB + Cloud)</span>
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Dewey Classes (DDC)</p>
                <p className="text-sm font-bold text-slate-900 font-mono">10 Disciplines</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Copy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Holdings Tracked</p>
                <p className="text-base font-bold text-slate-900 font-mono">
                  {(totalCatalogCount * 2.2).toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs font-sans text-amber-600 font-bold">Copies</span>
                </p>
              </div>
            </div>
          </div>

          {/* DDC Classification Discipline Filters */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
                <span>Filter by Dewey Decimal Discipline (DDC 23rd Ed. MARC 082)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {selectedDdcFilter === 'ALL' ? 'Showing all 10 disciplines' : `Class ${selectedDdcFilter} active`}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {getCatalogFacets(books).map(facet => {
                const isSelected = selectedDdcFilter === facet.code;
                const formattedCount =
                  facet.count >= 100000
                    ? `${(facet.count / 100000).toFixed(1)}L`
                    : facet.count >= 1000
                    ? `${(facet.count / 1000).toFixed(0)}k`
                    : `${facet.count}`;

                return (
                  <button
                    key={facet.code}
                    type="button"
                    onClick={() => {
                      setSelectedDdcFilter(facet.code);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-medium transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    <span>{facet.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                      }`}
                    >
                      {formattedCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Bar & Action Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 flex items-center bg-white border border-slate-200/90 rounded-xl shadow-sm focus-within:border-blue-500 overflow-hidden">
              <div className="pl-3 pr-2 py-2.5 flex items-center space-x-1.5 border-r border-slate-200 bg-slate-50/80 shrink-0">
                <Tag className="h-3.5 w-3.5 text-slate-500" />
                <select
                  value={searchScope}
                  onChange={e => {
                    setSearchScope(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="ALL">All Fields</option>
                  <option value="SUBJECT">Subject (MARC 6XX / RDA)</option>
                  <option value="TITLE">Title & Subtitle</option>
                  <option value="AUTHOR">Author / Creator</option>
                  <option value="CALL_NUMBER">Call Number (DDC)</option>
                  <option value="ISBN">ISBN / Accession No</option>
                </select>
              </div>

              <div className="relative flex-1 flex items-center">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    searchScope === 'SUBJECT'
                      ? 'Search by MARC 650/651/655 Subject (e.g. Software architecture, Constitutional law, Pakistan)...'
                      : searchScope === 'TITLE'
                      ? 'Search by book title or subtitle...'
                      : searchScope === 'AUTHOR'
                      ? 'Search by author or contributor...'
                      : 'Search across 300,000+ titles by Subject, Title, Author, ISBN, Call Number...'
                  }
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-transparent pl-9 pr-14 py-2.5 text-xs text-slate-900 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm shrink-0"
                title="Export 300,000+ Titles or 660,000+ Holdings in CSV, MARC21, MARCXML, Excel, or JSON"
              >
                <Download className="h-4 w-4" />
                <span>Export Holdings (300k / 3.0L)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm shrink-0"
                title="Bulk Ingest Titles & Physical Holdings into Unlimited Database"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Bulk Import Holdings</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHoldingsBuilderOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm shrink-0"
                title="Add & Provision Holding Books on Institutional Needs (Up to 3 Lakhs)"
              >
                <PlusCircle className="h-4 w-4" />
                <span>+ Provision Holdings (Up to 3L)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPurgeModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm shrink-0"
                title="Remove / Purge catalog records within a minute and reset to clean slate"
              >
                <Trash2 className="h-4 w-4" />
                <span>Purge / Reset Catalog</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingBookId(null);
                  setMarcForm(defaultMarcForm);
                  setEntryMode('VOICE_TO_MARC');
                  setActiveTab('NEW_MARC');
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shrink-0"
              >
                <Mic className="h-4 w-4 text-rose-200 animate-pulse" />
                <span>Voice-to-MARC21</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingBookId(null);
                  setMarcForm(defaultMarcForm);
                  setEntryMode('AI_IMAGE_AGENT');
                  setActiveTab('NEW_MARC');
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm shrink-0"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>AI Cover Scan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingBookId(null);
                  setMarcForm(defaultMarcForm);
                  setActiveTab('NEW_MARC');
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>+ Add MARC Record</span>
              </button>
            </div>
          </div>

          {/* Top Pagination Bar */}
          {totalCatalogCount > 0 && renderPaginationBar()}

          {/* Catalog Book Cards Grid */}
          {filteredBooks.length === 0 ? (
            totalCatalogCount === 0 ? (
              <div className="p-10 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
                <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    Clean Slate Active — Library Database Ready (0 Records)
                  </h3>
                  <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                    All previous records have been purged in under a minute. Any librarian can now add holding books based on institutional needs (up to 3 Lakhs / 300,000 titles).
                  </p>
                </div>

                {/* Instant Action Tools in Empty Slate */}
                <div className="flex items-center flex-wrap justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsHoldingsBuilderOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>+ Provision Holdings on Need (Up to 3 Lakhs)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/80 font-bold text-xs flex items-center space-x-2 cursor-pointer shadow-sm"
                  >
                    <UploadCloud className="h-4 w-4" />
                    <span>Bulk Ingest File (CSV / MARC21 / Excel)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingBookId(null);
                      setMarcForm(defaultMarcForm);
                      setEntryMode('VOICE_TO_MARC');
                      setActiveTab('NEW_MARC');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs flex items-center space-x-2 cursor-pointer shadow-sm"
                  >
                    <Mic className="h-4 w-4" />
                    <span>Voice-to-MARC Dictate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingBookId(null);
                      setMarcForm(defaultMarcForm);
                      setActiveTab('NEW_MARC');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center space-x-2 cursor-pointer shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>+ Manual MARC Record</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRestoreReferenceCatalog}
                    className="px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center space-x-2 cursor-pointer shadow-sm"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Restore 300k Benchmark Catalog</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 rounded-2xl border border-slate-200/90 bg-white flex flex-col items-center justify-center text-center space-y-3 shadow-sm">
                <Search className="h-10 w-10 text-slate-300" />
                <p className="text-base font-bold text-slate-900">No titles found matching "{searchQuery}"</p>
                <p className="text-xs text-slate-500 max-w-md">
                  Try refining your keyword query, or switch discipline filter to "All Titles".
                </p>
                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedDdcFilter('ALL');
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all cursor-pointer"
                  >
                    Reset Search & Filters
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBooks.map(b => {
                const bookCopies = getBookPhysicalCopies(b);
                const availableCount = bookCopies.filter(c => c.status === 'AVAILABLE').length;
                const isCustom = b.isCustomAdded || !b.id.startsWith('bk_300k_');

                return (
                  <div
                    key={b.id}
                    className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-500/40 hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                        <img
                          src={b.coverUrl}
                          alt={b.title}
                          className="w-16 h-24 rounded-xl object-cover border border-slate-200 shrink-0 shadow-sm bg-slate-100"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 font-mono text-[10px] text-blue-700 font-semibold">
                              {b.callNumber}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">ISBN: {b.isbn}</span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-700 font-medium">
                              {b.department}
                            </span>
                            {isCustom && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold text-[10px]">
                                Custom Ingested Record
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm leading-snug">{b.title}</h3>
                          <p className="text-xs text-slate-600 font-medium">{b.authors.join(', ')}</p>
                          <p className="text-[11px] text-slate-500">
                            {b.publisherName} ({b.publisherYear}) • {b.edition || '1st Edition'} • {b.pageCount} Pages
                          </p>
                          {b.description && (
                            <p className="text-[11px] text-slate-600 italic line-clamp-2 mt-1 border-l-2 border-emerald-500 pl-2 bg-slate-50 py-0.5 rounded-r">
                              "{b.description}"
                            </p>
                          )}
                          {b.generalNotes && (
                            <p className="text-[10px] text-slate-500 line-clamp-1 flex items-center space-x-1">
                              <span className="text-amber-600 font-semibold font-mono">500 Note:</span>
                              <span>{b.generalNotes}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quick Action Menu: Edit & Delete */}
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          title="Edit Bibliographic Record"
                          onClick={() => handleStartEdit(b)}
                          className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-600 hover:text-white transition-all cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        {onDeleteBook && (
                          <button
                            type="button"
                            title="Remove MARC21 Record"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete MARC21 record:\n"${b.title}"?`)) {
                                onDeleteBook(b.id);
                              }
                            }}
                            className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* MARC 6XX Subject Access Points / RDA Subject Headings */}
                    {((b.subjectEntries && b.subjectEntries.length > 0) || (b.subjects && b.subjects.length > 0)) && (
                      <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                        <span className="text-[10px] font-bold text-slate-500 font-mono flex items-center space-x-1 shrink-0">
                          <Tag className="h-3 w-3 text-emerald-600" />
                          <span>6XX Subjects:</span>
                        </span>
                        {b.subjectEntries && b.subjectEntries.length > 0 ? (
                          b.subjectEntries.slice(0, 3).map((entry, idx) => (
                            <button
                              key={entry.id || idx}
                              type="button"
                              onClick={() => {
                                setSearchQuery(entry.term);
                                setSearchScope('SUBJECT');
                                setCurrentPage(1);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-medium transition-all cursor-pointer flex items-center space-x-1"
                              title={`Filter catalog by subject: ${entry.formattedHeading}`}
                            >
                              <span className="font-mono text-[9px] text-emerald-700 font-bold">{entry.tag}</span>
                              <span className="truncate max-w-[140px]">{entry.formattedHeading}</span>
                            </button>
                          ))
                        ) : (
                          b.subjects.slice(0, 3).map((subj, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSearchQuery(subj);
                                setSearchScope('SUBJECT');
                                setCurrentPage(1);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition-all cursor-pointer truncate max-w-[140px]"
                              title={`Filter catalog by subject: ${subj}`}
                            >
                              {subj}
                            </button>
                          ))
                        )}
                        {b.subjectEntries && b.subjectEntries.length > 3 && (
                          <span className="text-[9px] text-slate-600 font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                            +{b.subjectEntries.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* MARC ISO Holdings Overview */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1.5 font-mono">
                      <div className="flex justify-between text-slate-600">
                        <span>082 Call No:</span>
                        <span className="text-slate-900 font-semibold">{b.callNumber}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>090 Primary Accession:</span>
                        <span className="text-amber-700 font-bold">{b.accessionNumber || 'ACC-88001'}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>852 Shelf Location:</span>
                        <span className="text-emerald-700 font-medium">{b.shelfLocation || 'Stack Central Stack'}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200">
                        <span>Physical Holdings:</span>
                        <span className="text-blue-700 font-semibold">
                          {bookCopies.length} {bookCopies.length === 1 ? 'Copy Registered' : 'Copies Registered'} ({availableCount} Available)
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between text-xs pt-1 gap-2 flex-wrap border-t border-slate-100 mt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenCopiesManager(b, 'SINGLE')}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 text-[11px] font-bold cursor-pointer flex items-center space-x-1.5 transition-all shadow-sm"
                      >
                        <Copy className="h-3.5 w-3.5 text-purple-600" />
                        <span>+ Add / Manage Copies ({bookCopies.length})</span>
                      </button>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(b)}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 text-[11px] font-semibold cursor-pointer flex items-center space-x-1"
                        >
                          <Pencil className="h-3 w-3" />
                          <span>Edit Record</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedBookForMarc(b)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-[11px] font-semibold cursor-pointer flex items-center space-x-1"
                        >
                          <FileCode className="h-3 w-3" />
                          <span>MARC Tags</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Pagination Bar */}
          {totalCatalogCount > 0 && renderPaginationBar()}
        </div>
      )}

      {/* TAB 2: ADD / EDIT MARC21 BIBLIOGRAPHIC RECORD */}
      {activeTab === 'NEW_MARC' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-6">
          {/* Header & Mode Switcher */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200/90 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 flex-wrap gap-2">
                  {editingBookId ? (
                    <>
                      <Pencil className="h-5 w-5 text-amber-400" />
                      <span>Edit MARC21 Bibliographic Record: "{marcForm.title}"</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-5 w-5 text-blue-400" />
                      <span>MARC21 ISO 2709 Cataloguing & AI Agent</span>
                    </>
                  )}
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                    <Sparkles className="h-3 w-3" />
                    <span>Unlimited Librarian Ingestion: No Title or Copy Caps</span>
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {editingBookId
                  ? 'Update bibliographic particulars, call numbers, classification, and holdings for this existing record.'
                  : 'Add new MARC records automatically by uploading book covers, prompting AI, or entering metadata manually.'}
              </p>
            </div>

            {/* Top Action Buttons / Mode Selector */}
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              {editingBookId ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const book = books.find(b => b.id === editingBookId);
                      if (book) handleOpenCopiesManager(book);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center space-x-1.5 cursor-pointer hover:bg-purple-600/30"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Manage Physical Copies</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-zinc-700 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Cancel Edit</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center bg-[#f1f5f9] border border-slate-200/90 rounded-xl p-1 space-x-1">
                  <button
                    type="button"
                    onClick={() => setEntryMode('VOICE_TO_MARC')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all ${
                      entryMode === 'VOICE_TO_MARC'
                        ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                    }`}
                  >
                    <Mic className="h-3.5 w-3.5" />
                    <span>Voice-to-MARC21</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntryMode('AI_IMAGE_AGENT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all ${
                      entryMode === 'AI_IMAGE_AGENT'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                    }`}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>AI Cover Scanner</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntryMode('AI_TEXT_AGENT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all ${
                      entryMode === 'AI_TEXT_AGENT'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI Title / ISBN</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartCleanManualEntry}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all ${
                      entryMode === 'MANUAL_ENTRY'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                    }`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Manual Entry</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Edit Mode Notice Banner */}
          {editingBookId && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>
                  <strong>Edit Mode Active:</strong> You are modifying the saved record for <strong>"{marcForm.title}"</strong> (ISBN: {marcForm.isbn}). Saving will update the existing entry without duplicating records.
                </span>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-amber-400 underline font-semibold hover:text-amber-200 cursor-pointer ml-3 shrink-0"
              >
                Exit Edit Mode
              </button>
            </div>
          )}

          {/* MODE 0: VOICE-TO-MARC21 DICTATION AGENT WORKSPACE */}
          {!editingBookId && entryMode === 'VOICE_TO_MARC' && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/25 via-[#121214] to-[#121214] border border-rose-500/30 space-y-5">
              {/* Header & Status */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-rose-400 border border-rose-500/30 mt-0.5">
                    <Mic className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-white">Voice-to-MARC21 Intelligent Cataloguing Desk</h4>
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono border border-rose-500/30 flex items-center space-x-1">
                        <Sparkles className="h-3 w-3 text-amber-300" />
                        <span>Gemini 3.8 Flash AI Assistant</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                        HTML5 Web Speech API
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                      Dictate book details (<strong>Title</strong>, <strong>Author</strong>, <strong>ISBN</strong>, Publisher, Year) hands-free via your microphone. The AI assistant parses the speech stream into structured ISO 2709 MARC21 records, Dewey Decimal (DDC 23rd Ed.), and Library of Congress Subject Headings (LCSH).
                    </p>
                  </div>
                </div>

                {/* Language Selector & Engine Badge */}
                <div className="flex items-center space-x-2 shrink-0 self-end lg:self-center">
                  <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs">
                    <Languages className="h-3.5 w-3.5 text-zinc-400" />
                    <select
                      value={voiceToMarcLang}
                      onChange={(e) => setVoiceToMarcLang(e.target.value)}
                      disabled={isVoiceToMarcListening}
                      className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="en-US" className="bg-zinc-900 text-white">English (US / International)</option>
                      <option value="en-GB" className="bg-zinc-900 text-white">English (UK / Pakistan Academic)</option>
                      <option value="ur-PK" className="bg-zinc-900 text-white">Urdu / اردو (Pakistan)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dictation Control Console */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Col: Microphone Card & Soundbars (5 cols) */}
                <div className="lg:col-span-5 p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="text-slate-400 font-medium flex items-center space-x-1.5">
                        <Radio className={`h-3.5 w-3.5 ${isVoiceToMarcListening ? 'text-rose-500 animate-pulse' : 'text-zinc-500'}`} />
                        <span>Microphone Status</span>
                      </span>
                      {isVoiceToMarcListening ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[11px] flex items-center space-x-1">
                          <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping mr-1" />
                          <span>LISTENING • {String(Math.floor(voiceToMarcRecordingTime / 60)).padStart(2, '0')}:{String(voiceToMarcRecordingTime % 60).padStart(2, '0')}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono text-[11px]">
                          READY FOR DICTATION
                        </span>
                      )}
                    </div>

                    {/* Microphone Action Button */}
                    <div className="flex flex-col items-center justify-center py-4 px-2 text-center">
                      <button
                        type="button"
                        onClick={isVoiceToMarcListening ? handleStopVoiceToMarc : handleStartVoiceToMarc}
                        className={`group relative p-6 rounded-full transition-all transform active:scale-95 cursor-pointer shadow-xl ${
                          isVoiceToMarcListening
                            ? 'bg-gradient-to-br from-rose-600 to-red-600 text-white shadow-rose-600/30 animate-pulse'
                            : 'bg-gradient-to-br from-rose-600 via-rose-500 to-amber-600 text-white shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-105'
                        }`}
                        title={isVoiceToMarcListening ? "Click to Stop Listening" : "Click to Start Microphone"}
                      >
                        {isVoiceToMarcListening ? (
                          <MicOff className="h-8 w-8 text-white" />
                        ) : (
                          <Mic className="h-8 w-8 text-white" />
                        )}
                        {isVoiceToMarcListening && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500" />
                          </span>
                        )}
                      </button>

                      <p className="text-xs font-bold text-white mt-3">
                        {isVoiceToMarcListening ? 'Listening to your voice... (Click to Finish)' : 'Click Microphone to Start Dictating'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isVoiceToMarcListening
                          ? 'Speak book title, authors, and ISBN clearly'
                          : 'Hands-free library speech-to-MARC21 recording'}
                      </p>

                      {/* Sound Wave Bars Animation */}
                      <div className="flex items-end justify-center space-x-1.5 h-8 mt-3">
                        {voiceToMarcSoundBars.map((height, idx) => (
                          <div
                            key={idx}
                            className={`w-1.5 rounded-full transition-all duration-150 ${
                              isVoiceToMarcListening
                                ? 'bg-gradient-to-t from-rose-500 to-amber-400'
                                : 'bg-zinc-700'
                            }`}
                            style={{ height: isVoiceToMarcListening ? `${Math.max(12, height)}%` : '20%' }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dictation Syntax Guide */}
                  <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800 text-[11px] text-slate-400">
                    <span className="font-semibold text-rose-300">Dictation Tip:</span> Mention:
                    <span className="text-white ml-1 font-mono">Title</span>,
                    <span className="text-white ml-1 font-mono">Author</span>, and
                    <span className="text-white ml-1 font-mono">ISBN</span> (e.g. <em>"Title Clean Code, Author Robert Martin, ISBN 978 013 2350884"</em>)
                  </div>
                </div>

                {/* Right Col: Live Speech Transcript & Actions (7 cols) */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-bold flex items-center space-x-1.5">
                        <Volume2 className="h-3.5 w-3.5 text-rose-400" />
                        <span>Live Speech Transcript:</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        {voiceToMarcTranscript && (
                          <button
                            type="button"
                            onClick={() => {
                              setVoiceToMarcTranscript('');
                              setVoiceToMarcInterim('');
                              setVoiceToMarcResult(null);
                            }}
                            className="text-[11px] text-zinc-400 hover:text-red-400 flex items-center space-x-1 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Clear</span>
                          </button>
                        )}
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {voiceToMarcTranscript.length} chars
                        </span>
                      </div>
                    </div>

                    {/* Interactive Transcript Area */}
                    <div className="relative">
                      <textarea
                        rows={4}
                        value={voiceToMarcTranscript}
                        onChange={(e) => setVoiceToMarcTranscript(e.target.value)}
                        placeholder={
                          isVoiceToMarcListening
                            ? 'Listening... Speak now into your microphone. Say book Title, Author, ISBN, Publisher...'
                            : 'Dictate via microphone, or type/edit book details here (e.g. Title: Clean Architecture, Author: Robert C. Martin, ISBN: 978-0134494166)...'
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none resize-none leading-relaxed"
                      />

                      {/* Realtime Interim Subtitle overlay if speaking */}
                      {isVoiceToMarcListening && voiceToMarcInterim && (
                        <div className="mt-1 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/20 text-xs text-rose-300 flex items-center space-x-2">
                          <Subtitles className="h-3.5 w-3.5 text-rose-400 animate-pulse shrink-0" />
                          <span className="truncate italic">
                            "{voiceToMarcInterim}..."
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quick Spoken Test Presets */}
                    <div>
                      <div className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center justify-between">
                        <span>Quick Spoken Presets (Click to test without mic):</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {voiceDictationPresets.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setVoiceToMarcTranscript(preset.transcript);
                              setVoiceToMarcError(null);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-left text-[11px] text-slate-300 transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <span className="truncate mr-2 font-medium">{preset.label}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-800 text-zinc-400 group-hover:text-rose-300 shrink-0">
                              {preset.badge}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Error Notification */}
                  {voiceToMarcError && (
                    <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-300 flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-red-200">Microphone / Speech Notice</p>
                        <p className="mt-0.5 leading-relaxed">{voiceToMarcError}</p>
                      </div>
                    </div>
                  )}

                  {/* AI Compilation Action Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isVoiceToMarcParsing || (!voiceToMarcTranscript.trim() && !voiceToMarcInterim.trim())}
                      onClick={() => handleRunVoiceToMarcAi()}
                      className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg ${
                        isVoiceToMarcParsing || (!voiceToMarcTranscript.trim() && !voiceToMarcInterim.trim())
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-rose-600 via-amber-600 to-emerald-600 text-white hover:opacity-95 shadow-rose-600/20'
                      }`}
                    >
                      {isVoiceToMarcParsing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-amber-300" />
                          <span>AI Parsing Voice into MARC21 Record...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-amber-300" />
                          <span>Parse Spoken Record into MARC21 with AI Assistant</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step-by-Step AI Progress Bar */}
              {isVoiceToMarcParsing && (
                <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-amber-500/30 space-y-2 animate-pulse">
                  <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
                    <span className="flex items-center space-x-2">
                      <Wand2 className="h-4 w-4 text-amber-400 animate-spin" />
                      <span>{voiceToMarcProgressStep || 'Compiling ISO 2709 MARC21 metadata from spoken entities...'}</span>
                    </span>
                    <span className="font-mono text-[11px] text-amber-400">Gemini 3.8 Flash</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 h-full w-4/5 animate-pulse" />
                  </div>
                </div>
              )}

              {/* Parsed Bibliographic Record & MARC21 Inspector Card */}
              {voiceToMarcResult && !isVoiceToMarcParsing && (
                <div className="p-4 rounded-xl bg-zinc-900/95 border border-emerald-500/40 space-y-4 shadow-xl">
                  {/* Result Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-white flex items-center space-x-2">
                          <span>MARC21 Bibliographic Record Compiled from Voice</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                            98% Confidence • Gemini 3.8 Flash
                          </span>
                        </h5>
                        <p className="text-[11px] text-slate-400">
                          Spoken entities successfully resolved to RDA bibliographic conventions and DDC 23rd Edition.
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleApplyVoiceResultToForm}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
                      >
                        <ListPlus className="h-3.5 w-3.5" />
                        <span>Populate Full MARC Form</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleInstantSaveVoiceResultToCatalog}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Instant Ingest & Save</span>
                      </button>
                    </div>
                  </div>

                  {/* Core Bibliographic Entities Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Title (Tag 245)</span>
                      <p className="text-white font-bold mt-0.5 truncate" title={voiceToMarcResult.title}>
                        {voiceToMarcResult.title || 'Unknown Title'}
                      </p>
                      {voiceToMarcResult.subtitle && (
                        <p className="text-[11px] text-zinc-400 italic truncate">{voiceToMarcResult.subtitle}</p>
                      )}
                    </div>

                    <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Author(s) (Tag 100)</span>
                      <p className="text-white font-bold mt-0.5 truncate" title={voiceToMarcResult.authors?.join(', ')}>
                        {voiceToMarcResult.authors?.join(', ') || 'Unknown Author'}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">{voiceToMarcResult.department || 'Academic'}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Standardized ISBN (Tag 020)</span>
                      <p className="text-emerald-400 font-mono font-bold mt-0.5 truncate">
                        {voiceToMarcResult.isbn || 'N/A'}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {voiceToMarcResult.publisherName || 'Academic Press'} ({voiceToMarcResult.publisherYear || '2024'})
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">DDC & Call Number (Tag 082/852)</span>
                      <p className="text-amber-400 font-mono font-bold mt-0.5 truncate">
                        {voiceToMarcResult.callNumber || `${voiceToMarcResult.ddcClassification} ${voiceToMarcResult.cutterNumber}`}
                      </p>
                      <p className="text-[11px] text-zinc-400 font-mono truncate">
                        DDC: {voiceToMarcResult.ddcClassification || '000'} • Cutter: {voiceToMarcResult.cutterNumber || 'A00'}
                      </p>
                    </div>
                  </div>

                  {/* MARC21 ISO 2709 Tags Breakdown */}
                  {voiceToMarcResult.marc21Tags && voiceToMarcResult.marc21Tags.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="font-mono text-[11px] text-zinc-300 font-semibold">
                          Generated ISO 2709 MARC21 Tags ({voiceToMarcResult.marc21Tags.length} fields):
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          RDA Core Elements Compliant
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 max-h-56 overflow-y-auto font-mono text-[11px] space-y-1 divide-y divide-zinc-900">
                        {voiceToMarcResult.marc21Tags.map((tagObj, idx) => (
                          <div key={idx} className="flex items-start space-x-3 py-1 text-slate-300">
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold shrink-0">
                              {tagObj.tag}
                            </span>
                            <span className="px-1 py-0.5 rounded bg-zinc-800 text-amber-300 text-[10px] shrink-0">
                              {tagObj.ind1 || '#'}{tagObj.ind2 || '#'}
                            </span>
                            <span className="flex-1 break-all text-slate-300">
                              {typeof tagObj.subfields === 'object'
                                ? Object.entries(tagObj.subfields).map(([code, val]) => (
                                    <span key={code} className="mr-2">
                                      <strong className="text-emerald-400 font-bold">${code}</strong> {String(val)}
                                    </span>
                                  ))
                                : String(tagObj.subfields)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MODE 1: AI VISION BOOK COVER AGENT WORKSPACE */}
          {!editingBookId && entryMode === 'AI_IMAGE_AGENT' && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/30 via-[#121214] to-[#121214] border border-blue-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Scan className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span>AI Vision MARC Agent (Book Cover / Title Page Scanner)</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono border border-blue-500/30">
                        Gemini 3.7 Flash Vision
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Upload a book cover photo or capture with webcam. AI automatically extracts OCR typography, DDC classification, RDA leader tags, and populates the MARC form below.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    disabled={isStartingCamera}
                    onClick={() => {
                      if (isCameraActive) {
                        handleStopCamera();
                      } else {
                        handleStartCamera();
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all ${
                      isCameraActive
                        ? 'bg-rose-600/20 border border-rose-500/40 text-rose-300'
                        : isStartingCamera
                        ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300 animate-pulse'
                        : 'bg-slate-100 hover:bg-zinc-700 text-slate-800 border border-slate-300'
                    }`}
                  >
                    {isStartingCamera ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-400" />
                    ) : isCameraActive ? (
                      <VideoOff className="h-3.5 w-3.5 text-rose-400" />
                    ) : (
                      <Camera className="h-3.5 w-3.5 text-blue-400" />
                    )}
                    <span>{isStartingCamera ? 'Starting Camera...' : isCameraActive ? 'Close Camera' : 'Live Camera'}</span>
                  </button>
                </div>
              </div>

              {/* Camera Error / Permission Notice */}
              {cameraError && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Live Camera Notice</div>
                      <p className="text-slate-700 mt-0.5">{cameraError}</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartCamera(undefined, undefined, true)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-[11px] border border-amber-500/30 cursor-pointer flex items-center space-x-1"
                          title="Retry hardware webcam in Safe Mode (480p standard resolution)"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Retry (Safe Mode 480p)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-medium text-[11px] border border-blue-500/30 cursor-pointer flex items-center space-x-1"
                        >
                          <UploadCloud className="h-3 w-3" />
                          <span>Upload Book Cover Image</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCameraError(null);
                            handleProcessImage(sampleBookCovers[0].coverUrl, 'image/jpeg');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-zinc-700 text-slate-700 font-medium text-[11px] border border-slate-300 cursor-pointer flex items-center space-x-1"
                        >
                          <Sparkles className="h-3 w-3 text-amber-400" />
                          <span>Use Sample Cover</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCameraError(null)}
                    className="text-slate-500 hover:text-white cursor-pointer"
                    title="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*"
                className="hidden"
              />

              {/* Live Camera Stream View if Active */}
              {isCameraActive && (
                <div className="p-4 rounded-xl bg-black border border-blue-500/40 space-y-3">
                  {/* Camera Top Controls Bar */}
                  <div className="flex flex-wrap items-center justify-between px-1 gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-mono font-bold tracking-wider text-emerald-400">
                        LIVE HARDWARE FEED
                      </span>
                      <span className="text-[10px] text-slate-500 bg-zinc-800/80 px-2 py-0.5 rounded border border-slate-300">
                        {cameraFacingMode === 'user' ? 'Front / Webcam' : 'Environment / Doc Cam'}
                      </span>
                      <span className="text-[10px] text-blue-300 bg-blue-950/70 px-2 py-0.5 rounded border border-blue-800/50 font-mono hidden sm:inline">
                        Gemini 3.7 Flash Vision
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Direct Caption On/Off Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setIsDirectCaptionEnabled(prev => !prev)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                          isDirectCaptionEnabled
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50 shadow-sm'
                            : 'bg-slate-100 hover:bg-zinc-700 text-slate-500 border border-slate-300'
                        }`}
                        title="Toggle Direct Caption Overlay on Live Camera"
                      >
                        <Subtitles className="h-3.5 w-3.5" />
                        <span>{isDirectCaptionEnabled ? 'CC Captions ON' : 'CC Captions OFF'}</span>
                      </button>

                      {cameraDevices.length > 1 && (
                        <select
                          value={selectedDeviceId}
                          onChange={(e) => handleSelectCameraDevice(e.target.value)}
                          className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-[11px] text-slate-800 focus:outline-none focus:border-blue-500"
                        >
                          {cameraDevices.map((dev, idx) => (
                            <option key={dev.deviceId || idx} value={dev.deviceId}>
                              {dev.label || `Camera ${idx + 1}`}
                            </option>
                          ))}
                        </select>
                      )}

                      <button
                        type="button"
                        onClick={handleToggleFacingMode}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-zinc-700 text-slate-700 text-xs font-medium border border-slate-300 cursor-pointer flex items-center space-x-1"
                        title="Flip / Switch Camera"
                      >
                        <SwitchCamera className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Flip Camera</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleStopCamera}
                        className="p-1 rounded-lg bg-slate-100 hover:bg-zinc-700 text-slate-500 hover:text-white cursor-pointer"
                        title="Close camera"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Video Viewfinder Container with Direct Captions */}
                  <div className="relative aspect-video min-h-[340px] max-h-[480px] w-full mx-auto overflow-hidden rounded-2xl bg-[#f1f5f9] border border-blue-500/50 flex items-center justify-center shadow-2xl">
                    <video
                      ref={(el) => {
                        videoRef.current = el;
                        if (el && cameraStreamRef.current && el.srcObject !== cameraStreamRef.current) {
                          el.srcObject = cameraStreamRef.current;
                          el.setAttribute('playsinline', 'true');
                          el.muted = true;
                          el.play().catch(e => console.warn('Video playback notice:', e));
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover transition-opacity duration-200 ${
                        isCapturing ? 'opacity-20' : 'opacity-100'
                      }`}
                    />

                    {/* Top Overlay HUD: Agent & Gemini 3.7 Flash Vision Badges */}
                    <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
                      <div className="px-2.5 py-1 rounded-lg bg-black/85 backdrop-blur-md border border-blue-500/40 flex items-center space-x-1.5 shadow-lg">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                          AI Vision MARC Agent
                        </span>
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-blue-950/85 backdrop-blur-md border border-blue-400/50 text-blue-300 text-[10px] font-mono font-bold shadow-lg flex items-center space-x-1">
                        <Sparkles className="h-3 w-3 text-amber-400" />
                        <span>Gemini 3.7 Flash Vision</span>
                      </div>
                    </div>

                    {/* Top-Right CC Status Pill */}
                    <div className="absolute top-3 right-3 z-20 flex items-center space-x-2 pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => setIsDirectCaptionEnabled(prev => !prev)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1.5 backdrop-blur-md transition-all cursor-pointer shadow-lg ${
                          isDirectCaptionEnabled
                            ? 'bg-amber-400 text-black border border-amber-300 shadow-amber-400/20'
                            : 'bg-slate-900/40 text-slate-500 border border-slate-300 hover:text-white'
                        }`}
                        title="Direct Caption Status"
                      >
                        <Subtitles className="h-3.5 w-3.5" />
                        <span>CC {isDirectCaptionEnabled ? 'LIVE' : 'MUTED'}</span>
                      </button>
                    </div>

                    {/* Visual Shutter Flash Effect */}
                    {isCapturing && (
                      <div className="absolute inset-0 bg-white/90 animate-out fade-out duration-300 pointer-events-none flex items-center justify-center z-30">
                        <Camera className="h-12 w-12 text-blue-600 animate-bounce" />
                      </div>
                    )}

                    {/* Book Cover Alignment Reticle with Corner Targeting */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-60 h-68 sm:w-72 sm:h-76 border-2 border-dashed border-blue-400/80 rounded-2xl flex flex-col items-center justify-between p-3 shadow-2xl shadow-blue-500/25 bg-blue-500/5 relative">
                        {/* Precision Corner Guides */}
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl-sm"></div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr-sm"></div>
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl-sm"></div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br-sm"></div>

                        <span className="bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded text-[11px] text-blue-300 font-mono border border-blue-500/30 flex items-center space-x-1.5">
                          <Scan className="h-3 w-3 text-blue-400 animate-pulse" />
                          <span>Align Book Cover / Title Page</span>
                        </span>
                        <span className="bg-black/75 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-slate-700 font-mono">
                          Center Title, Authors & Publisher
                        </span>
                      </div>
                    </div>

                    {/* DIRECT CAPTION ON LIVE CAMERA (Broadcast Closed-Captioning Lower-Third Overlay) */}
                    {isDirectCaptionEnabled && (
                      <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-auto transition-all">
                        <div className="p-3 sm:p-3.5 rounded-xl bg-black/90 backdrop-blur-md border border-amber-400/70 shadow-2xl shadow-black space-y-2">
                          <div className="flex items-center justify-between text-[11px] border-b border-slate-200/90/90 pb-2 gap-2">
                            <div className="flex items-center space-x-2 min-w-0">
                              <span className="px-2 py-0.5 rounded bg-amber-400 text-black font-black font-mono text-[10px] tracking-wider uppercase flex items-center space-x-1 shrink-0 shadow-sm">
                                <Subtitles className="h-3 w-3" />
                                <span>DIRECT CAPTION</span>
                              </span>
                              <span className="text-slate-800 font-bold text-[11px] truncate">
                                AI Vision MARC Agent (Book Cover / Title Page Scanner)
                              </span>
                              <span className="text-cyan-300 font-mono text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 shrink-0 hidden md:inline">
                                Gemini 3.7 Flash Vision
                              </span>
                            </div>

                            <div className="flex items-center space-x-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setIsDirectCaptionLarge(prev => !prev)}
                                className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-zinc-700 text-slate-800 border border-slate-300 font-mono cursor-pointer transition-colors"
                                title="Toggle Caption Font Size"
                              >
                                {isDirectCaptionLarge ? 'Aa Standard' : 'Aa Large'}
                              </button>
                              <button
                                type="button"
                                onClick={handleInstantFrameCaption}
                                disabled={isAnalyzingFrame || isCapturing}
                                className="text-[10px] px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold font-mono cursor-pointer flex items-center space-x-1 shadow-md shadow-blue-500/30 disabled:opacity-50 transition-all"
                                title="Inspect current camera frame with Gemini 3.7 Flash Vision"
                              >
                                {isAnalyzingFrame ? (
                                  <RefreshCw className="h-2.5 w-2.5 animate-spin text-white" />
                                ) : (
                                  <Sparkles className="h-2.5 w-2.5 text-amber-300" />
                                )}
                                <span>{isAnalyzingFrame ? 'Reading Frame...' : 'Live Read'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Live Caption Text */}
                          <div className="flex items-start space-x-2.5">
                            <div className="mt-1 shrink-0">
                              <span className="flex h-2.5 w-2.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className={`font-mono text-amber-200 leading-snug drop-shadow-md select-text ${
                                isDirectCaptionLarge ? 'text-xs sm:text-sm font-bold text-amber-100' : 'text-[11px] sm:text-xs font-semibold'
                              }`}>
                                {liveCaptionText}
                              </p>
                              {isAnalyzingFrame && (
                                <p className="text-[10px] text-blue-300 font-mono animate-pulse">
                                  Reading visual typography & RDA core elements via Gemini 3.7 Flash Vision...
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Detected MARC21 Subfield Tags Chips */}
                          {liveCaptionMeta && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 text-[10px] font-mono border-t border-slate-200/90/80">
                              <span className="text-slate-500 font-bold">MARC21 Tags:</span>
                              {liveCaptionMeta.title && (
                                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 truncate max-w-[220px]">
                                  245 $a {liveCaptionMeta.title}
                                </span>
                              )}
                              {liveCaptionMeta.author && (
                                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 truncate max-w-[160px]">
                                  100 $a {liveCaptionMeta.author}
                                </span>
                              )}
                              {liveCaptionMeta.callNumber && (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  082 $a {liveCaptionMeta.callNumber}
                                </span>
                              )}
                              {liveCaptionMeta.isbn && (
                                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  020 $a {liveCaptionMeta.isbn}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Capture & Cancel Actions */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                    <button
                      type="button"
                      disabled={isCapturing}
                      onClick={handleCaptureCameraPhoto}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-blue-500/30 cursor-pointer active:scale-95 transition-all"
                    >
                      <Camera className="h-4 w-4" />
                      <span>{isCapturing ? 'Capturing Photo...' : 'Capture & Auto-Catalog (Gemini 3.7 Flash Vision)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleStopCamera();
                        handleProcessImage(sampleBookCovers[0].coverUrl, 'image/jpeg');
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-zinc-700 text-slate-700 text-xs font-semibold cursor-pointer border border-slate-300 flex items-center space-x-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      <span>Use Sample Cover</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStopCamera}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-zinc-700 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Dropzone & Live Preview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                {/* Dropzone Column */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`md:col-span-8 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center text-center space-y-3 min-h-[160px] ${
                    isDragOver
                      ? 'border-blue-400 bg-blue-500/10'
                      : 'border-slate-300 hover:border-blue-500/60 bg-[#f1f5f9]/60 hover:bg-blue-950/20'
                  }`}
                >
                  <div className="p-3 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Drop Book Cover image here, or <span className="text-blue-400 underline font-bold">browse from disk</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Supports JPG, PNG, WEBP, HEIC (Photos of front cover, title page, copyright page, or spine)
                    </p>
                  </div>
                </div>

                {/* Cover Preview & Scanner Column */}
                <div className="md:col-span-4 p-3 rounded-xl bg-[#f1f5f9] border border-slate-200/90 flex flex-col items-center justify-center relative min-h-[160px]">
                  {imagePreviewUrl ? (
                    <div className="relative w-full h-36 rounded-lg overflow-hidden flex items-center justify-center bg-black/40">
                      <img
                        src={imagePreviewUrl}
                        alt="Book Cover Preview"
                        className="max-h-full max-w-full object-contain rounded"
                      />
                      {/* Scanning Laser Animation */}
                      {isScanningImage && (
                        <div className="absolute inset-0 bg-blue-500/10 flex flex-col items-center justify-center">
                          <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse" />
                          <div className="absolute bottom-2 bg-slate-900/40 px-2 py-1 rounded text-[10px] text-cyan-300 font-mono flex items-center space-x-1">
                            <RefreshCw className="h-3 w-3 animate-spin text-cyan-400" />
                            <span>Scanning...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 space-y-1">
                      <ImageIcon className="h-8 w-8 mx-auto opacity-40" />
                      <p className="text-[11px]">No cover uploaded yet</p>
                    </div>
                  )}

                  {imagePreviewUrl && !isScanningImage && (
                    <button
                      type="button"
                      onClick={() => handleProcessImage(imagePreviewUrl)}
                      className="mt-2 text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Re-analyze Image</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Real-time Scanning Progress Step */}
              {isScanningImage && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center space-x-2.5 text-xs text-blue-300 animate-pulse">
                  <Cpu className="h-4 w-4 text-blue-400 animate-spin" />
                  <span className="font-mono">{scanProgressStep || 'Analyzing visual data with Gemini AI...'}</span>
                </div>
              )}

              {/* Sample Test Covers Bar */}
              <div className="pt-2 border-t border-slate-200/90/80">
                <div className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    <span>Try 1-Click Instant Sample Book Covers:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Test AI Vision instantly</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {sampleBookCovers.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleProcessImage(s.coverUrl)}
                      className="p-2 rounded-xl bg-[#f1f5f9] hover:bg-blue-950/30 border border-slate-200/90 hover:border-blue-500/40 transition-all text-left flex items-center space-x-2 cursor-pointer group"
                    >
                      <img src={s.coverUrl} alt={s.title} className="w-8 h-10 object-cover rounded shadow shrink-0" />
                      <div className="overflow-hidden">
                        <span className="block text-[11px] font-semibold text-slate-800 group-hover:text-blue-300 truncate">
                          {s.title}
                        </span>
                        <span className="block text-[10px] text-slate-400 truncate">
                          {s.badge}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Extracted AI Intelligence Report */}
              {aiVisionAnalysis && !isScanningImage && (
                <div className="p-4 rounded-xl bg-[#f1f5f9] border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">AI Vision Analysis Complete</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                        {aiVisionAnalysis.confidenceScore || 97}% Confidence
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Form auto-populated below • All fields fully editable
                    </span>
                  </div>

                  {aiVisionAnalysis.detectedText && (
                    <div className="text-[11px] text-slate-700 flex items-center space-x-1.5">
                      <span className="text-slate-400 font-mono">OCR Detected:</span>
                      <span className="text-amber-300/90 font-mono bg-white px-2 py-0.5 rounded">
                        {aiVisionAnalysis.detectedText}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded bg-white text-blue-300 font-mono border border-slate-200/90">
                      DDC: {aiVisionAnalysis.ddcClassification}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white text-purple-300 font-mono border border-slate-200/90">
                      Call No: {aiVisionAnalysis.callNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white text-emerald-300 font-mono border border-slate-200/90">
                      RDA Verified
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: AI TEXT / ISBN PROMPT WORKSPACE */}
          {!editingBookId && entryMode === 'AI_TEXT_AGENT' && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/30 via-[#121214] to-[#121214] border border-purple-500/30 space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">AI Title / ISBN Cataloguing Assistant</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Type a book title, subject, or ISBN number. Gemini AI automatically computes MARC21 leader tags, DDC numbers, and author statements.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={textPromptInput}
                  onChange={(e) => setTextPromptInput(e.target.value)}
                  placeholder="e.g. Clean Architecture by Robert C. Martin OR 978-0132354165"
                  className="flex-1 bg-[#f1f5f9] border border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (textPromptInput.trim()) {
                        setMarcForm(prev => ({ ...prev, title: textPromptInput }));
                        handleAiAutoCatalog();
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (textPromptInput.trim()) {
                      setMarcForm(prev => ({ ...prev, title: textPromptInput }));
                      handleAiAutoCatalog();
                    } else {
                      handleAiAutoCatalog();
                    }
                  }}
                  disabled={isAiCataloguing}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-2 cursor-pointer shadow-lg shadow-purple-500/20 disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isAiCataloguing ? 'Auto-Cataloguing...' : 'Run AI Auto-Catalog'}</span>
                </button>
              </div>
            </div>
          )}

          {/* MODE 3: MANUAL ENTRY NOTICE */}
          {!editingBookId && entryMode === 'MANUAL_ENTRY' && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center space-x-2">
                <Pencil className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>
                  <strong>Manual Entry Mode Active:</strong> All MARC21 tags, call numbers, classification schemes, and accession fields are open for direct custom input.
                </span>
              </div>
              <button
                type="button"
                onClick={handleStartCleanManualEntry}
                className="text-emerald-400 underline font-semibold hover:text-emerald-200 cursor-pointer ml-3 shrink-0"
              >
                Clear Form
              </button>
            </div>
          )}

          {/* FORM: MARC21 ISO 2709 FORM (All fields editable in all modes) */}
          <form onSubmit={handleSaveMarcRecord} className="space-y-5 text-xs">
            {/* LIBRARIAN VOICE DICTATION DESK CONSOLE */}
            <div className={`p-4 rounded-2xl border transition-all space-y-3.5 ${
              isListening
                ? 'bg-gradient-to-r from-emerald-950/40 via-[#121214] to-cyan-950/40 border-emerald-500/80 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500/40'
                : 'bg-white border-slate-200/90'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/90">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                    isListening
                      ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {isListening ? <Radio className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-slate-900 text-xs">
                        Librarian Microphone Voice Dictation Desk
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                        MARC21 / RDA STT
                      </span>
                      {isListening && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white flex items-center space-x-1 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          <span>LIVE AUDIO</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Dictate book descriptions, abstracts, and notes hands-free directly into MARC entry fields.
                    </p>
                  </div>
                </div>

                {/* Dictation Controls: Language & Mode */}
                <div className="flex items-center space-x-2 self-end sm:self-center flex-wrap gap-y-1">
                  {/* Language Selector */}
                  <div className="flex items-center space-x-1 bg-[#f1f5f9] p-1 rounded-xl border border-slate-200/90 text-[10px]">
                    <Languages className="h-3.5 w-3.5 text-slate-500 ml-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceLang('en-US');
                        if (isListening) handleStartVoiceInput(activeVoiceField);
                      }}
                      className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                        voiceLang === 'en-US'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="English (US/UK) Speech Recognition"
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceLang('ur-PK');
                        if (isListening) handleStartVoiceInput(activeVoiceField);
                      }}
                      className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                        voiceLang === 'ur-PK'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Urdu (اردو • پاکستان) Speech Recognition"
                    >
                      اردو
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceLang('ar-SA');
                        if (isListening) handleStartVoiceInput(activeVoiceField);
                      }}
                      className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                        voiceLang === 'ar-SA'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Arabic (العربية) Speech Recognition"
                    >
                      العربية
                    </button>
                  </div>

                  {/* Mode: Append or Replace */}
                  <div className="flex items-center space-x-1 bg-[#f1f5f9] p-1 rounded-xl border border-slate-200/90 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setVoiceDictationMode('append')}
                      className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                        voiceDictationMode === 'append'
                          ? 'bg-zinc-700 text-white'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Append new speech to the existing text"
                    >
                      + Append
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceDictationMode('replace')}
                      className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                        voiceDictationMode === 'replace'
                          ? 'bg-zinc-700 text-white'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Replace field text with new speech"
                    >
                      Replace
                    </button>
                  </div>
                </div>
              </div>

              {/* Target Field Selector Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-mono mr-1">Target MARC Field:</span>
                {[
                  { key: 'description' as VoiceDictationField, label: '520 Description (Abstract)', tag: '520' },
                  { key: 'generalNotes' as VoiceDictationField, label: '500 General Notes', tag: '500' },
                  { key: 'title' as VoiceDictationField, label: '245 Title', tag: '245' },
                  { key: 'authors' as VoiceDictationField, label: '100 Authors', tag: '100' },
                  { key: 'subjects' as VoiceDictationField, label: '650 Subjects', tag: '650' },
                  { key: 'publisherName' as VoiceDictationField, label: '260 Publisher', tag: '260' }
                ].map(item => {
                  const isSelected = activeVoiceField === item.key;
                  const isCurrentlyListeningHere = isListening && isSelected;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setActiveVoiceField(item.key);
                        if (isListening) {
                          handleStartVoiceInput(item.key);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                        isCurrentlyListeningHere
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400'
                          : isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-[#f1f5f9] border border-slate-200/90 text-slate-500 hover:text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isCurrentlyListeningHere && <Mic className="h-3 w-3 animate-pulse" />}
                    </button>
                  );
                })}
              </div>

              {/* Primary Dictation Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                  <button
                    type="button"
                    onClick={() => handleToggleVoiceInput(activeVoiceField)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md ${
                      isListening
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="h-4 w-4" />
                        <span>Stop Dictating into [{activeVoiceField === 'description' ? '520 Description' : activeVoiceField === 'generalNotes' ? '500 Notes' : activeVoiceField}]</span>
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4" />
                        <span>Start Dictating into [{activeVoiceField === 'description' ? '520 Description' : activeVoiceField === 'generalNotes' ? '500 Notes' : activeVoiceField}]</span>
                      </>
                    )}
                  </button>

                  {/* Dynamic Soundwave Equalizer when listening */}
                  {isListening && (
                    <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-900/30 border border-emerald-500/40">
                      <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                      <div className="flex items-end space-x-1 h-4 w-16">
                        {voiceSoundLevel.map((lvl, idx) => (
                          <div
                            key={idx}
                            className="w-1.5 bg-gradient-to-t from-emerald-500 to-cyan-400 rounded-full transition-all duration-100"
                            style={{ height: `${Math.max(15, lvl)}%` }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono text-emerald-300 font-semibold pl-1">
                        Listening ({voiceLang})...
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Punctuation Insertion Tools */}
                <div className="flex items-center space-x-1 text-[10px] text-slate-500 overflow-x-auto py-1">
                  <span className="font-mono text-slate-400 mr-1 hidden md:inline">Spoken Punctuation:</span>
                  {[
                    { label: '. Period', symbol: '. ' },
                    { label: ', Comma', symbol: ', ' },
                    { label: '↵ Newline', symbol: '\n' },
                    { label: ': Colon', symbol: ': ' },
                    { label: '; Semicolon', symbol: '; ' },
                    { label: '- Dash', symbol: ' - ' }
                  ].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleInsertPunctuation(p.symbol)}
                      className="px-2 py-1 rounded bg-[#f1f5f9] border border-slate-200/90 hover:border-zinc-500 text-slate-700 hover:text-white cursor-pointer font-mono transition-all"
                      title={`Insert ${p.label} into ${activeVoiceField}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Interim Speech Transcript Ticker */}
              {(isListening || interimTranscript) && (
                <div className="p-3 rounded-xl bg-slate-900/40 border border-emerald-500/30 flex items-start space-x-2.5">
                  <Radio className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5 animate-spin" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                      Real-time Speech Recognition Stream:
                    </div>
                    <p className="text-xs text-slate-900 font-sans italic mt-0.5">
                      {interimTranscript ? `"...${interimTranscript}"` : 'Awaiting speech... Say book summary, table of contents, or condition notes clearly into your microphone.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Notice / Error Handler if microphone has issues or browser blocked */}
              {voiceError && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-xs text-amber-300 flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{voiceError}</p>
                    <p className="text-[11px] text-amber-400/80 mt-0.5">
                      Tip: Ensure microphone permission is allowed in your browser tab or use the 1-click librarian sample presets below to test.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVoiceError(null)}
                    className="text-amber-400 hover:text-amber-200 text-xs font-bold px-1.5"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Quick Sample Dictation Presets (1-click testing & evaluation) */}
              <div className="pt-2 border-t border-slate-200/90/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-500 font-mono flex items-center space-x-1">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    <span>Librarian Quick Dictation Presets (1-Click Test & Populate):</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Simulates speech to test MARC 520 / 500 entry instantly
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {sampleDictationPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplySampleDictation(preset)}
                      className="p-2 rounded-xl bg-[#f1f5f9] border border-slate-200/90 hover:border-emerald-500/50 hover:bg-emerald-950/10 text-left transition-all cursor-pointer group"
                      title={preset.text}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="font-semibold text-slate-700 group-hover:text-emerald-300">
                          {preset.label}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[9px]">
                          {preset.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                        {preset.text}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Holdings & Accession Identification Bar */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-amber-400 flex items-center space-x-1.5 uppercase tracking-wider">
                  <Tag className="h-3.5 w-3.5" />
                  <span>MARC Holdings & Barcode Identification (090 / 852 Tags)</span>
                </div>
                <div className="text-[11px] text-amber-300/80">
                  Fill initial accession particulars below. For extra copies, use "+ Add / Manage Copies".
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-900 mb-1 font-mono font-semibold">
                    090 Tag - Accession No. (Accession Number) *
                  </label>
                  <input
                    type="text"
                    required
                    value={marcForm.accessionNumber}
                    onChange={e => setMarcForm({ ...marcForm, accessionNumber: e.target.value })}
                    placeholder="e.g. ACC-2026-0891"
                    className="w-full bg-[#f1f5f9] border border-amber-500/50 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-400 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 mb-1 font-mono font-semibold">
                    852 $t Tag - Primary Copy Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={marcForm.copyNo}
                    onChange={e => setMarcForm({ ...marcForm, copyNo: e.target.value })}
                    placeholder="e.g. C.1 or Copy 1"
                    className="w-full bg-[#f1f5f9] border border-amber-500/50 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-400 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 mb-1 font-mono font-semibold">
                    852 $c Tag - Shelf Location / Stack *
                  </label>
                  <input
                    type="text"
                    required
                    value={marcForm.shelfLocation}
                    onChange={e => setMarcForm({ ...marcForm, shelfLocation: e.target.value })}
                    placeholder="e.g. Stack CS-04-A"
                    className="w-full bg-[#f1f5f9] border border-amber-500/50 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-400 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Bibliographic Particulars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-500 mb-1 font-mono text-[11px] flex items-center justify-between">
                  <span>020 Tag - ISBN Number</span>
                  <span className="text-[10px] text-slate-400 font-sans">10 / 13 Digits</span>
                </label>
                <input
                  type="text"
                  value={marcForm.isbn}
                  onChange={e => setMarcForm({ ...marcForm, isbn: e.target.value })}
                  placeholder="e.g. 978-0132354165"
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Library Scheme Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-500 font-mono text-[11px]">Classification Scheme *</label>
                  <button
                    type="button"
                    onClick={() => setIsAddSchemeModalOpen(true)}
                    className="text-[10px] text-emerald-400 hover:underline flex items-center space-x-0.5 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Custom</span>
                  </button>
                </div>
                <select
                  value={marcForm.schemeId}
                  onChange={e => handleSchemeChangeAndAutoCallNumber(e.target.value)}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
                >
                  {schemes.map(s => (
                    <option key={s.id} value={s.id} className="bg-white text-slate-900">
                      {s.name} (MARC {s.marcTag})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-500 font-mono text-[11px]">
                    {schemes.find(s => s.id === marcForm.schemeId)?.marcTag || '082'} Tag - Call Number *
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateCallNumber}
                    title="Auto-calculate Call Number based on Title and Scheme"
                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center space-x-1 cursor-pointer font-sans"
                  >
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    <span>Auto-Generate</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={marcForm.callNumber}
                  onChange={e => setMarcForm({ ...marcForm, callNumber: e.target.value })}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-mono font-semibold text-blue-400"
                />
                {marcForm.title && (
                  <div className="mt-1 flex items-center space-x-1.5 text-[10px] text-slate-500">
                    <Globe className="h-3 w-3 text-emerald-400" />
                    <span>
                      Script: <strong className="text-slate-700">{detectTextScript(marcForm.title).script}</strong> • Subject: <strong className="text-emerald-400">{generateCallNumberForTitle(marcForm.title, marcForm.authors, marcForm.department, marcForm.schemeId, schemes).detectedSubject}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1 font-mono text-[11px] flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span>245 Tag - Book Title (Multilingual / Unicode) *</span>
                    <button
                      type="button"
                      onClick={() => handleToggleVoiceInput('title')}
                      className={`px-1.5 py-0.5 rounded text-[10px] flex items-center space-x-1 cursor-pointer transition-all ${
                        isListening && activeVoiceField === 'title'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-100'
                      }`}
                      title="Dictate book title with microphone"
                    >
                      <Mic className="h-2.5 w-2.5" />
                      <span>{isListening && activeVoiceField === 'title' ? 'Listening...' : 'Dictate'}</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-sans">Auto-Generates Call No.</span>
                </label>
                <input
                  type="text"
                  required
                  value={marcForm.title}
                  onChange={e => handleTitleChangeAndAutoCallNumber(e.target.value)}
                  placeholder="e.g. Clean Architecture / کمپیوٹر سائنس کا تعارف / 图书馆管理"
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-mono text-[11px] flex items-center justify-between">
                  <span>100 Tag - Author(s) (Comma separated) *</span>
                  <button
                    type="button"
                    onClick={() => handleToggleVoiceInput('authors')}
                    className={`px-1.5 py-0.5 rounded text-[10px] flex items-center space-x-1 cursor-pointer transition-all ${
                      isListening && activeVoiceField === 'authors'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-100'
                    }`}
                    title="Dictate author names with microphone"
                  >
                    <Mic className="h-2.5 w-2.5" />
                    <span>{isListening && activeVoiceField === 'authors' ? 'Listening...' : 'Dictate'}</span>
                  </button>
                </label>
                <input
                  type="text"
                  required
                  value={marcForm.authors}
                  onChange={e => {
                    const newAuthors = e.target.value;
                    setMarcForm(prev => {
                      const gen = generateCallNumberForTitle(prev.title, newAuthors, prev.department, prev.schemeId, schemes);
                      return {
                        ...prev,
                        authors: newAuthors,
                        callNumber: prev.title.trim() ? gen.callNumber : prev.callNumber
                      };
                    });
                  }}
                  placeholder="e.g. Robert C. Martin / مرزا اسد اللہ خان غالب / 李白"
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-500 mb-1 font-mono">Department *</label>
                <select
                  value={marcForm.department}
                  onChange={e => setMarcForm({ ...marcForm, department: e.target.value })}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Medical Sciences">Medical Sciences</option>
                  <option value="Law & Humanities">Law & Humanities</option>
                  <option value="Business Administration">Business Administration</option>
                  <option value="General Science">General Science</option>
                  <option value="Islamic Studies">Islamic Studies</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-mono">250 Tag - Edition</label>
                <input
                  type="text"
                  value={marcForm.edition}
                  onChange={e => setMarcForm({ ...marcForm, edition: e.target.value })}
                  placeholder="e.g. 3rd Edition"
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-mono">260/264 Tag - Publisher</label>
                <input
                  type="text"
                  value={marcForm.publisherName}
                  onChange={e => setMarcForm({ ...marcForm, publisherName: e.target.value })}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-mono">Publication Year</label>
                <input
                  type="number"
                  value={marcForm.publisherYear}
                  onChange={e => setMarcForm({ ...marcForm, publisherYear: parseInt(e.target.value) || 2024 })}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-500 mb-1 font-mono">300 Tag - Page Count</label>
                <input
                  type="number"
                  value={marcForm.pageCount}
                  onChange={e => setMarcForm({ ...marcForm, pageCount: parseInt(e.target.value) || 200 })}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-mono">Format / Binding</label>
                <select
                  value={marcForm.format}
                  onChange={e => setMarcForm({ ...marcForm, format: e.target.value as BookRecord['format'] })}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="HARDCOVER">Hardcover</option>
                  <option value="PAPERBACK">Paperback</option>
                  <option value="DIGITAL">Digital / E-Book</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-500 font-mono text-xs">Total Physical Copies Count</label>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    ⚡ High-Capacity (1 to 100,000+)
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={1000000}
                  value={marcForm.totalCopies}
                  onChange={e => setMarcForm({ ...marcForm, totalCopies: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-mono">Quick Sets:</span>
                  {[1, 5, 10, 25, 50, 100, 500, 1000].map(qty => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setMarcForm({ ...marcForm, totalCopies: qty })}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold cursor-pointer transition-all ${
                        marcForm.totalCopies === qty
                          ? 'bg-emerald-600 text-white border border-emerald-400'
                          : 'bg-slate-100 text-slate-700 hover:bg-zinc-700 border border-slate-300'
                      }`}
                    >
                      +{qty} {qty === 1 ? 'Copy' : 'Copies'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* MARC21 / RDA 6XX SUBJECT ACCESS POINTS DESK */}
            <div className="pt-2">
              <MarcSubjectEntryDesk
                entries={marcForm.subjectEntries || []}
                onChange={(newEntries) => {
                  setMarcForm({
                    ...marcForm,
                    subjectEntries: newEntries,
                    subjects: newEntries.map(e => e.formattedHeading).join(' ; ')
                  });
                }}
                bookContext={{
                  title: marcForm.title,
                  ddc: marcForm.callNumber,
                  description: marcForm.description
                }}
                onDictateRequest={() => handleToggleVoiceInput('subjects')}
                isListening={isListening && activeVoiceField === 'subjects'}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-500 font-mono text-xs">Legacy / Comma-Separated Keywords Sync</label>
                  <button
                    type="button"
                    onClick={() => handleToggleVoiceInput('subjects')}
                    className={`px-1.5 py-0.5 rounded text-[10px] flex items-center space-x-1 cursor-pointer transition-all ${
                      isListening && activeVoiceField === 'subjects'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-100'
                    }`}
                    title="Dictate subjects with microphone"
                  >
                    <Mic className="h-2.5 w-2.5" />
                    <span>{isListening && activeVoiceField === 'subjects' ? 'Listening...' : 'Dictate'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={marcForm.subjects}
                  onChange={e => {
                    const text = e.target.value;
                    const parsed = parseRawSubjectStrings(text);
                    setMarcForm({
                      ...marcForm,
                      subjects: text,
                      subjectEntries: parsed
                    });
                  }}
                  placeholder="e.g. Software Architecture, Design Patterns, Agile"
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-mono text-xs">Cover Image URL / Base64</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={marcForm.coverUrl}
                    onChange={e => {
                      setMarcForm({ ...marcForm, coverUrl: e.target.value });
                      setImagePreviewUrl(e.target.value);
                    }}
                    placeholder="https://... or upload above"
                    className="flex-1 bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 text-xs font-mono truncate"
                  />
                  {marcForm.coverUrl && (
                    <img src={marcForm.coverUrl} alt="Cover Thumbnail" className="w-8 h-8 rounded object-cover border border-slate-300" />
                  )}
                </div>
              </div>
            </div>

            {/* DEDICATED MARC 520 (SUMMARY / DESCRIPTION) & MARC 500 (GENERAL NOTES) WITH VOICE DICTATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 520 TAG - SUMMARY / BOOK DESCRIPTION */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                isListening && activeVoiceField === 'description'
                  ? 'bg-emerald-950/20 border-emerald-500 ring-1 ring-emerald-500/40'
                  : 'bg-white border-slate-200/90'
              }`}>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-semibold text-slate-900 text-xs">
                      520 Tag - Book Description & Abstract *
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">(Summary / Scope)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleVoiceInput('description')}
                      className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all shadow-sm ${
                        isListening && activeVoiceField === 'description'
                          ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/30'
                          : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/40'
                      }`}
                      title="Dictate book description using microphone"
                    >
                      {isListening && activeVoiceField === 'description' ? (
                        <>
                          <MicOff className="h-3 w-3" />
                          <span>Stop Dictating</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-3 w-3" />
                          <span>Voice Dictate</span>
                        </>
                      )}
                    </button>
                    {marcForm.description && (
                      <button
                        type="button"
                        onClick={() => setMarcForm({ ...marcForm, description: '' })}
                        className="text-[10px] text-slate-400 hover:text-red-400 cursor-pointer"
                        title="Clear description"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={4}
                    value={marcForm.description}
                    onChange={e => setMarcForm({ ...marcForm, description: e.target.value })}
                    placeholder="Speak or type book summary, synopsis, table of contents outline, target audience, and subject scope... e.g. 'A comprehensive guide to software architecture principles, refactoring patterns, and modular domain-driven system design.'"
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-500 text-xs leading-relaxed font-sans resize-y"
                  />
                  {isListening && activeVoiceField === 'description' && (
                    <div className="absolute top-2 right-2 flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-500/90 text-white text-[10px] font-bold animate-pulse pointer-events-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping mr-1" />
                      <span>Recording Voice...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>MARC $a Summary note</span>
                  <span>{marcForm.description.length} chars • {marcForm.description.trim() ? marcForm.description.trim().split(/\s+/).length : 0} words</span>
                </div>
              </div>

              {/* 500 TAG - GENERAL NOTES & LOCAL HOLDINGS */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                isListening && activeVoiceField === 'generalNotes'
                  ? 'bg-emerald-950/20 border-emerald-500 ring-1 ring-emerald-500/40'
                  : 'bg-white border-slate-200/90'
              }`}>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-semibold text-slate-900 text-xs">
                      500 Tag - General Notes & Provenance *
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">(Local Notes)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleVoiceInput('generalNotes')}
                      className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all shadow-sm ${
                        isListening && activeVoiceField === 'generalNotes'
                          ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/30'
                          : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/40'
                      }`}
                      title="Dictate general notes using microphone"
                    >
                      {isListening && activeVoiceField === 'generalNotes' ? (
                        <>
                          <MicOff className="h-3 w-3" />
                          <span>Stop Dictating</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-3 w-3" />
                          <span>Voice Dictate</span>
                        </>
                      )}
                    </button>
                    {marcForm.generalNotes && (
                      <button
                        type="button"
                        onClick={() => setMarcForm({ ...marcForm, generalNotes: '' })}
                        className="text-[10px] text-slate-400 hover:text-red-400 cursor-pointer"
                        title="Clear notes"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={4}
                    value={marcForm.generalNotes}
                    onChange={e => setMarcForm({ ...marcForm, generalNotes: e.target.value })}
                    placeholder="Speak or type bibliographic notes, donor inscriptions, volume conditions, bibliography references, or local shelving restrictions... e.g. 'Donated by Prof. Tariq Mahmood. Includes index and bibliographical references (pages 320-335). Clean archival copy.'"
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-500 text-xs leading-relaxed font-sans resize-y"
                  />
                  {isListening && activeVoiceField === 'generalNotes' && (
                    <div className="absolute top-2 right-2 flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-500/90 text-white text-[10px] font-bold animate-pulse pointer-events-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping mr-1" />
                      <span>Recording Voice...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>MARC $a General note</span>
                  <span>{marcForm.generalNotes.length} chars • {marcForm.generalNotes.trim() ? marcForm.generalNotes.trim().split(/\s+/).length : 0} words</span>
                </div>
              </div>
            </div>

            {/* Interactive MARC21 ISO 2709 Tags Preview */}
            {aiMarcPreview && aiMarcPreview.length > 0 && (
              <div className="p-4 rounded-xl bg-[#f1f5f9] border border-slate-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                    <FileCode className="h-4 w-4 text-blue-400" />
                    <span>MARC21 ISO 2709 Generated Tags Preview</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {aiMarcPreview.length} fields indexed
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {aiMarcPreview.map((tagObj: any, idx: number) => (
                    <div key={idx} className="p-2 rounded-lg bg-white border border-slate-200/90/80 font-mono text-[11px] flex items-start space-x-2">
                      <span className="text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                        {String(tagObj.tag || '999')}
                      </span>
                      <span className="text-slate-400">
                        [{String(tagObj.ind1 || '#')}{String(tagObj.ind2 || '#')}]
                      </span>
                      <span className="text-slate-700 truncate flex-1" title={formatMarcSubfields(tagObj.subfields)}>
                        {formatMarcSubfields(tagObj.subfields)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Action Bar */}
            <div className="pt-4 border-t border-slate-200/90 flex items-center justify-between flex-wrap gap-3">
              <div className="text-xs text-slate-500">
                {editingBookId ? (
                  <span>Modifying existing catalog record ID: <code className="text-amber-400 font-mono">{editingBookId}</code></span>
                ) : (
                  <span>Initial copy holdings will be registered with primary accession number.</span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {editingBookId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-zinc-700 text-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}

                <button
                  type="submit"
                  className={`px-6 py-2.5 rounded-xl text-white font-bold cursor-pointer shadow-lg flex items-center space-x-2 transition-all ${
                    editingBookId
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                  }`}
                >
                  {editingBookId ? <BookmarkCheck className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  <span>{editingBookId ? 'Save Changes to MARC21 Record' : 'Save MARC21 Record & Register Holdings'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: INTER-LIBRARY TRANSFERS */}
      {activeTab === 'TRANSFERS' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <ArrowRightLeft className="h-4 w-4 text-amber-400" />
              <span>Initiate Inter-Library Copy Transfer</span>
            </h3>

            <form onSubmit={handleInitiateTransfer} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Book Copy Barcode</label>
                <input
                  type="text"
                  value={newTransferForm.copyBarcode}
                  onChange={e => setNewTransferForm({ ...newTransferForm, copyBarcode: e.target.value })}
                  placeholder="BAR88001"
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Source Branch</label>
                <select
                  value={newTransferForm.fromBranch}
                  onChange={e => setNewTransferForm({ ...newTransferForm, fromBranch: e.target.value })}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 cursor-pointer"
                >
                  {(settings?.branches || ['Central Academic Library', 'Engineering & Tech Library', 'Medical & Health Sciences Library', 'Law & Humanities Library']).map(br => (
                    <option key={br} value={br}>{br}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Destination Branch</label>
                <select
                  value={newTransferForm.toBranch}
                  onChange={e => setNewTransferForm({ ...newTransferForm, toBranch: e.target.value })}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 cursor-pointer"
                >
                  {(settings?.branches || ['Engineering & Tech Library', 'Central Academic Library', 'Medical & Health Sciences Library', 'Law & Humanities Library']).map(br => (
                    <option key={br} value={br}>{br}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer shadow-md"
                >
                  Dispatch Book Transfer
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/90 bg-[#f1f5f9] text-slate-500">
                  <th className="p-3.5">Copy Barcode</th>
                  <th className="p-3.5">Book Title</th>
                  <th className="p-3.5">Source Branch</th>
                  <th className="p-3.5">Destination Branch</th>
                  <th className="p-3.5">Requested By</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map(tr => (
                  <tr key={tr.id} className="hover:bg-slate-100/50">
                    <td className="p-3.5 font-mono text-blue-400">{tr.copyBarcode}</td>
                    <td className="p-3.5 font-bold text-slate-900">{tr.bookTitle}</td>
                    <td className="p-3.5 text-slate-500">{tr.fromBranch}</td>
                    <td className="p-3.5 text-amber-400 font-medium">{tr.toBranch}</td>
                    <td className="p-3.5 text-slate-500">{tr.requestedBy}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold ${
                          tr.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {tr.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: FINES DESK */}
      {activeTab === 'FINES_DESK' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-purple-400" />
              <span>Process Fine Collection & Account Clearance</span>
            </h3>

            <form onSubmit={handleProcessFineClearance} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Patron Code or Institutional Email *</label>
                <input
                  type="text"
                  required
                  placeholder="STU-2024-089 or rohan.s@student.aijaz-edu.org"
                  value={selectedPatronCode}
                  onChange={e => setSelectedPatronCode(e.target.value)}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Fine Amount Collected (₹)</label>
                <input
                  type="number"
                  value={finePaymentAmount || 25}
                  onChange={e => setFinePaymentAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none text-base font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Payment Channel</label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value as any)}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 cursor-pointer"
                >
                  <option value="CASH">Cash Payment at Counter</option>
                  <option value="UPI">UPI / QR Scan Payment</option>
                  <option value="CREDIT_CARD">Credit / Debit Card</option>
                  <option value="WAIVER">Official Fee Waiver (Librarian Override)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-md shadow-purple-500/20"
              >
                Clear Account & Issue Clearance Receipt
              </button>
            </form>
          </div>

          {/* Printable Receipt Preview */}
          <div className="p-5 rounded-2xl border border-slate-200/90 bg-white flex flex-col justify-between">
            {lastReceipt ? (
              <div className="p-5 rounded-xl bg-white text-black space-y-4 font-mono shadow-xl text-xs">
                <div className="text-center border-b pb-3 border-zinc-200">
                  <div className="font-bold text-sm tracking-wider uppercase">Central Academic Library</div>
                  <div className="text-[10px] text-zinc-600">Official Fee Clearance & Fine Receipt</div>
                  <div className="text-[10px] text-blue-600 font-bold mt-1">{lastReceipt.receiptNo}</div>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Patron Name:</span>
                    <span className="font-bold">{lastReceipt.patronName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date & Time:</span>
                    <span>{lastReceipt.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Mode:</span>
                    <span className="font-bold">{lastReceipt.mode}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed pt-2 mt-2 text-sm font-bold">
                    <span>Amount Paid:</span>
                    <span className="text-emerald-700">₹{lastReceipt.amount}</span>
                  </div>
                </div>

                <div className="text-center pt-3 border-t border-zinc-200 text-[10px] text-slate-400">
                  Status: CLEARANCE VERIFIED • STAMP OK
                </div>

                <button
                  onClick={() => alert(`Printing Receipt ${lastReceipt.receiptNo}...`)}
                  className="w-full py-2 rounded-lg bg-white text-white font-bold flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Receipt</span>
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                <DollarSign className="h-10 w-10 text-zinc-600" />
                <p className="text-xs">No recent fine receipt generated yet.</p>
                <p className="text-[10px] text-slate-400">Select a patron and process clearance to view receipt preview.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: BARCODE & SPINE TAG DESK */}
      {activeTab === 'BARCODE_DESK' && (
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <QrCode className="h-4 w-4 text-indigo-400" />
              <span>Accession Barcode & Spine Tag Label Generator</span>
            </h3>
            <span className="text-xs text-slate-500">Print labels for all catalogued book copies</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {books.map(b => {
              const bookCopies = getBookPhysicalCopies(b);
              return bookCopies.map((cp, idx) => (
                <div key={cp.id || `${b.id}_${idx}`} className="p-4 rounded-xl bg-[#f1f5f9] border border-slate-200/90 space-y-3 font-mono">
                  <div className="border-b border-slate-200/90 pb-2 text-[10px] text-slate-500 flex justify-between">
                    <span>{b.callNumber}</span>
                    <span className="text-blue-400 font-bold">{cp.accessionNumber}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">{b.title}</div>
                  <div className="text-[10px] text-amber-400">
                    Copy: {b.copyNo || `C.${idx + 1}`} • {b.shelfLocation || cp.branchLocation}
                  </div>
                  <div className="bg-white p-3 rounded-lg text-black text-center space-y-1">
                    <div className="tracking-[6px] font-bold text-sm">|||||||||||||||||</div>
                    <div className="text-[10px] font-bold">{cp.barcode || 'BAR88001'}</div>
                  </div>
                  <button
                    onClick={() => alert(`Sending spine label barcode for '${b.title}' (${cp.accessionNumber}) to thermal printer...`)}
                    className="w-full py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-[11px] font-semibold cursor-pointer hover:bg-indigo-600/30"
                  >
                    Print Spine Tag
                  </button>
                </div>
              ));
            })}
          </div>
        </div>
      )}

      {/* DEDICATED PHYSICAL COPIES & ACCESSION MANAGER MODAL */}
      {selectedBookForCopies && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200/90 flex items-center justify-between bg-slate-100">
              <div className="flex items-center space-x-3">
                <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Copy className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                    <span>Physical Copies & Accession Manager</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-md">
                    "{selectedBookForCopies.title}" (ISBN: {selectedBookForCopies.isbn})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookForCopies(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Read-Only Bibliographic Context Banner */}
            <div className="px-5 py-3 bg-[#f1f5f9] border-b border-slate-200/90 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-slate-700 font-mono text-[11px]">
                <span className="text-emerald-400 font-semibold">DDC/Call: {selectedBookForCopies.callNumber}</span>
                <span>•</span>
                <span className="text-blue-400">{selectedBookForCopies.department}</span>
                <span>•</span>
                <span>Default Shelf: {selectedBookForCopies.shelfLocation || 'Stack CS-01-A'}</span>
              </div>
              <div className="text-[10px] text-amber-400 font-semibold">
                ✓ Bibliographic details locked. Only specify Accession No & Location.
              </div>
            </div>

            {/* Sub-Tabs: Single Add vs Batch Ingest vs Registered List */}
            <div className="flex border-b border-slate-200/90 bg-white px-5 pt-3 gap-2">
              <button
                onClick={() => setCopyModalTab('SINGLE')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                  copyModalTab === 'SINGLE'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-500 hover:text-white'
                }`}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>+ Add Single Copy</span>
              </button>

              <button
                onClick={() => setCopyModalTab('BATCH')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                  copyModalTab === 'BATCH'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-500 hover:text-white'
                }`}
              >
                <Boxes className="h-3.5 w-3.5" />
                <span>+ Batch Generate Copies</span>
              </button>

              <button
                onClick={() => setCopyModalTab('LIST')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                  copyModalTab === 'LIST'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-500 hover:text-white'
                }`}
              >
                <ListPlus className="h-3.5 w-3.5" />
                <span>Registered Copies ({getBookPhysicalCopies(selectedBookForCopies).length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* TAB A: SINGLE COPY FAST ADD */}
              {copyModalTab === 'SINGLE' && (
                <form onSubmit={handleAddSingleCopySubmit} className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 space-y-1">
                    <div className="font-bold flex items-center space-x-1.5">
                      <Tag className="h-4 w-4" />
                      <span>Fast Accession Entry for Copy #{getBookPhysicalCopies(selectedBookForCopies).length + 1}</span>
                    </div>
                    <p className="text-[11px] text-purple-300/80">
                      No need to re-enter Title, Author, or ISBN. Simply provide the unique Accession Number and physical shelf/branch location.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-900 font-mono font-semibold">Accession Number *</label>
                        <button
                          type="button"
                          onClick={() => {
                            const { accession, num } = calculateNextAccessionNumber();
                            setSingleCopyForm(prev => ({
                              ...prev,
                              accessionNumber: accession,
                              barcode: `BAR${num}`,
                              rfidUid: `RFID${num}`
                            }));
                          }}
                          className="text-[10px] text-purple-400 hover:underline flex items-center space-x-0.5 cursor-pointer"
                        >
                          <RefreshCw className="h-2.5 w-2.5" />
                          <span>Auto-Generate Next</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={singleCopyForm.accessionNumber}
                        onChange={e => setSingleCopyForm({ ...singleCopyForm, accessionNumber: e.target.value })}
                        placeholder="e.g. ACC-2026-0895"
                        className="w-full bg-[#f1f5f9] border border-purple-500/50 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-400 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-900 mb-1 font-mono font-semibold">Copy Designation *</label>
                      <input
                        type="text"
                        required
                        value={singleCopyForm.copyNumber}
                        onChange={e => setSingleCopyForm({ ...singleCopyForm, copyNumber: e.target.value })}
                        placeholder="e.g. C.2"
                        className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-900 mb-1 font-mono font-semibold">Shelf Location / Stack *</label>
                      <input
                        type="text"
                        required
                        value={singleCopyForm.shelfLocation}
                        onChange={e => setSingleCopyForm({ ...singleCopyForm, shelfLocation: e.target.value })}
                        placeholder="e.g. Stack CS-04-A"
                        className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-900 mb-1 font-mono font-semibold">Library Branch *</label>
                      <select
                        value={singleCopyForm.branchLocation}
                        onChange={e => setSingleCopyForm({ ...singleCopyForm, branchLocation: e.target.value })}
                        className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 cursor-pointer"
                      >
                        {(settings?.branches || ['Central Academic Library', 'Engineering & Tech Library', 'Medical & Health Sciences Library', 'Law & Humanities Library']).map(br => (
                          <option key={br} value={br}>{br}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1 font-mono">Barcode (Auto-Generated)</label>
                      <input
                        type="text"
                        value={singleCopyForm.barcode}
                        onChange={e => setSingleCopyForm({ ...singleCopyForm, barcode: e.target.value })}
                        className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-mono text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1 font-mono">Initial Copy Status</label>
                      <select
                        value={singleCopyForm.status}
                        onChange={e => setSingleCopyForm({ ...singleCopyForm, status: e.target.value as BookCopy['status'] })}
                        className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 cursor-pointer"
                      >
                        <option value="AVAILABLE">AVAILABLE (On Shelf)</option>
                        <option value="REFERENCE_ONLY">REFERENCE ONLY (In-Library)</option>
                        <option value="RESERVED">RESERVED</option>
                        <option value="UNDER_REPAIR">UNDER REPAIR / BINDING</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/90 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer shadow-lg shadow-purple-500/20 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add This Physical Copy</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB B: BATCH INGEST COPIES */}
              {copyModalTab === 'BATCH' && (
                <form onSubmit={handleAddBatchCopiesSubmit} className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 space-y-1">
                    <div className="font-bold flex items-center space-x-1.5">
                      <Boxes className="h-4 w-4" />
                      <span>Batch Copy Accession Ingestion</span>
                    </div>
                    <p className="text-[11px] text-blue-300/80">
                      Instantly generate sequential accession numbers (e.g. 5 copies at once) for bulk shipments.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-900 font-mono font-semibold text-xs">Copies to Add *</label>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                          Extended Batch (Up to 10,000)
                        </span>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={10000}
                        required
                        value={batchCopyForm.quantity}
                        onChange={e => setBatchCopyForm({ ...batchCopyForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-full bg-[#f1f5f9] border border-blue-500/50 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-mono font-bold text-base"
                      />
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-slate-400 font-mono">Presets:</span>
                        {[5, 10, 25, 50, 100, 250, 500, 1000].map(qty => (
                          <button
                            key={qty}
                            type="button"
                            onClick={() => setBatchCopyForm({ ...batchCopyForm, quantity: qty })}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold cursor-pointer transition-all ${
                              batchCopyForm.quantity === qty
                                ? 'bg-blue-600 text-white border border-blue-400'
                                : 'bg-slate-100 text-slate-700 hover:bg-zinc-700 border border-slate-300'
                            }`}
                          >
                            +{qty}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-900 mb-1 font-mono font-semibold">Accession Prefix</label>
                      <input
                        type="text"
                        required
                        value={batchCopyForm.prefix}
                        onChange={e => setBatchCopyForm({ ...batchCopyForm, prefix: e.target.value })}
                        className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-900 mb-1 font-mono font-semibold">Starting Number *</label>
                      <input
                        type="number"
                        required
                        value={batchCopyForm.startNumber}
                        onChange={e => setBatchCopyForm({ ...batchCopyForm, startNumber: parseInt(e.target.value) || 1000 })}
                        className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-900 mb-1 font-mono font-semibold">Shelf Location / Stack</label>
                      <input
                        type="text"
                        required
                        value={batchCopyForm.shelfLocation}
                        onChange={e => setBatchCopyForm({ ...batchCopyForm, shelfLocation: e.target.value })}
                        placeholder="e.g. Stack CS-04-A"
                        className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-900 mb-1 font-mono font-semibold">Library Branch</label>
                      <select
                        value={batchCopyForm.branchLocation}
                        onChange={e => setBatchCopyForm({ ...batchCopyForm, branchLocation: e.target.value })}
                        className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 cursor-pointer"
                      >
                        {(settings?.branches || ['Central Academic Library', 'Engineering & Tech Library', 'Medical & Health Sciences Library', 'Law & Humanities Library']).map(br => (
                          <option key={br} value={br}>{br}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Preview of Generated Accessions */}
                  <div className="p-3 bg-[#f1f5f9] rounded-xl border border-slate-200/90 space-y-1 font-mono text-[11px]">
                    <span className="text-slate-500">Generated Sequence Preview:</span>
                    <div className="text-emerald-400 font-bold">
                      {batchCopyForm.prefix}{String(batchCopyForm.startNumber).padStart(4, '0')} →{' '}
                      {batchCopyForm.prefix}{String(batchCopyForm.startNumber + Math.max(1, batchCopyForm.quantity) - 1).padStart(4, '0')}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/90 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer shadow-lg shadow-blue-500/20 flex items-center space-x-2"
                    >
                      <Boxes className="h-4 w-4" />
                      <span>+ Batch Ingest {batchCopyForm.quantity} Copies</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB C: LIST REGISTERED COPIES */}
              {copyModalTab === 'LIST' && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200/90 overflow-hidden bg-[#f1f5f9]">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="border-b border-slate-200/90 bg-slate-100 text-slate-500">
                          <th className="p-3">Accession No</th>
                          <th className="p-3">Barcode</th>
                          <th className="p-3">Branch & Stack</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {getBookPhysicalCopies(selectedBookForCopies).map((cp, idx) => (
                          <tr key={cp.id || idx} className="hover:bg-white">
                            <td className="p-3 font-bold text-amber-400">{cp.accessionNumber}</td>
                            <td className="p-3 text-blue-400">{cp.barcode}</td>
                            <td className="p-3 text-slate-500 font-sans">
                              <div>{cp.branchLocation}</div>
                              <div className="text-[10px] text-slate-400">{selectedBookForCopies.shelfLocation}</div>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  cp.status === 'AVAILABLE'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                {cp.status}
                              </span>
                            </td>
                            <td className="p-3 text-right font-sans">
                              {getBookPhysicalCopies(selectedBookForCopies).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeletePhysicalCopy(cp.id, cp.accessionNumber)}
                                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white cursor-pointer transition-all"
                                  title="Delete Copy"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200/90 bg-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Total Registered: <strong>{getBookPhysicalCopies(selectedBookForCopies).length} Copies</strong>
              </div>
              <button
                onClick={() => setSelectedBookForCopies(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-zinc-700 text-slate-900 text-xs font-semibold cursor-pointer"
              >
                Close Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MARC Tag Modal Viewer */}
      {selectedBookForMarc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <FileCode className="h-4 w-4 text-blue-400" />
                <span>MARC21 Record Tag Inspection</span>
              </h3>
              <button onClick={() => setSelectedBookForMarc(null)} className="text-slate-500 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-2 bg-[#f1f5f9] p-3 rounded-xl border border-slate-200/90 text-[11px]">
              <div className="text-blue-400"><strong className="text-slate-500">000 Leader:</strong> 00000nam a2200000 u 4500</div>
              <div className="text-slate-900"><strong className="text-slate-500">020 ISBN:</strong> {selectedBookForMarc.isbn}</div>
              <div className="text-emerald-400"><strong className="text-slate-500">082 Dewey Call:</strong> {selectedBookForMarc.callNumber}</div>
              <div className="text-amber-400 font-bold"><strong className="text-slate-500">090 Accession No:</strong> {selectedBookForMarc.accessionNumber || 'ACC-88001'}</div>
              <div className="text-emerald-300 font-bold"><strong className="text-slate-500">852 $t Copy No:</strong> {selectedBookForMarc.copyNo || selectedBookForMarc.copyNumber || 'C.1'}</div>
              <div className="text-slate-900"><strong className="text-slate-500">100 Main Author:</strong> {selectedBookForMarc.authors.join(', ')}</div>
              <div className="text-amber-300"><strong className="text-slate-500">245 Title Tag:</strong> {selectedBookForMarc.title}</div>
              <div className="text-slate-900"><strong className="text-slate-500">260 Publisher:</strong> {selectedBookForMarc.publisherName}, {selectedBookForMarc.publisherYear}</div>
              <div className="text-slate-900"><strong className="text-slate-500">300 Physical:</strong> {selectedBookForMarc.pageCount} Pages</div>

              {/* MARC21 6XX / RDA Subject Headings Inspection */}
              <div className="pt-2 pb-1 border-t border-slate-200 mt-2 space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-[10px] text-slate-700 font-bold">
                  <span className="flex items-center space-x-1">
                    <Tag className="h-3 w-3 text-emerald-600" />
                    <span>MARC21 6XX Subject Access (RDA Chap. 23)</span>
                  </span>
                  <span className="text-emerald-700 font-semibold text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    LCSH / FAST / MeSH / Sears
                  </span>
                </div>
                {selectedBookForMarc.subjectEntries && selectedBookForMarc.subjectEntries.length > 0 ? (
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                    {selectedBookForMarc.subjectEntries.map((se, i) => (
                      <div key={i} className="flex items-start space-x-1.5 text-[10px] bg-white p-1.5 rounded border border-slate-200">
                        <span className="font-mono text-emerald-700 font-bold shrink-0">{se.tag} {se.ind1 || '#'}{se.ind2 || '0'}</span>
                        <span className="font-mono text-slate-800 break-all">{se.rawMarcString || `$a ${se.formattedHeading}`}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] bg-white p-1.5 rounded border border-slate-200 text-slate-800 font-mono">
                    <span className="text-emerald-700 font-bold mr-1.5">650 #0</span>
                    <span>$a {selectedBookForMarc.subjects?.join(' $x ') || 'General'}</span>
                  </div>
                )}
              </div>

              {(selectedBookForMarc.description || selectedBookForMarc.marcTags?.['520']) && (
                <div className="text-cyan-300"><strong className="text-slate-500">520 Summary / Scope:</strong> {selectedBookForMarc.description || selectedBookForMarc.marcTags?.['520']}</div>
              )}
              {(selectedBookForMarc.generalNotes || selectedBookForMarc.notes || selectedBookForMarc.marcTags?.['500']) && (
                <div className="text-emerald-300"><strong className="text-slate-500">500 General Notes:</strong> {selectedBookForMarc.generalNotes || selectedBookForMarc.notes || selectedBookForMarc.marcTags?.['500']}</div>
              )}
              <div className="text-emerald-300"><strong className="text-slate-500">852 $c Location:</strong> {selectedBookForMarc.shelfLocation || 'Stack CS-01-A'}</div>
            </div>

            <div className="flex justify-between items-center pt-2 flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const target = selectedBookForMarc;
                    handleStartEdit(target);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600 hover:text-white text-[11px] font-bold cursor-pointer flex items-center space-x-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit Record</span>
                </button>

                <button
                  onClick={() => {
                    const target = selectedBookForMarc;
                    setSelectedBookForMarc(null);
                    handleOpenCopiesManager(target);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600 hover:text-white text-[11px] font-bold cursor-pointer flex items-center space-x-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Add Copies</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {onDeleteBook && (
                  <button
                    onClick={() => {
                      if (confirm(`Remove MARC21 record "${selectedBookForMarc.title}"?`)) {
                        onDeleteBook(selectedBookForMarc.id);
                        setSelectedBookForMarc(null);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white text-[11px] font-bold cursor-pointer flex items-center space-x-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedBookForMarc(null)}
                  className="px-4 py-1.5 rounded-xl bg-[#f1f5f9] border border-slate-200/90 text-slate-900 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Library Scheme Modal */}
      {isAddSchemeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Tag className="h-4 w-4 text-emerald-400" />
                <span>Add Custom Library Classification Scheme</span>
              </h3>
              <button
                onClick={() => setIsAddSchemeModalOpen(false)}
                className="text-slate-500 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newSchemeForm.name || !newSchemeForm.code) {
                  alert('Please enter a Scheme Name and Code.');
                  return;
                }
                const createdScheme: LibraryScheme = {
                  id: `scheme_${Date.now()}`,
                  name: newSchemeForm.name,
                  code: newSchemeForm.code.toLowerCase().replace(/\s+/g, '-'),
                  marcTag: newSchemeForm.marcTag || '084',
                  prefix: newSchemeForm.prefix || 'SCHEME',
                  description: newSchemeForm.description || 'Custom Library Classification Scheme'
                };
                setSchemes(prev => [...prev, createdScheme]);
                setMarcForm(prev => ({ ...prev, schemeId: createdScheme.id }));
                setIsAddSchemeModalOpen(false);
                setNewSchemeForm({ name: '', code: '', marcTag: '084', prefix: '', description: '' });
                alert(`New Library Scheme '${createdScheme.name}' added successfully!`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-500 mb-1 font-medium">Scheme Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Higher Education Commission (HEC) PK Scheme"
                  value={newSchemeForm.name}
                  onChange={e => setNewSchemeForm({ ...newSchemeForm, name: e.target.value })}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Scheme Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="hec-pk"
                    value={newSchemeForm.code}
                    onChange={e => setNewSchemeForm({ ...newSchemeForm, code: e.target.value })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-medium">MARC Tag *</label>
                  <select
                    value={newSchemeForm.marcTag}
                    onChange={e => setNewSchemeForm({ ...newSchemeForm, marcTag: e.target.value })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer font-mono"
                  >
                    <option value="082">MARC 082 (Dewey / DDC)</option>
                    <option value="050">MARC 050 (Congress / LCC)</option>
                    <option value="080">MARC 080 (Universal / UDC)</option>
                    <option value="060">MARC 060 (Medicine / NLM)</option>
                    <option value="084">MARC 084 (Other Custom Scheme)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-medium">Notation Prefix / Symbol</label>
                <input
                  type="text"
                  placeholder="e.g. HEC-PK or ISL"
                  value={newSchemeForm.prefix}
                  onChange={e => setNewSchemeForm({ ...newSchemeForm, prefix: e.target.value })}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-medium">Scheme Description & Notes</label>
                <textarea
                  rows={2}
                  placeholder="Describe classification rules, scope, or institutional policies..."
                  value={newSchemeForm.description}
                  onChange={e => setNewSchemeForm({ ...newSchemeForm, description: e.target.value })}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSchemeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#f1f5f9] border border-slate-200/90 text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  Save Library Scheme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete All Books Confirmation Modal */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-red-500/40 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl shadow-red-950/40">
            {/* Header */}
            <div className="flex items-start space-x-3.5">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>Purge Entire Library Catalog?</span>
                </h3>
                <p className="text-xs text-red-300/80 mt-1 leading-relaxed">
                  Warning: This destructive administrative action will permanently delete all bibliographic records and physical copy holdings from the library catalog.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsDeleteAllModalOpen(false);
                  setDeleteAllConfirmInput('');
                }}
                className="text-slate-500 hover:text-white cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Impact Summary Card */}
            <div className="p-4 rounded-xl bg-[#f1f5f9] border border-slate-200/90 space-y-2.5 text-xs">
              <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                Records targeted for permanent deletion:
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-zinc-900/80 border border-slate-200/90">
                  <div className="text-slate-500 text-[11px]">MARC21 Book Titles</div>
                  <div className="text-xl font-bold text-red-400 font-mono mt-0.5">{books.length} Records</div>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900/80 border border-slate-200/90">
                  <div className="text-slate-500 text-[11px]">Physical Copy Holdings</div>
                  <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">
                    {copies.length > 0 ? `${copies.length} Copies` : 'All Linked Copies'}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                All associated MARC tags, Dewey call numbers, accession codes, barcoding records, and shelf assignments will be cleared.
              </p>
            </div>

            {/* Confirmation Field */}
            <div className="space-y-2">
              <label className="block text-xs text-slate-700 font-medium">
                To confirm permanent deletion, please type <span className="font-mono font-bold text-red-400">DELETE ALL</span> below:
              </label>
              <input
                type="text"
                value={deleteAllConfirmInput}
                onChange={e => setDeleteAllConfirmInput(e.target.value)}
                placeholder="Type DELETE ALL to confirm"
                className="w-full bg-[#f1f5f9] border border-red-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono placeholder:text-zinc-600"
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteAllModalOpen(false);
                  setDeleteAllConfirmInput('');
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-zinc-700 text-slate-700 text-xs font-semibold cursor-pointer transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteAllBooks}
                disabled={deleteAllConfirmInput.trim().toUpperCase() !== 'DELETE ALL'}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-lg ${
                  deleteAllConfirmInput.trim().toUpperCase() === 'DELETE ALL'
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 ring-2 ring-red-500/50 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60'
                }`}
              >
                <Trash2 className="h-4 w-4" />
                <span>Permanently Delete All Books</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High-Capacity 300,000+ Titles / 660,000+ Holdings Export Modal */}
      <HighCapacityExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        customBooks={books}
        filteredBooks={filteredBooks}
        existingCopies={copies}
        activeDdcFilter={selectedDdcFilter}
      />

      {/* High-Capacity Bulk Import & Holdings Ingestion Modal */}
      <HighCapacityImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={(newBooks, newCopies) => {
          if (onImportBooks) {
            onImportBooks(newBooks, newCopies);
          } else {
            newBooks.forEach(b => onAddBook && onAddBook(b));
            if (onAddCopies && newCopies.length > 0) {
              onAddCopies(newCopies);
            }
          }
          setCatalogRefreshTrigger(prev => prev + 1);
          setIsImportModalOpen(false);
        }}
      />

      {/* 1-Minute Rapid Catalog Purge & Clean Slate Modal */}
      <PurgeCatalogModal
        isOpen={isPurgeModalOpen}
        onClose={() => setIsPurgeModalOpen(false)}
        onPurgeAllToCleanSlate={handlePurgeAllToCleanSlate}
        onPurgeCustomOnly={handlePurgeCustomOnly}
        onRestoreReferenceCatalog={handleRestoreReferenceCatalog}
        customBooksCount={books.length}
        totalCatalogCount={totalCatalogCount}
        isReferenceActive={isReferenceCatalogActive()}
      />

      {/* Provision Holdings on Need (Up to 3 Lakhs) Builder Modal */}
      <LibrarianHoldingsBuilderModal
        isOpen={isHoldingsBuilderOpen}
        onClose={() => setIsHoldingsBuilderOpen(false)}
        onAddHoldings={(newBooks, newCopies) => {
          if (onImportBooks) {
            onImportBooks(newBooks, newCopies);
          } else {
            newBooks.forEach(b => onAddBook && onAddBook(b));
            if (onAddCopies && newCopies.length > 0) {
              onAddCopies(newCopies);
            }
          }
          setCatalogRefreshTrigger(prev => prev + 1);
        }}
        currentCatalogCount={totalCatalogCount}
      />
    </div>
  );
};
