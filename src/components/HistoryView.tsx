import React, { useMemo, useState } from 'react';
import { Download, Info, Search, X } from 'lucide-react';
import { MERCHANT_META } from '../data/bankData';
import { MerchantId, Transaction } from '../types/bank';
import { formatSignedCurrency } from '../utils/format';
import { MerchantLogo } from './MerchantLogo';

interface HistoryViewProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  runWithLoader: (label: string, fn: () => void, delayMs?: number) => void;
}

type ChannelFilter = 'all' | 'debit' | 'credit' | 'ach' | 'deposits';

export const HistoryView: React.FC<HistoryViewProps> = ({
  transactions,
  onSelectTransaction,
  runWithLoader,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [merchantFilter, setMerchantFilter] = useState<MerchantId | 'all'>('all');

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (channelFilter === 'debit' && tx.channel !== 'Debit Card') return false;
      if (channelFilter === 'credit' && tx.channel !== 'Credit Card') return false;
      if (
        channelFilter === 'ach' &&
        tx.channel !== 'Checking ACH' &&
        tx.channel !== 'Wire Transfer'
      ) {
        return false;
      }
      if (channelFilter === 'deposits' && tx.amount <= 0) return false;
      if (merchantFilter !== 'all' && tx.merchantId !== merchantFilter) return false;

      if (!q) return true;
      return (
        tx.merchantName.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        tx.channel.toLowerCase().includes(q) ||
        tx.reference.toLowerCase().includes(q) ||
        (tx.location?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [transactions, searchQuery, channelFilter, merchantFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, { dateLabel: string; netTotal: number; items: Transaction[] }>();
    for (const tx of filtered) {
      const existing = map.get(tx.dateLabel);
      if (existing) {
        existing.items.push(tx);
        existing.netTotal += tx.amount;
      } else {
        map.set(tx.dateLabel, {
          dateLabel: tx.dateLabel,
          netTotal: tx.amount,
          items: [tx],
        });
      }
    }
    return Array.from(map.values());
  }, [filtered]);

  const handleExportCsv = () => {
    runWithLoader(
      'Preparing CSV export...',
      () => {
        const headers = [
          'Date',
          'Time',
          'Merchant',
          'Category',
          'Channel',
          'Amount',
          'Reference',
          'Status',
        ];
        const rows = filtered.map((t) => [
          t.dateISO,
          t.timeLabel,
          `"${t.merchantName}"`,
          `"${t.category}"`,
          `"${t.channel}"`,
          t.amount.toFixed(2),
          t.reference,
          t.status,
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'usbank-checking-history.csv';
        link.click();
        URL.revokeObjectURL(url);
      },
      500
    );
  };

  const filterTabs: { id: ChannelFilter; label: string }[] = [
    { id: 'all', label: 'All Activity' },
    { id: 'debit', label: 'Debit Card' },
    { id: 'credit', label: 'Credit Card' },
    { id: 'ach', label: 'ACH & Wire' },
    { id: 'deposits', label: 'Deposits' },
  ];

  const availableMerchants = Object.keys(MERCHANT_META) as MerchantId[];

  return (
    <div className="bg-white/95 rounded-[28px] shadow-[0_14px_38px_rgba(14,23,71,0.05)] p-6 sm:p-8">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0E1747]">History</h2>
          <p className="text-xs text-[#8892AA] mt-0.5 tabular-nums">
            Showing {filtered.length} of {transactions.length} posted transactions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={merchantFilter}
            onChange={(e) => {
              const val = e.target.value as MerchantId | 'all';
              runWithLoader('Filtering merchant ledger...', () => setMerchantFilter(val), 250);
            }}
            aria-label="Filter by merchant"
            className="h-10 px-3.5 rounded-2xl bg-[#F4F6FC] text-xs font-semibold text-[#0E1747] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/15 cursor-pointer"
          >
            <option value="all">All Merchants</option>
            {availableMerchants.map((id) => (
              <option key={id} value={id}>
                {MERCHANT_META[id].name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExportCsv}
            className="h-10 px-4 rounded-2xl bg-[#F4F6FC] hover:bg-[#EAEFF9] text-[#0E1747] text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search + Segmented Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-7">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8892AA] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search merchant, channel, location, or reference..."
            className="w-full h-11 pl-10 pr-9 rounded-2xl bg-[#F5F7FC] text-sm text-[#0E1747] placeholder:text-[#9CA5BA] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/15 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-[#0E1747] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 p-1.5 bg-[#F1F4FA] rounded-2xl overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                runWithLoader('Updating activity view...', () => setChannelFilter(tab.id), 220)
              }
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                channelFilter === tab.id
                  ? 'bg-white text-[#0E1747] shadow-[0_4px_14px_rgba(14,23,71,0.06)]'
                  : 'text-[#7C869E] hover:text-[#0E1747]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped Transaction Ledger */}
      {grouped.length === 0 ? (
        <div className="py-14 text-center rounded-3xl bg-[#F8FAFD]">
          <p className="font-display font-bold text-base text-[#0E1747] mb-1">
            No matching transactions
          </p>
          <p className="text-xs text-[#8892AA] mb-4">
            Adjust your search query or channel filters to inspect posted activity.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setChannelFilter('all');
              setMerchantFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-[#0B1547] text-white text-xs font-semibold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-7">
          {grouped.map((group) => (
            <section key={group.dateLabel}>
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
                <h3 className="text-sm font-medium text-[#8C96AE]">{group.dateLabel}</h3>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    group.netTotal > 0 ? 'text-emerald-600' : 'text-[#8C96AE]'
                  }`}
                >
                  {formatSignedCurrency(group.netTotal)}
                </span>
              </div>

              <div className="divide-y divide-slate-100/70">
                {group.items.map((tx) => (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => onSelectTransaction(tx)}
                    className="w-full py-3.5 px-2.5 -mx-2.5 rounded-2xl flex items-center justify-between gap-4 hover:bg-[#F5F7FC] transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <MerchantLogo merchantId={tx.merchantId} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm sm:text-[15px] font-semibold text-[#0E1747] truncate">
                            {tx.merchantName}
                          </span>
                          <Info className="w-3.5 h-3.5 text-[#BCC4D6] group-hover:text-[#0E1747] transition-colors shrink-0" />
                        </div>
                        <p className="text-xs text-[#8C96AE] truncate mt-0.5">
                          {tx.channel}
                          {tx.location ? ` · ${tx.location}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm sm:text-[15px] font-bold tabular-nums ${
                          tx.amount > 0 ? 'text-emerald-600' : 'text-[#0E1747]'
                        }`}
                      >
                        {formatSignedCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-[#8C96AE] tabular-nums mt-0.5">
                        {tx.timeLabel}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
