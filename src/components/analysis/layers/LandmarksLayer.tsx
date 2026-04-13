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

  // All landmarks for dot animation — every 3rd keeps density readable without cluttering
  const sampledLandmarks = landmarks.filter((_, i) => i % 3 === 0);

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
        style={{ opacity: 0.60 }}
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

      {/* Contours: subtle, thin lines — discrete to not obscure anatomy */}
      {contourPaths.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={CYAN}
          strokeWidth="0.8"
          fill="none"
          strokeDasharray={CONTOUR_DASH}
          strokeDashoffset={CONTOUR_DASH}
          style={{ opacity: 0 }}
        >
          <animate
            attributeName="stroke-dashoffset"
            from={CONTOUR_DASH}
            to={0}
            dur="0.6s"
            begin={`${0.5 + i * 0.15}s`}
            fill="freeze"
            calcMode="spline"
            keySplines="0.4 0 0.2 1"
          />
          <animate
            attributeName="opacity"
            from={0}
            to={0.4}
            dur="0.25s"
            begin={`${0.5 + i * 0.15}s`}
            fill="freeze"
          />
        </path>
      ))}

      {/* Landmark dots: intense glow beacon — modern, eye-catching */}
      <defs>
        <filter id="landmark-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {sampledLandmarks.map((pt, i) => {
        const cx = pt.x * W;
        const cy = pt.y * H;
        // Entry delay: cascade in as mesh finishes
        const entryDelay = (0.9 + i * 0.006).toFixed(3);
        // Varied pulse timing for organic feel
        const pulseDur = (1.8 + (i % 7) * 0.12).toFixed(2);

        return (
          <g key={i}>
            {/* Outer ping ring — expands and fades */}
            <circle cx={cx} cy={cy} r="2" fill="none" stroke={CYAN} strokeWidth="1">
              <animate
                attributeName="r"
                values="2;10;10"
                keyTimes="0;0.7;1"
                dur={`${pulseDur}s`}
                begin={`${entryDelay}s`}
                repeatCount="indefinite"
                calcMode="spline"
                keySplines="0.2 0 0.4 1;0 0 1 1"
              />
              <animate
                attributeName="opacity"
                values="0.8;0;0"
                keyTimes="0;0.7;1"
                dur={`${pulseDur}s`}
                begin={`${entryDelay}s`}
                repeatCount="indefinite"
              />
            </circle>

            {/* Intense glow halo */}
            <circle cx={cx} cy={cy} r="0" fill={CYAN} filter="url(#landmark-glow)">
              <animate
                attributeName="r"
                values="0;4;2.5"
                keyTimes="0;0.4;1"
                dur="0.4s"
                begin={`${entryDelay}s`}
                fill="freeze"
                calcMode="spline"
                keySplines="0.34 1.56 0.64 1;0.4 0 0.2 1"
              />
              <animate
                attributeName="opacity"
                values="0;1;0.85"
                keyTimes="0;0.3;1"
                dur="0.4s"
                begin={`${entryDelay}s`}
                fill="freeze"
              />
            </circle>

            {/* Core dot — bright white center */}
            <circle cx={cx} cy={cy} r="0" fill="white">
              <animate
                attributeName="r"
                values="0;1.8;1.2"
                keyTimes="0;0.5;1"
                dur="0.35s"
                begin={`${entryDelay}s`}
                fill="freeze"
                calcMode="spline"
                keySplines="0.34 1.56 0.64 1;0.4 0 0.2 1"
              />
            </circle>

            {/* Pulsing brightness overlay */}
            <circle cx={cx} cy={cy} r="2.5" fill={CYAN} opacity="0">
              <animate
                attributeName="opacity"
                values="0;0.7;0.3;0"
                keyTimes="0;0.15;0.5;1"
                dur={`${pulseDur}s`}
                begin={`${entryDelay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="r"
                values="2.5;3.5;2.5"
                keyTimes="0;0.3;1"
                dur={`${pulseDur}s`}
                begin={`${entryDelay}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        );
      })}
    </g>
  );
});
