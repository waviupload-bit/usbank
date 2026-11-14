import React, { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Briefcase,
  Check,
  Copy,
  Eye,
  EyeOff,
  History,
  Info,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Snowflake,
  X,
} from 'lucide-react';
import {
  BANK_LOGOS,
  QUICK_PAY_ITEMS,
} from '../data/bankData';
import {
  BankCard,
  ChatMessage,
  MerchantId,
  NavTab,
  PaymentChannel,
  Transaction,
  UserProfile,
} from '../types/bank';
import { formatCurrency, formatSignedCurrency, maskAccountNumber } from '../utils/format';
import { ActionLoader } from './ActionLoader';
import { ChatSupportView } from './ChatSupportView';
import { HistoryView } from './HistoryView';
import { MerchantDetailPanel } from './MerchantDetailPanel';
import { MerchantLogo } from './MerchantLogo';
import { MoreProfileView } from './MoreProfileView';
import { TransfersView } from './TransfersView';

interface DashboardAppProps {
  user: UserProfile;
  cards: BankCard[];
  transactions: Transaction[];
  chatMessages: ChatMessage[];
  onExecuteTransfer: (payload: {
    merchantId: MerchantId;
    merchantName: string;
    amount: number;
    channel: PaymentChannel;
    location: string;
    note?: string;
  }) => string;
  onAddVirtualCard: (label: string, network: 'mastercard' | 'visa') => void;
  onToggleCardFreeze: (cardId: string) => void;
  onSendChatMessage: (text: string) => void;
  onSignOut: () => void;
}

export const DashboardApp: React.FC<DashboardAppProps> = ({
  user,
  cards,
  transactions,
  chatMessages,
  onExecuteTransfer,
  onAddVirtualCard,
  onToggleCardFreeze,
  onSendChatMessage,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<NavTab>('main');
  const [loaderLabel, setLoaderLabel] = useState<string | null>(null);

  const [showAccountDrawer, setShowAccountDrawer] = useState(false);
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Selected transaction/merchant for the analytics panel
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(
    transactions.find((t) => t.merchantId === 'bank-of-america') ?? transactions[0] ?? null
  );
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Pre-fill Transfers from Quick Pay or "Pay Again"
  const [prefillMerchant, setPrefillMerchant] = useState<MerchantId | null>(null);
  const [prefillAmount, setPrefillAmount] = useState<number | null>(null);

  // Add Virtual Card Modal
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCardLabel, setNewCardLabel] = useState('Travel Virtual Card');
  const [newCardNetwork, setNewCardNetwork] = useState<'mastercard' | 'visa'>('mastercard');

  const runWithLoader = (label: string, fn: () => void, delayMs = 360) => {
    setLoaderLabel(label);
    setTimeout(() => {
      fn();
      setLoaderLabel(null);
    }, delayMs);
  };

  const handleNavigate = (tab: NavTab, customLabel?: string) => {
    if (tab === activeTab) return;
    const labels: Record<NavTab, string> = {
      main: 'Loading My cards...',
      transfers: 'Opening Transfers...',
      history: 'Loading History ledger...',
      chat: 'Connecting to Client Support...',
      more: 'Opening Profile & Security...',
    };
    runWithLoader(
      customLabel ?? labels[tab],
      () => {
        if (tab !== 'transfers') {
          setPrefillMerchant(null);
          setPrefillAmount(null);
        }
        setActiveTab(tab);
      },
      300
    );
  };

  const handleCopy = (key: string, val: string) => {
    runWithLoader(
      'Copying to clipboard...',
      () => {
        navigator.clipboard?.writeText(val);
        setCopiedField(key);
        setTimeout(() => setCopiedField(null), 1500);
      },
      220
    );
  };

  const handleSelectTransaction = (tx: Transaction) => {
    runWithLoader(
      `Loading ${tx.merchantName} analytics...`,
      () => {
        setSelectedTx(tx);
        setMobileDetailOpen(true);
      },
      320
    );
  };

  const handleQuickPayClick = (merchantId: MerchantId, amount: number) => {
    runWithLoader(
      'Preparing quick payment...',
      () => {
        setPrefillMerchant(merchantId);
        setPrefillAmount(amount);
        setMobileDetailOpen(false);
        setActiveTab('transfers');
      },
      340
    );
  };

  const handleReportTransaction = (tx: Transaction) => {
    runWithLoader(
      'Opening support ticket...',
      () => {
        setMobileDetailOpen(false);
        setActiveTab('chat');
        onSendChatMessage(
          `Please review transaction ${tx.reference} (${tx.merchantName} for ${formatSignedCurrency(
            tx.amount
          )} on ${tx.dateLabel}).`
        );
      },
      420
    );
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardLabel.trim()) return;
    runWithLoader(
      'Issuing virtual card...',
      () => {
        onAddVirtualCard(newCardLabel.trim(), newCardNetwork);
        setShowAddCardModal(false);
        setNewCardLabel('Travel Virtual Card');
      },
      600
    );
  };

  // Group recent transactions by date for the soft bottom sheet
  const recentGrouped = useMemo(() => {
    const slice = transactions.slice(0, 14);
    const map = new Map<string, { dateLabel: string; netTotal: number; items: Transaction[] }>();
    for (const tx of slice) {
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
  }, [transactions]);

  const desktopNavItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'main', label: 'Main', icon: Briefcase },
    { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
    { id: 'history', label: 'History', icon: History },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  const activeMerchantId: MerchantId = selectedTx?.merchantId ?? 'bank-of-america';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EFF2F9] via-[#ECEFF8] to-[#E7ECF6] text-[#0E1747] flex">
      <ActionLoader visible={Boolean(loaderLabel)} label={loaderLabel ?? ''} />

      {/* Soft Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[252px] lg:flex-col lg:fixed lg:inset-y-0 bg-white/85 backdrop-blur-md shadow-[8px_0_32px_rgba(14,23,71,0.03)] z-30">
        <div className="p-6">
          <img
            src={BANK_LOGOS.usBankHorizontal}
            alt="U.S. Bank"
            referrerPolicy="no-referrer"
            className="h-7 w-auto object-contain"
          />
        </div>

        <nav className="flex-1 px-4 py-3 space-y-1.5">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full h-11 px-4 rounded-2xl flex items-center justify-between text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#0B1547] text-white shadow-[0_10px_24px_rgba(11,21,71,0.18)]'
                    : 'text-[#6E7894] hover:bg-[#F3F5FB] hover:text-[#0E1747]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.id === 'more' && (
                  <span className="w-5 h-5 rounded-full bg-[#D91E2A] text-white text-[10px] font-bold flex items-center justify-center">
                    2
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4">
          <button
            type="button"
            onClick={() => handleNavigate('more', 'Opening profile...')}
            className="w-full p-3.5 rounded-2xl bg-[#F5F7FC] hover:bg-[#ECEFF8] transition-colors flex items-center gap-3 text-left cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-white shadow-sm shrink-0 bg-[#E6EAF4]">
              <img
                src={BANK_LOGOS.profileAvatar}
                alt={user.fullName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-[center_20%]"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#0E1747] truncate">{user.fullName}</p>
              <p className="text-[11px] font-mono text-[#7C869E] truncate tabular-nums">
                {user.accountType} · {maskAccountNumber(user.accountNumber)}
              </p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:pl-[252px] flex flex-col min-w-0 pb-24 lg:pb-10">
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 pt-6 sm:pt-8">
          {/* Top Header Row — Matches jkhb.png ("My cards" + Profile Picture) */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-[28px] sm:text-3xl font-bold tracking-tight text-[#0E1747]">
                {activeTab === 'main' && 'My cards'}
                {activeTab === 'history' && 'History'}
                {activeTab === 'transfers' && 'Transfers'}
                {activeTab === 'chat' && 'Chat'}
                {activeTab === 'more' && 'More'}
              </h1>
              {activeTab !== 'main' && (
                <button
                  type="button"
                  onClick={() => handleNavigate('main')}
                  className="text-xs font-semibold text-[#7C869E] hover:text-[#0E1747] mt-0.5 cursor-pointer"
                >
                  Back to My cards
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  runWithLoader(
                    showAccountDrawer ? 'Hiding account details...' : 'Loading account details...',
                    () => setShowAccountDrawer((p) => !p),
                    240
                  )
                }
                className="hidden sm:inline-flex h-10 px-4 rounded-full bg-white/90 hover:bg-white text-xs font-semibold text-[#0E1747] shadow-[0_6px_20px_rgba(14,23,71,0.05)] items-center gap-2 transition-all cursor-pointer tabular-nums"
              >
                <span>Routing {user.routingNumber}</span>
                <span className="text-[#B6C0D6]">·</span>
                <span>{showAccountDrawer ? 'Hide Account' : 'Checking Info'}</span>
              </button>

              {/* Profile Picture Avatar */}
              <button
                type="button"
                onClick={() => handleNavigate('more', 'Loading profile...')}
                aria-label="Open profile"
                className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white shadow-[0_8px_22px_rgba(14,23,71,0.14)] cursor-pointer hover:scale-[1.03] transition-transform shrink-0 bg-[#E6EAF4]"
              >
                <img
                  src={BANK_LOGOS.profileAvatar}
                  alt={user.fullName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-[center_20%]"
                />
              </button>
            </div>
          </div>

          {/* Expandable Soft Checking / Routing Details Drawer */}
          {showAccountDrawer && activeTab === 'main' && (
            <div className="mb-6 bg-white/90 backdrop-blur-md rounded-[26px] p-5 shadow-[0_12px_32px_rgba(14,23,71,0.05)] grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <p className="text-[11px] text-[#8C96AE]">Account Holder ({user.accountType})</p>
                <p className="text-sm font-bold text-[#0E1747] mt-0.5">{user.fullName}</p>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#F5F7FC]">
                <div>
                  <span className="text-[11px] text-[#8C96AE] block">Routing Number</span>
                  <span className="font-mono text-xs font-semibold text-[#0E1747] tabular-nums">
                    {user.routingNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('routing', user.routingNumber)}
                  aria-label="Copy routing number"
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[#7C869E] hover:text-[#0E1747] cursor-pointer"
                >
                  {copiedField === 'routing' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#F5F7FC]">
                <div>
                  <span className="text-[11px] text-[#8C96AE] block">Account Number</span>
                  <span className="font-mono text-xs font-semibold text-[#0E1747] tabular-nums">
                    {showFullAccount ? user.accountNumber : maskAccountNumber(user.accountNumber)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowFullAccount((p) => !p)}
                    aria-label={showFullAccount ? 'Hide account number' : 'Show account number'}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[#7C869E] hover:text-[#0E1747] cursor-pointer"
                  >
                    {showFullAccount ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy('account', user.accountNumber)}
                    aria-label="Copy account number"
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[#7C869E] hover:text-[#0E1747] cursor-pointer"
                  >
                    {copiedField === 'account' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'main' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-7 items-start">
              {/* Left Primary Column — Exact jkhb.png Layout */}
              <div className="xl:col-span-7 space-y-6">
                {/* Cards Row: Circular dashed + button + White Debit Card + Deep Navy Visa Card */}
                <section aria-label="Cards carousel">
                  <div className="flex items-center gap-4 overflow-x-auto pb-3 pt-1 px-1">
                    {/* Circular Dashed Add Button (Matches jkhb.png) */}
                    <button
                      type="button"
                      onClick={() =>
                        runWithLoader(
                          'Opening card creator...',
                          () => setShowAddCardModal(true),
                          220
                        )
                      }
                      aria-label="Add new card"
                      className="w-16 h-16 rounded-full border-2 border-dashed border-[#B7C0D6] hover:border-[#0E1747] flex items-center justify-center text-[#8E98B2] hover:text-[#0E1747] transition-colors shrink-0 cursor-pointer bg-white/40"
                    >
                      <Plus className="w-6 h-6" />
                    </button>

                    {cards.map((card) => {
                      const isDebit = card.type === 'Debit Card';
                      const liveBalance = isDebit ? user.availableBalance : card.balance;
                      const isNavy = card.variant === 'navy';

                      return (
                        <div
                          key={card.id}
                          onClick={() =>
                            runWithLoader(
                              isDebit ? 'Toggling checking info...' : 'Inspecting card details...',
                              () => {
                                if (isDebit) {
                                  setShowAccountDrawer((p) => !p);
                                } else {
                                  handleNavigate('transfers', 'Opening card payment...');
                                }
                              },
                              260
                            )
                          }
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setShowAccountDrawer((p) => !p);
                            }
                          }}
                          className={`w-[205px] sm:w-[224px] h-[182px] rounded-[28px] p-6 flex flex-col justify-between shrink-0 cursor-pointer transition-transform hover:-translate-y-0.5 ${
                            isNavy
                              ? 'bg-[#0B1547] text-white shadow-[0_18px_42px_rgba(11,21,71,0.22)]'
                              : 'bg-white text-[#0E1747] shadow-[0_18px_42px_rgba(14,23,71,0.06)]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            {card.network === 'mastercard' ? (
                              <img
                                src={BANK_LOGOS.mastercard}
                                alt="Mastercard"
                                referrerPolicy="no-referrer"
                                className="h-7 w-auto object-contain"
                              />
                            ) : (
                              <span
                                className={`font-display font-extrabold text-base tracking-wider italic ${
                                  isNavy ? 'text-white' : 'text-[#0E1747]'
                                }`}
                              >
                                VISA
                              </span>
                            )}

                            {card.frozen && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#D91E2A] text-white">
                                <Snowflake className="w-3 h-3" />
                                Frozen
                              </span>
                            )}
                          </div>

                          <div>
                            <p className="font-display text-[22px] sm:text-2xl font-bold tabular-nums tracking-tight">
                              {formatCurrency(liveBalance)}
                            </p>
                            <p
                              className={`text-xs mt-1 font-medium ${
                                isNavy ? 'text-[#8C96B8]' : 'text-[#8C96AE]'
                              }`}
                            >
                              {card.type}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Soft Quick Pay Pills Row (Matches jkhb.png: AT&T, Network, Steam, etc.) */}
                <section aria-label="Quick bills">
                  <div className="flex items-center gap-3.5 overflow-x-auto pb-2 px-1">
                    {QUICK_PAY_ITEMS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleQuickPayClick(item.merchantId, item.defaultAmount)}
                        className="bg-white/95 hover:bg-white rounded-full pl-2.5 pr-5 py-2 flex items-center gap-3 shrink-0 shadow-[0_10px_28px_rgba(14,23,71,0.05)] transition-all hover:-translate-y-0.5 cursor-pointer text-left"
                      >
                        <MerchantLogo merchantId={item.merchantId} size="md" />
                        <div>
                          <p className="text-xs font-bold text-[#0E1747] whitespace-nowrap">
                            {item.name}
                          </p>
                          <p className="text-xs text-[#8C96AE] tabular-nums whitespace-nowrap mt-0.5">
                            {formatCurrency(item.defaultAmount)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Soft White Rounded Top Sheet for Transactions (Matches jkhb.png) */}
                <section className="bg-white rounded-[34px] shadow-[0_14px_42px_rgba(14,23,71,0.05)] px-6 pt-4 pb-6">
                  <div className="w-10 h-1 bg-[#D6DCE8] rounded-full mx-auto mb-5" />

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium text-[#8C96AE]">
                      Recent Transactions
                    </span>
                    <button
                      type="button"
                      onClick={() => handleNavigate('history')}
                      className="text-xs font-semibold text-[#0E1747] hover:underline cursor-pointer"
                    >
                      View all ({transactions.length})
                    </button>
                  </div>

                  <div className="space-y-6">
                    {recentGrouped.map((group) => (
                      <div key={group.dateLabel}>
                        <div className="flex items-center justify-between pb-2.5 mb-1">
                          <span className="text-sm font-medium text-[#8C96AE]">
                            {group.dateLabel}
                          </span>
                          <span
                            className={`text-sm font-medium tabular-nums ${
                              group.netTotal > 0 ? 'text-emerald-600' : 'text-[#8C96AE]'
                            }`}
                          >
                            {formatSignedCurrency(group.netTotal)}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {group.items.map((tx) => {
                            const isSelected = selectedTx?.id === tx.id;
                            return (
                              <button
                                key={tx.id}
                                type="button"
                                onClick={() => handleSelectTransaction(tx)}
                                className={`w-full py-3 px-3 -mx-3 rounded-2xl flex items-center justify-between gap-3 transition-colors text-left cursor-pointer group ${
                                  isSelected ? 'bg-[#F4F6FC]' : 'hover:bg-[#F7F9FE]'
                                }`}
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <MerchantLogo merchantId={tx.merchantId} size="md" />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[15px] font-semibold text-[#0E1747] truncate">
                                        {tx.merchantName}
                                      </span>
                                      <span className="w-4 h-4 rounded-full bg-[#B7C0D6]/45 text-[#7C869E] flex items-center justify-center shrink-0">
                                        <Info className="w-2.5 h-2.5" />
                                      </span>
                                    </div>
                                    <p className="text-xs text-[#8C96AE] truncate mt-0.5">
                                      {tx.channel}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <p
                                    className={`text-[15px] font-bold tabular-nums ${
                                      tx.amount > 0 ? 'text-emerald-600' : 'text-[#0E1747]'
                                    }`}
                                  >
                                    {formatSignedCurrency(tx.amount)}
                                  </p>
                                  <p className="text-[11px] text-[#8C96AE] tabular-nums mt-0.5">
                                    {tx.timeLabel}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right Column on Desktop: Merchant Analytics Panel */}
              <div className="hidden xl:block xl:col-span-5 sticky top-6">
                <MerchantDetailPanel
                  merchantId={activeMerchantId}
                  selectedTransaction={selectedTx}
                  allTransactions={transactions}
                  onRepeatPayment={handleQuickPayClick}
                  onReportIssue={handleReportTransaction}
                />
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-7">
                <HistoryView
                  transactions={transactions}
                  onSelectTransaction={handleSelectTransaction}
                  runWithLoader={runWithLoader}
                />
              </div>
              <div className="hidden xl:block xl:col-span-5 sticky top-6">
                <MerchantDetailPanel
                  merchantId={activeMerchantId}
                  selectedTransaction={selectedTx}
                  allTransactions={transactions}
                  onRepeatPayment={handleQuickPayClick}
                  onReportIssue={handleReportTransaction}
                />
              </div>
            </div>
          )}

          {activeTab === 'transfers' && (
            <TransfersView
              user={user}
              initialMerchantId={prefillMerchant}
              initialAmount={prefillAmount}
              onExecuteTransfer={onExecuteTransfer}
              runWithLoader={runWithLoader}
            />
          )}

          {activeTab === 'chat' && (
            <ChatSupportView
              user={user}
              messages={chatMessages}
              onSendMessage={onSendChatMessage}
            />
          )}

          {activeTab === 'more' && (
            <MoreProfileView
              user={user}
              cards={cards}
              onToggleCardFreeze={onToggleCardFreeze}
              onSignOut={onSignOut}
              runWithLoader={runWithLoader}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar — Exact match to jkhb.png (Main, Transfers, Chat, More with badge 2) */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md shadow-[0_-8px_28px_rgba(14,23,71,0.06)] rounded-t-3xl"
      >
        <div className="grid grid-cols-4 h-16 items-center px-2">
          <button
            type="button"
            onClick={() => handleNavigate('main')}
            className={`h-full flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'main' || activeTab === 'history'
                ? 'text-[#D91E2A]'
                : 'text-[#9CA5BA]'
            }`}
          >
            <img
              src={BANK_LOGOS.usBankSymbol}
              alt="Main"
              referrerPolicy="no-referrer"
              className="w-5 h-5 object-contain"
            />
            <span className="text-[11px] font-semibold tracking-tight">Main</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate('transfers')}
            className={`h-full flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'transfers' ? 'text-[#0E1747]' : 'text-[#9CA5BA]'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-[11px] font-semibold tracking-tight">Transfers</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate('chat')}
            className={`h-full flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'chat' ? 'text-[#0E1747]' : 'text-[#9CA5BA]'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[11px] font-semibold tracking-tight">Chat</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate('more')}
            className={`h-full flex flex-col items-center justify-center gap-1 cursor-pointer relative ${
              activeTab === 'more' ? 'text-[#0E1747]' : 'text-[#9CA5BA]'
            }`}
          >
            <div className="relative">
              <MoreHorizontal className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-[#D91E2A] text-white text-[9px] font-bold flex items-center justify-center">
                2
              </span>
            </div>
            <span className="text-[11px] font-semibold tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile / Tablet Slide-Over Merchant Detail Modal */}
      {mobileDetailOpen && (
        <div className="xl:hidden fixed inset-0 z-50 bg-[#0E1747]/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-[32px] sm:rounded-[32px]">
            <MerchantDetailPanel
              merchantId={activeMerchantId}
              selectedTransaction={selectedTx}
              allTransactions={transactions}
              onClose={() => setMobileDetailOpen(false)}
              onRepeatPayment={handleQuickPayClick}
              onReportIssue={handleReportTransaction}
            />
          </div>
        </div>
      )}

      {/* Add Virtual Card Modal */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 bg-[#0E1747]/35 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-[0_24px_60px_rgba(14,23,71,0.18)]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold text-[#0E1747]">
                Create Virtual Card
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCardModal(false)}
                aria-label="Close modal"
                className="w-9 h-9 rounded-full hover:bg-[#F4F6FC] flex items-center justify-center text-[#7C869E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4B5572] mb-1.5">
                  Card Nickname
                </label>
                <input
                  type="text"
                  required
                  value={newCardLabel}
                  onChange={(e) => setNewCardLabel(e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl bg-[#F5F7FC] text-sm text-[#0E1747] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/15"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B5572] mb-1.5">
                  Card Network
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['mastercard', 'visa'] as const).map((net) => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setNewCardNetwork(net)}
                      className={`h-11 rounded-2xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                        newCardNetwork === net
                          ? 'bg-[#0B1547] text-white shadow-sm'
                          : 'bg-[#F5F7FC] text-[#0E1747]'
                      }`}
                    >
                      {net}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-2xl bg-[#0B1547] hover:bg-[#162261] text-white text-sm font-semibold shadow-[0_12px_28px_rgba(11,21,71,0.2)] transition-all cursor-pointer"
              >
                Issue Virtual Card
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
