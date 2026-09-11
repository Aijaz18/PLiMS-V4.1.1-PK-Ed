import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  Mic,
  MicOff,
  Radio,
  Volume2,
  VolumeX,
  RotateCcw,
  BookOpen,
  Filter,
  UserCheck,
  Building2,
  Tag,
  Search,
  MessageSquare,
  Globe,
  Settings,
  ShieldCheck,
  Check,
  Bookmark,
  ChevronRight,
  HelpCircle,
  FileText,
  BarChart2,
  AlertTriangle,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { BookRecord, UserProfile, CirculationTransaction, DigitalAsset } from '../../types/alims';
import { askGeminiCopilot } from '../../services/geminiService';
import { ChatMessage, AssistantConfig, LanguageCode } from './types';
import { BookCard } from './BookCard';
import { BookDetailsModal } from './BookDetailsModal';
import { ReservationDialog } from './ReservationDialog';
import { AdvancedSearchModal, AdvancedSearchFilters } from './AdvancedSearchModal';
import { AccountSummaryCard } from './AccountSummaryCard';
import { AdminConfigModal } from './AdminConfigModal';
import { QuickActions } from './QuickActions';
import { useChatSessionState } from './useChatSessionState';
import { IssuedLoanCard } from './IssuedLoanCard';
import { MemberSelectionCard } from './MemberSelectionCard';

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface PLiMSAssistantProps {
  mode?: 'FLOATING' | 'EMBEDDED';
  books?: BookRecord[];
  users?: UserProfile[];
  transactions?: CirculationTransaction[];
  branches?: string[];
  currentUser?: UserProfile;
  onNavigateTab?: (tab: string) => void;
  onIssueBook?: (bookIdentifier: string, memberIdentifier: string) => Promise<{ success?: boolean; transaction?: CirculationTransaction; error?: string; isOffline?: boolean }>;
  onReturnBook?: (identifier: string) => Promise<{ success?: boolean; error?: string }>;
}

const DEFAULT_CONFIG: AssistantConfig = {
  assistantName: 'PLiMS AI Assistant',
  subtitle: 'Your Intelligent Library Assistant',
  welcomeMessage: '👋 Welcome to PLiMS AI Assistant!\nI can help you find books, check availability, reserve items, renew loans, find digital resources, check your account, and answer library-related questions.\nHow can I help you today?',
  operatingHours: '08:00 AM - 10:00 PM (Mon-Sat)',
  contactEmail: 'library@plims.edu.pk',
  contactPhone: '+92 51 9265432',
  supportedLanguages: ['en', 'ur', 'roman_ur'],
  faqDatabase: [
    {
      question: 'What are the library operating hours?',
      answer: 'Main Library & Campus Branches operate Monday through Saturday from 08:00 AM to 10:00 PM. Digital Repository is available 24/7.',
      category: 'GENERAL'
    },
    {
      question: 'How many books can I borrow and for how long?',
      answer: 'Students can borrow up to 5 books for 14 days. Faculty members can borrow up to 15 books for 30 days.',
      category: 'CIRCULATION'
    },
    {
      question: 'What is the overdue fine rate?',
      answer: 'Overdue fine is PKR 5.00 per day per book after a 2-day grace period. Fines can be paid online or at the circulation desk.',
      category: 'FINES'
    },
    {
      question: 'How do I place a book reservation?',
      answer: 'Search for any book in PLiMS AI Assistant or OPAC and click "Reserve" or "Place Hold". Held items remain at the desk for 48 hours.',
      category: 'HOLDS'
    }
  ],
  analytics: {
    totalConversations: 1420,
    searchesExecuted: 3890,
    reservationsPlaced: 412,
    renewalsProcessed: 680,
    userSatisfactionPct: 98.4,
    topSearchTerms: [
      { term: 'Artificial Intelligence', count: 320 },
      { term: 'Data Structures', count: 210 },
      { term: 'Pakistani History', count: 180 },
      { term: 'Medical Physiology', count: 145 },
      { term: 'Law & Constitution', count: 110 }
    ],
    languageBreakdown: { en: 65, ur: 20, roman_ur: 15 }
  }
};

export const PLiMSAssistant: React.FC<PLiMSAssistantProps> = ({
  mode = 'FLOATING',
  books = [],
  users = [],
  transactions = [],
  branches = ['Central Campus Library (Islamabad)', 'Engineering Campus Library (Lahore)', 'Medical Sciences Library (Karachi)'],
  currentUser,
  onNavigateTab,
  onIssueBook,
  onReturnBook
}) => {
  const [isOpen, setIsOpen] = useState(mode === 'EMBEDDED');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [config, setConfig] = useState<AssistantConfig>(DEFAULT_CONFIG);

  // Hook tracking arrival time, visit count, and session state
  const { session, isReturningUser, formattedLastVisit, getPersonalizedWelcome } = useChatSessionState(currentUser);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init_msg',
      sender: 'assistant',
      text: getPersonalizedWelcome(DEFAULT_CONFIG.welcomeMessage),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: 'en'
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const lastSpokenQueryRef = useRef<string>('');

  // Modals state
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<BookRecord | null>(null);
  const [selectedBookForReservation, setSelectedBookForReservation] = useState<BookRecord | null>(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat
  useEffect(() => {
    if (isOpen && !isMinimized) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen, isMinimized, isListening]);

  // Clean up speech recognition
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Text-to-Speech synthesizer (Web Speech API)
  const speakText = (text: string, force = false) => {
    if ((isMuted && !force) || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Clean up markdown markers before speaking
      const cleanUtterance = text
        .replace(/[*#`_~[\]()]/g, ' ')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanUtterance) return;
      const utterance = new SpeechSynthesisUtterance(cleanUtterance);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = language === 'ur' ? 'ur-PK' : 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
    }
  };

  // Toggle Microphone Voice Search & Voice Commands (Web Speech API)
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or type your query.');
      setTimeout(() => setSpeechError(null), 5000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      setIsListening(false);
      setInterimTranscript('');

      // If user had spoken something before stopping, process it
      if (lastSpokenQueryRef.current.trim()) {
        const spoken = lastSpokenQueryRef.current.trim();
        lastSpokenQueryRef.current = '';
        handleSendMessage(spoken, true);
      }
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'ur' ? 'ur-PK' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
        lastSpokenQueryRef.current = '';
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalStr += item[0].transcript;
          } else {
            interimStr += item[0].transcript;
          }
        }
        const currentSpoken = finalStr || interimStr;
        if (currentSpoken) {
          lastSpokenQueryRef.current = currentSpoken;
          setInterimTranscript(interimStr || finalStr);
          setInputQuery(currentSpoken);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setInterimTranscript('');
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          setSpeechError('No speech detected. Please speak clearly into your microphone.');
        } else {
          setSpeechError(`Voice error: ${event.error}`);
        }
        setTimeout(() => setSpeechError(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
        const spoken = lastSpokenQueryRef.current.trim();
        if (spoken) {
          lastSpokenQueryRef.current = '';
          setInterimTranscript('');
          handleSendMessage(spoken, true);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
      setInterimTranscript('');
      setSpeechError('Could not initialize microphone recognition.');
      setTimeout(() => setSpeechError(null), 4000);
    }
  };

  // Toggle Favorites
  const toggleFavorite = (bookId: string) => {
    setFavorites(prev =>
      prev.includes(bookId) ? prev.filter(id => id !== bookId) : [...prev, bookId]
    );
  };

  // Helper to prompt issue for a specific book
  const handlePromptIssueForBook = (book: BookRecord) => {
    const assistantMsg: ChatMessage = {
      id: `ast_${Date.now()}`,
      sender: 'assistant',
      text: `Select or speak the patron to issue **"${book.title}"** (Call No: ${book.callNumber}):`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionType: 'MEMBER_SELECTION_PROMPT',
      actionData: { book }
    };
    setMessages(prev => [...prev, assistantMsg]);
    speakText(`Who would you like to issue ${book.title} to?`);
  };

  // Helper to issue selected book to selected member
  const handleIssueSelectedBook = async (book: BookRecord, member: UserProfile) => {
    const userVoiceSim: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: `Issue "${book.title}" to ${member.name}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVoiceCommand: true
    };
    setMessages(prev => [...prev, userVoiceSim]);
    setIsTyping(true);

    if (onIssueBook) {
      const issueRes = await onIssueBook(book.id || book.callNumber, member.id || member.memberCode);
      setIsTyping(false);
      if (issueRes.success) {
        const dueDate = issueRes.transaction?.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
        const successText = `✅ **Book Issued Successfully!**\n- **Resource:** ${book.title}\n- **Patron:** ${member.name} (${member.memberCode || member.id})\n- **Due Date:** ${dueDate} (14 days loan period)`;
        const replyMsg: ChatMessage = {
          id: `ast_${Date.now()}`,
          sender: 'assistant',
          text: successText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType: 'BOOK_ISSUED',
          actionData: {
            book,
            member,
            transaction: issueRes.transaction,
            dueDate,
            issueDate: new Date().toISOString().split('T')[0],
            isOffline: issueRes.isOffline
          }
        };
        setMessages(prev => [...prev, replyMsg]);
        speakText(`Successfully issued ${book.title} to ${member.name}. Due date is ${dueDate}.`, true);
      } else {
        const errorText = `⚠️ **Issue Failed:** ${issueRes.error || 'Could not issue item. Please check library privileges.'}`;
        const replyMsg: ChatMessage = {
          id: `ast_${Date.now()}`,
          sender: 'assistant',
          text: errorText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, replyMsg]);
        speakText(`Issue failed: ${issueRes.error || 'Please check patron eligibility.'}`, true);
      }
    } else {
      setIsTyping(false);
      const offlineDueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
      const replyMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        sender: 'assistant',
        text: `✅ **Book Issued Successfully!**\n- **Resource:** ${book.title}\n- **Patron:** ${member.name} (${member.memberCode || member.id})\n- **Due Date:** ${offlineDueDate}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType: 'BOOK_ISSUED',
        actionData: {
          book,
          member,
          dueDate: offlineDueDate,
          issueDate: new Date().toISOString().split('T')[0]
        }
      };
      setMessages(prev => [...prev, replyMsg]);
      speakText(`Successfully issued ${book.title} to ${member.name}.`, true);
    }
  };

  // Process User / Voice Query
  const handleSendMessage = async (textToSend?: string, wasSpokenVoice = false) => {
    const query = (textToSend || inputQuery || '').trim();
    if (!query || isTyping) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
      setInterimTranscript('');
    }

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language,
      isVoiceCommand: wasSpokenVoice
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setInterimTranscript('');
    setIsTyping(true);

    const lower = query.toLowerCase().trim();

    // Intent Router
    let replyText = '';
    let matchedBooks: BookRecord[] | undefined = undefined;
    let actionType: ChatMessage['actionType'] = undefined;
    let actionData: any = undefined;

    // --- 1. VOICE COMMAND: CIRCULATION ISSUE ---
    // Patterns: "issue [book] to [member]", "check out [book] to [member]", "issue book [book] to [member]"
    const issueToMatch = lower.match(/^(?:please\s+)?(?:issue|check\s*out|checkout|lend)(?:\s+the)?(?:\s+book|\s+copy)?\s+(.+?)\s+(?:to|for)\s+(?:the\s+)?(?:member|patron|student|user)?\s*(.+)$/i);
    const issueInvertedMatch = lower.match(/^(?:please\s+)?(?:issue|check\s*out|checkout|lend)\s+(?:to|for)\s+(?:member|patron|student|user)?\s*(.+?)\s+(?:the\s+book|book|copy)?\s+(.+)$/i);
    const issueUrduMatch = lower.match(/(.+?)\s+(?:ko\s+)?(.+?)\s+ko\s+issue\s+kar/i);

    if (issueToMatch || issueInvertedMatch || issueUrduMatch) {
      const bookQuery = issueToMatch ? issueToMatch[1].trim() : (issueInvertedMatch ? issueInvertedMatch[2].trim() : issueUrduMatch![1].trim());
      const memberQuery = issueToMatch ? issueToMatch[2].trim() : (issueInvertedMatch ? issueInvertedMatch[1].trim() : issueUrduMatch![2].trim());

      if (onIssueBook) {
        const issueResult = await onIssueBook(bookQuery, memberQuery);
        if (issueResult.success) {
          const matchedBook = books.find(b =>
            b.id.toLowerCase() === bookQuery.toLowerCase() ||
            b.title.toLowerCase().includes(bookQuery.toLowerCase()) ||
            b.callNumber.toLowerCase().includes(bookQuery.toLowerCase()) ||
            (b.isbn && b.isbn.replace(/[- ]/g, '').includes(bookQuery.replace(/[- ]/g, '')))
          ) || ({
            id: issueResult.transaction?.accessionNumber || 'BK-NEW',
            isbn: '978-0-00-000000-0',
            title: issueResult.transaction?.bookTitle || bookQuery,
            authors: ['Library Collection'],
            callNumber: issueResult.transaction?.accessionNumber || 'DDC-001',
            department: 'Main Collection',
            edition: '1st',
            publisherName: 'PLiMS Press',
            publisherLocation: 'Islamabad',
            publisherYear: 2024,
            pageCount: 300,
            availableCopies: 1,
            totalCopies: 1,
            shelfLocation: 'Stack-1',
            subjects: ['General Collection'],
            coverUrl: '',
            format: 'HARDCOVER'
          } as unknown as BookRecord);

          const matchedMember = users.find(u =>
            u.id.toLowerCase() === memberQuery.toLowerCase() ||
            (u.memberCode && u.memberCode.toLowerCase() === memberQuery.toLowerCase()) ||
            u.name.toLowerCase().includes(memberQuery.toLowerCase())
          ) || ({
            id: issueResult.transaction?.memberId || 'MEM-001',
            name: issueResult.transaction?.memberName || memberQuery,
            memberCode: issueResult.transaction?.memberCode || memberQuery,
            email: 'patron@plims.edu.pk',
            role: 'PATRON',
            department: 'Circulation',
            status: 'ACTIVE',
            maxBorrowLimit: 5,
            finePending: 0
          } as unknown as UserProfile);

          const dueDate = issueResult.transaction?.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
          replyText = `✅ **Book Issued Successfully via Voice Command!**\n- **Title:** ${matchedBook.title}\n- **Borrower:** ${matchedMember.name} (${matchedMember.memberCode || matchedMember.id})\n- **Due Date:** ${dueDate} (14 days loan period)`;
          actionType = 'BOOK_ISSUED';
          actionData = {
            book: matchedBook,
            member: matchedMember,
            transaction: issueResult.transaction,
            dueDate,
            issueDate: new Date().toISOString().split('T')[0],
            isOffline: issueResult.isOffline
          };
          speakText(`Successfully issued ${matchedBook.title} to ${matchedMember.name}. Due date is ${dueDate}.`, true);
        } else {
          replyText = `⚠️ **Could not issue book via voice command:**\n${issueResult.error || 'Please verify that the book is in stock and the patron account is active.'}`;
          speakText(`Could not issue book: ${issueResult.error || 'Please check patron and book details.'}`, true);
        }
      } else {
        replyText = `⚠️ Circulation issue service is not connected in this mode.`;
      }
    }
    // --- 2. VOICE COMMAND: SINGLE PARAMETER "ISSUE [BOOK]" ---
    else if (lower.startsWith('issue ') || lower.startsWith('check out ') || lower.startsWith('checkout ')) {
      const bookSearchParam = lower.replace(/^(?:issue|check\s*out|checkout|lend)(?:\s+book|\s+the\s+book)?\s+/i, '').trim();
      const foundBook = books.find(b =>
        b.title.toLowerCase().includes(bookSearchParam) ||
        b.callNumber.toLowerCase().includes(bookSearchParam) ||
        b.id.toLowerCase() === bookSearchParam ||
        (b.isbn && b.isbn.replace(/[- ]/g, '').includes(bookSearchParam.replace(/[- ]/g, '')))
      );

      if (foundBook) {
        replyText = `Found book **"${foundBook.title}"** (${foundBook.availableCopies > 0 ? `${foundBook.availableCopies} available` : 'checked out'}).\nWho would you like to issue this book to? Please speak the patron name or select from list:`;
        actionType = 'MEMBER_SELECTION_PROMPT';
        actionData = { book: foundBook };
        speakText(`Found ${foundBook.title}. Who should I issue this book to?`, true);
      } else {
        // Fall back to general search
        matchedBooks = books.filter(b => b.title.toLowerCase().includes(bookSearchParam));
        replyText = `I couldn't pinpoint a single book for "${bookSearchParam}". Here are matching records:`;
        actionType = 'SEARCH';
        speakText(`Here are records matching ${bookSearchParam}.`);
      }
    }
    // --- 3. VOICE COMMAND: RETURN BOOK ---
    // Patterns: "return [book]", "return book [barcode]", "check in [barcode]"
    else if (lower.match(/^(?:please\s+)?(?:return|check\s*in|checkin|receive)(?:\s+the)?(?:\s+book|\s+copy)?\s+(.+)$/i)) {
      const returnMatch = lower.match(/^(?:please\s+)?(?:return|check\s*in|checkin|receive)(?:\s+the)?(?:\s+book|\s+copy)?\s+(.+)$/i);
      const itemParam = returnMatch ? returnMatch[1].trim() : '';

      if (onReturnBook) {
        const returnRes = await onReturnBook(itemParam);
        if (returnRes.success) {
          replyText = `✅ **Book Returned Successfully!**\n- **Item:** ${itemParam}\n- **Return Date:** ${new Date().toISOString().split('T')[0]}\n- **Status:** Returned to active library shelves.`;
          actionType = 'BOOK_RETURNED';
          actionData = { identifier: itemParam, returnDate: new Date().toISOString().split('T')[0] };
          speakText(`Book has been returned and checked in successfully.`, true);
        } else {
          replyText = `⚠️ **Could not complete return:** ${returnRes.error || 'No active loan found for this item.'}`;
          speakText(`Could not return book: ${returnRes.error || 'Item not found in active loans.'}`, true);
        }
      } else {
        replyText = `✅ **Book Return Recorded:** ${itemParam} has been marked returned.`;
        speakText(`Book return recorded.`);
      }
    }
    // --- 4. VOICE COMMAND: SEARCH RECORDS ---
    // Triggers: "search for [x]", "search records for [x]", "find books about [x]", "find [x]", "look up [x]"
    else if (lower.match(/^(?:please\s+)?(?:search(?:\s+for|\s+records\s+for|\s+books\s+for|\s+catalog\s+for)?|find(?:\s+books\s+about|\s+records\s+for|\s+information\s+about)?|look\s+up|show\s+me\s+books\s+on|show\s+records\s+for)\s+(.+)$/i)) {
      const searchMatch = lower.match(/^(?:please\s+)?(?:search(?:\s+for|\s+records\s+for|\s+books\s+for|\s+catalog\s+for)?|find(?:\s+books\s+about|\s+records\s+for|\s+information\s+about)?|look\s+up|show\s+me\s+books\s+on|show\s+records\s+for)\s+(.+)$/i);
      const searchPhrase = searchMatch ? searchMatch[1].trim() : lower;
      const cleanTerm = searchPhrase.toLowerCase();
      const isbnTerm = cleanTerm.replace(/[- ]/g, '');

      const searchHits = books.filter(b =>
        b.title.toLowerCase().includes(cleanTerm) ||
        b.authors.some(a => a.toLowerCase().includes(cleanTerm)) ||
        b.subjects.some(s => s.toLowerCase().includes(cleanTerm)) ||
        b.callNumber.toLowerCase().includes(cleanTerm) ||
        (b.isbn && b.isbn.replace(/[- ]/g, '').includes(isbnTerm)) ||
        b.department.toLowerCase().includes(cleanTerm) ||
        (b.publisherName && b.publisherName.toLowerCase().includes(cleanTerm))
      );

      if (searchHits.length > 0) {
        matchedBooks = searchHits;
        replyText = `📚 **Found ${searchHits.length} bibliographic record${searchHits.length > 1 ? 's' : ''} matching "${searchPhrase}":**\n*Librarian tip: Speak "Issue [Book] to [Member]" or click Issue on any card.*`;
        actionType = 'SEARCH';
        speakText(`Found ${searchHits.length} ${searchHits.length === 1 ? 'record' : 'records'} matching ${searchPhrase}.`, true);
      } else {
        // AI Fallback
        const aiResponse = await askGeminiCopilot(
          query,
          messages.slice(-4).map(m => ({ sender: m.sender === 'user' ? 'user' : 'ai', text: m.text }))
        );
        replyText = `🔍 No exact matches in local collection for "${searchPhrase}".\n\n${aiResponse}`;
        matchedBooks = books.slice(0, 3);
        speakText(`No exact catalog records found for ${searchPhrase}. Here are suggested titles.`, true);
      }
    }
    // --- 5. LOANS & ACCOUNT ---
    else if (lower.includes('loan') || lower.includes('borrow') || lower.includes('my book') || lower.includes('account')) {
      replyText = language === 'ur'
        ? 'Aap kay maujooda borrowed books aur due dates yahan hain:'
        : 'Here is your active PLiMS library account loan summary and pending fines:';
      actionType = 'ACCOUNT_VIEW';
      speakText('Here is the circulation loan summary.');
    } else if (lower.includes('renew') || lower.includes('extend')) {
      replyText = 'Here are your items eligible for renewal. Please click "Renew" to extend loan periods:';
      actionType = 'RENEWAL_PROMPT';
      speakText('Here are your items eligible for renewal.');
    } else if (lower.includes('recommend') || lower.includes('similar') || lower.includes('suggest')) {
      matchedBooks = books.slice(0, 4);
      replyText = language === 'ur'
        ? 'Aap ke liye PLiMS catalog se tajweez kardah sabaq-aamooz kutub:'
        : `💡 Based on your search trends and PLiMS catalog holdings, here are recommended titles:`;
      actionType = 'RECOMMENDATIONS';
      speakText('Here are recommended titles from the catalog.');
    } else if (lower.includes('digital') || lower.includes('pdf') || lower.includes('e-book') || lower.includes('journal')) {
      replyText = '📰 Found digital repository e-books and research publications available for direct reading:';
      actionType = 'DIGITAL_ASSETS';
      speakText('Found digital repository resources.');
    } else if (lower.includes('hour') || lower.includes('time') || lower.includes('open') || lower.includes('fine') || lower.includes('rule')) {
      replyText = `📚 **PLiMS Library Operating Hours & Policies:**\n- **Operating Hours:** ${config.operatingHours}\n- **Student Borrow Limit:** Up to 5 books for 14 days.\n- **Faculty Borrow Limit:** Up to 15 books for 30 days.\n- **Overdue Fine:** PKR 5.00/day after 2-day grace period.`;
      actionType = 'FAQ';
      speakText(`Library operating hours are ${config.operatingHours}.`);
    } else {
      // General search query
      const searchHits = books.filter(b =>
        b.title.toLowerCase().includes(lower) ||
        b.authors.some(a => a.toLowerCase().includes(lower)) ||
        b.subjects.some(s => s.toLowerCase().includes(lower)) ||
        b.callNumber.toLowerCase().includes(lower) ||
        (b.isbn && b.isbn.replace(/[- ]/g, '').includes(lower.replace(/[- ]/g, ''))) ||
        b.department.toLowerCase().includes(lower)
      );

      if (searchHits.length > 0) {
        matchedBooks = searchHits;
        replyText = language === 'ur'
          ? `Muzaiyya: PLiMS catalog mein ${searchHits.length} kutub daryaft huin:`
          : `📚 I found ${searchHits.length} resource${searchHits.length > 1 ? 's' : ''} matching "${query}":`;
        actionType = 'SEARCH';
        speakText(`Found ${searchHits.length} resources matching ${query}.`, wasSpokenVoice);
      } else {
        const aiResponse = await askGeminiCopilot(
          query,
          messages.slice(-4).map(m => ({ sender: m.sender === 'user' ? 'user' : 'ai', text: m.text }))
        );
        replyText = aiResponse;
        if (!aiResponse.includes('MARC21')) {
          matchedBooks = books.slice(0, 3);
        }
        speakText(replyText, wasSpokenVoice);
      }
    }

    setIsTyping(false);

    const assistantMsg: ChatMessage = {
      id: `ast_${Date.now()}`,
      sender: 'assistant',
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language,
      suggestedBooks: matchedBooks,
      actionType,
      actionData
    };

    setMessages(prev => [...prev, assistantMsg]);
  };

  // Apply Advanced Search Filters
  const handleApplyAdvancedFilters = (filters: AdvancedSearchFilters) => {
    setShowAdvancedSearch(false);
    let results = [...books];

    if (filters.query) {
      const q = filters.query.toLowerCase();
      results = results.filter(b => b.title.toLowerCase().includes(q) || b.subjects.some(s => s.toLowerCase().includes(q)));
    }
    if (filters.author) {
      const a = filters.author.toLowerCase();
      results = results.filter(b => b.authors.some(auth => auth.toLowerCase().includes(a)));
    }
    if (filters.subject) {
      const s = filters.subject.toLowerCase();
      results = results.filter(b => b.subjects.some(subj => subj.toLowerCase().includes(s)));
    }
    if (filters.availableOnly) {
      results = results.filter(b => b.availableCopies > 0);
    }
    if (filters.yearMin) {
      results = results.filter(b => (b.publisherYear || 2024) >= parseInt(filters.yearMin, 10));
    }

    const filterMsgText = `🔎 Advanced Filter Query returned ${results.length} item(s):`;
    const msg: ChatMessage = {
      id: `ast_${Date.now()}`,
      sender: 'assistant',
      text: filterMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedBooks: results.length > 0 ? results : undefined,
      actionType: 'SEARCH'
    };

    setMessages(prev => [...prev, msg]);
  };

  // Confirm Reservation
  const handleConfirmReservation = (book: BookRecord, reservationId: string) => {
    setSelectedBookForReservation(null);
    const confirmMsg: ChatMessage = {
      id: `ast_${Date.now()}`,
      sender: 'assistant',
      text: `✅ **Reservation Confirmed!**\n- **Title:** ${book.title}\n- **Reservation Reference ID:** \`${reservationId}\`\n- **Pickup Desk:** Main Campus Library Circulation Desk\n- **Status:** Held for 48 hours. Notification sent to your email.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionType: 'RESERVATION_PROMPT'
    };
    setMessages(prev => [...prev, confirmMsg]);
  };

  // Handle Quick Action Trigger
  const handleQuickAction = (key: string, promptText: string) => {
    if (key === 'ADVANCED_SEARCH') {
      setShowAdvancedSearch(true);
    } else {
      handleSendMessage(promptText);
    }
  };

  // Main UI Render Structure
  return (
    <>
      {/* Floating Launcher Button if FLOATING mode and closed */}
      {mode === 'FLOATING' && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-2xl shadow-blue-600/40 flex items-center space-x-2.5 transition-all duration-300 hover:scale-105 cursor-pointer border border-blue-400/30 group"
          title="Open PLiMS AI Assistant"
        >
          <div className="relative">
            <Sparkles className="h-6 w-6 text-white group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-blue-600 animate-ping"></span>
          </div>
          <span className="font-bold text-xs tracking-wide">PLiMS AI Assistant</span>
        </button>
      )}

      {/* Main Assistant Container Window */}
      {isOpen && (
        <div
          className={`${
            mode === 'FLOATING'
              ? 'fixed bottom-6 right-6 z-50 w-[420px] sm:w-[460px] h-[640px] rounded-2xl shadow-2xl border border-[#27272a] bg-[#121214] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300'
              : 'w-full h-[620px] rounded-2xl border border-[#27272a] bg-[#121214] flex flex-col overflow-hidden shadow-xl'
          }`}
        >
          {/* Header Bar */}
          <div className="p-3.5 bg-[#18181b] border-b border-[#27272a] flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-md flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white animate-pulse" />
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-[#fafafa]">{config.assistantName}</h3>
                  <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Online</span>
                  </span>
                  {isReturningUser && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[9px] font-bold" title={`Visit #${session.visitCount}${formattedLastVisit ? ` • Last visit: ${formattedLastVisit}` : ''}`}>
                      <span>Returning Patron (#{session.visitCount})</span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[#a1a1aa] font-mono">{config.subtitle}</p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center space-x-1">
              {/* Language Selector */}
              <div className="relative group">
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value as LanguageCode)}
                  className="bg-[#09090b] border border-[#27272a] rounded-lg px-2 py-1 text-[10px] font-bold text-[#fafafa] focus:outline-none cursor-pointer"
                >
                  <option value="en">EN English</option>
                  <option value="ur">اردو Urdu</option>
                  <option value="roman_ur">Roman Urdu</option>
                </select>
              </div>

              {/* Mute Toggle */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-lg border border-[#27272a] text-[#71717a] hover:text-[#fafafa] hover:bg-[#27272a] transition-all cursor-pointer"
                title={isMuted ? 'Unmute Audio Voice' : 'Mute Audio Voice'}
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-blue-400" />}
              </button>

              {/* Admin Desk Button */}
              <button
                onClick={() => setShowAdminModal(true)}
                className="p-1.5 rounded-lg border border-[#27272a] text-[#71717a] hover:text-[#fafafa] hover:bg-[#27272a] transition-all cursor-pointer"
                title="Librarian Admin Controls"
              >
                <Settings className="h-3.5 w-3.5 text-purple-400" />
              </button>

              {/* Minimize / Close */}
              {mode === 'FLOATING' && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg border border-[#27272a] text-[#71717a] hover:text-[#fafafa] hover:bg-[#27272a] transition-all cursor-pointer"
                  title="Close Assistant Window"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions Scroll Bar */}
          <div className="px-3 py-1.5 bg-[#09090b] border-b border-[#27272a] shrink-0 overflow-x-auto no-scrollbar">
            <QuickActions onSelectAction={handleQuickAction} />
          </div>

          {/* Chat Messages Log Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {/* Quick Voice Command Guide Header */}
            <div className="p-2 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-between text-[11px] text-zinc-300">
              <div className="flex items-center space-x-2 truncate">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0"></span>
                <span className="font-semibold text-white shrink-0">Voice Commands:</span>
                <span className="text-zinc-400 truncate">
                  &ldquo;Issue [Book] to [Member]&rdquo; • &ldquo;Search [Topic]&rdquo; • &ldquo;Return [Book]&rdquo;
                </span>
              </div>
              <button
                type="button"
                onClick={toggleListening}
                className="ml-2 px-2 py-0.5 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-[10px] font-bold shrink-0 transition-all cursor-pointer flex items-center space-x-1"
                title="Start Voice Recognition"
              >
                <Mic className="h-3 w-3 text-blue-400" />
                <span>Speak</span>
              </button>
            </div>

            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                {/* Sender badge & time */}
                <div className="flex items-center space-x-1.5 text-[10px] text-[#71717a] font-mono">
                  <span>{msg.sender === 'user' ? (currentUser?.name || 'You') : config.assistantName}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                  {msg.isVoiceCommand && (
                    <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[9px] font-semibold">
                      <Mic className="h-2.5 w-2.5" />
                      <span>Voice Command</span>
                    </span>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3.5 rounded-2xl max-w-[88%] text-xs leading-relaxed space-y-2 whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                      : 'bg-[#18181b] border border-[#27272a] text-[#fafafa] rounded-tl-none shadow'
                  }`}
                >
                  <div>{msg.text}</div>

                  {/* Issued Book Confirmation Card */}
                  {msg.actionType === 'BOOK_ISSUED' && msg.actionData && (
                    <IssuedLoanCard
                      book={msg.actionData.book}
                      member={msg.actionData.member}
                      transaction={msg.actionData.transaction}
                      dueDate={msg.actionData.dueDate}
                      issueDate={msg.actionData.issueDate}
                      isOffline={msg.actionData.isOffline}
                      onNavigateToCirculation={() => onNavigateTab && onNavigateTab('CIRCULATION')}
                    />
                  )}

                  {/* Member Selection Card for Incomplete Issue Command */}
                  {msg.actionType === 'MEMBER_SELECTION_PROMPT' && msg.actionData?.book && (
                    <MemberSelectionCard
                      book={msg.actionData.book}
                      users={users}
                      onSelectMember={selectedUser => handleIssueSelectedBook(msg.actionData.book, selectedUser)}
                    />
                  )}

                  {/* Account View Attachment */}
                  {msg.actionType === 'ACCOUNT_VIEW' && (
                    <AccountSummaryCard
                      currentUser={currentUser}
                      transactions={transactions}
                      onRenewTransaction={id => handleSendMessage(`Renew transaction ID ${id}`)}
                      onRenewAllEligible={() => handleSendMessage('Renew all eligible books now')}
                    />
                  )}

                  {/* Search Results Books Grid */}
                  {msg.suggestedBooks && msg.suggestedBooks.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        {msg.suggestedBooks.map(b => (
                          <BookCard
                            key={b.id}
                            book={b}
                            onSelectBook={setSelectedBookForDetails}
                            onReserveBook={setSelectedBookForReservation}
                            onToggleFavorite={toggleFavorite}
                            onIssueBook={b => handlePromptIssueForBook(b)}
                            isFavorite={favorites.includes(b.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Listening Active Voice Indicator */}
            {isListening && (
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-2 text-xs text-rose-200 shadow-lg animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-0.5">
                      <span className="w-1 h-3 bg-rose-400 rounded-full animate-bounce"></span>
                      <span className="w-1 h-5 bg-rose-400 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                      <span className="w-1 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                    </div>
                    <span className="font-bold text-white text-xs">Listening to your voice...</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleListening}
                    className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer transition-all shadow-sm"
                  >
                    Done Speaking
                  </button>
                </div>
                <div className="p-2 rounded-lg bg-black/50 border border-rose-500/20 font-mono text-[11px] text-rose-100 min-h-[32px] flex items-center">
                  {interimTranscript ? (
                    <span>&ldquo;{interimTranscript}&rdquo;</span>
                  ) : (
                    <span className="text-rose-300/60 italic">
                      Speak a command (e.g. &ldquo;Issue Clean Code to Sarah&rdquo; or &ldquo;Search Artificial Intelligence&rdquo;)...
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center space-x-2 text-xs text-[#a1a1aa] bg-[#18181b] p-3 rounded-2xl w-fit border border-[#27272a]">
                <Sparkles className="h-4 w-4 text-purple-400 animate-spin" />
                <span>PLiMS Copilot is searching library database...</span>
              </div>
            )}

            {/* Voice Error Notification */}
            {speechError && (
              <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl font-mono">
                ⚠️ {speechError}
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Footer Input Controls */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#18181b] border-t border-[#27272a] flex items-center space-x-2 shrink-0"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              placeholder={isListening ? 'Listening... Speak now...' : 'Ask about books, holds, loans, or click mic...'}
              className={`flex-1 border rounded-xl px-3.5 py-2 text-xs text-[#fafafa] focus:outline-none transition-colors ${
                isListening
                  ? 'bg-rose-950/30 border-rose-500/60 placeholder-rose-300'
                  : 'bg-[#09090b] border-[#27272a] focus:border-blue-500/50'
              }`}
            />

            {/* Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-600 border-rose-400 text-white animate-pulse shadow-lg shadow-rose-600/40'
                  : 'bg-[#09090b] border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] hover:border-blue-500/50'
              }`}
              title={isListening ? 'Stop Speech Listening' : 'Voice Input (Microphone)'}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-blue-400" />}
            </button>

            {/* Submit Send Button */}
            <button
              type="submit"
              disabled={!inputQuery.trim() || isTyping}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
              title="Send Message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Book Details Modal */}
      {selectedBookForDetails && (
        <BookDetailsModal
          book={selectedBookForDetails}
          onClose={() => setSelectedBookForDetails(null)}
          onReserve={book => {
            setSelectedBookForDetails(null);
            setSelectedBookForReservation(book);
          }}
          onFindSimilar={book => {
            setSelectedBookForDetails(null);
            handleSendMessage(`Recommend books similar to "${book.title}" in ${book.department}`);
          }}
        />
      )}

      {/* Reservation Confirmation Modal */}
      {selectedBookForReservation && (
        <ReservationDialog
          book={selectedBookForReservation}
          currentUser={currentUser}
          onConfirm={handleConfirmReservation}
          onCancel={() => setSelectedBookForReservation(null)}
        />
      )}

      {/* Advanced Search Filter Dialog */}
      {showAdvancedSearch && (
        <AdvancedSearchModal
          branches={branches}
          onApplyFilters={handleApplyAdvancedFilters}
          onClose={() => setShowAdvancedSearch(false)}
        />
      )}

      {/* Admin Settings & Analytics Modal */}
      {showAdminModal && (
        <AdminConfigModal
          config={config}
          onSaveConfig={setConfig}
          onClose={() => setShowAdminModal(false)}
        />
      )}
    </>
  );
};
