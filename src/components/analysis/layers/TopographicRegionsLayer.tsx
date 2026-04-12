import React, { memo } from "react";
import { motion } from "framer-motion";
import { Landmark, TopographicRegion } from "@/utils/facialAnalysis";

const REGION_STYLES: Record<string, { fill: string; stroke: string; label: string }> = {
  frontal:          { fill: "rgba(34, 197, 94, 0.3)",   stroke: "rgba(34, 197, 94, 0.8)",   label: "F"    },
  glabela:          { fill: "rgba(249, 115, 22, 0.45)", stroke: "rgba(249, 115, 22, 0.9)",  label: "G"    },
  temporal_r:       { fill: "rgba(234, 179, 8, 0.3)",   stroke: "rgba(234, 179, 8, 0.8)",   label: "T-D"  },
  temporal_l:       { fill: "rgba(234, 179, 8, 0.3)",   stroke: "rgba(234, 179, 8, 0.8)",   label: "T-E"  },
  nariz:            { fill: "rgba(6, 182, 212, 0.35)",  stroke: "rgba(6, 182, 212, 0.8)",   label: "N"    },
  malar_lateral_r:  { fill: "rgba(168, 85, 247, 0.3)",  stroke: "rgba(168, 85, 247, 0.8)",  label: "ML-D" },
  malar_lateral_l:  { fill: "rgba(168, 85, 247, 0.3)",  stroke: "rgba(168, 85, 247, 0.8)",  label: "ML-E" },
  malar_medial_r:   { fill: "rgba(236, 72, 153, 0.3)",  stroke: "rgba(236, 72, 153, 0.8)",  label: "MM-D" },
  malar_medial_l:   { fill: "rgba(236, 72, 153, 0.3)",  stroke: "rgba(236, 72, 153, 0.8)",  label: "MM-E" },
  infrapalpebral_r: { fill: "rgba(255, 255, 255, 0.3)", stroke: "rgba(255, 255, 255, 0.8)", label: "IP-D" },
  infrapalpebral_l: { fill: "rgba(255, 255, 255, 0.3)", stroke: "rgba(255, 255, 255, 0.8)", label: "IP-E" },
  labial:           { fill: "rgba(239, 68, 68, 0.35)",  stroke: "rgba(239, 68, 68, 0.9)",   label: ""     },
  subnasal:         { fill: "rgba(34, 197, 94, 0.3)",   stroke: "rgba(34, 197, 94, 0.9)",   label: "SN"   },
  perioral:         { fill: "rgba(255, 255, 255, 0.3)", stroke: "rgba(255, 255, 255, 0.8)", label: "POr"  },
  submalar_r:       { fill: "rgba(251, 191, 36, 0.22)", stroke: "rgba(251, 191, 36, 0.7)",  label: "SM-D" },
  submalar_l:       { fill: "rgba(251, 191, 36, 0.22)", stroke: "rgba(251, 191, 36, 0.7)",  label: "SM-E" },
  mandibular_r:     { fill: "rgba(37, 99, 235, 0.3)",   stroke: "rgba(37, 99, 235, 0.8)",   label: "Ma-D" },
  mandibular_l:     { fill: "rgba(37, 99, 235, 0.3)",   stroke: "rgba(37, 99, 235, 0.8)",   label: "Ma-E" },
  mento:            { fill: "rgba(168, 85, 247, 0.3)",  stroke: "rgba(168, 85, 247, 0.8)",  label: "Me"   },
};
const DEFAULT_STYLE = { fill: "rgba(251, 191, 36, 0.08)", stroke: "rgba(251, 191, 36, 0.4)", label: "" };

const TRICHION_CURVE_INDICES = [103, 67, 109, 10, 338, 297, 332];

interface Props {
  topographicRegions: TopographicRegion[];
  dimensions: { width: number; height: number };
  showRegions: boolean;
  activeRegions: Record<string, boolean>;
  trichionOverrideY: number | null;
  landmarks: Landmark[];
}

export const TopographicRegionsLayer = memo(function TopographicRegionsLayer({
  topographicRegions, dimensions, showRegions, activeRegions, trichionOverrideY, landmarks,
}: Props) {
  const { width: W, height: H } = dimensions;

  const visible = showRegions
    ? topographicRegions
    : topographicRegions.filter(r => activeRegions[r.name.toLowerCase()] === true || activeRegions[r.name] === true);

  if (!visible.length) return null;

  const S = Math.max(W, H) / 1000;

  return (
    <motion.g
      className="topographic-regions-layer"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {visible.map((region, i) => {
        if (!region.points?.length) return null;

        const style = REGION_STYLES[region.name.toLowerCase()] ?? DEFAULT_STYLE;

        const projected = region.indices.map((idx, pointIdx) => {
          const p = region.points[pointIdx];
          if (!p) return null;
          if (trichionOverrideY !== null && TRICHION_CURVE_INDICES.includes(idx)) {
            const lm10 = landmarks[10];
            if (lm10) return { ...p, y: p.y + (trichionOverrideY - lm10.y) };
          }
          return p;
        }).filter(Boolean) as Landmark[];

        const pts = projected.length ? projected : region.points;
        const d   = pts.map((p, j) => `${j === 0 ? "M" : "L"} ${p.x * W} ${p.y * H}`).join(" ") + " Z";

        const cx = (pts.reduce((a, p) => a + p.x, 0) / pts.length) * W;
        const cy = (pts.reduce((a, p) => a + p.y, 0) / pts.length) * H;

        const fontSize    = S * 6.8;
        const pad         = S * 2.8;
        const labelWidth  = style.label.length * (fontSize * 0.7) + pad * 2;
        const labelHeight = fontSize + pad * 1.5;

        return (
          <motion.g key={region.name + i}>
            <path d={d} fill={style.fill} fillRule="evenodd" stroke={style.stroke} strokeWidth="1.5" strokeDasharray="3,1" style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.2))" }} className="pointer-events-auto transition-all duration-300" />
            <g className="pointer-events-none select-none">
              <rect x={cx - labelWidth / 2} y={cy - labelHeight / 2} width={labelWidth} height={labelHeight} rx={S * 2} fill="rgba(0,0,0,0.75)" />
              <text x={cx} y={cy} fill={style.stroke} fontSize={fontSize} fontWeight="bold" textAnchor="middle" dominantBaseline="central" fontFamily="monospace">{style.label}</text>
            </g>
          </motion.g>
        );
      })}
    </motion.g>
  );
});
