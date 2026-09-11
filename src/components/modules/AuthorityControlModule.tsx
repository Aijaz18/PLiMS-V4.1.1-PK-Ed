import React, { useState } from 'react';
import { ShieldCheck, Plus, Search, Tag, Trash2, Edit, CheckCircle2, XCircle, Sparkles, BookOpen } from 'lucide-react';

interface AuthorityRecord {
  id: string;
  lccn: string;
  heading: string;
  type: 'TOPICAL_SUBJECT' | 'PERSONAL_NAME' | 'CORPORATE_BODY' | 'GEOGRAPHIC_NAME';
  marcTag: string; // 150, 100, 110, 151
  seeAlso: string[];
  scopeNote: string;
  status: 'VERIFIED' | 'PROVISIONAL';
}

const INITIAL_AUTHORITIES: AuthorityRecord[] = [
  {
    id: 'auth_1',
    lccn: 'sh85003662',
    heading: 'Algorithms -- Data structures (Computer science)',
    type: 'TOPICAL_SUBJECT',
    marcTag: '150',
    seeAlso: ['Computer programming', 'Software engineering'],
    scopeNote: 'Here are entered works on structural organization of data for algorithmic efficiency.',
    status: 'VERIFIED'
  },
  {
    id: 'auth_2',
    lccn: 'sh90001284',
    heading: 'Artificial intelligence -- Educational applications',
    type: 'TOPICAL_SUBJECT',
    marcTag: '150',
    seeAlso: ['Machine learning', 'Intelligent tutoring systems'],
    scopeNote: 'Covering AI language models, automated grading, and smart cataloguing tools.',
    status: 'VERIFIED'
  },
  {
    id: 'auth_3',
    lccn: 'n79021164',
    heading: 'Library of Congress. Cataloging Distribution Service',
    type: 'CORPORATE_BODY',
    marcTag: '110',
    seeAlso: ['MARC standards', 'Z39.50 protocols'],
    scopeNote: 'Official distribution body for LCSH and MARC21 documentation.',
    status: 'VERIFIED'
  },
  {
    id: 'auth_4',
    lccn: 'n80012345',
    heading: 'Ahmedani, Aijaz Akhter, 1978-',
    type: 'PERSONAL_NAME',
    marcTag: '100',
    seeAlso: ['Pakistan Library Management System (PLiMS)'],
    scopeNote: 'Chief Architect and Pioneer of PLiMS open-source automation platform.',
    status: 'VERIFIED'
  }
];

export const AuthorityControlModule: React.FC = () => {
  const [authorities, setAuthorities] = useState<AuthorityRecord[]>(INITIAL_AUTHORITIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form States
  const [newHeading, setNewHeading] = useState('');
  const [newLccn, setNewLccn] = useState('');
  const [newType, setNewType] = useState<AuthorityRecord['type']>('TOPICAL_SUBJECT');
  const [newMarcTag, setNewMarcTag] = useState('150');
  const [newScopeNote, setNewScopeNote] = useState('');
  const [newSeeAlso, setNewSeeAlso] = useState('');

  const handleAddAuthority = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHeading.trim()) return;

    const record: AuthorityRecord = {
      id: `auth_${Date.now()}`,
      lccn: newLccn || `lcsh_${Math.floor(100000 + Math.random() * 900000)}`,
      heading: newHeading.trim(),
      type: newType,
      marcTag: newMarcTag,
      seeAlso: newSeeAlso ? newSeeAlso.split(',').map(s => s.trim()) : [],
      scopeNote: newScopeNote || 'Standardized authority heading entry.',
      status: 'VERIFIED'
    };

    setAuthorities([record, ...authorities]);
    setIsAddModalOpen(false);

    // Reset Form
    setNewHeading('');
    setNewLccn('');
    setNewScopeNote('');
    setNewSeeAlso('');
  };

  const handleDeleteAuthority = (id: string) => {
    if (confirm('Are you sure you want to remove this Authority Heading record?')) {
      setAuthorities(authorities.filter(a => a.id !== id));
    }
  };

  const filteredAuthorities = authorities.filter(a => {
    const matchesSearch =
      a.heading.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.lccn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.scopeNote.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'ALL' || a.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="p-6 rounded-2xl bg-[#121214] border border-[#27272a] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>LCSH & MARC21 Vocabulary Control</span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-[#fafafa]">Authority Control (LCSH)</h1>
          <p className="text-xs text-[#a1a1aa] mt-1">
            Manage standardized Library of Congress subject headings, personal names, corporate bodies, and cross-references.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Authority Heading</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#121214] border border-[#27272a] grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-8 relative">
          <Search className="h-4 w-4 text-[#a1a1aa] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search headings, LCCN, or scope notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] placeholder-[#a1a1aa] focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="md:col-span-4">
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] focus:border-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Authority Types</option>
            <option value="TOPICAL_SUBJECT">Topical Subject (MARC 150)</option>
            <option value="PERSONAL_NAME">Personal Name (MARC 100)</option>
            <option value="CORPORATE_BODY">Corporate Body (MARC 110)</option>
            <option value="GEOGRAPHIC_NAME">Geographic Name (MARC 151)</option>
          </select>
        </div>
      </div>

      {/* Authority List Table */}
      <div className="rounded-2xl border border-[#27272a] bg-[#121214] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between text-xs text-[#a1a1aa]">
          <span>Showing {filteredAuthorities.length} Authority Records</span>
          <span className="font-mono text-[10px] text-indigo-400">Standard: MARC21 / LCSH 2026</span>
        </div>

        <div className="divide-y divide-[#27272a]">
          {filteredAuthorities.map(rec => (
            <div key={rec.id} className="p-5 hover:bg-[#18181b]/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono text-[10px] font-bold">
                    MARC {rec.marcTag}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#09090b] text-[#a1a1aa] border border-[#27272a] font-mono text-[10px]">
                    LCCN: {rec.lccn}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{rec.status}</span>
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#fafafa]">{rec.heading}</h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">{rec.scopeNote}</p>

                {rec.seeAlso.length > 0 && (
                  <div className="flex items-center space-x-2 text-[11px] text-[#a1a1aa] pt-1">
                    <span className="font-semibold text-indigo-400">See Also (5XX):</span>
                    {rec.seeAlso.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-[#09090b] border border-[#27272a] text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleDeleteAuthority(rec.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Authority Heading Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-[#27272a] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h2 className="text-base font-bold text-[#fafafa] flex items-center space-x-2">
                <Plus className="h-5 w-5 text-indigo-400" />
                <span>Add Authority Heading</span>
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#a1a1aa] hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAuthority} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#a1a1aa] font-semibold mb-1">Standard Heading Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quantum computing -- Industrial applications"
                  value={newHeading}
                  onChange={e => setNewHeading(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a1a1aa] font-semibold mb-1">Authority Type</label>
                  <select
                    value={newType}
                    onChange={e => {
                      const val = e.target.value as AuthorityRecord['type'];
                      setNewType(val);
                      if (val === 'TOPICAL_SUBJECT') setNewMarcTag('150');
                      if (val === 'PERSONAL_NAME') setNewMarcTag('100');
                      if (val === 'CORPORATE_BODY') setNewMarcTag('110');
                      if (val === 'GEOGRAPHIC_NAME') setNewMarcTag('151');
                    }}
                    className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="TOPICAL_SUBJECT">Topical Subject</option>
                    <option value="PERSONAL_NAME">Personal Name</option>
                    <option value="CORPORATE_BODY">Corporate Body</option>
                    <option value="GEOGRAPHIC_NAME">Geographic Name</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#a1a1aa] font-semibold mb-1">MARC21 Field Tag</label>
                  <input
                    type="text"
                    value={newMarcTag}
                    onChange={e => setNewMarcTag(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-semibold mb-1">LCCN Control Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. sh202600123"
                  value={newLccn}
                  onChange={e => setNewLccn(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-semibold mb-1">Scope / Application Note</label>
                <textarea
                  rows={2}
                  placeholder="Usage instructions and definition scope..."
                  value={newScopeNote}
                  onChange={e => setNewScopeNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-semibold mb-1">See Also References (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Supercomputing, Quantum information"
                  value={newSeeAlso}
                  onChange={e => setNewSeeAlso(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#27272a] text-[#a1a1aa] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                >
                  Save Authority Heading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
