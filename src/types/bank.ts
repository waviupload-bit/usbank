export type NavTab = 'main' | 'history' | 'transfers' | 'chat' | 'more';

export type PaymentChannel =
  | 'Debit Card'
  | 'Credit Card'
  | 'Checking ACH'
  | 'Direct Deposit'
  | 'Wire Transfer';

export type MerchantId =
  | 'uber-eats'
  | 'lyft'
  | 'apple'
  | 'bank-of-america'
  | 'amazon'
  | 'starbucks'
  | 'airbnb'
  | 'nike'
  | 'att'
  | 'network'
  | 'steam'
  | 'us-bank'
  | 'mastercard';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  password: string;
  securityCode: string;
  routingNumber: string;
  accountNumber: string;
  accountType: 'Checking' | 'Savings';
  address: string;
  phone: string;
  dateOfBirth: string;
  availableBalance: number;
  creditBalance: number;
  creditLimit: number;
}

export interface BankCard {
  id: string;
  label: string;
  network: 'mastercard' | 'visa';
  type: 'Debit Card' | 'Credit Card' | 'Virtual Card';
  last4: string;
  expiry: string;
  balance: number;
  variant: 'light' | 'navy';
  frozen: boolean;
}

export interface Transaction {
  id: string;
  merchantId: MerchantId;
  merchantName: string;
  category: string;
  channel: PaymentChannel;
  amount: number; // positive = credit/deposit, negative = debit/spend
  dateISO: string; // YYYY-MM-DD
  dateLabel: string; // e.g. "Today, 13 Nov"
  timeLabel: string; // e.g. "11:45 AM"
  location?: string;
  reference: string;
  status: 'Completed' | 'Pending';
  note?: string;
}

export interface QuickPayItem {
  id: string;
  merchantId: MerchantId;
  name: string;
  defaultAmount: number;
  accountRef: string;
}

export interface ChatMessage {
  id: string;
  sender: 'agent' | 'user';
  text: string;
  timestamp: string;
}
