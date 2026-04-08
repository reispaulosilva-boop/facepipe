"use client";

import React, { useRef, useEffect, useState } from "react";
import { 
  TransformWrapper, 
  TransformComponent,
  ReactZoomPanPinchRef
} from "react-zoom-pan-pinch";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { FaceLandmarker } from "@mediapipe/tasks-vision";

interface LightTableProps {
  imageUrl: string;
  landmarks: any[];
  showLandmarks: boolean;
  activeTool: string;
  onLandmarksLoad?: (count: number) => void;
  onZoomChange?: (zoom: number, baseScale: number) => void;
  resetKey?: number;
  transformRef?: React.RefObject<ReactZoomPanPinchRef | null>;
}

export function LightTable({
  imageUrl,
  landmarks,
  showLandmarks,
  activeTool,
  onLandmarksLoad,
  onZoomChange,
  resetKey = 0,
  transformRef
}: LightTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync dimensions with image
  const handleImageLoad = () => {
    if (!photoRef.current) return;
    const { naturalWidth, naturalHeight } = photoRef.current;
    
    // Crucial: Only set dimensions if they are valid
    if (naturalWidth > 0 && naturalHeight > 0) {
      setDimensions({ width: naturalWidth, height: naturalHeight });
      setIsLoaded(true);
      if (onLandmarksLoad && landmarks.length > 0) {
        onLandmarksLoad(landmarks.length);
      }
    }
  };

  // ── Landmark Layer Logic (SVG Based) ──────────────────────────────────────
  const renderLandmarks = () => {
    if (!showLandmarks || !landmarks || landmarks.length === 0 || !dimensions.width) return null;

    const CYAN = "#00fbcc";
    
    // Generate Path Data for Tesselation
    let meshPath = "";
    for (const connection of FaceLandmarker.FACE_LANDMARKS_TESSELATION) {
      const from = landmarks[connection.start];
      const to = landmarks[connection.end];
      if (from && to) {
        meshPath += `M ${from.x * dimensions.width} ${from.y * dimensions.height} L ${to.x * dimensions.width} ${to.y * dimensions.height} `;
      }
    }

    // Generate Path Data for Contours
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
        <defs>
          <filter id="cyan-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Tesselation */}
        <path 
           d={meshPath} 
           stroke={CYAN} 
           strokeWidth="1" 
           fill="none" 
           style={{ opacity: 0.12 }}
        />
        {/* Anatomical Contours */}
        <path 
           d={contoursPath} 
           stroke={CYAN} 
           strokeWidth="2.5" 
           fill="none" 
           filter="url(#cyan-glow)"
           style={{ opacity: 0.6 }}
        />
        {/* Landmark Points */}
        {landmarks.map((pt, i) => (
          <circle 
            key={i}
            cx={pt.x * dimensions.width}
            cy={pt.y * dimensions.height}
            r="2.5"
            fill={CYAN}
            filter="url(#cyan-glow)"
            style={{ opacity: 0.7 }}
          />
        ))}
      </g>
    );
  };

  // ── Clinical Facilitators Logic (SVG Based) ────────────────────────────────
  const renderClinicalFacilitators = () => {
    // Keep this only if activeTool is select (or always if desired)
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

  return (
    <div ref={containerRef} className="flex-1 w-full h-full bg-[#000105] relative flex items-center justify-center overflow-hidden">
      {/* Cinematic ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(6,182,212,0.06)_0%,transparent_80%)] pointer-events-none" />
      
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
            className="relative shadow-[0_0_150px_rgba(0,0,0,1),0_0_1px_rgba(255,255,255,0.05)] rounded-[1px] p-[2px] bg-white/5"
            style={{ 
              width: dimensions.width || "auto", 
              height: dimensions.height || "auto",
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

            {/* Combined SVG Overlay: Landmarks + Clinical Facilitators */}
            {isLoaded && dimensions.width > 0 && (
              <svg
                viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                className="absolute inset-0 z-10 pointer-events-none"
                style={{ width: "100%", height: "100%" }}
              >
                {renderLandmarks()}
                {renderClinicalFacilitators()}
              </svg>
            )}
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
                className="absolute inset-0 bg-cyan-500/60 blur-[1px]"
              />
            </div>
            <span className="mt-6 text-[9px] font-bold text-white/30 tracking-[0.6em] uppercase">Securing Neural Gateway</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Telemetry HUD */}
      <div className="absolute bottom-10 right-10 pointer-events-none hidden lg:flex flex-col items-end gap-1.5 opacity-40">
        <div className="flex items-center gap-3">
          <span className="text-[8px] font-mono text-cyan-400/60 uppercase">System Ready</span>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_cyan]" />
        </div>
        <span className="text-[8px] font-mono text-white/40 uppercase">Mode: CLINICAL_MESH_V3</span>
        <span className="text-[8px] font-mono text-white/40 uppercase">Res: {dimensions.width}x{dimensions.height}</span>
      </div>
    </div>
  );
}
