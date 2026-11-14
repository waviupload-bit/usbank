import React, { useState } from 'react';
import {
  Check,
  Copy,
  CreditCard,
  Download,
  Globe,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Unlock,
  User,
} from 'lucide-react';
import { BANK_LOGOS } from '../data/bankData';
import { BankCard, UserProfile } from '../types/bank';
import { formatCurrency } from '../utils/format';

interface MoreProfileViewProps {
  user: UserProfile;
  cards: BankCard[];
  onToggleCardFreeze: (cardId: string) => void;
  onSignOut: () => void;
  runWithLoader: (label: string, fn: () => void, delayMs?: number) => void;
}

export const MoreProfileView: React.FC<MoreProfileViewProps> = ({
  user,
  cards,
  onToggleCardFreeze,
  onSignOut,
  runWithLoader,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [travelNotice, setTravelNotice] = useState(false);
  const [contactlessEnabled, setContactlessEnabled] = useState(true);

  const handleCopy = (label: string, val: string) => {
    runWithLoader('Copying account detail...', () => {
      navigator.clipboard?.writeText(val);
      setCopiedKey(label);
      setTimeout(() => setCopiedKey(null), 1600);
    }, 260);
  };

  const handleDownloadStatement = () => {
    runWithLoader('Generating encrypted statement...', () => {
      const content = [
        'U.S. BANK OFFICIAL ACCOUNT SUMMARY',
        '===================================',
        `Account Holder: ${user.fullName}`,
        `Email: ${user.email}`,
        `Phone: ${user.phone}`,
        `Date of Birth: ${user.dateOfBirth}`,
        `Mailing Address: ${user.address}`,
        `Account Type: ${user.accountType}`,
        `Routing Number: ${user.routingNumber}`,
        `Account Number: ${user.accountNumber}`,
        `Available Balance: ${formatCurrency(user.availableBalance)}`,
        `Statement Date: November 13, 2026`,
      ].join('\n');

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `USBank-Statement-${user.accountNumber.slice(-4)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }, 550);
  };

  const profileRows = [
    { label: 'Account Holder', value: user.fullName, icon: User, copyable: false },
    { label: 'Email / Username', value: user.email, icon: Mail, copyable: true },
    { label: 'Phone Number', value: user.phone, icon: Phone, copyable: true },
    { label: 'Mailing Address', value: user.address, icon: MapPin, copyable: true },
    { label: 'Date of Birth', value: user.dateOfBirth, icon: ShieldCheck, copyable: false },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Customer Dossier & Banking Numbers */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white/95 rounded-[28px] shadow-[0_14px_38px_rgba(14,23,71,0.05)] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden shadow-[0_6px_18px_rgba(14,23,71,0.14)] ring-2 ring-white shrink-0 bg-[#E6EAF4]">
                <img
                  src={BANK_LOGOS.profileAvatar}
                  alt={user.fullName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-[center_20%]"
                />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-[#0E1747]">
                  {user.fullName}
                </h2>
                <p className="text-xs text-[#8892AA] mt-0.5">
                  {user.accountType} Account · Verified Profile
                </p>
              </div>
            </div>

            <img
              src={BANK_LOGOS.usBankHorizontal}
              alt="U.S. Bank"
              referrerPolicy="no-referrer"
              className="h-6 w-auto object-contain hidden sm:block"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-b border-slate-100">
            <div className="p-4 rounded-2xl bg-[#F5F7FC]">
              <p className="text-xs text-[#8892AA] mb-1">Routing Number</p>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-sm text-[#0E1747] tabular-nums">
                  {user.routingNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('routing', user.routingNumber)}
                  aria-label="Copy routing number"
                  className="text-slate-400 hover:text-[#0E1747] cursor-pointer"
                >
                  {copiedKey === 'routing' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F5F7FC]">
              <p className="text-xs text-[#8892AA] mb-1">Account Number</p>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-sm text-[#0E1747] tabular-nums">
                  {user.accountNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('account', user.accountNumber)}
                  aria-label="Copy account number"
                  className="text-slate-400 hover:text-[#0E1747] cursor-pointer"
                >
                  {copiedKey === 'account' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0B1547] text-white shadow-[0_10px_24px_rgba(11,21,71,0.18)]">
              <p className="text-xs text-slate-300 mb-1">Available Balance</p>
              <p className="font-display font-bold text-lg tabular-nums">
                {formatCurrency(user.availableBalance)}
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {profileRows.map((row) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.label}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#F4F6FC] flex items-center justify-center text-[#0E1747] shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-[#8892AA]">{row.label}</p>
                      <p className="text-sm font-semibold text-[#0E1747] truncate">
                        {row.value}
                      </p>
                    </div>
                  </div>
                  {row.copyable && (
                    <button
                      type="button"
                      onClick={() => handleCopy(row.label, row.value)}
                      className="text-xs font-semibold text-[#7C869E] hover:text-[#0E1747] px-3 py-1.5 rounded-xl hover:bg-[#F4F6FC] transition-colors cursor-pointer shrink-0"
                    >
                      {copiedKey === row.label ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Card Controls, Statements & Sign Out */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white/95 rounded-[28px] shadow-[0_14px_38px_rgba(14,23,71,0.05)] p-6">
          <h3 className="font-display text-lg font-bold text-[#0E1747] mb-4">
            Card Security Controls
          </h3>

          <div className="space-y-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="p-4 rounded-2xl bg-[#F5F7FC] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      card.variant === 'navy'
                        ? 'bg-[#0B1547] text-white'
                        : 'bg-white shadow-xs text-[#0E1747]'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0E1747] truncate">
                      {card.type} ••{card.last4}
                    </p>
                    <p className="text-xs text-[#8892AA]">
                      {card.frozen ? 'Card Locked (Frozen)' : 'Active · Ready for purchases'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    runWithLoader(
                      card.frozen ? 'Unlocking card...' : 'Locking card...',
                      () => onToggleCardFreeze(card.id),
                      400
                    )
                  }
                  className={`h-9 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                    card.frozen
                      ? 'bg-[#D91E2A] text-white hover:bg-[#B91621]'
                      : 'bg-white text-[#0E1747] shadow-xs hover:bg-slate-100'
                  }`}
                >
                  {card.frozen ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      Unlock
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      Lock
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-5 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-[#0E1747]" />
                <div>
                  <p className="text-sm font-semibold text-[#0E1747]">
                    International Travel Notice
                  </p>
                  <p className="text-xs text-[#8892AA]">
                    Authorize foreign currency card purchases
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={travelNotice}
                onClick={() =>
                  runWithLoader(
                    'Updating travel security...',
                    () => setTravelNotice((p) => !p),
                    350
                  )
                }
                className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                  travelNotice ? 'bg-[#0B1547]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    travelNotice ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-[#0E1747]" />
                <div>
                  <p className="text-sm font-semibold text-[#0E1747]">
                    Contactless &amp; Tap-to-Pay
                  </p>
                  <p className="text-xs text-[#8892AA]">
                    Enable NFC mobile wallet transactions
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={contactlessEnabled}
                onClick={() =>
                  runWithLoader(
                    'Updating contactless setting...',
                    () => setContactlessEnabled((p) => !p),
                    350
                  )
                }
                className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                  contactlessEnabled ? 'bg-[#0B1547]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    contactlessEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/95 rounded-[28px] shadow-[0_14px_38px_rgba(14,23,71,0.05)] p-6 space-y-3">
          <button
            type="button"
            onClick={handleDownloadStatement}
            className="w-full h-11 px-4 rounded-2xl bg-[#F4F6FC] hover:bg-[#EAEFF9] text-[#0E1747] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download November Account Statement
          </button>

          <button
            type="button"
            onClick={() => runWithLoader('Securing & signing out...', onSignOut, 500)}
            className="w-full h-11 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-[#B91621] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out Safely
          </button>
        </div>
      </div>
    </div>
  );
};
