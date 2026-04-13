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

      {/* Landmark dots: beacon pulse — discrete, modern, non-obstructive */}
      {sampledLandmarks.map((pt, i) => {
        const cx = pt.x * W;
        const cy = pt.y * H;
        // Entry delay: cascade in as mesh finishes
        const entryDelay = (0.9 + i * 0.008).toFixed(3);
        // Pulse offset: spread pulses so they don't all beat in sync
        const pulseOffset = ((i * 0.37) % 2.4).toFixed(3);
        const pulseDur = (2.2 + (i % 5) * 0.15).toFixed(2);

        return (
          <g key={i}>
            {/* Ping ring — expands outward and fades, loops continuously */}
            <circle cx={cx} cy={cy} r="1.5" fill="none" stroke={CYAN} strokeWidth="0.8">
              {/* Wait for entry, then start pulsing */}
              <animate
                attributeName="r"
                values="1.5;7;7"
                keyTimes="0;0.6;1"
                dur={`${pulseDur}s`}
                begin={`${entryDelay}s`}
                repeatCount="indefinite"
                calcMode="spline"
                keySplines="0.4 0 0.6 1;0 0 1 1"
              />
              <animate
                attributeName="opacity"
                values="0.7;0;0"
                keyTimes="0;0.6;1"
                dur={`${pulseDur}s`}
                begin={`${entryDelay}s`}
                repeatCount="indefinite"
              />
            </circle>

            {/* Core dot — tiny, sharp, always visible after entry */}
            <circle cx={cx} cy={cy} r="0" fill={CYAN}>
              {/* Entry pop */}
              <animate
                attributeName="r"
                values={`0;2.2;1.6`}
                keyTimes="0;0.5;1"
                dur="0.35s"
                begin={`${entryDelay}s`}
                fill="freeze"
                calcMode="spline"
                keySplines="0.34 1.56 0.64 1;0.4 0 0.2 1"
              />
              <animate
                attributeName="opacity"
                from={0}
                to={1}
                dur="0.2s"
                begin={`${entryDelay}s`}
                fill="freeze"
              />
            </circle>

            {/* Subtle brightness pulse on the core itself */}
            <circle cx={cx} cy={cy} r="1.6" fill={CYAN} opacity="0">
              <animate
                attributeName="opacity"
                values="0;0;0.9;0.5;0"
                keyTimes="0;0.05;0.2;0.5;1"
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
