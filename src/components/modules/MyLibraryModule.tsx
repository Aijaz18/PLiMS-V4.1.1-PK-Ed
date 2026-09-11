import React, { useState } from 'react';
import { BookMarked, Clock, CheckCircle, MapPin, Building2, Mail, Phone, PhoneCall, Globe, Sliders, Palette, User, ShieldCheck } from 'lucide-react';
import { UserProfile, CirculationTransaction, BookReservation, BookRecord, LibrarySettings } from '../../types/alims';
import { ThemeCustomizerModal, loadSavedBgConfig, MainPageBgConfig } from '../MainThemeBgSelector';

interface MyLibraryModuleProps {
  currentUser: UserProfile;
  transactions: CirculationTransaction[];
  reservations: BookReservation[];
  books?: BookRecord[];
  settings?: LibrarySettings;
  activeBranch?: string;
  onRenewLoan?: (txId: string) => void;
  onPayFine?: (memberId: string, amount: number) => void;
  onCancelReservation?: (resId: string) => void;
  onNavigateTab?: (tab: any) => void;
}

export const MyLibraryModule: React.FC<MyLibraryModuleProps> = ({
  currentUser,
  transactions,
  reservations,
  settings,
  onNavigateTab
}) => {
  const [bgConfig, setBgConfig] = useState<MainPageBgConfig>(() => loadSavedBgConfig());
  const [isThemeStudioOpen, setIsThemeStudioOpen] = useState(false);

  const myLoans = transactions.filter(t => t.memberId === currentUser.id);
  const myHolds = reservations.filter(r => r.memberId === currentUser.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#fafafa] flex items-center space-x-2">
            <BookMarked className="h-5 w-5 text-blue-400" />
            <span>My Library Account & Profile Center</span>
          </h2>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Welcome, <strong className="text-white">{currentUser.name}</strong> ({currentUser.memberCode}) • {currentUser.role}
          </p>
        </div>

        <button
          onClick={() => setIsThemeStudioOpen(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-2 cursor-pointer shadow-md transition-all self-start sm:self-auto"
        >
          <Sliders className="h-4 w-4" />
          <span>Change Main Page Theme</span>
        </button>
      </div>

      {/* Library Location & Contact Information Banner */}
      {settings && (
        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-[#121214] space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
              <Building2 className="h-4 w-4" />
              <span>{settings.libraryName || 'Pakistan Central Academic Library'} Info & Place</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono bg-[#09090b] px-2 py-0.5 rounded border border-[#27272a]">
              {settings.institutionName}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-[#09090b] border border-[#27272a]">
              <MapPin className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-[#a1a1aa] block font-medium">Place & Location</span>
                <span className="text-white font-bold block">{settings.libraryPlace || 'Main Campus Central Building'}</span>
                <span className="text-[#a1a1aa] text-[11px]">{settings.libraryLocation || 'Pakistan'}</span>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-[#09090b] border border-[#27272a]">
              <Mail className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-[#a1a1aa] block font-medium">Official Email</span>
                <a href={`mailto:${settings.libraryEmail || 'info@pslims.edu.pk'}`} className="text-blue-400 font-bold hover:underline block truncate max-w-[180px]">
                  {settings.libraryEmail || 'info@pslims.edu.pk'}
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-[#09090b] border border-[#27272a]">
              <Phone className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-[#a1a1aa] block font-medium">Mobile & Office Telephones</span>
                <span className="text-white font-bold block">{settings.libraryMobileNo || '+92 300 9876543'}</span>
                <span className="text-[#a1a1aa] text-[11px]">{settings.libraryOfficeNo || '+92 51 92654321'}</span>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-[#09090b] border border-[#27272a]">
              <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-[#a1a1aa] block font-medium">Operating Hours</span>
                <span className="text-white font-bold block">{settings.openingHours || 'Mon - Sat: 8:00 AM - 8:00 PM'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-[#27272a] bg-[#121214] space-y-3">
          <h3 className="text-sm font-bold text-[#fafafa] flex items-center justify-between">
            <span>My Active Books & Loans</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-mono">
              {myLoans.length} Checked Out
            </span>
          </h3>
          {myLoans.length === 0 ? (
            <p className="text-xs text-[#a1a1aa]">No active book loans at present.</p>
          ) : (
            myLoans.map(l => (
              <div key={l.id} className="p-3 rounded-xl border border-[#27272a] bg-[#09090b] text-xs space-y-1">
                <div className="font-bold text-[#fafafa]">{l.bookTitle}</div>
                <div className="text-[10px] text-[#a1a1aa] flex items-center justify-between">
                  <span>Due Date: <strong className="text-amber-400">{l.dueDate}</strong></span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[9px] uppercase">{l.status}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 rounded-2xl border border-[#27272a] bg-[#121214] space-y-3">
          <h3 className="text-sm font-bold text-[#fafafa] flex items-center justify-between">
            <span>My Reserved Holds</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-mono">
              {myHolds.length} Holds
            </span>
          </h3>
          {myHolds.length === 0 ? (
            <p className="text-xs text-[#a1a1aa]">No active reservations.</p>
          ) : (
            myHolds.map(h => (
              <div key={h.id} className="p-3 rounded-xl border border-[#27272a] bg-[#09090b] text-xs space-y-1">
                <div className="font-bold text-[#fafafa]">{h.bookTitle}</div>
                <div className="text-[10px] text-[#a1a1aa] flex items-center justify-between">
                  <span>Reserved: {h.reservationDate}</span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono text-[9px]">Queue #{h.priorityQueue}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Page Theme Customizer Modal */}
      <ThemeCustomizerModal
        isOpen={isThemeStudioOpen}
        onClose={() => setIsThemeStudioOpen(false)}
        config={bgConfig}
        onChangeConfig={setBgConfig}
      />
    </div>
  );
};
