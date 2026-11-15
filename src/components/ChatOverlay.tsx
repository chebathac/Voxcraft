import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../game/types';
import { MessageSquare, Send, X } from 'lucide-react';

interface ChatOverlayProps {
  messages: ChatMessage[];
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  onSendMessage: (text: string) => void;
  onExecuteCommand: (cmd: string) => void;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  messages,
  isOpen,
  onToggle,
  onSendMessage,
  onExecuteCommand,
}) => {
  const [inputText, setInputText] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) {
      onToggle(false);
      return;
    }

    if (text.startsWith('/')) {
      onExecuteCommand(text);
    } else {
      onSendMessage(text);
    }

    setInputText('');
    onToggle(false);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="pointer-events-auto absolute top-[154px] left-2 sm:top-28 sm:left-4 z-30 flex flex-col w-72 sm:w-80 max-w-[calc(100vw-1rem)] select-none font-mono"
    >
      {/* Messages Window */}
      <div
        className={`flex flex-col gap-1 overflow-y-auto rounded-lg p-2 sm:p-2.5 transition-opacity duration-300 text-[11px] sm:text-xs ${
          isOpen || isHovered
            ? 'max-h-40 sm:max-h-48 bg-neutral-950/85 border border-neutral-800 backdrop-blur-sm opacity-100 shadow-xl'
            : 'max-h-20 sm:max-h-40 bg-black/30 opacity-80'
        }`}
      >
        {messages
          .slice(-15)
          .filter((msg, index, arr) => arr.findIndex((m) => m.id === msg.id) === index)
          .map((msg) => (
            <div key={msg.id} className="leading-relaxed drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              {msg.isSystem ? (
                <span className="text-amber-400 font-semibold">[Server] {msg.text}</span>
              ) : (
                <span>
                  <span className="font-bold text-cyan-400">&lt;{msg.sender}&gt;</span>{' '}
                  <span className="text-white">{msg.text}</span>
                </span>
              )}
            </div>
          ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field when opened */}
      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type message or /command..."
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-900/95 px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none shadow-lg"
          />
          <button
            type="submit"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500 text-black hover:bg-amber-400 active:scale-95 transition-transform"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onToggle(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </form>
      )}

      {/* Quick Commands Bar (when open) */}
      {isOpen && (
        <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
          {['/spawn', '/fly', '/topview', '/summon creeper', '/time day', '/time night'].map((cmd) => (
            <button
              key={cmd}
              onClick={() => {
                onExecuteCommand(cmd);
                onToggle(false);
              }}
              className="rounded bg-neutral-800/80 px-2 py-0.5 text-neutral-300 hover:bg-amber-500/20 hover:text-amber-300 transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
