import React from 'react';
import { Layout, Check } from 'lucide-react';

export interface TemplateOption {
  id: string;
  name: string;
  description: string;
  supportsPhoto: boolean;
  accentPreview: string;
}

export const TEMPLATES: TemplateOption[] = [
  {
    id: 'classic-ats',
    name: 'Classic ATS',
    description: 'Single-column, zero-risk formatting engineered for 100% parser compatibility.',
    supportsPhoto: false,
    accentPreview: '#1E293B',
  },
  {
    id: 'modern-two-col',
    name: 'Modern Two-Column',
    description: 'Distinctive left sidebar with profile photo, skills tags, and prominent hierarchy.',
    supportsPhoto: true,
    accentPreview: '#6542C5',
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    description: 'Understated elegance, generous negative space, and refined typography.',
    supportsPhoto: false,
    accentPreview: '#475569',
  },
  {
    id: 'creative-accent',
    name: 'Creative Accent',
    description: 'Vibrant top banner block with custom accent tints and tag badges.',
    supportsPhoto: true,
    accentPreview: '#0284C7',
  },
  {
    id: 'executive',
    name: 'Executive Board',
    description: 'Authoritative serif typography and structured boxed header for leadership roles.',
    supportsPhoto: false,
    accentPreview: '#0F172A',
  },
  {
    id: 'compact',
    name: 'Compact One-Page',
    description: 'High-density spatial budget designed to condense exhaustive careers onto 1 page.',
    supportsPhoto: false,
    accentPreview: '#16A34A',
  },
];

interface TemplateSelectorProps {
  selectedTemplate: string;
  accentColor?: string;
  onSelectTemplate: (templateId: string) => void;
  onSelectColor: (color: string) => void;
}

const PRESET_ACCENTS = [
  '#6542C5', // Iris primary
  '#2563EB', // Royal Blue
  '#059669', // Emerald
  '#DC2626', // Crimson
  '#D97706', // Amber
  '#0F172A', // Slate Black
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  accentColor = '#6542C5',
  onSelectTemplate,
  onSelectColor,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
          <Layout size={14} /> Resume Template ({TEMPLATES.length} Designs)
        </label>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-zinc-500 mr-1 font-medium">Accent:</span>
          {PRESET_ACCENTS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onSelectColor(color)}
              className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
              style={{
                backgroundColor: color,
                borderColor: accentColor === color ? '#ffffff' : 'transparent',
                outline: accentColor === color ? `2px solid ${color}` : 'none',
              }}
            >
              {accentColor === color && <Check size={10} className="text-white" />}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {TEMPLATES.map((tpl) => {
          const isSelected = selectedTemplate === tpl.id;
          return (
            <div
              key={tpl.id}
              onClick={() => onSelectTemplate(tpl.id)}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#6542C5] bg-[#6542C5]/5 dark:bg-[#6542C5]/10 shadow-xs ring-1 ring-[#6542C5]'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{tpl.name}</span>
                {isSelected && <span className="w-2 h-2 rounded-full bg-[#6542C5]" />}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-snug">{tpl.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full border border-zinc-200"
                  style={{ backgroundColor: tpl.accentPreview }}
                />
                {tpl.supportsPhoto && (
                  <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded font-medium">
                    Photo
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

