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
      <line x1={midX - S * 20} y1={topY} x2={midX + S * 20} y2={topY} stroke="#F5BB5C" strokeWidth={S * 1.5} />
      <line x1={midX - S * 20} y1={midY} x2={midX + S * 20} y2={midY} stroke="#F5BB5C" strokeWidth={S * 1.5} />
      <line x1={midX - S * 20} y1={botY} x2={midX + S * 20} y2={botY} stroke="#F5BB5C" strokeWidth={S * 1.5} />
      <text x={midX + S * 25} y={(topY + midY) / 2} fill="#F5BB5C" fontSize={S * 9}  fontFamily="monospace">{lp.superiorMm}mm (S)</text>
      <text x={midX + S * 25} y={(midY + botY) / 2} fill="#F5BB5C" fontSize={S * 9}  fontFamily="monospace">{lp.inferiorMm}mm (I)</text>
      <text x={midX + S * 25} y={botY + S * 15}     fill="#F5BB5C" fontSize={S * 10} fontFamily="monospace" fontWeight="bold">Ratio 1:{lp.ratio}</text>
    </g>
  );
});
