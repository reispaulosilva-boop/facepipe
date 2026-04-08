"use client";

import React, { useRef, useEffect, useState } from "react";
import { 
  TransformWrapper, 
  TransformComponent,
  ReactZoomPanPinchRef
} from "react-zoom-pan-pinch";
import * as d3 from "d3";
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
  const landmarksCanvasRef = useRef<HTMLCanvasElement>(null);
  const d3OverlayRef = useRef<SVGSVGElement>(null);
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync dimensions with image
  const handleImageLoad = () => {
    if (!photoRef.current) return;
    const { naturalWidth, naturalHeight } = photoRef.current;
    setDimensions({ width: naturalWidth, height: naturalHeight });
    setIsLoaded(true);
    if (onLandmarksLoad && landmarks.length > 0) {
      onLandmarksLoad(landmarks.length);
    }
  };

  // ── Layer 1: Draw Landmarks (Cold Cyan) ───────────────────────────────────
  useEffect(() => {
    const canvas = landmarksCanvasRef.current;
    if (!canvas || !isLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showLandmarks || landmarks.length === 0) return;

    const COLOR_MESH = "rgba(0, 251, 204, 0.12)"; // Very soft cyan mesh
    const COLOR_CONTOURS = "rgba(0, 251, 204, 0.45)"; // Stronger cyan for key lines
    const COLOR_DOTS = "#00fbcc"; // Solid Cold Cyan for points
    
    ctx.save();
    
    // 1. Draw Mesh Tesselation
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = COLOR_MESH;
    ctx.beginPath();
    for (const connection of FaceLandmarker.FACE_LANDMARKS_TESSELATION) {
      const from = landmarks[connection.start];
      const to = landmarks[connection.end];
      if (from && to) {
        ctx.moveTo(from.x * dimensions.width, from.y * dimensions.height);
        ctx.lineTo(to.x * dimensions.width, to.y * dimensions.height);
      }
    }
    ctx.stroke();

    // 2. Draw Anatomical Contours
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = COLOR_CONTOURS;
    const contours = [
      FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
      FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
      FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
      FaceLandmarker.FACE_LANDMARKS_LIPS,
    ];
    for (const contour of contours) {
      ctx.beginPath();
      for (const connection of contour) {
        const from = landmarks[connection.start];
        const to = landmarks[connection.end];
        if (from && to) {
          ctx.moveTo(from.x * dimensions.width, from.y * dimensions.height);
          ctx.lineTo(to.x * dimensions.width, to.y * dimensions.height);
        }
      }
      ctx.stroke();
    }

    // 3. Draw High-Precision Points
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = COLOR_DOTS;
    landmarks.forEach((pt: any) => {
      ctx.beginPath();
      ctx.arc(pt.x * dimensions.width, pt.y * dimensions.height, 1, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    ctx.restore();
  }, [landmarks, showLandmarks, isLoaded, dimensions]);

  // ── Layer 2: Clinical Illustrations (Soft Gold) ───────────────────────────
  useEffect(() => {
    if (!d3OverlayRef.current || !isLoaded) return;

    const svg = d3.select(d3OverlayRef.current);
    svg.selectAll("*").remove(); 

    svg.attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);

    if (activeTool === "draw" && landmarks.length > 0) {
      const GOLD = "#F5E1A4"; // Soft Gold
      
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
        { idx: 10, label: "TRICHION" },
        { idx: 152, label: "MENTON" }
      ];
      
      const pointData = keyPoints.map(kp => {
        const pt = landmarks[kp.idx];
        if (!pt) return null;
        return {
          id: kp.idx.toString(),
          x: pt.x * dimensions.width,
          y: pt.y * dimensions.height,
          label: kp.label
        };
      }).filter(Boolean);

      const g = svg.selectAll(".clinical-facilitator")
        .data(pointData)
        .enter()
        .append("g")
        .attr("class", "clinical-facilitator")
        .style("cursor", "pointer")
        .style("pointer-events", "all");

      // Animated rotation ring
      g.append("circle")
        .attr("cx", d => d!.x)
        .attr("cy", d => d!.y)
        .attr("r", 7)
        .attr("fill", "transparent")
        .attr("stroke", GOLD)
        .attr("stroke-width", 0.4)
        .attr("stroke-dasharray", "1,3")
        .append("animateTransform")
        .attr("attributeName", "transform")
        .attr("type", "rotate")
        .attr("from", d => `0 ${d!.x} ${d!.y}`)
        .attr("to", d => `360 ${d!.x} ${d!.y}`)
        .attr("dur", "15s")
        .attr("repeatCount", "indefinite");

      // Core anchor point
      g.append("circle")
        .attr("cx", d => d!.x)
        .attr("cy", d => d!.y)
        .attr("r", 3)
        .attr("fill", GOLD)
        .style("filter", `drop-shadow(0 0 6px ${GOLD}88)`);

      // Clinical annotation label
      g.append("text")
        .attr("x", d => d!.x + 14)
        .attr("y", d => d!.y + 3)
        .text(d => d!.label)
        .attr("fill", GOLD)
        .attr("font-size", "8px")
        .attr("font-family", "monospace")
        .attr("font-weight", "600")
        .attr("letter-spacing", "1px")
        .style("opacity", 0)
        .transition()
        .delay((d, i) => i * 30)
        .duration(600)
        .style("opacity", 0.8);

      // Interactive hover behavior
      g.on("mouseenter", function() {
        d3.select(this).select("text").transition().duration(250).style("opacity", 1).attr("font-size", "10px").attr("fill", "#fff");
        d3.select(this).select("circle:last-of-type").transition().duration(250).attr("r", 5);
      }).on("mouseleave", function() {
        d3.select(this).select("text").transition().duration(250).style("opacity", 0.8).attr("font-size", "8px").attr("fill", GOLD);
        d3.select(this).select("circle:last-of-type").transition().duration(250).attr("r", 3);
      });
      
      // Eye symmetry guides
      const guides = [
        { from: "33", to: "133" },
        { from: "362", to: "263" },
        { from: "61", to: "291" }
      ];

      guides.forEach(guide => {
        const p1 = pointData.find(d => d!.id === guide.from);
        const p2 = pointData.find(d => d!.id === guide.to);
        if (p1 && p2) {
          svg.append("line")
            .attr("x1", p1.x)
            .attr("y1", p1.y)
            .attr("x2", p2.x)
            .attr("y2", p2.y)
            .attr("stroke", GOLD)
            .attr("stroke-width", 0.35)
            .attr("stroke-dasharray", "3,3")
            .style("opacity", 0.25);
        }
      });
    }
  }, [landmarks, isLoaded, dimensions, activeTool]);

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

            {/* Layer 1: Landmarks Reference Overlay */}
            <canvas
              ref={landmarksCanvasRef}
              className="absolute inset-0 pointer-events-none z-10"
              style={{ mixBlendMode: "lighten" }}
            />

            {/* Layer 2: Intelligent Illustrations Overlay */}
            <svg
              ref={d3OverlayRef}
              className="absolute inset-0 z-20 pointer-events-none"
              style={{ width: "100%", height: "100%" }}
            />
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
