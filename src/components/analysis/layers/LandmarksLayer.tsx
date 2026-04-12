import React, { memo } from "react";
import { FaceLandmarker } from "@mediapipe/tasks-vision";
import { Landmark } from "@/utils/facialAnalysis";

interface Props {
  landmarks: Landmark[];
  dimensions: { width: number; height: number };
}

export const LandmarksLayer = memo(function LandmarksLayer({ landmarks, dimensions }: Props) {
  if (!landmarks.length || !dimensions.width) return null;

  const { width: W, height: H } = dimensions;
  const CYAN = "#00fbcc";

  let meshPath = "";
  for (const c of FaceLandmarker.FACE_LANDMARKS_TESSELATION) {
    const from = landmarks[c.start];
    const to   = landmarks[c.end];
    if (from && to) {
      meshPath += `M ${from.x * W} ${from.y * H} L ${to.x * W} ${to.y * H} `;
    }
  }

  const contourSets = [
    FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
    FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
    FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
    FaceLandmarker.FACE_LANDMARKS_LIPS,
  ];
  let contoursPath = "";
  for (const contour of contourSets) {
    for (const c of contour) {
      const from = landmarks[c.start];
      const to   = landmarks[c.end];
      if (from && to) {
        contoursPath += `M ${from.x * W} ${from.y * H} L ${to.x * W} ${to.y * H} `;
      }
    }
  }

  return (
    <g className="biometric-mesh-layer">
      <path d={meshPath}    stroke={CYAN} strokeWidth="2.5"  fill="none" style={{ opacity: 0.12 }} />
      <path d={contoursPath} stroke={CYAN} strokeWidth="6.25" fill="none" style={{ opacity: 0.60 }} />
      {landmarks.map((pt, i) => (
        <circle key={i} cx={pt.x * W} cy={pt.y * H} r="4.5" fill={CYAN} style={{ opacity: 0.8 }} />
      ))}
    </g>
  );
});
