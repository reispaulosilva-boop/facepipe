"use client";

import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import type {
  SkinAnalysisResult,
  SkinAnalysisOverlayPoint,
  SkinAnalysisOverlayRegion,
} from "@/lib/prompts/skinAnalysis";

interface Props {
  result: SkinAnalysisResult;
  dimensions: { width: number; height: number };
  analysisType: string;
  landmarks?: any[]; // Added for anatomical filtering
}

// ── Sphere colour palette ────────────────────────────────────────────────────

type SphereColors = {
  highlight: string;
  mid: string;
  deep: string;
  glow: string;
};

const SPHERE_PALETTE: Record<string, SphereColors> = {
  red:    { highlight: "rgba(255,210,210,0.92)", mid: "rgba(239,68,68,0.88)",   deep: "rgba(185,28,28,0.70)",   glow: "rgba(239,68,68,0.50)"   },
  amber:  { highlight: "rgba(255,240,185,0.92)", mid: "rgba(245,158,11,0.88)",  deep: "rgba(161,98,7,0.70)",    glow: "rgba(245,158,11,0.45)"  },
  rose:   { highlight: "rgba(255,205,220,0.92)", mid: "rgba(244,63,94,0.88)",   deep: "rgba(190,18,60,0.70)",   glow: "rgba(244,63,94,0.45)"   },
  violet: { highlight: "rgba(235,215,255,0.92)", mid: "rgba(139,92,246,0.88)",  deep: "rgba(91,33,182,0.70)",   glow: "rgba(139,92,246,0.45)"  },
  blue:   { highlight: "rgba(195,225,255,0.92)", mid: "rgba(59,130,246,0.88)",  deep: "rgba(29,78,216,0.70)",   glow: "rgba(59,130,246,0.45)"  },
  slate:  { highlight: "rgba(205,215,228,0.92)", mid: "rgba(100,116,139,0.88)", deep: "rgba(51,65,85,0.70)",    glow: "rgba(100,116,139,0.38)" },
  teal:   { highlight: "rgba(180,245,250,0.92)", mid: "rgba(20,184,166,0.88)",  deep: "rgba(15,118,110,0.70)",  glow: "rgba(20,184,166,0.45)"  },
};

function paletteKey(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("pustula") || l.includes("papula"))                              return "red";
  if (l.includes("comedao"))                                                       return "amber";
  if (l.includes("telang") || l.includes("eritema") || l.includes("rosacea"))      return "rose";
  if (l.includes("ptose") || l.includes("flacidez") || l.includes("mandibular")) return "violet";
  if (l.includes("ruga") || l.includes("sulco") || l.includes("linha"))           return "blue";
  if (l.includes("poro") || l.includes("textura"))                                return "slate";
  if (l.includes("melasma") || l.includes("hpi") || l.includes("mancha") || l.includes("efelides")) return "amber";
  if (l.includes("oleosidade") || l.includes("zona"))                             return "teal";
  return "teal";
}

// ── Label formatting ─────────────────────────────────────────────────────────

function fmtLabel(label: string): string {
  return label.replace(/_/g, " ").toUpperCase();
}

// ── Region label with leader line ────────────────────────────────────────────

interface RegionLabelProps {
  region: SkinAnalysisOverlayRegion;
  W: number;
  H: number;
}

const RegionLabel = memo(function RegionLabel({ region, W, H }: RegionLabelProps) {
  const cx = region.x * W;
  const cy = region.y * H;

  const isLeft   = region.x < 0.5;
  const marginX  = W * 0.045;
  const fontSize = Math.max(W, H) / 1000 * 6;
  const padX     = fontSize * 1.1;
  const padY     = fontSize * 0.7;

  const text     = fmtLabel(region.label);
  const approxW  = text.length * fontSize * 0.56 + padX * 2;
  const labelH   = fontSize + padY * 2;

  // Label anchor
  const lx = isLeft ? marginX : W - marginX;
  const ly = Math.max(labelH, Math.min(H - labelH, cy));

  // Badge rect top-left
  const bx = isLeft ? lx : lx - approxW;
  const by = ly - labelH / 2;

  // Leader line end on the badge edge
  const lineEndX = isLeft ? lx + approxW * 0.08 : lx - approxW * 0.08;

  // Bezier control point — midway, pulled toward the label side
  const qcx = cx + (lx - cx) * 0.55;
  const qcy = cy + (ly - cy) * 0.4;

  return (
    <g>
      {/* Subtle anchor dot at region centre */}
      <circle cx={cx} cy={cy} r={Math.max(W, H) / 1000 * 2.2} fill="rgba(255,255,255,0.55)" />

      {/* Leader line — dashed, very light */}
      <path
        d={`M ${cx} ${cy} Q ${qcx} ${qcy} ${lineEndX} ${ly}`}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={Math.max(W, H) / 1000 * 0.85}
        strokeDasharray={`${Math.max(W, H) / 1000 * 4} ${Math.max(W, H) / 1000 * 3}`}
        strokeLinecap="round"
      />

      {/* Badge backdrop — dark glass, no opacity on the face */}
      <rect
        x={bx} y={by}
        width={approxW} height={labelH}
        rx={Math.max(W, H) / 1000 * 3.5}
        fill="rgba(3,7,18,0.60)"
        stroke="rgba(255,255,255,0.09)"
        strokeWidth={Math.max(W, H) / 1000 * 0.55}
      />

      {/* Label text */}
      <text
        x={isLeft ? lx + padX : lx - padX}
        y={ly}
        fill="rgba(255,255,255,0.80)"
        fontSize={fontSize}
        fontFamily="'Courier New', Courier, monospace"
        fontWeight="600"
        letterSpacing={Math.max(W, H) / 1000 * 0.9}
        textAnchor={isLeft ? "start" : "end"}
        dominantBaseline="middle"
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {text}
      </text>
    </g>
  );
});

// ── Sphere lesion marker ─────────────────────────────────────────────────────

interface SpherePointProps {
  point: SkinAnalysisOverlayPoint;
  W: number;
  H: number;
  gradId: string;
  palette: SphereColors;
}

const SpherePoint = memo(function SpherePoint({ point, W, H, gradId, palette }: SpherePointProps) {
  const S  = Math.max(W, H) / 1000;
  const px = point.x * W;
  const py = point.y * H;
  const r  = S * (point.severity === "intensa" ? 7 : point.severity === "moderada" ? 5.5 : 4);
  const breathe = point.severity === "intensa";

  return (
    <g>
      {/* Diffuse ambient glow — animated for high severity */}
      {breathe ? (
        <motion.circle
          cx={px} cy={py}
          animate={{ r: [r * 2.1, r * 2.8, r * 2.1], opacity: [0.30, 0.10, 0.30] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          fill={palette.glow}
        />
      ) : (
        <circle cx={px} cy={py} r={r * 2.1} fill={palette.glow} opacity={0.20} />
      )}

      {/* Crisp outer ring */}
      <circle
        cx={px} cy={py} r={r * 1.55}
        fill="none"
        stroke={palette.mid}
        strokeWidth={S * 0.6}
        opacity={0.40}
      />

      {/* Glassmorphism sphere body — radial gradient */}
      <circle
        cx={px} cy={py} r={r}
        fill={`url(#${gradId})`}
      />

      {/* Hard-edge definition ring */}
      <circle
        cx={px} cy={py} r={r}
        fill="none"
        stroke={palette.deep}
        strokeWidth={S * 0.45}
        opacity={0.65}
      />

      {/* Primary specular highlight — upper-left */}
      <circle
        cx={px - r * 0.26} cy={py - r * 0.28} r={r * 0.33}
        fill="rgba(255,255,255,0.72)"
        style={{ pointerEvents: "none" }}
      />

      {/* Micro secondary highlight */}
      <circle
        cx={px - r * 0.16} cy={py - r * 0.18} r={r * 0.12}
        fill="rgba(255,255,255,0.95)"
        style={{ pointerEvents: "none" }}
      />
    </g>
  );
});

// ── Main overlay ─────────────────────────────────────────────────────────────

export const SkinAnalysisOverlay = memo(function SkinAnalysisOverlay(props: Props) {
  const { result, dimensions } = props;
  const { width: W, height: H } = dimensions;
  const { regions, points } = result.overlay;

  // ── Anatomical Filter: Only allow points/regions within the face boundary ──
  // Using MediaPipe contour indices (silhouette) to define the valid area
  // These are standard MediaPipe Face Mesh silhouette indices
  const FACE_CONTOUR_INDICES = [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 10
  ];

  // Helper to check if a point is inside the face polygon (Ray-casting algorithm)
  const isPointInFace = (x: number, y: number) => {
    const lms = props.landmarks;
    if (!lms || lms.length === 0) return true; 
    
    const validIndices = FACE_CONTOUR_INDICES.filter(idx => lms[idx]);
    if (validIndices.length < 10) return true;

    let inside = false;
    for (let i = 0, j = validIndices.length - 1; i < validIndices.length; j = i++) {
      const xi = lms[validIndices[i]].x;
      const yi = lms[validIndices[i]].y;
      const xj = lms[validIndices[j]].x;
      const yj = lms[validIndices[j]].y;
      
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // We only filter if landmarks are available and look correct
  const filteredPoints = useMemo(() => {
    if (!props.landmarks || props.landmarks.length === 0) return points;
    return points.filter(p => isPointInFace(p.x, p.y));
  }, [points, props.landmarks]);

  const filteredRegions = useMemo(() => {
    if (!props.landmarks || props.landmarks.length === 0) return regions;
    return regions.filter(r => isPointInFace(r.x, r.y));
  }, [regions, props.landmarks]);

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55 }}
    >
      <defs>
        {/* Radial gradients — one per palette key */}
        {Object.entries(SPHERE_PALETTE).map(([id, c]) => (
          <radialGradient key={id} id={`rg-${id}`} cx="32%" cy="27%" r="73%">
            <stop offset="0%"   stopColor={c.highlight} />
            <stop offset="28%"  stopColor={c.highlight} stopOpacity="0.75" />
            <stop offset="62%"  stopColor={c.mid} />
            <stop offset="100%" stopColor={c.deep} stopOpacity="0.82" />
          </radialGradient>
        ))}
      </defs>

      {/* ── Region labels with leader lines — no face-covering fills ──────── */}
      {filteredRegions.map((region: SkinAnalysisOverlayRegion, i: number) => (
        <RegionLabel key={`region-${i}`} region={region} W={W} H={H} />
      ))}

      {/* ── 3D glassmorphism sphere markers ────────────────────────────────── */}
      {filteredPoints.map((point: SkinAnalysisOverlayPoint, i: number) => {
        const key   = paletteKey(point.label);
        const pal   = SPHERE_PALETTE[key];
        return (
          <SpherePoint
            key={`point-${i}`}
            point={point}
            W={W} H={H}
            gradId={`rg-${key}`}
            palette={pal}
          />
        );
      })}
    </motion.g>
  );
});
