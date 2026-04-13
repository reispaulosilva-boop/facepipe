"use client";

import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Landmark, TopographicAreaResult, TOPOGRAPHIC_INDICES, extractPolygonPaths } from "@/utils/facialAnalysis";

const TRICHION_CURVE_INDICES = [103, 67, 109, 10, 338, 297, 332];

interface Props {
  landmarks: Landmark[];
  topographicAreas: TopographicAreaResult[];
  dimensions: { width: number; height: number };
  trichionOverrideY: number | null;
}

export const TopographicAreasLayer = memo(function TopographicAreasLayer({
  landmarks,
  topographicAreas,
  dimensions,
  trichionOverrideY,
}: Props) {
  const { width: W, height: H } = dimensions;
  const S = Math.max(W, H) / 1000;

  const areaMap = useMemo(() => {
    const m = new Map<string, TopographicAreaResult>();
    for (const a of topographicAreas) m.set(a.name, a);
    return m;
  }, [topographicAreas]);

  const lm10 = landmarks[10];
  const areaEntries = Object.entries(TOPOGRAPHIC_INDICES);

  return (
    <motion.g
      className="topographic-areas-layer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {areaEntries.map(([name, rawIndices], index) => {
        const area = areaMap.get(name);
        if (!area) return null;

        const paths = extractPolygonPaths(rawIndices);
        if (!paths.length) return null;

        // Build the SVG path data with proper sub-path separation (M...Z M...Z)
        const d = paths
          .map((path) =>
            path
              .map((idx, j) => {
                const lm = landmarks[idx];
                if (!lm) return null;

                let px = lm.x * W;
                let py = lm.y * H;

                // Apply trichion override to crown-curve indices
                if (
                  trichionOverrideY !== null &&
                  TRICHION_CURVE_INDICES.includes(idx) &&
                  lm10
                ) {
                  py = py + (trichionOverrideY - lm10.y) * H;
                }

                return `${j === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`;
              })
              .filter(Boolean)
              .join(" ") + " Z"
          )
          .join(" ");

        // Centroid from the outer path (first sub-path only)
        const outerPath = paths[0];
        let cx = 0;
        let cy = 0;
        let validPts = 0;
        for (const idx of outerPath) {
          const lm = landmarks[idx];
          if (!lm) continue;
          cx += lm.x * W;
          cy += lm.y * H;
          validPts++;
        }
        if (validPts === 0) return null;
        cx /= validPts;
        cy /= validPts;

        const fontSize  = S * 7.5;
        const smallSize = S * 5.8;
        const lineGap   = fontSize * 1.25;
        const pctText   = `${area.percent.toFixed(1)}%`;
        const codeText  = area.code;

        // Stagger delay based on region index
        const staggerDelay = index * 0.08;

        return (
          <motion.g 
            key={name}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ 
              duration: 0.4, 
              delay: staggerDelay,
              ease: "easeOut"
            }}
          >
            {/* Region outline — fill none, solid stroke */}
            <path
              d={d}
              fill="none"
              fillRule="evenodd"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth={S * 1.2}
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 0 3px rgba(0,0,0,0.6))" }}
            />

            {/* Region code — small, dimmer, with dark halo for readability */}
            <text
              x={cx}
              y={cy - lineGap * 0.4}
              fill="rgba(255,255,255,0.75)"
              fontSize={smallSize}
              fontWeight="600"
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="monospace"
              stroke="rgba(0,0,0,0.85)"
              strokeWidth={S * 2.8}
              strokeLinejoin="round"
              paintOrder="stroke"
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              {codeText}
            </text>

            {/* Percentage — larger, bright, with dark halo */}
            <text
              x={cx}
              y={cy + lineGap * 0.65}
              fill="rgba(255,255,255,0.95)"
              fontSize={fontSize}
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="monospace"
              stroke="rgba(0,0,0,0.85)"
              strokeWidth={S * 3.2}
              strokeLinejoin="round"
              paintOrder="stroke"
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              {pctText}
            </text>
          </motion.g>
        );
      })}
    </motion.g>
  );
});
