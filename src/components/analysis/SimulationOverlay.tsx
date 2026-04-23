"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { MoveHorizontal, Smartphone, Maximize2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  before: string;
  after: string;
  onClose: () => void;
  className?: string;
}

export function SimulationOverlay({ before, after, onClose, className }: Props) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-3xl p-8",
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-5xl aspect-square md:aspect-video flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Simulação de Resultado</h2>
              <p className="text-xs text-white/40 font-medium font-ui tracking-wider uppercase">Visualização Preditiva IA • Imagen 3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-widest"
          >
            Fechar Visualização
          </button>
        </div>

        {/* Comparison Container */}
        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onTouchMove={handleMouseMove}
          className="relative flex-1 rounded-[2rem] border border-white/10 overflow-hidden cursor-col-resize shadow-[0_64px_128px_rgba(0,0,0,0.8)]"
        >
          {/* After image (Simulated) */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${after})` }}
          />

          {/* Before image (Original) */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${before})`,
              clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
            }}
          />

          {/* Slider line */}
          <div 
            className="absolute top-0 bottom-0 w-px bg-white/40 z-30"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl">
               <MoveHorizontal className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Labels */}
          <div className="absolute top-8 left-8 z-40 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full">
            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest italic">Antes</span>
          </div>
          <div className="absolute top-8 right-8 z-40 bg-amber-500/40 backdrop-blur-md border border-amber-500/30 px-4 py-1.5 rounded-full">
            <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Simulação</span>
          </div>
        </div>
        
        {/* Helper info */}
        <div className="grid grid-cols-3 gap-6">
           <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-primary">
                 <Smartphone className="w-3.5 h-3.5" />
                 <span className="text-[10px] font-black uppercase tracking-wider">Mobile Ready</span>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed">Arraste para comparar os resultados projetados.</p>
           </div>
           <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-amber-400">
                 <Zap className="w-3.5 h-3.5" />
                 <span className="text-[10px] font-black uppercase tracking-wider">Motor Imagen 3</span>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed">Inpainting generativo de alta fidelidade clínica.</p>
           </div>
           <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                 <Maximize2 className="w-3.5 h-3.5" />
                 <span className="text-[10px] font-black uppercase tracking-wider">Alta Resolução</span>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed">Preservação de texturas e anatomia original.</p>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
