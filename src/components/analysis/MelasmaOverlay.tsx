"use client";

import React from "react";
import { motion } from "framer-motion";
import { useFaceStore } from "@/store/useFaceStore";
import { Info, AlertCircle } from "lucide-react";

export function MelasmaMarkers() {
  const { analysisResults, showMelasmaOverlay } = useFaceStore();
  const data = analysisResults.melasmaData;

  if (!showMelasmaOverlay || !data) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {Object.entries(data.scores_regionais).map(([key, score]) => (
        <motion.div
          key={key}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute"
          style={{ 
            left: `${score.x}%`, 
            top: `${score.y}%`, 
            transform: "translate(-50%, -50%)" 
          }}
        >
          <div className="relative flex items-center justify-center">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.1, 0.3]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute w-16 h-16 rounded-full bg-primary/30"
            />
            <div className="w-10 h-10 rounded-full border-2 border-primary/60 bg-primary/20 backdrop-blur-md flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.3)]">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
            
            <div className="absolute bottom-full mb-3 px-3 py-1 rounded-full bg-[#030712]/90 border border-white/20 backdrop-blur-xl text-[9px] font-bold text-white uppercase whitespace-nowrap shadow-2xl">
              <span className="text-primary mr-1">mMASI:</span> 
              {(score.area * (score.intensidade + score.homogeneidade)).toFixed(1)}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function MelasmaUI() {
  const { analysisResults, showMelasmaOverlay } = useFaceStore();
  const data = analysisResults.melasmaData;

  if (!showMelasmaOverlay || !data) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[70]">
      {/* Painel de Resultados (Top Right) */}
      <motion.div
        initial={{ x: 30, opacity: 0, scale: 0.9 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        exit={{ x: 30, opacity: 0, scale: 0.9 }}
        className="absolute top-8 right-8 w-72 p-6 rounded-[24px] bg-[#030712]/70 backdrop-blur-3xl border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[64px]" />
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Clinical Report</span>
            <h3 className="text-lg font-bold text-white/90">Análise Melasma</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Info className="w-4 h-4 text-white/40" />
          </div>
        </div>
        
        <div className="mb-6 relative z-10 px-4 py-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center">
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Modified MASI Score</span>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-extrabold text-white tracking-tighter">
              {data.score_total.toFixed(1)}
            </span>
          </div>
          
          <div className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary">
            <AlertCircle className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-widest">{data.classificacao}</span>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest block px-1">Métricas por Região</span>
          
          {Object.entries(data.scores_regionais).map(([key, score]) => (
            <div key={key} className="group bg-white/[0.02] hover:bg-white/[0.05] p-3 rounded-xl border border-white/[0.05] transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-white/60 capitalize font-bold leading-none">
                  {key.replace("_", " ")}
                </span>
                <div className="flex gap-2 text-[9px] font-bold uppercase">
                  <span className="text-white/30">A:<span className="text-white/60">{score.area}</span></span>
                  <span className="text-white/30">D:<span className="text-white/60">{score.intensidade}</span></span>
                  <span className="text-white/30">H:<span className="text-white/60">{score.homogeneidade}</span></span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(score.intensidade / 4) * 100}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-primary/40 to-primary"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-white/5 relative z-10 flex items-center justify-between">
          <span className="text-[9px] text-white/20 font-medium">Facepipe Clinical Assistant</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] text-emerald-500/80 font-bold uppercase">Verified by AI</span>
          </div>
        </div>
      </motion.div>

      {/* Legenda (Bottom Left) */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="absolute bottom-8 left-8 flex items-center gap-6"
      >
        <div className="p-4 rounded-2xl bg-[#030712]/60 backdrop-blur-xl border border-white/10 flex flex-col gap-3 pointer-events-auto">
          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest text-center">Referência Visual</span>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary/40 border border-primary/60" />
              <span className="text-[10px] text-white/60 font-medium">Hiperpigmentação</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-white/10 border border-white/20" />
              <span className="text-[10px] text-white/60 font-medium">Tecido Saudável</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
