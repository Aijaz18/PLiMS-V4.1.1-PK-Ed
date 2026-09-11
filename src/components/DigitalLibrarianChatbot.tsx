import React from 'react';
import { BookRecord, UserProfile, CirculationTransaction } from '../types/alims';
import { PLiMSAssistant } from './PLiMSAssistant/PLiMSAssistant';

export interface DigitalLibrarianChatbotProps {
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

export const DigitalLibrarianChatbot: React.FC<DigitalLibrarianChatbotProps> = (props) => {
  return <PLiMSAssistant {...props} />;
};

export default DigitalLibrarianChatbot;
