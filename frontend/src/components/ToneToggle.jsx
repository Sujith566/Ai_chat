import React from 'react';
import { Briefcase, MessageCircle, Zap } from 'lucide-react';

export const TONES = [
  {
    id: 'Professional',
    label: 'Professional',
    icon: Briefcase,
    color: 'from-blue-500 to-indigo-600',
    activeBg: 'bg-indigo-600 text-white shadow-indigo-500/25',
    desc: 'Articulate, executive & formal',
  },
  {
    id: 'Casual',
    label: 'Casual',
    icon: MessageCircle,
    color: 'from-emerald-500 to-teal-600',
    activeBg: 'bg-emerald-600 text-white shadow-emerald-500/25',
    desc: 'Friendly, warm & conversational',
  },
  {
    id: 'Concise',
    label: 'Concise',
    icon: Zap,
    color: 'from-amber-500 to-orange-600',
    activeBg: 'bg-amber-600 text-white shadow-amber-500/25',
    desc: 'Direct, brief & zero-fluff',
  },
];

export default function ToneToggle({ selectedTone, onSelectTone, disabled }) {
  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl">
      <span className="text-xs font-semibold text-slate-400 px-2 uppercase tracking-wider hidden sm:inline-block">
        Tone:
      </span>
      {TONES.map((tone) => {
        const Icon = tone.icon;
        const isSelected = selectedTone === tone.id;
        return (
          <button
            key={tone.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectTone(tone.id)}
            title={tone.desc}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              isSelected
                ? `${tone.activeBg} shadow-md`
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
            <span>{tone.label}</span>
          </button>
        );
      })}
    </div>
  );
}
