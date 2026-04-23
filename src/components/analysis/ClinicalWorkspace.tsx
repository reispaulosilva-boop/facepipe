"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Toolbox, ZoomPanel } from "./Toolbox";
import { LightTable } from "./LightTable";
import { useFaceLandmarker } from "@/hooks/useFaceLandmarker";
import { useFaceStore } from "@/store/useFaceStore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { cn } from "@/lib/utils";
import { TopographicAreasPanel } from "./TopographicAreasPanel";
import { ScanFace, ArrowLeft, Image as ImageIcon } from "lucide-react";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { DownloadAnalysisButton } from "./DownloadAnalysisButton";

export function ClinicalWorkspace() {
  const { 
    imageFile,
    showThirds,
    toggleThirds,
    showFifths,
    toggleFifths,
    trichionOverrideY,
    setTrichionOverrideY,
    resetTrichion,
    analysisResults,
    showDistances,
    toggleDistances,
    showDistancesSubmenu,
    toggleDistancesSubmenu,
    showBitemporal,
    toggleBitemporal,
    showBizygomatic,
    toggleBizygomatic,
    showBigonial,
    toggleBigonial,
    showMentonian,
    toggleMentonian,
    showInterpupillary,
    toggleInterpupillary,
    showInteralar,
    toggleInteralar,
    showIntercommissural,
    toggleIntercommissural,
    showFacialShape,
    toggleFacialShape,
    showFacialContour,
    toggleFacialContour,
    showRegions,
    toggleRegions,
    showRegionsSubmenu,
    toggleRegionsSubmenu,
    toggleSpecificRegion,
    setAllRegions,
    setAnalysisResults,
    showAreasPanel,
    toggleAreasPanel,
    showLandmarkNumbers,
    toggleLandmarkNumbers,
    setLandmarksAndCompute, 
  } = useFaceStore();

  const router = useRouter();

  const [showLandmarks, setShowLandmarks] = useState(true);
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const baseScaleRef = useRef<number>(1);
  const [zoomPercent, setZoomPercent] = useState(100);

  const { isLoaded: landmarkerLoaded, detectFace } = useFaceLandmarker();

  const [lastAnalyzedFile, setLastAnalyzedFile] = useState<File | null>(null);

  // 0. Persistence Check: If no image is in store, go back to home
  useEffect(() => {
    if (!imageFile && mounted) {
      console.warn("[ClinicalWorkspace] No image file found. Redirecting to home...");
      router.push("/");
    }
  }, [imageFile, router, mounted]);

  // 1. Instant UI update: Convert file to URL for display
  const currentUrlRef = useRef<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log("[ClinicalWorkspace] imageFile effect triggered. File:", imageFile ? `${imageFile.name}` : "null");
    
    if (!imageFile) {
      setImageUrl(null);
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = null;
      }
      setLandmarks([]);
      setLastAnalyzedFile(null);
      return;
    }

    // Create new URL
    const url = URL.createObjectURL(imageFile);
    currentUrlRef.current = url;
    setImageUrl(url);
    console.log("[ClinicalWorkspace] Created ObjectURL:", url);

    return () => {
      // We don't revoke immediately on every minor re-render, only when imageFile changes
      // React's cleanup will handle this when dependencies change
      if (currentUrlRef.current) {
        console.log("[ClinicalWorkspace] Cleaning up ObjectURL:", currentUrlRef.current);
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = null;
      }
    };
  }, [imageFile]);

  // 2. Background Analysis: Trigger detection when engine is ready
  useEffect(() => {
    if (!imageFile || !landmarkerLoaded || !imageUrl) return;
    if (imageFile === lastAnalyzedFile) return;

    let mountedAnalysis = true;
    
    const runDetection = async () => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      
      img.onload = async () => {
        if (!mountedAnalysis) return;
        
        console.log("Starting background clinical analysis...");
        setIsProcessing(true);
        try {
          const result = await detectFace(img);
          if (!mountedAnalysis) return;

          if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
            const detectedLandmarks = result.faceLandmarks[0];
            console.log(`AI Success: Found ${detectedLandmarks.length} landmarks.`);
            
            // Set local state for UI responsiveness (LightTable prop)
            setLandmarks(detectedLandmarks);
            
            // Centralized calculation in store
            setLandmarksAndCompute(detectedLandmarks, img.naturalWidth, img.naturalHeight);
            
            setLastAnalyzedFile(imageFile);
          } else {
            console.warn("AI Detection: No face found in the current buffer.");
          }
        } catch (err) {
          console.error("Clinical analysis engine error:", err);
        } finally {
          if (mountedAnalysis) setIsProcessing(false);
        }
      };
    };

    runDetection();

    return () => {
      mountedAnalysis = false;
    };
  }, [imageFile, landmarkerLoaded, detectFace, lastAnalyzedFile, imageUrl, setLandmarksAndCompute]);
  

  // Legacy simulation removed (moved to store as simulateCondition)


  const [resetKey, setResetKey] = useState(0);

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

  if (!imageFile) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen bg-[#020617] text-white p-6">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <ImageIcon className="w-20 h-20 text-white/10 relative" />
        </div>
        <h2 className="text-2xl font-heading font-semibold mb-2">Nenhuma Foto Ativa</h2>
        <p className="text-white/40 text-center max-w-sm mb-8">
          Por questões de privacidade, a análise requer que você selecione a foto novamente ao recarregar o sistema.
        </p>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-premium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar para o Início</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen bg-[#020617] overflow-hidden font-body text-white selection:bg-primary/20">
      <Toolbox 
        showLandmarks={showLandmarks}
        setShowLandmarks={setShowLandmarks}
        showThirds={showThirds}
        toggleThirds={toggleThirds}
        showFifths={showFifths}
        toggleFifths={toggleFifths}
        showDistances={showDistances}
        toggleDistances={toggleDistances}
        showDistancesSubmenu={showDistancesSubmenu}
        toggleDistancesSubmenu={toggleDistancesSubmenu}
        showBitemporal={showBitemporal}
        toggleBitemporal={toggleBitemporal}
        showBizygomatic={showBizygomatic}
        toggleBizygomatic={toggleBizygomatic}
        showBigonial={showBigonial}
        toggleBigonial={toggleBigonial}
        showMentonian={showMentonian}
        toggleMentonian={toggleMentonian}
        showInterpupillary={showInterpupillary}
        toggleInterpupillary={toggleInterpupillary}
        showInteralar={showInteralar}
        toggleInteralar={toggleInteralar}
        showIntercommissural={showIntercommissural}
        toggleIntercommissural={toggleIntercommissural}
        showFacialShape={showFacialShape}
        toggleFacialShape={toggleFacialShape}
        showFacialContour={showFacialContour}
        toggleFacialContour={toggleFacialContour}
        showRegions={showRegions}
        toggleRegions={toggleRegions}
        showRegionsSubmenu={showRegionsSubmenu}
        toggleRegionsSubmenu={toggleRegionsSubmenu}
        toggleSpecificRegion={toggleSpecificRegion}
        setAllRegions={setAllRegions}
        activeRegions={analysisResults.regions}
        trichionOverrideY={trichionOverrideY}
        resetTrichion={resetTrichion}
        showAreasPanel={showAreasPanel}
        toggleAreasPanel={toggleAreasPanel}
        showLandmarkNumbers={showLandmarkNumbers}
        toggleLandmarkNumbers={toggleLandmarkNumbers}
      />

      <ZoomPanel 
        zoomPercent={zoomPercent}
        setZoomPercent={handleZoomPercentChange}
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Branding */}
        <header className="h-16 flex items-center justify-between px-10 border-b border-white/5 bg-[#000105]/60 backdrop-blur-xl z-50 transition-premium">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-lg">
                <ScanFace className="w-6 h-6 text-primary" />
              </div>
              <div className="flex flex-col">
                <h1 className="font-semibold text-lg tracking-tight text-white/90 leading-none">
                  Facepipe
                </h1>
                <p className="text-xs text-white/40 font-medium">Estúdio de Análise Clínica</p>
              </div>
            </div>

            <div className="w-px h-8 bg-white/5 mx-2" />
            
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider text-white/60 hover:text-white transition-all"
            >
              <ImageIcon className="w-3 h-3" />
              Trocar Foto
            </button>

            <div className="w-px h-8 bg-white/5 mx-2" />

            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)] animate-pulse" />
              <span className="text-[10px] font-ui text-white/30 font-medium tracking-wide">480 Pontos de Alta Precisão</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Download button */}
            <DownloadAnalysisButton disabled={isProcessing || !landmarks.length} />

            <div className="w-px h-8 bg-white/5" />

            <div className="flex flex-col items-end">
              <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest font-ui mb-1">Status de Análise</span>
              <span className={cn(
                "text-[10px] font-bold px-3 py-1 rounded-sm border transition-premium",
                isProcessing 
                  ? "text-amber-400 bg-amber-400/10 border-amber-400/20" 
                  : "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
              )}>
                {isProcessing ? "PROCESSANDO TECIDOS..." : "PROCESSAMENTO COMPLETO"}
              </span>
            </div>
          </div>
        </header>

        {imageUrl && (
          <LightTable 
            imageUrl={imageUrl}
            landmarks={landmarks}
            showLandmarks={showLandmarks}
            showThirds={showThirds}
            showFifths={showFifths}
            showDistances={showDistances}
            showBitemporal={showBitemporal}
            showBizygomatic={showBizygomatic}
            showBigonial={showBigonial}
            showMentonian={showMentonian}
            showInterpupillary={showInterpupillary}
            showInteralar={showInteralar}
            showIntercommissural={showIntercommissural}
            showFacialShape={showFacialShape}
            showFacialContour={showFacialContour}
            showRegions={showRegions}
            activeRegions={analysisResults.regions}
            showAreasLayer={showAreasPanel}
            trichionOverrideY={trichionOverrideY}
            activeTool={activeTool}
            onTrichionAdjust={setTrichionOverrideY}
            analysisResults={analysisResults}
            onLandmarksDetected={setAnalysisResults}
            resetKey={resetKey}
            transformRef={transformRef}
            onZoomChange={handleZoomChange}
            showLandmarkNumbers={showLandmarkNumbers}
          />
        )}
        
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

      {/* Painel de Áreas Topográficas */}
      <AnimatePresence>
        {showAreasPanel && (
          <TopographicAreasPanel 
            areas={analysisResults.topographicAreas || []} 
            pxPerMm={analysisResults.pxPerMm}
            onClose={toggleAreasPanel}
            className="absolute top-24 right-6 z-40"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
