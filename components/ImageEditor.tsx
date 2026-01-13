
import React, { useState, useEffect, useRef } from 'react';
import { GeneratedImage, ImageAdjustments, ThemeMode } from '../types';

interface ImageEditorProps {
  theme: ThemeMode;
  image: GeneratedImage;
  onAIEdit: (instruction: string) => void;
  isProcessing: boolean;
}

const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  exposure: 100,
  hue: 0,
  vibrance: 100,
  sharpness: 0,
};

const ImageEditor: React.FC<ImageEditorProps> = ({ theme, image, onAIEdit, isProcessing }) => {
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);
  const [history, setHistory] = useState<ImageAdjustments[]>([DEFAULT_ADJUSTMENTS]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [aiInstruction, setAiInstruction] = useState('');
  const [downloading, setDownloading] = useState(false);
  
  // Ref to track if the current change should trigger a history push (usually on mouseUp)
  const isDragging = useRef(false);

  const pushToHistory = (newAdjustments: ImageAdjustments) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAdjustments);
    // Keep history manageable
    if (newHistory.length > 25) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setAdjustments(history[prevIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setAdjustments(history[nextIndex]);
    }
  };

  const handleAdjustmentChange = (key: keyof ImageAdjustments, value: number) => {
    const next = { ...adjustments, [key]: value };
    setAdjustments(next);
  };

  const handleAdjustmentEnd = () => {
    if (JSON.stringify(adjustments) !== JSON.stringify(history[historyIndex])) {
      pushToHistory(adjustments);
    }
  };

  const handleReset = () => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    pushToHistory(DEFAULT_ADJUSTMENTS);
  };

  const handleDownload = () => {
    setDownloading(true);
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `PromptMaster-Studio-${Date.now()}.png`;
    link.click();
    setTimeout(() => setDownloading(false), 2000);
  };

  const cardBg = theme === 'bright' ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/40 border-white/5';
  const textPrimary = theme === 'bright' ? 'text-slate-900' : 'text-white';
  const textSecondary = theme === 'bright' ? 'text-slate-500' : 'text-slate-400';

  // CSS Filter string calculation
  const filterString = [
    `brightness(${adjustments.brightness}%)`,
    `contrast(${adjustments.contrast + (adjustments.sharpness * 0.2)}%)`, // Sharpening simulation via contrast boost
    `saturate(${adjustments.saturation + (adjustments.vibrance - 100)}%)`, // Vibrance-aware saturation
    `opacity(${adjustments.exposure}%)`,
    `hue-rotate(${adjustments.hue}deg)`,
    adjustments.sharpness > 50 ? `brightness(${100 + (adjustments.sharpness * 0.05)}%)` : '', // Extra luminance for high sharpness
  ].join(' ');

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 pb-20">
      <div className="flex-1 space-y-6">
        <div className={`relative aspect-square rounded-[3rem] overflow-hidden border p-3 shadow-2xl transition-all ${cardBg}`}>
          <div className="w-full h-full rounded-[2.5rem] overflow-hidden bg-black flex items-center justify-center relative">
            <img
              src={image.base64}
              alt="Studio View"
              className="w-full h-full object-contain transition-all duration-100 will-change-filter"
              style={{
                filter: filterString,
                transform: 'translateZ(0)', // GPU acceleration
              }}
            />
            
            <button 
              onClick={handleDownload}
              className={`absolute top-8 right-8 w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90 border backdrop-blur-md ${theme === 'bright' ? 'bg-white/90 border-slate-200 text-slate-800 hover:bg-white' : 'bg-slate-900/80 border-white/10 text-white hover:bg-slate-900'}`}
            >
              {downloading ? <i className="fa-solid fa-check text-green-500"></i> : <i className="fa-solid fa-download text-lg"></i>}
            </button>
          </div>
        </div>

        <div className={`p-8 rounded-[2.5rem] border ${cardBg}`}>
          <div className="flex items-center gap-3 mb-6">
            <i className="fa-solid fa-sparkles text-indigo-500"></i>
            <h4 className={`text-xs font-black uppercase tracking-widest ${textPrimary}`}>Neural Studio Refiner</h4>
          </div>
          <div className="flex gap-4">
            <input 
              type="text"
              value={aiInstruction}
              onChange={(e) => setAiInstruction(e.target.value)}
              placeholder="e.g. 'Inject golden hour sunlight', 'Add hyper-realistic details'..."
              className={`flex-1 px-6 py-5 rounded-2xl text-sm border focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all ${theme === 'bright' ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-black/20 border-white/5 text-white'}`}
            />
            <button 
              onClick={() => onAIEdit(aiInstruction)}
              disabled={isProcessing || !aiInstruction.trim()}
              className={`px-10 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${isProcessing ? 'bg-slate-700 opacity-50 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl active:scale-95'}`}
            >
              {isProcessing ? <i className="fa-solid fa-dna fa-spin"></i> : <i className="fa-solid fa-wand-sparkles"></i>}
              {isProcessing ? 'Synthesizing' : 'Refine'}
            </button>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-96 space-y-6">
        <div className={`p-10 rounded-[3rem] border h-fit shadow-xl ${cardBg}`}>
          <div className="flex justify-between items-center mb-10">
            <h3 className={`text-xs font-black uppercase tracking-[0.3em] ${textPrimary}`}>Luminance & Controls</h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={undo}
                disabled={historyIndex === 0}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${historyIndex === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-indigo-500/10'}`}
              >
                <i className="fa-solid fa-rotate-left text-[10px]"></i>
              </button>
              <button 
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${historyIndex >= history.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-indigo-500/10'}`}
              >
                <i className="fa-solid fa-rotate-right text-[10px]"></i>
              </button>
              <button 
                onClick={handleReset}
                className="text-[9px] font-black text-indigo-500 uppercase hover:underline ml-2"
              >
                Reset
              </button>
            </div>
          </div>
          
          <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <ControlSlider 
              label="Primary Brightness" 
              icon="fa-sun" 
              value={adjustments.brightness} 
              theme={theme}
              onChange={(v) => handleAdjustmentChange('brightness', v)} 
              onEnd={handleAdjustmentEnd}
            />
            <ControlSlider 
              label="Light Exposure" 
              icon="fa-lightbulb" 
              value={adjustments.exposure} 
              theme={theme}
              onChange={(v) => handleAdjustmentChange('exposure', v)} 
              onEnd={handleAdjustmentEnd}
              max={200}
            />
            <ControlSlider 
              label="Hue Rotation" 
              icon="fa-rainbow" 
              value={adjustments.hue} 
              theme={theme}
              onChange={(v) => handleAdjustmentChange('hue', v)} 
              onEnd={handleAdjustmentEnd}
              max={360}
              unit="°"
            />
             <ControlSlider 
              label="Chroma Vibrance" 
              icon="fa-bolt" 
              value={adjustments.vibrance} 
              theme={theme}
              onChange={(v) => handleAdjustmentChange('vibrance', v)} 
              onEnd={handleAdjustmentEnd}
              max={200}
            />
            <ControlSlider 
              label="Black Point" 
              icon="fa-circle-half-stroke" 
              value={adjustments.contrast} 
              theme={theme}
              onChange={(v) => handleAdjustmentChange('contrast', v)} 
              onEnd={handleAdjustmentEnd}
            />
            <ControlSlider 
              label="Chroma Level" 
              icon="fa-palette" 
              value={adjustments.saturation} 
              theme={theme}
              onChange={(v) => handleAdjustmentChange('saturation', v)} 
              onEnd={handleAdjustmentEnd}
            />
            <ControlSlider 
              label="Edge Sharpness" 
              icon="fa-bullseye" 
              value={adjustments.sharpness} 
              theme={theme}
              onChange={(v) => handleAdjustmentChange('sharpness', v)} 
              onEnd={handleAdjustmentEnd}
              max={100}
            />
          </div>
        </div>

        <div className={`p-8 rounded-[2.5rem] border ${cardBg}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-4 opacity-50 ${textSecondary}`}>Active Metadata</p>
          <div className={`p-5 rounded-2xl text-xs leading-relaxed italic font-medium border ${theme === 'bright' ? 'bg-slate-50 border-slate-100 text-slate-500' : 'bg-black/20 border-white/5 text-slate-400'}`}>
             "{image.prompt}"
          </div>
        </div>
      </div>
    </div>
  );
};

const ControlSlider: React.FC<{ 
  label: string, 
  icon: string, 
  value: number, 
  theme: ThemeMode, 
  onChange: (v: number) => void, 
  onEnd: () => void,
  max?: number,
  unit?: string
}> = ({ label, icon, value, theme, onChange, onEnd, max = 200, unit = "%" }) => {
  return (
    <div className="group space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${theme === 'bright' ? 'bg-slate-100 group-hover:bg-indigo-50' : 'bg-white/5 group-hover:bg-indigo-500/20'}`}>
            <i className={`fa-solid ${icon} text-[10px] text-indigo-500`}></i>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'bright' ? 'text-slate-600' : 'text-slate-400'}`}>{label}</span>
        </div>
        <span className={`text-[10px] font-black font-mono transition-colors ${theme === 'bright' ? 'text-indigo-600' : 'text-indigo-400'}`}>{value}{unit}</span>
      </div>
      <input 
        type="range" 
        min="0" 
        max={max} 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        onMouseUp={onEnd}
        onTouchEnd={onEnd}
        className="w-full h-1.5 bg-indigo-500/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
      />
    </div>
  );
};

export default ImageEditor;
