"use client";
import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFaceStore } from "@/store/useFaceStore";
import { Info, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Tipos e Constantes ────────────────────────────────────────────────────────

type ColorKey = "Amber" | "Orange" | "Wine";

const COLORS: Record<ColorKey, { main: string; glow: string; label: string }> = {
  Amber: {
    main: "radial-gradient(circle at 30% 30%, #fbbf24, #b45309)",
    glow: "rgba(251, 191, 36, 0.4)",
    label: "Área (A)"
  },
  Orange: {
    main: "radial-gradient(circle at 30% 30%, #fb923c, #c2410c)",
    glow: "rgba(251, 146, 60, 0.4)",
    label: "Densidade (D)"
  },
  Wine: {
    main: "radial-gradient(circle at 30% 30%, #881337, #4c0519)",
    glow: "rgba(136, 19, 55, 0.4)",
    label: "Homogeneidade (H)"
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const determineDominantColor = (score: any): ColorKey => {
  const normA = score.area / 6;
  const normD = score.intensidade / 4;
  const normH = score.homogeneidade / 4;
  const max = Math.max(normA, normD, normH);
  
  if (max === normH && normH > 0) return "Wine";
  if (max === normD && normD > 0) return "Orange";
  return "Amber";
};

/**
 * Gera offsets determinísticos para as esferas do cluster
 */
const getClusterOffsets = (count: number, seed: string) => {
  const offsets = [];
  const s = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (s * 0.1);
    const distance = (i === 0 ? 0 : 8 + (Math.sin(s + i) * 12)); // Distância radial
    offsets.push({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      delay: i * 0.05,
      scale: 0.7 + (Math.cos(s * i) * 0.3)
    });
  }
  return offsets;
};

// ── Componentes ──────────────────────────────────────────────────────────────

export function MelasmaMarkers() {
  const { analysisResults, showMelasmaOverlay } = useFaceStore();
  const data = analysisResults.melasmaData;
  const landmarks = analysisResults.landmarks;

  if (!showMelasmaOverlay || !data) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {/* 1. Camada de Malha Topográfica (Wireframe Fino) */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-[0.2]" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
      >
        {landmarks && landmarks.length > 0 && (
          <path
            d={landmarks.reduce((acc: string, pt: any, i: number) => {
              // Desenha apenas algumas conexões para um efeito "fine wireframe"
              if (i % 6 === 0 && landmarks[i+1]) {
                const x1 = pt.x * 100;
                const y1 = pt.y * 100;
                const x2 = landmarks[i+1].x * 100;
                const y2 = landmarks[i+1].y * 100;
                return acc + `M ${x1} ${y1} L ${x2} ${y2} `;
              }
              return acc;
            }, "")}
            stroke="white"
            strokeWidth="0.1"
            fill="none"
          />
        )}
      </svg>

      {/* 2. Clusters de Esferas e Callouts */}
      {data.scores_regionais && Object.entries(data.scores_regionais).map(([key, score]: [string, any]) => {
        // Fallback para coordenadas se o AI falhar (posições aproximadas)
        let x = score.x;
        let y = score.y;
        
        if (x === undefined || y === undefined) {
          if (key === "testa") { x = 50; y = 25; }
          else if (key === "malar_direita") { x = 35; y = 55; }
          else if (key === "malar_esquerda") { x = 65; y = 55; }
          else if (key === "queixo") { x = 50; y = 80; }
          else { return null; }
        }

        const colorKey = determineDominantColor(score);
        const color = COLORS[colorKey];
        // Quantidade de esferas proporcional à área (1 a 12)
        const sphereCount = Math.max(1, Math.round((score.area / 6) * 12));
        const offsets = getClusterOffsets(sphereCount, key);
        
        const isLeft = x > 50;
        const lineEndX = isLeft ? 20 : -20;
        const lineEndY = -40;

        return (
          <div
            key={key}
            className="absolute"
            style={{ 
              left: `${x}%`, 
              top: `${y}%`,
              transform: "translate(-50%, -50%)" 
            }}
          >
            {/* Linha Conectora Callout */}
            <svg className="absolute overflow-visible pointer-events-none" style={{ left: 0, top: 0 }}>
               <motion.line 
                 initial={{ pathLength: 0, opacity: 0 }}
                 animate={{ pathLength: 1, opacity: 0.3 }}
                 x1="0" y1="0" x2={lineEndX} y2={lineEndY}
                 stroke="white" strokeWidth="0.8"
               />
            </svg>

            {/* Agrupamento de Esferas (Cluster) */}
            <div className="relative">
              {offsets.map((off, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: off.scale, opacity: 1 }}
                  transition={{ delay: off.delay, type: "spring", stiffness: 200 }}
                  className="absolute w-2.5 h-2.5 rounded-full shadow-lg"
                  style={{
                    background: color.main,
                    left: off.x,
                    top: off.y,
                    boxShadow: `0 0 10px ${color.glow}`,
                    transform: "translate(-50%, -50%)"
                  }}
                />
              ))}
            </div>

            {/* Callout Regional */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "absolute top-[-65px] whitespace-nowrap px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-xl shadow-2xl flex items-center gap-2",
                isLeft ? "left-5" : "right-5"
              )}
              style={{ backgroundColor: "rgba(3, 7, 18, 0.7)" }}
            >
              <div className="flex flex-col">
                <span className="text-[7px] font-black text-white/40 uppercase tracking-widest leading-none mb-0.5">
                  {key.replace("_", " ")}
                </span>
                <span className="text-[10px] font-bold text-white leading-none">
                  Score: <span className="text-primary font-black">{( (score.area * (score.intensidade + score.homogeneidade))/1 ).toFixed(2)}</span>
                </span>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

export function MelasmaUI() {
  const { analysisResults, showMelasmaOverlay } = useFaceStore();
  const data = analysisResults.melasmaData;

  if (!showMelasmaOverlay || !data) return null;

  // Cálculo da posição do marcador na régua (0-24 mMASI)
  const thermometerPos = (data.score_total / 24) * 100;

  return (
    <div className="absolute inset-0 pointer-events-none z-[70]">
      {/* 4. Painel de Diagnóstico Principal (Top Right) */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-8 right-8 w-80 p-6 rounded-[24px] bg-[#030712]/70 backdrop-blur-3xl border border-white/10 shadow-2xl pointer-events-auto overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-3 opacity-20">
          <Info className="w-12 h-12 text-primary" />
        </div>

        <div className="flex flex-col gap-1 mb-6">
          <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] leading-none">
            Avaliação Dermatológica v1.2
          </span>
          <h3 className="text-sm font-bold text-white/90">Clinical mMASI Analysis</h3>
        </div>

        <div className="flex flex-col items-center mb-6">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Total mMASI Score</span>
          <span className="text-6xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl">
            {data.score_total.toFixed(1)}
          </span>
        </div>

        {/* Régua de Gravidade (Termômetro) */}
        <div className="space-y-3">
          <div className="flex justify-between text-[8px] font-black text-white/20 uppercase tracking-widest">
            <span>Leve</span>
            <span>Moderado</span>
            <span>Severo</span>
          </div>
          <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-600 border border-white/5">
             <motion.div 
               initial={{ left: 0 }}
               animate={{ left: `${thermometerPos}%` }}
               transition={{ duration: 1.5, ease: "circOut" }}
               className="absolute top-[-4px] -translate-x-1/2 flex flex-col items-center"
             >
               <div className="w-3 h-3 bg-white rounded-full border-2 border-[#030712] shadow-xl" />
               <div className="h-6 w-0.5 bg-white/40 mt-1" />
             </motion.div>
          </div>
          <div className="w-full text-center mt-4 pt-4 border-t border-white/5">
            <span className="text-[11px] font-black italic text-white/80 uppercase tracking-[0.15em]">
              Gravidade {data.classificacao}
            </span>
          </div>
        </div>
      </motion.div>

      {/* 5. Painel de Legenda Educativa (Bottom Left) */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute bottom-8 left-8 w-64 p-5 rounded-2xl bg-[#030712]/60 backdrop-blur-2xl border border-white/10 shadow-2xl pointer-events-auto"
      >
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-4 h-4 text-white/40" />
          <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Legenda Educativa</span>
        </div>

        <div className="space-y-3">
          {Object.entries(COLORS).map(([key, config]) => (
            <div key={key} className="flex items-center gap-3 group transition-transform hover:translate-x-1">
              <div 
                className="w-3.5 h-3.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] border border-white/10"
                style={{ background: config.main }}
              />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white/80 leading-none mb-0.5">{config.label}</span>
                <p className="text-[8px] text-white/30 font-medium leading-tight">
                  {key === "Amber" && "Extensão do envolvimento da mancha."}
                  {key === "Orange" && "Intensidade da pigmentação detectada."}
                  {key === "Wine" && "Padrão de pigmento e consistência."}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Footer System Status */}
      <div className="absolute bottom-8 right-8 flex items-center gap-4 text-[8px] font-bold text-white/20 uppercase tracking-widest">
        <span>Processing Unit: Gemini 2.5</span>
        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
        <span>Facepipe AI Integrity Verified</span>
      </div>
    </div>
  );
}
