"use client";

import React from "react";
import { motion } from "framer-motion";
import { X, Target, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FaceEvaluationResult } from "@/types/facial-evaluation";

interface FacialEvaluationPanelProps {
  evaluation: FaceEvaluationResult;
  onClose: () => void;
  className?: string;
}

export function FacialEvaluationPanel({ evaluation, onClose, className }: FacialEvaluationPanelProps) {
  const { score, breakdown, target_name } = evaluation;

  // Helper to determine color based on deviation
  const getDeviationColor = (deviation: number) => {
    const absDev = Math.abs(deviation);
    if (absDev <= 1.0) return "text-emerald-400";
    if (absDev <= 2.0) return "text-amber-400";
    return "text-rose-400";
  };

  const getDeviationIcon = (deviation: number) => {
    const absDev = Math.abs(deviation);
    if (absDev <= 1.5) return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
    return <AlertCircle className="w-3 h-3 text-amber-400" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className={cn(
        "w-80 bg-[#000105]/60 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col",
        className
      )}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="font-ui font-bold text-sm text-white/90 uppercase tracking-widest">
            Aderência Geométrica
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        {/* Main Score Hexagon/Circle */}
        <div className="flex flex-col items-center justify-center py-4 bg-primary/5 rounded-2xl border border-primary/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
          
          <div className="relative">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="42"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-white/5"
              />
              <motion.circle
                cx="48"
                cy="48"
                r="42"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={264}
                initial={{ strokeDashoffset: 264 }}
                animate={{ strokeDashoffset: 264 - (264 * score) / 100 }}
                fill="transparent"
                strokeLinecap="round"
                className="text-primary shadow-[0_0_15px_rgba(14,165,233,0.5)]"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-ui font-black text-white leading-none">
                {Math.round(score)}
              </span>
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                Score
              </span>
            </div>
          </div>
          
          <div className="mt-4 flex flex-col items-center">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-tight">
              Vetor Alvo:
            </span>
            <span className="text-xs font-ui font-bold text-sky-300">
              {target_name}
            </span>
          </div>
        </div>

        {/* Feature Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
              Métricas de Desvio
            </h4>
            <div className="group relative">
              <Info className="w-3 h-3 text-white/20 cursor-help" />
              <div className="absolute bottom-full right-0 mb-2 w-48 p-2 rounded bg-black/90 border border-white/10 text-[9px] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                O desvio é medido em unidades de tolerância (σ). 
                Valores próximos a 0 indicam máxima aderência ao padrão.
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(breakdown).map(([key, data]) => (
              <div key={key} className="space-y-1.5 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/8 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/70">
                    {key.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {getDeviationIcon(data.deviation ?? 0)}
                    <span className={cn("text-[10px] font-mono font-bold", getDeviationColor(data.deviation ?? 0))}>
                      {(data.deviation ?? 0) > 0 ? "+" : ""}{(data.deviation ?? 0).toFixed(2)}σ
                    </span>
                  </div>
                </div>
                
                {/* Visual Scale */}
                <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="absolute left-1/2 top-0 h-full w-px bg-white/20 z-10" />
                  <motion.div
                    initial={{ width: 0, left: "50%" }}
                    animate={{ 
                      width: `${Math.min(Math.abs(data.deviation ?? 0) * 10, 50)}%`,
                      left: (data.deviation ?? 0) >= 0 ? "50%" : `${50 - Math.min(Math.abs(data.deviation ?? 0) * 10, 50)}%`
                    }}
                    className={cn(
                      "absolute h-full rounded-full transition-colors",
                      (data.deviation ?? 0) >= 0 ? "bg-primary/60" : "bg-amber-400/60"
                    )}
                  />
                </div>
                
                <div className="flex justify-between text-[8px] font-bold text-white/20 uppercase tracking-tighter">
                  <span>Atual: {(data.actual ?? 0).toFixed(2)}</span>
                  <span>Ideal: {(data.target ?? 0).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / Disclaimer */}
      <div className="p-4 bg-white/5 border-t border-white/10">
        <p className="text-[9px] text-white/30 italic leading-snug">
          * Aderência geométrica baseada em referências Miss Universo. 
          Este score não define valor ou estética individual absoluta.
        </p>
      </div>
    </motion.div>
  );
}
