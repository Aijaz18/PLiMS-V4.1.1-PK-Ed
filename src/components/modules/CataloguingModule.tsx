import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Languages
} from 'lucide-react';
import { BookRecord, BookCopy, UserProfile, InterLibraryTransfer, SystemSettings, LibraryScheme } from '../../types/alims';
import { generateAiCataloguing, generateAiCataloguingFromImage, AiCataloguingResult, formatMarcSubfields } from '../../services/geminiService';
import { generateCallNumberForTitle, detectTextScript } from '../../utils/classificationEngine';

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
  onDeleteBranch
}) => {
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'NEW_MARC' | 'TRANSFERS' | 'FINES_DESK' | 'BARCODE_DESK'>('CATALOG');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookForMarc, setSelectedBookForMarc] = useState<BookRecord | null>(null);

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

  // AI Agent & Cataloguing Entry Modes: 'AI_IMAGE_AGENT' (Upload Cover), 'AI_TEXT_AGENT' (Prompt), 'MANUAL_ENTRY' (Direct)
  const [entryMode, setEntryMode] = useState<'AI_IMAGE_AGENT' | 'AI_TEXT_AGENT' | 'MANUAL_ENTRY'>('AI_IMAGE_AGENT');
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

  // Filtered catalog
  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.isbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.callNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.accessionNumber && b.accessionNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
    b.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Check user powers
  const userPowers = currentUser?.staffPowers || [];
  const canCatalog = userPowers.includes('CAN_CATALOG') || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'CHIEF_LIBRARIAN';
  const canClearFines = userPowers.includes('CAN_CLEAR_FINES') || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'CHIEF_LIBRARIAN';
  const canTransfer = userPowers.includes('CAN_INTER_LIBRARY_TRANSFER') || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'CHIEF_LIBRARIAN';

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
        subjects: parsedSubjects.length > 0 ? parsedSubjects : ['General'],
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
          '650': `$a ${marcForm.subjects}`,
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
        subjects: parsedSubjects.length > 0 ? parsedSubjects : ['General'],
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
          '650': `$a ${marcForm.subjects}`,
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

        // Generate up to copiesCount (up to 500 synchronous records for instant snappy UI response)
        const countToCreate = Math.min(copiesCount, 500);
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

  return (
    <div className="space-y-6">
      {/* Top Banner with Sub-Nav */}
      <div className="p-6 rounded-3xl border border-[#27272a] bg-gradient-to-r from-[#121214] via-[#18181b] to-[#121214] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <FileCode className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-bold text-[#fafafa] tracking-tight">
                MARC21 / RDA Cataloguing & Copy Holdings Desk
              </h2>
              {editingBookId && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center space-x-1">
                  <Pencil className="h-3 w-3" />
                  <span>Editing Existing Record</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[#a1a1aa]">
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
                  : 'bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa]'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>MARC21 Catalog ({books.length})</span>
            </button>

            <button
              onClick={() => {
                if (!editingBookId) {
                  setMarcForm(defaultMarcForm);
                }
                setActiveTab('NEW_MARC');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                activeTab === 'NEW_MARC'
                  ? editingBookId
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                    : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa]'
              }`}
            >
              {editingBookId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span>{editingBookId ? 'Edit Record Form' : '+ New MARC Record'}</span>
            </button>

            <button
              onClick={() => setActiveTab('TRANSFERS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                activeTab === 'TRANSFERS'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                  : 'bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa]'
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
                  : 'bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa]'
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
                  : 'bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa]'
              }`}
            >
              <QrCode className="h-4 w-4" />
              <span>Spine Barcodes</span>
            </button>
          </div>

          {/* Unlimited Capacity Indicator */}
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-2 shadow-sm">
            <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Book Capacity: <strong className="text-white font-mono">Unlimited (∞ Uncapped)</strong></span>
          </div>
        </div>
        </div>
      </div>

      {/* TAB 1: MARC21 CATALOG EXPLORER */}
      {activeTab === 'CATALOG' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a1a1aa]" />
              <input
                type="text"
                placeholder="Search catalog by Title, Author, ISBN, Call Number, Accession No, or Department..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#121214] border border-[#27272a] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#fafafa] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
              {/* Delete All Books Button */}
              {books.length > 0 && onDeleteAllBooks && (
                <button
                  type="button"
                  onClick={() => setIsDeleteAllModalOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm shrink-0"
                  title="Purge all book records and copies from the catalog"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete All Books ({books.length})</span>
                </button>
              )}

              {/* Restore Sample Catalog if empty */}
              {books.length === 0 && onRestoreSampleBooks && (
                <button
                  type="button"
                  onClick={() => {
                    onRestoreSampleBooks();
                    alert('Sample MARC21 catalog restored successfully!');
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600 hover:text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm shrink-0"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Restore Sample Books</span>
                </button>
              )}

              <button
                onClick={() => {
                  setEditingBookId(null);
                  setMarcForm(defaultMarcForm);
                  setActiveTab('NEW_MARC');
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>+ Add MARC21 Record</span>
              </button>
            </div>
          </div>

          {/* Empty Catalog State */}
          {books.length === 0 ? (
            <div className="p-12 rounded-2xl border border-dashed border-[#27272a] bg-[#121214] flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 text-zinc-400">
                <FolderX className="h-10 w-10 text-red-400" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-base font-bold text-[#fafafa]">Library Catalog is Currently Empty (0 Books)</h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  All MARC21 bibliographic records and physical copies have been deleted or no books have been added yet. Start fresh by creating new records or restore sample books.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setEditingBookId(null);
                    setMarcForm(defaultMarcForm);
                    setEntryMode('AI_IMAGE_AGENT');
                    setActiveTab('NEW_MARC');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-blue-500/20"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>AI Cover Scanner</span>
                </button>

                <button
                  onClick={() => {
                    setEditingBookId(null);
                    setMarcForm(defaultMarcForm);
                    setEntryMode('MANUAL_ENTRY');
                    setActiveTab('NEW_MARC');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Record Manually</span>
                </button>

                {onRestoreSampleBooks && (
                  <button
                    onClick={() => {
                      onRestoreSampleBooks();
                      alert('Sample MARC21 catalog restored successfully!');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4 text-zinc-400" />
                    <span>Restore Sample Books</span>
                  </button>
                )}
              </div>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="p-8 rounded-2xl border border-[#27272a] bg-[#121214] flex flex-col items-center justify-center text-center space-y-3">
              <Search className="h-8 w-8 text-[#71717a]" />
              <p className="text-sm font-semibold text-[#fafafa]">No books matching "{searchQuery}"</p>
              <p className="text-xs text-[#a1a1aa]">Try adjusting your search keywords, ISBN, call number, or department.</p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-1.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs font-semibold hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
              >
                Clear Search Query
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBooks.map(b => {
                const bookCopies = getBookPhysicalCopies(b);
                const availableCount = bookCopies.filter(c => c.status === 'AVAILABLE').length;

                return (
                  <div
                    key={b.id}
                    className="p-5 rounded-2xl border border-[#27272a] bg-[#121214] hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4 relative group shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <img
                          src={b.coverUrl}
                          alt={b.title}
                          className="w-16 h-22 rounded-xl object-cover border border-[#27272a] shrink-0 shadow-md bg-[#18181b]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 font-mono text-[10px] text-blue-400 font-semibold">
                              {b.callNumber}
                            </span>
                            <span className="text-[10px] font-mono text-[#a1a1aa]">ISBN: {b.isbn}</span>
                            <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 font-medium">
                              {b.department}
                            </span>
                          </div>
                          <h3 className="font-bold text-[#fafafa] text-sm mt-1 leading-snug">{b.title}</h3>
                          <p className="text-xs text-[#a1a1aa] mt-0.5">{b.authors.join(', ')}</p>
                          <p className="text-[11px] text-[#71717a] mt-0.5">
                            {b.publisherName} ({b.publisherYear}) • {b.edition || '1st Edition'} • {b.pageCount} Pages
                          </p>
                          {b.description && (
                            <p className="text-[11px] text-zinc-300 italic line-clamp-2 mt-1.5 border-l-2 border-emerald-500/60 pl-2 bg-zinc-900/50 py-0.5 rounded-r">
                              "{b.description}"
                            </p>
                          )}
                          {b.generalNotes && (
                            <p className="text-[10px] text-zinc-400 line-clamp-1 mt-1 flex items-center space-x-1">
                              <span className="text-amber-400 font-semibold font-mono">500:</span>
                              <span>{b.generalNotes}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quick Action Menu: Edit & Delete */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          type="button"
                          title="Edit Bibliographic Record"
                          onClick={() => handleStartEdit(b)}
                          className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-600 hover:text-white transition-all cursor-pointer"
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
                            className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* MARC ISO Holdings Overview */}
                    <div className="bg-[#09090b] p-3 rounded-xl border border-[#27272a] text-xs space-y-1.5 font-mono">
                      <div className="flex justify-between text-[#a1a1aa]">
                        <span>082 Call No:</span>
                        <span className="text-[#fafafa]">{b.callNumber}</span>
                      </div>
                      <div className="flex justify-between text-[#a1a1aa]">
                        <span>090 Primary Accession:</span>
                        <span className="text-amber-400 font-bold">{b.accessionNumber || 'ACC-88001'}</span>
                      </div>
                      <div className="flex justify-between text-[#a1a1aa]">
                        <span>852 Shelf Location:</span>
                        <span className="text-emerald-400">{b.shelfLocation || 'Stack CS-01-A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[#a1a1aa] pt-1 border-t border-zinc-800">
                        <span>Physical Holdings:</span>
                        <span className="text-blue-300 font-semibold">
                          {bookCopies.length} {bookCopies.length === 1 ? 'Copy Registered' : 'Copies Registered'} ({availableCount} Available)
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between text-xs pt-1 gap-2 flex-wrap border-t border-zinc-800/60 mt-1">
                      {/* Fast Copy Accessioning Badge & Action */}
                      <button
                        onClick={() => handleOpenCopiesManager(b, 'SINGLE')}
                        className="px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 text-[11px] font-bold cursor-pointer flex items-center space-x-1.5 transition-all shadow-sm"
                      >
                        <Copy className="h-3.5 w-3.5 text-purple-400" />
                        <span>+ Add / Manage Copies ({bookCopies.length})</span>
                      </button>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleStartEdit(b)}
                          className="px-3 py-1.5 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30 text-[11px] font-semibold cursor-pointer flex items-center space-x-1"
                        >
                          <Pencil className="h-3 w-3" />
                          <span>Edit Record</span>
                        </button>

                        <button
                          onClick={() => setSelectedBookForMarc(b)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600/30 text-[11px] font-semibold cursor-pointer"
                        >
                          MARC Tags
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADD / EDIT MARC21 BIBLIOGRAPHIC RECORD */}
      {activeTab === 'NEW_MARC' && (
        <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-6 space-y-6">
          {/* Header & Mode Switcher */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#27272a] pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-[#fafafa] flex items-center space-x-2">
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
                </h3>
              </div>
              <p className="text-xs text-[#a1a1aa] mt-1">
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
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Cancel Edit</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center bg-[#09090b] border border-[#27272a] rounded-xl p-1 space-x-1">
                  <button
                    type="button"
                    onClick={() => setEntryMode('AI_IMAGE_AGENT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all ${
                      entryMode === 'AI_IMAGE_AGENT'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
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
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
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
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
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
                    <p className="text-xs text-zinc-400 mt-0.5">
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
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
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
                      <p className="text-zinc-300 mt-0.5">{cameraError}</p>
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
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-[11px] border border-zinc-700 cursor-pointer flex items-center space-x-1"
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
                    className="text-zinc-400 hover:text-white cursor-pointer"
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
                      <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
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
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700'
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
                          className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-[11px] text-zinc-200 focus:outline-none focus:border-blue-500"
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
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 cursor-pointer flex items-center space-x-1"
                        title="Flip / Switch Camera"
                      >
                        <SwitchCamera className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Flip Camera</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleStopCamera}
                        className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white cursor-pointer"
                        title="Close camera"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Video Viewfinder Container with Direct Captions */}
                  <div className="relative aspect-video min-h-[340px] max-h-[480px] w-full mx-auto overflow-hidden rounded-2xl bg-zinc-950 border border-blue-500/50 flex items-center justify-center shadow-2xl">
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
                            : 'bg-black/80 text-zinc-400 border border-zinc-700 hover:text-white'
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
                        <span className="bg-black/75 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-zinc-300 font-mono">
                          Center Title, Authors & Publisher
                        </span>
                      </div>
                    </div>

                    {/* DIRECT CAPTION ON LIVE CAMERA (Broadcast Closed-Captioning Lower-Third Overlay) */}
                    {isDirectCaptionEnabled && (
                      <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-auto transition-all">
                        <div className="p-3 sm:p-3.5 rounded-xl bg-black/90 backdrop-blur-md border border-amber-400/70 shadow-2xl shadow-black space-y-2">
                          <div className="flex items-center justify-between text-[11px] border-b border-zinc-800/90 pb-2 gap-2">
                            <div className="flex items-center space-x-2 min-w-0">
                              <span className="px-2 py-0.5 rounded bg-amber-400 text-black font-black font-mono text-[10px] tracking-wider uppercase flex items-center space-x-1 shrink-0 shadow-sm">
                                <Subtitles className="h-3 w-3" />
                                <span>DIRECT CAPTION</span>
                              </span>
                              <span className="text-zinc-200 font-bold text-[11px] truncate">
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
                                className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-mono cursor-pointer transition-colors"
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
                            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 text-[10px] font-mono border-t border-zinc-800/80">
                              <span className="text-zinc-400 font-bold">MARC21 Tags:</span>
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
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer border border-zinc-700 flex items-center space-x-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      <span>Use Sample Cover</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStopCamera}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
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
                      : 'border-zinc-700 hover:border-blue-500/60 bg-[#09090b]/60 hover:bg-blue-950/20'
                  }`}
                >
                  <div className="p-3 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Drop Book Cover image here, or <span className="text-blue-400 underline font-bold">browse from disk</span>
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Supports JPG, PNG, WEBP, HEIC (Photos of front cover, title page, copyright page, or spine)
                    </p>
                  </div>
                </div>

                {/* Cover Preview & Scanner Column */}
                <div className="md:col-span-4 p-3 rounded-xl bg-[#09090b] border border-zinc-800 flex flex-col items-center justify-center relative min-h-[160px]">
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
                          <div className="absolute bottom-2 bg-black/80 px-2 py-1 rounded text-[10px] text-cyan-300 font-mono flex items-center space-x-1">
                            <RefreshCw className="h-3 w-3 animate-spin text-cyan-400" />
                            <span>Scanning...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-zinc-500 space-y-1">
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
              <div className="pt-2 border-t border-zinc-800/80">
                <div className="text-[11px] font-semibold text-zinc-400 mb-2 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    <span>Try 1-Click Instant Sample Book Covers:</span>
                  </span>
                  <span className="text-[10px] text-zinc-500">Test AI Vision instantly</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {sampleBookCovers.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleProcessImage(s.coverUrl)}
                      className="p-2 rounded-xl bg-[#09090b] hover:bg-blue-950/30 border border-zinc-800 hover:border-blue-500/40 transition-all text-left flex items-center space-x-2 cursor-pointer group"
                    >
                      <img src={s.coverUrl} alt={s.title} className="w-8 h-10 object-cover rounded shadow shrink-0" />
                      <div className="overflow-hidden">
                        <span className="block text-[11px] font-semibold text-zinc-200 group-hover:text-blue-300 truncate">
                          {s.title}
                        </span>
                        <span className="block text-[10px] text-zinc-500 truncate">
                          {s.badge}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Extracted AI Intelligence Report */}
              {aiVisionAnalysis && !isScanningImage && (
                <div className="p-4 rounded-xl bg-[#09090b] border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">AI Vision Analysis Complete</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                        {aiVisionAnalysis.confidenceScore || 97}% Confidence
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Form auto-populated below • All fields fully editable
                    </span>
                  </div>

                  {aiVisionAnalysis.detectedText && (
                    <div className="text-[11px] text-zinc-300 flex items-center space-x-1.5">
                      <span className="text-zinc-500 font-mono">OCR Detected:</span>
                      <span className="text-amber-300/90 font-mono bg-zinc-900 px-2 py-0.5 rounded">
                        {aiVisionAnalysis.detectedText}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-[11px] text-zinc-400 flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded bg-zinc-900 text-blue-300 font-mono border border-zinc-800">
                      DDC: {aiVisionAnalysis.ddcClassification}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-900 text-purple-300 font-mono border border-zinc-800">
                      Call No: {aiVisionAnalysis.callNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-900 text-emerald-300 font-mono border border-zinc-800">
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
                  <p className="text-xs text-zinc-400 mt-0.5">
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
                  className="flex-1 bg-[#09090b] border border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-[#fafafa] focus:outline-none focus:border-purple-400"
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
                : 'bg-[#121214] border-[#27272a]'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-zinc-800">
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
                      <h4 className="font-bold text-[#fafafa] text-xs">
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
                    <p className="text-[11px] text-[#a1a1aa] mt-0.5">
                      Dictate book descriptions, abstracts, and notes hands-free directly into MARC entry fields.
                    </p>
                  </div>
                </div>

                {/* Dictation Controls: Language & Mode */}
                <div className="flex items-center space-x-2 self-end sm:self-center flex-wrap gap-y-1">
                  {/* Language Selector */}
                  <div className="flex items-center space-x-1 bg-[#09090b] p-1 rounded-xl border border-[#27272a] text-[10px]">
                    <Languages className="h-3.5 w-3.5 text-zinc-400 ml-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceLang('en-US');
                        if (isListening) handleStartVoiceInput(activeVoiceField);
                      }}
                      className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                        voiceLang === 'en-US'
                          ? 'bg-blue-600 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
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
                          : 'text-zinc-400 hover:text-zinc-200'
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
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Arabic (العربية) Speech Recognition"
                    >
                      العربية
                    </button>
                  </div>

                  {/* Mode: Append or Replace */}
                  <div className="flex items-center space-x-1 bg-[#09090b] p-1 rounded-xl border border-[#27272a] text-[10px]">
                    <button
                      type="button"
                      onClick={() => setVoiceDictationMode('append')}
                      className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                        voiceDictationMode === 'append'
                          ? 'bg-zinc-700 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
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
                          : 'text-zinc-400 hover:text-zinc-200'
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
                <span className="text-[10px] text-zinc-500 font-mono mr-1">Target MARC Field:</span>
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
                          : 'bg-[#09090b] border border-[#27272a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
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
                    <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-black/60 border border-emerald-500/40">
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
                <div className="flex items-center space-x-1 text-[10px] text-zinc-400 overflow-x-auto py-1">
                  <span className="font-mono text-zinc-500 mr-1 hidden md:inline">Spoken Punctuation:</span>
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
                      className="px-2 py-1 rounded bg-[#09090b] border border-[#27272a] hover:border-zinc-500 text-zinc-300 hover:text-white cursor-pointer font-mono transition-all"
                      title={`Insert ${p.label} into ${activeVoiceField}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Interim Speech Transcript Ticker */}
              {(isListening || interimTranscript) && (
                <div className="p-3 rounded-xl bg-black/80 border border-emerald-500/30 flex items-start space-x-2.5">
                  <Radio className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5 animate-spin" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                      Real-time Speech Recognition Stream:
                    </div>
                    <p className="text-xs text-zinc-100 font-sans italic mt-0.5">
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
              <div className="pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-zinc-400 font-mono flex items-center space-x-1">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    <span>Librarian Quick Dictation Presets (1-Click Test & Populate):</span>
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Simulates speech to test MARC 520 / 500 entry instantly
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {sampleDictationPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplySampleDictation(preset)}
                      className="p-2 rounded-xl bg-[#09090b] border border-[#27272a] hover:border-emerald-500/50 hover:bg-emerald-950/10 text-left transition-all cursor-pointer group"
                      title={preset.text}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="font-semibold text-zinc-300 group-hover:text-emerald-300">
                          {preset.label}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[9px]">
                          {preset.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
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
                  <label className="block text-[#fafafa] mb-1 font-mono font-semibold">
                    090 Tag - Accession No. (Accession Number) *
                  </label>
                  <input
                    type="text"
                    required
                    value={marcForm.accessionNumber}
                    onChange={e => setMarcForm({ ...marcForm, accessionNumber: e.target.value })}
                    placeholder="e.g. ACC-2026-0891"
                    className="w-full bg-[#09090b] border border-amber-500/50 rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-amber-400 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[#fafafa] mb-1 font-mono font-semibold">
                    852 $t Tag - Primary Copy Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={marcForm.copyNo}
                    onChange={e => setMarcForm({ ...marcForm, copyNo: e.target.value })}
                    placeholder="e.g. C.1 or Copy 1"
                    className="w-full bg-[#09090b] border border-amber-500/50 rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-amber-400 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[#fafafa] mb-1 font-mono font-semibold">
                    852 $c Tag - Shelf Location / Stack *
                  </label>
                  <input
                    type="text"
                    required
                    value={marcForm.shelfLocation}
                    onChange={e => setMarcForm({ ...marcForm, shelfLocation: e.target.value })}
                    placeholder="e.g. Stack CS-04-A"
                    className="w-full bg-[#09090b] border border-amber-500/50 rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-amber-400 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Bibliographic Particulars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[#a1a1aa] mb-1 font-mono text-[11px] flex items-center justify-between">
                  <span>020 Tag - ISBN Number</span>
                  <span className="text-[10px] text-zinc-500 font-sans">10 / 13 Digits</span>
                </label>
                <input
                  type="text"
                  value={marcForm.isbn}
                  onChange={e => setMarcForm({ ...marcForm, isbn: e.target.value })}
                  placeholder="e.g. 978-0132354165"
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Library Scheme Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#a1a1aa] font-mono text-[11px]">Classification Scheme *</label>
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
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
                >
                  {schemes.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#121214] text-[#fafafa]">
                      {s.name} (MARC {s.marcTag})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#a1a1aa] font-mono text-[11px]">
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
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-blue-500 font-mono font-semibold text-blue-400"
                />
                {marcForm.title && (
                  <div className="mt-1 flex items-center space-x-1.5 text-[10px] text-zinc-400">
                    <Globe className="h-3 w-3 text-emerald-400" />
                    <span>
                      Script: <strong className="text-zinc-300">{detectTextScript(marcForm.title).script}</strong> • Subject: <strong className="text-emerald-400">{generateCallNumberForTitle(marcForm.title, marcForm.authors, marcForm.department, marcForm.schemeId, schemes).detectedSubject}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#a1a1aa] mb-1 font-mono text-[11px] flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span>245 Tag - Book Title (Multilingual / Unicode) *</span>
                    <button
                      type="button"
                      onClick={() => handleToggleVoiceInput('title')}
                      className={`px-1.5 py-0.5 rounded text-[10px] flex items-center space-x-1 cursor-pointer transition-all ${
                        isListening && activeVoiceField === 'title'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800'
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
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] mb-1 font-mono text-[11px] flex items-center justify-between">
                  <span>100 Tag - Author(s) (Comma separated) *</span>
                  <button
                    type="button"
                    onClick={() => handleToggleVoiceInput('authors')}
                    className={`px-1.5 py-0.5 rounded text-[10px] flex items-center space-x-1 cursor-pointer transition-all ${
                      isListening && activeVoiceField === 'authors'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800'
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
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[#a1a1aa] mb-1 font-mono">Department *</label>
                <select
                  value={marcForm.department}
                  onChange={e => setMarcForm({ ...marcForm, department: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-blue-500 cursor-pointer"
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
                <label className="block text-[#a1a1aa] mb-1 font-mono">250 Tag - Edition</label>
                <input
                  type="text"
                  value={marcForm.edition}
                  onChange={e => setMarcForm({ ...marcForm, edition: e.target.value })}
                  placeholder="e.g. 3rd Edition"
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] mb-1 font-mono">260/264 Tag - Publisher</label>
                <input
                  type="text"
                  value={marcForm.publisherName}
                  onChange={e => setMarcForm({ ...marcForm, publisherName: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] mb-1 font-mono">Publication Year</label>
                <input
                  type="number"
                  value={marcForm.publisherYear}
                  onChange={e => setMarcForm({ ...marcForm, publisherYear: parseInt(e.target.value) || 2024 })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[#a1a1aa] mb-1 font-mono">300 Tag - Page Count</label>
                <input
                  type="number"
                  value={marcForm.pageCount}
                  onChange={e => setMarcForm({ ...marcForm, pageCount: parseInt(e.target.value) || 200 })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] mb-1 font-mono">Format / Binding</label>
                <select
                  value={marcForm.format}
                  onChange={e => setMarcForm({ ...marcForm, format: e.target.value as BookRecord['format'] })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="HARDCOVER">Hardcover</option>
                  <option value="PAPERBACK">Paperback</option>
                  <option value="DIGITAL">Digital / E-Book</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[#a1a1aa] font-mono text-xs">Total Physical Copies Count</label>
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
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-emerald-500 font-mono font-bold"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-zinc-500 font-mono">Quick Sets:</span>
                  {[1, 5, 10, 25, 50, 100, 500, 1000].map(qty => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setMarcForm({ ...marcForm, totalCopies: qty })}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold cursor-pointer transition-all ${
                        marcForm.totalCopies === qty
                          ? 'bg-emerald-600 text-white border border-emerald-400'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                      }`}
                    >
                      +{qty} {qty === 1 ? 'Copy' : 'Copies'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#a1a1aa] font-mono">650 Tag - Subjects / Keywords</label>
                  <button
                    type="button"
                    onClick={() => handleToggleVoiceInput('subjects')}
                    className={`px-1.5 py-0.5 rounded text-[10px] flex items-center space-x-1 cursor-pointer transition-all ${
                      isListening && activeVoiceField === 'subjects'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800'
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
                  onChange={e => setMarcForm({ ...marcForm, subjects: e.target.value })}
                  placeholder="e.g. Software Architecture, Design Patterns, Agile"
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] mb-1 font-mono">Cover Image URL / Base64</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={marcForm.coverUrl}
                    onChange={e => {
                      setMarcForm({ ...marcForm, coverUrl: e.target.value });
                      setImagePreviewUrl(e.target.value);
                    }}
                    placeholder="https://... or upload above"
                    className="flex-1 bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-blue-500 text-xs font-mono truncate"
                  />
                  {marcForm.coverUrl && (
                    <img src={marcForm.coverUrl} alt="Cover Thumbnail" className="w-8 h-8 rounded object-cover border border-zinc-700" />
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
                  : 'bg-[#121214] border-[#27272a]'
              }`}>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-semibold text-[#fafafa] text-xs">
                      520 Tag - Book Description & Abstract *
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">(Summary / Scope)</span>
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
                        className="text-[10px] text-zinc-500 hover:text-red-400 cursor-pointer"
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
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-[#fafafa] focus:outline-none focus:border-emerald-500 text-xs leading-relaxed font-sans resize-y"
                  />
                  {isListening && activeVoiceField === 'description' && (
                    <div className="absolute top-2 right-2 flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-500/90 text-white text-[10px] font-bold animate-pulse pointer-events-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping mr-1" />
                      <span>Recording Voice...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1 font-mono">
                  <span>MARC $a Summary note</span>
                  <span>{marcForm.description.length} chars • {marcForm.description.trim() ? marcForm.description.trim().split(/\s+/).length : 0} words</span>
                </div>
              </div>

              {/* 500 TAG - GENERAL NOTES & LOCAL HOLDINGS */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                isListening && activeVoiceField === 'generalNotes'
                  ? 'bg-emerald-950/20 border-emerald-500 ring-1 ring-emerald-500/40'
                  : 'bg-[#121214] border-[#27272a]'
              }`}>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-semibold text-[#fafafa] text-xs">
                      500 Tag - General Notes & Provenance *
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">(Local Notes)</span>
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
                        className="text-[10px] text-zinc-500 hover:text-red-400 cursor-pointer"
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
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-[#fafafa] focus:outline-none focus:border-emerald-500 text-xs leading-relaxed font-sans resize-y"
                  />
                  {isListening && activeVoiceField === 'generalNotes' && (
                    <div className="absolute top-2 right-2 flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-500/90 text-white text-[10px] font-bold animate-pulse pointer-events-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping mr-1" />
                      <span>Recording Voice...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1 font-mono">
                  <span>MARC $a General note</span>
                  <span>{marcForm.generalNotes.length} chars • {marcForm.generalNotes.trim() ? marcForm.generalNotes.trim().split(/\s+/).length : 0} words</span>
                </div>
              </div>
            </div>

            {/* Interactive MARC21 ISO 2709 Tags Preview */}
            {aiMarcPreview && aiMarcPreview.length > 0 && (
              <div className="p-4 rounded-xl bg-[#09090b] border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-zinc-300">
                    <FileCode className="h-4 w-4 text-blue-400" />
                    <span>MARC21 ISO 2709 Generated Tags Preview</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {aiMarcPreview.length} fields indexed
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {aiMarcPreview.map((tagObj: any, idx: number) => (
                    <div key={idx} className="p-2 rounded-lg bg-[#121214] border border-zinc-800/80 font-mono text-[11px] flex items-start space-x-2">
                      <span className="text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                        {String(tagObj.tag || '999')}
                      </span>
                      <span className="text-zinc-500">
                        [{String(tagObj.ind1 || '#')}{String(tagObj.ind2 || '#')}]
                      </span>
                      <span className="text-zinc-300 truncate flex-1" title={formatMarcSubfields(tagObj.subfields)}>
                        {formatMarcSubfields(tagObj.subfields)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Action Bar */}
            <div className="pt-4 border-t border-[#27272a] flex items-center justify-between flex-wrap gap-3">
              <div className="text-xs text-[#a1a1aa]">
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
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold cursor-pointer"
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
          <div className="p-5 rounded-2xl border border-[#27272a] bg-[#121214] space-y-4">
            <h3 className="text-sm font-bold text-[#fafafa] flex items-center space-x-2">
              <ArrowRightLeft className="h-4 w-4 text-amber-400" />
              <span>Initiate Inter-Library Copy Transfer</span>
            </h3>

            <form onSubmit={handleInitiateTransfer} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[#a1a1aa] mb-1">Book Copy Barcode</label>
                <input
                  type="text"
                  value={newTransferForm.copyBarcode}
                  onChange={e => setNewTransferForm({ ...newTransferForm, copyBarcode: e.target.value })}
                  placeholder="BAR88001"
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] mb-1">Source Branch</label>
                <select
                  value={newTransferForm.fromBranch}
                  onChange={e => setNewTransferForm({ ...newTransferForm, fromBranch: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] cursor-pointer"
                >
                  {(settings?.branches || ['Central Academic Library', 'Engineering & Tech Library', 'Medical & Health Sciences Library', 'Law & Humanities Library']).map(br => (
                    <option key={br} value={br}>{br}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#a1a1aa] mb-1">Destination Branch</label>
                <select
                  value={newTransferForm.toBranch}
                  onChange={e => setNewTransferForm({ ...newTransferForm, toBranch: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] cursor-pointer"
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

          <div className="rounded-2xl border border-[#27272a] bg-[#121214] overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#09090b] text-[#a1a1aa]">
                  <th className="p-3.5">Copy Barcode</th>
                  <th className="p-3.5">Book Title</th>
                  <th className="p-3.5">Source Branch</th>
                  <th className="p-3.5">Destination Branch</th>
                  <th className="p-3.5">Requested By</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {transfers.map(tr => (
                  <tr key={tr.id} className="hover:bg-[#18181b]/50">
                    <td className="p-3.5 font-mono text-blue-400">{tr.copyBarcode}</td>
                    <td className="p-3.5 font-bold text-[#fafafa]">{tr.bookTitle}</td>
                    <td className="p-3.5 text-[#a1a1aa]">{tr.fromBranch}</td>
                    <td className="p-3.5 text-amber-400 font-medium">{tr.toBranch}</td>
                    <td className="p-3.5 text-[#a1a1aa]">{tr.requestedBy}</td>
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
          <div className="p-5 rounded-2xl border border-[#27272a] bg-[#121214] space-y-4">
            <h3 className="text-sm font-bold text-[#fafafa] flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-purple-400" />
              <span>Process Fine Collection & Account Clearance</span>
            </h3>

            <form onSubmit={handleProcessFineClearance} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#a1a1aa] mb-1">Patron Code or Institutional Email *</label>
                <input
                  type="text"
                  required
                  placeholder="STU-2024-089 or rohan.s@student.aijaz-edu.org"
                  value={selectedPatronCode}
                  onChange={e => setSelectedPatronCode(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] mb-1">Fine Amount Collected (₹)</label>
                <input
                  type="number"
                  value={finePaymentAmount || 25}
                  onChange={e => setFinePaymentAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] font-mono focus:outline-none text-base font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] mb-1">Payment Channel</label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value as any)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] cursor-pointer"
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
          <div className="p-5 rounded-2xl border border-[#27272a] bg-[#121214] flex flex-col justify-between">
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

                <div className="text-center pt-3 border-t border-zinc-200 text-[10px] text-zinc-500">
                  Status: CLEARANCE VERIFIED • STAMP OK
                </div>

                <button
                  onClick={() => alert(`Printing Receipt ${lastReceipt.receiptNo}...`)}
                  className="w-full py-2 rounded-lg bg-zinc-900 text-white font-bold flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Receipt</span>
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#a1a1aa] space-y-2">
                <DollarSign className="h-10 w-10 text-zinc-600" />
                <p className="text-xs">No recent fine receipt generated yet.</p>
                <p className="text-[10px] text-[#71717a]">Select a patron and process clearance to view receipt preview.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: BARCODE & SPINE TAG DESK */}
      {activeTab === 'BARCODE_DESK' && (
        <div className="p-5 rounded-2xl border border-[#27272a] bg-[#121214] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#fafafa] flex items-center space-x-2">
              <QrCode className="h-4 w-4 text-indigo-400" />
              <span>Accession Barcode & Spine Tag Label Generator</span>
            </h3>
            <span className="text-xs text-[#a1a1aa]">Print labels for all catalogued book copies</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {books.map(b => {
              const bookCopies = getBookPhysicalCopies(b);
              return bookCopies.map((cp, idx) => (
                <div key={cp.id || `${b.id}_${idx}`} className="p-4 rounded-xl bg-[#09090b] border border-[#27272a] space-y-3 font-mono">
                  <div className="border-b border-[#27272a] pb-2 text-[10px] text-[#a1a1aa] flex justify-between">
                    <span>{b.callNumber}</span>
                    <span className="text-blue-400 font-bold">{cp.accessionNumber}</span>
                  </div>
                  <div className="text-xs font-bold text-[#fafafa] truncate">{b.title}</div>
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-[#27272a] rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#27272a] flex items-center justify-between bg-[#18181b]">
              <div className="flex items-center space-x-3">
                <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Copy className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[#fafafa] flex items-center space-x-2">
                    <span>Physical Copies & Accession Manager</span>
                  </h3>
                  <p className="text-[11px] text-[#a1a1aa] truncate max-w-md">
                    "{selectedBookForCopies.title}" (ISBN: {selectedBookForCopies.isbn})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookForCopies(null)}
                className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Read-Only Bibliographic Context Banner */}
            <div className="px-5 py-3 bg-[#09090b] border-b border-[#27272a] text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-zinc-300 font-mono text-[11px]">
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
            <div className="flex border-b border-[#27272a] bg-[#121214] px-5 pt-3 gap-2">
              <button
                onClick={() => setCopyModalTab('SINGLE')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                  copyModalTab === 'SINGLE'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-[#a1a1aa] hover:text-white'
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
                    : 'border-transparent text-[#a1a1aa] hover:text-white'
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
                    : 'border-transparent text-[#a1a1aa] hover:text-white'
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
                        <label className="text-[#fafafa] font-mono font-semibold">Accession Number *</label>
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
                        className="w-full bg-[#09090b] border border-purple-500/50 rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-purple-400 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[#fafafa] mb-1 font-mono font-semibold">Copy Designation *</label>
                      <input
                        type="text"
                        required
                        value={singleCopyForm.copyNumber}
                        onChange={e => setSingleCopyForm({ ...singleCopyForm, copyNumber: e.target.value })}
                        placeholder="e.g. C.2"
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#fafafa] mb-1 font-mono font-semibold">Shelf Location / Stack *</label>
                      <input
                        type="text"
                        required
                        value={singleCopyForm.shelfLocation}
                        onChange={e => setSingleCopyForm({ ...singleCopyForm, shelfLocation: e.target.value })}
                        placeholder="e.g. Stack CS-04-A"
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[#fafafa] mb-1 font-mono font-semibold">Library Branch *</label>
                      <select
                        value={singleCopyForm.branchLocation}
                        onChange={e => setSingleCopyForm({ ...singleCopyForm, branchLocation: e.target.value })}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] cursor-pointer"
                      >
                        {(settings?.branches || ['Central Academic Library', 'Engineering & Tech Library', 'Medical & Health Sciences Library', 'Law & Humanities Library']).map(br => (
                          <option key={br} value={br}>{br}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#a1a1aa] mb-1 font-mono">Barcode (Auto-Generated)</label>
                      <input
                        type="text"
                        value={singleCopyForm.barcode}
                        onChange={e => setSingleCopyForm({ ...singleCopyForm, barcode: e.target.value })}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none font-mono text-zinc-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[#a1a1aa] mb-1 font-mono">Initial Copy Status</label>
                      <select
                        value={singleCopyForm.status}
                        onChange={e => setSingleCopyForm({ ...singleCopyForm, status: e.target.value as BookCopy['status'] })}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] cursor-pointer"
                      >
                        <option value="AVAILABLE">AVAILABLE (On Shelf)</option>
                        <option value="REFERENCE_ONLY">REFERENCE ONLY (In-Library)</option>
                        <option value="RESERVED">RESERVED</option>
                        <option value="UNDER_REPAIR">UNDER REPAIR / BINDING</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#27272a] flex justify-end">
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
                        <label className="block text-[#fafafa] font-mono font-semibold text-xs">Copies to Add *</label>
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
                        className="w-full bg-[#09090b] border border-blue-500/50 rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none font-mono font-bold text-base"
                      />
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-zinc-500 font-mono">Presets:</span>
                        {[5, 10, 25, 50, 100, 250, 500, 1000].map(qty => (
                          <button
                            key={qty}
                            type="button"
                            onClick={() => setBatchCopyForm({ ...batchCopyForm, quantity: qty })}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold cursor-pointer transition-all ${
                              batchCopyForm.quantity === qty
                                ? 'bg-blue-600 text-white border border-blue-400'
                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                            }`}
                          >
                            +{qty}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#fafafa] mb-1 font-mono font-semibold">Accession Prefix</label>
                      <input
                        type="text"
                        required
                        value={batchCopyForm.prefix}
                        onChange={e => setBatchCopyForm({ ...batchCopyForm, prefix: e.target.value })}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[#fafafa] mb-1 font-mono font-semibold">Starting Number *</label>
                      <input
                        type="number"
                        required
                        value={batchCopyForm.startNumber}
                        onChange={e => setBatchCopyForm({ ...batchCopyForm, startNumber: parseInt(e.target.value) || 1000 })}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#fafafa] mb-1 font-mono font-semibold">Shelf Location / Stack</label>
                      <input
                        type="text"
                        required
                        value={batchCopyForm.shelfLocation}
                        onChange={e => setBatchCopyForm({ ...batchCopyForm, shelfLocation: e.target.value })}
                        placeholder="e.g. Stack CS-04-A"
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[#fafafa] mb-1 font-mono font-semibold">Library Branch</label>
                      <select
                        value={batchCopyForm.branchLocation}
                        onChange={e => setBatchCopyForm({ ...batchCopyForm, branchLocation: e.target.value })}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] cursor-pointer"
                      >
                        {(settings?.branches || ['Central Academic Library', 'Engineering & Tech Library', 'Medical & Health Sciences Library', 'Law & Humanities Library']).map(br => (
                          <option key={br} value={br}>{br}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Preview of Generated Accessions */}
                  <div className="p-3 bg-[#09090b] rounded-xl border border-[#27272a] space-y-1 font-mono text-[11px]">
                    <span className="text-[#a1a1aa]">Generated Sequence Preview:</span>
                    <div className="text-emerald-400 font-bold">
                      {batchCopyForm.prefix}{String(batchCopyForm.startNumber).padStart(4, '0')} →{' '}
                      {batchCopyForm.prefix}{String(batchCopyForm.startNumber + Math.max(1, batchCopyForm.quantity) - 1).padStart(4, '0')}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#27272a] flex justify-end">
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
                  <div className="rounded-xl border border-[#27272a] overflow-hidden bg-[#09090b]">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="border-b border-[#27272a] bg-[#18181b] text-[#a1a1aa]">
                          <th className="p-3">Accession No</th>
                          <th className="p-3">Barcode</th>
                          <th className="p-3">Branch & Stack</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#27272a]">
                        {getBookPhysicalCopies(selectedBookForCopies).map((cp, idx) => (
                          <tr key={cp.id || idx} className="hover:bg-[#121214]">
                            <td className="p-3 font-bold text-amber-400">{cp.accessionNumber}</td>
                            <td className="p-3 text-blue-400">{cp.barcode}</td>
                            <td className="p-3 text-[#a1a1aa] font-sans">
                              <div>{cp.branchLocation}</div>
                              <div className="text-[10px] text-zinc-500">{selectedBookForCopies.shelfLocation}</div>
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
            <div className="p-4 border-t border-[#27272a] bg-[#18181b] flex items-center justify-between">
              <div className="text-xs text-[#a1a1aa]">
                Total Registered: <strong>{getBookPhysicalCopies(selectedBookForCopies).length} Copies</strong>
              </div>
              <button
                onClick={() => setSelectedBookForCopies(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-[#fafafa] text-xs font-semibold cursor-pointer"
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
          <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="font-bold text-[#fafafa] text-sm flex items-center space-x-2">
                <FileCode className="h-4 w-4 text-blue-400" />
                <span>MARC21 Record Tag Inspection</span>
              </h3>
              <button onClick={() => setSelectedBookForMarc(null)} className="text-[#a1a1aa] hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-2 bg-[#09090b] p-3 rounded-xl border border-[#27272a] text-[11px]">
              <div className="text-blue-400"><strong className="text-[#a1a1aa]">000 Leader:</strong> 00000nam a2200000 u 4500</div>
              <div className="text-[#fafafa]"><strong className="text-[#a1a1aa]">020 ISBN:</strong> {selectedBookForMarc.isbn}</div>
              <div className="text-emerald-400"><strong className="text-[#a1a1aa]">082 Dewey Call:</strong> {selectedBookForMarc.callNumber}</div>
              <div className="text-amber-400 font-bold"><strong className="text-[#a1a1aa]">090 Accession No:</strong> {selectedBookForMarc.accessionNumber || 'ACC-88001'}</div>
              <div className="text-emerald-300 font-bold"><strong className="text-[#a1a1aa]">852 $t Copy No:</strong> {selectedBookForMarc.copyNo || selectedBookForMarc.copyNumber || 'C.1'}</div>
              <div className="text-[#fafafa]"><strong className="text-[#a1a1aa]">100 Main Author:</strong> {selectedBookForMarc.authors.join(', ')}</div>
              <div className="text-amber-300"><strong className="text-[#a1a1aa]">245 Title Tag:</strong> {selectedBookForMarc.title}</div>
              <div className="text-[#fafafa]"><strong className="text-[#a1a1aa]">260 Publisher:</strong> {selectedBookForMarc.publisherName}, {selectedBookForMarc.publisherYear}</div>
              <div className="text-[#fafafa]"><strong className="text-[#a1a1aa]">300 Physical:</strong> {selectedBookForMarc.pageCount} Pages</div>
              <div className="text-[#a1a1aa]"><strong className="text-[#a1a1aa]">650 Subjects:</strong> {selectedBookForMarc.subjects.join(', ')}</div>
              {(selectedBookForMarc.description || selectedBookForMarc.marcTags?.['520']) && (
                <div className="text-cyan-300"><strong className="text-[#a1a1aa]">520 Summary / Scope:</strong> {selectedBookForMarc.description || selectedBookForMarc.marcTags?.['520']}</div>
              )}
              {(selectedBookForMarc.generalNotes || selectedBookForMarc.notes || selectedBookForMarc.marcTags?.['500']) && (
                <div className="text-emerald-300"><strong className="text-[#a1a1aa]">500 General Notes:</strong> {selectedBookForMarc.generalNotes || selectedBookForMarc.notes || selectedBookForMarc.marcTags?.['500']}</div>
              )}
              <div className="text-emerald-300"><strong className="text-[#a1a1aa]">852 $c Location:</strong> {selectedBookForMarc.shelfLocation || 'Stack CS-01-A'}</div>
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
                  className="px-4 py-1.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] cursor-pointer"
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
          <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="font-bold text-[#fafafa] text-sm flex items-center space-x-2">
                <Tag className="h-4 w-4 text-emerald-400" />
                <span>Add Custom Library Classification Scheme</span>
              </h3>
              <button
                onClick={() => setIsAddSchemeModalOpen(false)}
                className="text-[#a1a1aa] hover:text-white cursor-pointer"
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
                <label className="block text-[#a1a1aa] mb-1 font-medium">Scheme Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Higher Education Commission (HEC) PK Scheme"
                  value={newSchemeForm.name}
                  onChange={e => setNewSchemeForm({ ...newSchemeForm, name: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a1a1aa] mb-1 font-medium">Scheme Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="hec-pk"
                    value={newSchemeForm.code}
                    onChange={e => setNewSchemeForm({ ...newSchemeForm, code: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#a1a1aa] mb-1 font-medium">MARC Tag *</label>
                  <select
                    value={newSchemeForm.marcTag}
                    onChange={e => setNewSchemeForm({ ...newSchemeForm, marcTag: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-emerald-500 cursor-pointer font-mono"
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
                <label className="block text-[#a1a1aa] mb-1 font-medium">Notation Prefix / Symbol</label>
                <input
                  type="text"
                  placeholder="e.g. HEC-PK or ISL"
                  value={newSchemeForm.prefix}
                  onChange={e => setNewSchemeForm({ ...newSchemeForm, prefix: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] mb-1 font-medium">Scheme Description & Notes</label>
                <textarea
                  rows={2}
                  placeholder="Describe classification rules, scope, or institutional policies..."
                  value={newSchemeForm.description}
                  onChange={e => setNewSchemeForm({ ...newSchemeForm, description: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-[#fafafa] focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSchemeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-red-500/40 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl shadow-red-950/40">
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
                className="text-[#a1a1aa] hover:text-white cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Impact Summary Card */}
            <div className="p-4 rounded-xl bg-[#09090b] border border-zinc-800 space-y-2.5 text-xs">
              <div className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                Records targeted for permanent deletion:
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
                  <div className="text-zinc-400 text-[11px]">MARC21 Book Titles</div>
                  <div className="text-xl font-bold text-red-400 font-mono mt-0.5">{books.length} Records</div>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
                  <div className="text-zinc-400 text-[11px]">Physical Copy Holdings</div>
                  <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">
                    {copies.length > 0 ? `${copies.length} Copies` : 'All Linked Copies'}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 pt-1">
                All associated MARC tags, Dewey call numbers, accession codes, barcoding records, and shelf assignments will be cleared.
              </p>
            </div>

            {/* Confirmation Field */}
            <div className="space-y-2">
              <label className="block text-xs text-zinc-300 font-medium">
                To confirm permanent deletion, please type <span className="font-mono font-bold text-red-400">DELETE ALL</span> below:
              </label>
              <input
                type="text"
                value={deleteAllConfirmInput}
                onChange={e => setDeleteAllConfirmInput(e.target.value)}
                placeholder="Type DELETE ALL to confirm"
                className="w-full bg-[#09090b] border border-red-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono placeholder:text-zinc-600"
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
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer transition-all"
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
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-60'
                }`}
              >
                <Trash2 className="h-4 w-4" />
                <span>Permanently Delete All Books</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
