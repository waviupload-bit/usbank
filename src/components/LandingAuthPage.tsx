import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { BANK_LOGOS } from '../data/bankData';
import { UserProfile } from '../types/bank';
import { ActionLoader, InlineSpinner } from './ActionLoader';

interface LandingAuthPageProps {
  registeredUsers: UserProfile[];
  onAuthenticated: (user: UserProfile) => void;
  onRegisterUser: (newUser: UserProfile) => void;
}

export const LandingAuthPage: React.FC<LandingAuthPageProps> = ({
  registeredUsers,
  onAuthenticated,
  onRegisterUser,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [signInStep, setSignInStep] = useState<'credentials' | 'code'>('credentials');
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);

  // Sign-In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [codeDigits, setCodeDigits] = useState(['', '', '', '']);
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState('');

  // Sign-Up state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpAddress, setSignUpAddress] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpCode, setSignUpCode] = useState('');
  const [signUpAccountType, setSignUpAccountType] = useState<'Checking' | 'Savings'>('Checking');

  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoadingLabel('Verifying credentials...');

    setTimeout(() => {
      const normalizedEmail = email.trim().toLowerCase();
      const matched = registeredUsers.find(
        (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
      );

      setLoadingLabel(null);
      if (!matched) {
        setAuthError('Invalid email/username or password. Please verify your U.S. Bank credentials.');
        return;
      }

      setPendingUser(matched);
      setSignInStep('code');
      setCodeDigits(['', '', '', '']);
      setTimeout(() => codeInputRefs.current[0]?.focus(), 80);
    }, 550);
  };

  const handleCodeDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...codeDigits];
    next[index] = clean;
    setCodeDigits(next);
    setAuthError('');

    if (clean && index < 3) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      e.preventDefault();
      setCodeDigits(pasted.split(''));
      codeInputRefs.current[3]?.focus();
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;

    const enteredCode = codeDigits.join('');
    if (enteredCode.length < 4) {
      setAuthError('Enter all 4 digits of your security verification code.');
      return;
    }

    setLoadingLabel('Validating 4-digit security code...');
    setTimeout(() => {
      if (enteredCode !== pendingUser.securityCode) {
        setLoadingLabel(null);
        setAuthError('Incorrect 4-digit security code. Please check your code and try again.');
        return;
      }

      setLoadingLabel('Opening your U.S. Bank wallet...');
      setTimeout(() => {
        setLoadingLabel(null);
        onAuthenticated(pendingUser);
      }, 450);
    }, 550);
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const trimmedEmail = signUpEmail.trim().toLowerCase();
    if (!signUpName.trim() || !trimmedEmail || !signUpPassword || signUpCode.length !== 4) {
      setAuthError('Please complete all required fields including a 4-digit security code.');
      return;
    }

    if (registeredUsers.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      setAuthError('An account with this email already exists. Please sign in instead.');
      return;
    }

    setLoadingLabel('Enrolling your U.S. Bank profile...');
    setTimeout(() => {
      const randomAcc = `1918${Math.floor(10000000 + Math.random() * 89999999)}`;
      const newUser: UserProfile = {
        id: `usr-${Date.now()}`,
        fullName: signUpName.trim(),
        email: trimmedEmail,
        password: signUpPassword,
        securityCode: signUpCode,
        routingNumber: '082000549',
        accountNumber: randomAcc,
        accountType: signUpAccountType,
        address: signUpAddress.trim() || 'FRESNO, CA 93744',
        phone: signUpPhone.trim() || '+1 559-010-0000',
        dateOfBirth: '01-01-1985',
        availableBalance: 25000.0,
        creditBalance: 0,
        creditLimit: 10000.0,
      };

      setLoadingLabel(null);
      onRegisterUser(newUser);
      onAuthenticated(newUser);
    }, 700);
  };

  const isBusy = Boolean(loadingLabel);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F1F4FA] to-[#E8ECF6] text-[#0E1747] flex flex-col justify-between px-4 py-8 sm:px-6">
      <ActionLoader visible={isBusy} label={loadingLabel ?? ''} />

      {/* Minimal Brand Header */}
      <header className="w-full max-w-md mx-auto flex items-center justify-center pt-2">
        <img
          src={BANK_LOGOS.usBankHorizontal}
          alt="U.S. Bank"
          referrerPolicy="no-referrer"
          className="h-8 w-auto object-contain"
        />
      </header>

      {/* Soft Sign In / Sign Up Card */}
      <main className="w-full max-w-md mx-auto my-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/95 backdrop-blur-md rounded-[32px] p-6 sm:p-8 shadow-[0_22px_60px_rgba(14,23,71,0.08)]"
        >
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#F4F6FC] flex items-center justify-center p-2 shadow-inner shrink-0">
              <img
                src={BANK_LOGOS.usBankStacked}
                alt="U.S. Bank"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-[#0E1747]">
                {authMode === 'signin'
                  ? signInStep === 'credentials'
                    ? 'Sign in to U.S. Bank'
                    : 'Security Verification'
                  : 'Create Online Account'}
              </h1>
              <p className="text-xs text-[#8892AA] mt-0.5">
                {authMode === 'signin'
                  ? signInStep === 'credentials'
                    ? 'Access your personal checking & cards'
                    : `Enter the 4-digit code for ${pendingUser?.email}`
                  : 'Enroll in U.S. Bank Digital Banking'}
              </p>
            </div>
          </div>

          {/* Soft Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1.5 bg-[#F1F4FA] rounded-2xl mb-6">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => {
                setAuthMode('signin');
                setSignInStep('credentials');
                setAuthError('');
              }}
              className={`py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-white text-[#0E1747] shadow-[0_4px_14px_rgba(14,23,71,0.06)]'
                  : 'text-[#7C869E] hover:text-[#0E1747]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => {
                setAuthMode('signup');
                setAuthError('');
              }}
              className={`py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-white text-[#0E1747] shadow-[0_4px_14px_rgba(14,23,71,0.06)]'
                  : 'text-[#7C869E] hover:text-[#0E1747]'
              }`}
            >
              Sign Up
            </button>
          </div>

          {authError && (
            <div
              role="alert"
              className="mb-5 px-4 py-3 rounded-2xl bg-red-50/90 text-xs font-medium text-[#B91621]"
            >
              {authError}
            </div>
          )}

          {authMode === 'signin' && signInStep === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="signin-email"
                  className="block text-xs font-semibold text-[#4B5572] mb-1.5"
                >
                  Email or Username
                </label>
                <input
                  id="signin-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-12 px-4 rounded-2xl bg-[#F5F7FC] text-sm text-[#0E1747] placeholder:text-[#9CA5BA] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/15 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="signin-password"
                  className="block text-xs font-semibold text-[#4B5572] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-12 pl-4 pr-11 rounded-2xl bg-[#F5F7FC] text-sm text-[#0E1747] placeholder:text-[#9CA5BA] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/15 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#7C869E] hover:text-[#0E1747] cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="w-full h-12 mt-2 rounded-2xl bg-[#0B1547] hover:bg-[#162261] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_12px_28px_rgba(11,21,71,0.22)] transition-all cursor-pointer disabled:opacity-70"
              >
                {isBusy ? <InlineSpinner /> : <Lock className="w-4 h-4" />}
                Continue
              </button>
            </form>
          )}

          {authMode === 'signin' && signInStep === 'code' && (
            <form onSubmit={handleCodeSubmit} className="space-y-5">
              <div className="p-4 rounded-2xl bg-[#F4F6FC]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#0E1747] mb-1">
                  <KeyRound className="w-4 h-4 text-[#D91E2A]" />
                  4-Digit Security Code Required
                </div>
                <p className="text-xs text-[#6E7894] leading-relaxed">
                  Verify identity for <span className="font-semibold">{pendingUser?.fullName}</span>{' '}
                  ({pendingUser?.accountType} ••{pendingUser?.accountNumber.slice(-4)}).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B5572] mb-2">
                  Security Code
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {codeDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        codeInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                      onPaste={handleCodePaste}
                      aria-label={`Security code digit ${idx + 1}`}
                      className="h-14 text-center font-mono text-xl font-bold rounded-2xl bg-[#F5F7FC] text-[#0E1747] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/20 focus:bg-white transition-all tabular-nums"
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full h-12 rounded-2xl bg-[#0B1547] hover:bg-[#162261] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_12px_28px_rgba(11,21,71,0.22)] transition-all cursor-pointer disabled:opacity-70"
                >
                  {isBusy ? <InlineSpinner /> : null}
                  Verify &amp; Sign In
                  {!isBusy && <ArrowRight className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => {
                    setSignInStep('credentials');
                    setAuthError('');
                  }}
                  className="w-full py-2.5 text-xs font-semibold text-[#7C869E] hover:text-[#0E1747] transition-colors cursor-pointer"
                >
                  Back to credentials
                </button>
              </div>
            </form>
          )}

          {authMode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#4B5572] mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  placeholder="Full name"
                  className="w-full h-11 px-4 rounded-2xl bg-[#F5F7FC] text-sm text-[#0E1747] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/15 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4B5572] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full h-11 px-4 rounded-2xl bg-[#F5F7FC] text-sm text-[#0E1747] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/15 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4B5572] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value)}
                    placeholder="+1 555-010-2000"
                    className="w-full h-11 px-4 rounded-2xl bg-[#F5F7FC] text-sm text-[#0E1747] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/15 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B5572] mb-1">
                  Mailing Address
                </label>
                <input
                  type="text"
                  value={signUpAddress}
                  onChange={(e) => setSignUpAddress(e.target.value)}
                  placeholder="Street or PO Box, City, State, ZIP"
                  className="w-full h-11 px-4 rounded-2xl bg-[#F5F7FC] text-sm text-[#0E1747] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/15 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4B5572] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Create password"
                    className="w-full h-11 px-4 rounded-2xl bg-[#F5F7FC] text-sm text-[#0E1747] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/15 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4B5572] mb-1">
                    4-Digit Security Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={4}
                    value={signUpCode}
                    onChange={(e) =>
                      setSignUpCode(e.target.value.replace(/\D/g, '').slice(0, 4))
                    }
                    placeholder="4 digits"
                    className="w-full h-11 px-4 rounded-2xl bg-[#F5F7FC] text-sm font-mono text-[#0E1747] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/15 focus:bg-white tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B5572] mb-1">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Checking', 'Savings'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSignUpAccountType(t)}
                      className={`h-10 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                        signUpAccountType === t
                          ? 'bg-[#0B1547] text-white shadow-sm'
                          : 'bg-[#F5F7FC] text-[#58627E] hover:text-[#0E1747]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="w-full h-12 mt-1 rounded-2xl bg-[#0B1547] hover:bg-[#162261] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_12px_28px_rgba(11,21,71,0.22)] transition-all cursor-pointer"
              >
                {isBusy && <InlineSpinner />}
                Create Account
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-[#8892AA]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0B1547]" />
              256-bit TLS Protection
            </span>
            <span>Member FDIC</span>
          </div>
        </motion.div>
      </main>

      {/* Quiet Footer */}
      <footer className="w-full max-w-md mx-auto text-center pb-2">
        <p className="text-xs text-[#8892AA]">
          U.S. Bank National Association · Equal Housing Lender
        </p>
      </footer>
    </div>
  );
};
