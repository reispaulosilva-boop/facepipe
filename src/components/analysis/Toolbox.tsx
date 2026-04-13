"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// ToolButton — icon-only button with floating tooltip
// ---------------------------------------------------------------------------
interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: (e: React.MouseEvent) => void;
  colorScheme?: "cyan" | "amber" | "green";
}

function ToolButton({ icon, label, active, onClick, colorScheme = "cyan" }: ToolButtonProps) {
  const activeStyles = {
    cyan:  "bg-primary/20 border-primary/50 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.15)]",
    amber: "bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.15)]",
    green: "bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_20px_rgba(74,222,128,0.15)]",
  };

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(e); }}
      className={cn(
        "group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
        "bg-white/5 border border-white/10 hover:border-white/25 select-none",
        active && activeStyles[colorScheme]
      )}
      title={label}
    >
      {icon}
      {/* Tooltip */}
      <div className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-black/90 border border-white/15 text-white/80 text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 font-medium tracking-wide z-[200] shadow-xl backdrop-blur-md">
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-black/90" />
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------
function Divider() {
  return <div className="h-px bg-white/[0.06] mx-1.5" />;
}

// ---------------------------------------------------------------------------
// FloatingPanel — rendered via portal-like fixed positioning
// ---------------------------------------------------------------------------
function FloatingPanel({
  anchorRef,
  open,
  children,
  title,
  accentColor = "amber",
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  children: React.ReactNode;
  title: string;
  accentColor?: "amber" | "cyan";
}) {
  const [top, setTop] = useState(0);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setTop(rect.top);
  }, [open, anchorRef]);

  const accentStyles = {
    amber: "text-amber-400 bg-amber-500/20 border-amber-500/30",
    cyan: "text-sky-400 bg-sky-500/20 border-sky-500/30",
  };
  const dotStyles = {
    amber: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
    cyan: "bg-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.6)]",
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: -8, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -8, scale: 0.97 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          style={{ top: Math.max(top, 96), left: 88 }}
          className="fixed w-64 rounded-2xl bg-[#030712]/96 backdrop-blur-3xl border border-white/12 shadow-[0_24px_64px_rgba(0,0,0,0.5)] z-[200] overflow-hidden"
        >
          {/* Header */}
          <div className={cn("flex items-center gap-2 px-4 py-3 border-b border-white/8", accentStyles[accentColor])}>
            <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotStyles[accentColor])} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</span>
          </div>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Toolbox props
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Toolbox component
// ---------------------------------------------------------------------------
export function Toolbox(props: ToolboxProps) {
  const {
    showLandmarks, setShowLandmarks,
    showThirds, toggleThirds,
    showFifths, toggleFifths,
    showDistancesSubmenu, toggleDistancesSubmenu,
    showBitemporal, toggleBitemporal,
    showBizygomatic, toggleBizygomatic,
    showBigonial, toggleBigonial,
    showMentonian, toggleMentonian,
    showFacialShape, toggleFacialShape,
    showRegions, toggleRegions,
    showRegionsSubmenu, toggleRegionsSubmenu,
    toggleSpecificRegion, setAllRegions, activeRegions,
    trichionOverrideY, resetTrichion,
    showAreasPanel, toggleAreasPanel,
    showEvaluationPanel, toggleEvaluationPanel,
  } = props;

  // Refs to anchor floating panels to specific buttons
  const distancesRef = useRef<HTMLDivElement>(null);
  const regionsRef   = useRef<HTMLDivElement>(null);

  const allDistancesOn = showBitemporal && showBizygomatic && showBigonial && showMentonian;

  const regionItems = [
    { group: "TERÇO SUPERIOR", items: [
      { id: "frontal",       label: "Frontal",          abbr: "F" },
      { id: "temporal_r",    label: "Temporal Dir",     abbr: "T-D" },
      { id: "temporal_l",    label: "Temporal Esq",     abbr: "T-E" },
      { id: "glabela",       label: "Glabela",          abbr: "G" },
    ]},
    { group: "TERÇO MÉDIO", items: [
      { id: "nariz",            label: "Nariz",             abbr: "N" },
      { id: "malar_lateral_r",  label: "Malar Lat Dir",     abbr: "ML-D" },
      { id: "malar_lateral_l",  label: "Malar Lat Esq",     abbr: "ML-E" },
      { id: "malar_medial_r",   label: "Malar Med Dir",     abbr: "MM-D" },
      { id: "malar_medial_l",   label: "Malar Med Esq",     abbr: "MM-E" },
      { id: "infrapalpebral_r", label: "Infrapalpebral Dir", abbr: "IP-D" },
      { id: "infrapalpebral_l", label: "Infrapalpebral Esq", abbr: "IP-E" },
    ]},
    { group: "TERÇO INFERIOR", items: [
      { id: "labial",       label: "Labial",         abbr: "Lb" },
      { id: "subnasal",     label: "Subnasal",        abbr: "SN" },
      { id: "perioral",     label: "Perioral",        abbr: "POr" },
      { id: "submalar_r",   label: "Submalar Dir",    abbr: "SM-D" },
      { id: "submalar_l",   label: "Submalar Esq",    abbr: "SM-E" },
      { id: "mandibular_r", label: "Mandibular Dir",  abbr: "Ma-D" },
      { id: "mandibular_l", label: "Mandibular Esq",  abbr: "Ma-E" },
      { id: "mento",        label: "Mento",           abbr: "Me" },
    ]},
  ];

  return (
    <>
      {/* ── Main pill sidebar ── */}
      <motion.div
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="fixed left-5 top-24 bottom-6 w-14 flex flex-col gap-2 p-2 rounded-2xl bg-[#000105]/50 backdrop-blur-2xl border border-white/6 z-[100]"
      >
        {/* Landmarks */}
        <ToolButton
          icon={showLandmarks ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          label={showLandmarks ? "Ocultar Landmarks" : "Mostrar Landmarks"}
          active={showLandmarks}
          onClick={() => setShowLandmarks(!showLandmarks)}
          colorScheme="cyan"
        />

        <Divider />

        {/* Section: Camadas */}
        <div className="flex flex-col gap-1.5">
          {/* Terços */}
          <ToolButton
            icon={
              <div className="relative flex items-center justify-center w-4 h-4">
                <AlignVerticalDistributeCenter className="w-4 h-4" />
                {showThirds && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-black/50" />}
              </div>
            }
            label="Terços Faciais"
            active={showThirds}
            onClick={toggleThirds}
            colorScheme="amber"
          />

          {/* Quintos */}
          <ToolButton
            icon={
              <div className="relative flex items-center justify-center w-4 h-4">
                <AlignHorizontalDistributeCenter className="w-4 h-4" />
                {showFifths && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-black/50" />}
              </div>
            }
            label="Quintos Faciais"
            active={showFifths}
            onClick={toggleFifths}
            colorScheme="amber"
          />

          {/* Distâncias */}
          <div ref={distancesRef as React.RefObject<HTMLDivElement>}>
            <ToolButton
              icon={
                <div className="relative flex items-center justify-center w-4 h-4">
                  <Ruler className="w-4 h-4" />
                  {(showBitemporal || showBizygomatic || showBigonial || showMentonian || showFacialShape) && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-400 ring-1 ring-black/50" />
                  )}
                </div>
              }
              label="Distâncias Faciais"
              active={showDistancesSubmenu || showBitemporal || showBizygomatic || showBigonial || showMentonian || showFacialShape}
              onClick={toggleDistancesSubmenu}
              colorScheme="amber"
            />
          </div>

          {/* Regiões Anatômicas */}
          <div ref={regionsRef as React.RefObject<HTMLDivElement>}>
            <ToolButton
              icon={
                <div className="relative flex items-center justify-center w-4 h-4">
                  <Layers className="w-4 h-4" />
                  {(showRegions || Object.values(activeRegions).some(v => v)) && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-black/50" />
                  )}
                </div>
              }
              label="Regiões Anatômicas"
              active={showRegionsSubmenu || showRegions || Object.values(activeRegions).some(v => v)}
              onClick={toggleRegionsSubmenu}
              colorScheme="amber"
            />
          </div>
        </div>

        <Divider />

        {/* Áreas Topográficas */}
        <ToolButton
          icon={<PieChart className="w-4 h-4" />}
          label="Áreas Topográficas"
          active={showAreasPanel}
          onClick={toggleAreasPanel}
          colorScheme="cyan"
        />

        {/* Avaliação Estética */}
        <ToolButton
          icon={<Target className="w-4 h-4" />}
          label="Avaliação Estética"
          active={showEvaluationPanel}
          onClick={toggleEvaluationPanel}
          colorScheme="amber"
        />

        <Divider />

        {/* Trichion reset — only when overridden */}
        <AnimatePresence>
          {trichionOverrideY != null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <ToolButton
                icon={<RotateCcw className="w-4 h-4" />}
                label="Resetar Trichion"
                active
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetTrichion(); }}
                colorScheme="green"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Floating panel: Distâncias ── */}
      <FloatingPanel anchorRef={distancesRef} open={showDistancesSubmenu} title="Distâncias Faciais" accentColor="amber">
        <div className="flex flex-col gap-0.5 p-2">
          {[
            { id: "bitemporal",  label: "Bitemporal",  active: showBitemporal,  toggle: toggleBitemporal },
            { id: "bizygomatic", label: "Bizigomática", active: showBizygomatic, toggle: toggleBizygomatic },
            { id: "bigonial",    label: "Bigonial",    active: showBigonial,    toggle: toggleBigonial },
            { id: "mentoniana",  label: "Mentoniana",  active: showMentonian,   toggle: toggleMentonian },
          ].map((dist) => (
            <button
              key={dist.id}
              type="button"
              onClick={(e) => { e.stopPropagation(); dist.toggle(); }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-150",
                dist.active
                  ? "bg-amber-500/15 text-white border border-amber-500/20"
                  : "text-white/55 hover:bg-white/6 hover:text-white/90 border border-transparent"
              )}
            >
              <span className="font-medium">Distância {dist.label}</span>
              {dist.active && <div className="w-2 h-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.7)] flex-shrink-0" />}
            </button>
          ))}

          {/* Forma Facial */}
          <div className="mt-1 pt-1.5 border-t border-white/6">
            <button
              disabled={!allDistancesOn}
              onClick={toggleFacialShape}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-150 border",
                showFacialShape
                  ? "bg-sky-500/15 text-sky-300 border-sky-500/25"
                  : "text-white/40 border-transparent disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-white/6 hover:enabled:text-white/80"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", showFacialShape ? "bg-sky-400" : "bg-white/20")} />
                <span className="font-bold text-xs uppercase tracking-wider">Forma Facial</span>
              </div>
              {!allDistancesOn && <Lock className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />}
            </button>
          </div>
        </div>
      </FloatingPanel>

      {/* ── Floating panel: Regiões Anatômicas ── */}
      <FloatingPanel anchorRef={regionsRef} open={showRegionsSubmenu} title="Regiões Anatômicas" accentColor="amber">
        {/* Quick actions */}
        <div className="flex gap-2 px-3 py-2.5 border-b border-white/6">
          <button
            onClick={() => setAllRegions(true)}
            className="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/20 transition-all"
          >
            Ativar Todas
          </button>
          <button
            onClick={() => setAllRegions(false)}
            className="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 border border-white/10 transition-all"
          >
            Limpar
          </button>
        </div>

        {/* Scrollable region list */}
        <div className="flex flex-col gap-0 max-h-[55vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {regionItems.map((group) => (
            <div key={group.group} className="mb-1">
              <div className="px-3 py-1.5 rounded-lg bg-white/4 mb-0.5">
                <span className="text-[9px] font-black text-white/35 uppercase tracking-[0.15em]">{group.group}</span>
              </div>
              {group.items.map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => toggleSpecificRegion(reg.id as any)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-150 border",
                    activeRegions[reg.id]
                      ? "bg-amber-500/15 text-white border-amber-500/20"
                      : "text-white/55 hover:bg-white/6 hover:text-white/90 border-transparent"
                  )}
                >
                  <span className="font-medium">{reg.label}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-white/25 font-mono tabular-nums">{reg.abbr}</span>
                    {activeRegions[reg.id] && (
                      <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Visualização Global */}
        <div className="px-3 pb-3 pt-1 border-t border-white/6">
          <button
            onClick={toggleRegions}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all duration-150",
              showRegions
                ? "bg-white/10 text-white border-white/15"
                : "text-white/40 hover:bg-white/6 hover:text-white/70 border-transparent"
            )}
          >
            Visualização Global
            {showRegions && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse flex-shrink-0" />}
          </button>
        </div>
      </FloatingPanel>
    </>
  );
}

// ---------------------------------------------------------------------------
// ZoomPanel
// ---------------------------------------------------------------------------
interface ZoomPanelProps {
  zoomPercent: number;
  setZoomPercent: (percent: number) => void;
}

export function ZoomPanel({ zoomPercent, setZoomPercent }: ZoomPanelProps) {
  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="fixed right-5 top-24 bottom-6 w-14 flex flex-col items-center justify-center p-2 rounded-2xl bg-[#000105]/50 backdrop-blur-2xl border border-white/6 z-[100]"
    >
      <div className="flex flex-col items-center gap-2 py-4 px-1 rounded-2xl bg-white/5 border border-white/5 w-full">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setZoomPercent(zoomPercent + 25); }}
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
            style={{ writingMode: "bt-lr" as any, appearance: "slider-vertical" as any }}
          />
        </div>

        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setZoomPercent(zoomPercent - 25); }}
          className="p-1.5 hover:text-primary text-white/40 transition-all hover:scale-110 active:scale-90"
          title="Diminuir"
        >
          <Minus className="w-5 h-5" />
        </button>

        <div className="h-px bg-white/10 w-8 my-2" />

        <div className="flex flex-col gap-2">
          {[100, 200, 400].map((p) => (
            <button
              key={p}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setZoomPercent(p); }}
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
