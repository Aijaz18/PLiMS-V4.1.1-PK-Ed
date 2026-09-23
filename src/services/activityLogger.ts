import { ActivityLogEntry, ActivityCategory } from '../types/alims';

const STORAGE_KEY = 'plims_activity_logs_v1';
const EVENT_NAME = 'plims:activity-logged';

// Realistic initial seed of activity logs covering circulation, system config, and user admin
const INITIAL_LOGS: ActivityLogEntry[] = [
  {
    id: 'act_log_001',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 mins ago
    category: 'CIRCULATION',
    action: 'BOOK_ISSUE',
    actionLabel: 'Book Issued',
    performedBy: 'David Miller',
    performedByRole: 'ASSISTANT_LIBRARIAN',
    performedById: 'usr_staff_2',
    target: 'Clean Code: A Handbook of Agile Software Craftsmanship (ACC-2024-001)',
    details: 'Issued to patron Rohan Sharma (STU-2024-089) at Central Academic Library. Due date: 14 days.',
    status: 'SUCCESS',
    ipAddress: '192.168.1.114',
    metadata: {
      barcode: 'ACC-2024-001',
      memberCode: 'STU-2024-089',
      patronName: 'Rohan Sharma',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10),
    }
  },
  {
    id: 'act_log_002',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    category: 'CIRCULATION',
    action: 'BOOK_RETURN',
    actionLabel: 'Book Returned',
    performedBy: 'David Miller',
    performedByRole: 'ASSISTANT_LIBRARIAN',
    performedById: 'usr_staff_2',
    target: 'Calculus and Analytical Geometry (ACC-2024-003)',
    details: 'Returned by Prof. Sarah Jenkins. Condition: Good. No overdue charges incurred.',
    status: 'SUCCESS',
    ipAddress: '192.168.1.114',
    metadata: {
      barcode: 'ACC-2024-003',
      fineAssessed: 0,
      condition: 'GOOD'
    }
  },
  {
    id: 'act_log_003',
    timestamp: new Date(Date.now() - 1000 * 60 * 85).toISOString(), // ~1.4 hours ago
    category: 'SYSTEM_CONFIG',
    action: 'SETTINGS_UPDATE',
    actionLabel: 'Circulation Policy Updated',
    performedBy: 'Dr. Aijaz Akhter',
    performedByRole: 'SUPER_ADMIN',
    performedById: 'usr_admin',
    target: 'System Circulation & Fine Rules',
    details: 'Adjusted overdue penalty rate to PKR 15.00/day. Grace period set to 2 days for students.',
    status: 'INFO',
    ipAddress: '192.168.1.100',
    metadata: {
      finePerDay: 15,
      gracePeriodDays: 2,
      module: 'SETTINGS'
    }
  },
  {
    id: 'act_log_004',
    timestamp: new Date(Date.now() - 1000 * 60 * 140).toISOString(), // ~2.3 hours ago
    category: 'USER_ADMIN',
    action: 'ROLE_CHANGE',
    actionLabel: 'Privileges Assigned',
    performedBy: 'Dr. Aijaz Akhter',
    performedByRole: 'SUPER_ADMIN',
    performedById: 'usr_admin',
    target: 'Prof. Sarah Jenkins (FAC-2024-012)',
    details: 'Assigned staff cataloguing and circulation powers (CAN_CATALOG, CAN_CIRCULATE).',
    status: 'SUCCESS',
    ipAddress: '192.168.1.100',
    metadata: {
      targetStaffId: 'FAC-2024-012',
      powersGranted: ['CAN_CATALOG', 'CAN_CIRCULATE']
    }
  },
  {
    id: 'act_log_005',
    timestamp: new Date(Date.now() - 1000 * 60 * 220).toISOString(), // ~3.6 hours ago
    category: 'CIRCULATION',
    action: 'BOOK_RENEW',
    actionLabel: 'Loan Renewed',
    performedBy: 'Dr. Aijaz Akhter',
    performedByRole: 'SUPER_ADMIN',
    performedById: 'usr_admin',
    target: 'Artificial Intelligence: A Modern Approach (ACC-2024-002)',
    details: 'Renewed for Member Bilal Khan (STU-001). Extended due date by 14 days.',
    status: 'SUCCESS',
    ipAddress: '192.168.1.100',
    metadata: {
      memberId: 'STU-001',
      renewalCount: 1
    }
  },
  {
    id: 'act_log_006',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hours ago
    category: 'CIRCULATION',
    action: 'FINE_PAYMENT',
    actionLabel: 'Fine Payment Settled',
    performedBy: 'Accounts Officer Tariq',
    performedByRole: 'ACCOUNTS_OFFICER',
    performedById: 'usr_accounts',
    target: 'Member Ledger: Hamza Tariq (STU-2024-044)',
    details: 'Collected PKR 150.00 cash fine for overdue return. Cleared hold status from account.',
    status: 'SUCCESS',
    ipAddress: '192.168.1.118',
    metadata: {
      amountPaid: 150,
      paymentMethod: 'CASH',
      receiptNumber: 'RCT-2026-881'
    }
  },
  {
    id: 'act_log_007',
    timestamp: new Date(Date.now() - 1000 * 60 * 480).toISOString(), // 8 hours ago
    category: 'USER_ADMIN',
    action: 'USER_CREATE',
    actionLabel: 'Patron Account Registered',
    performedBy: 'Dr. Aijaz Akhter',
    performedByRole: 'SUPER_ADMIN',
    performedById: 'usr_admin',
    target: 'Aisha Noor (RES-2026-009)',
    details: 'New research scholar account registered in Department of Computer Science. Max borrow limit: 10.',
    status: 'SUCCESS',
    ipAddress: '192.168.1.100',
    metadata: {
      role: 'RESEARCH_SCHOLAR',
      maxBorrowLimit: 10,
      department: 'Computer Science'
    }
  },
  {
    id: 'act_log_008',
    timestamp: new Date(Date.now() - 1000 * 60 * 720).toISOString(), // 12 hours ago
    category: 'SYSTEM_CONFIG',
    action: 'BRANCH_ADD',
    actionLabel: 'New Campus Branch Created',
    performedBy: 'Dr. Aijaz Akhter',
    performedByRole: 'SUPER_ADMIN',
    performedById: 'usr_admin',
    target: 'Quaid-e-Azam Campus Digital Learning Centre',
    details: 'New branch location added with 2,500 allocated physical accession slots.',
    status: 'SUCCESS',
    ipAddress: '192.168.1.100',
    metadata: {
      branchName: 'Quaid-e-Azam Campus Digital Learning Centre',
      totalSlots: 2500
    }
  },
  {
    id: 'act_log_009',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    category: 'SYSTEM_CONFIG',
    action: 'BACKUP_CREATED',
    actionLabel: 'Automated Snapshot Backup',
    performedBy: 'System AutoScheduler',
    performedByRole: 'SYSTEM_DAEMON',
    performedById: 'sys_cron',
    target: 'Cloud Storage Bucket / Backups',
    details: 'Full JSON database snapshot created and verified. SHA-256 integrity checksum passed.',
    status: 'SUCCESS',
    ipAddress: '127.0.0.1',
    metadata: {
      sizeKb: 1420,
      snapshotType: 'FULL'
    }
  },
  {
    id: 'act_log_010',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 1.1 days ago
    category: 'CIRCULATION',
    action: 'BOOK_RESERVE',
    actionLabel: 'Hold Request Placed',
    performedBy: 'Bilal Khan (OPAC Portal)',
    performedByRole: 'STUDENT',
    performedById: 'STU-001',
    target: 'Introduction to Algorithms (ISBN: 978-0262033848)',
    details: 'Patron placed queue reservation #1 for currently checked out copy. Notification email scheduled on return.',
    status: 'INFO',
    ipAddress: '10.0.4.15',
    metadata: {
      reservationQueuePos: 1
    }
  },
  {
    id: 'act_log_011',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(), // 1.25 days ago
    category: 'USER_ADMIN',
    action: 'USER_STATUS_CHANGE',
    actionLabel: 'Patron Status Suspended',
    performedBy: 'David Miller',
    performedByRole: 'ASSISTANT_LIBRARIAN',
    performedById: 'usr_staff_2',
    target: 'Tariq Mehmood (STU-2024-077)',
    details: 'Account temporarily suspended due to 3 unacknowledged overdue return notices.',
    status: 'WARNING',
    ipAddress: '192.168.1.114',
    metadata: {
      previousStatus: 'ACTIVE',
      newStatus: 'SUSPENDED'
    }
  },
  {
    id: 'act_log_012',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
    category: 'SYSTEM_CONFIG',
    action: 'WORKING_HOURS_UPDATE',
    actionLabel: 'Operating Hours Configured',
    performedBy: 'Dr. Aijaz Akhter',
    performedByRole: 'SUPER_ADMIN',
    performedById: 'usr_admin',
    target: 'All Campus Branches',
    details: 'Configured standard schedule: Mon-Sat 08:00 AM - 09:00 PM; Sun 10:00 AM - 05:00 PM.',
    status: 'INFO',
    ipAddress: '192.168.1.100',
    metadata: {
      schedule: 'Mon-Sat 08:00 AM - 09:00 PM; Sun 10:00 AM - 05:00 PM'
    }
  }
];

/**
 * Retrieves all stored activity logs from localStorage, with fallback to initial seed.
 */
export function getActivityLogs(): ActivityLogEntry[] {
  if (typeof window === 'undefined') return INITIAL_LOGS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LOGS));
      return INITIAL_LOGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_LOGS;
  } catch (err) {
    console.error('[ActivityLogger] Failed to read activity logs:', err);
    return INITIAL_LOGS;
  }
}

/**
 * Persists an array of activity logs to localStorage and emits an update event.
 */
export function saveActivityLogs(logs: ActivityLogEntry[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, 1000))); // keep up to 1000 recent logs
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: logs }));
  } catch (err) {
    console.error('[ActivityLogger] Failed to save activity logs:', err);
  }
}

/**
 * Logs a new activity entry with automatic ID, timestamp, and event dispatching.
 */
export function logActivity(
  entry: Omit<ActivityLogEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
): ActivityLogEntry {
  const currentLogs = getActivityLogs();
  const newEntry: ActivityLogEntry = {
    id: entry.id || `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: entry.timestamp || new Date().toISOString(),
    category: entry.category,
    action: entry.action,
    actionLabel: entry.actionLabel || formatActionLabel(entry.action),
    performedBy: entry.performedBy || 'System Administrator',
    performedByRole: entry.performedByRole || 'ADMIN',
    performedById: entry.performedById,
    target: entry.target,
    details: entry.details,
    status: entry.status || 'SUCCESS',
    ipAddress: entry.ipAddress || '192.168.1.100',
    metadata: entry.metadata,
  };

  const updatedLogs = [newEntry, ...currentLogs];
  saveActivityLogs(updatedLogs);

  console.info(`[ActivityLog] [${newEntry.category}] ${newEntry.action}: ${newEntry.details}`);
  return newEntry;
}

/**
 * Helper to log circulation transaction activity (Issue, Return, Renewal, Fine, etc.)
 */
export function logCirculationActivity(
  action: 'BOOK_ISSUE' | 'BOOK_RETURN' | 'BOOK_RENEW' | 'FINE_PAYMENT' | 'BOOK_RESERVE' | 'CANCEL_RESERVE' | string,
  performedBy: string,
  role: string,
  target: string,
  details: string,
  metadata?: Record<string, any>
): ActivityLogEntry {
  return logActivity({
    category: 'CIRCULATION',
    action,
    performedBy,
    performedByRole: role,
    target,
    details,
    status: 'SUCCESS',
    metadata,
  });
}

/**
 * Helper to log system configuration activity (Settings, Branches, Policy, Schedule, Backup)
 */
export function logSystemConfigActivity(
  action: 'SETTINGS_UPDATE' | 'BRANCH_ADD' | 'BRANCH_DELETE' | 'BACKUP_CREATED' | 'SYSTEM_RESTORE' | 'WORKING_HOURS_UPDATE' | string,
  performedBy: string,
  role: string,
  target: string,
  details: string,
  metadata?: Record<string, any>
): ActivityLogEntry {
  return logActivity({
    category: 'SYSTEM_CONFIG',
    action,
    performedBy,
    performedByRole: role,
    target,
    details,
    status: 'INFO',
    metadata,
  });
}

/**
 * Helper to log user administrative actions (Create, Update, Delete, Role Change, Status Change)
 */
export function logUserAdminActivity(
  action: 'USER_CREATE' | 'USER_UPDATE' | 'USER_DELETE' | 'ROLE_CHANGE' | 'POWER_ASSIGNMENT' | 'USER_STATUS_CHANGE' | 'LOGIN' | string,
  performedBy: string,
  role: string,
  target: string,
  details: string,
  metadata?: Record<string, any>
): ActivityLogEntry {
  return logActivity({
    category: 'USER_ADMIN',
    action,
    performedBy,
    performedByRole: role,
    target,
    details,
    status: action.includes('DELETE') ? 'WARNING' : 'SUCCESS',
    metadata,
  });
}

/**
 * Resets the activity log back to the initial realistic dataset.
 */
export function resetActivityLogs(): ActivityLogEntry[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LOGS));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: INITIAL_LOGS }));
  }
  return INITIAL_LOGS;
}

/**
 * Clears all activity logs.
 */
export function clearActivityLogs(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: [] }));
  }
}

/**
 * Subscribes to new activity log updates.
 */
export function subscribeToActivityLogs(callback: (logs: ActivityLogEntry[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = () => {
    callback(getActivityLogs());
  };

  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
}

/**
 * Formats machine action tokens into user-friendly names.
 */
function formatActionLabel(action: string): string {
  switch (action) {
    case 'BOOK_ISSUE': return 'Book Issued';
    case 'BOOK_RETURN': return 'Book Returned';
    case 'BOOK_RENEW': return 'Loan Renewed';
    case 'FINE_PAYMENT': return 'Fine Payment Settled';
    case 'BOOK_RESERVE': return 'Hold Requested';
    case 'CANCEL_RESERVE': return 'Hold Cancelled';
    case 'SETTINGS_UPDATE': return 'Settings Updated';
    case 'BRANCH_ADD': return 'Branch Added';
    case 'BRANCH_DELETE': return 'Branch Removed';
    case 'BACKUP_CREATED': return 'Backup Generated';
    case 'SYSTEM_RESTORE': return 'System Restored';
    case 'WORKING_HOURS_UPDATE': return 'Schedule Configured';
    case 'USER_CREATE': return 'User Account Created';
    case 'USER_UPDATE': return 'User Profile Updated';
    case 'USER_DELETE': return 'User Account Deleted';
    case 'ROLE_CHANGE': return 'Role Changed';
    case 'POWER_ASSIGNMENT': return 'Powers Granted';
    case 'USER_STATUS_CHANGE': return 'Patron Status Updated';
    default:
      return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
