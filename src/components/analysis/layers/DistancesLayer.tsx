import React, { memo } from "react";
import { Landmark, DistanceMeasurement } from "@/utils/facialAnalysis";

interface Props {
  landmarks: Landmark[];
  dimensions: { width: number; height: number };
  showBitemporal:  boolean;
  showBizygomatic: boolean;
  showBigonial:    boolean;
  showMentonian:   boolean;
  showFacialShape: boolean;
  bitemporalData:  DistanceMeasurement | null;
  bizygomaticData: DistanceMeasurement | null;
  bigonialData:    DistanceMeasurement | null;
  mentonianData:   DistanceMeasurement | null;
}

export const DistancesLayer = memo(function DistancesLayer({
  landmarks, dimensions,
  showBitemporal, showBizygomatic, showBigonial, showMentonian, showFacialShape,
  bitemporalData, bizygomaticData, bigonialData, mentonianData,
}: Props) {
  if (!landmarks.length || !dimensions.width) return null;

  const { width: W, height: H } = dimensions;
  const S = Math.max(W, H) / 1000;

  // ── Distances ────────────────────────────────────────────────────────────────
  const lines: Array<{ p1: Landmark; p2: Landmark; data: DistanceMeasurement; color: string }> = [];
  if (showBitemporal  && bitemporalData)  lines.push({ p1: landmarks[54],  p2: landmarks[284], data: bitemporalData,  color: "#A3E635" });
  if (showBizygomatic && bizygomaticData) lines.push({ p1: landmarks[234], p2: landmarks[454], data: bizygomaticData, color: "#A3E635" });
  if (showBigonial    && bigonialData)    lines.push({ p1: landmarks[172], p2: landmarks[397], data: bigonialData,    color: "#A3E635" });
  if (showMentonian   && mentonianData)   lines.push({ p1: landmarks[148], p2: landmarks[377], data: mentonianData,   color: "#A3E635" });

  // ── Facial Shape ─────────────────────────────────────────────────────────────
  let shapeElement: React.ReactElement | null = null;
  if (showFacialShape) {
    const pts = [
      landmarks[54], landmarks[234], landmarks[172], landmarks[148],
      landmarks[377], landmarks[397], landmarks[454], landmarks[284],
    ];
    if (pts.every(Boolean)) {
      const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x * W} ${p.y * H}`).join(" ") + " Z";
      shapeElement = (
        <g className="facial-shape-layer">
          {/* Animated path fill + stroke for shape */}
          <g
            className="animate-region-appear"
            style={{
              "--region-delay": "0.1s",
            } as React.CSSProperties}
          >
            <path 
              d={d} 
              fill="rgba(0,255,255,0.05)" 
              stroke="#00FFFF" 
              strokeWidth={S * 3.5} 
              strokeLinejoin="round" 
              strokeLinecap="round" 
              style={{ filter: "drop-shadow(0 0 10px rgba(0,255,255,0.4))" }} 
            />
          </g>

          {/* Animated corner dots */}
          {pts.map((p, i) => (
            <circle 
              key={i}
              cx={p.x * W} 
              cy={p.y * H} 
              r={S * 4.5} 
              fill="#00FFFF"
              className="animate-dot-pop"
              style={{
                "--dot-r": `${S * 4.5}px`,
                "--dot-delay": `${0.1 + i * 0.08}s`,
              } as React.CSSProperties}
            />
          ))}
        </g>
      );
    }
  }

  if (!lines.length && !shapeElement) return null;

  return (
    <g className="distances-layer">
      {lines.map((line, i) => {
        const x1   = line.p1.x * W; const y1 = line.p1.y * H;
        const x2   = line.p2.x * W; const y2 = line.p2.y * H;
        const midY = (y1 + y2) / 2;
        const drawDelay = i * 0.15;
        const labelDelay = i * 0.15 + 0.5;

        return (
          <g key={i}>
            {/* Animated distance line */}
            <g
              className="animate-line-sweep-h"
              style={{
                "--sweep-duration": "0.65s",
                "--sweep-delay": `${drawDelay}s`,
              } as React.CSSProperties}
            >
              <line x1={x1} y1={midY} x2={x2} y2={midY} stroke={line.color} strokeWidth={S * 2.5} strokeDasharray={`${S * 8},${S * 5}`} opacity="0.8" />
            </g>

            {/* Animated endpoint circles */}
            <circle 
              cx={x1} 
              cy={midY} 
              r={S * 4} 
              fill={line.color}
              className="animate-dot-pop"
              style={{
                "--dot-r": `${S * 4}px`,
                "--dot-delay": `${drawDelay + 0.4}s`,
              } as React.CSSProperties}
            />
            <circle 
              cx={x2} 
              cy={midY} 
              r={S * 4} 
              fill={line.color}
              className="animate-dot-pop"
              style={{
                "--dot-r": `${S * 4}px`,
                "--dot-delay": `${drawDelay + 0.5}s`,
              } as React.CSSProperties}
            />

            {/* Animated label */}
            <g
              className="animate-label-slide-in"
              style={{
                "--label-delay": `${labelDelay}s`,
              } as React.CSSProperties}
            >
              <text x={(x1 + x2) / 2} y={midY - S * 10} fill="#FFFFFF" fontSize={S * 10} textAnchor="middle" fontWeight="bold" fontFamily="monospace" style={{ textShadow: "0 0 4px rgba(0,0,0,0.8)" }}>
                {line.data.label}: {line.data.mm}mm
              </text>
            </g>
          </g>
        );
      })}
      {shapeElement}
    </g>
  );
});
