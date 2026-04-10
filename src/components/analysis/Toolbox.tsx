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
  Target,
  Ruler,
  Sun,
  Grid,
  Sparkle,
  Thermometer,
  Zap,
  Activity,
  ArrowDownCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useFaceStore } from "@/store/useFaceStore";

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
        "group relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300",
        "bg-white/5 border border-white/10 hover:border-white/20",
        active && activeStyles[colorScheme]
      )}
      title={label}
    >
      {icon}
      <div className="absolute left-14 px-2 py-1 rounded bg-black/80 border border-white/10 text-white/70 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-medium tracking-wide z-50">
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
  showDistances: boolean;
  toggleDistances: () => void;
  showRegions: boolean;
  toggleRegions: () => void;
  trichionOverrideY: number | null;
  resetTrichion: () => void;
  zoomPercent: number;
  setZoomPercent: (percent: number) => void;
  onGenerateReport: () => void;
  isGenerating?: boolean;
  onAnalyzeSkin: (type: string) => void;
}

export function Toolbox(props: ToolboxProps) {
  const {
    showLandmarks,
    setShowLandmarks,
    showThirds,
    toggleThirds,
    showFifths,
    toggleFifths,
    showDistances,
    toggleDistances,
    showRegions,
    toggleRegions,
    trichionOverrideY,
    resetTrichion,
    zoomPercent,
    setZoomPercent,
    onGenerateReport,
    isGenerating,
    onAnalyzeSkin
  } = props;

  const {
    showSkinAnalysisSubmenu,
    toggleSkinAnalysisSubmenu,
    setActiveSkinAnalysis,
    isAnalyzingSkin
  } = useFaceStore();

  const skinParams = [
    { id: "melasma", label: "Melasma", icon: <Sun className="w-3.5 h-3.5" /> },
    { id: "poros", label: "Poros Dilatados", icon: <Grid className="w-3.5 h-3.5" /> },
    { id: "brilho", label: "Brilho", icon: <Sparkle className="w-3.5 h-3.5" /> },
    { id: "vermelhidao", label: "Vermelhidão", icon: <Thermometer className="w-3.5 h-3.5" /> },
    { id: "cravos", label: "Cravos e Espinhas", icon: <Zap className="w-3.5 h-3.5" /> },
    { id: "rugas", label: "Rugas e Linhas Finas", icon: <Activity className="w-3.5 h-3.5" /> },
    { id: "flacidez", label: "Flacidez", icon: <ArrowDownCircle className="w-3.5 h-3.5" /> },
  ];

  const handleSkinParamClick = (label: string) => {
    if (label === "Melasma") {
      onAnalyzeSkin("Melasma");
    } else {
      alert(`Avaliação de ${label}: Função em desenvolvimento.`);
    }
    setActiveSkinAnalysis(label);
  };

  return (
    <motion.aside 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-4 top-[calc(50%+32px)] -translate-y-1/2 flex flex-col gap-3 p-2 rounded-xl bg-[#030712]/60 backdrop-blur-xl border border-white/5 z-50 shadow-2xl"
    >
      {/* Visual State — Landmarks */}
      <div className="flex flex-col gap-1.5">
        <ToolButton 
          icon={showLandmarks ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />} 
          label={showLandmarks ? "Ocultar Landmarks" : "Mostrar Landmarks"}
          active={showLandmarks}
          onClick={() => setShowLandmarks(!showLandmarks)}
          colorScheme="cyan"
        />
      </div>

      <div className="h-px bg-white/5 mx-1" />

      {/* Analysis toggles */}
      <div className="flex flex-col gap-1.5">
        {/* Section label */}
        <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em] text-center select-none mb-0.5">
          Capas
        </span>

        {/* Terços — Análise Vertical */}
        <ToolButton
          icon={
            <div className="relative flex items-center justify-center w-4 h-4">
              <AlignVerticalDistributeCenter className="w-4 h-4" />
              {showThirds && (
                <motion.div 
                  layoutId="thirds-indicator"
                  className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-amber-400"
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
            <div className="relative flex items-center justify-center w-4 h-4">
              <AlignHorizontalDistributeCenter className="w-4 h-4" />
              {showFifths && (
                <motion.div
                  layoutId="fifths-indicator"
                  className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-amber-400"
                />
              )}
            </div>
          }
          label="Quintos Faciais"
          active={showFifths}
          onClick={toggleFifths}
          colorScheme="amber"
        />


        {/* Distâncias Horizontais (Bizigomática / Bigonial) */}
        <ToolButton
          icon={
            <div className="relative flex items-center justify-center w-4 h-4">
              <Ruler className="w-4 h-4" />
              {showDistances && (
                <motion.div
                  layoutId="distances-indicator"
                  className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-red-400"
                />
              )}
            </div>
          }
          label="Distâncias Faciais"
          active={showDistances}
          onClick={toggleDistances}
          colorScheme="amber"
        />
        
        {/* Regiões Anatômicas (Topográficas) */}
        <ToolButton
          icon={
            <div className="relative flex items-center justify-center w-4 h-4">
              <Target className="w-4 h-4" />
              {showRegions && (
                <motion.div
                  layoutId="regions-indicator"
                  className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-amber-400"
                />
              )}
            </div>
          }
          label="Regiões Anatômicas"
          active={showRegions}
          onClick={toggleRegions}
          colorScheme="amber"
        />
      </div>

      <div className="h-px bg-white/5 mx-1" />

      {/* Skin Quality Section — NEW */}
      <div className="flex flex-col gap-1.5 relative">
        <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em] text-center select-none mb-0.5">
          Pele
        </span>
        
        <ToolButton
          icon={isAnalyzingSkin ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}><Sparkles className="w-4 h-4 text-primary" /></motion.div> : <Sparkles className="w-4 h-4" />}
          label={isAnalyzingSkin ? "Analisando Pele..." : "Qualidade da Pele"}
          active={showSkinAnalysisSubmenu || isAnalyzingSkin}
          onClick={toggleSkinAnalysisSubmenu}
          colorScheme="cyan"
        />

        {/* Floating Submenu */}
        <AnimatePresence>
          {showSkinAnalysisSubmenu && (
            <motion.div
              initial={{ opacity: 0, x: -10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, scale: 0.95 }}
              className="absolute left-14 top-0 min-w-[180px] p-2 rounded-xl bg-[#030712]/90 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col gap-1 z-[60]"
            >
              <div className="px-2 py-1.5 border-b border-white/5 mb-1">
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                  AVALIAÇÃO GEMINI
                </span>
              </div>
              
              {skinParams.map((param) => (
                <button
                  key={param.id}
                  onClick={() => handleSkinParamClick(param.label)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all text-xs group"
                >
                  <div className="text-primary group-hover:scale-110 transition-transform">
                    {param.icon}
                  </div>
                  <span className="font-medium">{param.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-px bg-white/5 mx-1" />

      {/* Trichion Reset — only visible when manually adjusted */}
      {trichionOverrideY != null && (
        <>
          <div className="h-px bg-white/5 mx-1" />
          <div className="flex flex-col items-center gap-1.5 py-1 px-1">
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetTrichion}
              className="group relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 bg-green-500/20 border border-green-500/50 text-green-400 shadow-[0_0_20px_rgba(74,222,128,0.15)]"
              title="Resetar Trichion"
            >
              <RotateCcw className="w-4 h-4" />
              <div className="absolute left-14 px-2 py-1 rounded bg-black/80 border border-white/10 text-white/70 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-medium tracking-wide z-50">
                Resetar Trichion
              </div>
            </motion.button>
          </div>
        </>
      )}

      <div className="h-px bg-white/5 mx-1" />

      {/* Zoom Precise Controls Column */}
      <div className="flex flex-col items-center gap-2 py-1.5 px-1 rounded-lg bg-white/5 border border-white/5">
        <button 
          onClick={() => setZoomPercent(zoomPercent + 25)}
          className="p-1.5 hover:text-primary text-white/30 transition-all hover:scale-110 active:scale-90"
          title="Aumentar"
        >
          <Plus className="w-4 h-4" />
        </button>
        
        <div className="relative h-28 w-1 bg-white/10 rounded-full overflow-hidden flex flex-col justify-end">
          <motion.div 
            animate={{ height: `${Math.min(zoomPercent / 5, 100)}%` }}
            className="w-full bg-primary shadow-[0_0_10px_rgba(14,165,233,0.4)]" 
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
           className="p-1.5 hover:text-primary text-white/30 transition-all hover:scale-110 active:scale-90"
           title="Diminuir"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="flex flex-col gap-1 mt-0.5">
          {[100, 200].map(p => (
            <button
              key={p}
              onClick={() => setZoomPercent(p)}
              className={cn(
                "text-[8px] font-bold px-1.5 py-0.5 rounded transition-all",
                zoomPercent >= p - 5 && zoomPercent <= p + 5 
                  ? "bg-primary text-black" 
                  : "text-white/20 hover:text-white/50 hover:bg-white/5"
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
