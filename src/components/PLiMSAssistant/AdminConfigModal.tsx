import React, { useState } from 'react';
import {
  Settings,
  X,
  Save,
  BarChart2,
  CheckCircle2,
  HelpCircle,
  Clock,
  Mail,
  Phone,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Bookmark,
  RotateCcw,
  Languages
} from 'lucide-react';
import { AssistantConfig, LanguageCode } from './types';

interface AdminConfigModalProps {
  config: AssistantConfig;
  onSaveConfig: (updated: AssistantConfig) => void;
  onClose: () => void;
}

export const AdminConfigModal: React.FC<AdminConfigModalProps> = ({
  config,
  onSaveConfig,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'ANALYTICS' | 'FAQ'>('SETTINGS');
  const [formData, setFormData] = useState<AssistantConfig>(config);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-xs text-[#fafafa]">
        {/* Header */}
        <div className="p-4 bg-[#18181b] border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <Settings className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#fafafa]">PLiMS AI Assistant Administrator Desk</h3>
              <p className="text-[11px] text-[#a1a1aa]">Librarian Copilot & Knowledge Engine Controls</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#27272a] text-[#71717a] hover:text-[#fafafa] hover:bg-[#27272a] transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#27272a] bg-[#09090b]">
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`flex-1 py-3 text-center font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'SETTINGS'
                ? 'border-blue-500 text-blue-400 bg-[#121214]'
                : 'border-transparent text-[#a1a1aa] hover:text-[#fafafa]'
            }`}
          >
            Assistant Settings
          </button>
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`flex-1 py-3 text-center font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'ANALYTICS'
                ? 'border-blue-500 text-blue-400 bg-[#121214]'
                : 'border-transparent text-[#a1a1aa] hover:text-[#fafafa]'
            }`}
          >
            Usage Analytics
          </button>
          <button
            onClick={() => setActiveTab('FAQ')}
            className={`flex-1 py-3 text-center font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'FAQ'
                ? 'border-blue-500 text-blue-400 bg-[#121214]'
                : 'border-transparent text-[#a1a1aa] hover:text-[#fafafa]'
            }`}
          >
            FAQ Knowledge Base
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'SETTINGS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#a1a1aa] mb-1 font-semibold">Assistant Display Name</label>
                  <input
                    type="text"
                    value={formData.assistantName}
                    onChange={e => setFormData({ ...formData, assistantName: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs text-[#fafafa] focus:outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#a1a1aa] mb-1 font-semibold">Subtitle Header</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs text-[#fafafa] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#a1a1aa] mb-1 font-semibold">Welcome Prompt Greeting</label>
                <textarea
                  rows={3}
                  value={formData.welcomeMessage}
                  onChange={e => setFormData({ ...formData, welcomeMessage: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500/50 rounded-xl p-3 text-xs text-[#fafafa] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 font-mono">
                <div>
                  <label className="block text-[11px] text-[#a1a1aa] mb-1 font-semibold font-sans">Operating Hours</label>
                  <input
                    type="text"
                    value={formData.operatingHours}
                    onChange={e => setFormData({ ...formData, operatingHours: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs text-[#fafafa] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#a1a1aa] mb-1 font-semibold font-sans">Contact Email</label>
                  <input
                    type="text"
                    value={formData.contactEmail}
                    onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs text-[#fafafa] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#a1a1aa] mb-1 font-semibold font-sans">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs text-[#fafafa] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ANALYTICS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
                <div className="p-3 rounded-xl bg-[#18181b] border border-[#27272a]">
                  <div className="text-base font-bold text-blue-400">{formData.analytics.totalConversations}</div>
                  <div className="text-[10px] text-[#a1a1aa]">Conversations</div>
                </div>

                <div className="p-3 rounded-xl bg-[#18181b] border border-[#27272a]">
                  <div className="text-base font-bold text-emerald-400">{formData.analytics.searchesExecuted}</div>
                  <div className="text-[10px] text-[#a1a1aa]">Searches Executed</div>
                </div>

                <div className="p-3 rounded-xl bg-[#18181b] border border-[#27272a]">
                  <div className="text-base font-bold text-amber-400">{formData.analytics.reservationsPlaced}</div>
                  <div className="text-[10px] text-[#a1a1aa]">Holds Placed</div>
                </div>

                <div className="p-3 rounded-xl bg-[#18181b] border border-[#27272a]">
                  <div className="text-base font-bold text-purple-400">{formData.analytics.userSatisfactionPct}%</div>
                  <div className="text-[10px] text-[#a1a1aa]">Satisfaction Score</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#18181b] border border-[#27272a] space-y-2">
                <h4 className="font-bold text-xs text-[#fafafa] flex items-center space-x-1.5">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  <span>Most Frequent Search Terms</span>
                </h4>
                <div className="space-y-1 font-mono text-[11px]">
                  {formData.analytics.topSearchTerms.map((item, idx) => (
                    <div key={idx} className="flex justify-between p-1.5 rounded bg-[#09090b] border border-[#27272a]">
                      <span>{item.term}</span>
                      <span className="text-blue-400 font-bold">{item.count} queries</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'FAQ' && (
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-[#fafafa] flex items-center space-x-1.5">
                <HelpCircle className="h-4 w-4 text-amber-400" />
                <span>Configured Library Knowledge Base Questions ({formData.faqDatabase.length})</span>
              </h4>

              <div className="space-y-2">
                {formData.faqDatabase.map((faq, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#18181b] border border-[#27272a] space-y-1">
                    <div className="font-bold text-[#fafafa]">{faq.question}</div>
                    <div className="text-[11px] text-[#a1a1aa] leading-relaxed">{faq.answer}</div>
                    <span className="inline-block px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[9px] font-mono">
                      Category: {faq.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#18181b] border-t border-[#27272a] flex items-center justify-between">
          {savedSuccess ? (
            <span className="text-emerald-400 text-xs font-bold flex items-center space-x-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>Configuration Saved Successfully!</span>
            </span>
          ) : (
            <span className="text-[11px] text-[#71717a] font-mono">PLiMS v3.0 LIS Copilot Admin</span>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#27272a] hover:bg-[#27272a] font-semibold text-xs transition-all cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-lg shadow-purple-600/20"
            >
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
