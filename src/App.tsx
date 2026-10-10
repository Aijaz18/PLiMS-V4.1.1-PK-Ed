import React, { useState, useEffect } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { Sidebar, ModuleTab } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { PublicOpacPage } from './components/PublicOpacPage';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy-loaded Feature Modules (dramatically accelerates application startup and navigation)
const DashboardModule = React.lazy(() => import('./components/modules/DashboardModule').then(m => ({ default: m.DashboardModule })));
const SettingsModule = React.lazy(() => import('./components/modules/SettingsModule').then(m => ({ default: m.SettingsModule })));
const UserMemberModule = React.lazy(() => import('./components/modules/UserMemberModule').then(m => ({ default: m.UserMemberModule })));
const CataloguingModule = React.lazy(() => import('./components/modules/CataloguingModule').then(m => ({ default: m.CataloguingModule })));
const AuthorityControlModule = React.lazy(() => import('./components/modules/AuthorityControlModule').then(m => ({ default: m.AuthorityControlModule })));
const CirculationModule = React.lazy(() => import('./components/modules/CirculationModule').then(m => ({ default: m.CirculationModule })));
const DigitalLibraryModule = React.lazy(() => import('./components/modules/DigitalLibraryModule').then(m => ({ default: m.DigitalLibraryModule })));
const AcquisitionModule = React.lazy(() => import('./components/modules/AcquisitionModule').then(m => ({ default: m.AcquisitionModule })));
const SerialsModule = React.lazy(() => import('./components/modules/SerialsModule').then(m => ({ default: m.SerialsModule })));
const StockVerificationModule = React.lazy(() => import('./components/modules/StockVerificationModule').then(m => ({ default: m.StockVerificationModule })));
const ReportsModule = React.lazy(() => import('./components/modules/ReportsModule').then(m => ({ default: m.ReportsModule })));
const BarcodeGeneratorModule = React.lazy(() => import('./components/modules/BarcodeGeneratorModule').then(m => ({ default: m.BarcodeGeneratorModule })));
const AiAssistantModule = React.lazy(() => import('./components/modules/AiAssistantModule').then(m => ({ default: m.AiAssistantModule })));
const MyLibraryModule = React.lazy(() => import('./components/modules/MyLibraryModule').then(m => ({ default: m.MyLibraryModule })));
const ImportExportModule = React.lazy(() => import('./components/modules/ImportExportModule').then(m => ({ default: m.ImportExportModule })));
const BackupLogsModule = React.lazy(() => import('./components/modules/BackupLogsModule').then(m => ({ default: m.BackupLogsModule })));
const DocumentationModule = React.lazy(() => import('./components/modules/DocumentationModule').then(m => ({ default: m.DocumentationModule })));

// Lazy-loaded Modals
const CommandPalette = React.lazy(() => import('./components/CommandPalette').then(m => ({ default: m.CommandPalette })));
const AddBranchAndStaffModal = React.lazy(() => import('./components/AddBranchAndStaffModal').then(m => ({ default: m.AddBranchAndStaffModal })));
const LibrarianBot = React.lazy(() => import('./components/LibrarianBot/LibrarianBot').then(m => ({ default: m.LibrarianBot })));

function ModuleLoadingFallback() {
  return (
    <div className="flex h-full min-h-[350px] w-full flex-col items-center justify-center p-8 text-center select-none animate-in fade-in duration-150">
      <div className="relative mb-3">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-500/20 border-t-emerald-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-emerald-700 font-mono">P</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-700">Loading PLiMS Workspace Module...</p>
      <p className="text-[10px] text-slate-400 mt-0.5">Pakistan Library Management System</p>
    </div>
  );
}

import {
  logCirculationActivity,
  logSystemConfigActivity,
  logUserAdminActivity
} from './services/activityLogger';

import {
  loadLocalData,
  saveLocalData,
  addQueuedOfflineAction,
  getOfflineQueue,
  saveOfflineQueue,
  clearSyncedQueue,
  getSimulatedOfflineMode,
  registerLibraryServiceWorker,
  OfflineQueuedAction
} from './services/offlineStorage';

// Mock Data
import {
  initialSettings,
  initialUsers,
  initialBooks,
  initialCopies,
  initialTransactions,
  initialDigitalAssets,
  initialReservations
} from './data/mockDb';

import { BookRecord, BookCopy, UserProfile, CirculationTransaction, DigitalAsset, LibrarySettings, UserRole, BookReservation, AppTheme } from './types/alims';
import { AppLanguage } from './utils/i18n';
import { getThemeConfig, applyThemeToDocument } from './utils/themeConfig';
import {
  BackgroundLayer,
  loadSavedBgConfig,
  MainPageBgConfig
} from './components/MainThemeBgSelector';

export function App() {
  const [currentTab, setCurrentTab] = useState<ModuleTab>('DASHBOARD');

  const handleNavigateTab = (tab: ModuleTab) => {
    React.startTransition(() => {
      setCurrentTab(tab);
    });
  };
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('pslims_theme') as AppTheme) || 'pakistan-flag';
  });
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>(() => {
    return (localStorage.getItem('pslims_language') as AppLanguage) || 'en';
  });
  const [bgConfig, setBgConfig] = useState<MainPageBgConfig>(() => loadSavedBgConfig());

  // Listen for background config updates from Theme Studio
  useEffect(() => {
    const handleStorage = () => {
      setBgConfig(loadSavedBgConfig());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [branchModalInitialMode, setBranchModalInitialMode] = useState<'BRANCH' | 'STAFF'>('BRANCH');

  // Authentication & Branch Session States with Persistence
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pslims_is_authenticated') === 'true';
    } catch {
      return false;
    }
  });
  const [activeBranch, setActiveBranch] = useState<string>(() => {
    try {
      return localStorage.getItem('pslims_auth_branch') || initialSettings.branches[0] || 'Central Academic Library';
    } catch {
      return initialSettings.branches[0] || 'Central Academic Library';
    }
  });

  // Dedicated portal mode requested: 'STAFF' (Librarian & Staff) vs 'MEMBER' (Student & Faculty Member)
  const [loginPortalMode, setLoginPortalMode] = useState<'STAFF' | 'MEMBER'>('STAFF');
  const [isLibrarianBotOpen, setIsLibrarianBotOpen] = useState<boolean>(false);

  // Public OPAC Home Page vs. Login Portal display state for unauthenticated visitors
  const [isLoginViewOpen, setIsLoginViewOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('view') === 'login' || window.location.pathname.startsWith('/login');
  });

  // Core Database States - Persisted in Browser Local Storage with intelligent seed-merging
  const [settings, setSettings] = useState<LibrarySettings>(() => loadLocalData('pslims_db_settings', initialSettings));
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const loaded = loadLocalData<UserProfile[]>('pslims_db_users', initialUsers);
    const existingIds = new Set((loaded || []).map(u => u.id));
    const missing = initialUsers.filter(u => !existingIds.has(u.id));
    return [...(loaded || []), ...missing].map(u => {
      if (u.id === 'usr_admin' || u.memberCode === 'ADM-001') {
        return {
          ...u,
          name: 'Dr. Aijaz Akhter',
          email: 'ahmedaniaijazakhter@gmail.com',
          secondaryEmail: 'admin@aijaz-edu.org',
          role: 'SUPER_ADMIN' as UserRole,
          maxBorrowLimit: 99999,
        };
      }
      const isStaff = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PRINCIPAL', 'CHIEF_LIBRARIAN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN', 'ACCOUNTS_OFFICER'].includes(u.role);
      if (isStaff && (!u.maxBorrowLimit || u.maxBorrowLimit < 9999)) {
        return { ...u, maxBorrowLimit: 99999 };
      }
      return u;
    });
  });
  const [books, setBooks] = useState<BookRecord[]>(() => {
    const loaded = loadLocalData<BookRecord[]>('pslims_db_books', initialBooks);
    const existingIds = new Set((loaded || []).map(b => b.id));
    const missing = initialBooks.filter(b => !existingIds.has(b.id));
    return [...(loaded || []), ...missing];
  });
  const [copies, setCopies] = useState<BookCopy[]>(() => {
    const loaded = loadLocalData<BookCopy[]>('pslims_db_copies', initialCopies);
    const existingIds = new Set((loaded || []).map(c => c.id));
    const missing = initialCopies.filter(c => !existingIds.has(c.id));
    return [...(loaded || []), ...missing];
  });
  const [transactions, setTransactions] = useState<CirculationTransaction[]>(() => {
    const loaded = loadLocalData<CirculationTransaction[]>('pslims_db_transactions', initialTransactions);
    const existingIds = new Set((loaded || []).map(t => t.id));
    const missing = initialTransactions.filter(t => !existingIds.has(t.id));
    return [...(loaded || []), ...missing];
  });
  const [digitalAssets, setDigitalAssets] = useState<DigitalAsset[]>(() => loadLocalData('pslims_db_digital_assets', initialDigitalAssets));
  const [reservations, setReservations] = useState<BookReservation[]>(() => loadLocalData('pslims_db_reservations', initialReservations));

  // Active logged in user profile (dynamically synced with persisted users state and saved session)
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const loadedUsers = loadLocalData<UserProfile[]>('pslims_db_users', initialUsers);
    try {
      const savedUserId = localStorage.getItem('pslims_auth_user_id');
      if (savedUserId) {
        const found = loadedUsers.find(u => u.id === savedUserId || u.memberCode === savedUserId || u.email === savedUserId);
        if (found) return found;
      }
    } catch {
      // ignore
    }
    return loadedUsers[0] || initialUsers[0];
  });

  /**
   * Restores user's previous workspace state after re-login or page refresh:
   * Last active module, last selected library branch, user filters.
   * Enforces role security: patron roles cannot restore staff modules.
   */
  const restoreUserWorkspace = (user: UserProfile) => {
    try {
      const raw = localStorage.getItem(`pslims_workspace_${user.id}`);
      if (raw) {
        const ws = JSON.parse(raw);
        const isMember = ['STUDENT', 'FACULTY', 'RESEARCH_SCHOLAR', 'GUEST'].includes(user.role);
        const isStaffTab = [
          'DASHBOARD', 'SETTINGS', 'MEMBERS', 'CATALOGUING', 'AUTHORITY',
          'CIRCULATION', 'ACQUISITION', 'SERIALS', 'STOCK', 'INVENTORY',
          'REPORTS', 'IMPORT_EXPORT', 'BACKUP_LOGS', 'BARCODES', 'AI_ASSISTANT'
        ].includes(ws.tab);

        React.startTransition(() => {
          if (isMember && isStaffTab) {
            setCurrentTab('MY_LIBRARY');
          } else if (ws.tab) {
            setCurrentTab(ws.tab as ModuleTab);
          } else {
            setCurrentTab(isMember ? 'MY_LIBRARY' : 'DASHBOARD');
          }
        });

        if (ws.branch && settings.branches.includes(ws.branch)) {
          setActiveBranch(ws.branch);
          localStorage.setItem('pslims_auth_branch', ws.branch);
        }
        return;
      }
    } catch {
      // ignore
    }
    const isMember = ['STUDENT', 'FACULTY', 'RESEARCH_SCHOLAR', 'GUEST'].includes(user.role);
    React.startTransition(() => {
      setCurrentTab(isMember ? 'MY_LIBRARY' : 'DASHBOARD');
    });
  };

  // Restore workspace on initial application boot if already authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      restoreUserWorkspace(currentUser);
    }
  }, []);

  // Persist user workspace state whenever active module or branch changes
  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      try {
        localStorage.setItem(
          `pslims_workspace_${currentUser.id}`,
          JSON.stringify({ tab: currentTab, branch: activeBranch, timestamp: Date.now() })
        );
      } catch {
        // ignore
      }
    }
  }, [currentTab, activeBranch, isAuthenticated, currentUser?.id]);

  // Strict Role-Based Access Guard: Redirect patron roles away from staff modules
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const isMember = ['STUDENT', 'FACULTY', 'RESEARCH_SCHOLAR', 'GUEST'].includes(currentUser.role);
      const isStaffTab = [
        'DASHBOARD', 'SETTINGS', 'MEMBERS', 'CATALOGUING', 'AUTHORITY',
        'CIRCULATION', 'ACQUISITION', 'SERIALS', 'STOCK', 'INVENTORY',
        'REPORTS', 'IMPORT_EXPORT', 'BACKUP_LOGS', 'BARCODES', 'AI_ASSISTANT'
      ].includes(currentTab);

      if (isMember && isStaffTab) {
        setCurrentTab('MY_LIBRARY');
      }
    }
  }, [currentTab, isAuthenticated, currentUser]);

  // Register PWA Service Worker & Save Local Storage Effects
  useEffect(() => {
    registerLibraryServiceWorker();
  }, []);

  useEffect(() => {
    saveLocalData('pslims_db_settings', settings);
  }, [settings]);

  useEffect(() => {
    saveLocalData('pslims_db_users', users);
  }, [users]);

  useEffect(() => {
    saveLocalData('pslims_db_books', books);
  }, [books]);

  useEffect(() => {
    saveLocalData('pslims_db_copies', copies);
  }, [copies]);

  useEffect(() => {
    saveLocalData('pslims_db_transactions', transactions);
  }, [transactions]);

  // Handle persona role change from Header
  const handleRoleChange = (role: UserRole) => {
    logUserAdminActivity(
      'ROLE_CHANGE',
      currentUser.name,
      currentUser.role,
      `Role: ${role}`,
      `Active persona role switched from ${currentUser.role} to ${role}.`
    );
    const matchingUser = users.find(u => u.role === role);
    if (matchingUser) {
      setCurrentUser(matchingUser);
      if (['STUDENT', 'FACULTY', 'RESEARCH_SCHOLAR'].includes(role)) {
        setCurrentTab('MY_LIBRARY');
      }
    } else {
      setCurrentUser(prev => ({ ...prev, role }));
      if (['STUDENT', 'FACULTY', 'RESEARCH_SCHOLAR'].includes(role)) {
        setCurrentTab('MY_LIBRARY');
      }
    }
  };

  // Theme & Language effects on document root
  useEffect(() => {
    applyThemeToDocument(currentTheme);
    localStorage.setItem('pslims_theme', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    document.documentElement.dir = currentLanguage === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
    localStorage.setItem('pslims_language', currentLanguage);
  }, [currentLanguage]);

  // Handlers for Data Mutations
  const handleSaveSettings = (newSettings: LibrarySettings) => {
    setSettings(newSettings);
    logSystemConfigActivity(
      'SETTINGS_UPDATE',
      currentUser.name,
      currentUser.role,
      newSettings.libraryName,
      `Updated system settings: Daily fine PKR ${newSettings.finePerDay}, ${newSettings.branches.length} active branches.`
    );
  };

  const handleAddUser = (user: Partial<UserProfile>) => {
    const created: UserProfile = {
      id: `usr_${Date.now()}`,
      name: user.name || 'New Member',
      email: user.email || 'member@university.edu',
      role: user.role || 'STUDENT',
      memberCode: user.memberCode || `MEM-${Date.now()}`,
      department: user.department || 'General',
      designation: user.designation || 'Student',
      phone: user.phone || '+1 555-0192',
      status: 'ACTIVE',
      currentBorrowed: 0,
      maxBorrowLimit: user.maxBorrowLimit || 5,
      finePending: 0,
      rfidTag: user.rfidTag || `E20000${Math.floor(100000 + Math.random() * 900000)}`,
      qrCodeData: `PLIMS:MEMBER:${user.memberCode}`,
      avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'
    };
    setUsers(prev => [created, ...prev]);
    logUserAdminActivity(
      'USER_CREATE',
      currentUser.name,
      currentUser.role,
      `${created.name} (${created.memberCode})`,
      `Created new ${created.role} user profile in department ${created.department}.`
    );
  };

  const handleUpdateUser = (id: string, updated: Partial<UserProfile>) => {
    setUsers(prev => {
      const updatedList = prev.map(u => (u.id === id ? { ...u, ...updated } : u));
      saveLocalData('pslims_db_users', updatedList);
      return updatedList;
    });
    if (currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updated }));
    }
    logUserAdminActivity(
      'USER_UPDATE',
      currentUser.name,
      currentUser.role,
      `User ID: ${id}`,
      `Updated user profile fields: ${Object.keys(updated).join(', ')}.`
    );
  };

  const handleDeleteUser = (id: string) => {
    const toDelete = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    logUserAdminActivity(
      'USER_DELETE',
      currentUser.name,
      currentUser.role,
      toDelete ? `${toDelete.name} (${toDelete.memberCode})` : `User ${id}`,
      `Deleted user account record from database directory.`
    );
  };

  const handleAddBranch = (branchName: string) => {
    if (settings.branches.includes(branchName)) return;
    setSettings(prev => ({
      ...prev,
      branches: [...prev.branches, branchName]
    }));
    logSystemConfigActivity(
      'BRANCH_ADD',
      currentUser.name,
      currentUser.role,
      branchName,
      `Registered new library branch location "${branchName}".`
    );
  };

  const handleDeleteBranch = (branchName: string) => {
    setSettings(prev => ({
      ...prev,
      branches: prev.branches.filter(b => b !== branchName)
    }));
    logSystemConfigActivity(
      'BRANCH_DELETE',
      currentUser.name,
      currentUser.role,
      branchName,
      `Removed branch location "${branchName}" from system registry.`
    );
  };

  const handleAddBook = (book: BookRecord) => {
    setBooks(prev => [book, ...prev]);
  };

  const handleDeleteBook = (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
    setCopies(prev => prev.filter(c => c.bookId !== id));
  };

  const handleDeleteAllBooks = () => {
    setBooks([]);
    setCopies([]);
  };

  const handleRestoreSampleBooks = () => {
    setBooks(initialBooks);
    setCopies(initialCopies);
  };

  const handleUpdateBook = (id: string, updated: BookRecord) => {
    setBooks(prev => prev.map(b => (b.id === id ? updated : b)));
  };

  const handleAddCopies = (newCopies: BookCopy[], bookId?: string) => {
    setCopies(prev => [...newCopies, ...prev]);
    if (bookId) {
      setBooks(prev =>
        prev.map(b =>
          b.id === bookId
            ? {
                ...b,
                totalCopies: b.totalCopies + newCopies.length,
                availableCopies: b.availableCopies + newCopies.length
              }
            : b
        )
      );
    }
  };

  const handleUpdateCopy = (copyId: string, updated: Partial<BookCopy>) => {
    setCopies(prev => prev.map(c => (c.id === copyId ? { ...c, ...updated } : c)));
  };

  const handleDeleteCopy = (copyId: string, bookId?: string) => {
    const target = copies.find(c => c.id === copyId);
    const targetBookId = bookId || target?.bookId;
    setCopies(prev => prev.filter(c => c.id !== copyId));
    if (targetBookId) {
      setBooks(prev =>
        prev.map(b =>
          b.id === targetBookId
            ? {
                ...b,
                totalCopies: Math.max(1, b.totalCopies - 1),
                availableCopies: Math.max(0, b.availableCopies - (target?.status === 'AVAILABLE' ? 1 : 0))
              }
            : b
        )
      );
    }
  };

  const handleAddDigitalAsset = (asset: DigitalAsset) => {
    setDigitalAssets(prev => [asset, ...prev]);
  };

  // Circulation Engine Handlers with Offline LocalStorage Queue Integration
  const handleIssueBook = async (bookIdentifier: string, memberIdentifier: string) => {
    const isOfflineMode = !navigator.onLine || getSimulatedOfflineMode();

    // 1. Resolve Member (by memberCode, id, email, or name)
    const cleanMemId = (memberIdentifier || '').trim().toLowerCase();
    let member = users.find(
      u =>
        u.id.toLowerCase() === cleanMemId ||
        (u.memberCode && u.memberCode.toLowerCase() === cleanMemId) ||
        (u.email && u.email.toLowerCase() === cleanMemId) ||
        u.name.toLowerCase() === cleanMemId
    );

    if (!member) {
      // Fallback: if only one user exists or search matches partially
      member = users.find(
        u =>
          (u.memberCode && u.memberCode.toLowerCase().includes(cleanMemId)) ||
          u.name.toLowerCase().includes(cleanMemId)
      );
    }

    if (!member) {
      alert(`Member '${memberIdentifier}' could not be found. Please select a registered member.`);
      return { error: `Member '${memberIdentifier}' not registered.` };
    }

    // 2. Resolve Book & Copy (by accessionNumber, barcode, id, isbn, or title)
    const cleanBookId = (bookIdentifier || '').trim().toLowerCase();
    
    // Check in copies first
    let copy = copies.find(
      c =>
        (c.barcode && c.barcode.toLowerCase() === cleanBookId) ||
        (c.accessionNumber && c.accessionNumber.toLowerCase() === cleanBookId) ||
        (c.rfidTag && c.rfidTag.toLowerCase() === cleanBookId) ||
        (c.rfidUid && c.rfidUid.toLowerCase() === cleanBookId) ||
        c.id.toLowerCase() === cleanBookId
    );

    // Find the book record
    let book = copy
      ? books.find(b => b.id === copy?.bookId)
      : books.find(
          b =>
            b.id.toLowerCase() === cleanBookId ||
            (b.accessionNumber && b.accessionNumber.toLowerCase() === cleanBookId) ||
            (b.isbn && b.isbn.toLowerCase() === cleanBookId) ||
            b.title.toLowerCase().includes(cleanBookId)
        );

    if (!book && copy) {
      book = books.find(b => b.id === copy?.bookId);
    }

    if (!book) {
      alert(`Book '${bookIdentifier}' could not be found in library catalog.`);
      return { error: `Book '${bookIdentifier}' not found.` };
    }

    const accessionNo = copy?.accessionNumber || book.accessionNumber || `ACC-${Math.floor(10000 + Math.random() * 90000)}`;
    const barcodeNo = copy?.barcode || `BAR-${accessionNo.replace(/[^0-9]/g, '') || Math.floor(10000 + Math.random() * 90000)}`;

    // If no physical copy existed in copies array, create one so state stays perfectly in sync
    if (!copy) {
      copy = {
        id: `cp_${Date.now()}`,
        bookId: book.id,
        accessionNumber: accessionNo,
        barcode: barcodeNo,
        status: 'ISSUED',
        branchLocation: settings.libraryName || 'Central Academic Library'
      };
      setCopies(prev => [copy!, ...prev]);
    } else {
      setCopies(prev => prev.map(c => (c.id === copy!.id ? { ...c, status: 'ISSUED' } : c)));
    }

    const today = new Date();
    const dueDateObj = new Date();
    const daysToAdd = member.role === 'FACULTY' ? settings.maxBorrowDaysFaculty || 30 : settings.maxBorrowDaysStudent || 14;
    dueDateObj.setDate(today.getDate() + daysToAdd);

    const newTx: CirculationTransaction = {
      id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      transactionNumber: `TX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      accessionNumber: accessionNo,
      copyBarcode: barcodeNo,
      bookTitle: book.title,
      memberId: member.id,
      memberCode: member.memberCode || member.id,
      memberName: member.name,
      issueDate: today.toISOString().split('T')[0],
      dueDate: dueDateObj.toISOString().split('T')[0],
      status: 'ISSUED',
      renewalCount: 0,
      renewCount: 0,
      fineAmount: 0,
      finePaid: false
    };

    setTransactions(prev => [newTx, ...prev]);
    setUsers(prev =>
      prev.map(u => (u.id === member!.id ? { ...u, currentBorrowed: (u.currentBorrowed || 0) + 1 } : u))
    );
    setBooks(prev =>
      prev.map(b => (b.id === book!.id ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b))
    );

    // Queue in offline queue if offline
    if (isOfflineMode) {
      addQueuedOfflineAction({
        type: 'ISSUE_BOOK',
        copyBarcode: barcodeNo,
        memberCode: member.memberCode,
        details: `Offline Loan: "${book.title}" issued to ${member.name}`,
        payload: newTx
      });
    }

    logCirculationActivity(
      'BOOK_ISSUE',
      currentUser.name,
      currentUser.role,
      `${book.title} (${barcodeNo})`,
      `Issued copy to ${member.name} (${member.memberCode}). Due date: ${newTx.dueDate}.`
    );

    return { success: true, transaction: newTx, isOffline: isOfflineMode };
  };

  const handleReturnBook = async (identifier: string) => {
    const isOfflineMode = !navigator.onLine || getSimulatedOfflineMode();
    const cleanId = (identifier || '').trim().toLowerCase();

    // Find the active transaction by id, accessionNumber, copyBarcode, or bookTitle
    let tx = transactions.find(
      t =>
        (t.status === 'ISSUED' || t.status === 'OVERDUE') &&
        (t.id.toLowerCase() === cleanId ||
          (t.accessionNumber && t.accessionNumber.toLowerCase() === cleanId) ||
          (t.copyBarcode && t.copyBarcode.toLowerCase() === cleanId) ||
          t.bookTitle.toLowerCase().includes(cleanId))
    );

    // Fallback: search any transaction with matching id
    if (!tx) {
      tx = transactions.find(t => t.id.toLowerCase() === cleanId);
    }

    if (!tx) {
      alert(`No active loan record found for '${identifier}'.`);
      return { error: `No active issued loan transaction found for '${identifier}'.` };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const dueDate = new Date(tx.dueDate);
    const today = new Date();
    const diffTime = Math.max(0, today.getTime() - dueDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let fineCalculated = 0;
    if (diffDays > (settings.gracePeriodDays || 0)) {
      fineCalculated = (diffDays - (settings.gracePeriodDays || 0)) * (settings.finePerDay || 50);
    }

    setTransactions(prev =>
      prev.map(t =>
        t.id === tx!.id
          ? {
              ...t,
              returnDate: todayStr,
              status: 'RETURNED',
              fineAmount: fineCalculated
            }
          : t
      )
    );

    // Update copy state if matched
    const targetBarcode = tx.copyBarcode;
    const targetAccession = tx.accessionNumber;
    setCopies(prev =>
      prev.map(c =>
        (targetBarcode && c.barcode === targetBarcode) ||
        (targetAccession && c.accessionNumber === targetAccession) ||
        c.bookId === tx!.bookTitle
          ? { ...c, status: 'AVAILABLE' }
          : c
      )
    );

    // Increment available copies for book
    setBooks(prev =>
      prev.map(b =>
        b.title === tx!.bookTitle ||
        (targetAccession && b.accessionNumber === targetAccession)
          ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) }
          : b
      )
    );

    // Decrement user borrowed count
    const member = users.find(
      u =>
        u.id === tx!.memberId ||
        (tx!.memberCode && u.memberCode === tx!.memberCode) ||
        u.name === tx!.memberName
    );

    if (member) {
      setUsers(prev =>
        prev.map(u =>
          u.id === member.id
            ? {
                ...u,
                currentBorrowed: Math.max(0, (u.currentBorrowed || 1) - 1),
                finePending: (u.finePending || 0) + fineCalculated
              }
            : u
        )
      );
    }

    // Queue in offline queue if offline
    if (isOfflineMode) {
      addQueuedOfflineAction({
        type: 'RETURN_BOOK',
        copyBarcode: tx.copyBarcode || tx.accessionNumber || 'ACC-RETURN',
        memberCode: tx.memberCode || tx.memberName,
        details: `Offline Check-In: "${tx.bookTitle}" returned by ${tx.memberName}`,
        payload: { transactionId: tx.id, returnDate: todayStr, fineCalculated }
      });
    }

    logCirculationActivity(
      'BOOK_RETURN',
      currentUser.name,
      currentUser.role,
      `${tx.bookTitle} (${tx.copyBarcode || tx.accessionNumber || 'N/A'})`,
      `Returned by patron ${tx.memberName || tx.memberId}. ${
        fineCalculated > 0
          ? `Overdue fine calculated: PKR ${fineCalculated}.`
          : 'Returned on time without fines.'
      }`
    );

    return { success: true, transaction: tx, fineCalculated, isOffline: isOfflineMode };
  };

  const handleRenewBook = async (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return { error: 'Transaction not found.' };

    const dueDateObj = new Date(tx.dueDate);
    dueDateObj.setDate(dueDateObj.getDate() + 14);
    const newDueDate = dueDateObj.toISOString().split('T')[0];

    const updatedTx = { ...tx, dueDate: newDueDate, renewCount: (tx.renewCount || 0) + 1 };
    setTransactions(prev => prev.map(t => (t.id === txId ? updatedTx : t)));

    logCirculationActivity(
      'BOOK_RENEW',
      currentUser.name,
      currentUser.role,
      `${tx.bookTitle} (${tx.copyBarcode || 'N/A'})`,
      `Renewed loan for member ${tx.memberName || tx.memberId}. Extended due date to ${newDueDate}.`
    );

    return { transaction: updatedTx };
  };

  const handlePayFine = (memberId: string, amount: number) => {
    setTransactions(prev =>
      prev.map(t =>
        t.memberId === memberId || t.memberName.toLowerCase() === currentUser.name.toLowerCase()
          ? { ...t, finePaid: true, fineAmount: 0 }
          : t
      )
    );
    setUsers(prev =>
      prev.map(u => (u.id === memberId || u.id === currentUser.id ? { ...u, finePending: 0 } : u))
    );

    logCirculationActivity(
      'FINE_PAYMENT',
      currentUser.name,
      currentUser.role,
      `Member ID: ${memberId}`,
      `Cleared fine payment of PKR ${amount}. Outstanding balance settled.`
    );
  };

  const handleCancelReservation = (reservationId: string) => {
    setReservations(prev => prev.filter(r => r.id !== reservationId));
    logCirculationActivity(
      'CANCEL_RESERVE',
      currentUser.name,
      currentUser.role,
      `Reservation ${reservationId}`,
      `Cancelled reservation hold request ${reservationId}.`
    );
  };

  const handleReserveBook = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    const newRes: BookReservation = {
      id: `res_${Date.now()}`,
      bookId,
      bookTitle: book?.title || 'Reserved Book',
      memberId: currentUser.id,
      memberName: currentUser.name,
      reservationDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'PENDING',
      priorityQueue: reservations.length + 1
    };
    setReservations(prev => [newRes, ...prev]);
    logCirculationActivity(
      'BOOK_RESERVE',
      currentUser.name,
      currentUser.role,
      book?.title || 'Reserved Book',
      `Placed reservation hold for ${currentUser.name}. Queue priority #${newRes.priorityQueue}.`
    );
    alert(`Book hold reserved successfully for ${currentUser.name}. Queue position #${newRes.priorityQueue}.`);
  };

  const handleRegisterUser = (newUser: UserProfile, branch: string) => {
    setUsers(prev => {
      const nextList = [newUser, ...prev];
      saveLocalData('pslims_db_users', nextList);
      return nextList;
    });
    setCurrentUser(newUser);
    setActiveBranch(branch);
    setIsAuthenticated(true);
    localStorage.setItem('pslims_is_authenticated', 'true');
    localStorage.setItem('pslims_auth_user_id', newUser.id);
    localStorage.setItem('pslims_auth_branch', branch);
    restoreUserWorkspace(newUser);
    logUserAdminActivity(
      'USER_CREATE',
      newUser.name,
      newUser.role,
      `${newUser.name} (${newUser.memberCode})`,
      `Registered new user account at branch "${branch}".`
    );
  };

  if (!isAuthenticated) {
    if (!isLoginViewOpen) {
      return (
        <ErrorBoundary fallbackTitle="Public OPAC Discovery Error">
          <PublicOpacPage
            books={books}
            copies={copies}
            settings={settings}
            currentUser={null}
            isAuthenticated={false}
            onOpenLogin={(portal) => {
              if (portal) setLoginPortalMode(portal);
              setIsLoginViewOpen(true);
            }}
          />
        </ErrorBoundary>
      );
    }

    return (
      <ErrorBoundary fallbackTitle="Portal Access Recovery">
        <LoginPage
          users={users}
          branches={settings.branches}
          books={books}
          initialPortal={loginPortalMode}
          onLoginSuccess={(user, branch) => {
            setCurrentUser(user);
            setActiveBranch(branch);
            setIsAuthenticated(true);
            setIsLoginViewOpen(false);
            if (user.authProvider === 'WHATSAPP_WEB') {
              setIsLibrarianBotOpen(true);
            }
            handleUpdateUser(user.id, user);
            localStorage.setItem('pslims_is_authenticated', 'true');
            localStorage.setItem('pslims_auth_user_id', user.id);
            localStorage.setItem('pslims_auth_branch', branch);
            restoreUserWorkspace(user);
            try {
              fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user }),
              }).catch(() => {});
            } catch {
              // ignore
            }
          }}
          onRegisterUser={(newUser, branch) => {
            handleRegisterUser(newUser, branch);
            setIsLoginViewOpen(false);
          }}
          onUpdateUser={handleUpdateUser}
          onBackToOpac={() => setIsLoginViewOpen(false)}
        />
      </ErrorBoundary>
    );
  }

  const activeThemeDef = getThemeConfig(currentTheme);

  return (
    <div className={`relative h-screen w-full flex flex-col overflow-hidden ${activeThemeDef.canvasBg} ${activeThemeDef.isDark ? 'text-slate-100' : 'text-slate-800'} selection:bg-blue-600 selection:text-white font-sans antialiased transition-colors duration-300`}>
      {/* Decorative Brand Accent Stripe across top masthead */}
      <div className={`h-1 w-full ${activeThemeDef.headerTopStripe} shrink-0 z-50 shadow-xs`} />

      {/* Top Header - Spanning full screen width */}
      <Header
        currentUser={currentUser}
        activeBranch={activeBranch}
        branches={settings.branches}
        currentTheme={currentTheme}
        currentLanguage={currentLanguage}
        currentTab={currentTab}
        settings={settings}
        onChangeTheme={setCurrentTheme}
        onChangeLanguage={setCurrentLanguage}
        onChangeBranch={setActiveBranch}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenAddBranchModal={() => {
          setBranchModalInitialMode('BRANCH');
          setIsAddBranchModalOpen(true);
        }}
        onUpdateUser={handleUpdateUser}
        onNavigateTab={handleNavigateTab}
        onOpenLibrarianBot={() => setIsLibrarianBotOpen(true)}
        onLogout={async () => {
          try {
            await fetch('/api/auth/logout', { method: 'POST' });
          } catch {
            // ignore
          }
          localStorage.removeItem('pslims_is_authenticated');
          localStorage.removeItem('pslims_auth_user_id');
          localStorage.removeItem('pslims_auth_branch');
          setIsAuthenticated(false);
          setIsLoginViewOpen(false);
        }}
      />

      {/* Body Area: Sidebar on Left, Content Area on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={currentTab}
          onSelectTab={handleNavigateTab}
          userRole={currentUser.role}
          currentLanguage={currentLanguage}
          currentTheme={currentTheme}
        />

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${activeThemeDef.canvasBg} transition-colors duration-300`}>
          {/* Viewport Scrollable Area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-6 space-y-5 scrollbar-thin scrollbar-thumb-slate-300">
            <ErrorBoundary fallbackTitle="Module Render Recovery">
              <React.Suspense fallback={<ModuleLoadingFallback />}>
              {currentTab === 'MY_LIBRARY' && (
                <MyLibraryModule
                  currentUser={currentUser}
                  transactions={transactions}
                  books={books}
                  reservations={reservations}
                  settings={settings}
                  activeBranch={activeBranch}
                  onRenewLoan={txId => handleRenewBook(txId)}
                  onPayFine={(memberId, amount) => handlePayFine(memberId, amount)}
                  onCancelReservation={resId => handleCancelReservation(resId)}
                  onNavigateTab={handleNavigateTab}
                />
              )}

            {currentTab === 'DASHBOARD' && (
              <DashboardModule
                books={books}
                transactions={transactions}
                users={users}
                currentUser={currentUser}
                settings={settings}
                branches={settings.branches}
                activeBranch={activeBranch}
                currentTheme={currentTheme}
                onAddBranch={handleAddBranch}
                onDeleteBranch={handleDeleteBranch}
                onUpdateUser={handleUpdateUser}
                onNavigateTab={setCurrentTab}
                onOpenAiAssistant={() => setCurrentTab('AI_ASSISTANT')}
                onIssueBook={handleIssueBook}
                onReturnBook={handleReturnBook}
              />
            )}

            {currentTab === 'SETTINGS' && (
              <SettingsModule
                settings={settings}
                users={users}
                currentUser={currentUser}
                onUpdateUser={handleUpdateUser}
                currentTheme={currentTheme}
                onChangeTheme={setCurrentTheme}
                onSaveSettings={handleSaveSettings}
                onOpenAddBranchModal={(mode) => {
                  setBranchModalInitialMode(mode || 'BRANCH');
                  setIsAddBranchModalOpen(true);
                }}
                onAddBranch={handleAddBranch}
                onDeleteBranch={handleDeleteBranch}
              />
            )}

            {((currentTab as string) === 'USERS' || currentTab === 'MEMBERS') && (
              <UserMemberModule
                users={users}
                currentUser={currentUser}
                branches={settings.branches}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
              />
            )}

            {currentTab === 'CATALOGUING' && (
              <CataloguingModule
                books={books}
                copies={copies}
                users={users}
                currentUser={currentUser}
                settings={settings}
                onAddBook={handleAddBook}
                onUpdateBook={handleUpdateBook}
                onDeleteBook={handleDeleteBook}
                onDeleteAllBooks={handleDeleteAllBooks}
                onRestoreSampleBooks={handleRestoreSampleBooks}
                onAddCopies={handleAddCopies}
                onUpdateCopy={handleUpdateCopy}
                onDeleteCopy={handleDeleteCopy}
                onAddBranch={handleAddBranch}
                onDeleteBranch={handleDeleteBranch}
                onPayFine={handlePayFine}
                onImportBooks={(newBks, newCps) => {
                  setBooks(prev => [...newBks, ...prev]);
                  if (newCps && newCps.length > 0) {
                    setCopies(prev => [...newCps, ...prev]);
                  }
                }}
              />
            )}

            {currentTab === 'AUTHORITY' && <AuthorityControlModule />}

            {currentTab === 'CIRCULATION' && (
              <CirculationModule
                transactions={transactions}
                copies={copies}
                users={users}
                books={books}
                currentUser={currentUser}
                settings={settings}
                onIssueBook={handleIssueBook}
                onReturnBook={handleReturnBook}
                onRenewBook={handleRenewBook}
                onPayFine={handlePayFine}
              />
            )}

            {currentTab === 'OPAC' && (
              <PublicOpacPage
                books={books}
                copies={copies}
                settings={settings}
                currentUser={currentUser}
                isAuthenticated={true}
                onOpenLogin={() => {}}
                onReturnToDashboard={() => setCurrentTab('DASHBOARD')}
              />
            )}

            {(currentTab === 'DIGITAL_LIBRARY' || (currentTab as string) === 'DIGITAL') && (
              <DigitalLibraryModule assets={digitalAssets} onAddAsset={handleAddDigitalAsset} />
            )}

            {(currentTab === 'ACQUISITION' || (currentTab as string) === 'ACQUISITIONS') && <AcquisitionModule />}

            {currentTab === 'SERIALS' && <SerialsModule />}

            {(currentTab === 'INVENTORY' || (currentTab as string) === 'STOCK') && <StockVerificationModule books={books} />}

            {currentTab === 'REPORTS' && (
              <ReportsModule
                books={books}
                users={users}
                transactions={transactions}
                settings={settings}
                currentUser={currentUser}
              />
            )}

            {currentTab === 'IMPORT_EXPORT' && (
              <ImportExportModule
                books={books}
                copies={copies}
                users={users}
                transactions={transactions}
                settings={settings}
                onImportBooks={(newBks, newCps) => {
                  setBooks(prev => [...newBks, ...prev]);
                  if (newCps && newCps.length > 0) {
                    setCopies(prev => [...newCps, ...prev]);
                  }
                }}
                onImportUsers={newUsrs => setUsers(prev => [...newUsrs, ...prev])}
                onAddCopies={handleAddCopies}
                onDeleteAllBooks={handleDeleteAllBooks}
                onRestoreSampleBooks={handleRestoreSampleBooks}
              />
            )}

            {currentTab === 'BACKUP_LOGS' && (
              <BackupLogsModule
                currentUser={currentUser}
                settings={settings}
              />
            )}

            {currentTab === 'BARCODES' && (
              <BarcodeGeneratorModule
                books={books}
                users={users}
                settings={settings}
                transactions={transactions}
                currentUser={currentUser}
                onIssueBook={handleIssueBook}
                onReturnBook={handleReturnBook}
              />
            )}

            {currentTab === 'AI_ASSISTANT' && (
              <AiAssistantModule
                books={books}
                users={users}
                currentUser={currentUser}
                activeBranch={activeBranch}
                transactions={transactions}
              />
            )}

            {currentTab === 'HELP_DOCS' && (
              <DocumentationModule currentLanguage={currentLanguage} />
            )}
              </React.Suspense>
            </ErrorBoundary>
        </main>

        {/* Bottom Status Bar */}
        <footer className="h-8 bg-white border-t border-slate-200/90 px-4 sm:px-6 flex items-center justify-between text-[11px] text-slate-500 font-medium shrink-0">
          <div>PLiMS V4.1.1 | Pakistan Library Management System</div>
          <div className="text-slate-400">National Library Automation &amp; Academic Information System</div>
        </footer>
      </div>
    </div>

      {/* Keyboard Command Palette Modal */}
      <React.Suspense fallback={null}>
        {isCommandPaletteOpen && (
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            books={books}
            users={users}
            onSelectBook={b => {
              handleNavigateTab('OPAC');
            }}
            onSelectModule={tab => handleNavigateTab(tab)}
          />
        )}
      </React.Suspense>

      {/* Add Branch & Staff Modal */}
      <React.Suspense fallback={null}>
        {isAddBranchModalOpen && (
          <AddBranchAndStaffModal
            isOpen={isAddBranchModalOpen}
            onClose={() => setIsAddBranchModalOpen(false)}
            branches={settings.branches}
            onAddBranch={handleAddBranch}
            onDeleteBranch={handleDeleteBranch}
            onAddStaff={handleAddUser}
            initialMode={branchModalInitialMode}
          />
        )}
      </React.Suspense>

      {/* PLiMS AI Librarian Bot (Full Circulation, Renewals, OPAC & Reference Services) */}
      <React.Suspense fallback={null}>
        {isLibrarianBotOpen && currentUser && (
          <LibrarianBot
            currentUser={currentUser}
            activeBranch={activeBranch}
            branches={settings.branches}
            books={books}
            transactions={transactions}
            isOpen={isLibrarianBotOpen}
            onClose={() => setIsLibrarianBotOpen(false)}
            onRenewTransaction={handleRenewBook}
            onNavigateTab={handleNavigateTab}
            onUpdateUser={handleUpdateUser}
          />
        )}
      </React.Suspense>

      {/* Floating AI Librarian Bot Launcher */}
      {currentUser && (
        <button
          type="button"
          onClick={() => setIsLibrarianBotOpen(true)}
          className="fixed bottom-5 right-5 z-40 px-4 py-2.5 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-full shadow-2xl border-2 border-emerald-300/40 flex items-center space-x-2.5 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          title="Open PLiMS AI Librarian Bot - 24/7 Loans, Renewals, Catalog & Reference Services"
        >
          <div className="relative">
            <Bot className="h-5 w-5 text-emerald-200" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse"></span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold tracking-tight text-white flex items-center space-x-1">
              <span>Librarian Bot</span>
              <Sparkles className="h-3 w-3 text-emerald-300" />
            </span>
            <span className="text-[9px] text-emerald-100 font-medium leading-none">24/7 Services</span>
          </div>
        </button>
      )}
    </div>
  );
}

export default App;
