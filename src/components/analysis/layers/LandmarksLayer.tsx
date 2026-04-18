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
  const WHITE = "#FFFFFF";
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

  // Show all landmarks for maximum precision and visual impact
  const sampledLandmarks = landmarks;

  return (
    <g className="biometric-mesh-layer">
      {/* Mesh: high-visibility white background structure - increased by ~20% */}
      <path
        d={meshPath}
        stroke={WHITE}
        strokeWidth="0.8"
        fill="none"
        strokeDasharray={MESH_DASH}
        strokeDashoffset={MESH_DASH}
        style={{ opacity: 0.65 }}
      >
        <animate
          attributeName="stroke-dashoffset"
          from={MESH_DASH}
          to={0}
          dur="1.0s"
          begin="0s"
          fill="freeze"
          calcMode="spline"
          keySplines="0.4 0 0.2 1"
        />
      </path>

      {/* Contours: white supporting structure - increased visibility */}
      {contourPaths.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={WHITE}
          strokeWidth="1.1"
          fill="none"
          strokeDasharray={CONTOUR_DASH}
          strokeDashoffset={CONTOUR_DASH}
          style={{ opacity: 0 }}
        >
          <animate
            attributeName="stroke-dashoffset"
            from={CONTOUR_DASH}
            to={0}
            dur="0.5s"
            begin={`${0.3 + i * 0.1}s`}
            fill="freeze"
          />
          <animate
            attributeName="opacity"
            from={0}
            to={0.8}
            dur="0.2s"
            begin={`${0.3 + i * 0.1}s`}
            fill="freeze"
          />
        </path>
      ))}

      {/* Landmark dots: high-visibility blinking beacons */}
      <defs>
        <filter id="landmark-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {sampledLandmarks.map((pt, i) => {
        const cx = pt.x * W;
        const cy = pt.y * H;
        const entryDelay = (0.5 + i * 0.001).toFixed(3);
        // Faster blinking frequency for "piscante" effect
        const blinkDur = (0.8 + (i % 5) * 0.2).toFixed(2);

        return (
          <g key={i}>
            {/* Background intense glow - increased opacity by ~20% */}
            <circle cx={cx} cy={cy} r="3.5" fill={CYAN} opacity="0">
              <animate
                attributeName="opacity"
                values="0;0.8;0"
                dur={`${blinkDur}s`}
                begin={`${entryDelay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="r"
                values="2;5.5;2"
                dur={`${blinkDur}s`}
                begin={`${entryDelay}s`}
                repeatCount="indefinite"
              />
            </circle>

            {/* Core point - high contrast white/cyan */}
            <circle cx={cx} cy={cy} r="1.8" fill="white" filter="url(#landmark-glow)">
              <animate
                attributeName="opacity"
                values="1;0.5;1"
                dur={`${blinkDur}s`}
                begin={`${entryDelay}s`}
                repeatCount="indefinite"
              />
            </circle>

            {/* Sharp cyan dot center */}
            <circle cx={cx} cy={cy} r="0.9" fill={CYAN} />
          </g>
        );
      })}
    </g>
  );
});
