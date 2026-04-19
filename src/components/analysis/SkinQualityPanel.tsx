"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Target, Droplets, Sparkles, AlertCircle, Fingerprint, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  landmarks: any[];
  onClose: () => void;
  className?: string;
}

interface SkinMetric {
  id: string;
  label: string;
  icon: React.ReactNode;
  score: number; // 0-100
  status: "Ótimo" | "Moderado" | "Crítico";
  color: string;
}

export function SkinQualityPanel({ landmarks, onClose, className }: Props) {
  // Estado local para simular a resposta da API do Render (por enquanto)
  const [metrics] = useState<SkinMetric[]>([
    { id: "acne", label: "Acne/Poros", icon: <Fingerprint className="w-4 h-4" />, score: 85, status: "Ótimo", color: "text-emerald-400" },
    { id: "melasma", label: "Melasma/Manchas", icon: <Sparkles className="w-4 h-4" />, score: 42, status: "Moderado", color: "text-amber-400" },
    { id: "wrinkles", label: "Rugas/Sulcos", icon: <Activity className="w-4 h-4" />, score: 68, status: "Moderado", color: "text-sky-400" },
    { id: "oiliness", label: "Oleosidade", icon: <Droplets className="w-4 h-4" />, score: 92, status: "Ótimo", color: "text-emerald-400" },
    { id: "rosacea", label: "Sensibilidade/Rosácea", icon: <AlertCircle className="w-4 h-4" />, score: 15, status: "Crítico", color: "text-rose-400" },
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "w-[320px] flex flex-col rounded-2xl bg-[#030712]/90 backdrop-blur-3xl border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.6)] z-50 overflow-hidden transition-all duration-500",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-white/90 tracking-tight leading-none">Qualidade da Pele</h3>
            <p className="text-[10px] text-white/40 mt-1 font-medium">Análise via OpenCV e IA</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/10 text-white/30 hover:text-white/70 transition-premium"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
        {metrics.map((metric) => (
          <div key={metric.id} className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className={cn("p-1.5 rounded-md bg-white/5 border border-white/10 group-hover:border-white/20 transition-all", metric.color)}>
                  {metric.icon}
                </div>
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">{metric.label}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className={cn("text-[10px] font-black uppercase", metric.color)}>
                  {metric.score}%
                </span>
                <span className="text-[8px] text-white/30 font-bold tracking-widest">{metric.status}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metric.score}%` }}
                transition={{ duration: 0.8, ease: "circOut", delay: 0.2 }}
                className={cn(
                  "h-full rounded-full transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                  metric.score > 70 ? "bg-emerald-500" : metric.score > 30 ? "bg-amber-500" : "bg-rose-500"
                )}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="shrink-0 border-t border-white/8 px-5 py-4 bg-white/[0.02]">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <p className="text-[10px] text-white/50 leading-relaxed italic">
            Processamento realizado via Render API (FastAPI) com modelos especializados.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
