import React, { memo } from "react";
import { Landmark, FifthsResult } from "@/utils/facialAnalysis";
import { AMBER, AMBER_SOLID, AMBER_LABEL_BG } from "./tokens";

interface Props {
  fifthsData: FifthsResult;
  landmarks: Landmark[];
  dimensions: { width: number; height: number };
}

export const FifthsLayer = memo(function FifthsLayer({ fifthsData, landmarks, dimensions }: Props) {
  const { width: W, height: H } = dimensions;
  const lm = landmarks;

  const limiteR = lm[454]; const exoR = lm[33];  const endoR = lm[133];
  const endoL   = lm[362]; const exoL = lm[263]; const limiteL = lm[234];
  const trichion = lm[10]; const menton = lm[152];

  if (!limiteR || !exoR || !endoR || !endoL || !exoL || !limiteL || !trichion || !menton) return null;

  const S = Math.max(W, H) / 1000;

  const x_limiteR = limiteR.x * W; const x_exoR  = exoR.x  * W; const x_endoR = endoR.x * W;
  const x_endoL   = endoL.x  * W; const x_exoL   = exoL.x  * W; const x_limiteL = limiteL.x * W;

  const yTop = trichion.y * H - H * 0.03;
  const yBot = menton.y   * H + H * 0.03;

  const strokeW = S * 2;  const dashArr = `${S * 10},${S * 6}`;
  const tickLen = S * 6;  const tickW   = S * 2.5;
  const labelH  = S * 22; const labelRx = S * 3; const fontSz = S * 8;
  const labelY1 = yBot + S * 12;
  const labelY2 = yBot + S * 12 + labelH + S * 6;

  const verticals = [x_limiteR, x_exoR, x_endoR, x_endoL, x_exoL, x_limiteL];
  const segments = [
    { x1: x_limiteR, x2: x_exoR,    data: fifthsData.outerRight },
    { x1: x_exoR,    x2: x_endoR,   data: fifthsData.rightEye   },
    { x1: x_endoR,   x2: x_endoL,   data: fifthsData.interalar  },
    { x1: x_endoL,   x2: x_exoL,    data: fifthsData.leftEye    },
    { x1: x_exoL,    x2: x_limiteL, data: fifthsData.outerLeft  },
  ];

  return (
    <g className="fifths-layer">
      {verticals.map((x, i) => {
        // Stagger delays: left to right movement
        const sweepDelay = i * 0.1;

        return (
          <g key={i}>
            {/* Animated main line with vertical sweep */}
            <g
              className="animate-line-sweep-v"
              style={{
                "--sweep-duration": "0.6s",
                "--sweep-delay": `${sweepDelay}s`,
              } as React.CSSProperties}
            >
              <line x1={x} y1={yTop} x2={x} y2={yBot} stroke={AMBER} strokeWidth={strokeW} strokeDasharray={dashArr} />
            </g>

            {/* Solid line overlay (no animation, instant) */}
            <line x1={x} y1={yTop} x2={x} y2={yBot} stroke={AMBER_SOLID} strokeWidth={strokeW * 0.4} />

            {/* Animated tick marks */}
            <g
              className="animate-line-sweep-v"
              style={{
                "--sweep-duration": "0.45s",
                "--sweep-delay": `${sweepDelay + 0.15}s`,
              } as React.CSSProperties}
            >
              <line x1={x - tickLen} y1={yTop} x2={x + tickLen} y2={yTop} stroke={AMBER_SOLID} strokeWidth={tickW} />
              <line x1={x - tickLen} y1={yBot} x2={x + tickLen} y2={yBot} stroke={AMBER_SOLID} strokeWidth={tickW} />
            </g>
          </g>
        );
      })}

      {/* Animated segment labels */}
      {segments.map((seg, i) => {
        const midX = (seg.x1 + seg.x2) / 2;
        const segW = Math.abs(seg.x2 - seg.x1);
        const lw   = Math.min(segW * 0.92, S * 90);
        const rowY = i % 2 === 0 ? labelY1 : labelY2;
        const labelDelay = i * 0.12 + 0.4;

        return (
          <g 
            key={`label-${i}`}
            className="animate-region-appear"
            style={{
              "--region-delay": `${labelDelay}s`,
            } as React.CSSProperties}
          >
            <rect x={midX - lw / 2} y={rowY} width={lw} height={labelH} rx={labelRx} fill={AMBER_LABEL_BG} stroke={AMBER} strokeWidth={S * 0.8} />
            <text x={midX} y={rowY + labelH * 0.65} fill={AMBER_SOLID} fontSize={fontSz} fontFamily="'SF Mono','Fira Code',monospace" fontWeight="600" textAnchor="middle" letterSpacing="0.02em">
              {seg.data.label}: {seg.data.mm}mm
            </text>
          </g>
        );
      })}
    </g>
  );
});
