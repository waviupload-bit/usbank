import { useEffect, useState } from 'react';
import { DashboardApp } from './components/DashboardApp';
import { LandingAuthPage } from './components/LandingAuthPage';
import { SplashScreen } from './components/SplashScreen';
import {
  INITIAL_CARDS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_TRANSACTIONS,
  PRIMARY_USER,
} from './data/bankData';
import {
  BankCard,
  ChatMessage,
  MerchantId,
  PaymentChannel,
  Transaction,
  UserProfile,
} from './types/bank';
import { formatCurrency } from './utils/format';

const STORAGE_KEY = 'usbank_digital_state_v1';

interface PersistedState {
  users: UserProfile[];
  activeUserId: string | null;
  cardsByUser: Record<string, BankCard[]>;
  transactionsByUser: Record<string, Transaction[]>;
  chatByUser: Record<string, ChatMessage[]>;
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
        return {
          ...parsed,
          activeUserId: null,
        };
      }
    }
  } catch {
    // ignore storage errors
  }

  return {
    users: [PRIMARY_USER],
    activeUserId: null,
    cardsByUser: { [PRIMARY_USER.id]: INITIAL_CARDS },
    transactionsByUser: { [PRIMARY_USER.id]: INITIAL_TRANSACTIONS },
    chatByUser: { [PRIMARY_USER.id]: INITIAL_CHAT_MESSAGES },
  };
}

export default function App() {
  const [stage, setStage] = useState<'splash' | 'landing' | 'dashboard'>('splash');
  const [state, setState] = useState<PersistedState>(() => loadInitialState());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  const activeUser =
    state.users.find((u) => u.id === state.activeUserId) ?? null;

  const handleSplashComplete = () => {
    setStage('landing');
  };

  const handleAuthenticated = (user: UserProfile) => {
    setState((prev) => ({
      ...prev,
      activeUserId: user.id,
    }));
    setStage('dashboard');
  };

  const handleRegisterUser = (newUser: UserProfile) => {
    const starterCards: BankCard[] = [
      {
        id: `card-${Date.now()}-1`,
        label: `U.S. Bank ${newUser.accountType}`,
        network: 'mastercard',
        type: 'Debit Card',
        last4: newUser.accountNumber.slice(-4),
        expiry: '10/29',
        balance: newUser.availableBalance,
        variant: 'light',
        frozen: false,
      },
    ];
    const welcomeTx: Transaction[] = [
      {
        id: `tx-${Date.now()}`,
        merchantId: 'us-bank',
        merchantName: 'U.S. Bank Opening Deposit',
        category: 'Direct Deposit & Wire',
        channel: 'Direct Deposit',
        amount: newUser.availableBalance,
        dateISO: '2026-11-13',
        dateLabel: 'Today, 13 Nov',
        timeLabel: '09:00 AM',
        location: `Routing ${newUser.routingNumber}`,
        reference: 'USB-OPEN01',
        status: 'Completed',
      },
    ];

    setState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      activeUserId: newUser.id,
      cardsByUser: { ...prev.cardsByUser, [newUser.id]: starterCards },
      transactionsByUser: { ...prev.transactionsByUser, [newUser.id]: welcomeTx },
      chatByUser: {
        ...prev.chatByUser,
        [newUser.id]: [
          {
            id: `msg-${Date.now()}`,
            sender: 'agent',
            text: `Welcome to U.S. Bank, ${newUser.fullName}. Your ${newUser.accountType} account is active.`,
            timestamp: 'Just now',
          },
        ],
      },
    }));
  };

  const handleExecuteTransfer = (payload: {
    merchantId: MerchantId;
    merchantName: string;
    amount: number;
    channel: PaymentChannel;
    location: string;
    note?: string;
  }): string => {
    if (!activeUser) return '';
    const ref = `USB-${Math.floor(1000000 + Math.random() * 8999999)}`;
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      merchantId: payload.merchantId,
      merchantName: payload.merchantName,
      category: 'Transfer & Payment',
      channel: payload.channel,
      amount: payload.amount,
      dateISO: '2026-11-13',
      dateLabel: 'Today, 13 Nov',
      timeLabel: nowTime,
      location: payload.location,
      reference: ref,
      status: 'Completed',
      note: payload.note,
    };

    setState((prev) => {
      const updatedUsers = prev.users.map((u) =>
        u.id === activeUser.id
          ? {
              ...u,
              availableBalance: Number((u.availableBalance + payload.amount).toFixed(2)),
            }
          : u
      );
      const userTxs = prev.transactionsByUser[activeUser.id] ?? INITIAL_TRANSACTIONS;
      return {
        ...prev,
        users: updatedUsers,
        transactionsByUser: {
          ...prev.transactionsByUser,
          [activeUser.id]: [newTx, ...userTxs],
        },
      };
    });

    return ref;
  };

  const handleAddVirtualCard = (label: string, network: 'mastercard' | 'visa') => {
    if (!activeUser) return;
    const newCard: BankCard = {
      id: `card-${Date.now()}`,
      label,
      network,
      type: 'Virtual Card',
      last4: String(Math.floor(1000 + Math.random() * 8999)),
      expiry: '11/30',
      balance: 2500.0,
      variant: network === 'visa' ? 'navy' : 'light',
      frozen: false,
    };

    setState((prev) => {
      const current = prev.cardsByUser[activeUser.id] ?? INITIAL_CARDS;
      return {
        ...prev,
        cardsByUser: {
          ...prev.cardsByUser,
          [activeUser.id]: [...current, newCard],
        },
      };
    });
  };

  const handleToggleCardFreeze = (cardId: string) => {
    if (!activeUser) return;
    setState((prev) => {
      const current = prev.cardsByUser[activeUser.id] ?? INITIAL_CARDS;
      return {
        ...prev,
        cardsByUser: {
          ...prev.cardsByUser,
          [activeUser.id]: current.map((c) =>
            c.id === cardId ? { ...c, frozen: !c.frozen } : c
          ),
        },
      };
    });
  };

  const handleSendChatMessage = (text: string) => {
    if (!activeUser) return;
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: nowTime,
    };

    const lower = text.toLowerCase();
    let reply = `Thank you, ${activeUser.fullName}. I have logged your inquiry on ${activeUser.accountType} account ••${activeUser.accountNumber.slice(-4)}. A U.S. Bank specialist has verified your account status is active with an available balance of ${formatCurrency(activeUser.availableBalance)}.`;

    if (lower.includes('routing') || lower.includes('account')) {
      reply = `Your verified U.S. Bank ${activeUser.accountType} details:\n• Routing Number: ${activeUser.routingNumber}\n• Account Number: ${activeUser.accountNumber}\n• Mailing Address on File: ${activeUser.address}`;
    } else if (lower.includes('wire') || lower.includes('limit')) {
      reply = `Your U.S. Bank Smartly Checking account (••${activeUser.accountNumber.slice(-4)}) currently supports same-day domestic Fedwire transfers up to $100,000.00 per business day.`;
    } else if (lower.includes('travel') || lower.includes('card')) {
      reply = `Travel protection is ready for your cards ending in ${activeUser.accountNumber.slice(-4)} and 4812. You can also toggle Travel Notice or lock/unlock any card immediately under the More tab.`;
    } else if (lower.includes('apple') || lower.includes('review') || lower.includes('transaction')) {
      reply = `I have flagged that transaction reference for priority review under Zero Liability Protection. No unauthorized hold applies to your ${formatCurrency(activeUser.availableBalance)} available balance.`;
    }

    const agentMsg: ChatMessage = {
      id: `msg-a-${Date.now() + 1}`,
      sender: 'agent',
      text: reply,
      timestamp: nowTime,
    };

    setState((prev) => {
      const current = prev.chatByUser[activeUser.id] ?? INITIAL_CHAT_MESSAGES;
      return {
        ...prev,
        chatByUser: {
          ...prev.chatByUser,
          [activeUser.id]: [...current, userMsg, agentMsg],
        },
      };
    });
  };

  const handleSignOut = () => {
    setState((prev) => ({
      ...prev,
      activeUserId: null,
    }));
    setStage('landing');
  };

  if (stage === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (stage === 'landing' || !activeUser) {
    return (
      <LandingAuthPage
        registeredUsers={state.users}
        onAuthenticated={handleAuthenticated}
        onRegisterUser={handleRegisterUser}
      />
    );
  }

  return (
    <DashboardApp
      user={activeUser}
      cards={state.cardsByUser[activeUser.id] ?? INITIAL_CARDS}
      transactions={state.transactionsByUser[activeUser.id] ?? INITIAL_TRANSACTIONS}
      chatMessages={state.chatByUser[activeUser.id] ?? INITIAL_CHAT_MESSAGES}
      onExecuteTransfer={handleExecuteTransfer}
      onAddVirtualCard={handleAddVirtualCard}
      onToggleCardFreeze={handleToggleCardFreeze}
      onSendChatMessage={handleSendChatMessage}
      onSignOut={handleSignOut}
    />
  );
}
