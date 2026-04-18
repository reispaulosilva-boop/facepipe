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

  const faceLeft  = (lm[234]?.x ?? 0.1) * W;
  const faceRight = (lm[454]?.x ?? 0.9) * W;
  const span      = faceRight - faceLeft;
  const xStart    = faceLeft  - span * 0.15;
  const xEnd      = faceRight + span * 0.15;

  const color      = "#A3E635";
  const strokeW    = S * 2.5;
  const dashArr    = `${S * 8},${S * 5}`;
  const dotR       = S * 4;

  const lines = [
    { y: y_trichion },
    { y: y_glabela },
    { y: y_subnasale },
    { y: y_menton },
  ];

  const thirds = [
    { label: thirdsData.upperThird.label,  mm: thirdsData.upperThird.mm,  midY: (y_trichion + y_glabela)   / 2 },
    { label: thirdsData.middleThird.label, mm: thirdsData.middleThird.mm, midY: (y_glabela   + y_subnasale) / 2 },
    { label: thirdsData.lowerThird.label,  mm: thirdsData.lowerThird.mm,  midY: (y_subnasale + y_menton)   / 2 },
  ];

  return (
    <g className="thirds-layer">
      {lines.map((line, i) => {
        const sweepDelay = i * 0.1;
        const lineCol = (i === 0 && isManual) ? "#4ADE80" : color;

        return (
          <g key={i}>
            {/* Main horizontal line */}
            <g
              className="animate-line-sweep-h"
              style={{
                "--sweep-duration": "0.7s",
                "--sweep-delay": `${sweepDelay}s`,
              } as React.CSSProperties}
            >
              <line 
                x1={xStart} y1={line.y} x2={xEnd} y2={line.y} 
                stroke={lineCol} strokeWidth={strokeW} strokeDasharray={dashArr} opacity="0.8" 
              />
            </g>

            {/* Endpoint dots */}
            <circle 
              cx={xStart} cy={line.y} r={dotR} fill={lineCol} 
              className="animate-dot-pop"
              style={{ "--dot-r": `${dotR}px`, "--dot-delay": `${sweepDelay + 0.4}s` } as React.CSSProperties}
            />
            <circle 
              cx={xEnd} cy={line.y} r={dotR} fill={lineCol} 
              className="animate-dot-pop"
              style={{ "--dot-r": `${dotR}px`, "--dot-delay": `${sweepDelay + 0.5}s` } as React.CSSProperties}
            />

            {/* Trichion adjust handle (invisible hit area) */}
            {i === 0 && showThirds && (
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
                    x={(xStart + xEnd) / 2 - S * 15} y={line.y - S * 6}
                    width={S * 30} height={S * 12} rx={S * 3}
                    fill="rgba(255,255,255,0.05)"
                    stroke={lineCol}
                    strokeWidth={S * 1}
                  />
                </g>
              </>
            )}
          </g>
        );
      })}

      {/* Labels */}
      {thirds.map((third, i) => {
        const labelDelay = (i + 1) * 0.15 + 0.5;
        return (
          <g 
            key={`label-${i}`}
            className="animate-label-slide-in"
            style={{ "--label-delay": `${labelDelay}s` } as React.CSSProperties}
          >
            <text 
              x={xEnd + S * 10} y={third.midY} 
              fill="#FFFFFF" fontSize={S * 10} fontWeight="bold" fontFamily="monospace"
              style={{ textShadow: "0 0 4px rgba(0,0,0,0.8)" }}
            >
              {third.label}: {third.mm}mm
            </text>
          </g>
        );
      })}
    </g>
  );
});
