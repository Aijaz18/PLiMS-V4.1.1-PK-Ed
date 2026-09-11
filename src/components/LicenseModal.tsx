import React, { useState } from 'react';
import {
  Scale,
  FileText,
  Check,
  Copy,
  Download,
  X,
  ShieldCheck,
  Code,
  Heart,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const PLIMS_LICENSE_TEXT = `MIT License

Copyright (c) 2026 PLiMS (Pakistan Library Information Management System) Open Source Project
Created by Mr. Aijaz Akhter Ahmedani and Sara Khan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'LICENSE' | 'PERMISSIONS' | 'CONTRIBUTE'>('LICENSE');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(PLIMS_LICENSE_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([PLIMS_LICENSE_TEXT], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'LICENSE.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="p-5 border-b border-[#27272a] flex items-center justify-between bg-[#18181b]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">PLiMS Open Source Software License</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase">
                  MIT Licensed
                </span>
              </div>
              <p className="text-xs text-[#a1a1aa]">Free & Open Source Software (FOSS) for Library Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center space-x-1 p-2 bg-[#09090b] border-b border-[#27272a]">
          <button
            onClick={() => setActiveTab('LICENSE')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'LICENSE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>License Terms</span>
          </button>

          <button
            onClick={() => setActiveTab('PERMISSIONS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'PERMISSIONS'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Permissions Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('CONTRIBUTE')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'CONTRIBUTE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            <span>Open Source Project</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'LICENSE' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 text-xs text-emerald-300 font-medium">
                  <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>PLiMS is released as 100% Free and Open Source Software under the MIT License.</span>
                </div>
              </div>

              <div className="relative">
                <pre className="font-mono text-xs text-zinc-300 bg-[#09090b] p-4 rounded-xl border border-[#27272a] overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
                  {PLIMS_LICENSE_TEXT}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'PERMISSIONS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                    <Check className="h-4 w-4" />
                    <span>Commercial Use</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Allowed to run, deploy, and utilize PLiMS across public and private educational institutions.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 space-y-2">
                  <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs">
                    <Check className="h-4 w-4" />
                    <span>Modification</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Allowed to customize, extend modules, add custom library schemas, and alter code freely.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 space-y-2">
                  <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
                    <Check className="h-4 w-4" />
                    <span>Distribution</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Allowed to copy, share, and re-distribute modified versions with copyright notices intact.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#27272a] bg-[#18181b] space-y-2 text-xs">
                <h4 className="font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                  <span>License Conditions</span>
                </h4>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. Provided as-is without warranty.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'CONTRIBUTE' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-[#27272a] bg-[#18181b] space-y-3">
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-400 fill-red-400/20" />
                  <h3 className="text-sm font-bold text-white">Authors & Creators</h3>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  PLiMS (Pakistan Library Information Management System) was designed, authored, and copyrighted by:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-[#09090b] border border-[#27272a]">
                    <div className="text-xs font-bold text-emerald-400">Mr. Aijaz Akhter Ahmedani</div>
                    <div className="text-[10px] text-zinc-500">Co-Creator & Library Information Architect</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#09090b] border border-[#27272a]">
                    <div className="text-xs font-bold text-emerald-400">Sara Khan</div>
                    <div className="text-[10px] text-zinc-500">Co-Creator & Lead Software Engineer</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#27272a] bg-[#18181b] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl border border-[#27272a] bg-[#09090b] hover:bg-[#27272a] text-zinc-300 text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied License' : 'Copy License Text'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-2 rounded-xl border border-[#27272a] bg-[#09090b] hover:bg-[#27272a] text-zinc-300 text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-blue-400" />
              <span>Download LICENSE.txt</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            Close License View
          </button>
        </div>
      </div>
    </div>
  );
};
