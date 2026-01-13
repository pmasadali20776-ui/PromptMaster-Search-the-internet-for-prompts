
import React, { useState, useRef, useEffect } from 'react';
import { ImagePrompt, GroundingSource, GeneratedImage, ThemeMode } from '../types';
import { GeminiService } from '../services/gemini';

interface PromptFinderProps {
  theme: ThemeMode;
  prompts: ImagePrompt[];
  sources: GroundingSource[];
  gemini: GeminiService;
  onOpenInStudio: (img: GeneratedImage) => void;
}

const PromptFinder: React.FC<PromptFinderProps> = ({ theme, prompts, sources, gemini, onOpenInStudio }) => {
  return (
    <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center justify-between px-2">
        <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme === 'bright' ? 'text-slate-400' : 'text-slate-500'}`}>
          Neural Findings ({prompts.length})
        </h3>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping`}></span>
          <span className="text-[9px] font-bold uppercase tracking-widest opacity-50 italic">Crawl Verified</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {prompts.map((p, idx) => (
          <PromptCard key={idx} theme={theme} prompt={p} gemini={gemini} onOpenInStudio={onOpenInStudio} />
        ))}
      </div>

      {sources.length > 0 && (
        <div className={`mt-16 pt-12 border-t ${theme === 'bright' ? 'border-slate-200' : 'border-white/5'}`}>
          <div className="flex items-center gap-3 mb-6 opacity-60">
            <i className="fa-solid fa-shield-halved text-xs"></i>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Source Metadata & Citations</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {sources.map((s, idx) => (
              <a 
                key={idx} 
                href={s.uri} 
                target="_blank" 
                rel="noreferrer"
                className={`text-[9px] font-bold px-5 py-3 rounded-full border transition-all flex items-center gap-3 ${theme === 'bright' ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:border-indigo-200' : 'bg-slate-900 border-white/5 hover:bg-slate-800 text-slate-400 hover:text-indigo-400'}`}
              >
                <i className="fa-solid fa-arrow-up-right-from-square opacity-50"></i> {s.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PromptCard: React.FC<{ theme: ThemeMode; prompt: ImagePrompt; gemini: GeminiService; onOpenInStudio: (img: GeneratedImage) => void }> = ({ theme, prompt, gemini, onOpenInStudio }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.prompt);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const base64 = await gemini.generateStudioImage(prompt.prompt);
      setGeneratedImage(base64);
      
      // Scroll card into view if it was pushed off screen by the image
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 300);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const cardBg = theme === 'bright' ? 'bg-white border-slate-200 shadow-xl' : 'bg-slate-900/60 border-white/5 shadow-2xl';

  return (
    <div ref={cardRef} className={`group rounded-[3rem] border p-8 md:p-12 transition-all hover:border-indigo-500/30 ${cardBg}`}>
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-3 flex-1">
            <h4 className={`text-2xl md:text-3xl font-black tracking-tighter italic ${theme === 'bright' ? 'text-slate-900' : 'text-white'}`}>
              {prompt.title}
            </h4>
            <div className="flex flex-wrap gap-2">
              {prompt.tags?.map(tag => (
                <span key={tag} className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${theme === 'bright' ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400'}`}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <button 
            onClick={handleCopy}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-90 ${theme === 'bright' ? 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-indigo-600' : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'}`}
            title="Copy Prompt"
          >
            {copying ? <i className="fa-solid fa-check text-green-500"></i> : <i className="fa-regular fa-clone"></i>}
          </button>
        </div>

        <div className={`rounded-3xl p-8 relative font-mono text-sm md:text-base leading-relaxed border transition-all ${theme === 'bright' ? 'bg-slate-50 border-slate-100 text-slate-600' : 'bg-black/30 border-white/10 text-slate-300'}`}>
          <div className="absolute top-6 left-6 opacity-5">
            <i className="fa-solid fa-quote-left text-4xl"></i>
          </div>
          <p className="relative z-10 italic">"{prompt.prompt}"</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`flex-1 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95 ${theme === 'bright' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-500 hover:bg-indigo-400 text-white'}`}
          >
            {isGenerating ? <i className="fa-solid fa-dna fa-spin"></i> : <i className="fa-solid fa-bolt-lightning"></i>}
            {isGenerating ? "Synthesizing Image..." : "Visualize Prompt"}
          </button>
          
          {generatedImage && (
            <button
              onClick={() => onOpenInStudio({ url: generatedImage, base64: generatedImage, prompt: prompt.prompt })}
              className={`py-6 px-10 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-4 border ${theme === 'bright' ? 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50' : 'bg-slate-800 border-white/10 text-white hover:bg-slate-700'}`}
            >
              <i className="fa-solid fa-sliders"></i> Open Studio
            </button>
          )}
        </div>

        {generatedImage && (
          <div className="mt-6 animate-in zoom-in-95 duration-700">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 aspect-square group/img shadow-2xl">
              <img 
                src={generatedImage} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-110" 
                alt="AI Generation Preview" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity p-8 flex items-end">
                <p className="text-[10px] font-black text-white uppercase tracking-widest bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg">Studio Preview Ready</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptFinder;
