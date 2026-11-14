import React, { useMemo, useState } from 'react';
import { ArrowLeft, Info, Repeat, ShieldAlert } from 'lucide-react';
import { MERCHANT_META, MONTHLY_SPEND_SERIES } from '../data/bankData';
import { MerchantId, Transaction } from '../types/bank';
import { formatCurrency, formatSignedCurrency } from '../utils/format';
import { MerchantLogo } from './MerchantLogo';

interface MerchantDetailPanelProps {
  merchantId: MerchantId;
  selectedTransaction?: Transaction | null;
  allTransactions: Transaction[];
  onClose?: () => void;
  onRepeatPayment?: (merchantId: MerchantId, suggestedAmount: number) => void;
  onReportIssue?: (tx: Transaction) => void;
}

export const MerchantDetailPanel: React.FC<MerchantDetailPanelProps> = ({
  merchantId,
  selectedTransaction,
  allTransactions,
  onClose,
  onRepeatPayment,
  onReportIssue,
}) => {
  const meta = MERCHANT_META[merchantId] ?? MERCHANT_META['us-bank'];
  const series = MONTHLY_SPEND_SERIES[merchantId] ?? MONTHLY_SPEND_SERIES['us-bank'];
  const [activeMonthIndex, setActiveMonthIndex] = useState(series.length - 1);

  const merchantTransactions = useMemo(
    () => allTransactions.filter((t) => t.merchantId === merchantId),
    [allTransactions, merchantId]
  );

  const groupedByDate = useMemo(() => {
    const groups: { dateLabel: string; items: Transaction[] }[] = [];
    for (const tx of merchantTransactions) {
      const last = groups[groups.length - 1];
      if (!last || last.dateLabel !== tx.dateLabel) {
        groups.push({ dateLabel: tx.dateLabel, items: [tx] });
      } else {
        last.items.push(tx);
      }
    }
    return groups;
  }, [merchantTransactions]);

  const primaryTx = selectedTransaction && selectedTransaction.merchantId === merchantId
    ? selectedTransaction
    : merchantTransactions[0];

  const maxBarValue = Math.max(...series.map((s) => s.amount), 1);
  const selectedMonth = series[activeMonthIndex] ?? series[series.length - 1];

  return (
    <div className="bg-[#0E1747] text-white rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(14,23,71,0.18)] flex flex-col h-full">
      {/* Deep Navy Header & Bar Analytics (Mockup 3 faithful architecture) */}
      <div className="px-6 pt-6 pb-7">
        <div className="flex items-center justify-between mb-6">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Back to overview"
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-xs font-medium text-slate-300">Merchant Insights</span>
          )}

          <h3 className="font-display text-base font-semibold text-white truncate px-3">
            {meta.name}
          </h3>

          <span className="text-xs font-mono text-slate-300 tabular-nums">
            {merchantTransactions.length} tx
          </span>
        </div>

        {/* Center Logo + Hero Amount */}
        <div className="flex flex-col items-center text-center">
          <MerchantLogo merchantId={merchantId} size="xl" whiteRing className="mb-4" />
          <p className="font-display text-3xl sm:text-4xl font-bold tracking-tight tabular-nums text-white">
            {primaryTx ? formatSignedCurrency(primaryTx.amount) : formatCurrency(selectedMonth.amount)}
          </p>
          <p className="text-xs text-slate-300 mt-1.5 tabular-nums">
            {primaryTx
              ? `${primaryTx.timeLabel}, ${primaryTx.dateLabel} · ${primaryTx.channel}`
              : `${meta.category} · ${selectedMonth.month} 2026`}
          </p>
        </div>

        {/* 9-Month Interactive Bar Chart */}
        <div className="mt-7">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-3">
            <span>{selectedMonth.month} 2026 activity</span>
            <span className="font-mono font-semibold text-white tabular-nums">
              {formatCurrency(selectedMonth.amount, false)}
            </span>
          </div>

          <div className="grid grid-cols-9 gap-2 items-end h-28 pt-2">
            {series.map((point, idx) => {
              const heightPct = Math.max(16, Math.round((point.amount / maxBarValue) * 100));
              const isActive = idx === activeMonthIndex;
              return (
                <button
                  key={point.month}
                  type="button"
                  onClick={() => setActiveMonthIndex(idx)}
                  aria-label={`${point.month}: ${formatCurrency(point.amount)}`}
                  className="flex flex-col items-center justify-end h-full group cursor-pointer focus-visible:outline-2 focus-visible:outline-white rounded"
                >
                  <div
                    className={`w-full rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white shadow-[0_0_18px_rgba(255,255,255,0.28)]'
                        : 'bg-white/20 group-hover:bg-white/35'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-9 gap-2 mt-2 text-center">
            {series.map((point, idx) => (
              <span
                key={point.month}
                className={`text-[11px] font-medium ${
                  idx === activeMonthIndex ? 'text-white font-semibold' : 'text-slate-400'
                }`}
              >
                {idx % 2 === 0 || idx === activeMonthIndex ? point.month : ''}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Crisp White Rounded Sheet Below */}
      <div className="bg-white text-[#0E1747] rounded-t-3xl flex-1 px-6 pt-5 pb-6 flex flex-col justify-between">
        <div>
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

          {/* Quick Merchant Actions */}
          <div className="flex items-center gap-2.5 mb-5">
            {onRepeatPayment && (
              <button
                type="button"
                onClick={() =>
                  onRepeatPayment(
                    merchantId,
                    primaryTx ? Math.abs(primaryTx.amount) : 25.0
                  )
                }
                className="flex-1 h-10 px-3 rounded-xl bg-[#F4F6FA] hover:bg-slate-200/70 text-[#0E1747] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Repeat className="w-3.5 h-3.5" />
                Pay Again
              </button>
            )}
            {onReportIssue && primaryTx && (
              <button
                type="button"
                onClick={() => onReportIssue(primaryTx)}
                className="flex-1 h-10 px-3 rounded-xl bg-[#F4F6FA] hover:bg-slate-200/70 text-[#0E1747] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Ask Support
              </button>
            )}
          </div>

          {/* Merchant Transactions List */}
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {groupedByDate.map((group) => (
              <div key={group.dateLabel}>
                <p className="text-xs font-medium text-slate-400 mb-2.5">
                  {group.dateLabel}
                </p>
                <div className="space-y-3">
                  {group.items.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-3 py-1"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <MerchantLogo merchantId={tx.merchantId} size="md" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-[#0E1747] truncate">
                              {tx.merchantName}
                            </p>
                            <Info className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {tx.channel}
                            {tx.location ? ` · ${tx.location}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm font-bold tabular-nums ${
                            tx.amount > 0 ? 'text-emerald-600' : 'text-[#0E1747]'
                          }`}
                        >
                          {formatSignedCurrency(tx.amount)}
                        </p>
                        <p className="text-[11px] text-slate-400 tabular-nums mt-0.5">
                          {tx.timeLabel}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {primaryTx && (
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Reference {primaryTx.reference}</span>
            <span className="text-emerald-600 font-medium">{primaryTx.status}</span>
          </div>
        )}
      </div>
    </div>
  );
};
