import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ExternalLink,
  BookOpen,
  Calendar,
  RotateCw,
  Search,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Phone,
  QrCode,
  ShieldCheck,
  Sparkles,
  Maximize2,
  Minimize2,
  User,
  Info,
  Smartphone,
  Copy,
  Check,
  Edit3
} from 'lucide-react';
import QRCode from 'qrcode';
import { BookRecord, UserProfile, CirculationTransaction } from '../../types/alims';
import { askGeminiCopilot } from '../../services/geminiService';
import {
  OFFICIAL_LIBRARY_WHATSAPP_NUMBER,
  normalizePhoneNumber,
  getOfficialHelplineNumber,
  saveOfficialHelplineNumber,
  formatWhatsAppPhone,
  getWhatsAppUniversalUrl
} from './WhatsAppWebLoginCard';
import { WhatsAppWebQrAuthenticator } from './WhatsAppWebQrAuthenticator';

export interface WhatsAppWebAgentProps {
  currentUser: UserProfile;
  activeBranch?: string;
  branches?: string[];
  books?: BookRecord[];
  transactions?: CirculationTransaction[];
  isOpen: boolean;
  onClose: () => void;
  onRenewTransaction?: (txId: string) => void;
  onIssueBook?: (bookIdentifier: string, memberIdentifier: string) => Promise<any>;
  onReturnBook?: (barcode: string) => Promise<any>;
  onNavigateTab?: (tab: string) => void;
  onUpdateUser?: (id: string, updated: Partial<UserProfile>) => void;
}

interface ChatMessage {
  id: string;
  sender: 'patron' | 'agent';
  text: string;
  time: string;
  status?: 'SENT' | 'DELIVERED' | 'READ';
  quickReplies?: string[];
  actionType?: 'LOANS' | 'SEARCH' | 'POLICY' | 'RENEWAL' | 'LINK_INFO' | 'NUMBERS';
  actionData?: any;
}

export const WhatsAppWebAgent: React.FC<WhatsAppWebAgentProps> = ({
  currentUser,
  activeBranch = 'Central Academic Library',
  branches = ['Central Academic Library', 'Engineering Campus Library', 'Medical Sciences Library'],
  books = [],
  transactions = [],
  isOpen,
  onClose,
  onRenewTransaction,
  onNavigateTab,
  onUpdateUser
}) => {
  const [activeTab, setActiveTab] = useState<'CHAT' | 'QR_AUTH' | 'NUMBERS' | 'MY_STANDING' | 'LINK_DEVICE'>('CHAT');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speechSynthesisEnabled, setSpeechSynthesisEnabled] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Official Helpline & Bot Number State
  const [officialHelplinePhone, setOfficialHelplinePhone] = useState<string>(() => getOfficialHelplineNumber());
  const [editHelplinePhoneInput, setEditHelplinePhoneInput] = useState<string>(() => getOfficialHelplineNumber());
  const [isSavingHelpline, setIsSavingHelpline] = useState(false);
  const [helplineSaveSuccess, setHelplineSaveSuccess] = useState(false);

  // Original Number Management State
  const [connectedOriginalPhone, setConnectedOriginalPhone] = useState<string>(
    currentUser.whatsappPhone || currentUser.phone || currentUser.mobileNo || '+92 300 9876543'
  );
  const [editOriginalPhoneInput, setEditOriginalPhoneInput] = useState<string>(
    currentUser.whatsappPhone || currentUser.phone || currentUser.mobileNo || '+92 300 9876543'
  );
  const [isSavingOriginal, setIsSavingOriginal] = useState(false);
  const [originalSaveSuccess, setOriginalSaveSuccess] = useState(false);
  const [copiedOfficial, setCopiedOfficial] = useState(false);
  const [copiedOriginal, setCopiedOriginal] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const phoneDisplay = formatWhatsAppPhone(connectedOriginalPhone);
  const roleFormatted = currentUser.role.replace(/_/g, ' ');

  // Synchronize when current user's phone updates
  useEffect(() => {
    const patronPhone = currentUser.whatsappPhone || currentUser.phone || currentUser.mobileNo;
    if (patronPhone) {
      const formatted = formatWhatsAppPhone(patronPhone);
      setConnectedOriginalPhone(formatted);
      setEditOriginalPhoneInput(formatted);
    }
  }, [currentUser.id, currentUser.whatsappPhone, currentUser.phone, currentUser.mobileNo]);

  // Synchronize when official helpline changes globally
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setOfficialHelplinePhone(e.detail);
        setEditHelplinePhoneInput(e.detail);
      }
    };
    window.addEventListener('plims:helpline_number_updated', handleUpdate);
    return () => window.removeEventListener('plims:helpline_number_updated', handleUpdate);
  }, []);

  // Patron's active loans
  const patronLoans = transactions.filter(
    t => (t.memberId === currentUser.id || t.memberName === currentUser.name) && t.status === 'ISSUED'
  );

  // Initial welcome message acknowledging WhatsApp Web login
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const isWaWebAuth = currentUser.authProvider === 'WHATSAPP_WEB';
    const activeHelpline = getOfficialHelplineNumber();
    const authNote = isWaWebAuth
      ? `🟢 *WhatsApp Web Session Authenticated!*\nOriginal phone linked: *${phoneDisplay}*.\nOfficial Helpline & Bot: *${activeHelpline}*.`
      : `🟢 *WhatsApp Web Library Bridge Linked*\nOriginal phone connected: *${phoneDisplay}*.\nOfficial Helpline & Bot: *${activeHelpline}*.`;

    return [
      {
        id: 'wa_init_1',
        sender: 'agent',
        text: `Assalam-o-Alaikum *${currentUser.name}*! 🟢📚\n\n${authNote}\n\nI am your official *PLiMS WhatsApp Web Agent* synchronized with *${activeBranch}*.\n\n👤 *Patron Profile:* ${roleFormatted} (${currentUser.department || 'Academic'})\n📖 *Current Loans:* ${patronLoans.length} of ${currentUser.maxBorrowLimit || 5} books\n💰 *Pending Fines:* PKR ${currentUser.finePending || 0}\n\nHow may I assist you with your library account today?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'READ',
        quickReplies: ['📷 QR Authenticate', '📱 WhatsApp Numbers', '📚 My Active Loans', '🔄 Renew Borrowed Books', '🔍 Search Catalog']
      }
    ];
  });

  // Generate QR code for WhatsApp Web linking
  useEffect(() => {
    const linkUrl = `https://web.whatsapp.com/send?phone=${normalizePhoneNumber(officialHelplinePhone)}&text=${encodeURIComponent(
      `Assalam-o-Alaikum PLiMS Library Bot! I am ${currentUser.name} (${currentUser.memberCode || currentUser.id}) connected via original WhatsApp phone ${phoneDisplay} at ${activeBranch}.`
    )}`;
    QRCode.toDataURL(linkUrl, { width: 220, margin: 1, color: { dark: '#008069', light: '#FFFFFF' } })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.warn('QR error:', err));
  }, [currentUser, activeBranch, phoneDisplay, officialHelplinePhone]);

  // Scroll to bottom on message
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Audio chime
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
      // AudioContext unavailable or blocked
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

  // Connect / Update Original Phone Number
  const handleSaveOriginalNumber = (newPhone: string) => {
    if (!newPhone.trim()) return;
    setIsSavingOriginal(true);

    const formatted = formatWhatsAppPhone(newPhone);
    setConnectedOriginalPhone(formatted);
    setEditOriginalPhoneInput(formatted);

    if (onUpdateUser) {
      onUpdateUser(currentUser.id, {
        whatsappPhone: formatted,
        phone: formatted,
        authProvider: 'WHATSAPP_WEB',
        whatsappLinkedAt: new Date().toISOString()
      });
    }

    try {
      localStorage.setItem(`plims_patron_whatsapp_${currentUser.id}`, formatted);
      window.dispatchEvent(
        new CustomEvent('plims:patron_whatsapp_updated', {
          detail: { userId: currentUser.id, phone: formatted }
        })
      );
    } catch {
      // ignore
    }

    setTimeout(() => {
      setIsSavingOriginal(false);
      setOriginalSaveSuccess(true);
      setTimeout(() => setOriginalSaveSuccess(false), 3000);

      // Add confirmation to chat
      const confirmMsg: ChatMessage = {
        id: `agent_${Date.now()}`,
        sender: 'agent',
        text: `📱 *Original WhatsApp Number Connected!* ✅\n\nYour patron account (*${currentUser.name}*) is now securely bound to:\n• *Original Number:* \`${formatted}\`\n• *Official Library Bot:* \`${officialHelplinePhone}\`\n• *Branch:* ${activeBranch}\n\nAutomated due notices, hold pickup notifications, and fine warnings will now be dispatched directly to your original phone on WhatsApp.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'READ',
        quickReplies: ['💬 Open WhatsApp Web Chat', '📋 View My Standing', '🔄 Renew Loans', '📷 QR Authenticate']
      };
      setMessages(prev => [...prev, confirmMsg]);
      speakText('Your original WhatsApp number has been connected.');
    }, 500);
  };

  // Add / Update Official Library Helpline & Bot Number
  const handleSaveHelplineNumber = (newNumber: string) => {
    if (!newNumber.trim()) return;
    setIsSavingHelpline(true);

    const formatted = formatWhatsAppPhone(newNumber);
    saveOfficialHelplineNumber(formatted);
    setOfficialHelplinePhone(formatted);

    setTimeout(() => {
      setIsSavingHelpline(false);
      setHelplineSaveSuccess(true);
      setTimeout(() => setHelplineSaveSuccess(false), 2500);

      const confirmMsg: ChatMessage = {
        id: `agent_${Date.now()}`,
        sender: 'agent',
        text: `🏢 *Official Helpline & Bot Number Saved!* ✅\n\n• *Official Library Helpline & Bot:* \`${formatted}\`\n• *Campus Branch:* ${activeBranch}\n• *Synchronized With:* QR Authenticator & WhatsApp Web Catalog\n\nAll library broadcast notices, patron renewals, and QR pairing sessions are now bound to this official bot number.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'READ',
        quickReplies: ['💬 Open WhatsApp Web Chat', '📱 WhatsApp Numbers', '📷 QR Authenticate']
      };
      setMessages(prev => [...prev, confirmMsg]);
      speakText(`Official library helpline and bot number updated to ${formatted}`);
    }, 500);
  };

  // Dispatch message in WhatsApp Web Agent
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

    // Mark as read after 400ms
    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => (m.id === userMsg.id ? { ...m, status: 'READ' as const } : m))
      );
    }, 400);

    const lower = query.toLowerCase();

    // 0. QR Code Authenticator / Scan to Authenticate
    if (
      lower.includes('qr') ||
      lower.includes('scan') ||
      lower.includes('authenticate') ||
      lower.includes('pair mobile') ||
      lower.includes('link mobile') ||
      lower === '📷 qr authenticate' ||
      lower === '📷 open qr authenticator'
    ) {
      setTimeout(() => {
        setIsLoading(false);
        playSoundChime();
        const qrMsg = `📷 *Mobile Device QR Authenticator:*\n\nScan the live encrypted QR code with your mobile smartphone camera or WhatsApp to instantly authenticate and bind your library account.\n\n• *Target Patron:* *${currentUser.name}* (${currentUser.memberCode || currentUser.id})\n• *Binding Original Mobile:* \`${phoneDisplay}\`\n• *Official Helpline & Bot:* \`${officialHelplinePhone}\`\n• *Active Branch:* ${activeBranch}\n\nSwitching to the interactive QR Authenticator generator now...`;

        const reply: ChatMessage = {
          id: `agent_${Date.now()}`,
          sender: 'agent',
          text: qrMsg,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'READ',
          actionType: 'LINK_INFO',
          quickReplies: ['📷 Open QR Authenticator', '📱 WhatsApp Numbers', '📋 My Active Loans']
        };
        setMessages(prev => [...prev, reply]);
        speakText('Opening QR code generator for mobile device authentication');
        setActiveTab('QR_AUTH');
      }, 400);
      return;
    }

    // 0.1 Check for command to set or change Helpline number
    if (
      lower.startsWith('change helpline to') ||
      lower.startsWith('set helpline') ||
      lower.startsWith('helpline to') ||
      lower.startsWith('bot number to')
    ) {
      const matchNum = query.replace(/^(?:change\s+helpline\s+to|set\s+helpline\s*(?:to)?|helpline\s+to|bot\s+number\s*(?:to)?)\s*/i, '').trim();
      if (matchNum) {
        handleSaveHelplineNumber(matchNum);
        setIsLoading(false);
        return;
      }
    }

    // 0.2 Check for command to connect or update Original Phone Number
    const phoneRegex = /(?:(?:\+|00)?92[\s-]?[0-9]{3}[\s-]?[0-9]{7}|03[0-9]{2}[\s-]?[0-9]{7}|\+?[0-9]{1,4}[\s-]?[0-9]{6,12})/;
    const phoneMatch = query.match(phoneRegex);

    const isConnectCommand =
      lower.startsWith('change number to') ||
      lower.startsWith('connect number') ||
      lower.startsWith('connect with whatsapp number') ||
      lower.startsWith('connect whatsapp') ||
      lower.startsWith('set original number') ||
      lower.startsWith('original number to') ||
      lower.startsWith('link number') ||
      lower.startsWith('link whatsapp') ||
      lower.startsWith('my whatsapp number is') ||
      lower.startsWith('my whatsapp is') ||
      lower.startsWith('my phone is') ||
      lower.startsWith('connect original number');

    if (isConnectCommand && phoneMatch) {
      handleSaveOriginalNumber(phoneMatch[0]);
      setIsLoading(false);
      return;
    }

    if (phoneMatch && query.trim() === phoneMatch[0].trim()) {
      // User sent raw phone number directly into chat
      handleSaveOriginalNumber(phoneMatch[0]);
      setIsLoading(false);
      return;
    }

    if (
      lower === 'connect with whatsapp number' ||
      lower === 'connect whatsapp number' ||
      lower === 'connect original number' ||
      lower === 'connect number' ||
      lower === 'link whatsapp' ||
      lower === 'whatsapp web' ||
      lower === '📱 connect original number' ||
      lower === '📱 whatsapp numbers'
    ) {
      setTimeout(() => {
        setIsLoading(false);
        playSoundChime();
        const msg: ChatMessage = {
          id: `agent_${Date.now()}`,
          sender: 'agent',
          text: `📱 *Connect Your Original WhatsApp Number:*\n\nYour patron account (*${currentUser.name}*) is currently linked to: \`${phoneDisplay}\`.\nOfficial Library Helpline & Bot: \`${officialHelplinePhone}\`.\n\nTo connect or update your original phone number:\n1. Click *"Connected Numbers"* tab or *"QR Authenticator"* tab above.\n2. Or reply directly in this chat with your number, for example:\n   👉 *"Connect number +92 300 1234567"*\n   👉 *"Connect number 0300 9876543"*\n   👉 Or just send your phone number: *03001234567*`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'READ',
          quickReplies: ['📱 Open Connected Numbers', '📷 Open QR Authenticator', '🏢 Official Helpline']
        };
        setMessages(prev => [...prev, msg]);
        speakText('Please provide your WhatsApp number or switch to Connected Numbers tab.');
      }, 300);
      return;
    }

    // 0.3 General WhatsApp Numbers & Helpline Information
    if (
      lower.includes('number') ||
      lower.includes('phone') ||
      lower.includes('helpline') ||
      lower.includes('bot number') ||
      lower.includes('hotline')
    ) {
      setTimeout(() => {
        setIsLoading(false);
        playSoundChime();
        const numText = `📱 *PLiMS WhatsApp Web Verified Numbers:*\n\n1. 🏢 *Official Library Helpline & Bot Number:*\n   • Number: \`${officialHelplinePhone}\`\n   • Status: Online & Verified Business Agent\n   • Link: [web.whatsapp.com](https://web.whatsapp.com/send?phone=${normalizePhoneNumber(officialHelplinePhone)})\n\n2. 👤 *Your Connected Original Number:*\n   • Connected Phone: \`${phoneDisplay}\`\n   • Status: ${connectedOriginalPhone ? '✅ Synchronized' : '⚠️ Pending Verification'}\n   • Patron: *${currentUser.name}* (${roleFormatted})\n\nTo update either number, click *"Connected Numbers"* tab or reply:\n• *"Change original number to [Phone]"*\n• *"Change helpline to [Phone]"*`;

        const reply: ChatMessage = {
          id: `agent_${Date.now()}`,
          sender: 'agent',
          text: numText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'READ',
          actionType: 'NUMBERS',
          quickReplies: ['⚙️ Manage Numbers', '📋 Check My Loans', '🔍 Search Catalog']
        };
        setMessages(prev => [...prev, reply]);
        speakText(`The library helpline and bot number is ${officialHelplinePhone}, and your connected original number is ${phoneDisplay}`);
      }, 400);
      return;
    }

    // 1. My Loans & Borrowed Books
    if (lower.includes('my loan') || lower.includes('borrowed') || lower.includes('my book') || lower.includes('due date')) {
      setTimeout(() => {
        setIsLoading(false);
        playSoundChime();
        if (patronLoans.length > 0) {
          const loanText = `📋 *Active WhatsApp Web Loans for ${currentUser.name}:*\n📍 *Branch:* ${activeBranch}\n📱 *Alerts Target:* ${phoneDisplay}\n\nYou currently have *${patronLoans.length}* item(s) checked out:\n` +
            patronLoans.map((l, idx) => `\n${idx + 1}. 📖 *${l.bookTitle}*\n   • Acc #: \`${l.accessionNumber}\`\n   • Due Date: *${l.dueDate}*\n   • Status: ${l.status}`).join('\n') +
            `\n\nTo extend a loan, click *Renew* below or type "Renew [Book Title]".`;

          const reply: ChatMessage = {
            id: `agent_${Date.now()}`,
            sender: 'agent',
            text: loanText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'READ',
            actionType: 'LOANS',
            quickReplies: ['🔄 Renew All Eligible', '💰 Check Fines', '🔍 Search New Books']
          };
          setMessages(prev => [...prev, reply]);
          speakText(`You have ${patronLoans.length} active borrowed books.`);
        } else {
          const reply: ChatMessage = {
            id: `agent_${Date.now()}`,
            sender: 'agent',
            text: `✅ *Account Clear for ${currentUser.name}:*\n📍 *Branch:* ${activeBranch}\n\nYou have *0 active borrowed books* checked out right now.\n• Max Borrowing Limit: *${currentUser.maxBorrowLimit || 5} Books*\n• Pending Fines: *PKR ${currentUser.finePending || 0}*\n\nType *"Search [Topic]"* to find books to borrow!`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'READ',
            quickReplies: ['🔍 Search AI Books', '🕒 Library Hours', '📱 WhatsApp Numbers']
          };
          setMessages(prev => [...prev, reply]);
          speakText('Your library account is clear with zero active loans.');
        }
      }, 500);
      return;
    }

    // 2. Renewals
    if (lower.includes('renew') || lower.includes('extend')) {
      setTimeout(() => {
        setIsLoading(false);
        playSoundChime();
        if (patronLoans.length > 0) {
          if (onRenewTransaction) {
            onRenewTransaction(patronLoans[0].id);
          }
          const reply: ChatMessage = {
            id: `agent_${Date.now()}`,
            sender: 'agent',
            text: `🔄 *WhatsApp Web Loan Renewal Successful!* ✅\n\n• *Title:* ${patronLoans[0].bookTitle}\n• *Acc #:* ${patronLoans[0].accessionNumber}\n• *Extended Loan Duration:* +14 Calendar Days\n• *Patron:* ${currentUser.name} (${phoneDisplay})\n• *Location:* ${activeBranch}\n\nYour renewal confirmation notice has been synchronized with your original WhatsApp account.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'READ',
            quickReplies: ['📋 View Active Loans', '🕒 Branch Hours']
          };
          setMessages(prev => [...prev, reply]);
          speakText('Your loan renewal has been confirmed for 14 days.');
        } else {
          const reply: ChatMessage = {
            id: `agent_${Date.now()}`,
            sender: 'agent',
            text: `ℹ️ *No Active Loans Found to Renew:*\nYou do not currently have any checked-out books requiring renewal.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'READ',
            quickReplies: ['🔍 Search Books', '📋 Check Standing']
          };
          setMessages(prev => [...prev, reply]);
        }
      }, 500);
      return;
    }

    // 3. Search Catalog
    if (lower.startsWith('search') || lower.includes('find book') || lower.includes('kitab')) {
      const cleanTerm = lower.replace(/^(?:search|find\s+book\s+(?:about)?|kitab)\s*/i, '').trim();
      const matches = books.filter(b =>
        b.title.toLowerCase().includes(cleanTerm) ||
        b.authors.some(a => a.toLowerCase().includes(cleanTerm)) ||
        (b.subjects && b.subjects.some(s => s.toLowerCase().includes(cleanTerm))) ||
        (b.department && b.department.toLowerCase().includes(cleanTerm))
      ).slice(0, 3);

      setTimeout(() => {
        setIsLoading(false);
        playSoundChime();
        if (matches.length > 0) {
          let text = `🔍 *WhatsApp Web Catalog Search Results for "${cleanTerm}":*\nFound *${matches.length}* titles matching at *${activeBranch}*:\n`;
          matches.forEach((b, idx) => {
            text += `\n${idx + 1}. 📚 *${b.title}*\n   • Author: ${b.authors.join(', ')}\n   • Call No: \`${b.callNumber}\`\n   • Availability: *${b.availableCopies > 0 ? `✅ ${b.availableCopies} available` : '❌ Checked Out'}*`;
          });
          text += `\n\nReply *"Reserve [Title]"* or click below to place a hold.`;

          const reply: ChatMessage = {
            id: `agent_${Date.now()}`,
            sender: 'agent',
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'READ',
            actionType: 'SEARCH',
            actionData: matches,
            quickReplies: matches.map(b => `Reserve ${b.title.slice(0, 20)}...`)
          };
          setMessages(prev => [...prev, reply]);
          speakText(`Found ${matches.length} matching books in the catalog.`);
        } else {
          const reply: ChatMessage = {
            id: `agent_${Date.now()}`,
            sender: 'agent',
            text: `🔍 No exact title found matching *"${cleanTerm}"* at *${activeBranch}*.\n\nTry searching for broader keywords like *"Artificial Intelligence"*, *"Physics"*, or *"Database"*.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'READ',
            quickReplies: ['📚 Search AI', '📚 Search Python', '🏢 View All Branches']
          };
          setMessages(prev => [...prev, reply]);
        }
      }, 500);
      return;
    }

    // 4. Branch Operating Hours & Fine Policies
    if (lower.includes('hour') || lower.includes('timing') || lower.includes('open') || lower.includes('close')) {
      setTimeout(() => {
        setIsLoading(false);
        playSoundChime();
        const reply: ChatMessage = {
          id: `agent_${Date.now()}`,
          sender: 'agent',
          text: `🕒 *Library Operating Hours for ${activeBranch}:*\n\n• *Monday - Saturday:* 08:00 AM - 10:00 PM\n• *Sunday & Public Holidays:* 10:00 AM - 04:00 PM\n• *WhatsApp Web Agent Hotline:* ${OFFICIAL_LIBRARY_WHATSAPP_NUMBER} (24/7)\n\n📌 *Campus Address:* Academic Block 4, ${activeBranch}\nNeed an inter-branch transfer? Our courier routes connect ${branches.join(', ')}.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'READ',
          quickReplies: ['💰 Overdue Fine Policy', '📋 Check My Loans']
        };
        setMessages(prev => [...prev, reply]);
      }, 400);
      return;
    }

    if (lower.includes('fine') || lower.includes('penalty') || lower.includes('jurmana')) {
      setTimeout(() => {
        setIsLoading(false);
        playSoundChime();
        const isFaculty = currentUser.role === 'FACULTY' || currentUser.role === 'RESEARCH_SCHOLAR';
        const rate = isFaculty ? 'PKR 2.00' : 'PKR 5.00';
        const reply: ChatMessage = {
          id: `agent_${Date.now()}`,
          sender: 'agent',
          text: `💰 *Overdue Fine Policy for ${currentUser.name} (${roleFormatted}):*\n\n• *Current Balance Pending:* PKR *${currentUser.finePending || 0}*\n• *Fine Rate for your Role:* ${rate} per book / calendar day\n• *Grace Period:* 2 calendar days post due date\n• *Payment Methods:* Settle online via patron portal or in person at ${activeBranch} circulation desk.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'READ',
          quickReplies: ['📋 Check My Due Dates', '🔄 Renew Loans']
        };
        setMessages(prev => [...prev, reply]);
      }, 400);
      return;
    }

    // 5. AI Copilot Fallback with WhatsApp Web Context
    try {
      const systemPrompt = `You are the official WhatsApp Web Agent for PLiMS (Pakistan Library Information Management System), assisting a patron who logged in via WhatsApp Web.
Respond concisely, courteously, and helpfully using authentic WhatsApp formatting (*bold*, bullet points, emojis).

AUTHENTICATED WHATSAPP WEB PATRON CONTEXT:
- Patron Name: ${currentUser.name}
- Role: ${currentUser.role}
- Department: ${currentUser.department || 'Academic'}
- Member ID / Code: ${currentUser.memberCode || currentUser.id}
- Linked Original WhatsApp Phone: ${phoneDisplay}
- Official Library WhatsApp Hotline: ${OFFICIAL_LIBRARY_WHATSAPP_NUMBER}
- Active Working Library Branch: ${activeBranch}
- Max Borrowing Quota: ${currentUser.maxBorrowLimit || 5} books
- Current Borrowed Books Count: ${patronLoans.length}
- Pending Overdue Fines: PKR ${currentUser.finePending || 0}
- Campus Branch Network: ${branches.join(', ')}

GUIDELINES:
1. Address the patron personally as "${currentUser.name}".
2. Since they logged in through WhatsApp Web, assure them that their session is securely synchronized with their original phone (+${phoneDisplay}).
3. Tailor recommendations to their specific academic role (${currentUser.role}) and current branch (${activeBranch}).

User inquiry: "${query}"`;

      const aiReply = await askGeminiCopilot(systemPrompt, [
        { sender: 'user', text: query }
      ]);

      const reply: ChatMessage = {
        id: `agent_${Date.now()}`,
        sender: 'agent',
        text: aiReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'READ',
        quickReplies: ['📱 WhatsApp Numbers', '📚 My Active Loans', '🔍 Search Catalog', '🕒 Branch Hours']
      };

      setMessages(prev => [...prev, reply]);
      speakText(aiReply.slice(0, 140));
    } catch {
      const fallback: ChatMessage = {
        id: `agent_${Date.now()}`,
        sender: 'agent',
        text: `Assalam-o-Alaikum ${currentUser.name}! Thank you for contacting the PLiMS WhatsApp Web Agent at *${activeBranch}*.\n\n• Official Helpline & Bot Number: *${officialHelplinePhone}*\n• Your Connected Original Phone: *${phoneDisplay}*\n\nTry sending: *"My active loans"*, *"Renew my books"*, or *"Search Machine Learning"*.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'READ'
      };
      setMessages(prev => [...prev, fallback]);
    } finally {
      setIsLoading(false);
      playSoundChime();
    }
  };

  const handleLaunchExternalWhatsAppWeb = () => {
    const text = `Assalam-o-Alaikum PLiMS Library Assistant! This is ${currentUser.name} (${currentUser.memberCode || currentUser.id}) messaging from ${activeBranch}.`;
    const url = getWhatsAppUniversalUrl(officialHelplinePhone, text);
    try {
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (!win) {
        window.location.href = url;
      }
    } catch {
      window.location.href = url;
    }
  };

  const handleLaunchHandshakeToOriginalPhone = () => {
    const cleanPhone = normalizePhoneNumber(connectedOriginalPhone);
    const text = `Assalam-o-Alaikum ${currentUser.name}! This is the official PLiMS WhatsApp Web verification handshake for ${activeBranch}. Your account is linked.`;
    const url = getWhatsAppUniversalUrl(cleanPhone, text);
    try {
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (!win) {
        window.location.href = url;
      }
    } catch {
      window.location.href = url;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div
        className={`bg-[#111b21] border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-slate-100 transition-all duration-300 ${
          isExpanded ? 'w-[96vw] h-[94vh]' : 'w-full max-w-4xl h-[680px]'
        }`}
      >
        {/* WhatsApp Web Style Top Green Header */}
        <div className="bg-[#008069] px-4 py-3 border-b border-[#006a57] flex items-center justify-between shrink-0 shadow-md">
          {/* Identity & Status */}
          <div className="flex items-center space-x-3 truncate">
            {/* Avatar with Verified Badge */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-white text-[#008069] flex items-center justify-center font-bold text-sm shadow-md">
                <BookOpen className="h-5 w-5 text-[#008069]" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#25D366] text-white flex items-center justify-center border-2 border-[#008069] text-[9px] font-bold">
                ✓
              </span>
            </div>

            <div className="truncate">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-white truncate">WhatsApp Web Agent</h3>
                <span className="px-2 py-0.2 rounded-full bg-white/20 text-white text-[10px] font-bold tracking-wide border border-white/30 shrink-0">
                  Bot: {officialHelplinePhone}
                </span>
              </div>

              <div className="text-[11px] text-emerald-100 flex items-center space-x-2 truncate">
                <span className="flex items-center space-x-1 truncate font-mono">
                  <Smartphone className="h-2.5 w-2.5 text-emerald-200 shrink-0" />
                  <span className="truncate">Original: {phoneDisplay}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('NUMBERS')}
                  className="text-white hover:underline text-[10px] font-bold flex items-center space-x-0.5 shrink-0"
                  title="Connect or change original number & helpline"
                >
                  <Edit3 className="h-2.5 w-2.5" />
                  <span>Change Numbers</span>
                </button>
                <span>•</span>
                <span className="text-white font-medium truncate">{currentUser.name} ({roleFormatted})</span>
              </div>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center space-x-1 shrink-0 text-white">
            {/* Quick QR Authenticator Action Button */}
            <button
              onClick={() => setActiveTab('QR_AUTH')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border shadow-2xs ${
                activeTab === 'QR_AUTH'
                  ? 'bg-white text-[#008069] border-white shadow-xs'
                  : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
              }`}
              title="Open QR Code Generator for Mobile Device Authentication"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">QR Authenticate</span>
            </button>

            {/* Pop out to official WhatsApp Web Browser */}
            <a
              href={getWhatsAppUniversalUrl(officialHelplinePhone)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer text-white inline-flex items-center justify-center"
              title="Open Official WhatsApp Web (wa.me / web.whatsapp.com)"
            >
              <ExternalLink className="h-4 w-4" />
            </a>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer text-white"
              title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-emerald-200" />}
            </button>

            {/* Expand / Minimize */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer text-white hidden sm:block"
              title={isExpanded ? 'Restore Size' : 'Expand Fullscreen'}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/15 transition-colors cursor-pointer text-white ml-1"
              title="Close WhatsApp Web Agent"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* WhatsApp Web Sub-Navigation Bar */}
        <div className="bg-[#202c33] px-4 py-2 border-b border-slate-700/60 flex items-center justify-between text-xs shrink-0 overflow-x-auto no-scrollbar">
          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setActiveTab('CHAT')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'CHAT'
                  ? 'bg-[#00a884] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>WhatsApp Web Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('QR_AUTH')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'QR_AUTH'
                  ? 'bg-[#00a884] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>QR Authenticator</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#25D366] text-[#004d40] text-[9px] font-black uppercase tracking-wider">
                Scan
              </span>
            </button>

            <button
              onClick={() => setActiveTab('NUMBERS')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'NUMBERS'
                  ? 'bg-[#00a884] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Connected Numbers</span>
            </button>

            <button
              onClick={() => setActiveTab('MY_STANDING')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'MY_STANDING'
                  ? 'bg-[#00a884] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>My Standing & Loans ({patronLoans.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('LINK_DEVICE')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'LINK_DEVICE'
                  ? 'bg-[#00a884] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Linked Device</span>
            </button>
          </div>

          {/* Active Branch Indicator */}
          <div className="hidden lg:flex items-center space-x-1.5 text-[11px] text-slate-300 shrink-0 ml-3">
            <Building2 className="h-3.5 w-3.5 text-[#00a884]" />
            <span className="font-semibold text-slate-200">{activeBranch}</span>
          </div>
        </div>

        {/* Body Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-[#0b141a] relative">
          {/* Subtle WhatsApp Wallpaper Pattern */}
          <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#00a884_1.2px,transparent_1.2px)] [background-size:18px_18px]" />

          {/* TAB 1: LIVE CHAT */}
          {activeTab === 'CHAT' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
              {/* Encryption & Session Notice */}
              <div className="py-2 px-4 flex justify-center shrink-0">
                <div className="px-3.5 py-1 rounded-xl bg-[#182229] border border-slate-700/50 text-[10px] text-amber-200/90 flex items-center space-x-1.5 shadow-xs">
                  <ShieldCheck className="h-3 w-3 text-amber-400 shrink-0" />
                  <span>
                    Linked with original phone <strong className="text-white font-mono">{phoneDisplay}</strong>. Library hotline: <strong className="text-[#00a884] font-mono">{officialHelplinePhone}</strong>.
                  </span>
                </div>
              </div>

              {/* Chat Message Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'patron' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-md ${
                        msg.sender === 'patron'
                          ? 'bg-[#005c4b] text-white rounded-tr-none'
                          : 'bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700/40'
                      }`}
                    >
                      <div className="text-[12px]">{msg.text}</div>

                      {/* Message Timestamp & Double Ticks */}
                      <div className="flex items-center justify-end space-x-1 text-[9px] text-slate-400 font-mono mt-1 pt-0.5">
                        <span>{msg.time}</span>
                        {msg.sender === 'patron' && (
                          <span className={msg.status === 'READ' ? 'text-[#53bdeb]' : 'text-slate-400'}>
                            ✓✓
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Reply Action Buttons */}
                    {msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%] sm:max-w-[70%]">
                        {msg.quickReplies.map((qr, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              if (qr === '📱 WhatsApp Numbers' || qr === '⚙️ Manage Numbers') {
                                setActiveTab('NUMBERS');
                              } else if (qr === '📷 QR Authenticate' || qr === '📷 Open QR Authenticator') {
                                setActiveTab('QR_AUTH');
                              } else {
                                handleSendMessage(qr);
                              }
                            }}
                            className="px-2.5 py-1 rounded-full bg-[#1f2c34] hover:bg-[#2a3942] border border-slate-700/70 text-[#00a884] hover:text-white text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                          >
                            {qr}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center space-x-2 p-3 rounded-2xl bg-[#202c33] border border-slate-700/40 text-xs text-slate-400 max-w-[200px] rounded-tl-none">
                    <Loader2 className="h-4 w-4 animate-spin text-[#00a884]" />
                    <span>WhatsApp agent is typing...</span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Message Input Footer */}
              <div className="p-3 bg-[#202c33] border-t border-slate-700/60 shrink-0">
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
                        : 'bg-[#2a3942] hover:bg-slate-700 text-slate-300'
                    }`}
                    title={isListening ? 'Stop Listening' : 'Speak into WhatsApp Web'}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>

                  {/* Input field */}
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder={isListening ? 'Listening to voice...' : 'Type a message to WhatsApp Web agent...'}
                    className="flex-1 bg-[#2a3942] border border-transparent focus:border-[#00a884] rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none transition-all"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className="p-2.5 rounded-full bg-[#00a884] hover:bg-[#008f70] disabled:opacity-40 text-white transition-all cursor-pointer shadow-md"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: QR CODE AUTHENTICATOR (LIVE MOBILE QR GENERATOR) */}
          {activeTab === 'QR_AUTH' && (
            <WhatsAppWebQrAuthenticator
              currentUser={currentUser}
              activeBranch={activeBranch}
              connectedOriginalPhone={connectedOriginalPhone}
              onAuthSuccess={(authenticatedPhone, token) => {
                const formatted = formatWhatsAppPhone(authenticatedPhone);
                setConnectedOriginalPhone(formatted);
                setEditOriginalPhoneInput(formatted);
                if (onUpdateUser) {
                  onUpdateUser(currentUser.id, {
                    authProvider: 'WHATSAPP_WEB',
                    whatsappPhone: formatted,
                    phone: formatted,
                    whatsappLinkedAt: new Date().toISOString()
                  });
                }
                try {
                  localStorage.setItem(`plims_patron_whatsapp_${currentUser.id}`, formatted);
                  window.dispatchEvent(
                    new CustomEvent('plims:patron_whatsapp_updated', {
                      detail: { userId: currentUser.id, phone: formatted }
                    })
                  );
                } catch {
                  // ignore
                }
                const successMsg: ChatMessage = {
                  id: `agent_${Date.now()}`,
                  sender: 'agent',
                  text: `📷 *Mobile Authentication Verified via QR Code!* ✅\n\n• *Token Session:* \`${token}\`\n• *Phone:* \`${formatted}\`\n• *Library Hotline:* \`${officialHelplinePhone}\`\n• *Status:* Mobile session authenticated\n\nYour library account has been verified and paired with WhatsApp Web on your mobile device.`,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  status: 'READ',
                  quickReplies: ['💬 Open WhatsApp Web Chat', '📱 WhatsApp Numbers', '📋 My Active Loans']
                };
                setMessages(prev => [...prev, successMsg]);
                speakText('Mobile device authenticated successfully via QR code.');
              }}
              onNavigateToChat={() => setActiveTab('CHAT')}
            />
          )}

          {/* TAB 3: CONNECTED NUMBERS & ORIGINAL NUMBER LINKING */}
          {activeTab === 'NUMBERS' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5 relative z-10">
              {/* Header Overview */}
              <div className="text-left space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Smartphone className="h-4 w-4 text-[#00a884]" />
                  <span>WhatsApp Web Numbers & Original Connection</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Manage the official library WhatsApp hotline number and connect your original personal mobile number.
                </p>
              </div>

              {/* Grid: Official Library Number & Original User Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Official Library WhatsApp Number Card */}
                <div className="p-5 rounded-3xl bg-[#202c33] border border-slate-700/60 shadow-md space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-[#00a884] text-white flex items-center justify-center font-bold shadow-sm">
                          <MessageSquare className="h-5 w-5 fill-white" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                            <span>Official Library WhatsApp</span>
                            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
                          </div>
                          <div className="text-[10px] text-emerald-400 font-semibold">
                            Verified Business AI Gateway
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        Official
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#111b21] border border-slate-800 space-y-1">
                      <div className="text-[10px] text-slate-400">Official Helpline &amp; Bot Number:</div>
                      <div className="font-mono text-base font-extrabold text-[#00a884] tracking-wide">
                        {officialHelplinePhone}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Campus Branch: <strong className="text-slate-200">{activeBranch}</strong>
                      </div>
                    </div>

                    {/* Interactive Input to Add or Change Official Helpline & Bot Number */}
                    <div className="space-y-2 pt-1 border-t border-slate-800">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        Add or Change Official Helpline &amp; Bot Number:
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <MessageSquare className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={editHelplinePhoneInput}
                            onChange={e => setEditHelplinePhoneInput(e.target.value)}
                            placeholder="+92 300 9876543"
                            className="w-full bg-[#111b21] border border-slate-700 focus:border-[#00a884] rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSaveHelplineNumber(editHelplinePhoneInput)}
                          disabled={isSavingHelpline || !editHelplinePhoneInput.trim()}
                          className="py-2 px-3 rounded-xl bg-[#00a884] hover:bg-[#008f70] disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0 flex items-center space-x-1"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{isSavingHelpline ? 'Saving...' : 'Save Helpline'}</span>
                        </button>
                      </div>

                      {helplineSaveSuccess && (
                        <div className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1 animate-in fade-in">
                          <Check className="h-3 w-3" />
                          <span>Official helpline &amp; bot number updated successfully!</span>
                        </div>
                      )}

                      {/* Quick helpers */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setEditHelplinePhoneInput(connectedOriginalPhone)}
                          className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-[#25D366] text-[10px] font-medium transition-colors cursor-pointer border border-emerald-500/30"
                        >
                          Use My Original Number ({phoneDisplay})
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditHelplinePhoneInput('+92 300 9876543')}
                          className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-colors cursor-pointer"
                        >
                          Reset to +92 300 9876543
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 space-y-1">
                      <div>• Automated circulation renewals &amp; hold alerts</div>
                      <div>• 24/7 OPAC catalog book search via WhatsApp Web</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(officialHelplinePhone);
                        setCopiedOfficial(true);
                        setTimeout(() => setCopiedOfficial(false), 2000);
                      }}
                      className="py-2 px-3 rounded-xl bg-[#2a3942] hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      {copiedOfficial ? <Check className="h-3.5 w-3.5 text-[#00a884]" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedOfficial ? 'Copied' : 'Copy'}</span>
                    </button>

                    <a
                      href={getWhatsAppUniversalUrl(
                        officialHelplinePhone,
                        `Assalam-o-Alaikum PLiMS Library Assistant! This is ${currentUser.name} (${currentUser.memberCode || currentUser.id}) messaging from ${activeBranch}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-[#00a884] hover:bg-[#008f70] text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md"
                      title="Open chat on WhatsApp (Native App or Web)"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Chat on WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* 2. Patron's Original Connected Number Card */}
                <div className="p-5 rounded-3xl bg-[#202c33] border border-slate-700/60 shadow-md space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold shadow-sm">
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                            <span>Your Original WhatsApp Number</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {currentUser.name} ({roleFormatted})
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full bg-[#00a884]/20 text-[#00a884] text-[10px] font-bold border border-[#00a884]/30">
                        {connectedOriginalPhone ? 'Connected' : 'Unbound'}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#111b21] border border-slate-800 space-y-1">
                      <div className="text-[10px] text-slate-400">Active Connected Original Number:</div>
                      <div className="font-mono text-base font-extrabold text-white tracking-wide">
                        {phoneDisplay}
                      </div>
                      <div className="text-[10px] text-emerald-400">
                        ✓ Registered to {currentUser.memberCode || currentUser.id}
                      </div>
                    </div>

                    {/* Interactive Input to Connect or Change Original Number */}
                    <div className="space-y-2 pt-1 border-t border-slate-800">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        Connect or Change Your Original Mobile Number:
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={editOriginalPhoneInput}
                            onChange={e => setEditOriginalPhoneInput(e.target.value)}
                            placeholder="+92 300 9876543"
                            className="w-full bg-[#111b21] border border-slate-700 focus:border-[#00a884] rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSaveOriginalNumber(editOriginalPhoneInput)}
                          disabled={isSavingOriginal || !editOriginalPhoneInput.trim()}
                          className="py-2 px-3 rounded-xl bg-[#00a884] hover:bg-[#008f70] disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0 flex items-center space-x-1"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{isSavingOriginal ? 'Saving...' : 'Connect Number'}</span>
                        </button>
                      </div>

                      {originalSaveSuccess && (
                        <div className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1 animate-in fade-in">
                          <Check className="h-3 w-3" />
                          <span>Original number connected and saved successfully!</span>
                        </div>
                      )}

                      {/* Quick preset chips */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setEditOriginalPhoneInput(officialHelplinePhone)}
                          className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-[#25D366] text-[10px] font-medium transition-colors cursor-pointer border border-emerald-500/30"
                        >
                          Use Helpline Number ({officialHelplinePhone})
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditOriginalPhoneInput('+92 300 9876543')}
                          className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-colors cursor-pointer"
                        >
                          +92 300 9876543
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditOriginalPhoneInput('+92 300 8765432')}
                          className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-colors cursor-pointer"
                        >
                          +92 300 8765432
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(connectedOriginalPhone);
                        setCopiedOriginal(true);
                        setTimeout(() => setCopiedOriginal(false), 2000);
                      }}
                      className="py-2 px-3 rounded-xl bg-[#2a3942] hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      {copiedOriginal ? <Check className="h-3.5 w-3.5 text-[#00a884]" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedOriginal ? 'Copied' : 'Copy'}</span>
                    </button>

                    <a
                      href={getWhatsAppUniversalUrl(
                        connectedOriginalPhone || '+923009876543',
                        `Assalam-o-Alaikum ${currentUser.name}! This is the official PLiMS WhatsApp Web verification handshake for ${activeBranch}. Your account is linked.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-[#2a3942] hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer text-center"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Ping My Original Phone</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MY STANDING & ACTIVE LOANS */}
          {activeTab === 'MY_STANDING' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5 relative z-10">
              {/* Patron Info Card */}
              <div className="p-4 rounded-2xl bg-[#202c33] border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#00a884] text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{currentUser.name}</h4>
                    <p className="text-[11px] text-slate-400">
                      {currentUser.memberCode || currentUser.id} • {roleFormatted} • {currentUser.department || 'Academic'}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                      📱 Original WhatsApp: {phoneDisplay}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-right">
                  <div className="p-2.5 rounded-xl bg-[#111b21] border border-slate-800 text-center min-w-[90px]">
                    <div className="text-[10px] text-slate-400">Borrow Limit</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {patronLoans.length} / {currentUser.maxBorrowLimit || 5}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#111b21] border border-slate-800 text-center min-w-[90px]">
                    <div className="text-[10px] text-slate-400">Pending Fines</div>
                    <div className={`text-sm font-bold mt-0.5 ${currentUser.finePending > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      PKR {currentUser.finePending || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Loans List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <BookOpen className="h-4 w-4 text-[#00a884]" />
                    <span>Checked-Out Books ({patronLoans.length})</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">14-day borrowing standard</span>
                </div>

                {patronLoans.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-[#182229] border border-slate-800 text-slate-400 space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-[#00a884] mx-auto opacity-70" />
                    <p className="text-xs font-bold text-slate-200">No Active Borrowed Books</p>
                    <p className="text-[11px] text-slate-500">Your account is clear. You can borrow up to {currentUser.maxBorrowLimit || 5} books.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {patronLoans.map(loan => (
                      <div
                        key={loan.id}
                        className="p-4 rounded-2xl bg-[#182229] border border-slate-700/60 shadow-sm flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <h5 className="font-bold text-xs text-white leading-snug">{loan.bookTitle}</h5>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30 shrink-0 ml-2">
                              {loan.status}
                            </span>
                          </div>

                          <div className="mt-2 space-y-1 text-[11px] text-slate-400">
                            <div>Accession Barcode: <code className="text-slate-200 font-mono">{loan.accessionNumber}</code></div>
                            <div>Borrow Date: <span className="text-slate-300">{loan.issueDate}</span></div>
                            <div className="text-amber-300 font-medium">Return Due Date: <strong>{loan.dueDate}</strong></div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">{activeBranch}</span>
                          <button
                            onClick={() => {
                              if (onRenewTransaction) onRenewTransaction(loan.id);
                              handleSendMessage(`Renew ${loan.bookTitle}`);
                              setActiveTab('CHAT');
                            }}
                            className="px-3 py-1 rounded-xl bg-[#00a884] hover:bg-[#008f70] text-white text-[10px] font-bold transition-all cursor-pointer shadow-xs flex items-center space-x-1"
                          >
                            <RotateCw className="h-3 w-3" />
                            <span>Renew (14 Days)</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: LINKED DEVICE & QR SYNC */}
          {activeTab === 'LINK_DEVICE' && (
            <div className="flex-1 overflow-y-auto p-5 relative z-10 flex flex-col items-center justify-center text-center space-y-5">
              <div className="max-w-md w-full p-6 rounded-3xl bg-[#202c33] border border-slate-700/60 shadow-xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#00a884] text-white flex items-center justify-center mx-auto shadow-md">
                  <QrCode className="h-6 w-6" />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">WhatsApp Web Synchronized</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Your account is actively linked to original WhatsApp phone <strong className="text-[#00a884] font-mono">{phoneDisplay}</strong>.
                  </p>
                </div>

                {qrCodeDataUrl && (
                  <div className="p-3 bg-white rounded-2xl inline-block shadow-lg mx-auto">
                    <img src={qrCodeDataUrl} alt="WhatsApp Web Sync QR" className="w-44 h-44 mx-auto" />
                  </div>
                )}

                <div className="p-3 rounded-xl bg-[#111b21] border border-slate-800 text-[11px] text-slate-300 text-left space-y-1">
                  <div className="font-bold text-white flex items-center space-x-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#00a884]" />
                    <span>Active Features on WhatsApp Web:</span>
                  </div>
                  <div>• Due date reminders sent 24 hours prior to return</div>
                  <div>• Real-time reservations and pickup holds</div>
                  <div>• Direct WhatsApp conversation with AI librarian on {officialHelplinePhone}</div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <a
                    href={getWhatsAppUniversalUrl(
                      officialHelplinePhone,
                      `Assalam-o-Alaikum PLiMS Library Assistant! This is ${currentUser.name} (${currentUser.memberCode || currentUser.id}) messaging from ${activeBranch}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#00a884] hover:bg-[#008f70] text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md text-center"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open in web.whatsapp.com</span>
                  </a>

                  <button
                    onClick={() => setActiveTab('NUMBERS')}
                    className="py-2.5 px-4 rounded-xl bg-[#2a3942] hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
                  >
                    Manage Numbers
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppWebAgent;
