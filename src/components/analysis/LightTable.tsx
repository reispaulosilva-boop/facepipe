"use client";

import React, { useRef, useState, useCallback } from "react";
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Landmark,
} from "@/utils/facialAnalysis";
import { AnalysisResults } from "@/store/useFaceStore";

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
  showInterpupillary?: boolean;
  showInteralar?: boolean;
  showIntercommissural?: boolean;
  showFacialShape?: boolean;
  showFacialContour?: boolean;
  showRegions?:    boolean;
  activeRegions?:  Record<string, boolean>;
  trichionOverrideY:   number | null;
  onTrichionAdjust:    (y: number) => void;
  analysisResults:     AnalysisResults;
  onLandmarksLoad?:    (count: number) => void;
  onZoomChange?:       (zoom: number, baseScale: number) => void;
  showAreasLayer?:     boolean;
  transformRef?:       React.RefObject<ReactZoomPanPinchRef | null>;
  showLandmarkNumbers: boolean;
}

export function LightTable({
  imageUrl, landmarks, showLandmarks,
  showThirds, showFifths, 
  showBitemporal = false, showBizygomatic = false, showBigonial = false,
  showMentonian = false,
  showInterpupillary = false, showInteralar = false, showIntercommissural = false,
  showFacialShape = false,
  showFacialContour = false,
  showRegions = false, activeRegions = {},
  showAreasLayer = false,
  trichionOverrideY, onTrichionAdjust, analysisResults,
  onLandmarksLoad, onZoomChange,
  transformRef,
  showLandmarkNumbers = false,
}: LightTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const photoRef     = useRef<HTMLImageElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isLoaded, setIsLoaded]     = useState(false);
  const [isDraggingTrichion, setIsDraggingTrichion] = useState(false);

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

  // ── Derived View Checks ──────────────────────────────────────────────────────
  const showAnyDistance = showBitemporal || showBizygomatic || showBigonial || showMentonian || showFacialShape || showFacialContour || showInterpupillary || showInteralar || showIntercommissural;
  const showAnyRegion   = showRegions || (analysisResults.regions && Object.values(analysisResults.regions).some(Boolean));

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
                  {showAnyRegion && analysisResults.topographicRegions && (
                    <TopographicRegionsLayer key="regions" topographicRegions={analysisResults.topographicRegions} dimensions={dimensions} showRegions={showRegions} activeRegions={activeRegions} trichionOverrideY={trichionOverrideY} landmarks={landmarks} />
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showAreasLayer && analysisResults.topographicAreas && analysisResults.topographicAreas.length > 0 && (
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
                  {showThirds && analysisResults.thirds && (
                    <motion.g key="thirds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: "easeInOut" }}>
                      <ThirdsLayer thirdsData={analysisResults.thirds} landmarks={landmarks} dimensions={dimensions} trichionOverrideY={trichionOverrideY} showThirds={showThirds} onTrichionPointerDown={handleTrichionPointerDown} onTrichionPointerMove={handleTrichionPointerMove} onTrichionPointerUp={handleTrichionPointerUp} />
                      {analysisResults.lipRatio && <LipRatioLayer lipRatioData={analysisResults.lipRatio} landmarks={landmarks} dimensions={dimensions} />}
                    </motion.g>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {showFifths && analysisResults.fifths && (
                    <motion.g key="fifths" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: "easeInOut" }}>
                      <FifthsLayer fifthsData={analysisResults.fifths} landmarks={landmarks} dimensions={dimensions} />
                    </motion.g>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {showAnyDistance && (
                    <motion.g key="distances" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                      <DistancesLayer 
                        landmarks={landmarks} 
                        dimensions={dimensions}
                        showBitemporal={showBitemporal} 
                        showBizygomatic={showBizygomatic} 
                        showBigonial={showBigonial} 
                        showMentonian={showMentonian} 
                        showInterpupillary={showInterpupillary}
                        showInteralar={showInteralar}
                        showIntercommissural={showIntercommissural}
                        showFacialShape={showFacialShape}
                        showFacialContour={showFacialContour}
                        bitemporalData={analysisResults.bitemporal}
                        bizygomaticData={analysisResults.bizygomatic}
                        bigonialData={analysisResults.bigonial}
                        mentonianData={analysisResults.mentonian}
                        interpupillaryData={analysisResults.interpupillary}
                        interalarData={analysisResults.interalar}
                        intercommissuralData={analysisResults.intercommissural}
                      />
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
