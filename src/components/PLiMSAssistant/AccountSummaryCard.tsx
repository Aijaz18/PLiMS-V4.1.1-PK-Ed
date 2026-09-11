import React, { useState } from 'react';
import {
  User,
  BookOpen,
  Calendar,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Award,
  Clock
} from 'lucide-react';
import { UserProfile, CirculationTransaction } from '../../types/alims';

interface AccountSummaryCardProps {
  currentUser?: UserProfile;
  transactions: CirculationTransaction[];
  onRenewTransaction: (txId: string) => void;
  onRenewAllEligible: () => void;
}

export const AccountSummaryCard: React.FC<AccountSummaryCardProps> = ({
  currentUser,
  transactions,
  onRenewTransaction,
  onRenewAllEligible
}) => {
  const [renewedIds, setRenewedIds] = useState<string[]>([]);

  // Filter transactions for current member or show demo patron transactions
  const userLoans = transactions.filter(
    t => (currentUser && (t.memberId === currentUser.id || t.memberName === currentUser.name)) || t.status === 'ISSUED'
  ).slice(0, 5);

  const overdueLoans = userLoans.filter(t => t.status === 'OVERDUE' || new Date(t.dueDate) < new Date());
  const pendingFinePKR = currentUser?.finePending || overdueLoans.length * 100;

  const handleSingleRenew = (id: string) => {
    onRenewTransaction(id);
    setRenewedIds(prev => [...prev, id]);
  };

  return (
    <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-4 space-y-4 text-xs text-[#fafafa] shadow-lg">
      {/* Patron Header Badge */}
      <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
            {currentUser?.name ? currentUser.name.charAt(0) : 'P'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm text-[#fafafa]">{currentUser?.name || 'Patron Account'}</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                {currentUser?.status || 'ACTIVE'}
              </span>
            </div>
            <p className="text-[11px] text-[#a1a1aa] font-mono">
              ID: {currentUser?.memberCode || 'PL-STUDENT-2026'} • Role: {currentUser?.role || 'STUDENT'}
            </p>
          </div>
        </div>

        <div className="text-right font-mono">
          <div className="text-[10px] text-[#71717a] uppercase">Pending Fines</div>
          <div className={`text-sm font-bold ${pendingFinePKR > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            PKR {pendingFinePKR}
          </div>
        </div>
      </div>

      {/* Account Stats Grid */}
      <div className="grid grid-cols-3 gap-2 text-center font-mono">
        <div className="p-2.5 rounded-xl bg-[#09090b] border border-[#27272a]">
          <div className="text-base font-bold text-blue-400">{userLoans.length}</div>
          <div className="text-[10px] text-[#a1a1aa]">Active Loans</div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#09090b] border border-[#27272a]">
          <div className={`text-base font-bold ${overdueLoans.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {overdueLoans.length}
          </div>
          <div className="text-[10px] text-[#a1a1aa]">Overdue Items</div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#09090b] border border-[#27272a]">
          <div className="text-base font-bold text-purple-400">
            {(currentUser?.maxBorrowLimit || 5) >= 9999 ? '∞' : (currentUser?.maxBorrowLimit || 5)}
          </div>
          <div className="text-[10px] text-[#a1a1aa]">
            {(currentUser?.maxBorrowLimit || 5) >= 9999 ? 'Unlimited' : 'Max Limit'}
          </div>
        </div>
      </div>

      {/* Active Borrowed Loans List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[#a1a1aa]">
          <span>Current Borrowed Titles ({userLoans.length})</span>
          <button
            onClick={onRenewAllEligible}
            className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline flex items-center space-x-1"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Renew All Eligible</span>
          </button>
        </div>

        {userLoans.length === 0 ? (
          <div className="p-3 text-center text-[#71717a] bg-[#09090b] rounded-xl border border-[#27272a]">
            No active borrowed items currently recorded.
          </div>
        ) : (
          <div className="space-y-1.5">
            {userLoans.map(loan => {
              const isOverdue = new Date(loan.dueDate) < new Date() || loan.status === 'OVERDUE';
              const isRenewed = renewedIds.includes(loan.id) || (loan.renewCount && loan.renewCount > 0);

              return (
                <div
                  key={loan.id}
                  className="p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] flex items-center justify-between space-x-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[#fafafa] truncate">{loan.bookTitle}</div>
                    <div className="flex items-center space-x-2 text-[10px] text-[#71717a] font-mono">
                      <span>Due: {loan.dueDate}</span>
                      {isOverdue && (
                        <span className="text-rose-400 font-bold flex items-center space-x-0.5">
                          <AlertCircle className="h-3 w-3" />
                          <span>Overdue</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSingleRenew(loan.id)}
                    disabled={isOverdue || isRenewed}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                      isRenewed
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : isOverdue
                        ? 'bg-[#18181b] text-[#71717a] border border-[#27272a] cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    {isRenewed ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Renewed</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-3 w-3" />
                        <span>Renew</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
