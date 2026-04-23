import React, { memo } from "react";
import { Landmark, LipRatioResult } from "@/utils/facialAnalysis";

interface Props {
  lipRatioData: LipRatioResult;
  landmarks: Landmark[];
  dimensions: { width: number; height: number };
}

export const LipRatioLayer = memo(function LipRatioLayer({ lipRatioData, landmarks, dimensions }: Props) {
  if (!landmarks.length || !dimensions.width) return null;

  const { width: W, height: H } = dimensions;
  const S    = Math.max(W, H) / 1000;
  const lp   = lipRatioData;
  const midX = landmarks[13].x * W;
  const topY = landmarks[0].y  * H;
  const midY = landmarks[13].y * H;
  const botY = landmarks[17].y * H;

  return (
    <g className="lip-ratio-layer">
      {/* Top reference line with sweep animation */}
      <g
        className="animate-line-sweep-h"
        style={{
          "--sweep-duration": "0.5s",
          "--sweep-delay": "0s",
        } as React.CSSProperties}
      >
        <line x1={midX - S * 20} y1={topY} x2={midX + S * 20} y2={topY} stroke="#F5BB5C" strokeWidth={S * 1.5} />
      </g>

      {/* Mid reference line with sweep animation */}
      <g
        className="animate-line-sweep-h"
        style={{
          "--sweep-duration": "0.5s",
          "--sweep-delay": "0.1s",
        } as React.CSSProperties}
      >
        <line x1={midX - S * 20} y1={midY} x2={midX + S * 20} y2={midY} stroke="#F5BB5C" strokeWidth={S * 1.5} />
      </g>

      {/* Bottom reference line with sweep animation */}
      <g
        className="animate-line-sweep-h"
        style={{
          "--sweep-duration": "0.5s",
          "--sweep-delay": "0.2s",
        } as React.CSSProperties}
      >
        <line x1={midX - S * 20} y1={botY} x2={midX + S * 20} y2={botY} stroke="#F5BB5C" strokeWidth={S * 1.5} />
      </g>

      {/* Superior measurement label */}
      <text 
        x={midX + S * 25} 
        y={(topY + midY) / 2} 
        fill="#F5BB5C" 
        fontSize={S * 9}  
        fontFamily="monospace"
        className="animate-label-slide-in"
        style={{
          "--label-delay": "0.35s",
        } as React.CSSProperties}
      >
        {lp.superiorMm}mm
      </text>

      {/* Inferior measurement label */}
      <text 
        x={midX + S * 25} 
        y={(midY + botY) / 2} 
        fill="#F5BB5C" 
        fontSize={S * 9}  
        fontFamily="monospace"
        className="animate-label-slide-in"
        style={{
          "--label-delay": "0.45s",
        } as React.CSSProperties}
      >
        {lp.inferiorMm}mm
      </text>

      {/* Ratio result label */}
      <text 
        x={midX + S * 25} 
        y={botY + S * 15}     
        fill="#F5BB5C" 
        fontSize={S * 10} 
        fontFamily="monospace" 
        fontWeight="bold"
        className="animate-label-slide-in"
        style={{
          "--label-delay": "0.55s",
        } as React.CSSProperties}
      >
        1:{lp.ratio}
      </text>
    </g>
  );
});
