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

  const limiteR = lm[234]; const exoR = lm[33];  const endoR = lm[133];
  const endoL   = lm[362]; const exoL = lm[263]; const limiteL = lm[454];
  const trichion = lm[10]; const menton = lm[152];

  if (!limiteR || !exoR || !endoR || !endoL || !exoL || !limiteL || !trichion || !menton) return null;

  const S = Math.max(W, H) / 1000;

  const x_limiteR = limiteR.x * W; const x_exoR  = exoR.x  * W; const x_endoR = endoR.x * W;
  const x_endoL   = endoL.x  * W; const x_exoL   = exoL.x  * W; const x_limiteL = limiteL.x * W;

  const yTop = trichion.y * H - H * 0.03;
  const yBot = menton.y   * H + H * 0.03;

  const color    = "#A3E635";
  const strokeW  = S * 3.5;
  const dashArr  = `${S * 10},${S * 4}`;
  const dotR     = S * 5;


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
            {/* Main vertical line with glow */}
            <g
              className="animate-line-sweep-v"
              style={{
                "--sweep-duration": "0.65s",
                "--sweep-delay": `${sweepDelay}s`,
              } as React.CSSProperties}
            >
              <line 
                x1={x} y1={yTop} x2={x} y2={yBot} 
                stroke={color} strokeWidth={strokeW} strokeDasharray={dashArr} opacity="1" 
                style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
              />
            </g>

            {/* Endpoint dots */}
            <circle 
              cx={x} cy={yTop} r={dotR} fill={color} 
              className="animate-dot-pop"
              style={{ 
                "--dot-r": `${dotR}px`, 
                "--dot-delay": `${sweepDelay + 0.4}s`,
                filter: `drop-shadow(0 0 8px ${color})`
              } as React.CSSProperties}
            />
            <circle 
              cx={x} cy={yBot} r={dotR} fill={color} 
              className="animate-dot-pop"
              style={{ 
                "--dot-r": `${dotR}px`, 
                "--dot-delay": `${sweepDelay + 0.5}s`,
                filter: `drop-shadow(0 0 8px ${color})`
              } as React.CSSProperties}
            />
          </g>
        );
      })}

      {/* Simplified horizontal segment labels centered within each fifth */}
      {segments.map((seg, i) => {
        const midX = (seg.x1 + seg.x2) / 2;
        const labelDelay = i * 0.12 + 0.4;
        // Same height for all, just below the face
        const rowOff = S * 25;

        return (
          <g 
            key={`label-${i}`}
            className="animate-label-slide-in"
            style={{ "--label-delay": `${labelDelay}s` } as React.CSSProperties}
          >
            <text 
              x={midX} y={yBot + rowOff} 
              fill="#FFFFFF" fontSize={S * 9} fontWeight="900" fontFamily="monospace" textAnchor="middle"
              style={{ textShadow: "0 0 6px rgba(0,0,0,0.9), 1px 1px 0 rgba(0,0,0,1)" }}
            >
              {seg.data.mm}mm
            </text>
          </g>
        );
      })}
    </g>
  );
});
