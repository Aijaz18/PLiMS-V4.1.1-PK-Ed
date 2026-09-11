import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Bot, User } from 'lucide-react';
import { BookRecord } from '../../types/alims';
import { askGeminiCopilot } from '../../services/geminiService';

interface AiAssistantModuleProps {
  books?: BookRecord[];
}

export const AiAssistantModule: React.FC<AiAssistantModuleProps> = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    {
      sender: 'ai',
      text: 'Hello! I am the Gemini 3.7 Flash Library Copilot for PLiMS. How can I assist with MARC21/RDA cataloguing, DDC classification, research citations, or circulation rules today?'
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
      <div className="border-b border-[#27272a] pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#fafafa] flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <span>Gemini AI Library Assistant</span>
          </h2>
          <p className="text-xs text-[#a1a1aa]">
            Powered by Gemini 3.7 Flash • Senior Library & Information Science Copilot
          </p>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Online</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl border border-[#27272a] bg-[#121214] h-[520px] flex flex-col justify-between space-y-4 shadow-xl">
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.sender === 'ai' && (
                <div className="h-7 w-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5 text-purple-300">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`p-3.5 rounded-2xl max-w-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                  m.sender === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-bl-none'
                }`}
              >
                {m.text}
              </div>
              {m.sender === 'user' && (
                <div className="h-7 w-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5 text-zinc-300">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="h-7 w-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-300">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-[#09090b] border border-[#27272a] text-zinc-400 text-xs flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                <span>Gemini is generating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 pt-2 border-t border-[#27272a]">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            placeholder="Ask Gemini AI for MARC21 cataloguing, DDC classification, circulation policies..."
            className="flex-1 rounded-xl border border-[#27272a] bg-[#09090b] px-4 py-2.5 text-xs text-[#fafafa] focus:outline-none focus:border-purple-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !query.trim()}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-md"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
