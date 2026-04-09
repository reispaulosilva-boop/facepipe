"use client";

import React from "react";
import { 
  Eye, 
  EyeOff, 
  Plus, 
  Minus,
  AlignVerticalDistributeCenter,
  AlignHorizontalDistributeCenter,
  RotateCcw,
  Sparkles,
  Scale,
  Target
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  colorScheme?: "cyan" | "amber";
}

function ToolButton({ icon, label, active, onClick, colorScheme = "cyan" }: ToolButtonProps) {
  const activeStyles = {
    cyan:  "bg-primary/20 border-primary/50 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.15)]",
    amber: "bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.15)]",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05, x: 2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
        "bg-white/5 border border-white/10 hover:border-white/20",
        active && activeStyles[colorScheme]
      )}
      title={label}
    >
      {icon}
      <div className="absolute left-16 px-2 py-1 rounded bg-black/80 border border-white/10 text-white/70 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-medium tracking-wide z-50">
        {label}
      </div>
    </motion.button>
  );
}

interface ToolboxProps {
  showLandmarks: boolean;
  setShowLandmarks: (show: boolean) => void;
  showThirds: boolean;
  toggleThirds: () => void;
  showFifths: boolean;
  toggleFifths: () => void;
  showAsymmetry: boolean;
  toggleAsymmetry: () => void;
  showStructural: boolean;
  toggleStructural: () => void;
  trichionOverrideY: number | null;
  resetTrichion: () => void;
  zoomPercent: number;
  setZoomPercent: (percent: number) => void;
  onGenerateReport: () => void;
  isGenerating?: boolean;
}

export function Toolbox({
  showLandmarks,
  setShowLandmarks,
  showThirds,
  toggleThirds,
  showFifths,
  toggleFifths,
  showAsymmetry,
  toggleAsymmetry,
  showStructural,
  toggleStructural,
  trichionOverrideY,
  resetTrichion,
  zoomPercent,
  setZoomPercent,
  onGenerateReport,
  isGenerating
}: ToolboxProps) {
  return (
    <motion.aside 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 p-3 rounded-2xl bg-[#030712]/40 backdrop-blur-xl border border-white/5 z-50 shadow-2xl"
    >
      {/* Visual State — Landmarks */}
      <div className="flex flex-col gap-2">
        <ToolButton 
          icon={showLandmarks ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />} 
          label={showLandmarks ? "Ocultar Landmarks" : "Mostrar Landmarks"}
          active={showLandmarks}
          onClick={() => setShowLandmarks(!showLandmarks)}
          colorScheme="cyan"
        />
      </div>

      <div className="h-px bg-white/5 mx-2" />

      {/* Analysis toggles */}
      <div className="flex flex-col gap-2">
        {/* Section label */}
        <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] text-center select-none">
          Camadas
        </span>

        {/* Terços — Análise Vertical */}
        <ToolButton
          icon={
            <div className="relative flex items-center justify-center w-5 h-5">
              <AlignVerticalDistributeCenter className="w-5 h-5" />
              {showThirds && (
                <motion.div 
                  layoutId="thirds-indicator"
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400"
                />
              )}
            </div>
          }
          label="Terços Faciais"
          active={showThirds}
          onClick={toggleThirds}
          colorScheme="amber"
        />

        {/* Quintos — Análise Horizontal */}
        <ToolButton
          icon={
            <div className="relative flex items-center justify-center w-5 h-5">
              <AlignHorizontalDistributeCenter className="w-5 h-5" />
              {showFifths && (
                <motion.div
                  layoutId="fifths-indicator"
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400"
                />
              )}
            </div>
          }
          label="Quintos Faciais"
          active={showFifths}
          onClick={toggleFifths}
          colorScheme="amber"
        />

        {/* Assimetria */}
        <ToolButton
          icon={
            <div className="relative flex items-center justify-center w-5 h-5">
              <Scale className="w-5 h-5" />
              {showAsymmetry && (
                <motion.div
                  layoutId="asymmetry-indicator"
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400"
                />
              )}
            </div>
          }
          label="Assimetria Global"
          active={showAsymmetry}
          onClick={toggleAsymmetry}
          colorScheme="amber"
        />

        {/* Pontos Estruturais */}
        <ToolButton
          icon={
            <div className="relative flex items-center justify-center w-5 h-5">
              <Target className="w-5 h-5" />
              {showStructural && (
                <motion.div
                  layoutId="structural-indicator"
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400"
                />
              )}
            </div>
          }
          label="Pontos AB Face"
          active={showStructural}
          onClick={toggleStructural}
          colorScheme="amber"
        />

        {/* AI Report Button - Removido por hora */}
        {/*
        <ToolButton
          icon={
            <div className="relative flex items-center justify-center w-5 h-5">
              <Sparkles className={cn("w-5 h-5", isGenerating && "animate-pulse")} />
            </div>
          }
          label="Gerar Laudo IA"
          onClick={onGenerateReport}
          colorScheme="cyan"
          active={isGenerating}
        />
        */}
      </div>

      {/* Trichion Reset — only visible when manually adjusted */}
      {trichionOverrideY != null && (
        <>
          <div className="h-px bg-white/5 mx-2" />
          <div className="flex flex-col items-center gap-2 py-2 px-1">
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetTrichion}
              className="group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 bg-green-500/20 border border-green-500/50 text-green-400 shadow-[0_0_20px_rgba(74,222,128,0.15)]"
              title="Resetar Trichion"
            >
              <RotateCcw className="w-5 h-5" />
              <div className="absolute left-16 px-2 py-1 rounded bg-black/80 border border-white/10 text-white/70 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-medium tracking-wide z-50">
                Resetar Trichion
              </div>
            </motion.button>
          </div>
        </>
      )}

      <div className="h-px bg-white/5 mx-2" />

      {/* Zoom Precise Controls Column */}
      <div className="flex flex-col items-center gap-3 py-2 px-1 rounded-xl bg-white/5 border border-white/5">
        <button 
          onClick={() => setZoomPercent(zoomPercent + 25)}
          className="p-2 hover:text-primary text-white/40 transition-all hover:scale-110 active:scale-90"
          title="Aumentar"
        >
          <Plus className="w-5 h-5" />
        </button>
        
        <div className="relative h-40 w-1.5 bg-white/10 rounded-full overflow-hidden flex flex-col justify-end">
          <motion.div 
            animate={{ height: `${Math.min(zoomPercent / 5, 100)}%` }}
            className="w-full bg-primary shadow-[0_0_15px_rgba(14,165,233,0.4)]" 
          />
          <input 
            type="range"
            min="10"
            max="500"
            value={zoomPercent}
            onChange={(e) => setZoomPercent(Number(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-ns-resize"
            style={{ writingMode: 'bt-lr' as any, appearance: 'slider-vertical' as any }}
          />
        </div>

        <button 
           onClick={() => setZoomPercent(zoomPercent - 25)}
           className="p-2 hover:text-primary text-white/40 transition-all hover:scale-110 active:scale-90"
           title="Diminuir"
        >
          <Minus className="w-5 h-5" />
        </button>

        <div className="flex flex-col gap-1 mt-1">
          {[75, 100, 150, 200].map(p => (
            <button
              key={p}
              onClick={() => setZoomPercent(p)}
              className={cn(
                "text-[10px] font-bold px-2 py-1 rounded transition-all",
                zoomPercent >= p - 5 && zoomPercent <= p + 5 
                  ? "bg-primary text-black" 
                  : "text-white/30 hover:text-white/70 hover:bg-white/5"
              )}
            >
              {p}%
            </button>
          ))}
        </div>
      </div>
    </motion.aside>
  );
}
