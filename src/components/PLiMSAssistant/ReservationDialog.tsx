import React, { useState } from 'react';
import { Bookmark, X, Check, Building2, MapPin, AlertCircle, ShieldCheck } from 'lucide-react';
import { BookRecord, UserProfile } from '../../types/alims';

interface ReservationDialogProps {
  book: BookRecord;
  currentUser?: UserProfile;
  onConfirm: (book: BookRecord, reservationId: string) => void;
  onCancel: () => void;
}

export const ReservationDialog: React.FC<ReservationDialogProps> = ({
  book,
  currentUser,
  onConfirm,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAvailable = book.availableCopies > 0;

  const handleConfirmReservation = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const generatedId = `PL-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      onConfirm(book, generatedId);
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl space-y-4 p-5 text-xs text-[#fafafa]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Bookmark className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#fafafa]">Confirm Book Hold / Reservation</h3>
              <p className="text-[11px] text-[#a1a1aa]">PLiMS Transaction Framework</p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg border border-[#27272a] text-[#71717a] hover:text-[#fafafa] hover:bg-[#27272a] transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Item Summary Card */}
        <div className="p-3.5 rounded-xl bg-[#18181b] border border-[#27272a] space-y-2">
          <div className="font-bold text-sm text-[#fafafa]">{book.title}</div>
          <div className="text-xs text-[#a1a1aa]">Authors: {book.authors.join(', ')}</div>

          <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] font-mono text-[#a1a1aa] border-t border-[#27272a]">
            <div><span className="text-[#71717a]">Call No:</span> {book.callNumber}</div>
            <div><span className="text-[#71717a]">Shelf:</span> {book.shelfLocation}</div>
            <div><span className="text-[#71717a]">Available:</span> {book.availableCopies}/{book.totalCopies}</div>
            <div><span className="text-[#71717a]">Patron:</span> {currentUser ? currentUser.name : 'Guest Patron'}</div>
          </div>
        </div>

        {/* Policy Alert Notice */}
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 flex items-start space-x-2 text-[11px]">
          <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Reservation Terms:</p>
            <p className="text-[#a1a1aa] leading-tight">
              Held items are held at the circulation desk for 48 hours. An automated SMS/Email notice will be dispatched once ready for collection.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pt-2">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#27272a] bg-[#18181b] hover:bg-[#27272a] text-[#fafafa] font-semibold text-xs transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmReservation}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-lg shadow-blue-600/20"
          >
            {isSubmitting ? (
              <span>Processing...</span>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Confirm Reservation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
