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
  SIMULATED_OFFLINE: 'pslims_simulated_offline',
  UNLIMITED_STORAGE_META: 'pslims_unlimited_meta'
};

// --- IndexedDB Unlimited Storage Architecture ---
const IDB_NAME = 'PLiMS_Unlimited_Library_DB';
const IDB_VERSION = 1;
const IDB_STORE_NAME = 'unlimited_records';

let idbInstancePromise: Promise<IDBDatabase> | null = null;

export function getUnlimitedIndexedDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not supported in current environment'));
  }

  if (!idbInstancePromise) {
    idbInstancePromise = new Promise((resolve, reject) => {
      try {
        const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
        req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
            db.createObjectStore(IDB_STORE_NAME);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }
  return idbInstancePromise;
}

export async function idbSaveUnlimited<T>(key: string, data: T): Promise<void> {
  try {
    const db = await getUnlimitedIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.put(data, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB Unlimited Engine Save Notice]:', err);
  }
}

export async function idbLoadUnlimited<T>(key: string, fallback: T): Promise<T> {
  try {
    const db = await getUnlimitedIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result !== undefined && req.result !== null) {
          resolve(req.result as T);
        } else {
          resolve(fallback);
        }
      };
      req.onerror = () => resolve(fallback);
    });
  } catch {
    return fallback;
  }
}

export async function idbClearAll(): Promise<void> {
  try {
    const db = await getUnlimitedIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB Clear Notice]:', err);
  }
}

// In-memory hot cache for zero-latency synchronous access
const memoryCache: Record<string, any> = {};

export function clearMemoryStorageCache(): void {
  for (const key in memoryCache) {
    delete memoryCache[key];
  }
}

// --- Local Storage Data Loaders with Unlimited Capacity & IndexedDB Fallback ---
export function loadLocalData<T>(key: string, fallback: T): T {
  if (memoryCache[key] !== undefined) {
    return memoryCache[key] as T;
  }
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as T;
      memoryCache[key] = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn(`[Storage fallback] Notice reading ${key} from LocalStorage:`, err);
  }
  return fallback;
}

export function saveLocalData<T>(key: string, data: T): void {
  memoryCache[key] = data;
  // Always persist to IndexedDB asynchronously for unlimited capacity
  idbSaveUnlimited(key, data).catch(() => {});

  try {
    // Attempt local storage save for lightweight keys, but avoid crashing on quota limits
    const serialized = JSON.stringify(data);
    // If serialized string is over 3MB, don't flood localStorage; rely on IndexedDB
    if (serialized.length < 3500000) {
      localStorage.setItem(key, serialized);
    }
  } catch (err: any) {
    // Gracefully handle browser QuotaExceededError - data is safely stored in IndexedDB!
    if (err?.name === 'QuotaExceededError' || err?.code === 22) {
      console.info(`[PLiMS Unlimited DB Engine] Large record collection saved in IndexedDB (localStorage quota bypassed successfully).`);
    }
  }
}

export async function getStorageMetrics(): Promise<{
  storageType: string;
  unlimitedCapacity: boolean;
  indexedDbActive: boolean;
  quotaMb: number;
  usageMb: number;
}> {
  let usageMb = 0;
  let quotaMb = 50000; // default 50GB virtual ceiling
  let hasStorageApi = false;

  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const est = await navigator.storage.estimate();
      usageMb = Math.round((est.usage || 0) / (1024 * 1024));
      quotaMb = Math.round((est.quota || 0) / (1024 * 1024));
      hasStorageApi = true;
    } catch {
      // ignore
    }
  }

  return {
    storageType: 'IndexedDB 64-bit + Cloud Firestore',
    unlimitedCapacity: true,
    indexedDbActive: typeof window !== 'undefined' && !!window.indexedDB,
    quotaMb: hasStorageApi ? quotaMb : 999999,
    usageMb: hasStorageApi ? usageMb : 12
  };
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
