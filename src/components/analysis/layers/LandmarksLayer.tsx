import React, { memo, useId } from "react";
import { FaceLandmarker } from "@mediapipe/tasks-vision";
import { Landmark } from "@/utils/facialAnalysis";

interface Props {
  landmarks: Landmark[];
  dimensions: { width: number; height: number };
}

// Approximate path length used for stroke-dasharray draw-on effect.
// Using a large-enough value ensures the dash covers the whole path.
const MESH_DASH = 8000;
const CONTOUR_DASH = 3000;

export const LandmarksLayer = memo(function LandmarksLayer({ landmarks, dimensions }: Props) {
  if (!landmarks.length || !dimensions.width) return null;

  const { width: W, height: H } = dimensions;
  const CYAN = "#00fbcc";
  const clipId = useId();

  // Build mesh path
  let meshPath = "";
  for (const c of FaceLandmarker.FACE_LANDMARKS_TESSELATION) {
    const from = landmarks[c.start];
    const to   = landmarks[c.end];
    if (from && to) {
      meshPath += `M ${from.x * W} ${from.y * H} L ${to.x * W} ${to.y * H} `;
    }
  }

  // Build contours paths per set so each draws independently
  const contourSets = [
    FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
    FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
    FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
    FaceLandmarker.FACE_LANDMARKS_LIPS,
  ];

  const contourPaths: string[] = contourSets.map((contour) => {
    let d = "";
    for (const c of contour) {
      const from = landmarks[c.start];
      const to   = landmarks[c.end];
      if (from && to) {
        d += `M ${from.x * W} ${from.y * H} L ${to.x * W} ${to.y * H} `;
      }
    }
    return d;
  });

  // Sub-sample landmarks for cascaded dot animation (every 4th to keep it fast)
  const sampledLandmarks = landmarks.filter((_, i) => i % 4 === 0);

  return (
    <g className="biometric-mesh-layer">
      {/* Mesh: drawn on over ~1.2s - increased visibility */}
      <path
        d={meshPath}
        stroke={CYAN}
        strokeWidth="1"
        fill="none"
        strokeDasharray={MESH_DASH}
        strokeDashoffset={MESH_DASH}
        style={{ opacity: 0.35 }}
      >
        <animate
          attributeName="stroke-dashoffset"
          from={MESH_DASH}
          to={0}
          dur="1.2s"
          begin="0s"
          fill="freeze"
          calcMode="spline"
          keySplines="0.4 0 0.2 1"
        />
      </path>

      {/* Contours: each drawn sequentially with a delay - bolder strokes */}
      {contourPaths.map((d, i) => (
        <g key={i}>
          {/* Glow layer */}
          <path
            d={d}
            stroke={CYAN}
            strokeWidth="4"
            fill="none"
            strokeDasharray={CONTOUR_DASH}
            strokeDashoffset={CONTOUR_DASH}
            style={{ opacity: 0, filter: "blur(4px)" }}
          >
            <animate
              attributeName="stroke-dashoffset"
              from={CONTOUR_DASH}
              to={0}
              dur="0.55s"
              begin={`${0.5 + i * 0.18}s`}
              fill="freeze"
              calcMode="spline"
              keySplines="0.4 0 0.2 1"
            />
            <animate
              attributeName="opacity"
              from={0}
              to={0.5}
              dur="0.2s"
              begin={`${0.5 + i * 0.18}s`}
              fill="freeze"
            />
          </path>
          {/* Main stroke */}
          <path
            d={d}
            stroke={CYAN}
            strokeWidth="2"
            fill="none"
            strokeDasharray={CONTOUR_DASH}
            strokeDashoffset={CONTOUR_DASH}
            style={{ opacity: 0 }}
          >
            <animate
              attributeName="stroke-dashoffset"
              from={CONTOUR_DASH}
              to={0}
              dur="0.55s"
              begin={`${0.5 + i * 0.18}s`}
              fill="freeze"
              calcMode="spline"
              keySplines="0.4 0 0.2 1"
            />
            <animate
              attributeName="opacity"
              from={0}
              to={0.9}
              dur="0.2s"
              begin={`${0.5 + i * 0.18}s`}
              fill="freeze"
            />
          </path>
        </g>
      ))}

      {/* Landmark dots: pop in one by one - larger and brighter */}
      {sampledLandmarks.map((pt, i) => {
        const delay = (0.8 + i * 0.012).toFixed(3);
        return (
          <g key={i}>
            {/* Glow */}
            <circle 
              cx={pt.x * W} 
              cy={pt.y * H} 
              r="0" 
              fill={CYAN}
              style={{ filter: "blur(3px)" }}
            >
              <animate
                attributeName="r"
                from={0}
                to={6}
                dur="0.25s"
                begin={`${delay}s`}
                fill="freeze"
                calcMode="spline"
                keySplines="0.34 1.56 0.64 1"
              />
              <animate
                attributeName="opacity"
                from={0}
                to={0.5}
                dur="0.15s"
                begin={`${delay}s`}
                fill="freeze"
              />
            </circle>
            {/* Core dot */}
            <circle cx={pt.x * W} cy={pt.y * H} r="0" fill={CYAN}>
              <animate
                attributeName="r"
                from={0}
                to={3}
                dur="0.25s"
                begin={`${delay}s`}
                fill="freeze"
                calcMode="spline"
                keySplines="0.34 1.56 0.64 1"
              />
              <animate
                attributeName="opacity"
                from={0}
                to={1}
                dur="0.15s"
                begin={`${delay}s`}
                fill="freeze"
              />
            </circle>
          </g>
        );
      })}
    </g>
  );
});
