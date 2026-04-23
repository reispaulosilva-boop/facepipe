import React, { memo } from "react";
import { Landmark, DistanceMeasurement, calcAngle } from "@/utils/facialAnalysis";

interface Props {
  landmarks: Landmark[];
  dimensions: { width: number; height: number };
  showBitemporal:  boolean;
  showBizygomatic: boolean;
  showBigonial:    boolean;
  showMentonian:   boolean;
  showInterpupillary: boolean;
  showInteralar: boolean;
  showIntercommissural: boolean;
  showFacialShape: boolean;
  showFacialContour: boolean;
  bitemporalData:  DistanceMeasurement | null;
  bizygomaticData: DistanceMeasurement | null;
  bigonialData:    DistanceMeasurement | null;
  mentonianData:   DistanceMeasurement | null;
  interpupillaryData: DistanceMeasurement | null;
  interalarData:      DistanceMeasurement | null;
  intercommissuralData: DistanceMeasurement | null;
}

export const DistancesLayer = memo(function DistancesLayer({
  landmarks, dimensions,
  showBitemporal, showBizygomatic, showBigonial, showMentonian, 
  showInterpupillary, showInteralar, showIntercommissural, showFacialShape, showFacialContour,
  bitemporalData, bizygomaticData, bigonialData, mentonianData,
  interpupillaryData, interalarData, intercommissuralData,
}: Props) {
  if (!landmarks.length || !dimensions.width) return null;

  const { width: W, height: H } = dimensions;
  const S = Math.max(W, H) / 1000;

  // ── Distances ────────────────────────────────────────────────────────────────

  const lines: Array<{ p1: Landmark; p2: Landmark; data: DistanceMeasurement; color: string }> = [];
  if (showBitemporal  && bitemporalData)  lines.push({ p1: landmarks[21],   p2: landmarks[251],  data: bitemporalData,  color: "#38BDF8" }); 
  if (showBizygomatic && bizygomaticData) lines.push({ p1: landmarks[234],  p2: landmarks[454],  data: bizygomaticData, color: "#A3E635" }); 
  if (showBigonial    && bigonialData)    lines.push({ p1: landmarks[172],  p2: landmarks[397],  data: bigonialData,    color: "#FBBF24" }); 
  if (showMentonian   && mentonianData)   lines.push({ p1: landmarks[148],  p2: landmarks[377],  data: mentonianData,   color: "#A3E635" }); 
  
  if (showInterpupillary && interpupillaryData) lines.push({ p1: landmarks[468], p2: landmarks[473], data: interpupillaryData, color: "#818CF8" }); 
  if (showInteralar      && interalarData)      lines.push({ p1: landmarks[129], p2: landmarks[358], data: interalarData,      color: "#F87171" }); 
  if (showIntercommissural && intercommissuralData) lines.push({ p1: landmarks[61],  p2: landmarks[291], data: intercommissuralData, color: "#F472B6" }); 

  // ── Facial Shape ─────────────────────────────────────────────────────────────
  let shapeElement: React.ReactElement | null = null;
  if (showFacialShape) {
    const pts = [
      landmarks[21], landmarks[234], landmarks[172], landmarks[148],
      landmarks[377], landmarks[397], landmarks[454], landmarks[251],
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
              fill="rgba(0,255,255,0.08)" 
              stroke="#00FFFF" 
              strokeWidth={S * 4} 
              strokeLinejoin="round" 
              strokeLinecap="round" 
              style={{ filter: "drop-shadow(0 0 12px rgba(0,255,255,0.6))" }} 
            />
          </g>

          {/* Animated corner dots, Angles and Arc Symbols */}
          {pts.map((p, i) => {
            // Calcula o ângulo no vértice atual i
            const prev = pts[(i - 1 + pts.length) % pts.length];
            const next = pts[(i + 1) % pts.length];
            const angle = calcAngle(prev, p, next);

            const px = p.x * W;
            const py = p.y * H;

            // Vetores para os pontos vizinhos
            const vPrev = { x: prev.x * W - px, y: prev.y * H - py };
            const vNext = { x: next.x * W - px, y: next.y * H - py };

            // Ângulos polares dos vetores
            const angPrev = Math.atan2(vPrev.y, vPrev.x);
            const angNext = Math.atan2(vNext.y, vNext.x);

            // Diferença de ângulo para determinar o arco interno
            let diff = angNext - angPrev;
            while (diff < -Math.PI) diff += 2 * Math.PI;
            while (diff > Math.PI) diff -= 2 * Math.PI;

            // Raio do arco do símbolo
            const arcR = S * 15;
            const startX = px + Math.cos(angPrev) * arcR;
            const startY = py + Math.sin(angPrev) * arcR;
            const endX = px + Math.cos(angNext) * arcR;
            const endY = py + Math.sin(angNext) * arcR;

            // Flag de sweep (sentido do arco)
            const sweepFlag = diff > 0 ? 1 : 0;
            const largeArcFlag = 0;

            const arcPath = `M ${startX} ${startY} A ${arcR} ${arcR} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;

            // Posição da label (bisatriz)
            const bisectorAng = angPrev + diff / 2;
            const labelDist = S * 32;
            const lx = px + Math.cos(bisectorAng) * labelDist;
            const ly = py + Math.sin(bisectorAng) * labelDist;

            return (
              <g key={i}>
                {/* Símbolo do Arco */}
                <path
                  d={arcPath}
                  fill="none"
                  stroke="#00FFFF"
                  strokeWidth={S * 1.5}
                  opacity="0.6"
                  className="animate-region-appear"
                  style={{ "--region-delay": `${0.3 + i * 0.05}s` } as React.CSSProperties}
                />
                
                <circle 
                  cx={px} 
                  cy={py} 
                  r={S * 4} 
                  fill="#00FFFF"
                  className="animate-dot-pop"
                  style={{
                    "--dot-r": `${S * 4}px`,
                    "--dot-delay": `${0.1 + i * 0.08}s`,
                    filter: "drop-shadow(0 0 8px rgba(0,255,255,0.5))"
                  } as React.CSSProperties}
                />
                
                <text
                  x={lx}
                  y={ly}
                  fill="#00FFFF"
                  fontSize={S * 8.5}
                  fontWeight="bold"
                  textAnchor="middle"
                  className="animate-label-slide-in"
                  style={{
                    "--label-delay": `${0.5 + i * 0.08}s`,
                    textShadow: "0 0 4px rgba(0,0,0,0.9)",
                  } as React.CSSProperties}
                >
                  {angle}°
                </text>
              </g>
            );
          })}
        </g>
      );
    }
  }

  // ── Facial Contour (Black Dashed) ──────────────────────────────────────────
  let contourElement: React.ReactElement | null = null;
  if (showFacialContour) {
    // Indices for lower facial outline (ear to ear via jaw, excluding forehead)
    const contourIndices = [
      21, 162, 127, 234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 
      152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454, 356, 389, 251
    ];
    const pts = contourIndices.map(idx => landmarks[idx]).filter(Boolean);
    
    if (pts.length > 1) {
      const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x * W} ${p.y * H}`).join(" ");
      contourElement = (
        <g className="facial-contour-layer">
          <path 
            d={d}
            fill="none"
            stroke="#000000"
            strokeWidth={S * 3}
            strokeDasharray={`${S * 8},${S * 4}`}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="animate-region-appear"
            style={{ 
              filter: "drop-shadow(0 0 4px rgba(0,0,0,0.4))",
              "--region-delay": "0.1s" 
            } as React.CSSProperties}
          />
        </g>
      );
    }
  }

  if (!lines.length && !shapeElement && !contourElement) return null;

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
            {/* Animated distance line with clinical glow */}
            <g
              className="animate-line-sweep-h"
              style={{
                "--sweep-duration": "0.65s",
                "--sweep-delay": `${drawDelay}s`,
              } as React.CSSProperties}
            >
              <line 
                x1={x1} y1={midY} x2={x2} y2={midY} 
                stroke={line.color} strokeWidth={S * 3.5} 
                strokeDasharray={`${S * 10},${S * 4}`} 
                opacity="1" 
                style={{ filter: `drop-shadow(0 0 6px ${line.color}80)` }}
              />
            </g>

            {/* Animated endpoint circles */}
            <circle 
              cx={x1} 
              cy={midY} 
              r={S * 5} 
              fill={line.color}
              className="animate-dot-pop"
              style={{
                "--dot-r": `${S * 5}px`,
                "--dot-delay": `${drawDelay + 0.4}s`,
                filter: `drop-shadow(0 0 8px ${line.color})`
              } as React.CSSProperties}
            />
            <circle 
              cx={x2} 
              cy={midY} 
              r={S * 5} 
              fill={line.color}
              className="animate-dot-pop"
              style={{
                "--dot-r": `${S * 5}px`,
                "--dot-delay": `${drawDelay + 0.5}s`,
                filter: `drop-shadow(0 0 8px ${line.color})`
              } as React.CSSProperties}
            />

            {/* Animated label with Abbreviation */}
            <g
              className="animate-label-slide-in"
              style={{
                "--label-delay": `${labelDelay}s`,
              } as React.CSSProperties}
            >
              <text 
                x={(x1 + x2) / 2} y={midY - S * 12} 
                fill="#FFFFFF" fontSize={S * 11} textAnchor="middle" 
                fontWeight="900" fontFamily="monospace" 
                style={{ textShadow: "0 0 6px rgba(0,0,0,0.9), 1px 1px 0 rgba(0,0,0,1)" }}
              >
                {line.data.mm}mm
              </text>
            </g>
          </g>
        );
      })}
       {shapeElement}
       {contourElement}
    </g>
  );
});
