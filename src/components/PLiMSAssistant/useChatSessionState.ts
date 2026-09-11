import { useState, useEffect } from 'react';
import { UserProfile } from '../../types/alims';

export interface ChatSessionData {
  initialArrivalTime: string;
  lastVisitTime: string | null;
  visitCount: number;
  hasInteractedBefore: boolean;
}

const STORAGE_KEY = 'plims_chatbot_session_v1';

export const useChatSessionState = (currentUser?: UserProfile) => {
  const [session, setSession] = useState<ChatSessionData>(() => {
    const now = new Date().toISOString();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const updatedCount = (parsed.visitCount || 1) + 1;
        return {
          initialArrivalTime: parsed.initialArrivalTime || now,
          lastVisitTime: parsed.lastVisitTime || parsed.initialArrivalTime || now,
          visitCount: updatedCount,
          hasInteractedBefore: true
        };
      }
    } catch (e) {
      console.warn('Failed to load chat session state:', e);
    }

    return {
      initialArrivalTime: now,
      lastVisitTime: null,
      visitCount: 1,
      hasInteractedBefore: false
    };
  });

  // Save session state updates to localStorage
  useEffect(() => {
    try {
      const now = new Date().toISOString();
      const payload = {
        initialArrivalTime: session.initialArrivalTime,
        lastVisitTime: now,
        visitCount: session.visitCount,
        hasInteractedBefore: true
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save chat session state:', e);
    }
  }, [session.visitCount]);

  // Format relative last visit time
  const getFormattedLastVisit = (): string => {
    if (!session.lastVisitTime) return '';
    const lastDate = new Date(session.lastVisitTime);
    const now = new Date();
    const diffMs = now.getTime() - lastDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 2) return 'just a moment ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
  };

  // Generate dynamic personalized welcome message
  const getPersonalizedWelcome = (defaultWelcome: string): string => {
    const userName = currentUser?.name || 'Patron';
    const lastVisitStr = getFormattedLastVisit();

    if (session.hasInteractedBefore && session.visitCount > 1) {
      const returnNote = lastVisitStr
        ? ` (Last visited ${lastVisitStr})`
        : '';
      return `👋 Welcome back, ${userName}!${returnNote}\n\nGlad to see you again at the PLiMS Library portal. I remembered your previous session (Visit #${session.visitCount}).\n\nHow can I assist you with book searches, holdings, or catalog services today?`;
    }

    return defaultWelcome;
  };

  return {
    session,
    isReturningUser: session.hasInteractedBefore && session.visitCount > 1,
    formattedLastVisit: getFormattedLastVisit(),
    getPersonalizedWelcome
  };
};
