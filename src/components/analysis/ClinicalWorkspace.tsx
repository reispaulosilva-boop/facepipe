"use client";

import React, { useState, useCallback, useRef } from "react";
import { Toolbox } from "./Toolbox";
import { LightTable } from "./LightTable";
import { useFaceLandmarker } from "@/hooks/useFaceLandmarker";
import { useFaceStore } from "@/store/useFaceStore";
import { toPng } from "html-to-image";
import { motion } from "framer-motion";
import { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

export function ClinicalWorkspace() {
  const { imageFile } = useFaceStore();
  const [activeTool, setActiveTool] = useState("select");
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [landmarks, setLandmarks] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const workspaceRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const baseScaleRef = useRef<number>(1);
  const [zoomPercent, setZoomPercent] = useState(100);

  const { isLoaded: landmarkerLoaded, detectFace } = useFaceLandmarker();

  // State to track if current image has been analyzed
  const [lastAnalyzedFile, setLastAnalyzedFile] = useState<File | null>(null);

  // Load and analyze image
  React.useEffect(() => {
    if (!imageFile || !landmarkerLoaded) return;

    // Avoid redundant processing
    if (imageFile === lastAnalyzedFile) return;

    const url = URL.createObjectURL(imageFile);
    setImageUrl(url);
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      console.log("Analyzing clinical image...");
      setIsProcessing(true);
      try {
        const result = await detectFace(img);
        if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
          console.log(`Success: Found ${result.faceLandmarks[0].length} facial landmarks.`);
          setLandmarks(result.faceLandmarks[0]);
          setLastAnalyzedFile(imageFile);
        } else {
          console.warn("No face detected in the image.");
        }
      } catch (err) {
        console.error("Clinical analysis failed:", err);
      } finally {
        setIsProcessing(false);
      }
    };
    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [imageFile, landmarkerLoaded, detectFace, lastAnalyzedFile]);

  const handleExport = useCallback(async () => {
    if (!workspaceRef.current) return;
    
    // Aesthetic notification
    console.log("Exporting analysis...");
    
    try {
      // Find the inner container with layered canvases
      const captureTarget = document.querySelector(".relative.shadow-\\[0_0_100px_rgba\\(0\\,0\\,0\\,1\\)\\]") as HTMLElement;
      if (!captureTarget) return;

      const dataUrl = await toPng(captureTarget, {
        quality: 1.0,
        pixelRatio: 2, // 4K-ish quality
      });
      
      const link = document.createElement('a');
      link.download = `facepipe-analysis-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed", err);
    }
  }, []);

  const [resetKey, setResetKey] = useState(0);

  const handleReset = useCallback(() => {
    setResetKey(prev => prev + 1);
    setZoomPercent(100);
  }, []);

  const handleZoomChange = useCallback((currentScale: number, baseScale: number) => {
    baseScaleRef.current = baseScale;
    const percent = (currentScale / baseScale) * 100;
    setZoomPercent(percent);
  }, []);

  const handleZoomPercentChange = useCallback((percent: number) => {
    if (transformRef.current) {
      const { state } = transformRef.current;
      const targetScale = baseScaleRef.current * (percent / 100);
      transformRef.current.setTransform(state.positionX, state.positionY, targetScale, 300);
    }
    setZoomPercent(percent);
  }, []);

  if (!imageUrl) return null;

  return (
    <div className="flex w-full h-screen bg-[#020617] overflow-hidden font-sans text-white">
      <Toolbox 
        showLandmarks={showLandmarks}
        setShowLandmarks={setShowLandmarks}
        zoomPercent={zoomPercent}
        setZoomPercent={handleZoomPercentChange}
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Branding - Now static in the flex flow */}
        <header className="h-16 flex items-center justify-between px-10 border-b border-white/5 bg-[#000105]/40 backdrop-blur-md z-30">
          <div className="flex items-center gap-2">
            <span className="text-cyan-500 font-bold tracking-tighter text-xl">FACEPIPE</span>
            <div className="h-4 w-px bg-white/20 mx-2" />
            <span className="text-white/40 text-[10px] uppercase tracking-widest font-medium">Smart Clinical Workspace</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Status</span>
              <span className={isProcessing ? "text-amber-500 text-xs font-medium" : "text-emerald-500 text-xs font-medium"}>
                {isProcessing ? "ANALYZING TISSUES..." : "DIAGNOSTIC READY"}
              </span>
            </div>
          </div>
        </header>

        <LightTable 
          imageUrl={imageUrl}
          landmarks={landmarks}
          showLandmarks={showLandmarks}
          activeTool={activeTool}
          resetKey={resetKey}
          transformRef={transformRef}
          onZoomChange={handleZoomChange}
        />
        
        {/* Animated Processing Bar */}
        {isProcessing && (
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-500 z-40 origin-left"
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </main>
    </div>
  );
}
