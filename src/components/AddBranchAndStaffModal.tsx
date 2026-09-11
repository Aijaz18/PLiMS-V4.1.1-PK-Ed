import React, { useState } from 'react';
import {
  Building2,
  UserPlus,
  X,
  Plus,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Mail,
  Phone,
  Code,
  Sparkles,
  BookOpen,
  Repeat,
  DollarSign,
  FileText,
  Boxes,
  Users,
  QrCode,
  ArrowRightLeft,
  Settings,
  Trash2
} from 'lucide-react';
import { UserProfile, UserRole, StaffPower } from '../types/alims';

interface AddBranchAndStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: string[];
  onAddBranch: (branchName: string) => void;
  onDeleteBranch?: (branchName: string) => void;
  onAddStaff: (staffData: Partial<UserProfile>) => void;
  initialMode?: 'BRANCH' | 'STAFF';
}

const ALL_STAFF_POWERS: { id: StaffPower; label: string; desc: string; icon: any }[] = [
  { id: 'CAN_CATALOG', label: 'MARC21 Cataloguing', desc: 'Create & edit bibliographic records & copy accessions', icon: BookOpen },
  { id: 'CAN_CIRCULATE', label: 'Circulation Desk', desc: 'Issue, return, renew books & override loan limits', icon: Repeat },
  { id: 'CAN_CLEAR_FINES', label: 'Fine Clearance Desk', desc: 'Collect fine payments, issue receipts & waive overdue fines', icon: DollarSign },
  { id: 'CAN_ACQUIRE', label: 'Acquisitions & POs', desc: 'Manage vendor purchase orders, budgets & invoices', icon: FileText },
  { id: 'CAN_STOCK_AUDIT', label: 'Stock Audit', desc: 'Conduct physical inventory audits & RFID shelf scans', icon: Boxes },
  { id: 'CAN_MANAGE_USERS', label: 'Patron Directory', desc: 'Register, edit & suspend student & faculty accounts', icon: Users },
  { id: 'CAN_GENERATE_BARCODES', label: 'Barcode & RFID Tags', desc: 'Encode RFID tags & print accession barcode labels', icon: QrCode },
  { id: 'CAN_DIGITAL_ASSETS', label: 'Digital Library', desc: 'Upload e-journals, research papers & repository assets', icon: FileText },
  { id: 'CAN_INTER_LIBRARY_TRANSFER', label: 'Branch Transfers', desc: 'Request & approve book copy transfers across branches', icon: ArrowRightLeft },
  { id: 'CAN_SYSTEM_CONFIG', label: 'System Settings', desc: 'Configure library fine rates, rules & branch networks', icon: Settings }
];

export const AddBranchAndStaffModal: React.FC<AddBranchAndStaffModalProps> = ({
  isOpen,
  onClose,
  branches,
  onAddBranch,
  onDeleteBranch,
  onAddStaff,
  initialMode = 'BRANCH'
}) => {
  const [activeTab, setActiveTab] = useState<'BRANCH' | 'STAFF'>(initialMode);

  // New Branch Form
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchLocation, setBranchLocation] = useState('');
  const [branchContactEmail, setBranchContactEmail] = useState('');

  // New Staff Form
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('LIBRARIAN');
  const [staffBranch, setStaffBranch] = useState<string>(branches[0] || 'Central Academic Library');
  const [staffDept, setStaffDept] = useState('Library & Information Science');
  const [staffDesignation, setStaffDesignation] = useState('Assistant Librarian');
  const [selectedPowers, setSelectedPowers] = useState<StaffPower[]>([
    'CAN_CIRCULATE',
    'CAN_CATALOG',
    'CAN_CLEAR_FINES'
  ]);

  if (!isOpen) return null;

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) return;

    const formattedName = branchName.trim();
    onAddBranch(formattedName);

    alert(`✅ New Library Branch "${formattedName}" registered successfully! You can now assign staff members to this branch.`);
    setBranchName('');
    setBranchCode('');
    setBranchLocation('');
    setBranchContactEmail('');
    setStaffBranch(formattedName);
    setActiveTab('STAFF'); // Switch to staff tab to add staff for this new branch!
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffEmail.trim()) return;

    const newStaff: Partial<UserProfile> = {
      name: staffName.trim(),
      email: staffEmail.trim(),
      memberCode: staffCode.trim() || `LIB-STAFF-${Math.floor(1000 + Math.random() * 9000)}`,
      role: staffRole,
      department: staffDept,
      designation: staffDesignation,
      assignedBranch: staffBranch,
      staffPowers: selectedPowers,
      maxBorrowLimit: 15,
      status: 'ACTIVE'
    };

    onAddStaff(newStaff);
    alert(`✅ Library Staff member "${staffName}" registered & assigned to "${staffBranch}" branch successfully!`);
    onClose();
  };

  const togglePower = (powerId: StaffPower) => {
    setSelectedPowers(prev =>
      prev.includes(powerId) ? prev.filter(p => p !== powerId) : [...prev, powerId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-6 max-w-2xl w-full space-y-5 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#27272a] pb-4 shrink-0">
          <div>
            <h3 className="text-base font-bold text-[#fafafa] flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              <span>Library Expansion: Add Branch & Staff</span>
            </h3>
            <p className="text-xs text-[#a1a1aa] mt-0.5">
              Register new physical campus branches and assign operational staff members with custom permissions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#09090b] border border-[#27272a] text-[#a1a1aa] hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Type Toggle Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-[#09090b] p-1.5 rounded-xl border border-[#27272a] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('BRANCH')}
            className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'BRANCH'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>1. Register Library Branch</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STAFF')}
            className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'STAFF'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>2. Add Branch Staff Member</span>
          </button>
        </div>

        {/* FORM 1: REGISTER NEW LIBRARY BRANCH */}
        {activeTab === 'BRANCH' && (
          <form onSubmit={handleBranchSubmit} className="space-y-4 text-xs overflow-y-auto pr-1">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <Building2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>
                Adding a branch creates a dedicated catalog & circulation node in PSLiMS.
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[#a1a1aa] font-medium flex items-center space-x-1">
                <span>Branch Name *</span>
              </label>
              <input
                type="text"
                required
                value={branchName}
                onChange={e => setBranchName(e.target.value)}
                placeholder="e.g. Medical & Health Sciences Library or Pakistan Campus Library"
                className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-[#fafafa] focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[#a1a1aa] font-medium">Branch Abbreviation / Code</label>
                <input
                  type="text"
                  value={branchCode}
                  onChange={e => setBranchCode(e.target.value)}
                  placeholder="e.g. MED-LIB or PK-BRANCH"
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-[#fafafa] focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#a1a1aa] font-medium">Campus Location / Address</label>
                <input
                  type="text"
                  value={branchLocation}
                  onChange={e => setBranchLocation(e.target.value)}
                  placeholder="e.g. Block-B, Academic Complex"
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-[#fafafa] focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[#a1a1aa] font-medium">Branch Desk Contact Email</label>
              <input
                type="email"
                value={branchContactEmail}
                onChange={e => setBranchContactEmail(e.target.value)}
                placeholder="e.g. circulation.med@univ.edu.pk"
                className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-[#fafafa] focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Existing Branches List */}
            <div className="pt-2">
              <label className="text-[#a1a1aa] font-mono text-[11px] uppercase block mb-1.5">
                Existing Registered Library Branches ({branches.length}):
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {branches.map(b => (
                  <span
                    key={b}
                    className="px-2.5 py-1 rounded-lg bg-[#09090b] border border-[#27272a] text-[#fafafa] text-[11px] flex items-center space-x-2 group"
                  >
                    <Building2 className="h-3 w-3 text-emerald-400" />
                    <span>{b}</span>
                    {onDeleteBranch && branches.length > 1 && (
                      <button
                        type="button"
                        title={`Remove ${b} branch`}
                        onClick={() => {
                          if (confirm(`Remove library branch "${b}" from system?`)) {
                            onDeleteBranch(b);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 p-0.5 rounded hover:bg-red-500/20 cursor-pointer ml-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 flex justify-end space-x-2 border-t border-[#27272a]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Plus className="h-4 w-4" />
                <span>Save New Library Branch</span>
              </button>
            </div>
          </form>
        )}

        {/* FORM 2: ADD STAFF MEMBER FOR A BRANCH */}
        {activeTab === 'STAFF' && (
          <form onSubmit={handleStaffSubmit} className="space-y-4 text-xs overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[#a1a1aa] font-medium">Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                  placeholder="e.g. Prof. Tariq Mahmood"
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-[#fafafa] focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#a1a1aa] font-medium">Official Email Address *</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={e => setStaffEmail(e.target.value)}
                  placeholder="e.g. tariq.mahmood@univ.edu.pk"
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-[#fafafa] focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[#a1a1aa] font-medium">Staff ID Code</label>
                <input
                  type="text"
                  value={staffCode}
                  onChange={e => setStaffCode(e.target.value)}
                  placeholder="e.g. LIB-2026-009"
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-[#fafafa] focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#a1a1aa] font-medium">Assign To Branch *</label>
                <select
                  value={staffBranch}
                  onChange={e => setStaffBranch(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-[#fafafa] focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
                >
                  {branches.map(b => (
                    <option key={b} value={b} className="bg-[#121214] text-[#fafafa]">
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[#a1a1aa] font-medium">Staff Role *</label>
                <select
                  value={staffRole}
                  onChange={e => setStaffRole(e.target.value as UserRole)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-[#fafafa] focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="LIBRARIAN">Librarian / Cataloguer</option>
                  <option value="ASSISTANT_LIBRARIAN">Assistant Librarian</option>
                  <option value="SYSTEM_ADMIN">System Administrator</option>
                  <option value="ACCOUNTS_OFFICER">Accounts & Fine Clearance</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[#a1a1aa] font-medium">Department</label>
                <input
                  type="text"
                  value={staffDept}
                  onChange={e => setStaffDept(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-[#fafafa] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#a1a1aa] font-medium">Designation Title</label>
                <input
                  type="text"
                  value={staffDesignation}
                  onChange={e => setStaffDesignation(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-[#fafafa] focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Staff Operational Powers Checkbox Grid */}
            <div className="space-y-2 pt-1">
              <label className="text-[#fafafa] font-bold flex items-center justify-between">
                <span>Assign Staff Operational Rights ({selectedPowers.length} Selected):</span>
                <span className="text-[10px] text-[#a1a1aa] font-mono">Select permissions for this staff member</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-[#09090b] border border-[#27272a] rounded-xl">
                {ALL_STAFF_POWERS.map(power => {
                  const isChecked = selectedPowers.includes(power.id);
                  const Icon = power.icon;
                  return (
                    <label
                      key={power.id}
                      className={`p-2 rounded-lg border flex items-center space-x-2 cursor-pointer transition-all ${
                        isChecked
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                          : 'border-[#27272a] bg-[#121214] text-[#a1a1aa] hover:text-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePower(power.id)}
                        className="rounded border-[#27272a] text-emerald-500 focus:ring-emerald-500"
                      />
                      <Icon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <div className="truncate text-[11px]">
                        <div className="font-bold text-[#fafafa]">{power.label}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 flex justify-end space-x-2 border-t border-[#27272a]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#09090b] border border-[#27272a] text-[#fafafa] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <UserPlus className="h-4 w-4" />
                <span>Save Staff Member & Assign Branch</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
