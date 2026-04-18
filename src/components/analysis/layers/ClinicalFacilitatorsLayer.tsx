import React, { memo } from "react";
import { Landmark } from "@/utils/facialAnalysis";

const KEY_POINTS = [
  { idx: 33,  label: "L. CANTHUS (L)"  },
  { idx: 133, label: "I. CANTHUS (L)"  },
  { idx: 362, label: "I. CANTHUS (R)"  },
  { idx: 263, label: "L. CANTHUS (R)"  },
  { idx: 1,   label: "PRONASALE"        },
  { idx: 0,   label: "LABIAL (SUP)"     },
  { idx: 17,  label: "LABIAL (INF)"     },
  { idx: 61,  label: "COMMISSURE (L)"   },
  { idx: 291, label: "COMMISSURE (R)"   },
  { idx: 152, label: "MENTON"           },
];

interface Props {
  landmarks: Landmark[];
  dimensions: { width: number; height: number };
}

export const ClinicalFacilitatorsLayer = memo(function ClinicalFacilitatorsLayer({ landmarks, dimensions }: Props) {
  if (!landmarks.length || !dimensions.width) return null;

  const { width: W, height: H } = dimensions;
  const GOLD = "#F5E1A4";

  return (
    <g className="clinical-facilitators-layer">
      {KEY_POINTS.map(({ idx, label }) => {
        const pt = landmarks[idx];
        if (!pt) return null;
        const x = pt.x * W;
        const y = pt.y * H;
        return (
          <g key={idx} className="facilitator-group group/facilitator pointer-events-auto cursor-help">
            <circle cx={x} cy={y} r={3} fill={GOLD} className="drop-shadow-[0_0_4px_rgba(245,225,164,0.6)]" />
            <circle cx={x} cy={y} r={7} fill="transparent" stroke={GOLD} strokeWidth={0.5} strokeDasharray="2,2">
              <animateTransform attributeName="transform" type="rotate" from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="10s" repeatCount="indefinite" />
            </circle>
            <text
              x={x + 10} y={y + 3}
              fill={GOLD} fontSize="8px" fontFamily="monospace" fontWeight="600"
              className="opacity-0 group-hover/facilitator:opacity-100 transition-opacity pointer-events-none"
            >
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
});
