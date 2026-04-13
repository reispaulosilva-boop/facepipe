"use client";

import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Plus,
  Minus,
  AlignVerticalDistributeCenter,
  AlignHorizontalDistributeCenter,
  RotateCcw,
  Target,
  Ruler,
  Lock,
  PieChart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: (e: React.MouseEvent) => void;
  colorScheme?: "cyan" | "amber";
}

function ToolButton({ icon, label, active, onClick, colorScheme = "cyan" }: ToolButtonProps) {
  const activeStyles = {
    cyan:  "bg-primary/20 border-primary/50 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.15)]",
    amber: "bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.15)]",
  };

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05, x: 2 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(e);
      }}
      className={cn(
        "group relative flex items-center justify-center w-10 min-w-[40px] h-10 rounded-lg transition-premium",
        "bg-white/5 border border-white/10 hover:border-white/20 select-none",
        active && activeStyles[colorScheme]
      )}
      title={label}
    >
      {icon}
      <div className="absolute left-14 px-2 py-1 rounded bg-black/90 border border-white/15 text-white/80 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-premium font-ui font-semibold tracking-wide z-50 shadow-2xl backdrop-blur-md">
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
  showDistancesSubmenu: boolean;
  toggleDistancesSubmenu: () => void;
  showBitemporal: boolean;
  toggleBitemporal: () => void;
  showBizygomatic: boolean;
  toggleBizygomatic: () => void;
  showBigonial: boolean;
  toggleBigonial: () => void;
  showMentonian: boolean;
  toggleMentonian: () => void;
  showFacialShape: boolean;
  toggleFacialShape: () => void;
  showRegions: boolean;
  toggleRegions: () => void;
  showRegionsSubmenu: boolean;
  toggleRegionsSubmenu: () => void;
  toggleSpecificRegion: (region: any) => void;
  setAllRegions: (v: boolean) => void;
  activeRegions: any;
  trichionOverrideY: number | null;
  resetTrichion: () => void;
  showAreasPanel: boolean;
  toggleAreasPanel: () => void;
  showEvaluationPanel: boolean;
  toggleEvaluationPanel: () => void;
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
    showDistancesSubmenu,
    toggleDistancesSubmenu,
    showBitemporal,
    toggleBitemporal,
    showBizygomatic,
    toggleBizygomatic,
    showBigonial,
    toggleBigonial,
    showMentonian,
    toggleMentonian,
    showFacialShape,
    toggleFacialShape,
    showRegions,
    toggleRegions,
    showRegionsSubmenu,
    toggleRegionsSubmenu,
    toggleSpecificRegion,
    setAllRegions,
    activeRegions,
    trichionOverrideY,
    resetTrichion,
    showAreasPanel,
    toggleAreasPanel,
    showEvaluationPanel,
    toggleEvaluationPanel,
  } = props;

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-6 top-24 bottom-6 w-14 hover:w-56 flex flex-col gap-2 p-2 rounded-2xl bg-[#000105]/40 backdrop-blur-2xl border border-white/5 z-50 transition-all duration-500 ease-out group/sidebar overflow-y-auto scrollbar-none"
    >
      <div className="flex flex-col gap-3 min-h-full">
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
        <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em] text-left pl-2 select-none mb-0.5">
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


        {/* Distâncias Horizontais (Bitemporal / Bizigomática / Bigonial) */}
        <div className="flex flex-col gap-1.5 relative">
          <ToolButton
            icon={
              <div className="relative flex items-center justify-center w-4 h-4">
                <Ruler className="w-4 h-4" />
                {(showBitemporal || showBizygomatic || showBigonial || showMentonian || showFacialShape) && (
                  <motion.div
                    layoutId="distances-indicator"
                    className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-red-400"
                  />
                )}
              </div>
            }
            label="Distâncias Faciais"
            active={showDistancesSubmenu || showBitemporal || showBizygomatic || showBigonial || showMentonian || showFacialShape}
            onClick={toggleDistancesSubmenu}
            colorScheme="amber"
          />

          {/* Floating Submenu for Distances */}
          <AnimatePresence>
            {showDistancesSubmenu && (
              <motion.div
                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -10, scale: 0.95 }}
                className="absolute left-14 top-0 w-[240px] p-3 rounded-2xl bg-[#030712]/95 backdrop-blur-3xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col gap-1.5 z-[60]"
              >
                <div className="px-2 py-1.5 border-b border-white/10 mb-1">
                  <span className="text-[10px] font-ui font-black text-amber-500 uppercase tracking-[0.15em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    Distâncias Faciais
                  </span>
                </div>
                
                {[
                  { id: "bitemporal", label: "Bitemporal", active: showBitemporal, toggle: toggleBitemporal },
                  { id: "bizygomatic", label: "Bizigomática", active: showBizygomatic, toggle: toggleBizygomatic },
                  { id: "bigonial", label: "Bigonial", active: showBigonial, toggle: toggleBigonial },
                  { id: "mentonian", label: "Mentoniana", active: showMentonian, toggle: toggleMentonian },
                ].map((dist) => (
                  <button
                    key={dist.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dist.toggle();
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-xs group",
                      dist.active ? "bg-white/10 text-white" : "hover:bg-white/5 text-white/60 hover:text-white"
                    )}
                  >
                    <span className="font-medium">Distância {dist.label}</span>
                    {dist.active && <div className="w-1.5 h-1.5 rounded-full bg-[#A3E635] shadow-[0_0_8px_rgba(163,230,53,0.6)]" />}
                  </button>
                ))}

                {/* Facial Shape - Conditional Button */}
                <div className="pt-1 mt-1 border-t border-white/5">
                  <button
                    disabled={!(showBitemporal && showBizygomatic && showBigonial && showMentonian)}
                    onClick={toggleFacialShape}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-xs group relative overflow-hidden",
                      showFacialShape 
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" 
                        : "hover:bg-white/5 text-white/40 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        showFacialShape ? "bg-cyan-400" : "bg-white/20"
                      )} />
                      <span className="font-bold underline decoration-cyan-500/30 underline-offset-4">FORMA FACIAL</span>
                    </div>
                    {!(showBitemporal && showBizygomatic && showBigonial && showMentonian) && (
                      <Lock className="w-3 h-3 text-white/20" />
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Regiões Anatômicas (Topográficas) */}
        <div className="flex flex-col gap-1.5 relative">
          <ToolButton
            icon={
              <div className="relative flex items-center justify-center w-4 h-4">
                <Target className="w-4 h-4" />
                {(showRegions || Object.values(activeRegions).some(v => v)) && (
                  <motion.div
                    layoutId="regions-indicator"
                    className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-amber-400"
                  />
                )}
              </div>
            }
            label="Regiões Anatômicas"
            active={showRegionsSubmenu || showRegions || Object.values(activeRegions).some(v => v)}
            onClick={toggleRegionsSubmenu}
            colorScheme="amber"
          />

          {/* Floating Submenu for Regions */}
          <AnimatePresence>
            {showRegionsSubmenu && (
              <motion.div
                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -10, scale: 0.95 }}
                className="absolute left-14 top-0 w-[260px] p-3 rounded-2xl bg-[#030712]/95 backdrop-blur-3xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col gap-1.5 z-[60]"
              >
                <div className="px-2 py-1.5 border-b border-white/10 mb-1">
                  <span className="text-[10px] font-ui font-black text-amber-500 uppercase tracking-[0.15em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    Regiões Anatômicas
                  </span>
                </div>

                <div className="px-2 py-1.5 flex gap-2">
                  <button 
                    onClick={() => setAllRegions(true)}
                    className="flex-1 px-2 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[9px] font-bold rounded border border-amber-500/20 transition-all uppercase tracking-tight"
                  >
                    Ativar Todas
                  </button>
                  <button 
                    onClick={() => setAllRegions(false)}
                    className="flex-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-[9px] font-bold rounded border border-white/10 transition-all uppercase tracking-tight"
                  >
                    Limpar
                  </button>
                </div>
                
                <div className="flex flex-col gap-0.5 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {/* TERÇO SUPERIOR */}
                  <div className="px-2 py-1.5 mt-1 bg-white/5 rounded">
                    <span className="text-[9px] font-bold text-white/40 tracking-wider">TERÇO SUPERIOR</span>
                  </div>
                  {[
                    { id: "frontal", label: "Frontal", abbr: "F" },
                    { id: "temporal_r", label: "Temporal Dir", abbr: "T-D" },
                    { id: "temporal_l", label: "Temporal Esq", abbr: "T-E" },
                    { id: "glabela", label: "Glabela", abbr: "G" },
                  ].map((reg) => (
                    <button
                      key={reg.id}
                      onClick={() => toggleSpecificRegion(reg.id as any)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-xs group",
                        activeRegions[reg.id] ? "bg-amber-500/20 text-white" : "hover:bg-white/5 text-white/60 hover:text-white"
                      )}
                    >
                      <span className="font-medium truncate">{reg.label}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[9px] text-white/30 font-mono">{reg.abbr}</span>
                        {activeRegions[reg.id] && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />}
                      </div>
                    </button>
                  ))}

                  {/* TERÇO MÉDIO */}
                  <div className="px-2 py-1.5 mt-2 bg-white/5 rounded">
                    <span className="text-[9px] font-bold text-white/40 tracking-wider">TERÇO MÉDIO</span>
                  </div>
                  {[
                    { id: "nariz", label: "Nariz", abbr: "N" },
                    { id: "malar_lateral_r", label: "Malar Lat Dir", abbr: "ML-D" },
                    { id: "malar_lateral_l", label: "Malar Lat Esq", abbr: "ML-E" },
                    { id: "malar_medial_r", label: "Malar Med Dir", abbr: "MM-D" },
                    { id: "malar_medial_l", label: "Malar Med Esq", abbr: "MM-E" },
                    { id: "infrapalpebral_r", label: "Infrapalpebral Dir", abbr: "IP-D" },
                    { id: "infrapalpebral_l", label: "Infrapalpebral Esq", abbr: "IP-E" },
                  ].map((reg) => (
                    <button
                      key={reg.id}
                      onClick={() => toggleSpecificRegion(reg.id as any)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-xs group",
                        activeRegions[reg.id] ? "bg-amber-500/20 text-white" : "hover:bg-white/5 text-white/60 hover:text-white"
                      )}
                    >
                      <span className="font-medium truncate">{reg.label}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[9px] text-white/30 font-mono">{reg.abbr}</span>
                        {activeRegions[reg.id] && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />}
                      </div>
                    </button>
                  ))}

                  {/* TERÇO INFERIOR */}
                  <div className="px-2 py-1.5 mt-2 bg-white/5 rounded">
                    <span className="text-[9px] font-bold text-white/40 tracking-wider">TERÇO INFERIOR</span>
                  </div>
                  {[
                    { id: "labial", label: "Labial", abbr: "Lb" },
                    { id: "subnasal", label: "Subnasal", abbr: "SN" },
                    { id: "perioral", label: "Perioral", abbr: "POr" },
                    { id: "submalar_r", label: "Submalar Dir", abbr: "SM-D" },
                    { id: "submalar_l", label: "Submalar Esq", abbr: "SM-E" },
                    { id: "mandibular_r", label: "Mandibular Dir", abbr: "Ma-D" },
                    { id: "mandibular_l", label: "Mandibular Esq", abbr: "Ma-E" },
                    { id: "mento", label: "Mento", abbr: "Me" },
                  ].map((reg) => (
                    <button
                      key={reg.id}
                      onClick={() => toggleSpecificRegion(reg.id as any)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-xs group",
                        activeRegions[reg.id] ? "bg-amber-500/20 text-white" : "hover:bg-white/5 text-white/60 hover:text-white"
                      )}
                    >
                      <span className="font-medium truncate">{reg.label}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[9px] text-white/30 font-mono">{reg.abbr}</span>
                        {activeRegions[reg.id] && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-1 mt-1 border-t border-white/5">
                  <button
                    onClick={toggleRegions}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-[10px] group",
                      showRegions ? "bg-white/10 text-white" : "hover:bg-white/5 text-white/40 hover:text-white"
                    )}
                  >
                    <span className="font-bold uppercase tracking-tighter">Visualização Global</span>
                    {showRegions && <div className="w-1 h-1 rounded-full bg-white animate-pulse" />}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="h-px bg-white/5 mx-1" />

      {/* Áreas Topográficas */}
      <div className="flex flex-col gap-1.5">
        <ToolButton
          icon={<PieChart className="w-4 h-4" />}
          label="Áreas Topográficas"
          active={showAreasPanel}
          onClick={toggleAreasPanel}
          colorScheme="cyan"
        />
      </div>

      <div className="h-px bg-white/5 mx-1" />

      {/* Avaliação Facial (Proporção) */}
      <div className="flex flex-col gap-1.5">
        <ToolButton
          icon={<Target className={cn("w-4 h-4", showEvaluationPanel && "text-amber-400")} />}
          label="Avaliação Estética"
          active={showEvaluationPanel}
          onClick={toggleEvaluationPanel}
          colorScheme="amber"
        />
      </div>

      <div className="h-px bg-white/5 mx-1" />

      {/* Trichion Reset — only visible when manually adjusted */}
      {trichionOverrideY != null && (
        <>
          <div className="h-px bg-white/5 mx-1" />
          <div className="flex flex-col items-start gap-1.5 py-1 px-1">
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                resetTrichion();
              }}
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
      </div>
    </motion.div>
  );
}

interface ZoomPanelProps {
  zoomPercent: number;
  setZoomPercent: (percent: number) => void;
}

export function ZoomPanel({ zoomPercent, setZoomPercent }: ZoomPanelProps) {
  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed right-6 top-24 bottom-6 w-14 flex flex-col items-center justify-center p-2 rounded-2xl bg-[#000105]/40 backdrop-blur-2xl border border-white/5 z-50 transition-premium"
    >
      {/* Zoom Precise Controls Column */}
      <div className="flex flex-col items-center gap-2 py-4 px-1 rounded-2xl bg-white/5 border border-white/5 w-full">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setZoomPercent(zoomPercent + 25);
          }}
          className="p-1.5 hover:text-primary text-white/40 transition-all hover:scale-110 active:scale-90"
          title="Aumentar"
        >
          <Plus className="w-5 h-5" />
        </button>
        
        <div className="relative h-48 w-1.5 bg-white/10 rounded-full overflow-hidden flex flex-col justify-end">
          <motion.div 
            animate={{ height: `${Math.min(zoomPercent / 5, 100)}%` }}
            className="w-full bg-primary shadow-[0_0_15px_rgba(14,165,233,0.5)]" 
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
           onClick={(e) => {
             e.preventDefault();
             e.stopPropagation();
             setZoomPercent(zoomPercent - 25);
           }}
           className="p-1.5 hover:text-primary text-white/40 transition-all hover:scale-110 active:scale-90"
           title="Diminuir"
        >
          <Minus className="w-5 h-5" />
        </button>

        <div className="h-px bg-white/10 w-8 my-2" />

        <div className="flex flex-col gap-2">
          {[100, 200, 400].map(p => (
            <button
              key={p}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setZoomPercent(p);
              }}
              className={cn(
                "text-[9px] font-bold px-2 py-1 rounded-lg transition-all",
                zoomPercent >= p - 5 && zoomPercent <= p + 5 
                  ? "bg-primary text-black shadow-[0_0_15px_rgba(14,165,233,0.4)]" 
                  : "text-white/40 hover:text-white/60 hover:bg-white/5"
              )}
            >
              {p}%
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
