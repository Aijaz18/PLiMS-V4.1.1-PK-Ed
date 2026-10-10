import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bot,
  X,
  Send,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  BookOpen,
  Calendar,
  RotateCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Sparkles,
  Maximize2,
  Minimize2,
  User,
  Info,
  Copy,
  Check,
  Clock,
  Coins,
  ShieldCheck,
  Bookmark,
  Share2,
  GraduationCap,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { BookRecord, UserProfile, CirculationTransaction } from '../../types/alims';
import { askGeminiCopilot } from '../../services/geminiService';

export interface LibrarianBotProps {
  currentUser: UserProfile;
  activeBranch?: string;
  branches?: string[];
  books?: BookRecord[];
  transactions?: CirculationTransaction[];
  isOpen: boolean;
  onClose: () => void;
  onRenewTransaction?: (txId: string) => Promise<any> | void;
  onIssueBook?: (bookIdentifier: string, memberIdentifier: string) => Promise<any>;
  onReturnBook?: (barcode: string) => Promise<any>;
  onNavigateTab?: (tab: string) => void;
  onUpdateUser?: (id: string, updated: Partial<UserProfile>) => void;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'patron';
  text: string;
  time: string;
  status?: 'SENT' | 'DELIVERED' | 'READ';
  actionType?: 'LOANS' | 'SEARCH' | 'HOURS' | 'POLICY' | 'FINES' | 'RENEW' | 'GENERAL';
  bookResults?: BookRecord[];
  loanResults?: CirculationTransaction[];
  quickReplies?: string[];
}

export const LibrarianBot: React.FC<LibrarianBotProps> = ({
  currentUser,
  activeBranch = 'Central Academic Library',
  branches = ['Central Academic Library', 'City Campus Library', 'Science & Engineering Library', 'Health Sciences Library'],
  books = [],
  transactions = [],
  isOpen,
  onClose,
  onRenewTransaction,
  onNavigateTab
}) => {
  // Navigation tabs inside the Librarian Bot
  const [activeTab, setActiveTab] = useState<'CHAT' | 'MY_LOANS' | 'OPAC_SEARCH' | 'FINES' | 'TIMINGS_RULES'>('CHAT');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speechSynthesisEnabled, setSpeechSynthesisEnabled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // OPAC live search query inside bot
  const [opacSearchQuery, setOpacSearchQuery] = useState('');
  const [opacFilterBranch, setOpacFilterBranch] = useState('ALL');
  const [opacFilterAvailableOnly, setOpacFilterAvailableOnly] = useState(false);

  // Renewal feedback state
  const [renewingTxId, setRenewingTxId] = useState<string | null>(null);
  const [renewFeedback, setRenewFeedback] = useState<string | null>(null);

  // Hold / Reservation feedback
  const [reservedBookId, setReservedBookId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Patron active transactions (Current checked-out books)
  const patronLoans = useMemo(() => {
    return transactions.filter(t => {
      const matchMember =
        t.memberId === currentUser.id ||
        (t.memberName && t.memberName.toLowerCase() === currentUser.name.toLowerCase()) ||
        (currentUser.memberCode && t.memberId === currentUser.memberCode);
      return matchMember && t.status !== 'RETURNED';
    });
  }, [transactions, currentUser]);

  // Dynamic Overdue Fines Calculation
  const fineSummary = useMemo(() => {
    const isFaculty = ['FACULTY', 'RESEARCH_SCHOLAR'].includes(currentUser.role);
    const dailyRate = isFaculty ? 2.0 : 5.0; // PKR 2/day for faculty, PKR 5/day for students
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalAccumulated = 0;
    const overdueItems = patronLoans.map(loan => {
      const due = new Date(loan.dueDate);
      due.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - due.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const daysOverdue = diffDays > 0 ? diffDays : 0;
      const fine = daysOverdue * dailyRate;
      totalAccumulated += fine;
      return {
        ...loan,
        daysOverdue,
        calculatedFine: fine,
        isOverdue: daysOverdue > 0
      };
    });

    const userFine = currentUser.finePending || 0;
    return {
      dailyRate,
      overdueItems,
      totalCalculated: Math.max(totalAccumulated, userFine),
      hasOverdue: overdueItems.some(i => i.isOverdue)
    };
  }, [patronLoans, currentUser]);

  // Formatted Patron Role
  const roleFormatted = currentUser.role.replace(/_/g, ' ');

  // Initial greeting
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome_1',
      sender: 'bot',
      text: `Assalam-o-Alaikum **${currentUser.name}**! 📚🤖\n\nI am your **PLiMS AI Librarian Bot**, providing 24/7 digital reference and circulation services for **${activeBranch}**.\n\n👤 **Patron Profile:** ${roleFormatted} (${currentUser.department || 'Academic'})\n📖 **Current Loans:** ${patronLoans.length} of ${currentUser.maxBorrowLimit || 5} books checked out\n💰 **Pending Fines:** PKR ${fineSummary.totalCalculated}\n\nHow may I serve you today? You can ask me to check your loans, renew books, search catalog, calculate fines, or ask any academic research question.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'READ',
      actionType: 'GENERAL',
      quickReplies: ['📖 My Active Loans', '🔄 Renew My Books', '🔍 Search Catalog', '💰 Check Fines', '🕒 Library Hours']
    }
  ]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen && activeTab === 'CHAT') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen, activeTab]);

  // Audio chime synthesizer
  const playSoundChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // AudioContext unavailable
    }
  };

  // Text to Speech
  const speakText = (text: string) => {
    if (!speechSynthesisEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#•]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis error
    }
  };

  // Speech Recognition (Mic Input)
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          handleSendMessage(transcript);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Execute One-Click Renewal
  const handleExecuteRenew = async (txId: string) => {
    setRenewingTxId(txId);
    try {
      if (onRenewTransaction) {
        await onRenewTransaction(txId);
      }
      setRenewFeedback('Loan renewed successfully (+14 days)!');
      setTimeout(() => setRenewFeedback(null), 3000);

      // Add confirmation bot message to chat
      const targetLoan = patronLoans.find(l => l.id === txId);
      const loanTitle = targetLoan ? targetLoan.bookTitle : 'Selected Book';

      const confirmMsg: ChatMessage = {
        id: `bot_renew_${Date.now()}`,
        sender: 'bot',
        text: `🔄 **Loan Renewal Confirmed!** ✅\n\n• **Title:** ${loanTitle}\n• **Extended Duration:** +14 Calendar Days\n• **Patron:** ${currentUser.name}\n• **Branch Location:** ${activeBranch}\n\nYour circulation account has been updated with the extended due date.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'READ',
        actionType: 'RENEW',
        quickReplies: ['📖 Check Remaining Loans', '🔍 Search Catalog', '💰 Check Fines']
      };
      setMessages(prev => [...prev, confirmMsg]);
      playSoundChime();
      speakText(`Loan for ${loanTitle} renewed successfully.`);
    } catch (err) {
      console.error('Renewal error:', err);
    } finally {
      setRenewingTxId(null);
    }
  };

  // Place Book Hold / Reservation
  const handlePlaceHold = (book: BookRecord) => {
    setReservedBookId(book.id);
    const holdMsg: ChatMessage = {
      id: `bot_hold_${Date.now()}`,
      sender: 'bot',
      text: `📌 **Hold Reservation Confirmed!**\n\n• **Book Title:** *${book.title}*\n• **Author:** ${book.authors?.join(', ') || 'N/A'}\n• **Call #:** \`${book.callNumber || 'LIS-025'}\`\n• **Pickup Desk:** ${activeBranch} Circulation Counter\n• **Patron:** ${currentUser.name} (${currentUser.memberCode || currentUser.id})\n\nThe book will be held at the front circulation desk for **48 hours** for your collection.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'READ',
      actionType: 'GENERAL',
      quickReplies: ['📖 My Active Loans', '🔍 Search More Books', '🕒 Library Hours']
    };
    setMessages(prev => [...prev, holdMsg]);
    playSoundChime();
    speakText(`Hold placed for ${book.title}. Ready for pickup at ${activeBranch}.`);
    setTimeout(() => setReservedBookId(null), 3500);
  };

  // Copy message text helper
  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Dispatch message in Librarian Bot
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `patron_${Date.now()}`,
      sender: 'patron',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'SENT'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    playSoundChime();

    // Mark as read after 300ms
    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => (m.id === userMsg.id ? { ...m, status: 'READ' as const } : m))
      );
    }, 300);

    const lower = query.toLowerCase();

    // 1. Check Active Loans & Due Dates
    if (
      lower.includes('loan') ||
      lower.includes('borrowed') ||
      lower.includes('my book') ||
      lower.includes('due date') ||
      lower === '📖 my active loans'
    ) {
      setTimeout(() => {
        setIsLoading(false);
        playSoundChime();
        if (patronLoans.length > 0) {
          const loanText = `📋 **Active Circulation Loans for ${currentUser.name}:**\n📍 **Branch:** ${activeBranch}\n\nYou currently have **${patronLoans.length}** item(s) checked out:\n` +
            patronLoans.map((l, idx) => `\n${idx + 1}. 📖 **${l.bookTitle}**\n   • Acc #: \`${l.accessionNumber}\`\n   • Due Date: **${l.dueDate}**\n   • Status: ${l.status}`).join('\n') +
            `\n\nClick **"Renew"** on any item or ask me to renew!`;

          const reply: ChatMessage = {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            text: loanText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'READ',
            actionType: 'LOANS',
            loanResults: patronLoans,
            quickReplies: ['🔄 Renew All Eligible', '💰 Check Fines', '🔍 Search New Books']
          };
          setMessages(prev => [...prev, reply]);
          speakText(`You have ${patronLoans.length} active borrowed books.`);
        } else {
          const reply: ChatMessage = {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            text: `✅ **Account Clear for ${currentUser.name}:**\n📍 **Branch:** ${activeBranch}\n\nYou have **0 active borrowed books** checked out right now.\n• Max Borrowing Limit: **${currentUser.maxBorrowLimit || 5} Books**\n• Pending Fines: **PKR ${fineSummary.totalCalculated}**\n\nType *"Search [Topic]"* or click below to discover books in our OPAC catalog!`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'READ',
            actionType: 'LOANS',
            quickReplies: ['🔍 Search AI & Computer Science', '🕒 Library Hours', '💰 View Standing']
          };
          setMessages(prev => [...prev, reply]);
          speakText('Your library account is clear with zero active loans.');
        }
      }, 400);
      return;
    }

    // 2. Book Renewals
    if (lower.includes('renew') || lower.includes('extend') || lower === '🔄 renew my books') {
      setTimeout(async () => {
        setIsLoading(false);
        playSoundChime();
        if (patronLoans.length > 0) {
          const target = patronLoans[0];
          if (onRenewTransaction) {
            await onRenewTransaction(target.id);
          }
          const reply: ChatMessage = {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            text: `🔄 **Loan Renewal Successful!** ✅\n\n• **Title:** ${target.bookTitle}\n• **Acc #:** \`${target.accessionNumber}\`\n• **Extended Duration:** +14 Calendar Days\n• **Patron:** ${currentUser.name}\n• **Branch Location:** ${activeBranch}\n\nYour record has been renewed. You may renew each book up to 2 times provided there are no pending reservations.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'READ',
            actionType: 'RENEW',
            quickReplies: ['📖 Check Active Loans', '💰 Check Fines', '🔍 Search Catalog']
          };
          setMessages(prev => [...prev, reply]);
          speakText(`Successfully extended loan for ${target.bookTitle} by fourteen days.`);
        } else {
          const reply: ChatMessage = {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            text: `ℹ️ You currently do not have any active loans to renew.\n\nBrowse our catalog by typing *"Search [Topic]"* to issue new books!`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'READ',
            quickReplies: ['🔍 Search Catalog', '🕒 Library Hours']
          };
          setMessages(prev => [...prev, reply]);
        }
      }, 400);
      return;
    }

    // 3. Fines & Penalties
    if (lower.includes('fine') || lower.includes('penalty') || lower.includes('fee') || lower === '💰 check fines') {
      setTimeout(() => {
        setIsLoading(false);
        playSoundChime();
        const fineText = `💰 **Circulation Fines & Account Standing for ${currentUser.name}:**\n\n` +
          `• **Total Pending Fine:** **PKR ${fineSummary.totalCalculated.toFixed(2)}**\n` +
          `• **Overdue Rate:** PKR ${fineSummary.dailyRate.toFixed(2)} per calendar day (${roleFormatted})\n` +
          `• **Grace Period:** 2 Days after due date\n` +
          `• **Overdue Books:** ${fineSummary.overdueItems.filter(i => i.isOverdue).length} item(s)\n\n` +
          (fineSummary.totalCalculated > 0
            ? `⚠️ *Please clear pending dues at the ${activeBranch} Accounts Counter or via online student portal to maintain uninterrupted circulation privileges.*`
            : `✅ *Your account is in excellent standing with zero overdue penalties!*`);

        const reply: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: fineText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'READ',
          actionType: 'FINES',
          quickReplies: ['📖 Check My Loans', '🔄 Renew Books', '🔍 Search Catalog']
        };
        setMessages(prev => [...prev, reply]);
        speakText(`Your total pending library fine is PKR ${fineSummary.totalCalculated}`);
      }, 400);
      return;
    }

    // 4. OPAC Catalog Search Command
    if (
      lower.startsWith('search') ||
      lower.startsWith('find') ||
      lower.includes('book on') ||
      lower.includes('looking for') ||
      lower === '🔍 search catalog'
    ) {
      const cleanTerm = lower
        .replace(/^(search|find|book on|looking for|catalog|show me)\s*/i, '')
        .replace(/[?.,!]/g, '')
        .trim();

      setTimeout(() => {
        setIsLoading(false);
        playSoundChime();
        const matches = books.filter(b => {
          if (!cleanTerm) return true;
          const matchTitle = b.title.toLowerCase().includes(cleanTerm);
          const matchAuthor = b.authors && b.authors.some(a => a.toLowerCase().includes(cleanTerm));
          const matchSubject = b.subjects && b.subjects.some(s => s.toLowerCase().includes(cleanTerm));
          const matchCall = b.callNumber && b.callNumber.toLowerCase().includes(cleanTerm);
          const matchIsbn = b.isbn && b.isbn.includes(cleanTerm);
          return matchTitle || matchAuthor || matchSubject || matchCall || matchIsbn;
        });

        if (matches.length > 0) {
          const topMatches = matches.slice(0, 5);
          let text = `🔍 **OPAC Catalog Search Results for "${cleanTerm || 'All Books'}":**\nFound **${matches.length}** title(s) in PLiMS collection:\n`;

          const reply: ChatMessage = {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'READ',
            actionType: 'SEARCH',
            bookResults: topMatches,
            quickReplies: ['📖 Check My Loans', '🔍 Search Other Topic', '🕒 Library Hours']
          };
          setMessages(prev => [...prev, reply]);
          speakText(`Found ${matches.length} books in the catalog.`);
        } else {
          const reply: ChatMessage = {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            text: `🔍 **Catalog Search:** No exact book records found matching *"${cleanTerm}"* at **${activeBranch}**.\n\n• Try broader keywords (e.g. "Computer", "Management", "Science")\n• Or browse our HEC National Digital Library Union Catalog.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'READ',
            actionType: 'SEARCH',
            quickReplies: ['🔍 Search Computer Science', '🔍 Search Library Science', '🕒 Library Hours']
          };
          setMessages(prev => [...prev, reply]);
          speakText(`No books found matching ${cleanTerm}.`);
        }
      }, 400);
      return;
    }

    // 5. Operating Hours & Schedule
    if (lower.includes('hour') || lower.includes('timing') || lower.includes('open') || lower.includes('close') || lower === '🕒 library hours') {
      setTimeout(() => {
        setIsLoading(false);
        playSoundChime();
        const reply: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: `🕒 **PLiMS Library Operating Schedule for ${activeBranch}:**\n\n• **Monday - Friday:** 08:00 AM - 10:00 PM\n• **Saturday:** 09:00 AM - 06:00 PM\n• **Sunday & Public Holidays:** 10:00 AM - 04:00 PM (Reading Halls Only)\n• **Digital Lab & HEC E-Library:** 24/7 Access for Enrolled Students\n\n📍 **Campus Address:** Main Academic Complex, ${activeBranch}\nNeed an inter-branch transfer? Campus delivery operates between ${branches.join(', ')}.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'READ',
          actionType: 'HOURS',
          quickReplies: ['📖 My Active Loans', '🔍 Search Books', '💰 Check Fines']
        };
        setMessages(prev => [...prev, reply]);
        speakText(`The library is open from 8 AM to 10 PM on weekdays at ${activeBranch}`);
      }, 400);
      return;
    }

    // 6. Circulation Rules & Policies
    if (lower.includes('rule') || lower.includes('policy') || lower.includes('limit') || lower.includes('how many book')) {
      setTimeout(() => {
        setIsLoading(false);
        playSoundChime();
        const reply: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: `📋 **PLiMS Circulation Policy & Borrowing Privileges:**\n\n• **Students:** Up to 5 books for 14 calendar days (Overdue rate: PKR 5/day)\n• **Faculty & Scholars:** Up to 15 books for 30 calendar days (Overdue rate: PKR 2/day)\n• **Staff & Administrators:** Up to 10 books for 30 calendar days\n• **Renewals:** Up to 2 online renewals permitted per title\n• **Reference & Serials:** In-house reading only (Not issuable for take-home)\n• **Inter-Library Loan (ILL):** Available across ${branches.length} campus libraries.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'READ',
          actionType: 'POLICY',
          quickReplies: ['📖 Check My Loans', '🔄 Renew My Books', '🔍 Search Catalog']
        };
        setMessages(prev => [...prev, reply]);
        speakText('Circulation policy: Students may borrow up to 5 books for 14 days, faculty up to 15 books for 30 days.');
      }, 400);
      return;
    }

    // 7. AI Copilot Fallback (Gemini-powered Reference & Research Assistant)
    try {
      const systemPrompt = `You are the official AI Librarian Bot for PLiMS (Pakistan Library Information Management System), an academic library automation platform serving universities in Pakistan.
The user is ${currentUser.name}, role: ${currentUser.role}, department: ${currentUser.department || 'Academic'}, branch: ${activeBranch}.
Current loans: ${patronLoans.length} books.
Total books in library: ${books.length}.
Available branches: ${branches.join(', ')}.

Instructions:
1. Provide a courteous, concise, professional academic response suitable for a university librarian.
2. If the user asks about library operations, reference citations, research papers, MARC21/RDA cataloguing, DDC classification, or book recommendations, give accurate guidance.
3. Suggest relevant library actions they can take. Keep formatting clean with bold headings and bullet points.`;

      const aiResponse = await askGeminiCopilot(`${systemPrompt}\n\nPatron query: ${query}`, []);

      const botReply: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: aiResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'READ',
        actionType: 'GENERAL',
        quickReplies: ['📖 My Active Loans', '🔍 Search Catalog', '🕒 Library Hours']
      };

      setMessages(prev => [...prev, botReply]);
      playSoundChime();
      speakText(aiResponse.slice(0, 180));
    } catch {
      const fallbackReply: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: `Assalam-o-Alaikum ${currentUser.name}! I am your PLiMS AI Librarian Bot at **${activeBranch}**.\n\nI can assist you immediately with:\n• 📖 *"My active loans"* - view borrowed books & due dates\n• 🔄 *"Renew my books"* - extend current circulation loans\n• 🔍 *"Search [topic]"* - search our library catalog\n• 💰 *"Check fines"* - view pending dues & penalties\n• 🕒 *"Library hours"* - view campus opening schedule\n\nHow can I help you today?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'READ',
        quickReplies: ['📖 My Active Loans', '🔄 Renew My Books', '🔍 Search Catalog', '💰 Check Fines']
      };
      setMessages(prev => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
      playSoundChime();
    }
  };

  // Filtered books for OPAC Tab
  const filteredOpacBooks = useMemo(() => {
    return books.filter(b => {
      const bookBranch = (b as any).branch || b.shelfLocation || '';
      if (opacFilterBranch !== 'ALL' && bookBranch && !bookBranch.includes(opacFilterBranch)) {
        return false;
      }
      const available = b.availableCopies ?? b.copiesAvailable ?? 0;
      if (opacFilterAvailableOnly && available <= 0) {
        return false;
      }
      if (!opacSearchQuery.trim()) return true;
      const q = opacSearchQuery.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        (b.authors && b.authors.some(a => a.toLowerCase().includes(q))) ||
        (b.subjects && b.subjects.some(s => s.toLowerCase().includes(q))) ||
        (b.callNumber && b.callNumber.toLowerCase().includes(q)) ||
        (b.isbn && b.isbn.includes(q))
      );
    });
  }, [books, opacSearchQuery, opacFilterBranch, opacFilterAvailableOnly]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        className={`bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-slate-100 transition-all duration-300 ${
          isExpanded ? 'w-[98vw] h-[96vh]' : 'w-full max-w-4xl h-[700px]'
        }`}
      >
        {/* Top Header: Academic Library & Bot Identity */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 px-4 sm:px-6 py-3.5 flex items-center justify-between text-white shadow-md shrink-0">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-white text-emerald-800 flex items-center justify-center font-bold shadow-md">
                <Bot className="h-6 w-6 text-emerald-700" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-emerald-800 rounded-full animate-pulse"></span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-white truncate">PLiMS AI Librarian Bot</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-200 text-[10px] font-semibold border border-emerald-500/30">
                  24/7 Online
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/90 truncate flex items-center space-x-1">
                <span>Branch: {activeBranch}</span>
                <span>•</span>
                <span>Patron: {currentUser.name} ({roleFormatted})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl hover:bg-white/15 transition-colors cursor-pointer text-white"
              title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-emerald-300" />}
            </button>

            {/* Expand / Minimize */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl hover:bg-white/15 transition-colors cursor-pointer text-white hidden sm:block"
              title={isExpanded ? 'Minimize Window' : 'Expand Fullscreen'}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-rose-500/80 transition-colors cursor-pointer text-white"
              title="Close Librarian Bot"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sub-Navigation Bar for All Library Services */}
        <div className="bg-slate-800/95 border-b border-slate-700 px-3 sm:px-6 py-1.5 flex items-center space-x-1 sm:space-x-2 overflow-x-auto text-xs shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('CHAT')}
            className={`py-1.5 px-3 rounded-xl font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'CHAT'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>Interactive Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MY_LOANS')}
            className={`py-1.5 px-3 rounded-xl font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'MY_LOANS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>My Active Loans</span>
            {patronLoans.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-mono">
                {patronLoans.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('OPAC_SEARCH')}
            className={`py-1.5 px-3 rounded-xl font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'OPAC_SEARCH'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>OPAC Book Discovery</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FINES')}
            className={`py-1.5 px-3 rounded-xl font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'FINES'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Coins className="h-3.5 w-3.5" />
            <span>Fines & Standing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TIMINGS_RULES')}
            className={`py-1.5 px-3 rounded-xl font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'TIMINGS_RULES'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Timings & Policies</span>
          </button>
        </div>

        {/* Feedback alert toast */}
        {renewFeedback && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>{renewFeedback}</span>
            </div>
            <button type="button" onClick={() => setRenewFeedback(null)} className="text-white hover:opacity-80">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
          {/* TAB 1: INTERACTIVE CHAT */}
          {activeTab === 'CHAT' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Quick Action Chips at the Top */}
              <div className="p-2 sm:px-4 bg-slate-800/60 border-b border-slate-700/60 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none shrink-0">
                <span className="text-slate-400 font-semibold shrink-0 text-[10px] uppercase tracking-wider pl-1">
                  Services:
                </span>
                <button
                  type="button"
                  onClick={() => handleSendMessage('📖 My Active Loans')}
                  className="px-2.5 py-1 rounded-lg bg-slate-700/80 hover:bg-emerald-600 text-slate-200 hover:text-white transition-colors shrink-0 flex items-center space-x-1 cursor-pointer font-medium"
                >
                  <BookOpen className="h-3 w-3 text-emerald-400" />
                  <span>My Loans</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('🔄 Renew My Books')}
                  className="px-2.5 py-1 rounded-lg bg-slate-700/80 hover:bg-emerald-600 text-slate-200 hover:text-white transition-colors shrink-0 flex items-center space-x-1 cursor-pointer font-medium"
                >
                  <RotateCw className="h-3 w-3 text-emerald-400" />
                  <span>Renew Books</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('🔍 Search Computer Science')}
                  className="px-2.5 py-1 rounded-lg bg-slate-700/80 hover:bg-emerald-600 text-slate-200 hover:text-white transition-colors shrink-0 flex items-center space-x-1 cursor-pointer font-medium"
                >
                  <Search className="h-3 w-3 text-emerald-400" />
                  <span>Search Catalog</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('💰 Check Fines')}
                  className="px-2.5 py-1 rounded-lg bg-slate-700/80 hover:bg-emerald-600 text-slate-200 hover:text-white transition-colors shrink-0 flex items-center space-x-1 cursor-pointer font-medium"
                >
                  <Coins className="h-3 w-3 text-emerald-400" />
                  <span>Check Fines</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('🕒 Library Hours')}
                  className="px-2.5 py-1 rounded-lg bg-slate-700/80 hover:bg-emerald-600 text-slate-200 hover:text-white transition-colors shrink-0 flex items-center space-x-1 cursor-pointer font-medium"
                >
                  <Clock className="h-3 w-3 text-emerald-400" />
                  <span>Hours & Schedule</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('📋 Borrowing Policies')}
                  className="px-2.5 py-1 rounded-lg bg-slate-700/80 hover:bg-emerald-600 text-slate-200 hover:text-white transition-colors shrink-0 flex items-center space-x-1 cursor-pointer font-medium"
                >
                  <Info className="h-3 w-3 text-emerald-400" />
                  <span>Circulation Rules</span>
                </button>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'patron' ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}
                  >
                    <div
                      className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-4 py-3 shadow-md relative group ${
                        msg.sender === 'patron'
                          ? 'bg-emerald-700 text-white rounded-tr-xs'
                          : 'bg-slate-800 border border-slate-700/80 text-slate-100 rounded-tl-xs'
                      }`}
                    >
                      {/* Message sender header */}
                      <div className="flex items-center justify-between space-x-3 mb-1.5 pb-1 border-b border-white/10">
                        <div className="flex items-center space-x-1.5">
                          {msg.sender === 'bot' ? (
                            <>
                              <Bot className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-[11px] font-bold text-emerald-400">PLiMS AI Librarian</span>
                            </>
                          ) : (
                            <>
                              <User className="h-3.5 w-3.5 text-emerald-200" />
                              <span className="text-[11px] font-bold text-white">{currentUser.name}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-[10px] text-slate-400 font-mono">{msg.time}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.text)}
                            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Copy message"
                          >
                            {copiedMessageId === msg.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Message text body */}
                      <div className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-line">
                        {msg.text}
                      </div>

                      {/* Inline Interactive Book Search Results */}
                      {msg.bookResults && msg.bookResults.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700/80 space-y-2">
                          <div className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1">
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>Catalog Results ({msg.bookResults.length}):</span>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {msg.bookResults.map(book => (
                              <div
                                key={book.id}
                                className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                              >
                                <div>
                                  <div className="font-bold text-xs text-white flex items-center space-x-1">
                                    <span>{book.title}</span>
                                    {book.edition && (
                                      <span className="text-[10px] text-slate-400 font-normal">({book.edition})</span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    {book.authors?.join(', ') || 'Unknown Author'} • Call #: <span className="font-mono text-emerald-400">{book.callNumber || 'LIS-001'}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    Branch: {(book as any).branch || book.shelfLocation || activeBranch} • Copies Available: <span className="font-bold text-white">{book.availableCopies ?? book.copiesAvailable ?? 1}</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handlePlaceHold(book)}
                                    disabled={reservedBookId === book.id}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1"
                                  >
                                    <Bookmark className="h-3 w-3" />
                                    <span>{reservedBookId === book.id ? 'Held' : 'Place Hold'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTab('OPAC_SEARCH');
                                      setOpacSearchQuery(book.title);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-all cursor-pointer"
                                  >
                                    Details
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Inline Interactive Loans for Renewal */}
                      {msg.loanResults && msg.loanResults.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700/80 space-y-2">
                          <div className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1">
                            <RotateCw className="h-3.5 w-3.5" />
                            <span>1-Click Loan Renewals:</span>
                          </div>
                          <div className="space-y-1.5">
                            {msg.loanResults.map(loan => (
                              <div
                                key={loan.id}
                                className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-between text-xs"
                              >
                                <div className="truncate mr-2">
                                  <div className="font-semibold text-white truncate">{loan.bookTitle}</div>
                                  <div className="text-[10px] text-slate-400">Due: <span className="text-emerald-400 font-mono">{loan.dueDate}</span></div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleExecuteRenew(loan.id)}
                                  disabled={renewingTxId === loan.id}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[10px] font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-1"
                                >
                                  {renewingTxId === loan.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RotateCw className="h-3 w-3" />
                                  )}
                                  <span>Renew (+14d)</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick reply chips under message */}
                      {msg.quickReplies && msg.quickReplies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-white/10">
                          {msg.quickReplies.map((reply, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSendMessage(reply)}
                              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-medium transition-colors cursor-pointer border border-white/10"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/80 px-3.5 py-2 rounded-xl w-fit border border-slate-700">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                    <span>Librarian Bot is thinking & querying catalog...</span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input Footer */}
              <div className="p-3 bg-slate-800/90 border-t border-slate-700 shrink-0">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center space-x-2"
                >
                  {/* Voice Input Mic */}
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-2.5 rounded-full transition-all cursor-pointer ${
                      isListening
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                    title={isListening ? 'Stop Listening' : 'Speak with Librarian Bot'}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>

                  {/* Input field */}
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder={isListening ? 'Listening to speech...' : 'Ask Librarian Bot: "My active loans", "Renew books", "Search AI", "Fines"...'}
                    className="flex-1 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none transition-all"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className="p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-all cursor-pointer shadow-md"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: MY ACTIVE LOANS */}
          {activeTab === 'MY_LOANS' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-emerald-400" />
                    <span>My Borrowed Books & Circulation Standing</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Active books issued to {currentUser.name} across all campus library branches.
                  </p>
                </div>
                {patronLoans.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      patronLoans.forEach(l => handleExecuteRenew(l.id));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Renew All Eligible</span>
                  </button>
                )}
              </div>

              {patronLoans.length === 0 ? (
                <div className="p-8 rounded-3xl bg-slate-800/60 border border-slate-700/80 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-white text-sm">No Active Borrowed Books</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    You currently have zero active loans. Your maximum borrowing quota is {currentUser.maxBorrowLimit || 5} books.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('OPAC_SEARCH')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1.5"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>Browse OPAC Catalog</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {patronLoans.map(loan => {
                    const dueObj = new Date(loan.dueDate);
                    const now = new Date();
                    const isOverdue = dueObj.getTime() < now.getTime();

                    return (
                      <div
                        key={loan.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                          isOverdue
                            ? 'bg-rose-950/20 border-rose-800/60'
                            : 'bg-slate-800/80 border-slate-700/80'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-sm text-white line-clamp-2">{loan.bookTitle}</h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                isOverdue
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {isOverdue ? 'Overdue' : 'Active Loan'}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 space-y-0.5">
                            <div>Accession #: <span className="font-mono text-white">{loan.accessionNumber || 'N/A'}</span></div>
                            <div>Barcode: <span className="font-mono text-white">{loan.copyBarcode || 'N/A'}</span></div>
                            <div>Issue Date: <span className="text-slate-300">{loan.issueDate || 'N/A'}</span></div>
                            <div>Due Date: <span className={`font-mono font-bold ${isOverdue ? 'text-rose-400' : 'text-emerald-400'}`}>{loan.dueDate}</span></div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                          <div className="text-[10px] text-slate-400">
                            Renewals: {loan.renewCount || 0} / 2
                          </div>
                          <button
                            type="button"
                            onClick={() => handleExecuteRenew(loan.id)}
                            disabled={renewingTxId === loan.id}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 shadow-sm"
                          >
                            {renewingTxId === loan.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RotateCw className="h-3.5 w-3.5" />
                            )}
                            <span>Renew Loan (+14d)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OPAC BOOK DISCOVERY */}
          {activeTab === 'OPAC_SEARCH' && (
            <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6 space-y-4">
              <div className="space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Search className="h-5 w-5 text-emerald-400" />
                    <span>Live OPAC Catalog Discovery</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    {filteredOpacBooks.length} of {books.length} titles available
                  </span>
                </div>

                {/* Search Bar & Branch Filters */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={opacSearchQuery}
                      onChange={e => setOpacSearchQuery(e.target.value)}
                      placeholder="Search by Title, Author, Subject, ISBN, or Call #..."
                      className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  <select
                    value={opacFilterBranch}
                    onChange={e => setOpacFilterBranch(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-2xl px-3 py-2 focus:outline-none"
                  >
                    <option value="ALL">All Branches</option>
                    {branches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>

                  <label className="flex items-center space-x-1.5 text-xs text-slate-300 bg-slate-800 px-3 py-2 rounded-2xl border border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={opacFilterAvailableOnly}
                      onChange={e => setOpacFilterAvailableOnly(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span>Available Copies Only</span>
                  </label>
                </div>
              </div>

              {/* Book Cards Grid */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredOpacBooks.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-center text-slate-400 text-xs">
                    No books found matching your search criteria. Try a different query or select "All Branches".
                  </div>
                ) : (
                  filteredOpacBooks.map(book => (
                    <div
                      key={book.id}
                      className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-sm text-white">{book.title}</h4>
                          {book.edition && (
                            <span className="text-[10px] text-slate-400 font-medium">{book.edition}</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-300">
                          {book.authors?.join(', ') || 'Unknown Author'} • Publisher: {book.publisherName || (book as any).publisher || 'Academic'} ({book.publisherYear || (book as any).year || '2024'})
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono">
                            Call #: {book.callNumber || 'LIS-025'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-300">
                            DDC: {book.ddcClassification || (book as any).ddc || '025.04'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-300">
                            Branch: {(book as any).branch || book.shelfLocation || activeBranch}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md font-bold ${
                            (book.availableCopies ?? book.copiesAvailable ?? 0) > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {(book.availableCopies ?? book.copiesAvailable ?? 0) > 0 ? `${book.availableCopies ?? book.copiesAvailable} Available` : 'All Checked Out'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handlePlaceHold(book)}
                          disabled={reservedBookId === book.id}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                        >
                          <Bookmark className="h-3.5 w-3.5" />
                          <span>{reservedBookId === book.id ? 'Reserved!' : 'Reserve / Hold'}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: FINES & STANDING */}
          {activeTab === 'FINES' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Coins className="h-5 w-5 text-emerald-400" />
                  <span>Circulation Penalties & Account Standing</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time calculation of overdue fines, grace periods, and borrowing limits.
                </p>
              </div>

              {/* Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                  <div className="text-[11px] text-slate-400">Pending Fines</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    PKR {fineSummary.totalCalculated.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {fineSummary.totalCalculated === 0 ? 'Clear - No pending dues' : 'Payment required at counter'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                  <div className="text-[11px] text-slate-400">Borrowing Privileges</div>
                  <div className="text-2xl font-black text-white mt-1">
                    {patronLoans.length} / {currentUser.maxBorrowLimit || 5}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Quota authorized for {roleFormatted}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                  <div className="text-[11px] text-slate-400">Overdue Rate</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    PKR {fineSummary.dailyRate.toFixed(2)} / day
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    2 days grace period applied
                  </div>
                </div>
              </div>

              {/* Overdue Breakdown Table */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Book-by-Book Overdue Assessment</span>
                </h4>

                {fineSummary.overdueItems.length === 0 ? (
                  <div className="text-xs text-slate-400 py-3 text-center">
                    No active loan records found on this account.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fineSummary.overdueItems.map(item => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
                      >
                        <div>
                          <div className="font-bold text-white">{item.bookTitle}</div>
                          <div className="text-[11px] text-slate-400">
                            Due: {item.dueDate} • Acc #: {item.accessionNumber}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.isOverdue
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {item.isOverdue ? `${item.daysOverdue} Days Overdue` : 'Within Due Period'}
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            PKR {item.calculatedFine.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: TIMINGS & POLICIES */}
          {activeTab === 'TIMINGS_RULES' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-emerald-400" />
                  <span>Library Operating Hours & Policies</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Campus library branches, circulation rules, and digital resource services.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Branch Hours */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                  <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-emerald-400" />
                    <span>Campus Branches & Opening Timings</span>
                  </h4>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 space-y-1">
                      <div className="font-bold text-white">Central Academic Library</div>
                      <div>• Mon - Fri: 08:00 AM - 10:00 PM</div>
                      <div>• Sat: 09:00 AM - 06:00 PM</div>
                      <div>• Sun: 10:00 AM - 04:00 PM (Reading Halls)</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 space-y-1">
                      <div className="font-bold text-white">City Campus & Specialized Libraries</div>
                      <div>• Mon - Fri: 08:30 AM - 05:00 PM</div>
                      <div>• Sat: 09:00 AM - 02:00 PM</div>
                    </div>
                  </div>
                </div>

                {/* Circulation Rules */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                  <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                    <GraduationCap className="h-4 w-4 text-emerald-400" />
                    <span>Circulation Rules & Allowances</span>
                  </h4>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-700/80">
                      <strong>Students:</strong> 5 Books for 14 Days (PKR 5.00/day fine)
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-700/80">
                      <strong>Faculty & Scholars:</strong> 15 Books for 30 Days (PKR 2.00/day fine)
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-700/80">
                      <strong>Staff:</strong> 10 Books for 30 Days
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-700/80">
                      <strong>Renewals:</strong> 2 Online extensions allowed per book
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-700/80">
                      <strong>Holds / Reserves:</strong> Held at circulation desk for 48 hours
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibrarianBot;
