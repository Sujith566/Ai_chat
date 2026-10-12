import React, { useState } from 'react';
import { User, Bot, Copy, Check, Terminal, Sparkles } from 'lucide-react';

// Formats message markdown text including code blocks, bold, lists, and headings
function FormattedContent({ content, isStreaming }) {
  if (!content) return null;

  // Split by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-relaxed text-[15px]">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Extract code language and content
          const match = part.match(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/);
          const language = match ? match[1] || 'plaintext' : 'plaintext';
          const code = match ? match[2] : part.slice(3, -3);

          return <CodeBlock key={index} code={code.trim()} language={language} />;
        }

        // Standard markdown blocks
        return <ParagraphBlock key={index} text={part} />;
      })}
      {isStreaming && <span className="streaming-cursor" />}
    </div>
  );
}

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-slate-700/60 bg-[#0c121e]">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800/80 border-b border-slate-700/50 text-xs text-slate-300">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-xs font-mono text-emerald-300/90 leading-normal">
        <pre className="m-0 font-mono">{code}</pre>
      </div>
    </div>
  );
}

function ParagraphBlock({ text }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Headings
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-base font-bold text-slate-100 pt-2 pb-0.5">
              {renderFormattedInline(trimmed.replace('### ', ''))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-lg font-bold text-indigo-300 pt-2 pb-1">
              {renderFormattedInline(trimmed.replace('## ', ''))}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-xl font-bold text-white pt-2 pb-1">
              {renderFormattedInline(trimmed.replace('# ', ''))}
            </h2>
          );
        }

        // Bullet lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
          const itemText = trimmed.replace(/^[-*•]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 text-slate-200 pl-2">
              <span className="text-indigo-400 mt-1.5 text-xs">●</span>
              <span className="flex-1">{renderFormattedInline(itemText)}</span>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 text-slate-200 pl-2">
              <span className="text-indigo-400 font-semibold text-xs mt-0.5">{numMatch[1]}.</span>
              <span className="flex-1">{renderFormattedInline(numMatch[2])}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="text-slate-200">
            {renderFormattedInline(line)}
          </p>
        );
      })}
    </div>
  );
}

// Render bold, code and normal spans
function renderFormattedInline(text) {
  // Bold pattern **text**
  const boldParts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return boldParts.map((chunk, i) => {
    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {chunk.slice(2, -2)}
        </strong>
      );
    }
    if (chunk.startsWith('`') && chunk.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-xs border border-slate-700/60"
        >
          {chunk.slice(1, -1)}
        </code>
      );
    }
    return chunk;
  });
}

export default function ChatMessage({ message, isStreaming }) {
  const isUser = message.role === 'user';
  const [copiedFull, setCopiedFull] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
  };

  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      className={`group flex gap-3.5 px-3 py-3 transition-colors ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Bot Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
          <Bot className="w-4 h-4" />
        </div>
      )}

      {/* Message Content Bubble */}
      <div
        className={`relative max-w-2xl sm:max-w-3xl rounded-2xl px-4 py-3 shadow-sm transition-all ${
          isUser
            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-xs'
            : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-xs'
        }`}
      >
        {/* Header / Tone & Timestamp */}
        <div className="flex items-center justify-between gap-3 mb-1 text-[11px] opacity-75">
          <div className="flex items-center gap-1.5 font-medium">
            {isUser ? (
              <span>You</span>
            ) : (
              <>
                <span className="text-indigo-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Assistant
                </span>
                {message.tone && (
                  <span className="px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40 text-[10px]">
                    {message.tone}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>{formattedTime}</span>
            <button
              onClick={handleCopyMessage}
              title="Copy message"
              className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity"
            >
              {copiedFull ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-hidden">
          <FormattedContent content={message.content} isStreaming={isStreaming} />
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-300">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
