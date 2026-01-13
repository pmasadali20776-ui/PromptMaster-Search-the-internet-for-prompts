
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GeminiService } from './services/gemini';
import { ImagePrompt, GroundingSource, GeneratedImage, ConnectionStatus, ThemeMode } from './types';
import PromptFinder from './components/PromptFinder';
import ImageEditor from './components/ImageEditor';

const App: React.FC = () => {
  const [gemini] = useState(() => new GeminiService());
  const [connection, setConnection] = useState<ConnectionStatus>('checking');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundPrompts, setFoundPrompts] = useState<ImagePrompt[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [error, setError] = useState<{msg: string, details?: string, type?: 'quota' | 'hard'} | null>(null);
  
  const [cooldown, setCooldown] = useState(0);
  const [activeImage, setActiveImage] = useState<GeneratedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  const checkHealth = useCallback(async () => {
    setConnection('checking');
    const res = await gemini.testKeyAccess();
    if (res.success) {
      setConnection('online');
      setError(null);
    } else {
      setConnection(res.isQuota ? 'throttled' : 'error');
      setError({ 
        msg: res.message, 
        details: res.details, 
        type: res.isQuota ? 'quota' : 'hard' 
      });
    }
  }, [gemini]);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown(c => c - 1), 1000);
      return () => clearInterval(timer);
    } else if (connection === 'throttled') {
      setConnection('online');
    }
  }, [cooldown, connection]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching || cooldown > 0) return;
    
    setIsSearching(true);
    setError(null);
    try {
      const result = await gemini.deepScanInternet(searchQuery);
      setFoundPrompts(result.prompts);
      setSources(result.sources);
      
      // Auto scroll to results after a short delay to allow content to render
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      const errMsg = err.toString().toLowerCase();
      if (errMsg.includes("429") || errMsg.includes("quota")) {
        setCooldown(30);
        setError({
          msg: "Neural Overload", 
          details: "The API endpoint is heavily throttled. Attempting automatic recovery...",
          type: 'quota'
        });
      } else {
        setError({ msg: "Link Interrupted", details: err.toString(), type: 'hard' });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleAIEdit = async (instruction: string) => {
    if (!activeImage || isProcessing) return;
    setIsProcessing(true);
    try {
      const base64 = await gemini.refineImage(activeImage.base64, instruction);
      setActiveImage({ ...activeImage, base64, url: base64 });
    } catch (err: any) {
      setError({ msg: "Refinement Sync Failed", details: err.toString() });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'bright' : 'dark');

  const themeClasses = theme === 'bright' 
    ? 'bg-[#ffffff] text-slate-900 selection:bg-indigo-100' 
    : 'bg-[#020617] text-slate-200 selection:bg-indigo-900/30';

  return (
    <div className={`min-h-screen transition-colors duration-500 font-['Inter'] flex flex-col ${themeClasses}`}>
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b py-4 px-6 ${theme === 'bright' ? 'bg-white/90 border-slate-200 shadow-sm' : 'bg-[#020617]/90 border-white/5'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => { setActiveImage(null); setFoundPrompts([]); setError(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12 ${theme === 'bright' ? 'bg-indigo-600' : 'bg-indigo-500'}`}>
              <i className="fa-solid fa-wand-sparkles text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter uppercase italic">PromptMaster</h1>
              <p className={`text-[9px] font-bold uppercase tracking-[0.2em] ${theme === 'bright' ? 'text-indigo-600' : 'text-indigo-400'}`}>Studio & Scan</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${theme === 'bright' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-slate-400'}`}
              title="Toggle Theme"
            >
              <i className={`fa-solid ${theme === 'bright' ? 'fa-moon' : 'fa-sun text-amber-400'}`}></i>
            </button>

            <div 
              onClick={checkHealth}
              className={`flex items-center gap-3 px-4 py-2 rounded-full border cursor-pointer hover:bg-white/10 transition-colors ${theme === 'bright' ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'}`}
              title="Check Connection Health"
            >
              <div className={`w-2 h-2 rounded-full ${connection === 'online' ? 'bg-green-500 animate-pulse' : cooldown > 0 ? 'bg-amber-500 animate-bounce' : 'bg-red-500'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {cooldown > 0 ? `COOLING...` : connection}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-10">
        {connection === 'checking' && !isSearching ? (
          <div className="py-40 text-center flex flex-col items-center">
            <div className="relative w-20 h-20 mb-8">
              <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Establishing Secure Uplink...</p>
          </div>
        ) : activeImage ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <button 
               onClick={() => setActiveImage(null)} 
               className={`mb-10 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-colors ${theme === 'bright' ? 'text-slate-400 hover:text-indigo-600' : 'text-slate-500 hover:text-white'}`}
             >
               <i className="fa-solid fa-chevron-left"></i> Back to Prompts
             </button>
             <ImageEditor theme={theme} image={activeImage} onAIEdit={handleAIEdit} isProcessing={isProcessing} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <div className="text-center mb-10">
                <h2 className={`text-4xl md:text-6xl font-black tracking-tight mb-4 ${theme === 'bright' ? 'text-slate-900' : 'text-white'}`}>
                  Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 italic">Discovery</span>
                </h2>
                <p className={`text-xs md:text-sm font-medium tracking-wide max-w-lg mx-auto leading-relaxed opacity-60`}>
                  SCAN THE ENTIRE INTERNET for top-tier AI prompts. Instant visualization and professional brightness controls.
                </p>
              </div>

              <form onSubmit={handleSearch} className="relative group mb-8">
                <div className={`absolute -inset-1 rounded-[2.5rem] blur transition duration-500 group-hover:opacity-100 ${theme === 'bright' ? 'bg-indigo-600/10 opacity-30' : 'bg-indigo-500/20 opacity-20'}`}></div>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Describe a style or subject..."
                    className={`w-full rounded-[2rem] px-10 py-7 text-sm md:text-lg font-medium outline-none transition-all border ${theme === 'bright' ? 'bg-white border-slate-200 focus:ring-4 focus:ring-indigo-500/10 shadow-xl' : 'bg-slate-900/80 border-white/10 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 shadow-2xl'}`}
                    disabled={cooldown > 0}
                  />
                  <button
                    type="submit"
                    disabled={isSearching || cooldown > 0}
                    className={`absolute right-3 top-3 bottom-3 px-8 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 ${cooldown > 0 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95'}`}
                  >
                    {isSearching ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-satellite"></i>}
                    {isSearching ? "Crawling..." : "Deep Scan"}
                  </button>
                </div>
              </form>

              {error && (
                <div className={`mt-8 p-6 rounded-3xl border animate-in slide-in-from-top-2 ${theme === 'bright' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-red-500/10 border-red-500/20 text-red-100'}`}>
                  <div className="flex items-start gap-4">
                    <i className="fa-solid fa-bolt-lightning text-xl mt-1 text-amber-500"></i>
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-widest mb-1">{error.msg}</p>
                      <p className="text-[10px] opacity-70 leading-relaxed font-mono mb-4">{error.details}</p>
                      <div className="flex gap-3">
                        <button 
                          onClick={checkHealth}
                          className="px-4 py-2 bg-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-colors"
                        >
                          Retry Connection
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div ref={resultsRef} className="scroll-mt-32">
              {isSearching ? (
                <div className="grid grid-cols-1 gap-6 opacity-40">
                  {[1,2,3].map(i => (
                    <div key={i} className={`h-60 rounded-[2.5rem] animate-pulse ${theme === 'bright' ? 'bg-slate-100' : 'bg-slate-900'}`}></div>
                  ))}
                </div>
              ) : foundPrompts.length > 0 ? (
                <PromptFinder
                  theme={theme}
                  prompts={foundPrompts}
                  sources={sources}
                  gemini={gemini}
                  onOpenInStudio={(img) => setActiveImage(img)}
                />
              ) : (
                <div className="py-20 text-center opacity-10">
                  <i className="fa-solid fa-cube text-8xl mb-6"></i>
                  <p className="text-xl font-black uppercase tracking-[0.3em]">Scanner Ready</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {foundPrompts.length > 0 && !activeImage && (
        <footer className={`py-12 border-t text-center ${theme === 'bright' ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-slate-900/20 border-white/5 text-slate-500'}`}>
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-[10px] font-black uppercase tracking-widest hover:text-indigo-500 transition-colors"
          >
            <i className="fa-solid fa-arrow-up mb-2 block text-xl"></i>
            Return to Top
          </button>
          <p className="mt-8 text-[9px] font-medium uppercase tracking-[0.2em] opacity-50">PromptMaster AI Studio &copy; 2024</p>
        </footer>
      )}
    </div>
  );
};

export default App;
