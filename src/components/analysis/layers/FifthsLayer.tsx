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

  const color    = "#A3E635";
  const strokeW  = S * 2.5;
  const dashArr  = `${S * 8},${S * 5}`;
  const dotR     = S * 4;

  const verticalX = [x_limiteR, x_exoR, x_endoR, x_endoL, x_exoL, x_limiteL];
  const segments = [
    { x1: x_limiteR, x2: x_exoR,    data: fifthsData.outerRight },
    { x1: x_exoR,    x2: x_endoR,   data: fifthsData.rightEye   },
    { x1: x_endoR,   x2: x_endoL,   data: fifthsData.interalar  },
    { x1: x_endoL,   x2: x_exoL,    data: fifthsData.leftEye    },
    { x1: x_exoL,    x2: x_limiteL, data: fifthsData.outerLeft  },
  ];

  return (
    <g className="fifths-layer">
      {verticalX.map((x, i) => {
        const sweepDelay = i * 0.1;

        return (
          <g key={i}>
            {/* Main vertical line */}
            <g
              className="animate-line-sweep-v"
              style={{
                "--sweep-duration": "0.65s",
                "--sweep-delay": `${sweepDelay}s`,
              } as React.CSSProperties}
            >
              <line 
                x1={x} y1={yTop} x2={x} y2={yBot} 
                stroke={color} strokeWidth={strokeW} strokeDasharray={dashArr} opacity="0.8" 
              />
            </g>

            {/* Endpoint dots */}
            <circle 
              cx={x} cy={yTop} r={dotR} fill={color} 
              className="animate-dot-pop"
              style={{ "--dot-r": `${dotR}px`, "--dot-delay": `${sweepDelay + 0.4}s` } as React.CSSProperties}
            />
            <circle 
              cx={x} cy={yBot} r={dotR} fill={color} 
              className="animate-dot-pop"
              style={{ "--dot-r": `${dotR}px`, "--dot-delay": `${sweepDelay + 0.5}s` } as React.CSSProperties}
            />
          </g>
        );
      })}

      {/* Segment labels */}
      {segments.map((seg, i) => {
        const midX = (seg.x1 + seg.x2) / 2;
        const labelDelay = i * 0.12 + 0.4;
        const rowOff = i % 2 === 0 ? S * 25 : S * 45;

        return (
          <g 
            key={`label-${i}`}
            className="animate-label-slide-in"
            style={{ "--label-delay": `${labelDelay}s` } as React.CSSProperties}
          >
            <text 
              x={midX} y={yBot + rowOff} 
              fill="#FFFFFF" fontSize={S * 9} fontWeight="bold" fontFamily="monospace" textAnchor="middle"
              style={{ textShadow: "0 0 4px rgba(0,0,0,0.8)" }}
            >
              {seg.data.label}: {seg.data.mm}mm
            </text>
          </g>
        );
      })}
    </g>
  );
});
