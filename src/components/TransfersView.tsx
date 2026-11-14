import React, { useState } from 'react';
import { ArrowUpRight, Building2, CheckCircle2, CreditCard, Send } from 'lucide-react';
import { MERCHANT_META } from '../data/bankData';
import { MerchantId, PaymentChannel, UserProfile } from '../types/bank';
import { formatCurrency, maskAccountNumber } from '../utils/format';
import { MerchantLogo } from './MerchantLogo';

interface TransfersViewProps {
  user: UserProfile;
  initialMerchantId?: MerchantId | null;
  initialAmount?: number | null;
  onExecuteTransfer: (payload: {
    merchantId: MerchantId;
    merchantName: string;
    amount: number;
    channel: PaymentChannel;
    location: string;
    note?: string;
  }) => string;
  runWithLoader: (label: string, fn: () => void, delayMs?: number) => void;
}

const BILL_PAY_MERCHANTS: { id: MerchantId; defaultAmt: number; accountLabel: string }[] = [
  { id: 'att', defaultAmt: 16.0, accountLabel: 'Wireless Plan ••4410' },
  { id: 'network', defaultAmt: 65.99, accountLabel: 'Fiber Broadband ••8921' },
  { id: 'steam', defaultAmt: 29.99, accountLabel: 'Steam Wallet' },
  { id: 'bank-of-america', defaultAmt: 250.0, accountLabel: 'External Bank ACH' },
  { id: 'apple', defaultAmt: 14.99, accountLabel: 'Apple Services' },
  { id: 'starbucks', defaultAmt: 15.0, accountLabel: 'Starbucks Card Reload' },
  { id: 'uber-eats', defaultAmt: 25.0, accountLabel: 'Uber Cash Balance' },
];

export const TransfersView: React.FC<TransfersViewProps> = ({
  user,
  initialMerchantId,
  initialAmount,
  onExecuteTransfer,
  runWithLoader,
}) => {
  const [tab, setTab] = useState<'ach' | 'bill' | 'internal'>(
    initialMerchantId ? 'bill' : 'ach'
  );

  // ACH / Wire fields
  const [recipientName, setRecipientName] = useState('Bank of America Checking');
  const [recipientRouting, setRecipientRouting] = useState('026009593');
  const [recipientAccount, setRecipientAccount] = useState('448902119384');
  const [transferMethod, setTransferMethod] = useState<'Checking ACH' | 'Wire Transfer'>('Checking ACH');
  const [achAmount, setAchAmount] = useState('250.00');
  const [achMemo, setAchMemo] = useState('');

  // Bill Pay fields
  const [selectedBillMerchant, setSelectedBillMerchant] = useState<MerchantId>(
    initialMerchantId || 'att'
  );
  const [billAmount, setBillAmount] = useState(
    initialAmount ? initialAmount.toFixed(2) : '16.00'
  );

  // Internal Card Payment
  const [cardPayAmount, setCardPayAmount] = useState('500.00');

  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<{ ref: string; summary: string; amount: number } | null>(
    null
  );

  const handleAchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = parseFloat(achAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Enter a valid transfer amount greater than $0.00.');
      return;
    }
    if (parsed > user.availableBalance) {
      setError('Transfer amount exceeds your available Checking balance.');
      return;
    }
    if (recipientRouting.replace(/\D/g, '').length !== 9) {
      setError('Routing number must be exactly 9 digits.');
      return;
    }

    runWithLoader(
      `Authorizing ${transferMethod}...`,
      () => {
        const isBofa = recipientName.toLowerCase().includes('bank of america');
        const ref = onExecuteTransfer({
          merchantId: isBofa ? 'bank-of-america' : 'us-bank',
          merchantName: recipientName.trim() || 'External Recipient',
          amount: -parsed,
          channel: transferMethod,
          location: `Routing ${recipientRouting} · ••${recipientAccount.slice(-4)}`,
          note: achMemo.trim() || undefined,
        });

        setReceipt({
          ref,
          summary: `${transferMethod} sent to ${recipientName}`,
          amount: parsed,
        });
        setAchMemo('');
      },
      750
    );
  };

  const handleBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = parseFloat(billAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Enter a valid payment amount greater than $0.00.');
      return;
    }
    if (parsed > user.availableBalance) {
      setError('Payment amount exceeds your available Checking balance.');
      return;
    }

    const meta = MERCHANT_META[selectedBillMerchant];
    runWithLoader(
      `Sending payment to ${meta.name}...`,
      () => {
        const ref = onExecuteTransfer({
          merchantId: selectedBillMerchant,
          merchantName: meta.name,
          amount: -parsed,
          channel: 'Checking ACH',
          location: 'Instant Bill Pay',
        });

        setReceipt({
          ref,
          summary: `Payment sent to ${meta.name}`,
          amount: parsed,
        });
      },
      700
    );
  };

  const handleCardPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = parseFloat(cardPayAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Enter a valid payment amount.');
      return;
    }
    if (parsed > user.availableBalance) {
      setError('Amount exceeds your available Checking balance.');
      return;
    }

    runWithLoader(
      'Applying card payment...',
      () => {
        const ref = onExecuteTransfer({
          merchantId: 'us-bank',
          merchantName: 'U.S. Bank Altitude Reserve Payment',
          amount: -parsed,
          channel: 'Checking ACH',
          location: 'Internal Transfer to Visa ••4812',
        });

        setReceipt({
          ref,
          summary: 'Internal payment applied to U.S. Bank Altitude Reserve (••4812)',
          amount: parsed,
        });
      },
      650
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 bg-white/95 rounded-[28px] shadow-[0_14px_38px_rgba(14,23,71,0.05)] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#0E1747]">
              Transfers &amp; Payments
            </h2>
            <p className="text-xs text-[#8892AA] mt-0.5 tabular-nums">
              From {user.accountType} ({maskAccountNumber(user.accountNumber)}) · Available{' '}
              <span className="font-semibold text-[#0E1747]">
                {formatCurrency(user.availableBalance)}
              </span>
            </p>
          </div>
        </div>

        {/* Transfer Mode Switcher */}
        <div className="grid grid-cols-3 gap-1 p-1.5 bg-[#F1F4FA] rounded-2xl mb-6">
          {[
            { id: 'ach', label: 'ACH / Wire' },
            { id: 'bill', label: 'Pay Merchant' },
            { id: 'internal', label: 'Pay Credit Card' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id as 'ach' | 'bill' | 'internal');
                setError('');
                setReceipt(null);
              }}
              className={`py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                tab === item.id
                  ? 'bg-white text-[#0E1747] shadow-[0_4px_14px_rgba(14,23,71,0.06)]'
                  : 'text-[#7C869E] hover:text-[#0E1747]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-2xl bg-red-50 text-xs font-medium text-[#B91621]">
            {error}
          </div>
        )}

        {receipt && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-950">{receipt.summary}</p>
                <p className="text-xs text-emerald-800 mt-0.5 tabular-nums">
                  Amount {formatCurrency(receipt.amount)} · Reference {receipt.ref}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReceipt(null)}
              className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {tab === 'ach' && (
          <form onSubmit={handleAchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4B5572] mb-1.5">
                  Recipient / Institution Name
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl bg-[#F5F7FC] text-sm text-[#0E1747] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/15 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B5572] mb-1.5">
                  Transfer Rail
                </label>
                <select
                  value={transferMethod}
                  onChange={(e) =>
                    setTransferMethod(e.target.value as 'Checking ACH' | 'Wire Transfer')
                  }
                  className="w-full h-11 px-4 rounded-2xl bg-[#F5F7FC] text-sm text-[#0E1747] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/15 focus:bg-white cursor-pointer"
                >
                  <option value="Checking ACH">Standard ACH (1–2 Business Days)</option>
                  <option value="Wire Transfer">Domestic Fedwire (Same Day)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4B5572] mb-1.5">
                  Recipient Routing Number
                </label>
                <input
                  type="text"
                  required
                  maxLength={9}
                  value={recipientRouting}
                  onChange={(e) => setRecipientRouting(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-11 px-4 rounded-2xl bg-[#F5F7FC] font-mono text-sm text-[#0E1747] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/15 focus:bg-white tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B5572] mb-1.5">
                  Recipient Account Number
                </label>
                <input
                  type="text"
                  required
                  value={recipientAccount}
                  onChange={(e) => setRecipientAccount(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-11 px-4 rounded-2xl bg-[#F5F7FC] font-mono text-sm text-[#0E1747] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/15 focus:bg-white tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4B5572] mb-1.5">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={achAmount}
                  onChange={(e) => setAchAmount(e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl bg-[#F5F7FC] font-display text-base font-bold text-[#0E1747] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/15 focus:bg-white tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B5572] mb-1.5">
                  Memo (Optional)
                </label>
                <input
                  type="text"
                  value={achMemo}
                  onChange={(e) => setAchMemo(e.target.value)}
                  placeholder="Invoice or transfer note"
                  className="w-full h-11 px-4 rounded-2xl bg-[#F5F7FC] text-sm text-[#0E1747] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/15 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="h-12 px-6 rounded-2xl bg-[#0B1547] hover:bg-[#162261] text-white font-semibold text-sm inline-flex items-center gap-2 shadow-[0_12px_28px_rgba(11,21,71,0.2)] transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Authorize &amp; Send Transfer
            </button>
          </form>
        )}

        {tab === 'bill' && (
          <form onSubmit={handleBillSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#4B5572] mb-2.5">
                Select Linked Merchant or Biller
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BILL_PAY_MERCHANTS.map((b) => {
                  const meta = MERCHANT_META[b.id];
                  const active = selectedBillMerchant === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSelectedBillMerchant(b.id);
                        setBillAmount(b.defaultAmt.toFixed(2));
                      }}
                      className={`p-3.5 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-[#0B1547] text-white shadow-[0_10px_24px_rgba(11,21,71,0.2)]'
                          : 'bg-[#F5F7FC] text-[#0E1747] hover:bg-[#EBEEF7]'
                      }`}
                    >
                      <MerchantLogo merchantId={b.id} size="md" whiteRing={active} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{meta.name}</p>
                        <p
                          className={`text-xs truncate ${
                            active ? 'text-slate-300' : 'text-[#8892AA]'
                          }`}
                        >
                          {b.accountLabel}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-[#4B5572] mb-1.5">
                Payment Amount (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
                className="w-full h-11 px-4 rounded-2xl bg-[#F5F7FC] font-display text-base font-bold text-[#0E1747] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/15 focus:bg-white tabular-nums"
              />
            </div>

            <button
              type="submit"
              className="h-12 px-6 rounded-2xl bg-[#0B1547] hover:bg-[#162261] text-white font-semibold text-sm inline-flex items-center gap-2 shadow-[0_12px_28px_rgba(11,21,71,0.2)] transition-all cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              Pay {MERCHANT_META[selectedBillMerchant].name} Now
            </button>
          </form>
        )}

        {tab === 'internal' && (
          <form onSubmit={handleCardPaySubmit} className="space-y-5 max-w-md">
            <div className="p-4 rounded-2xl bg-[#F5F7FC] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0B1547] text-white flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0E1747]">Altitude Reserve Visa ••4812</p>
                  <p className="text-xs text-[#8892AA] tabular-nums">
                    Current balance {formatCurrency(user.creditBalance)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4B5572] mb-1.5">
                Payment Amount from Checking (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={cardPayAmount}
                onChange={(e) => setCardPayAmount(e.target.value)}
                className="w-full h-11 px-4 rounded-2xl bg-[#F5F7FC] font-display text-base font-bold text-[#0E1747] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/15 focus:bg-white tabular-nums"
              />
            </div>

            <button
              type="submit"
              className="h-12 px-6 rounded-2xl bg-[#0B1547] hover:bg-[#162261] text-white font-semibold text-sm inline-flex items-center gap-2 shadow-[0_12px_28px_rgba(11,21,71,0.2)] transition-all cursor-pointer"
            >
              Submit Card Payment
            </button>
          </form>
        )}
      </div>

      {/* Right Column: Originating Account Credentials */}
      <div className="lg:col-span-4 space-y-5">
        <div className="bg-[#0B1547] text-white rounded-[28px] p-6 shadow-[0_18px_46px_rgba(11,21,71,0.22)]">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-300">Originating Account</p>
              <h3 className="font-display text-base font-bold">{user.accountType} Account</h3>
            </div>
          </div>

          <div className="space-y-3.5 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-slate-300 text-xs">Account Holder</span>
              <span className="font-semibold text-right">{user.fullName}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-slate-300 text-xs">Routing Number</span>
              <span className="font-mono font-semibold tabular-nums">{user.routingNumber}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-slate-300 text-xs">Account Number</span>
              <span className="font-mono font-semibold tabular-nums">{user.accountNumber}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-300 text-xs">Available Balance</span>
              <span className="font-display text-xl font-bold tabular-nums">
                {formatCurrency(user.availableBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
