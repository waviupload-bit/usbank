import React, { useState } from 'react';
import { Send, ShieldCheck } from 'lucide-react';
import { BANK_LOGOS } from '../data/bankData';
import { ChatMessage, UserProfile } from '../types/bank';
import { InlineSpinner } from './ActionLoader';

interface ChatSupportViewProps {
  user: UserProfile;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

const QUICK_PROMPTS = [
  'Confirm my routing and account numbers',
  'Request Fedwire limit review',
  'Verify recent Apple Store charge',
  'Travel notice for debit card',
];

export const ChatSupportView: React.FC<ChatSupportViewProps> = ({
  user,
  messages,
  onSendMessage,
}) => {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const sendWithLoader = (text: string) => {
    setSending(true);
    setTimeout(() => {
      onSendMessage(text);
      setSending(false);
    }, 450);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draft.trim();
    if (!cleaned || sending) return;
    setDraft('');
    sendWithLoader(cleaned);
  };

  return (
    <div className="bg-white/95 rounded-[28px] shadow-[0_14px_38px_rgba(14,23,71,0.05)] overflow-hidden flex flex-col h-[640px]">
      {/* Top Support Header */}
      <div className="px-6 py-4 bg-[#0B1547] text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/30 bg-white shrink-0">
            <img
              src={BANK_LOGOS.profileAvatar}
              alt={user.fullName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-[center_20%]"
            />
          </div>
          <div>
            <h2 className="font-display text-base font-bold">U.S. Bank Client Concierge</h2>
            <p className="text-xs text-slate-300">
              Private Checking &amp; Card Services · {user.fullName}
            </p>
          </div>
        </div>
        <span className="text-xs text-slate-300 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          Verified
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F5F7FC]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[82%] sm:max-w-[70%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#0B1547] text-white rounded-br-md shadow-[0_8px_20px_rgba(11,21,71,0.16)]'
                  : 'bg-white text-[#0E1747] rounded-bl-md shadow-[0_6px_18px_rgba(14,23,71,0.05)]'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>
              <p
                className={`text-[11px] mt-1.5 tabular-nums ${
                  msg.sender === 'user' ? 'text-slate-300' : 'text-[#8C96AE]'
                }`}
              >
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-white text-[#0E1747] rounded-3xl rounded-bl-md px-4 py-3 text-xs font-medium shadow-[0_6px_18px_rgba(14,23,71,0.05)] flex items-center gap-2">
              <InlineSpinner className="w-3.5 h-3.5 text-[#0E1747]" />
              <span>U.S. Bank specialist is responding...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts + Composer */}
      <div className="p-4 sm:p-5 bg-white space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={sending}
              onClick={() => sendWithLoader(q)}
              className="px-3.5 py-2 rounded-2xl bg-[#F4F6FC] hover:bg-[#EAEFF9] text-xs font-semibold text-[#0E1747] whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-60"
            >
              {q}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message U.S. Bank Client Support..."
            className="flex-1 h-11 px-4 rounded-2xl bg-[#F5F7FC] text-sm text-[#0E1747] placeholder:text-[#9CA5BA] focus:outline-none focus:ring-2 focus:ring-[#0E1747]/15 focus:bg-white"
          />
          <button
            type="submit"
            disabled={sending}
            aria-label="Send message"
            className="h-11 px-5 rounded-2xl bg-[#0B1547] hover:bg-[#162261] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer shrink-0 disabled:opacity-60"
          >
            {sending ? <InlineSpinner /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
