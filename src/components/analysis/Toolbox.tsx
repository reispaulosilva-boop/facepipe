"use client";

import React from "react";
import { 
  Eye, 
  EyeOff, 
  Plus, 
  Minus 
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

function ToolButton({ icon, label, active, onClick }: ToolButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, x: 2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
        "bg-white/5 border border-white/10 hover:border-white/20",
        active && "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
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
  zoomPercent: number;
  setZoomPercent: (percent: number) => void;
}

export function Toolbox({
  showLandmarks,
  setShowLandmarks,
  zoomPercent,
  setZoomPercent
}: ToolboxProps) {
  return (
    <motion.aside 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 p-3 rounded-2xl bg-[#030712]/40 backdrop-blur-xl border border-white/5 z-50 shadow-2xl"
    >
      {/* Visual State Toggle */}
      <div className="flex flex-col gap-2">
        <ToolButton 
          icon={showLandmarks ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />} 
          label={showLandmarks ? "Ocultar Landmarks" : "Mostrar Landmarks"}
          active={showLandmarks}
          onClick={() => setShowLandmarks(!showLandmarks)}
        />
      </div>

      <div className="h-px bg-white/5 mx-2" />

      {/* Zoom Precise Controls Column */}
      <div className="flex flex-col items-center gap-3 py-2 px-1 rounded-xl bg-white/5 border border-white/5">
        <button 
          onClick={() => setZoomPercent(zoomPercent + 25)}
          className="p-1 hover:text-cyan-400 text-white/40 transition-colors"
          title="Aumentar"
        >
          <Plus className="w-4 h-4" />
        </button>
        
        <div className="relative h-40 w-1.5 bg-white/10 rounded-full overflow-hidden flex flex-col justify-end">
          <motion.div 
            animate={{ height: `${Math.min(zoomPercent / 5, 100)}%` }}
            className="w-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
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
           className="p-1 hover:text-cyan-400 text-white/40 transition-colors"
           title="Diminuir"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="flex flex-col gap-1 mt-1">
          {[75, 100, 150, 200].map(p => (
            <button
              key={p}
              onClick={() => setZoomPercent(p)}
              className={cn(
                "text-[7px] font-bold px-1 py-0.5 rounded transition-all",
                zoomPercent >= p - 5 && zoomPercent <= p + 5 
                  ? "bg-cyan-500 text-black" 
                  : "text-white/30 hover:text-white"
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
