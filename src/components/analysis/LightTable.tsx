"use client";

import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { 
  TransformWrapper, 
  TransformComponent,
  ReactZoomPanPinchRef
} from "react-zoom-pan-pinch";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { FaceLandmarker } from "@mediapipe/tasks-vision";
import {
  calcThirds,
  calcFifths,
  calcPixelsPerMm,
  landmarkToPixel,
  ThirdsResult,
  FifthsResult,
  Landmark,
  LipRatioResult,
  TopographicRegion,
  calcLipRatio,
  getTopographicRegions,
  calcMorphology,
  calcBizygomatic,
  calcBigonial,
  calcBitemporal,
  DistanceMeasurement
} from "@/utils/facialAnalysis";
import { useFaceStore } from "@/store/useFaceStore";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const AMBER = "rgba(251, 191, 36, 0.5)";   // amber-400/50
const AMBER_SOLID = "rgba(251, 191, 36, 0.9)";
const AMBER_LABEL_BG = "rgba(12, 8, 2, 0.65)";

interface LightTableProps {
  imageUrl: string;
  landmarks: any[];
  showLandmarks: boolean;
  showThirds: boolean;
  showFifths: boolean;
  trichionOverrideY: number | null;
  analysisResults: any;
  onLandmarksDetected: (results: any) => void;
  onTrichionAdjust: (y: number) => void;
  onLandmarksLoad?: (count: number) => void;
  onZoomChange?: (zoom: number, baseScale: number) => void;
  showDistances: boolean;
  showBitemporal?: boolean;
  showBizygomatic?: boolean;
  showBigonial?: boolean;
  resetKey?: number;
  transformRef?: React.RefObject<ReactZoomPanPinchRef | null>;
  activeTool?: string;
  showRegions?: boolean;
}

export function LightTable({
  imageUrl,
  landmarks,
  showLandmarks,
  showThirds,
  showFifths,
  showDistances,
  showBitemporal = false,
  showBizygomatic = false,
  showBigonial = false,
  trichionOverrideY,
  onTrichionAdjust,
  analysisResults,
  onLandmarksDetected,
  onLandmarksLoad,
  onZoomChange,
  resetKey = 0,
  transformRef,
  activeTool = "select",
  showRegions = false
}: LightTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDraggingTrichion, setIsDraggingTrichion] = useState(false);
  const { setAnalysisResults, showThirds: storeShowThirds, showFifths: storeShowFifths } = useFaceStore();

  // Sync dimensions with image
  const handleImageLoad = () => {
    if (!photoRef.current) return;
    const { naturalWidth, naturalHeight } = photoRef.current;
    
    if (naturalWidth > 0 && naturalHeight > 0) {
      setDimensions({ width: naturalWidth, height: naturalHeight });
      setIsLoaded(true);
      if (onLandmarksLoad && landmarks.length > 0) {
        onLandmarksLoad(landmarks.length);
      }
    }
  };

  // ── Trichion Drag Handlers ─────────────────────────────────────────────────
  const screenToSvgY = useCallback((clientY: number): number => {
    if (!svgRef.current) return 0;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return 0;
    const pt = svgRef.current.createSVGPoint();
    pt.x = 0;
    pt.y = clientY;
    const svgPt = pt.matrixTransform(ctm.inverse());
    return svgPt.y;
  }, []);

  const handleTrichionPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as SVGElement).setPointerCapture(e.pointerId);
    setIsDraggingTrichion(true);
  }, []);

  const handleTrichionPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingTrichion || !dimensions.height) return;
    e.stopPropagation();
    e.preventDefault();
    const svgY = screenToSvgY(e.clientY);
    const normalizedY = Math.max(0, Math.min(1, svgY / dimensions.height));
    onTrichionAdjust(normalizedY);
  }, [isDraggingTrichion, dimensions.height, screenToSvgY, onTrichionAdjust]);

  const handleTrichionPointerUp = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDraggingTrichion(false);
  }, []);

  // ── Analysis Calculations (memoized) ───────────────────────────────────────
  const thirdsData = useMemo<ThirdsResult | null>(() => {
    if (!landmarks || landmarks.length === 0 || !dimensions.width) return null;
    return calcThirds(landmarks as Landmark[], dimensions.width, dimensions.height, trichionOverrideY);
  }, [landmarks, dimensions, trichionOverrideY]);

  const fifthsData = useMemo<FifthsResult | null>(() => {
    if (!landmarks || landmarks.length === 0 || !dimensions.width) return null;
    return calcFifths(landmarks as Landmark[], dimensions.width, dimensions.height);
  }, [landmarks, dimensions]);

  const lipRatioData = useMemo<LipRatioResult | null>(() => {
    if (!landmarks || landmarks.length === 0 || !dimensions.height) return null;
    const pxPerMm = calcPixelsPerMm(landmarks as Landmark[], dimensions.width, dimensions.height) ?? 1;
    return calcLipRatio(landmarks as Landmark[], dimensions.height, pxPerMm);
  }, [landmarks, dimensions]);

  const topographicRegions = useMemo(() => {
    if (!landmarks || landmarks.length === 0) return [];
    return getTopographicRegions(landmarks as Landmark[]);
  }, [landmarks]);

  const morphology = useMemo(() => {
    if (!landmarks || landmarks.length === 0 || !dimensions.width) return null;
    return calcMorphology(landmarks as Landmark[], dimensions.width);
  }, [landmarks, dimensions]);

  const bizygomaticData = useMemo(() => {
    if (!landmarks || landmarks.length === 0 || !dimensions.width || !thirdsData?.pxPerMm) return null;
    return calcBizygomatic(landmarks as Landmark[], dimensions.width, thirdsData.pxPerMm);
  }, [landmarks, dimensions, thirdsData]);

  const bigonialData = useMemo(() => {
    if (!landmarks || landmarks.length === 0 || !dimensions.width || !thirdsData?.pxPerMm) return null;
    return calcBigonial(landmarks as Landmark[], dimensions.width, thirdsData.pxPerMm);
  }, [landmarks, dimensions, thirdsData]);

  const bitemporalData = useMemo(() => {
    if (!landmarks || landmarks.length === 0 || !dimensions.width || !thirdsData?.pxPerMm) return null;
    return calcBitemporal(landmarks as Landmark[], dimensions.width, thirdsData.pxPerMm);
  }, [landmarks, dimensions, thirdsData]);

  // Sync with store
  useEffect(() => {
    if (landmarks && landmarks.length > 0 && dimensions.width > 0) {
      setAnalysisResults({
        thirds: thirdsData,
        fifths: fifthsData,
        lipRatio: lipRatioData,
        landmarks: landmarks,
        topographicRegions: topographicRegions,
        pxPerMm: thirdsData?.pxPerMm || null,
        morphology,
        bizygomatic: bizygomaticData,
        bigonial: bigonialData,
        bitemporal: bitemporalData,
      });
    }
  }, [landmarks, dimensions, thirdsData, fifthsData, lipRatioData, topographicRegions, bizygomaticData, bigonialData, bitemporalData, setAnalysisResults]);

  // ── Landmark Layer Logic (SVG Based) ───────────────────────────────────────
  const renderLandmarks = () => {
    if (!showLandmarks || !landmarks || landmarks.length === 0 || !dimensions.width) return null;

    const CYAN = "#00fbcc";
    
    let meshPath = "";
    for (const connection of FaceLandmarker.FACE_LANDMARKS_TESSELATION) {
      const from = landmarks[connection.start];
      const to = landmarks[connection.end];
      if (from && to) {
        meshPath += `M ${from.x * dimensions.width} ${from.y * dimensions.height} L ${to.x * dimensions.width} ${to.y * dimensions.height} `;
      }
    }

    let contoursPath = "";
    const contours = [
      FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
      FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
      FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
      FaceLandmarker.FACE_LANDMARKS_LIPS,
    ];
    for (const contour of contours) {
      for (const connection of contour) {
        const from = landmarks[connection.start];
        const to = landmarks[connection.end];
        if (from && to) {
          contoursPath += `M ${from.x * dimensions.width} ${from.y * dimensions.height} L ${to.x * dimensions.width} ${to.y * dimensions.height} `;
        }
      }
    }

    return (
      <g className="biometric-mesh-layer">
        <path 
           d={meshPath} 
           stroke={CYAN} 
           strokeWidth="1" 
           fill="none" 
           style={{ opacity: 0.12 }}
        />
        <path 
           d={contoursPath} 
           stroke={CYAN} 
           strokeWidth="2.5" 
           fill="none" 
           style={{ opacity: 0.6 }}
        />
        {landmarks.map((pt, i) => (
          <circle 
            key={i}
            cx={pt.x * dimensions.width}
            cy={pt.y * dimensions.height}
            r="2.5"
            fill={CYAN}
            style={{ opacity: 0.7 }}
          />
        ))}
      </g>
    );
  };

  // ── Clinical Facilitators Layer ────────────────────────────────────────────
  const renderClinicalFacilitators = () => {
    if (!landmarks || landmarks.length === 0 || !dimensions.width) return null;
    
    const GOLD = "#F5E1A4";
    const keyPoints = [
      { idx: 33, label: "L. CANTHUS (L)" },
      { idx: 133, label: "I. CANTHUS (L)" },
      { idx: 362, label: "I. CANTHUS (R)" },
      { idx: 263, label: "L. CANTHUS (R)" },
      { idx: 1, label: "PRONASALE" },
      { idx: 0, label: "LABIAL (SUP)" },
      { idx: 17, label: "LABIAL (INF)" },
      { idx: 61, label: "COMMISSURE (L)" },
      { idx: 291, label: "COMMISSURE (R)" },
      { idx: 152, label: "MENTON" }
    ];

    return (
      <g className="clinical-facilitators-layer">
        {keyPoints.map(kp => {
          const pt = landmarks[kp.idx];
          if (!pt) return null;
          const x = pt.x * dimensions.width;
          const y = pt.y * dimensions.height;
          return (
            <g key={kp.idx} className="facilitator-group group/facilitator pointer-events-auto cursor-help">
              <circle cx={x} cy={y} r={3} fill={GOLD} className="drop-shadow-[0_0_4px_rgba(245,225,164,0.6)]" />
              <circle cx={x} cy={y} r={7} fill="transparent" stroke={GOLD} strokeWidth={0.5} strokeDasharray="2,2">
                <animateTransform attributeName="transform" type="rotate" from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="10s" repeatCount="indefinite" />
              </circle>
              <text x={x+10} y={y+3} fill={GOLD} fontSize="8px" fontFamily="monospace" fontWeight="600" className="opacity-0 group-hover/facilitator:opacity-100 transition-opacity pointer-events-none">
                {kp.label}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  // ── Facial Thirds Layer (Terços Faciais) ──────────────────────────────────
  const renderThirds = () => {
    if (!thirdsData || !landmarks || landmarks.length === 0 || !dimensions.width) return null;

    const W = dimensions.width;
    const H = dimensions.height;
    const lm = landmarks as Landmark[];

    // Scale factor: normalize all visual sizes to a 1000px reference image
    const S = Math.max(W, H) / 1000;

    // Pontos âncora
    const trichionLm = lm[10];
    const glabela   = lm[168];
    const subnasale = lm[2];
    const menton    = lm[152];

    if (!trichionLm || !glabela || !subnasale || !menton) return null;

    // Usar override do médico se disponível
    const trichionY = trichionOverrideY != null ? trichionOverrideY : trichionLm.y;
    const isManual  = trichionOverrideY != null;

    // Coordenadas Y absolutas
    const y_trichion  = trichionY * H;
    const y_glabela   = glabela.y   * H;
    const y_subnasale = subnasale.y * H;
    const y_menton    = menton.y    * H;

    // Extensão horizontal: cobre o rosto inteiro com margem generosa
    const faceLeft  = Math.min(lm[234]?.x ?? 0.1, lm[454]?.x ?? 0.1) * W;
    const faceRight = Math.max(lm[234]?.x ?? 0.9, lm[454]?.x ?? 0.9) * W;
    const faceSpanX = faceRight - faceLeft;
    const xStart = faceLeft  - faceSpanX * 0.15;
    const xEnd   = faceRight + faceSpanX * 0.15;

    const strokeW  = S * 2;
    const dashArr  = `${S * 10},${S * 6}`;
    const tickLen  = S * 8;
    const tickW    = S * 2.5;
    const glowStd  = S * 2;
    const labelW   = S * 130;
    const labelH   = S * 36;
    const labelRx  = S * 5;
    const fontName = S * 11;
    const fontMm   = S * 10;
    const padX     = S * 10;

    const lines = [
      { y: y_trichion,  label: null },
      { y: y_glabela,   label: { name: thirdsData.upperThird.label,  mm: thirdsData.upperThird.mm,  midY: (y_trichion + y_glabela) / 2 } },
      { y: y_subnasale, label: { name: thirdsData.middleThird.label, mm: thirdsData.middleThird.mm, midY: (y_glabela + y_subnasale) / 2 } },
      { y: y_menton,    label: { name: thirdsData.lowerThird.label,  mm: thirdsData.lowerThird.mm,  midY: (y_subnasale + y_menton) / 2 } },
    ];

    return (
      <g className="thirds-layer">

        {lines.map((line, i) => {
          const isTrichionLine = i === 0;
          const lineColor = isTrichionLine && isManual ? "rgba(74, 222, 128, 0.5)" : AMBER;
          const lineSolid = isTrichionLine && isManual ? "rgba(74, 222, 128, 0.9)" : AMBER_SOLID;
          return (
            <g key={i}>
              {/* Linha horizontal tracejada */}
              <line
                x1={xStart} y1={line.y}
                x2={xEnd}   y2={line.y}
                stroke={lineColor}
                strokeWidth={strokeW}
                strokeDasharray={dashArr}
              />
              {/* Linha sólida fina sobre a tracejada */}
              <line
                x1={xStart} y1={line.y}
                x2={xEnd}   y2={line.y}
                stroke={lineSolid}
                strokeWidth={strokeW * 0.4}
              />
              {/* Tick markers nas pontas */}
              <line x1={xStart} y1={line.y - tickLen} x2={xStart} y2={line.y + tickLen} stroke={lineSolid} strokeWidth={tickW} />
              <line x1={xEnd}   y1={line.y - tickLen} x2={xEnd}   y2={line.y + tickLen} stroke={lineSolid} strokeWidth={tickW} />

              {/* Drag handle na linha do Trichion */}
              {isTrichionLine && showThirds && (
                <>
                  {/* Hit area invisível ampla para facilitar o clique */}
                  <line
                    x1={xStart} y1={line.y}
                    x2={xEnd}   y2={line.y}
                    stroke="transparent"
                    strokeWidth={S * 20}
                    style={{ cursor: "ns-resize", pointerEvents: "auto" }}
                    onPointerDown={handleTrichionPointerDown}
                    onPointerMove={handleTrichionPointerMove}
                    onPointerUp={handleTrichionPointerUp}
                  />
                  {/* Drag grip visual (centro da linha) */}
                  <g style={{ pointerEvents: "none" }}>
                    <rect
                      x={(xStart + xEnd) / 2 - S * 20}
                      y={line.y - S * 8}
                      width={S * 40}
                      height={S * 16}
                      rx={S * 3}
                      fill={isManual ? "rgba(74, 222, 128, 0.15)" : "rgba(251, 191, 36, 0.15)"}
                      stroke={isManual ? "rgba(74, 222, 128, 0.5)" : AMBER}
                      strokeWidth={S * 0.8}
                    />
                    {/* Three grip lines */}
                    {[-1, 0, 1].map(offset => (
                      <line
                        key={offset}
                        x1={(xStart + xEnd) / 2 - S * 8}
                        y1={line.y + offset * S * 3.5}
                        x2={(xStart + xEnd) / 2 + S * 8}
                        y2={line.y + offset * S * 3.5}
                        stroke={isManual ? "rgba(74, 222, 128, 0.6)" : "rgba(251, 191, 36, 0.6)"}
                        strokeWidth={S * 0.8}
                        strokeLinecap="round"
                      />
                    ))}
                  </g>
                </>
              )}
            </g>
          );
        })}

        {/* Labels flutuantes por segmento */}
        {lines.slice(1).map((line, i) => {
          if (!line.label) return null;
          const { name, mm, midY } = line.label;
          const lx = xEnd + padX;
          return (
            <g key={`label-thirds-${i}`}>
              <rect
                x={lx}
                y={midY - labelH / 2}
                width={labelW}
                height={labelH}
                rx={labelRx}
                fill={AMBER_LABEL_BG}
                stroke={AMBER}
                strokeWidth={S * 1}
              />
              <text
                x={lx + padX}
                y={midY - fontMm * 0.2}
                fill={AMBER_SOLID}
                fontSize={fontName}
                fontFamily="'SF Mono', 'Fira Code', monospace"
                fontWeight="600"
                letterSpacing="0.04em"
              >
                {name}
              </text>
              <text
                x={lx + padX}
                y={midY + fontMm * 1.2}
                fill="rgba(251,191,36,0.7)"
                fontSize={fontMm}
                fontFamily="'SF Mono', 'Fira Code', monospace"
              >
                {mm} mm
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  // ── Facial Fifths Layer (Quintos Faciais) ───────────────────────────────────
  const renderFifths = () => {
    if (!fifthsData || !landmarks || landmarks.length === 0 || !dimensions.width) return null;

    const W = dimensions.width;
    const H = dimensions.height;
    const lm = landmarks as Landmark[];

    // Scale factor
    const S = Math.max(W, H) / 1000;

    // Pontos âncora
    const limiteR = lm[454];
    const exoR    = lm[33];
    const endoR   = lm[133];
    const endoL   = lm[362];
    const exoL    = lm[263];
    const limiteL = lm[234];

    // Pontos para extensão vertical (trichion → menton)
    const trichion = lm[10];
    const menton   = lm[152];

    if (!limiteR || !exoR || !endoR || !endoL || !exoL || !limiteL || !trichion || !menton) return null;

    // Coordenadas X absolutas
    const x_limiteR = limiteR.x * W;
    const x_exoR    = exoR.x    * W;
    const x_endoR   = endoR.x   * W;
    const x_endoL   = endoL.x   * W;
    const x_exoL    = exoL.x    * W;
    const x_limiteL = limiteL.x * W;

    // Y: linhas verticais cobrem todo o rosto (trichion → menton) com margem
    const yTop = trichion.y * H - H * 0.03;
    const yBot = menton.y   * H + H * 0.03;

    // Visual sizes
    const strokeW  = S * 2;
    const dashArr  = `${S * 10},${S * 6}`;
    const tickLen  = S * 6;
    const tickW    = S * 2.5;
    const glowStd  = S * 2;
    const labelH   = S * 22;
    const labelRx  = S * 3;
    const fontSz   = S * 8;

    // Label Y: two staggered rows to avoid overlap
    const labelY1  = yBot + S * 12;
    const labelY2  = yBot + S * 12 + labelH + S * 6;

    const verticals = [
      { x: x_limiteR },
      { x: x_exoR },
      { x: x_endoR },
      { x: x_endoL },
      { x: x_exoL },
      { x: x_limiteL },
    ];

    const segments = [
      { x1: x_limiteR, x2: x_exoR,   data: fifthsData.outerRight },
      { x1: x_exoR,    x2: x_endoR,  data: fifthsData.rightEye },
      { x1: x_endoR,   x2: x_endoL,  data: fifthsData.interalar },
      { x1: x_endoL,   x2: x_exoL,   data: fifthsData.leftEye },
      { x1: x_exoL,    x2: x_limiteL, data: fifthsData.outerLeft },
    ];

    return (
      <g className="fifths-layer">

        {/* Linhas verticais divisoras */}
        {verticals.map((v, i) => (
          <g key={i}>
            <line
              x1={v.x} y1={yTop}
              x2={v.x} y2={yBot}
              stroke={AMBER}
              strokeWidth={strokeW}
              strokeDasharray={dashArr}
            />
            {/* Linha sólida de reforço */}
            <line
              x1={v.x} y1={yTop}
              x2={v.x} y2={yBot}
              stroke={AMBER_SOLID}
              strokeWidth={strokeW * 0.4}
            />
            {/* Tick markers topo e base */}
            <line x1={v.x - tickLen} y1={yTop} x2={v.x + tickLen} y2={yTop} stroke={AMBER_SOLID} strokeWidth={tickW} />
            <line x1={v.x - tickLen} y1={yBot} x2={v.x + tickLen} y2={yBot} stroke={AMBER_SOLID} strokeWidth={tickW} />
          </g>
        ))}

        {/* Labels abaixo de cada segmento — staggered rows */}
        {segments.map((seg, i) => {
          const midX = (seg.x1 + seg.x2) / 2;
          const segW = Math.abs(seg.x2 - seg.x1);
          const lw = Math.min(segW * 0.92, S * 90);
          const rowY = i % 2 === 0 ? labelY1 : labelY2;
          const text = `${seg.data.label}: ${seg.data.mm}mm`;
          return (
            <g key={`label-fifths-${i}`}>
              <rect
                x={midX - lw / 2}
                y={rowY}
                width={lw}
                height={labelH}
                rx={labelRx}
                fill={AMBER_LABEL_BG}
                stroke={AMBER}
                strokeWidth={S * 0.8}
              />
              <text
                x={midX}
                y={rowY + labelH * 0.65}
                fill={AMBER_SOLID}
                fontSize={fontSz}
                fontFamily="'SF Mono', 'Fira Code', monospace"
                fontWeight="600"
                textAnchor="middle"
                letterSpacing="0.02em"
              >
                {text}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  // ── Topographic Regions Layer ───────────────────────────────────────────────
  const renderTopographicRegions = () => {
    if (!topographicRegions || !dimensions.width) return null;

    return (
      <motion.g 
        className="topographic-regions-layer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        {topographicRegions.map((region, i) => {
          const pathD = region.points
            .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x * dimensions.width} ${p.y * dimensions.height}`)
            .join(" ") + " Z";
          
          return (
            <path
              key={i}
              d={pathD}
              fill="rgba(6,182,212,0.03)"
              stroke="rgba(6,182,212,0.15)"
              strokeWidth="1"
              strokeDasharray="4,4"
              className="pointer-events-auto transition-colors"
              style={{ fill: "rgba(6,182,212,0.03)" }} /* Avoid Tailwind color utilities */
            />
          );
        })}
      </motion.g>
    );
  };

  const renderLipRatio = () => {
    if (!lipRatioData || !landmarks || landmarks.length === 0 || !dimensions.width) return null;
    const S = Math.max(dimensions.width, dimensions.height) / 1000;
    const lp = lipRatioData;
    const midX = landmarks[13].x * dimensions.width;
    const topY = landmarks[0].y * dimensions.height;
    const midY = landmarks[13].y * dimensions.height;
    const botY = landmarks[17].y * dimensions.height;

    return (
      <g className="lip-ratio-layer">
         <line x1={midX - S*20} y1={topY} x2={midX + S*20} y2={topY} stroke="#F5BB5C" strokeWidth={S*1.5} />
         <line x1={midX - S*20} y1={midY} x2={midX + S*20} y2={midY} stroke="#F5BB5C" strokeWidth={S*1.5} />
         <line x1={midX - S*20} y1={botY} x2={midX + S*20} y2={botY} stroke="#F5BB5C" strokeWidth={S*1.5} />
         
         <text x={midX + S*25} y={(topY + midY)/2} fill="#F5BB5C" fontSize={S*9} fontFamily="monospace">{lp.superiorMm}mm (S)</text>
         <text x={midX + S*25} y={(midY + botY)/2} fill="#F5BB5C" fontSize={S*9} fontFamily="monospace">{lp.inferiorMm}mm (I)</text>
         <text x={midX + S*25} y={botY + S*15} fill="#F5BB5C" fontSize={S*10} fontWeight="bold" fontFamily="monospace">Ratio 1:{lp.ratio}</text>
      </g>
    );
  };

  const renderDistances = () => {
    if (!landmarks || landmarks.length === 0 || !dimensions.width) return null;
    const S = Math.max(dimensions.width, dimensions.height) / 1000;
    
    const lines = [];
    if (showBitemporal && bitemporalData) {
      const p1 = landmarks[162];
      const p2 = landmarks[389];
      lines.push({ p1, p2, data: bitemporalData, color: "#f87171" });
    }
    if (showBizygomatic && bizygomaticData) {
      const p1 = landmarks[234];
      const p2 = landmarks[454];
      lines.push({ p1, p2, data: bizygomaticData, color: "#f87171" });
    }
    if (showBigonial && bigonialData) {
      const p1 = landmarks[172];
      const p2 = landmarks[397];
      lines.push({ p1, p2, data: bigonialData, color: "#f87171" });
    }

    return (
      <g className="distances-layer">
        {lines.map((line, i) => {
          const x1 = line.p1.x * dimensions.width;
          const y1 = line.p1.y * dimensions.height;
          const x2 = line.p2.x * dimensions.width;
          const y2 = line.p2.y * dimensions.height;
          const midY = (y1 + y2) / 2;

          return (
            <g key={i}>
              <line 
                x1={x1} y1={midY} x2={x2} y2={midY} 
                stroke={line.color} strokeWidth={S*2.5} 
                strokeDasharray={`${S*8},${S*5}`}
                opacity="0.8"
              />
              <circle cx={x1} cy={midY} r={S*4} fill={line.color} />
              <circle cx={x2} cy={midY} r={S*4} fill={line.color} />
              
              <text 
                x={(x1+x2)/2} y={midY - S*10} 
                fill={line.color} fontSize={S*10} 
                textAnchor="middle" fontWeight="bold"
                fontFamily="monospace"
                style={{ textShadow: '0 0 4px rgba(0,0,0,0.8)' }}
              >
                {line.data.label}: {line.data.mm}mm
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <div ref={containerRef} className="flex-1 w-full h-full bg-[#000105] relative flex items-center justify-center overflow-hidden">
      {/* Cinematic ambient lighting */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(6,182,212,0.06) 0%, transparent 80%)' }}
      />
      
      <TransformWrapper
        ref={transformRef}
        key={`${dimensions.width}-${dimensions.height}-${resetKey}`}
        initialScale={
          dimensions.width > 0 && containerRef.current
            ? Math.min(
                (containerRef.current.offsetWidth * 0.85) / dimensions.width,
                (containerRef.current.offsetHeight * 0.85) / dimensions.height
              )
            : 0.8
        }
        onTransform={(ref) => {
          if (onZoomChange && dimensions.width > 0 && containerRef.current) {
            const base = Math.min(
              (containerRef.current.offsetWidth * 0.85) / dimensions.width,
              (containerRef.current.offsetHeight * 0.85) / dimensions.height
            );
            onZoomChange(ref.state.scale, base);
          }
        }}
        minScale={0.01}
        maxScale={20}
        centerOnInit
        limitToBounds={false}
        wheel={{ step: 0.1 }}
        doubleClick={{ mode: "reset" }}
      >
        <TransformComponent
          wrapperStyle={{ width: "100%", height: "100%", overflow: "hidden", cursor: activeTool === "select" ? "grab" : "crosshair" }}
          contentStyle={{ position: "relative" }}
        >
          <div 
            data-capture="face-table"
            className="relative rounded-[1px] p-[2px] bg-white/5 overflow-hidden"
            style={{ 
              width: dimensions.width || "auto", 
              height: dimensions.height || "auto",
              boxShadow: isLoaded ? '0 0 100px rgba(0,0,0,0.8)' : 'none'
            }}
          >
            {/* Layer 0: Original Clinical Photo */}
            <img
              ref={photoRef}
              src={imageUrl}
              alt="Mesa de Luz"
              onLoad={handleImageLoad}
              className={cn(
                "block transition-all duration-1500",
                isLoaded ? "opacity-100" : "opacity-0"
              )}
              draggable={false}
              style={{ userSelect: "none", background: "#000" }}
            />

            {/* Combined SVG Overlay */}
            {isLoaded && dimensions.width > 0 && (
              <svg
                ref={svgRef}
                viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                className="absolute inset-0 z-10 pointer-events-none"
                style={{ width: "100%", height: "100%" }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="0"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                  </marker>
                </defs>
                {renderLandmarks()}
                {renderClinicalFacilitators()}
                <AnimatePresence mode="wait">
                  {showRegions && renderTopographicRegions()}
                </AnimatePresence>

                {/* Thirds layer — animated with framer-motion via SVG foreignObject trick: use AnimatePresence wrapper at SVG level */}
                <AnimatePresence mode="wait">
                  {showThirds && thirdsData && (
                    <motion.g
                      key="thirds"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                    >
                      {renderThirds()}
                      {renderLipRatio()}
                    </motion.g>
                  )}
                </AnimatePresence>

                {/* Fifths layer */}
                <AnimatePresence mode="wait">
                  {showFifths && fifthsData && (
                    <motion.g
                      key="fifths"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                    >
                      {renderFifths()}
                    </motion.g>
                  )}
                </AnimatePresence>


                {/* Distances layer */}
                <AnimatePresence mode="wait">
                  {(showBitemporal || showBizygomatic || showBigonial) && (
                    <motion.g
                      key="distances"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      {renderDistances()}
                    </motion.g>
                  )}
                </AnimatePresence>
              </svg>
            )}


            {/* Capture Area Ref */}
            <div id="clinical-capture-area" className="sr-only" />
          </div>
        </TransformComponent>
      </TransformWrapper>

      <AnimatePresence>
        {!isLoaded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#000105] flex flex-col items-center justify-center z-50 px-8"
          >
            <div className="relative w-full max-w-xs h-[1px] bg-white/5 overflow-hidden rounded-full mt-4">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 blur-[1px]"
                style={{ backgroundColor: "rgba(6, 182, 212, 0.6)" }}
              />
            </div>
            <span className="mt-6 text-[9px] font-bold text-white/30 tracking-[0.6em] uppercase">Securing Neural Gateway</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      
      {/* Telemetry HUD */}
      <div className="absolute bottom-10 right-10 pointer-events-none hidden lg:flex flex-col items-end gap-1.5 opacity-40">
        <div className="flex items-center gap-3">
          <span className="text-[8px] font-mono uppercase" style={{ color: "rgba(34, 211, 238, 0.6)" }}>System Ready</span>
          <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_#06b6d4]" style={{ backgroundColor: "#06b6d4" }} />
        </div>
        <span className="text-[8px] font-mono text-white/40 uppercase">Mode: CLINICAL_MESH_V3</span>
        <span className="text-[8px] font-mono text-white/40 uppercase">Res: {dimensions.width}x{dimensions.height}</span>
      </div>
    </div>
  );
}
