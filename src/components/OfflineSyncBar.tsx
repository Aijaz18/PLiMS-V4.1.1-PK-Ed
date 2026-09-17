import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Database,
  ArrowUpRight,
  List,
  X,
  Zap,
  Trash2,
  ShieldCheck
} from 'lucide-react';
import {
  getOfflineQueue,
  saveOfflineQueue,
  clearSyncedQueue,
  getSimulatedOfflineMode,
  setSimulatedOfflineMode,
  OfflineQueuedAction
} from '../services/offlineStorage';

interface OfflineSyncBarProps {
  onSyncTriggered: () => void;
  lastSyncTime?: string | null;
}

export const OfflineSyncBar: React.FC<OfflineSyncBarProps> = ({
  onSyncTriggered,
  lastSyncTime
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(getSimulatedOfflineMode());
  const [queue, setQueue] = useState<OfflineQueuedAction[]>(getOfflineQueue());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState<boolean>(false);

  // Monitor Network Online/Offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Refresh local queue state periodically
    const interval = setInterval(() => {
      setQueue(getOfflineQueue());
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const effectiveOnline = isOnline && !isSimulatedOffline;
  const queuedCount = queue.filter(q => q.status === 'QUEUED').length;

  // Toggle simulated offline connection
  const handleToggleSimulatedOffline = () => {
    const nextVal = !isSimulatedOffline;
    setIsSimulatedOffline(nextVal);
    setSimulatedOfflineMode(nextVal);
  };

  // Trigger manual queue sync
  const handlePerformSync = () => {
    if (!effectiveOnline) {
      alert('Cannot sync while Offline Mode is active. Please re-enable online connectivity first.');
      return;
    }
    setIsSyncing(true);
    setTimeout(() => {
      onSyncTriggered();
      setQueue(getOfflineQueue());
      setIsSyncing(false);
    }, 1000);
  };

  // Clear Synced
  const handleClearSynced = () => {
    clearSyncedQueue();
    setQueue(getOfflineQueue());
  };

  return (
    <div className="w-full bg-white border-b border-slate-200/90 px-6 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      {/* Network Status Badge */}
      <div className="flex items-center space-x-3">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border font-mono font-bold text-[11px] ${
          effectiveOnline
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse'
        }`}>
          {effectiveOnline ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-emerald-600" />
              <span>Online • Cloud Sync Active</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-amber-600" />
              <span>Offline Mode Active • Scans Saved to LocalStorage</span>
            </>
          )}
        </div>

        {/* Local Storage Database Pill */}
        <div className="hidden md:flex items-center space-x-1.5 text-slate-500 font-mono text-[11px]">
          <HardDrive className="h-3.5 w-3.5 text-emerald-600" />
          <span>Local Storage Persistence: <strong className="text-slate-800 font-semibold">Active (Indexed Cache)</strong></span>
        </div>
      </div>

      {/* Sync Queue Actions & Simulator Toggle */}
      <div className="flex items-center space-x-3">
        {/* Offline Simulation Toggle */}
        <button
          type="button"
          onClick={handleToggleSimulatedOffline}
          className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
            isSimulatedOffline
              ? 'bg-amber-100 border-amber-300 text-amber-800'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Simulate Wi-Fi disconnection to test offline barcode scanning"
        >
          <Zap className="h-3 w-3 text-amber-500" />
          <span>{isSimulatedOffline ? 'Disable Offline Test Mode' : 'Simulate Connection Test'}</span>
        </button>

        {/* Queued Records Badge & Drawer Opener */}
        <button
          type="button"
          onClick={() => setIsQueueModalOpen(true)}
          className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-mono font-bold text-[11px] flex items-center space-x-1.5 hover:border-emerald-500/40 hover:bg-slate-100 transition-all cursor-pointer"
        >
          <List className="h-3.5 w-3.5 text-emerald-600" />
          <span>Offline Queue ({queuedCount})</span>
        </button>

        {/* Manual Sync Button */}
        <button
          type="button"
          disabled={!effectiveOnline || isSyncing || queuedCount === 0}
          onClick={handlePerformSync}
          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md cursor-pointer transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Local Scans'}</span>
        </button>
      </div>

      {/* Offline Queue Inspector Modal */}
      {isQueueModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Local Persistence & Offline Queue Inspector
                </h3>
              </div>
              <button
                onClick={() => setIsQueueModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Transactions and catalog updates performed while offline are recorded locally in browser LocalStorage. They automatically sync to the main database when connectivity resumes.
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {queue.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                  No pending offline scans or circulation updates. All local records are synced!
                </div>
              ) : (
                queue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-200/90 bg-[#f1f5f9] flex items-center justify-between text-xs space-x-3"
                  >
                    <div>
                      <div className="font-bold text-slate-900 font-mono flex items-center space-x-2">
                        <span className="text-emerald-600">{item.type}</span>
                        <span>•</span>
                        <span className="text-slate-800">{item.copyBarcode}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.details}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">Recorded at {item.timestamp}</div>
                    </div>

                    <div className="shrink-0">
                      {item.status === 'QUEUED' && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-mono font-bold">
                          ⏳ QUEUED
                        </span>
                      )}
                      {item.status === 'SYNCED' && (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-bold">
                          ✓ SYNCED
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/90">
              <button
                type="button"
                onClick={handleClearSynced}
                className="text-xs text-slate-500 hover:text-red-600 flex items-center space-x-1 cursor-pointer font-mono"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear Synced Records</span>
              </button>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsQueueModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-200"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={!effectiveOnline || queuedCount === 0}
                  onClick={() => {
                    handlePerformSync();
                    setIsQueueModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Sync Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
