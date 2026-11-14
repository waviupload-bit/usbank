import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BANK_LOGOS } from '../data/bankData';

interface ActionLoaderProps {
  visible: boolean;
  label?: string;
}

export const ActionLoader: React.FC<ActionLoaderProps> = ({
  visible,
  label = 'Processing...',
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[70] bg-[#0E1747]/20 backdrop-blur-[3px] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white/95 backdrop-blur-md rounded-3xl px-7 py-6 shadow-[0_24px_60px_rgba(14,23,71,0.18)] flex flex-col items-center gap-3.5 min-w-[220px]"
          >
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[3px] border-[#E6EAF4]" />
              <div className="absolute inset-0 rounded-full border-[3px] border-t-[#0E1747] border-r-[#D91E2A] border-b-transparent border-l-transparent animate-spin" />
              <img
                src={BANK_LOGOS.usBankSymbol}
                alt="Loading"
                referrerPolicy="no-referrer"
                className="w-5 h-5 object-contain"
              />
            </div>
            <p className="font-display text-xs font-semibold text-[#0E1747] text-center">
              {label}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const InlineSpinner: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <span
    aria-hidden="true"
    className={`inline-block rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
  />
);
