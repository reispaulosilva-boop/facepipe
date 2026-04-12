import React, { memo } from "react";
import { Landmark, ThirdsResult } from "@/utils/facialAnalysis";
import { AMBER, AMBER_SOLID, AMBER_LABEL_BG } from "./tokens";

interface Props {
  thirdsData: ThirdsResult;
  landmarks: Landmark[];
  dimensions: { width: number; height: number };
  trichionOverrideY: number | null;
  showThirds: boolean;
  onTrichionPointerDown: (e: React.PointerEvent) => void;
  onTrichionPointerMove: (e: React.PointerEvent) => void;
  onTrichionPointerUp:   (e: React.PointerEvent) => void;
}

export const ThirdsLayer = memo(function ThirdsLayer({
  thirdsData, landmarks, dimensions, trichionOverrideY,
  showThirds, onTrichionPointerDown, onTrichionPointerMove, onTrichionPointerUp,
}: Props) {
  const { width: W, height: H } = dimensions;
  const lm = landmarks;

  const trichionLm = lm[10];
  const glabela    = lm[168];
  const subnasale  = lm[2];
  const menton     = lm[152];
  if (!trichionLm || !glabela || !subnasale || !menton) return null;

  const S        = Math.max(W, H) / 1000;
  const isManual = trichionOverrideY != null;

  const y_trichion  = (trichionOverrideY ?? trichionLm.y) * H;
  const y_glabela   = glabela.y   * H;
  const y_subnasale = subnasale.y * H;
  const y_menton    = menton.y    * H;

  const faceLeft  = Math.min(lm[234]?.x ?? 0.1, lm[454]?.x ?? 0.1) * W;
  const faceRight = Math.max(lm[234]?.x ?? 0.9, lm[454]?.x ?? 0.9) * W;
  const span      = faceRight - faceLeft;
  const xStart    = faceLeft  - span * 0.15;
  const xEnd      = faceRight + span * 0.15;

  const strokeW  = S * 2;
  const dashArr  = `${S * 10},${S * 6}`;
  const tickLen  = S * 8;
  const tickW    = S * 2.5;
  const labelW   = S * 130;
  const labelH   = S * 36;
  const labelRx  = S * 5;
  const fontName = S * 11;
  const fontMm   = S * 10;
  const padX     = S * 10;

  const lines = [
    { y: y_trichion,  label: null },
    { y: y_glabela,   label: { name: thirdsData.upperThird.label,  mm: thirdsData.upperThird.mm,  midY: (y_trichion + y_glabela)   / 2 } },
    { y: y_subnasale, label: { name: thirdsData.middleThird.label, mm: thirdsData.middleThird.mm, midY: (y_glabela   + y_subnasale) / 2 } },
    { y: y_menton,    label: { name: thirdsData.lowerThird.label,  mm: thirdsData.lowerThird.mm,  midY: (y_subnasale + y_menton)   / 2 } },
  ];

  return (
    <g className="thirds-layer">
      {lines.map((line, i) => {
        const isTrichion = i === 0;
        const lineColor  = isTrichion && isManual ? "rgba(74, 222, 128, 0.5)" : AMBER;
        const lineSolid  = isTrichion && isManual ? "rgba(74, 222, 128, 0.9)" : AMBER_SOLID;
        return (
          <g key={i}>
            <line x1={xStart} y1={line.y} x2={xEnd} y2={line.y} stroke={lineColor} strokeWidth={strokeW} strokeDasharray={dashArr} />
            <line x1={xStart} y1={line.y} x2={xEnd} y2={line.y} stroke={lineSolid} strokeWidth={strokeW * 0.4} />
            <line x1={xStart} y1={line.y - tickLen} x2={xStart} y2={line.y + tickLen} stroke={lineSolid} strokeWidth={tickW} />
            <line x1={xEnd}   y1={line.y - tickLen} x2={xEnd}   y2={line.y + tickLen} stroke={lineSolid} strokeWidth={tickW} />

            {isTrichion && showThirds && (
              <>
                <line
                  x1={xStart} y1={line.y} x2={xEnd} y2={line.y}
                  stroke="transparent" strokeWidth={S * 20}
                  style={{ cursor: "ns-resize", pointerEvents: "auto" }}
                  onPointerDown={onTrichionPointerDown}
                  onPointerMove={onTrichionPointerMove}
                  onPointerUp={onTrichionPointerUp}
                />
                <g style={{ pointerEvents: "none" }}>
                  <rect
                    x={(xStart + xEnd) / 2 - S * 20} y={line.y - S * 8}
                    width={S * 40} height={S * 16} rx={S * 3}
                    fill={isManual ? "rgba(74, 222, 128, 0.15)" : "rgba(251, 191, 36, 0.15)"}
                    stroke={isManual ? "rgba(74, 222, 128, 0.5)" : AMBER}
                    strokeWidth={S * 0.8}
                  />
                  {[-1, 0, 1].map(offset => (
                    <line
                      key={offset}
                      x1={(xStart + xEnd) / 2 - S * 8} y1={line.y + offset * S * 3.5}
                      x2={(xStart + xEnd) / 2 + S * 8} y2={line.y + offset * S * 3.5}
                      stroke={isManual ? "rgba(74, 222, 128, 0.6)" : "rgba(251, 191, 36, 0.6)"}
                      strokeWidth={S * 0.8} strokeLinecap="round"
                    />
                  ))}
                </g>
              </>
            )}
          </g>
        );
      })}

      {lines.slice(1).map((line, i) => {
        if (!line.label) return null;
        const { name, mm, midY } = line.label;
        const lx = xEnd + padX;
        return (
          <g key={`label-${i}`}>
            <rect x={lx} y={midY - labelH / 2} width={labelW} height={labelH} rx={labelRx} fill={AMBER_LABEL_BG} stroke={AMBER} strokeWidth={S} />
            <text x={lx + padX} y={midY - fontMm * 0.2} fill={AMBER_SOLID} fontSize={fontName} fontFamily="'SF Mono','Fira Code',monospace" fontWeight="600" letterSpacing="0.04em">{name}</text>
            <text x={lx + padX} y={midY + fontMm * 1.2} fill="rgba(251,191,36,0.7)" fontSize={fontMm} fontFamily="'SF Mono','Fira Code',monospace">{mm} mm</text>
          </g>
        );
      })}
    </g>
  );
});
