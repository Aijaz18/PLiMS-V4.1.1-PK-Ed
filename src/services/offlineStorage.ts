import { CirculationTransaction, BookRecord, UserProfile, BookCopy } from '../types/alims';

export interface OfflineQueuedAction {
  id: string;
  type: 'ISSUE_BOOK' | 'RETURN_BOOK' | 'ADD_CATALOG_SCAN' | 'UPDATE_CIRCULATION';
  timestamp: string;
  copyBarcode: string;
  memberCode?: string;
  details: string;
  status: 'QUEUED' | 'SYNCED' | 'FAILED';
  payload: any;
}

const STORAGE_KEYS = {
  TRANSACTIONS: 'pslims_db_transactions',
  BOOKS: 'pslims_db_books',
  COPIES: 'pslims_db_copies',
  USERS: 'pslims_db_users',
  OFFLINE_QUEUE: 'pslims_offline_queue',
  SIMULATED_OFFLINE: 'pslims_simulated_offline'
};

// --- Local Storage Data Loaders ---
export function loadLocalData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch (err) {
    console.error(`Error reading ${key} from LocalStorage:`, err);
  }
  return fallback;
}

export function saveLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to LocalStorage:`, err);
  }
}

// --- Offline Queue Management ---
export function getOfflineQueue(): OfflineQueuedAction[] {
  return loadLocalData<OfflineQueuedAction[]>(STORAGE_KEYS.OFFLINE_QUEUE, []);
}

export function saveOfflineQueue(queue: OfflineQueuedAction[]): void {
  saveLocalData(STORAGE_KEYS.OFFLINE_QUEUE, queue);
}

export function addQueuedOfflineAction(action: Omit<OfflineQueuedAction, 'id' | 'timestamp' | 'status'>): OfflineQueuedAction {
  const newAction: OfflineQueuedAction = {
    ...action,
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toLocaleTimeString(),
    status: 'QUEUED'
  };

  const currentQueue = getOfflineQueue();
  const updated = [newAction, ...currentQueue];
  saveOfflineQueue(updated);
  return newAction;
}

export function clearSyncedQueue(): void {
  const current = getOfflineQueue();
  const remaining = current.filter(item => item.status !== 'SYNCED');
  saveOfflineQueue(remaining);
}

// --- Connection Simulator Flag ---
export function getSimulatedOfflineMode(): boolean {
  return loadLocalData<boolean>(STORAGE_KEYS.SIMULATED_OFFLINE, false);
}

export function setSimulatedOfflineMode(val: boolean): void {
  saveLocalData(STORAGE_KEYS.SIMULATED_OFFLINE, val);
}

// --- Service Worker Registration & Cache Management ---
export function registerLibraryServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    // Unregister any stale legacy service workers and clear caches
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    }).catch(() => {});

    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          if (key.includes('pslims') || key.includes('v3.0') || key.includes('v4.0') || key.includes('v4.1') || key.includes('V4.1')) {
            caches.delete(key).catch(() => {});
          }
        }
      }).catch(() => {});
    }
  }
}
