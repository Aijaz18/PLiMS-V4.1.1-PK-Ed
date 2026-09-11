import { BookRecord, UserProfile, CirculationTransaction, SystemSettings, DigitalAsset, BookReservation } from '../../types/alims';

export type LanguageCode = 'en' | 'ur' | 'roman_ur';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  language?: LanguageCode;
  suggestedBooks?: BookRecord[];
  suggestedDigitalAssets?: DigitalAsset[];
  intent?: string;
  actionType?:
    | 'SEARCH'
    | 'RESERVATION_PROMPT'
    | 'RENEWAL_PROMPT'
    | 'ACCOUNT_VIEW'
    | 'FAQ'
    | 'DIGITAL_ASSETS'
    | 'RECOMMENDATIONS'
    | 'LIBRARIAN_ANALYTICS'
    | 'BOOK_ISSUED'
    | 'BOOK_RETURNED'
    | 'MEMBER_SELECTION_PROMPT';
  actionData?: any;
  isVoiceCommand?: boolean;
}

export interface AssistantConfig {
  assistantName: string;
  subtitle: string;
  welcomeMessage: string;
  operatingHours: string;
  contactEmail: string;
  contactPhone: string;
  supportedLanguages: LanguageCode[];
  faqDatabase: { question: string; answer: string; category: string }[];
  analytics: {
    totalConversations: number;
    searchesExecuted: number;
    reservationsPlaced: number;
    renewalsProcessed: number;
    userSatisfactionPct: number;
    topSearchTerms: { term: string; count: number }[];
    languageBreakdown: { en: number; ur: number; roman_ur: number };
  };
}
