import React, { useState } from 'react';
import { Layers, Plus, Search, BookOpen, Calendar, CheckCircle2, Clock, Trash2, Tag, Newspaper } from 'lucide-react';

interface SerialSubscription {
  id: string;
  title: string;
  issn: string;
  publisher: string;
  frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  annualCost: number;
  startDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'RENEWAL_DUE';
  lastReceivedVolume: string;
  lastReceivedIssue: string;
}

interface SerialIssue {
  id: string;
  subscriptionId: string;
  serialTitle: string;
  volume: string;
  issueNo: string;
  receivedDate: string;
  barcode: string;
  claimsStatus: 'NORMAL' | 'CLAIMED' | 'MISSING';
}

const INITIAL_SUBSCRIPTIONS: SerialSubscription[] = [
  {
    id: 'sub_01',
    title: 'IEEE Transactions on Software Engineering',
    issn: '0098-5589',
    publisher: 'IEEE Computer Society',
    frequency: 'MONTHLY',
    annualCost: 350000,
    startDate: '2026-01-01',
    expiryDate: '2026-12-31',
    status: 'ACTIVE',
    lastReceivedVolume: 'Vol 52',
    lastReceivedIssue: 'Issue 7 (July 2026)'
  },
  {
    id: 'sub_02',
    title: 'Nature Machine Intelligence',
    issn: '2522-5839',
    publisher: 'Springer Nature Publishing',
    frequency: 'MONTHLY',
    annualCost: 420000,
    startDate: '2026-01-01',
    expiryDate: '2026-12-31',
    status: 'ACTIVE',
    lastReceivedVolume: 'Vol 8',
    lastReceivedIssue: 'Issue 6 (June 2026)'
  },
  {
    id: 'sub_03',
    title: 'Journal of Library & Information Science Trends',
    issn: '1012-3456',
    publisher: 'Pakistan Library Association (PLA)',
    frequency: 'QUARTERLY',
    annualCost: 45000,
    startDate: '2025-09-01',
    expiryDate: '2026-08-31',
    status: 'RENEWAL_DUE',
    lastReceivedVolume: 'Vol 14',
    lastReceivedIssue: 'Issue 2 (Q2 2026)'
  }
];

const INITIAL_ISSUES: SerialIssue[] = [
  {
    id: 'iss_01',
    subscriptionId: 'sub_01',
    serialTitle: 'IEEE Transactions on Software Engineering',
    volume: 'Vol 52',
    issueNo: 'Issue 7',
    receivedDate: '2026-07-15',
    barcode: 'SER-IEEE-5207',
    claimsStatus: 'NORMAL'
  },
  {
    id: 'iss_02',
    subscriptionId: 'sub_02',
    serialTitle: 'Nature Machine Intelligence',
    volume: 'Vol 8',
    issueNo: 'Issue 6',
    receivedDate: '2026-06-28',
    barcode: 'SER-NAT-0806',
    claimsStatus: 'NORMAL'
  }
];

export const SerialsModule: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<SerialSubscription[]>(INITIAL_SUBSCRIPTIONS);
  const [issues, setIssues] = useState<SerialIssue[]>(INITIAL_ISSUES);
  const [activeTab, setActiveTab] = useState<'SUBSCRIPTIONS' | 'ISSUES'>('SUBSCRIPTIONS');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // New Subscription Form
  const [sTitle, setSTitle] = useState('');
  const [sIssn, setSIssn] = useState('');
  const [sPublisher, setSPublisher] = useState('');
  const [sFreq, setSFreq] = useState<SerialSubscription['frequency']>('MONTHLY');
  const [sCost, setSCost] = useState(50000);

  // New Issue Form
  const [selectedSubId, setSelectedSubId] = useState(subscriptions[0]?.id || '');
  const [iVol, setIVol] = useState('Vol 1');
  const [iNo, setINo] = useState('Issue 1');

  const handleCreateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sTitle.trim()) return;

    const newSub: SerialSubscription = {
      id: `sub_${Date.now()}`,
      title: sTitle.trim(),
      issn: sIssn || '0000-0000',
      publisher: sPublisher || 'Academic Publisher',
      frequency: sFreq,
      annualCost: sCost,
      startDate: new Date().toISOString().slice(0, 10),
      expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      status: 'ACTIVE',
      lastReceivedVolume: 'Vol 1',
      lastReceivedIssue: 'Issue 1'
    };

    setSubscriptions([newSub, ...subscriptions]);
    setIsSubModalOpen(false);
    setSTitle('');
    setSIssn('');
  };

  const handleCheckInIssue = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSub = subscriptions.find(s => s.id === selectedSubId) || subscriptions[0];

    const newIssue: SerialIssue = {
      id: `iss_${Date.now()}`,
      subscriptionId: targetSub.id,
      serialTitle: targetSub.title,
      volume: iVol,
      issueNo: iNo,
      receivedDate: new Date().toISOString().slice(0, 10),
      barcode: `SER-${targetSub.issn.slice(0, 4)}-${Math.floor(100 + Math.random() * 900)}`,
      claimsStatus: 'NORMAL'
    };

    setIssues([newIssue, ...issues]);
    setSubscriptions(subscriptions.map(s => (s.id === targetSub.id ? { ...s, lastReceivedVolume: iVol, lastReceivedIssue: iNo } : s)));
    setIsIssueModalOpen(false);
  };

  const handleDeleteSub = (id: string) => {
    if (confirm('Are you sure you want to remove this serial journal subscription?')) {
      setSubscriptions(subscriptions.filter(s => s.id !== id));
    }
  };

  const filteredSubs = subscriptions.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.issn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.publisher.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#121214] border border-[#27272a] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Newspaper className="h-4 w-4" />
            <span>Periodicals & Journal Holdings</span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-[#fafafa]">Serials & Periodicals Control</h1>
          <p className="text-xs text-[#a1a1aa] mt-1">
            Manage journal subscriptions, accession check-ins, volume binding, claims, and ISSN records.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-[#27272a] bg-[#09090b] hover:bg-[#18181b] text-[#fafafa] text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Check-in Serial Issue</span>
          </button>
          <button
            onClick={() => setIsSubModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Subscription</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-[#27272a] pb-2">
        <button
          onClick={() => setActiveTab('SUBSCRIPTIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 cursor-pointer transition-all ${
            activeTab === 'SUBSCRIPTIONS' ? 'bg-rose-600 text-white shadow-md' : 'bg-[#121214] border border-[#27272a] text-[#a1a1aa]'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Active Subscriptions ({subscriptions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('ISSUES')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 cursor-pointer transition-all ${
            activeTab === 'ISSUES' ? 'bg-blue-600 text-white shadow-md' : 'bg-[#121214] border border-[#27272a] text-[#a1a1aa]'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Issue Check-in Logs ({issues.length})</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'SUBSCRIPTIONS' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#121214] border border-[#27272a] relative">
            <Search className="h-4 w-4 text-[#a1a1aa] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search journals by title, ISSN, publisher..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubs.map(s => (
              <div key={s.id} className="p-5 rounded-2xl border border-[#27272a] bg-[#121214] space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 font-bold">
                      ISSN {s.issn}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                        s.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#fafafa]">{s.title}</h3>
                  <div className="text-xs text-[#a1a1aa]">Publisher: <strong className="text-[#fafafa]">{s.publisher}</strong></div>
                </div>

                <div className="text-xs text-[#a1a1aa] space-y-1 bg-[#09090b] p-3 rounded-xl border border-[#27272a]">
                  <div className="flex justify-between">
                    <span>Frequency:</span>
                    <span className="font-mono text-rose-400 font-bold">{s.frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Received:</span>
                    <span className="text-[#fafafa] font-medium">{s.lastReceivedVolume} - {s.lastReceivedIssue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Annual Fee:</span>
                    <span className="text-emerald-400 font-mono font-bold">PKR {s.annualCost.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-[#71717a]">Expires: {s.expiryDate}</span>
                  <button
                    onClick={() => handleDeleteSub(s.id)}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Issues Log */
        <div className="rounded-2xl border border-[#27272a] bg-[#121214] overflow-hidden shadow-xl divide-y divide-[#27272a]">
          {issues.map(iss => (
            <div key={iss.id} className="p-4 flex items-center justify-between text-xs">
              <div className="space-y-1">
                <span className="font-mono text-[10px] text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30">
                  {iss.barcode}
                </span>
                <h4 className="font-bold text-[#fafafa]">{iss.serialTitle}</h4>
                <div className="text-[#a1a1aa] text-[11px]">{iss.volume} • {iss.issueNo}</div>
              </div>

              <div className="text-right">
                <div className="text-emerald-400 font-semibold text-[11px]">Received: {iss.receivedDate}</div>
                <div className="text-[10px] text-[#71717a]">{iss.claimsStatus} STATUS</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Subscription Modal */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-[#27272a] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h2 className="text-base font-bold text-[#fafafa] flex items-center space-x-2">
                <Plus className="h-5 w-5 text-rose-400" />
                <span>Add Journal Subscription</span>
              </h2>
              <button onClick={() => setIsSubModalOpen(false)} className="text-[#a1a1aa] hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubscription} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#a1a1aa] font-semibold mb-1">Journal / Serial Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ACM Transactions on Information Systems"
                  value={sTitle}
                  onChange={e => setSTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a1a1aa] font-semibold mb-1">ISSN Number</label>
                  <input
                    type="text"
                    placeholder="1012-3456"
                    value={sIssn}
                    onChange={e => setSIssn(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-rose-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#a1a1aa] font-semibold mb-1">Frequency</label>
                  <select
                    value={sFreq}
                    onChange={e => setSFreq(e.target.value as SerialSubscription['frequency'])}
                    className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-rose-500 focus:outline-none cursor-pointer"
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a1a1aa] font-semibold mb-1">Publisher</label>
                  <input
                    type="text"
                    placeholder="e.g. IEEE / Oxford / ACM"
                    value={sPublisher}
                    onChange={e => setSPublisher(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#a1a1aa] font-semibold mb-1">Annual Subscription Cost (PKR)</label>
                  <input
                    type="number"
                    value={sCost}
                    onChange={e => setSCost(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-rose-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#27272a] text-[#a1a1aa] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check-in Issue Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-[#27272a] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h2 className="text-base font-bold text-[#fafafa] flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span>Check-in Serial Issue</span>
              </h2>
              <button onClick={() => setIsIssueModalOpen(false)} className="text-[#a1a1aa] hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckInIssue} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#a1a1aa] font-semibold mb-1">Select Journal Subscription</label>
                <select
                  value={selectedSubId}
                  onChange={e => setSelectedSubId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  {subscriptions.map(s => (
                    <option key={s.id} value={s.id}>{s.title} ({s.issn})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a1a1aa] font-semibold mb-1">Volume Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Vol 53"
                    value={iVol}
                    onChange={e => setIVol(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#a1a1aa] font-semibold mb-1">Issue Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Issue 8 (August 2026)"
                    value={iNo}
                    onChange={e => setINo(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#27272a] text-[#a1a1aa] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  Confirm Issue Check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
