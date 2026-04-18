"use client";

import React, { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  calcThirds, calcFifths, calcPixelsPerMm, calcLipRatio,
  calcMorphology, calcBizygomatic, calcBigonial, calcBitemporal, calcMentonian,
  getTopographicRegions, calcTopographicAreas,
  ThirdsResult, FifthsResult, LipRatioResult, Landmark,
} from "@/utils/facialAnalysis";
import { useFaceStore } from "@/store/useFaceStore";

import { LandmarksLayer }           from "./layers/LandmarksLayer";
import { ClinicalFacilitatorsLayer } from "./layers/ClinicalFacilitatorsLayer";
import { ThirdsLayer }               from "./layers/ThirdsLayer";
import { FifthsLayer }               from "./layers/FifthsLayer";
import { LipRatioLayer }             from "./layers/LipRatioLayer";
import { TopographicRegionsLayer }   from "./layers/TopographicRegionsLayer";
import { TopographicAreasLayer }     from "./layers/TopographicAreasLayer";
import { DistancesLayer }            from "./layers/DistancesLayer";

interface LightTableProps {
  imageUrl: string;
  landmarks: Landmark[];
  showLandmarks:   boolean;
  showThirds:      boolean;
  showFifths:      boolean;
  showDistances:   boolean;
  showBitemporal?: boolean;
  showBizygomatic?: boolean;
  showBigonial?:   boolean;
  showMentonian?:  boolean;
  showFacialShape?: boolean;
  showRegions?:    boolean;
  activeRegions?:  Record<string, boolean>;
  trichionOverrideY:   number | null;
  onTrichionAdjust:    (y: number) => void;
  analysisResults:     any;
  onLandmarksDetected: (results: any) => void;
  onLandmarksLoad?:    (count: number) => void;
  onZoomChange?:       (zoom: number, baseScale: number) => void;
  showAreasLayer?:     boolean;
  resetKey?:           number;
  transformRef?:       React.RefObject<ReactZoomPanPinchRef | null>;
  activeTool?:         string;
}

export function LightTable({
  imageUrl, landmarks, showLandmarks,
  showThirds, showFifths, showDistances,
  showBitemporal = false, showBizygomatic = false, showBigonial = false,
  showMentonian = false, showFacialShape = false,
  showRegions = false, activeRegions = {},
  showAreasLayer = false,
  trichionOverrideY, onTrichionAdjust, analysisResults, onLandmarksDetected,
  onLandmarksLoad, onZoomChange,
  resetKey = 0, transformRef, activeTool = "select",
}: LightTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const photoRef     = useRef<HTMLImageElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isLoaded, setIsLoaded]     = useState(false);
  const [isDraggingTrichion, setIsDraggingTrichion] = useState(false);

  const { setAnalysisResults } = useFaceStore();

  const handleImageLoad = () => {
    if (!photoRef.current) return;
    const { naturalWidth: w, naturalHeight: h } = photoRef.current;
    if (w > 0 && h > 0) {
      setDimensions({ width: w, height: h });
      setIsLoaded(true);
      if (onLandmarksLoad && landmarks.length > 0) onLandmarksLoad(landmarks.length);
    }
  };

  // ── Trichion drag ────────────────────────────────────────────────────────────
  const screenToSvgY = useCallback((clientY: number): number => {
    if (!svgRef.current) return 0;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return 0;
    const pt = svgRef.current.createSVGPoint();
    pt.x = 0; pt.y = clientY;
    return pt.matrixTransform(ctm.inverse()).y;
  }, []);

  const handleTrichionPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    (e.target as SVGElement).setPointerCapture(e.pointerId);
    setIsDraggingTrichion(true);
  }, []);

  const handleTrichionPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingTrichion || !dimensions.height) return;
    e.stopPropagation(); e.preventDefault();
    const svgY = screenToSvgY(e.clientY);
    onTrichionAdjust(Math.max(0, Math.min(1, svgY / dimensions.height)));
  }, [isDraggingTrichion, dimensions.height, screenToSvgY, onTrichionAdjust]);

  const handleTrichionPointerUp = useCallback((e: React.PointerEvent) => {
    e.stopPropagation(); setIsDraggingTrichion(false);
  }, []);

  // ── Memoised calculations ────────────────────────────────────────────────────
  const thirdsData = useMemo<ThirdsResult | null>(() =>
    landmarks.length && dimensions.width
      ? calcThirds(landmarks, dimensions.width, dimensions.height, trichionOverrideY) : null,
    [landmarks, dimensions, trichionOverrideY]);

  const fifthsData = useMemo<FifthsResult | null>(() =>
    landmarks.length && dimensions.width
      ? calcFifths(landmarks, dimensions.width, dimensions.height) : null,
    [landmarks, dimensions]);

  const lipRatioData = useMemo<LipRatioResult | null>(() => {
    if (!landmarks.length || !dimensions.height) return null;
    const pxPerMm = calcPixelsPerMm(landmarks, dimensions.width, dimensions.height) ?? 1;
    return calcLipRatio(landmarks, dimensions.height, pxPerMm);
  }, [landmarks, dimensions]);

  const topographicRegions = useMemo(() =>
    landmarks.length ? getTopographicRegions(landmarks) : [],
    [landmarks]);

  const morphology      = useMemo(() => landmarks.length && dimensions.width ? calcMorphology(landmarks, dimensions.width) : null, [landmarks, dimensions]);
  const bizygomaticData = useMemo(() => landmarks.length && thirdsData?.pxPerMm ? calcBizygomatic(landmarks, dimensions.width, thirdsData.pxPerMm) : null, [landmarks, dimensions, thirdsData]);
  const bigonialData    = useMemo(() => landmarks.length && thirdsData?.pxPerMm ? calcBigonial(landmarks, dimensions.width, thirdsData.pxPerMm)    : null, [landmarks, dimensions, thirdsData]);
  const bitemporalData  = useMemo(() => landmarks.length && thirdsData?.pxPerMm ? calcBitemporal(landmarks, dimensions.width, thirdsData.pxPerMm)  : null, [landmarks, dimensions, thirdsData]);
  const mentonianData   = useMemo(() => landmarks.length && thirdsData?.pxPerMm ? calcMentonian(landmarks, dimensions.width, thirdsData.pxPerMm)   : null, [landmarks, dimensions, thirdsData]);

  const topographicAreas = useMemo(() => {
    if (!landmarks.length || !dimensions.width) return null;
    const pxPerMm = thirdsData?.pxPerMm ?? 1;
    return calcTopographicAreas(landmarks, dimensions.width, dimensions.height, pxPerMm);
  }, [landmarks, dimensions, thirdsData]);


  useEffect(() => {
    if (landmarks.length > 0 && dimensions.width > 0) {
      setAnalysisResults({
        thirds: thirdsData, fifths: fifthsData, lipRatio: lipRatioData,
        landmarks, topographicRegions,
        pxPerMm: thirdsData?.pxPerMm ?? null,
        morphology, bizygomatic: bizygomaticData, bigonial: bigonialData,
        bitemporal: bitemporalData, mentonian: mentonianData,
        topographicAreas,
      });
    }
  }, [landmarks, dimensions, thirdsData, fifthsData, lipRatioData, topographicRegions, bizygomaticData, bigonialData, bitemporalData, mentonianData, topographicAreas, setAnalysisResults]);

  const showAnyDistance = showBitemporal || showBizygomatic || showBigonial || showMentonian || showFacialShape;
  const showAnyRegion   = showRegions || Object.values(activeRegions).some(Boolean);

  return (
    <div ref={containerRef} className="flex-1 w-full h-full bg-[#000105] relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 50% 40%, rgba(6,182,212,0.06) 0%, transparent 80%)" }} />

      <TransformWrapper
        ref={transformRef}
        key={`${dimensions.width}-${dimensions.height}-${resetKey}`}
        initialScale={
          dimensions.width > 0 && containerRef.current
            ? Math.min((containerRef.current.offsetWidth * 0.85) / dimensions.width, (containerRef.current.offsetHeight * 0.85) / dimensions.height)
            : 0.8
        }
        onTransform={(ref) => {
          if (onZoomChange && dimensions.width > 0 && containerRef.current) {
            const base = Math.min((containerRef.current.offsetWidth * 0.85) / dimensions.width, (containerRef.current.offsetHeight * 0.85) / dimensions.height);
            onZoomChange(ref.state.scale, base);
          }
        }}
        minScale={0.01} maxScale={20} centerOnInit limitToBounds={false}
        wheel={{ step: 0.1 }} doubleClick={{ mode: "reset" }}
      >
        <TransformComponent
          wrapperStyle={{ width: "100%", height: "100%", overflow: "hidden", cursor: activeTool === "select" ? "grab" : "crosshair" }}
          contentStyle={{ position: "relative" }}
        >
          <div
            data-capture="face-table"
            className="relative rounded-[1px] p-[2px] bg-white/5 overflow-hidden"
            style={{ width: dimensions.width || "auto", height: dimensions.height || "auto", boxShadow: isLoaded ? "0 0 100px rgba(0,0,0,0.8)" : "none" }}
          >
            <img
              ref={photoRef} src={imageUrl} alt="Mesa de Luz"
              onLoad={handleImageLoad}
              className={cn("block transition-all duration-1500", isLoaded ? "opacity-100" : "opacity-0")}
              draggable={false} style={{ userSelect: "none", background: "#000" }}
            />

            {isLoaded && dimensions.width > 0 && (
              <svg ref={svgRef} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} className="absolute inset-0 z-10 pointer-events-none" style={{ width: "100%", height: "100%" }}>
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                  </marker>
                </defs>

                <motion.g
                  key={`landmarks-${showLandmarks}`}
                  initial={showLandmarks ? { opacity: 0, scale: 0.98 } : { opacity: 0 }}
                  animate={showLandmarks ? { opacity: 1, scale: 1 } : { opacity: 0 }}
                  transition={showLandmarks ? { duration: 0.4, ease: "easeOut" } : { duration: 0 }}
                >
                  {showLandmarks && (
                    <LandmarksLayer landmarks={landmarks} dimensions={dimensions} />
                  )}
                </motion.g>
                
                <ClinicalFacilitatorsLayer landmarks={landmarks} dimensions={dimensions} />

                <AnimatePresence mode="wait">
                  {showAnyRegion && (
                    <TopographicRegionsLayer key="regions" topographicRegions={topographicRegions} dimensions={dimensions} showRegions={showRegions} activeRegions={activeRegions} trichionOverrideY={trichionOverrideY} landmarks={landmarks} />
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showAreasLayer && analysisResults.topographicAreas?.length > 0 && (
                    <TopographicAreasLayer
                      key="areas"
                      landmarks={landmarks}
                      topographicAreas={analysisResults.topographicAreas}
                      dimensions={dimensions}
                      trichionOverrideY={trichionOverrideY}
                    />
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {showThirds && thirdsData && (
                    <motion.g key="thirds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: "easeInOut" }}>
                      <ThirdsLayer thirdsData={thirdsData} landmarks={landmarks} dimensions={dimensions} trichionOverrideY={trichionOverrideY} showThirds={showThirds} onTrichionPointerDown={handleTrichionPointerDown} onTrichionPointerMove={handleTrichionPointerMove} onTrichionPointerUp={handleTrichionPointerUp} />
                      {lipRatioData && <LipRatioLayer lipRatioData={lipRatioData} landmarks={landmarks} dimensions={dimensions} />}
                    </motion.g>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {showFifths && fifthsData && (
                    <motion.g key="fifths" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: "easeInOut" }}>
                      <FifthsLayer fifthsData={fifthsData} landmarks={landmarks} dimensions={dimensions} />
                    </motion.g>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {showAnyDistance && (
                    <motion.g key="distances" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                      <DistancesLayer landmarks={landmarks} dimensions={dimensions} showBitemporal={showBitemporal} showBizygomatic={showBizygomatic} showBigonial={showBigonial} showMentonian={showMentonian} showFacialShape={showFacialShape} bitemporalData={bitemporalData} bizygomaticData={bizygomaticData} bigonialData={bigonialData} mentonianData={mentonianData} />
                    </motion.g>
                  )}
                </AnimatePresence>
              </svg>
            )}
          </div>
        </TransformComponent>
      </TransformWrapper>

      <AnimatePresence>
        {!isLoaded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#000105] flex flex-col items-center justify-center z-50 px-8 transition-premium">
            <div className="relative w-full max-w-xs h-[2px] bg-white/5 overflow-hidden rounded-full mt-4">
              <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 blur-[2px] bg-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
            </div>
            <span className="mt-8 text-[10px] font-ui font-black text-white/20 tracking-[0.6em] uppercase animate-pulse">
              Securing Neural Gateway
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-10 right-10 pointer-events-none hidden lg:flex flex-col items-end gap-1.5 opacity-60 transition-premium">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-ui font-bold uppercase tracking-widest text-cyan-400/80">System Online</span>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
        </div>
        <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Mode: CLINICAL_MESH_V3</span>
        <span className="text-[8px] font-mono text-white/30 uppercase">Res: {dimensions.width}x{dimensions.height} px</span>
      </div>
    </div>
  );
}
