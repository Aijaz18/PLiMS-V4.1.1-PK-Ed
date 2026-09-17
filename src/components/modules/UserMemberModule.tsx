import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Key,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Filter,
  UserCheck,
  UserX,
  Edit,
  Sliders,
  History,
  Sparkles,
  BookOpen,
  Repeat,
  DollarSign,
  FileText,
  Boxes,
  QrCode,
  ArrowRightLeft,
  Settings,
  Lock,
  Unlock,
  CreditCard,
  Download,
  Printer,
  FileSpreadsheet,
  ExternalLink,
  Copy,
  Share2,
  Trash2,
  GraduationCap,
  Briefcase,
  Award,
  Crown,
  Building2
} from 'lucide-react';
import { UserProfile, UserRole, StaffPower, PowerAssignmentLog } from '../../types/alims';
import { MemberPhotoUploader } from '../MemberPhotoUploader';
import pslimsLogo from '../../assets/images/plims_emblem_logo_1788759356534.jpg';

export const getRoleCardConfig = (role: string) => {
  switch (role) {
    case 'FACULTY':
      return {
        label: 'FACULTY RESEARCH CARD',
        category: 'Faculty Member',
        gradientBg: 'from-[#78350f] via-[#451a03] to-[#09090b]',
        cardBorder: 'border-amber-500/50 shadow-amber-950/40',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
        headerText: 'text-amber-300',
        accentText: 'text-amber-400',
        chipColor: 'border-amber-400/60',
        tagText: 'FACULTY PASS'
      };
    case 'SUPER_ADMIN':
    case 'SYSTEM_ADMIN':
      return {
        label: 'EXECUTIVE ADMIN CARD',
        category: 'System Administrator',
        gradientBg: 'from-[#581c87] via-[#3b0764] to-[#09090b]',
        cardBorder: 'border-purple-500/50 shadow-purple-950/40',
        badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
        headerText: 'text-purple-300',
        accentText: 'text-purple-400',
        chipColor: 'border-purple-400/60',
        tagText: 'ADMIN PASS'
      };
    case 'LIBRARIAN':
    case 'ASSISTANT_LIBRARIAN':
    case 'ACCOUNTS_OFFICER':
      return {
        label: 'LIBRARY STAFF PASS',
        category: 'Library Staff',
        gradientBg: 'from-[#1e3a8a] via-[#172554] to-[#09090b]',
        cardBorder: 'border-blue-500/50 shadow-blue-950/40',
        badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
        headerText: 'text-blue-300',
        accentText: 'text-blue-400',
        chipColor: 'border-blue-400/60',
        tagText: 'STAFF PASS'
      };
    case 'STUDENT':
    case 'PATRON':
    default:
      return {
        label: 'STUDENT LIBRARY PASS',
        category: 'Student Patron',
        gradientBg: 'from-[#064e3b] via-[#022c22] to-[#09090b]',
        cardBorder: 'border-emerald-500/50 shadow-emerald-950/40',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
        headerText: 'text-emerald-300',
        accentText: 'text-emerald-400',
        chipColor: 'border-emerald-400/60',
        tagText: 'STUDENT PASS'
      };
  }
};

interface UserMemberModuleProps {
  users: UserProfile[];
  currentUser?: UserProfile;
  branches?: string[];
  onAddUser?: (user: Partial<UserProfile>) => void;
  onUpdateUser?: (id: string, updated: Partial<UserProfile>) => void;
  onDeleteUser?: (id: string) => void;
  onOpenAddBranchModal?: (mode?: 'BRANCH' | 'STAFF') => void;
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

export const UserMemberModule: React.FC<UserMemberModuleProps> = ({
  users,
  currentUser,
  branches = [],
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onOpenAddBranchModal
}) => {
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'POWERS_MATRIX' | 'AUDIT_LOG'>('DIRECTORY');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editUserForm, setEditUserForm] = useState<Partial<UserProfile>>({});

  // Batch Member Add Modal
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchRole, setBatchRole] = useState<UserRole>('STUDENT');
  const [batchDept, setBatchDept] = useState('Computer Science');
  const [batchBranch, setBatchBranch] = useState(branches[0] || 'Central Academic Library');
  const [batchQuantity, setBatchQuantity] = useState(10);
  const [batchUnlimited, setBatchUnlimited] = useState(true);
  const [batchNamesText, setBatchNamesText] = useState('');

  // Member Card Modal State
  const [selectedCardUser, setSelectedCardUser] = useState<UserProfile | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardTheme, setCardTheme] = useState<'EMERALD' | 'NAVY' | 'GOLD'>('EMERALD');
  const [cardSide, setCardSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  // Download Members Directory CSV
  const handleDownloadMembersCsv = () => {
    const headers = [
      'Member ID',
      'Member Code',
      'Full Name',
      'Email',
      'Role',
      'Department',
      'Assigned Branch',
      'Status',
      'Max Borrow Limit',
      'Current Borrowed',
      'Fine Pending (PKR)'
    ];

    const rows = users.map(u => [
      u.id,
      u.memberCode,
      u.name,
      u.email,
      u.role,
      u.department || 'N/A',
      u.assignedBranch || 'Central Library',
      u.status,
      (u.maxBorrowLimit || 5) >= 9999 ? 'Unlimited' : (u.maxBorrowLimit || 5),
      u.currentBorrowed || u.activeBorrowCount || 0,
      u.finePending || 0
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...rows.map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PLiMS_Members_Directory_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadToast(`✨ Exported ${users.length} member profiles to CSV!`);
    setTimeout(() => setDownloadToast(null), 4000);
  };

  // Download Standalone Printable HTML ID Card for a Member
  const handleDownloadSingleMemberCardHtml = (user: UserProfile) => {
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 2);
    const validUntilStr = validUntil.toISOString().slice(0, 10);
    const roleCfg = getRoleCardConfig(user.role);

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PLiMS Official Member Card - ${user.name}</title>
  <style>
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #09090b;
      color: #fafafa;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .card-container {
      width: 440px;
      height: 270px;
      background: linear-gradient(135deg, ${
        user.role === 'FACULTY' ? '#78350f 0%, #451a03 60%, #09090b 100%' :
        ['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(user.role) ? '#581c87 0%, #3b0764 60%, #09090b 100%' :
        ['LIBRARIAN', 'ASSISTANT_LIBRARIAN', 'ACCOUNTS_OFFICER'].includes(user.role) ? '#1e3a8a 0%, #172554 60%, #09090b 100%' :
        '#064e3b 0%, #022c22 60%, #09090b 100%'
      });
      border: 2px solid ${
        user.role === 'FACULTY' ? '#f59e0b' :
        ['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(user.role) ? '#a855f7' :
        ['LIBRARIAN', 'ASSISTANT_LIBRARIAN', 'ACCOUNTS_OFFICER'].includes(user.role) ? '#3b82f6' :
        '#10b981'
      };
      border-radius: 20px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.85);
      position: relative;
      overflow: hidden;
      padding: 16px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.2);
      padding-bottom: 8px;
    }
    .inst-logo {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      object-fit: cover;
      border: 1.5px solid rgba(255,255,255,0.4);
    }
    .inst-info {
      flex: 1;
      margin-left: 10px;
    }
    .title-main {
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.8px;
      color: #ffffff;
      text-transform: uppercase;
    }
    .title-sub {
      font-size: 9px;
      color: #38bdf8;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .badge {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #ffffff;
      font-size: 8px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 12px;
      letter-spacing: 0.5px;
    }
    .card-body {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 6px;
    }
    .avatar {
      width: 78px;
      height: 88px;
      border-radius: 12px;
      object-fit: cover;
      border: 2px solid rgba(255,255,255,0.4);
      box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    }
    .user-info {
      flex: 1;
    }
    .user-name {
      font-size: 15px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 3px;
    }
    .role-badge {
      display: inline-block;
      font-size: 9px;
      font-weight: 800;
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .info-row {
      font-size: 10px;
      color: #e4e4e7;
      margin-bottom: 2px;
    }
    .card-footer {
      border-top: 1px solid rgba(255,255,255,0.2);
      padding-top: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .barcode {
      font-family: monospace;
      font-size: 10px;
      letter-spacing: 3px;
      background: rgba(0,0,0,0.7);
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.25);
      color: #38bdf8;
    }
    .validity {
      font-size: 9px;
      color: #d4d4d8;
      text-align: right;
    }
    .print-btn {
      margin-top: 20px;
      background: #2563eb;
      color: white;
      border: none;
      padding: 10px 24px;
      font-size: 13px;
      font-weight: bold;
      border-radius: 10px;
      cursor: pointer;
    }
    @media print {
      .print-btn { display: none; }
      body { background: white; }
    }
  </style>
</head>
<body>
  <div class="card-container">
    <div class="card-header">
      <img src="${pslimsLogo}" class="inst-logo" alt="Institution Logo" />
      <div class="inst-info">
        <div class="title-main">Pakistan Library System (PLiMS)</div>
        <div class="title-sub">${roleCfg.label}</div>
      </div>
      <div class="badge">${user.status === 'ACTIVE' ? 'VERIFIED PATRON' : user.status}</div>
    </div>
    <div class="card-body">
      <img src="${user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}" class="avatar" alt="Photo" />
      <div class="user-info">
        <div class="user-name">${user.name}</div>
        <div class="role-badge">${user.role} • ${roleCfg.category}</div>
        <div class="info-row"><strong>ID Code:</strong> ${user.memberCode}</div>
        <div class="info-row"><strong>Dept:</strong> ${user.department || 'General Academic'}</div>
        <div class="info-row"><strong>Branch:</strong> ${user.assignedBranch || 'Central Library'}</div>
      </div>
    </div>
    <div class="card-footer">
      <div class="barcode">|||| ||| ||||| |||| ${user.memberCode}</div>
      <div class="validity">
        <div>Borrow Limit: <strong>${(user.maxBorrowLimit || 5) >= 9999 ? 'Unlimited Books (∞ No Cap)' : `${user.maxBorrowLimit || 5} Books`}</strong></div>
        <div>Valid Until: <strong>${validUntilStr}</strong></div>
      </div>
    </div>
  </div>
  <button class="print-btn" onclick="window.print()">Print Official ID Card</button>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MemberCard_${user.memberCode}_${user.name.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadToast(`✨ Member Card HTML downloaded for ${user.name}!`);
    setTimeout(() => setDownloadToast(null), 4000);
  };

  // New User Form State
  const [newUserForm, setNewUserForm] = useState<Partial<UserProfile>>({
    name: '',
    email: '',
    role: 'STUDENT',
    department: 'Computer Science',
    designation: 'Student',
    memberCode: '',
    maxBorrowLimit: 5,
    staffPowers: []
  });

  // Audit Logs for Power Changes
  const [auditLogs, setAuditLogs] = useState<PowerAssignmentLog[]>([
    {
      id: 'log_01',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      assignedBy: 'Dr. Aijaz Akhter (Super Admin)',
      targetStaffId: 'usr_lib1',
      targetStaffName: 'Prof. Sarah Jenkins',
      powersGranted: ['CAN_CATALOG', 'CAN_CIRCULATE', 'CAN_CLEAR_FINES', 'CAN_GENERATE_BARCODES', 'CAN_DIGITAL_ASSETS', 'CAN_INTER_LIBRARY_TRANSFER'],
      notes: 'Initial assignment for Head Librarian role'
    },
    {
      id: 'log_02',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      assignedBy: 'Dr. Aijaz Akhter (Super Admin)',
      targetStaffId: 'usr_asst1',
      targetStaffName: 'David Miller',
      powersGranted: ['CAN_CIRCULATE', 'CAN_CLEAR_FINES'],
      notes: 'Assigned Evening Shift Circulation & Fine collection rights'
    }
  ]);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'SYSTEM_ADMIN';

  // Toggle power for a user
  const handleTogglePower = (userId: string, power: StaffPower) => {
    if (!isSuperAdmin) {
      alert('Action Denied: Only Super Admin can modify operational staff powers!');
      return;
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const currentPowers = targetUser.staffPowers || [];
    const hasPower = currentPowers.includes(power);

    const updatedPowers = hasPower
      ? currentPowers.filter(p => p !== power)
      : [...currentPowers, power];

    if (onUpdateUser) {
      onUpdateUser(userId, { staffPowers: updatedPowers });
    }

    // Add Audit Log
    const newLog: PowerAssignmentLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      assignedBy: currentUser?.name || 'Super Admin',
      targetStaffId: targetUser.id,
      targetStaffName: targetUser.name,
      powersGranted: updatedPowers,
      notes: hasPower ? `Revoked power: ${power}` : `Granted power: ${power}`
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Apply quick preset powers
  const handleApplyPreset = (userId: string, preset: 'HEAD_LIBRARIAN' | 'CIRCULATION' | 'CATALOGUER' | 'ACCOUNTS' | 'SUPER' | 'CLEAR') => {
    if (!isSuperAdmin) {
      alert('Action Denied: Only Super Admin can modify staff power presets!');
      return;
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    let powersToAssign: StaffPower[] = [];
    if (preset === 'HEAD_LIBRARIAN') {
      powersToAssign = ['CAN_CATALOG', 'CAN_CIRCULATE', 'CAN_CLEAR_FINES', 'CAN_GENERATE_BARCODES', 'CAN_DIGITAL_ASSETS', 'CAN_INTER_LIBRARY_TRANSFER', 'CAN_MANAGE_USERS'];
    } else if (preset === 'CIRCULATION') {
      powersToAssign = ['CAN_CIRCULATE', 'CAN_CLEAR_FINES'];
    } else if (preset === 'CATALOGUER') {
      powersToAssign = ['CAN_CATALOG', 'CAN_GENERATE_BARCODES', 'CAN_DIGITAL_ASSETS'];
    } else if (preset === 'ACCOUNTS') {
      powersToAssign = ['CAN_CLEAR_FINES', 'CAN_ACQUIRE'];
    } else if (preset === 'SUPER') {
      powersToAssign = ALL_STAFF_POWERS.map(p => p.id);
    } else if (preset === 'CLEAR') {
      powersToAssign = [];
    }

    if (onUpdateUser) {
      onUpdateUser(userId, { staffPowers: powersToAssign });
    }

    const newLog: PowerAssignmentLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      assignedBy: currentUser?.name || 'Super Admin',
      targetStaffId: targetUser.id,
      targetStaffName: targetUser.name,
      powersGranted: powersToAssign,
      notes: `Applied Preset '${preset}' to ${targetUser.name}`
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Filtered staff and users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.memberCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const staffMembers = users.filter(u =>
    ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN', 'ACCOUNTS_OFFICER'].includes(u.role)
  );

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) {
      alert('Please fill out member name and email.');
      return;
    }

    const code = newUserForm.memberCode || `${newUserForm.role?.substring(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (onAddUser) {
      onAddUser({
        ...newUserForm,
        memberCode: code,
        status: 'ACTIVE'
      });
    }

    setIsAddModalOpen(false);
    setNewUserForm({
      name: '',
      email: '',
      avatarUrl: '',
      role: 'STUDENT',
      department: 'Computer Science',
      designation: 'Student',
      memberCode: '',
      maxBorrowLimit: 5,
      staffPowers: []
    });
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      assignedBranch: user.assignedBranch,
      status: user.status,
      maxBorrowLimit: user.maxBorrowLimit !== undefined ? user.maxBorrowLimit : 5,
      avatarUrl: user.avatarUrl,
      phone: user.phone || user.mobileNo
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !onUpdateUser) return;
    onUpdateUser(editingUser.id, editUserForm);
    setDownloadToast(`Updated member record & privileges for "${editUserForm.name || editingUser.name}"!`);
    setTimeout(() => setDownloadToast(null), 3000);
    setEditingUser(null);
  };

  const handleBatchAddMembers = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddUser) return;
    const names = batchNamesText.trim()
      ? batchNamesText.split('\n').map(n => n.trim()).filter(Boolean)
      : [];

    const count = names.length > 0 ? names.length : Math.max(1, batchQuantity);
    const borrowCap = batchUnlimited ? 99999 : (batchRole === 'FACULTY' ? 15 : 5);

    for (let i = 0; i < count; i++) {
      const name = names[i] || `${batchDept} Patron ${i + 1}`;
      const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '.');
      const email = `${cleanName || 'patron'}.${Date.now().toString().slice(-4)}_${i + 1}@univ.edu.pk`;
      const roleCode = batchRole.substring(0, 3);
      const memberCode = `${roleCode}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      onAddUser({
        name,
        email,
        role: batchRole,
        department: batchDept,
        designation: batchRole === 'FACULTY' ? 'Assistant Professor' : 'Registered Member',
        assignedBranch: batchBranch,
        memberCode,
        maxBorrowLimit: borrowCap,
        status: 'ACTIVE',
        joinedDate: new Date().toISOString().split('T')[0],
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150`
      });
    }

    setDownloadToast(`Batch registered ${count} new members with ${batchUnlimited ? 'Unlimited (∞)' : borrowCap} borrow limit!`);
    setTimeout(() => setDownloadToast(null), 3500);
    setIsBatchModalOpen(false);
    setBatchNamesText('');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-400 text-xs font-semibold flex items-center space-x-2.5 animate-bounce">
          <CheckCircle2 className="h-4 w-4" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Top Banner & Super Admin Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#121214] via-[#18181b] to-[#121214] border border-slate-200/90 shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-900">Patron & Staff Powers Matrix</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Super Admin power allocation console for Librarians, Assistant Staff & Patron accounts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Unlimited Member Capacity Pill */}
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-1.5 shadow-sm">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Patron Roster: <strong className="text-white font-mono">Unlimited Capacity (∞)</strong></span>
          </div>

          {isSuperAdmin ? (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center space-x-2">
              <Key className="h-4 w-4 animate-pulse" />
              <span>Super Admin Access</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold flex items-center space-x-2">
              <Lock className="h-4 w-4" />
              <span>Read-Only View</span>
            </div>
          )}

          <button
            onClick={handleDownloadMembersCsv}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-900 font-medium text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm shrink-0"
            title="Export full patron & staff directory to CSV"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-md shadow-purple-500/20 shrink-0"
            title="Rapidly register multiple members with unlimited capacity"
          >
            <Users className="h-4 w-4" />
            <span>+ Batch Add</span>
          </button>

          {onOpenAddBranchModal && (
            <button
              onClick={() => onOpenAddBranchModal('BRANCH')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-md shadow-emerald-500/20 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add Branch</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md shadow-blue-500/20 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Register Member</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200/90 pb-3">
        <button
          onClick={() => setActiveTab('DIRECTORY')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'DIRECTORY'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white border border-slate-200/90 text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Patron & Staff Directory ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('POWERS_MATRIX')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'POWERS_MATRIX'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white border border-slate-200/90 text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="h-4 w-4 text-amber-300" />
          <span>Super Admin Powers Assignment Matrix ({staffMembers.length} Staff)</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT_LOG')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'AUDIT_LOG'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white border border-slate-200/90 text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Rights Assignment Audit Logs</span>
        </button>
      </div>

      {/* TAB 1: DIRECTORY */}
      {activeTab === 'DIRECTORY' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200/90">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, email, member code, department..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="LIBRARIAN">Head Librarian</option>
              <option value="ASSISTANT_LIBRARIAN">Assistant Librarian</option>
              <option value="ACCOUNTS_OFFICER">Accounts Officer</option>
              <option value="FACULTY">Faculty</option>
              <option value="STUDENT">Student</option>
              <option value="RESEARCH_SCHOLAR">Research Scholar</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {/* Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUsers.map(u => {
              const isStaff = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN', 'ACCOUNTS_OFFICER'].includes(u.role);
              const assignedPowersCount = u.staffPowers?.length || 0;
              const roleCfg = getRoleCardConfig(u.role);

              return (
                <div
                  key={u.id}
                  className={`rounded-2xl border ${roleCfg.cardBorder} bg-gradient-to-br ${roleCfg.gradientBg} p-4 flex flex-col justify-between space-y-3.5 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl group`}
                >
                  {/* Subtle Background Glow */}
                  <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 rounded-full blur-xl pointer-events-none group-hover:bg-white/10 transition-all" />

                  {/* Institutional Header with Logo */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-white/15 relative z-10">
                    <div className="flex items-center space-x-2 min-w-0">
                      <img
                        src={pslimsLogo}
                        alt="PLiMS Logo"
                        className="w-8 h-8 rounded-full object-cover border border-white/40 shrink-0 shadow-sm"
                      />
                      <div className="min-w-0">
                        <div className="text-[10px] font-black text-white uppercase font-serif tracking-wider truncate">
                          PLiMS Member Pass
                        </div>
                        <div className={`text-[9px] font-mono font-bold truncate ${roleCfg.headerText}`}>
                          {roleCfg.label}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                          : u.status === 'SUSPENDED'
                          ? 'bg-red-500/20 text-red-300 border-red-400/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                      }`}
                    >
                      {u.status}
                    </span>
                  </div>

                  {/* Main Card Body */}
                  <div className="flex items-start space-x-3.5 relative z-10">
                    <div className="relative shrink-0">
                      <img
                        src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                        alt={u.name}
                        className={`w-14 h-16 rounded-xl object-cover border-2 ${roleCfg.chipColor} shadow-md`}
                      />
                      <div
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#121214] ${
                          u.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-red-500'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="font-bold text-white text-sm truncate tracking-tight">{u.name}</div>
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${roleCfg.badgeClass}`}>
                          {u.role}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 text-cyan-300 font-semibold">
                          {u.memberCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-700 truncate font-sans">{u.email}</div>
                    </div>
                  </div>

                  {/* Detailed Specs Block */}
                  <div className="text-[11px] text-slate-800 space-y-1.5 bg-black/40 p-3 rounded-xl border border-white/10 relative z-10 backdrop-blur-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Department:</span>
                      <span className="text-white font-semibold truncate max-w-[170px]">{u.department || 'General Academic'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Assigned Branch:</span>
                      <span className="text-white font-semibold truncate max-w-[170px]">{u.assignedBranch || 'Central Library'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Borrowed Books:</span>
                      <span className="text-white font-semibold font-mono flex items-center space-x-1">
                        <span>{u.currentBorrowed || u.activeBorrowCount || 0} /</span>
                        {(u.maxBorrowLimit || 5) >= 9999 ? (
                          <span className="text-emerald-300 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30 text-[10px]">
                            ∞ Unlimited
                          </span>
                        ) : (
                          <span>{u.maxBorrowLimit || 5} Max</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Fine Pending:</span>
                      <span className={`font-semibold font-mono ${u.finePending > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
                        PKR {u.finePending || 0}
                      </span>
                    </div>
                    {isStaff && (
                      <div className="flex justify-between items-center border-t border-white/10 pt-1.5 mt-1 text-amber-300 font-medium">
                        <span>Staff Terminal Powers:</span>
                        <span className="font-mono font-bold">{assignedPowersCount} / {ALL_STAFF_POWERS.length} Active</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/15 text-xs gap-1.5 flex-wrap relative z-10">
                    <button
                      onClick={() => {
                        setSelectedCardUser(u);
                        setIsCardModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-600/30 border border-blue-400/40 text-blue-200 hover:bg-blue-600 hover:text-white text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-all shadow-sm"
                      title="View & Print Official Library Member ID Card"
                    >
                      <CreditCard className="h-3.5 w-3.5 text-blue-300" />
                      <span>Member Card</span>
                    </button>

                    <button
                      onClick={() => handleDownloadSingleMemberCardHtml(u)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600/30 border border-emerald-400/40 text-emerald-200 hover:bg-emerald-600 hover:text-white text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-all shadow-sm"
                      title="Download Printable Card HTML File"
                    >
                      <Download className="h-3.5 w-3.5 text-emerald-300" />
                      <span>Download</span>
                    </button>

                    {onUpdateUser && (
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-200 hover:bg-amber-600 hover:text-white text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-all shadow-sm"
                        title="Edit Member Profile, Role & Borrow Limit Capacity"
                      >
                        <Edit className="h-3.5 w-3.5 text-amber-300" />
                        <span>Edit Limits</span>
                      </button>
                    )}

                    {isStaff && (
                      <button
                        onClick={() => setActiveTab('POWERS_MATRIX')}
                        className="text-amber-300 hover:underline flex items-center space-x-1 text-[10px] font-semibold cursor-pointer"
                      >
                        <Key className="h-3 w-3" />
                        <span>Powers</span>
                      </button>
                    )}

                    {onUpdateUser && isSuperAdmin && (
                      <button
                        onClick={() =>
                          onUpdateUser(u.id, {
                            status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
                          })
                        }
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                          u.status === 'ACTIVE'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                    )}

                    {onDeleteUser && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to permanently remove member account "${u.name}" (${u.memberCode})?`)) {
                            onDeleteUser(u.id);
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 text-[10px] font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                        title="Remove Member Account"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SUPER ADMIN POWERS MATRIX */}
      {activeTab === 'POWERS_MATRIX' && (
        <div className="space-y-6">
          {/* Notice Header */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start space-x-3">
            <Key className="h-5 w-5 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <div className="font-bold text-sm text-amber-200">Super Admin Rights Management Console</div>
              <p className="mt-0.5 text-amber-300/80">
                Super Admin can grant or revoke granular operational capabilities for Librarians, Assistant Librarians, and Accounts Staff.
                Changes take immediate effect across all terminal sessions.
              </p>
            </div>
          </div>

          {/* Granular Powers Legend Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {ALL_STAFF_POWERS.map(power => {
              const IconComp = power.icon;
              return (
                <div key={power.id} className="p-3 rounded-xl bg-white border border-slate-200/90 space-y-1">
                  <div className="flex items-center space-x-1.5 text-blue-400 text-xs font-bold">
                    <IconComp className="h-3.5 w-3.5" />
                    <span>{power.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">{power.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Matrix Table */}
          <div className="rounded-2xl border border-slate-200/90 bg-white overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200/90 bg-[#f1f5f9] text-slate-500">
                  <th className="p-3.5 font-semibold">Staff Member</th>
                  <th className="p-3.5 font-semibold">Role</th>
                  <th className="p-3.5 font-semibold">Department</th>
                  <th className="p-3.5 font-semibold">Active Powers ({ALL_STAFF_POWERS.length})</th>
                  <th className="p-3.5 font-semibold text-right">Quick Role Presets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffMembers.map(staff => {
                  const currentPowers = staff.staffPowers || [];

                  return (
                    <tr key={staff.id} className="hover:bg-slate-100/50 transition-all">
                      <td className="p-3.5">
                        <div className="flex items-center space-x-3">
                          <img
                            src={staff.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                            alt={staff.name}
                            className="w-9 h-9 rounded-full object-cover border border-amber-500/30"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                              <span>{staff.name}</span>
                              {staff.role === 'SUPER_ADMIN' && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-mono">
                                  SUPER ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">{staff.email} • {staff.memberCode}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-amber-400 text-[11px]">
                        {staff.role}
                      </td>

                      <td className="p-3.5 text-slate-500 text-[11px]">
                        {staff.department || 'Library Staff'}
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1.5 max-w-lg">
                          {ALL_STAFF_POWERS.map(p => {
                            const isAssigned = currentPowers.includes(p.id);
                            return (
                              <button
                                key={p.id}
                                onClick={() => handleTogglePower(staff.id, p.id)}
                                title={`${p.label}: ${p.desc}`}
                                disabled={!isSuperAdmin}
                                className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center space-x-1 border transition-all cursor-pointer ${
                                  isAssigned
                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                                    : 'bg-[#f1f5f9] border-slate-200/90 text-slate-400 hover:border-slate-300'
                                }`}
                              >
                                {isAssigned ? (
                                  <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-zinc-600 shrink-0" />
                                )}
                                <span>{p.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex flex-col items-end space-y-1">
                          <button
                            onClick={() => handleApplyPreset(staff.id, 'HEAD_LIBRARIAN')}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600/30 text-[10px] font-medium cursor-pointer"
                          >
                            ⚡ Head Librarian Preset
                          </button>
                          <button
                            onClick={() => handleApplyPreset(staff.id, 'CIRCULATION')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 text-[10px] font-medium cursor-pointer"
                          >
                            🎟️ Circulation Desk
                          </button>
                          <button
                            onClick={() => handleApplyPreset(staff.id, 'SUPER')}
                            className="px-2.5 py-1 rounded-lg bg-amber-600/20 border border-amber-500/40 text-amber-400 hover:bg-amber-600/30 text-[10px] font-medium cursor-pointer"
                          >
                            👑 Full Super Powers
                          </button>
                          <button
                            onClick={() => handleApplyPreset(staff.id, 'CLEAR')}
                            className="px-2 py-0.5 text-red-400 hover:underline text-[9px] cursor-pointer"
                          >
                            Revoke All Powers
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOG */}
      {activeTab === 'AUDIT_LOG' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <History className="h-4 w-4 text-purple-400" />
              <span>Super Admin Power Rights Allocation History</span>
            </h3>

            <div className="space-y-2">
              {auditLogs.map(log => (
                <div key={log.id} className="p-3 rounded-xl bg-[#f1f5f9] border border-slate-200/90 text-xs flex items-start justify-between">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center space-x-2">
                      <span className="text-amber-400 font-mono">{log.assignedBy}</span>
                      <span className="text-slate-500">→ updated powers for</span>
                      <span className="text-blue-400">{log.targetStaffName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">{log.notes}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {log.powersGranted.map(p => (
                        <span key={p} className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Register Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-400" />
                <span>Register New Patron or Staff Profile</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-500 hover:text-white cursor-pointer text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3 text-xs max-h-[80vh] overflow-y-auto pr-1">
              <MemberPhotoUploader
                value={newUserForm.avatarUrl || ''}
                onChange={url => setNewUserForm({ ...newUserForm, avatarUrl: url })}
                label="Registered Person Profile Photo / Picture"
              />

              <div>
                <label className="block text-slate-500 mb-1 font-medium">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Foster"
                  value={newUserForm.name || ''}
                  onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Institutional Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="jane.f@university.edu"
                    value={newUserForm.email || ''}
                    onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Role Preset *</label>
                  <select
                    value={newUserForm.role}
                    onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY">Faculty Member</option>
                    <option value="RESEARCH_SCHOLAR">Research Scholar</option>
                    <option value="LIBRARIAN">Head Librarian</option>
                    <option value="ASSISTANT_LIBRARIAN">Assistant Librarian</option>
                    <option value="ACCOUNTS_OFFICER">Accounts Officer</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Library Science / Computer Science"
                    value={newUserForm.department || ''}
                    onChange={e => setNewUserForm({ ...newUserForm, department: e.target.value })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Assigned Library Branch</label>
                  <select
                    value={newUserForm.assignedBranch || branches[0] || 'Central Academic Library'}
                    onChange={e => setNewUserForm({ ...newUserForm, assignedBranch: e.target.value })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer font-medium text-xs"
                  >
                    {branches.map(b => (
                      <option key={b} value={b} className="bg-white text-slate-900">
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-[#f1f5f9] p-3 rounded-xl border border-slate-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-500 font-medium flex items-center space-x-1.5">
                    <span>Borrow Limit Policy</span>
                    <span className="text-[10px] text-slate-400">(Concurrent active checkouts)</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(newUserForm.maxBorrowLimit || 5) >= 9999}
                      onChange={e => setNewUserForm({ ...newUserForm, maxBorrowLimit: e.target.checked ? 99999 : 5 })}
                      className="rounded accent-emerald-500 cursor-pointer h-3.5 w-3.5"
                    />
                    <span className="text-emerald-400 font-bold text-[11px] flex items-center space-x-1">
                      <Sparkles className="h-3 w-3" />
                      <span>Unlimited (∞ Uncapped)</span>
                    </span>
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    disabled={(newUserForm.maxBorrowLimit || 5) >= 9999}
                    value={(newUserForm.maxBorrowLimit || 5) >= 9999 ? '' : (newUserForm.maxBorrowLimit || 5)}
                    placeholder={(newUserForm.maxBorrowLimit || 5) >= 9999 ? '∞ Unlimited' : '5'}
                    onChange={e => setNewUserForm({ ...newUserForm, maxBorrowLimit: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="flex-1 bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:bg-emerald-950/20 disabled:text-emerald-300 font-mono text-xs"
                  />
                  <div className="flex items-center gap-1">
                    {[5, 10, 25, 50].map(qty => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setNewUserForm({ ...newUserForm, maxBorrowLimit: qty })}
                        className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          newUserForm.maxBorrowLimit === qty
                            ? 'bg-blue-600 border-blue-400 text-white'
                            : 'bg-slate-100 border-slate-200/90 text-slate-500 hover:text-white'
                        }`}
                      >
                        {qty}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setNewUserForm({ ...newUserForm, maxBorrowLimit: 99999 })}
                      className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        (newUserForm.maxBorrowLimit || 5) >= 9999
                          ? 'bg-emerald-600 border-emerald-400 text-white'
                          : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40'
                      }`}
                    >
                      ∞ Uncapped
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/90 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#f1f5f9] border border-slate-200/90 text-slate-500 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer shadow-md shadow-blue-500/20"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member ID Card Modal */}
      {isCardModalOpen && selectedCardUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 max-w-xl w-full space-y-5 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Official Library Member ID Card</h3>
                  <p className="text-xs text-slate-500">{selectedCardUser.name} • {selectedCardUser.memberCode}</p>
                </div>
              </div>

              <button
                onClick={() => setIsCardModalOpen(false)}
                className="text-slate-500 hover:text-white text-lg font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Theme & Side Controls */}
            <div className="flex items-center justify-between bg-[#f1f5f9] p-2 rounded-xl border border-slate-200/90 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500 text-[11px] font-medium mr-1">Theme:</span>
                <button
                  onClick={() => setCardTheme('EMERALD')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                    cardTheme === 'EMERALD' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Emerald
                </button>
                <button
                  onClick={() => setCardTheme('NAVY')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                    cardTheme === 'NAVY' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Navy
                </button>
                <button
                  onClick={() => setCardTheme('GOLD')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                    cardTheme === 'GOLD' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Academic Gold
                </button>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setCardSide('FRONT')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                    cardSide === 'FRONT' ? 'bg-zinc-700 text-white' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Front Side
                </button>
                <button
                  onClick={() => setCardSide('BACK')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                    cardSide === 'BACK' ? 'bg-zinc-700 text-white' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Back Side
                </button>
              </div>
            </div>

            {/* Digital ID Card Display Area */}
            <div className="flex justify-center my-2">
              {(() => {
                const modalRoleCfg = getRoleCardConfig(selectedCardUser.role);
                const isEmerald = cardTheme === 'EMERALD';
                const isNavy = cardTheme === 'NAVY';
                const isGold = cardTheme === 'GOLD';

                const borderClass = isEmerald
                  ? 'border-emerald-500/60 shadow-emerald-950/60'
                  : isNavy
                  ? 'border-blue-500/60 shadow-blue-950/60'
                  : isGold
                  ? 'border-amber-500/60 shadow-amber-950/60'
                  : modalRoleCfg.cardBorder;

                const bgGradient = isEmerald
                  ? 'bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#09090b]'
                  : isNavy
                  ? 'bg-gradient-to-br from-[#1e3a8a] via-[#172554] to-[#09090b]'
                  : isGold
                  ? 'bg-gradient-to-br from-[#78350f] via-[#451a03] to-[#09090b]'
                  : `bg-gradient-to-br ${modalRoleCfg.gradientBg}`;

                return (
                  <div
                    id="printable-member-card"
                    className={`w-[440px] h-[270px] rounded-2xl p-4.5 shadow-2xl relative overflow-hidden border-2 flex flex-col justify-between transition-all ${borderClass} ${bgGradient}`}
                  >
                    {/* Background Watermark/Patterns */}
                    <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-white/5 rounded-full blur-2xl pointer-events-none" />

                    {cardSide === 'FRONT' ? (
                      <>
                        {/* Card Header Banner with Institution Logo */}
                        <div className="flex items-center justify-between border-b border-white/20 pb-2 z-10">
                          <div className="flex items-center space-x-2.5">
                            <img
                              src={pslimsLogo}
                              alt="Institution Logo"
                              className="w-10 h-10 rounded-full object-cover border border-white/40 shadow-sm shrink-0"
                            />
                            <div>
                              <div className="text-xs font-black text-white tracking-wider uppercase font-serif">
                                Pakistan Library System (PLiMS)
                              </div>
                              <div className="text-[9px] text-cyan-300 font-mono font-bold">
                                {modalRoleCfg.label}
                              </div>
                            </div>
                          </div>
                          <div className="px-2.5 py-0.5 rounded-full bg-white/15 border border-white/30 text-white text-[9px] font-mono font-bold tracking-wide shadow-sm">
                            {selectedCardUser.status === 'ACTIVE' ? 'VERIFIED' : selectedCardUser.status}
                          </div>
                        </div>

                        {/* Card Main Body */}
                        <div className="flex items-center space-x-3.5 z-10 my-1">
                          <div className="relative shrink-0">
                            <img
                              src={selectedCardUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                              alt={selectedCardUser.name}
                              className="w-20 h-24 rounded-xl object-cover border-2 border-white/40 shadow-lg"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-md">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </div>
                          </div>

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="text-base font-extrabold text-white truncate tracking-tight">
                              {selectedCardUser.name}
                            </div>
                            <div className="inline-block px-2 py-0.5 rounded bg-white/20 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                              {selectedCardUser.role} • {modalRoleCfg.category}
                            </div>
                            <div className="text-[11px] text-slate-800 font-mono">
                              Member ID: <span className="text-cyan-300 font-bold">{selectedCardUser.memberCode}</span>
                            </div>
                            <div className="text-[10px] text-slate-700 truncate">
                              Dept: <span className="text-white font-medium">{selectedCardUser.department || 'General Academic'}</span>
                            </div>
                            <div className="text-[10px] text-slate-700 truncate">
                              Branch: <span className="text-white font-medium">{selectedCardUser.assignedBranch || 'Central Library'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Bar */}
                        <div className="border-t border-white/20 pt-2 flex items-center justify-between z-10">
                          {/* Barcode representation */}
                          <div className="bg-black/70 px-2.5 py-1 rounded border border-white/20 flex flex-col items-center">
                            <div className="font-mono text-[10px] tracking-[0.25em] text-cyan-300 font-bold">
                              |||| ||| ||||| ||||
                            </div>
                            <div className="font-mono text-[8px] text-slate-500 mt-0.5">
                              {selectedCardUser.memberCode}
                            </div>
                          </div>

                          <div className="text-right text-[9px] text-slate-800 font-mono">
                            <div>Borrow Limit: <span className="text-white font-bold">{(selectedCardUser.maxBorrowLimit || 5) >= 9999 ? '∞ Unlimited' : `${selectedCardUser.maxBorrowLimit || 5} Books`}</span></div>
                            <div>Status: <span className="text-emerald-300 font-bold">{selectedCardUser.status}</span></div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Back Side of Card */}
                        <div className="space-y-2.5 text-white z-10">
                          <div className="border-b border-white/20 pb-2 text-xs font-bold text-cyan-300 flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <img src={pslimsLogo} alt="Logo" className="w-5 h-5 rounded object-contain bg-white/20 p-0.5" />
                              <span className="font-serif uppercase tracking-wider">LIBRARY USE & TERMS</span>
                            </div>
                            <QrCode className="h-5 w-5 text-white" />
                          </div>

                          <ul className="text-[10px] text-slate-800 space-y-1 list-disc pl-4">
                            <li>Official member ID issued by Pakistan Library System (PLiMS).</li>
                            <li>Card is non-transferable; present at circulation desk upon request.</li>
                            <li>Report lost or stolen cards immediately to library administration.</li>
                            <li>Overdue items incur fines as per PLiMS circulation policy.</li>
                          </ul>

                          <div className="bg-slate-900/30 p-2 rounded-lg border border-white/15 text-[9px] font-mono text-slate-700 flex justify-between items-center">
                            <div>
                              <div>Authorized Signature: __________________</div>
                              <div className="text-slate-500 mt-0.5">Issued: {new Date().toISOString().slice(0, 10)} | Valid: 2 Years</div>
                            </div>
                            <div className="text-right border-l border-white/15 pl-2">
                              <div className="text-cyan-300 font-bold">RFID CHIP</div>
                              <div className="text-[8px] text-slate-500">PLiMS-PASS-v4</div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/90">
              <button
                onClick={() => handleDownloadSingleMemberCardHtml(selectedCardUser)}
                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Download Card (HTML)</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-2.5 rounded-xl bg-[#f1f5f9] hover:bg-slate-100 border border-slate-200/90 text-slate-900 text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
              >
                <Printer className="h-4 w-4 text-purple-400" />
                <span>Print Card</span>
              </button>

              <button
                onClick={() => {
                  const data = `PLiMS Member ID: ${selectedCardUser.id}\nCode: ${selectedCardUser.memberCode}\nName: ${selectedCardUser.name}\nRole: ${selectedCardUser.role}\nDept: ${selectedCardUser.department}\nStatus: ${selectedCardUser.status}`;
                  navigator.clipboard.writeText(data);
                  setDownloadToast(`✨ Copied member details for ${selectedCardUser.name}!`);
                  setTimeout(() => setDownloadToast(null), 3000);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-[#f1f5f9] hover:bg-slate-100 border border-slate-200/90 text-slate-900 text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
              >
                <Copy className="h-4 w-4 text-blue-400" />
                <span>Copy Details</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Profile & Borrow Limits Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Edit className="h-5 w-5 text-amber-400" />
                <span>Edit Member Record & Privileges</span>
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-500 hover:text-white cursor-pointer text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs max-h-[80vh] overflow-y-auto pr-1">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-black/40 border border-white/10">
                <img
                  src={editUserForm.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                  alt={editUserForm.name}
                  className="w-12 h-12 rounded-xl object-cover border border-white/20"
                />
                <div>
                  <div className="text-white font-bold text-sm">{editingUser.name}</div>
                  <div className="text-slate-500 font-mono text-[11px]">{editingUser.memberCode} • ID: {editingUser.id}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editUserForm.name || ''}
                    onChange={e => setEditUserForm({ ...editUserForm, name: e.target.value })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Email</label>
                  <input
                    type="email"
                    required
                    value={editUserForm.email || ''}
                    onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Role Category</label>
                  <select
                    value={editUserForm.role}
                    onChange={e => setEditUserForm({ ...editUserForm, role: e.target.value as UserRole })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY">Faculty Member</option>
                    <option value="RESEARCH_SCHOLAR">Research Scholar</option>
                    <option value="LIBRARIAN">Head Librarian</option>
                    <option value="ASSISTANT_LIBRARIAN">Assistant Librarian</option>
                    <option value="ACCOUNTS_OFFICER">Accounts Officer</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Account Status</label>
                  <select
                    value={editUserForm.status}
                    onChange={e => setEditUserForm({ ...editUserForm, status: e.target.value as any })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE (Good Standing)</option>
                    <option value="SUSPENDED">SUSPENDED (Overdue/Fine Block)</option>
                    <option value="ALUMNI">ALUMNI (Archived)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Department</label>
                  <input
                    type="text"
                    value={editUserForm.department || ''}
                    onChange={e => setEditUserForm({ ...editUserForm, department: e.target.value })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Assigned Branch</label>
                  <select
                    value={editUserForm.assignedBranch || branches[0]}
                    onChange={e => setEditUserForm({ ...editUserForm, assignedBranch: e.target.value })}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {branches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Borrow Limit Policy & Unlimited Settings */}
              <div className="bg-[#f1f5f9] p-3.5 rounded-xl border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-amber-300 font-semibold flex items-center space-x-1.5">
                    <span>Borrow Limit Policy</span>
                    <span className="text-[10px] text-slate-500 font-normal">(Concurrent active checkouts)</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(editUserForm.maxBorrowLimit || 5) >= 9999}
                      onChange={e => setEditUserForm({ ...editUserForm, maxBorrowLimit: e.target.checked ? 99999 : 5 })}
                      className="rounded accent-emerald-500 cursor-pointer h-3.5 w-3.5"
                    />
                    <span className="text-emerald-400 font-bold text-[11px] flex items-center space-x-1">
                      <Sparkles className="h-3 w-3" />
                      <span>Unlimited (∞ Uncapped)</span>
                    </span>
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    disabled={(editUserForm.maxBorrowLimit || 5) >= 9999}
                    value={(editUserForm.maxBorrowLimit || 5) >= 9999 ? '' : (editUserForm.maxBorrowLimit || 5)}
                    placeholder={(editUserForm.maxBorrowLimit || 5) >= 9999 ? '∞ Unlimited' : '5'}
                    onChange={e => setEditUserForm({ ...editUserForm, maxBorrowLimit: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="flex-1 bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:bg-emerald-950/20 disabled:text-emerald-300 font-mono text-xs"
                  />
                  <div className="flex items-center gap-1">
                    {[5, 10, 25, 50].map(qty => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setEditUserForm({ ...editUserForm, maxBorrowLimit: qty })}
                        className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          editUserForm.maxBorrowLimit === qty
                            ? 'bg-amber-600 border-amber-400 text-white'
                            : 'bg-slate-100 border-slate-200/90 text-slate-500 hover:text-white'
                        }`}
                      >
                        {qty}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEditUserForm({ ...editUserForm, maxBorrowLimit: 99999 })}
                      className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        (editUserForm.maxBorrowLimit || 5) >= 9999
                          ? 'bg-emerald-600 border-emerald-400 text-white'
                          : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40'
                      }`}
                    >
                      ∞ Uncapped
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/90 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-[#f1f5f9] border border-slate-200/90 text-slate-500 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Add Members Modal (Unlimited Capacity Patron Ingestion) */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Batch Member Registration</h3>
                  <p className="text-xs text-purple-300">Unlimited capacity patron intake & high-volume accessioning</p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="text-slate-500 hover:text-white cursor-pointer text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBatchAddMembers} className="space-y-3.5 text-xs max-h-[80vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Department Preset</label>
                  <input
                    type="text"
                    required
                    value={batchDept}
                    onChange={e => setBatchDept(e.target.value)}
                    placeholder="e.g. Computer Science / Business"
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Role Preset</label>
                  <select
                    value={batchRole}
                    onChange={e => setBatchRole(e.target.value as UserRole)}
                    className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY">Faculty Member</option>
                    <option value="RESEARCH_SCHOLAR">Research Scholar</option>
                    <option value="LIBRARIAN">Head Librarian</option>
                    <option value="ASSISTANT_LIBRARIAN">Assistant Librarian</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-medium">Assigned Library Branch</label>
                <select
                  value={batchBranch}
                  onChange={e => setBatchBranch(e.target.value)}
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  {branches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-500 font-medium">Paste Member Names (Optional, 1 per line)</label>
                  <span className="text-[10px] text-slate-500">Or use sequential generator below</span>
                </div>
                <textarea
                  rows={4}
                  value={batchNamesText}
                  onChange={e => setBatchNamesText(e.target.value)}
                  placeholder="Ali Ahmed&#10;Fatima Noor&#10;Muhammad Bilal&#10;Zainab Khan"
                  className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 font-mono text-xs"
                />
              </div>

              {!batchNamesText.trim() && (
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Count of Members to Auto-Generate</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      value={batchQuantity}
                      onChange={e => setBatchQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 font-mono"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[5, 10, 25, 50, 100].map(cnt => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setBatchQuantity(cnt)}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                            batchQuantity === cnt
                              ? 'bg-purple-600 border-purple-400 text-white'
                              : 'bg-slate-100 border-slate-200/90 text-slate-500 hover:text-white'
                          }`}
                        >
                          +{cnt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Unlimited Borrow Limit Policy */}
              <div className="bg-purple-950/20 border border-purple-500/30 p-3 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-purple-300 font-semibold flex items-center space-x-1.5">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span>Unlimited Borrowing Privilege</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Grant unlimited book checkouts (∞ uncapped) to all generated members</p>
                </div>
                <input
                  type="checkbox"
                  checked={batchUnlimited}
                  onChange={e => setBatchUnlimited(e.target.checked)}
                  className="rounded accent-purple-500 cursor-pointer h-4 w-4"
                />
              </div>

              <div className="pt-3 border-t border-slate-200/90 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#f1f5f9] border border-slate-200/90 text-slate-500 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-md shadow-purple-500/20 flex items-center space-x-1.5"
                >
                  <Users className="h-4 w-4" />
                  <span>Execute Unlimited Batch Ingestion</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
