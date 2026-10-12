import React, { useState } from 'react';
import { Menu, Download, Database, CheckCircle2, AlertCircle, FileText, FileCode } from 'lucide-react';
import ToneToggle from './ToneToggle';

export default function Header({
  title,
  tone,
  onToneChange,
  isStreaming,
  onOpenSidebar,
  mongoConnected,
  messages,
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Export current conversation to Markdown
  const exportToMarkdown = () => {
    if (!messages || messages.length === 0) return;
    let md = `# ${title || 'AI Chat Assistant Conversation'}\n\n`;
    md += `*Exported on: ${new Date().toLocaleString()}*  \n`;
    md += `*Tone Setting: ${tone}*\n\n---\n\n`;

    messages.forEach((m) => {
      const speaker = m.role === 'user' ? '👤 User' : `🤖 AI (${m.tone || tone})`;
      md += `### ${speaker}  \n*${new Date(m.timestamp).toLocaleTimeString()}*\n\n${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(title || 'chat').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.md`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Export current conversation to JSON
  const exportToJSON = () => {
    if (!messages || messages.length === 0) return;
    const data = {
      title,
      tone,
      exportedAt: new Date().toISOString(),
      messages,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(title || 'chat').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0b0f19]/90 backdrop-blur px-4 flex items-center justify-between gap-3 relative z-20">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          title="Open conversation history"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-slate-100 text-sm truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {title || 'New Conversation'}
            </h2>
            {/* Database indicator */}
            <span
              title={mongoConnected ? 'MongoDB Persisted' : 'Persistent Storage Active'}
              className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300"
            >
              <Database className="w-2.5 h-2.5 text-indigo-400" />
              {mongoConnected ? 'MongoDB' : 'Local Persistence'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            {isStreaming ? 'Streaming response in real-time...' : 'Interactive AI Session'}
          </p>
        </div>
      </div>

      {/* Tone Toggle & Export Feature */}
      <div className="flex items-center gap-2">
        <ToneToggle
          selectedTone={tone}
          onSelectTone={onToneChange}
          disabled={isStreaming}
        />

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={!messages || messages.length === 0}
            title="Export Conversation"
            className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Download className="w-4 h-4" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1 text-xs text-slate-300 z-50">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Export Transcript
              </div>
              <button
                onClick={exportToMarkdown}
                className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center gap-2 text-slate-200 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Download Markdown (.md)</span>
              </button>
              <button
                onClick={exportToJSON}
                className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center gap-2 text-slate-200 transition-colors"
              >
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download JSON (.json)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
