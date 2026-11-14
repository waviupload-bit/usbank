import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import { BANK_LOGOS } from '../data/bankData';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const t1 = setTimeout(() => setProgress(48), 260);
    const t2 = setTimeout(() => setProgress(82), 720);
    const t3 = setTimeout(() => setProgress(100), 1150);
    const t4 = setTimeout(() => onComplete(), 1550);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className="min-h-screen w-full bg-[#091034] text-white flex flex-col items-center justify-between px-6 py-12 relative overflow-hidden">
      {/* Subtle architectural grid aura */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 38%, rgba(34, 48, 123, 0.9) 0%, rgba(9, 16, 52, 0) 62%)',
        }}
      />

      <div className="w-full max-w-md flex items-center justify-center pt-4 relative z-10">
        <span className="text-xs font-medium tracking-wide text-slate-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-white/80" />
          Encrypted Session Initialization
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center text-center max-w-sm w-full"
      >
        <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-black/40 mb-8 w-44 h-44 flex items-center justify-center border border-white/10">
          <img
            src={BANK_LOGOS.usBankStacked}
            alt="U.S. Bank"
            referrerPolicy="no-referrer"
            className="w-32 h-32 object-contain"
          />
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          U.S. Bank Digital
        </h1>
        <p className="text-sm text-slate-300 mb-8">
          Personal Checking, Cards &amp; Treasury Services
        </p>

        {/* Progress Bar */}
        <div className="w-full max-w-[260px]">
          <div className="h-1.5 w-full bg-white/15 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#D91E2A] via-white to-white rounded-full"
              initial={{ width: '10%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 tabular-nums">
            <span>Verifying portal integrity</span>
            <span>{progress}%</span>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onComplete}
          className="text-xs font-medium text-slate-300 hover:text-white underline underline-offset-4 transition-colors py-2 px-4"
        >
          Skip loading
        </button>
        <p className="text-xs text-slate-400">
          Member FDIC · Equal Housing Lender
        </p>
      </div>
    </div>
  );
};
