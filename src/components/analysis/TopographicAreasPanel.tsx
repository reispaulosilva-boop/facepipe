"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sigma } from "lucide-react";
import { TopographicAreaResult, TopographicGroup } from "@/utils/facialAnalysis";
import { cn } from "@/lib/utils";

const GROUP_ORDER: TopographicGroup[] = ["Superior", "Médio", "Inferior"];

const GROUP_COLOR: Record<TopographicGroup, string> = {
  Superior: "text-emerald-400",
  Médio:    "text-sky-400",
  Inferior: "text-amber-400",
};

const GROUP_BAR: Record<TopographicGroup, string> = {
  Superior: "bg-emerald-500",
  Médio:    "bg-sky-500",
  Inferior: "bg-amber-500",
};

interface Props {
  areas: TopographicAreaResult[];
  pxPerMm: number | null;
  onClose: () => void;
  className?: string;
}

export function TopographicAreasPanel({ areas, pxPerMm, onClose, className }: Props) {
  const calibrated = (pxPerMm ?? 0) > 0;

  const totalPx2  = useMemo(() => areas.reduce((s, r) => s + r.areaPx2, 0),  [areas]);
  const totalMm2  = useMemo(() => areas.reduce((s, r) => s + r.areaMm2, 0),  [areas]);
  const maxPercent = useMemo(() => Math.max(...areas.map(r => r.percent)), [areas]);

  const grouped = useMemo(() => {
    const map = new Map<TopographicGroup, TopographicAreaResult[]>();
    for (const g of GROUP_ORDER) map.set(g, []);
    for (const r of areas) {
      map.get(r.group)?.push(r);
    }
    return map;
  }, [areas]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "w-[300px] flex flex-col rounded-2xl bg-[#030712]/85 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-40 overflow-hidden transition-all duration-500",
        className
      )}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0 bg-white/5 transition-premium">
        <div className="flex items-center gap-2.5">
          <Sigma className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-heading text-white/90 tracking-tight">Análise Volumétrica</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/10 text-white/30 hover:text-white/70 transition-premium cursor-ptr"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Calibration notice */}
      {!calibrated && (
        <div className="mx-3 mt-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
          <p className="text-[9px] text-amber-400/80 leading-relaxed">
            Sem calibração por íris — mm² indisponível. Apenas px² e % são exibidos.
          </p>
        </div>
      )}

      {/* Scrollable table */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 custom-scrollbar">
        {GROUP_ORDER.map((group) => {
          const rows = grouped.get(group) ?? [];
          if (!rows.length) return null;

          const groupTotal = rows.reduce((s, r) => s + r.percent, 0);

          return (
            <div key={group}>
              {/* Group header */}
              <div className="flex items-center justify-between mb-1.5">
                <span className={cn("text-[8px] font-bold uppercase tracking-widest", GROUP_COLOR[group])}>
                  Terço {group}
                </span>
                <span className="text-[8px] text-white/25 font-mono">
                  {groupTotal.toFixed(1)}%
                </span>
              </div>

              {/* Rows */}
              <div className="space-y-1">
                {rows.map((r) => (
                  <div key={r.name} className="group">
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/4 transition-colors">
                      {/* Code badge */}
                      <span className={cn(
                        "shrink-0 text-[8px] font-bold font-mono w-[34px] text-right",
                        GROUP_COLOR[group]
                      )}>
                        {r.code}
                      </span>

                      {/* Label */}
                      <span className="flex-1 text-[9px] text-white/55 truncate leading-none">
                        {r.label}
                      </span>

                      {/* Numeric values */}
                      <div className="shrink-0 flex flex-col items-end gap-0.5">
                        {calibrated && (
                          <span className="text-[8px] text-white/35 font-mono">
                            {r.areaMm2.toFixed(0)} mm²
                          </span>
                        )}
                        <span className="text-[9px] text-white/65 font-mono font-semibold">
                          {r.percent.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Inline bar */}
                    <div className="mx-2 h-[2px] rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(r.percent / maxPercent) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
                        className={cn("h-full rounded-full opacity-60", GROUP_BAR[group])}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer — Total */}
      <div className="shrink-0 border-t border-white/6 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-white/30" />
          <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Total</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          {calibrated && (
            <span className="text-[8px] text-white/30 font-mono">
              {totalMm2.toFixed(0)} mm²
            </span>
          )}
          <span className="text-[10px] text-white/60 font-mono font-bold">
            {totalPx2.toFixed(0)} px²
          </span>
        </div>
      </div>
    </motion.div>
  );
}
