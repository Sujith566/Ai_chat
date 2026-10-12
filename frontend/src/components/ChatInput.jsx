import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  'Explain Event-Driven architecture vs Request-Response',
  'Write a Python script for character-by-character streaming',
  'What are the key trade-offs between MongoDB and PostgreSQL?',
];

export default function ChatInput({ onSendMessage, onStopStream, isStreaming, currentTone }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (isStreaming) return;
    if (!input.trim()) return;

    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    // Auto resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleSelectSuggestion = (text) => {
    setInput(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="p-4 border-t border-slate-800/80 bg-[#090d16]/95 backdrop-blur">
      <div className="max-w-3xl mx-auto space-y-2.5">
        {/* Suggestion Starter Pills (shown when input is empty and not streaming) */}
        {!input && !isStreaming && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-slate-500 flex items-center gap-1 flex-shrink-0 text-[11px]">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Suggestions:
            </span>
            {SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="flex-shrink-0 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="relative rounded-2xl bg-slate-900/90 border border-slate-800 focus-within:border-indigo-500/70 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all shadow-lg"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={`Ask anything in ${currentTone} tone... (Press Enter to send, Shift+Enter for newline)`}
            className="w-full bg-transparent px-4 py-3.5 pr-24 text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none max-h-48 overflow-y-auto"
          />

          <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStream}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-medium transition-all shadow-sm active:scale-95"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all shadow-md shadow-indigo-600/20 active:scale-95 disabled:cursor-not-allowed"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span>AI outputs reflect current system tone: <strong className="text-indigo-400">{currentTone}</strong></span>
          <span className="hidden sm:inline">Character-by-character real-time streaming</span>
        </div>
      </div>
    </div>
  );
}
