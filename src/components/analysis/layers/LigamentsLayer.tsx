/**
 * Ligaments & Aging Grooves Layer
 * Visualizes the 5 main clinical ligaments and the grooves they form.
 */

import React from 'react';
import { Landmark } from '@/utils/facialAnalysis';

interface LigamentsLayerProps {
  landmarks: Landmark[];
  dimensions: { width: number; height: number };
}

const LigamentsLayer: React.FC<LigamentsLayerProps> = ({ landmarks, dimensions }) => {
  const getXY = (idx: number) => {
    const lm = landmarks[idx];
    if (!lm) return { x: 0, y: 0 };
    return { x: lm.x * dimensions.width, y: lm.y * dimensions.height };
  };

  const drawPath = (indices: number[]) => {
    return indices.map((idx, i) => {
      const { x, y } = getXY(idx);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Defining paths based on clinical anatomy (Symmetric)
  const ligamentGroups = [
    {
      name: "Tear Trough / Palpebromalar",
      paths: [
        [130, 247, 30], // R
        [359, 467, 260]  // L
      ],
      color: "#FF5252"
    },
    {
      name: "Sulco Médio (Lig. Zigomaticocutâneo)",
      paths: [
        [205, 203, 31], // R
        [425, 423, 261]   // L
      ],
      color: "#FFEB3B"
    },
    {
      name: "Sulco Nasolabial",
      paths: [
        [129, 203, 118, 61], // R
        [358, 423, 347, 291]  // L
      ],
      color: "#4CAF50"
    },
    {
      name: "Sulco da Gordura Bucal",
      paths: [
        [227, 137, 172], // R
        [447, 366, 397]   // L
      ],
      color: "#2196F3"
    },
    {
      name: "Linha de Marionete",
      paths: [
        [61, 146, 150, 152], // R
        [291, 375, 379, 152]  // L
      ],
      color: "#9C27B0"
    }
  ];

  return (
    <g className="ligaments-layer">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {ligamentGroups.map((group, gIdx) => (
        <g key={gIdx} className="opacity-70">
          {group.paths.map((path, pIdx) => (
            <path
              key={`${gIdx}-${pIdx}`}
              d={drawPath(path)}
              stroke={group.color}
              strokeWidth="2"
              fill="none"
              strokeDasharray="4 2"
              filter="url(#glow)"
            />
          ))}
          {/* Label on the first path point */}
          {group.paths[0] && (
            <text
              x={getXY(group.paths[0][0]).x - 10}
              y={getXY(group.paths[0][0]).y - 10}
              fill={group.color}
              fontSize="10"
              fontWeight="bold"
              className="drop-shadow-md select-none capitalize"
            >
              {group.name.split(' ')[0]}
            </text>
          )}
        </g>
      ))}
    </g>
  );
};

export default LigamentsLayer;
