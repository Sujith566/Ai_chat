import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import { Bot, Sparkles, Briefcase, MessageCircle, Zap } from 'lucide-react';

export default function ChatWindow({
  messages,
  isStreaming,
  streamingMessageId,
  tone,
  onSelectTone,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    // Auto scroll down smoothly on stream or new message
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center">
        <div className="max-w-xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 mx-auto flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
            <Bot className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Intelligent AI Chat Assistant
            </h2>
            <p className="text-sm text-slate-400">
              Real-time streaming assistant with dynamic tone modulation and persistent state.
            </p>
          </div>

          {/* Tone Selector Showcase Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
            <div
              onClick={() => onSelectTone('Professional')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                tone === 'Professional'
                  ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 text-indigo-400 mb-1 font-semibold text-xs">
                <Briefcase className="w-4 h-4" /> Professional
              </div>
              <p className="text-[11px] text-slate-400">
                Rigorous, formal, executive-ready formatting and deep analysis.
              </p>
            </div>

            <div
              onClick={() => onSelectTone('Casual')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                tone === 'Casual'
                  ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 text-emerald-400 mb-1 font-semibold text-xs">
                <MessageCircle className="w-4 h-4" /> Casual
              </div>
              <p className="text-[11px] text-slate-400">
                Relaxed, conversational, empathetic tone with analogies and emojis.
              </p>
            </div>

            <div
              onClick={() => onSelectTone('Concise')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                tone === 'Concise'
                  ? 'bg-amber-950/40 border-amber-500/80 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 text-amber-400 mb-1 font-semibold text-xs">
                <Zap className="w-4 h-4" /> Concise
              </div>
              <p className="text-[11px] text-slate-400">
                High-density bullet points, direct answers, zero introductions or fluff.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> SSE Streaming
            </span>
            <span>•</span>
            <span>MongoDB Conversation Store</span>
            <span>•</span>
            <span>Code Export & Copy</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 sm:px-6 py-4 space-y-2">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id || msg.timestamp}
            message={msg}
            isStreaming={isStreaming && msg.id === streamingMessageId}
          />
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
