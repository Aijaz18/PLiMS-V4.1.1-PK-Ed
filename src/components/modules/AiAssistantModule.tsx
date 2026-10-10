import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, BookOpen } from 'lucide-react';
import { BookRecord, UserProfile, CirculationTransaction } from '../../types/alims';
import { askGeminiCopilot } from '../../services/geminiService';

interface AiAssistantModuleProps {
  books?: BookRecord[];
  users?: UserProfile[];
  currentUser?: UserProfile;
  activeBranch?: string;
  transactions?: CirculationTransaction[];
}

export const AiAssistantModule: React.FC<AiAssistantModuleProps> = ({
  books = [],
  currentUser,
  activeBranch = 'Central Academic Library'
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    {
      sender: 'ai',
      text: `Hello ${currentUser?.name || 'Patron'}! How can I assist with MARC21 cataloguing, DDC classification, research citations, or circulation guidelines for ${activeBranch} today?`
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;
    const userMsg = query.trim();
    const updatedHistory = [...messages, { sender: 'user' as const, text: userMsg }];
    setMessages(updatedHistory);
    setQuery('');
    setIsLoading(true);

    try {
      const aiReply = await askGeminiCopilot(userMsg, updatedHistory);
      setMessages(prev => [...prev, { sender: 'ai', text: aiReply }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: 'I encountered an issue generating a response. Please verify your connection or try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="border-b border-slate-200/90 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span>Library Research & Reference Desk</span>
          </h2>
          <p className="text-xs text-slate-500">
            Cataloguing Assistance, DDC Classification & Research Citations • {activeBranch}
          </p>
        </div>
      </div>

      <div className="p-4 rounded-2xl border border-slate-200/90 bg-white h-[520px] flex flex-col justify-between space-y-4 shadow-xl">
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.sender === 'ai' && (
                <div className="h-7 w-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5 text-blue-600">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`p-3.5 rounded-2xl max-w-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-[#f1f5f9] border border-slate-200/90 text-slate-900 rounded-bl-none'
                }`}
              >
                {m.text}
              </div>
              {m.sender === 'user' && (
                <div className="h-7 w-7 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center shrink-0 mt-0.5 text-slate-700">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="h-7 w-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-600">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-[#f1f5f9] border border-slate-200/90 text-slate-500 text-xs flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span>Searching reference database...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-200/90">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            placeholder="Ask about MARC21 cataloguing, DDC classification, research guidelines..."
            className="flex-1 rounded-xl border border-slate-200/90 bg-[#f1f5f9] px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !query.trim()}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-md"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantModule;
