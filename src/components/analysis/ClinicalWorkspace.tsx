"use client";

import React, { useState, useCallback, useRef } from "react";
import { Toolbox, ZoomPanel } from "./Toolbox";
import { LightTable } from "./LightTable";
import { useFaceLandmarker } from "@/hooks/useFaceLandmarker";
import { useFaceStore } from "@/store/useFaceStore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { cn } from "@/lib/utils";
import { TopographicAreasPanel } from "./TopographicAreasPanel";
import { FacialEvaluationPanel } from "./FacialEvaluationPanel";
import { ScanFace, ArrowLeft, Image as ImageIcon } from "lucide-react";

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
    showFacialShape,
    toggleFacialShape,
    showRegions,
    toggleRegions,
    showRegionsSubmenu,
    toggleRegionsSubmenu,
    toggleSpecificRegion,
    setAllRegions,
    setAnalysisResults,
    showAreasPanel,
    toggleAreasPanel,
    showEvaluationPanel,
    toggleEvaluationPanel,
  } = useFaceStore();

  const router = useRouter();

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

  const [lastAnalyzedFile, setLastAnalyzedFile] = useState<File | null>(null);

  // 1. Instant UI update: Convert file to URL for display
  React.useEffect(() => {
    if (!imageFile) {
      setImageUrl(null);
      setLandmarks([]);
      setLastAnalyzedFile(null);
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setImageUrl(url);
    console.log("Image URL created for instant display.");

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  // 2. Background Analysis: Trigger detection when engine is ready
  React.useEffect(() => {
    if (!imageFile || !landmarkerLoaded || !imageUrl) return;
    if (imageFile === lastAnalyzedFile) return;

    let mounted = true;
    
    const analyzeImage = async () => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      
      img.onload = async () => {
        if (!mounted) return;
        
        console.log("Starting background clinical analysis...");
        setIsProcessing(true);
        try {
          const result = await detectFace(img);
          if (!mounted) return;

          if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
            console.log(`AI Success: Found ${result.faceLandmarks[0].length} landmarks.`);
            setLandmarks(result.faceLandmarks[0]);
            setLastAnalyzedFile(imageFile);
          } else {
            console.warn("AI Detection: No face found in the current buffer.");
          }
        } catch (err) {
          console.error("Clinical analysis engine error:", err);
        } finally {
          if (mounted) setIsProcessing(false);
        }
      };
    };

    analyzeImage();

    return () => {
      mounted = false;
    };
  }, [imageFile, landmarkerLoaded, detectFace, lastAnalyzedFile, imageUrl]);


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

  if (!imageFile || !imageUrl) {
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
        showFacialShape={showFacialShape}
        toggleFacialShape={toggleFacialShape}
        showRegions={showRegions}
        toggleRegions={toggleRegions}
        showRegionsSubmenu={showRegionsSubmenu}
        toggleRegionsSubmenu={toggleRegionsSubmenu}
        toggleSpecificRegion={toggleSpecificRegion}
        setAllRegions={setAllRegions}
        activeRegions={(analysisResults as any).regions}
        trichionOverrideY={trichionOverrideY}
        resetTrichion={resetTrichion}
        hasLandmarks={landmarks.length > 0}
        showAreasPanel={showAreasPanel}
        toggleAreasPanel={toggleAreasPanel}
        showEvaluationPanel={showEvaluationPanel}
        toggleEvaluationPanel={toggleEvaluationPanel}
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

            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)] animate-pulse" />
              <span className="text-[10px] font-ui text-white/30 font-medium tracking-wide">480 Pontos de Alta Precisão</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">

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
          showFacialShape={showFacialShape}
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

      {/* Painel de Áreas Topográficas */}
      <AnimatePresence>
        {showAreasPanel && analysisResults.topographicAreas && (
          <TopographicAreasPanel
            areas={analysisResults.topographicAreas}
            pxPerMm={analysisResults.pxPerMm}
            onClose={toggleAreasPanel}
            className="fixed top-24 bottom-6 right-24 z-40 transition-all duration-500"
          />
        )}
      </AnimatePresence>

      {/* Painel de Avaliação Facial */}
      <AnimatePresence>
        {showEvaluationPanel && analysisResults.facialEvaluation && (
          <FacialEvaluationPanel
            evaluation={analysisResults.facialEvaluation}
            onClose={toggleEvaluationPanel}
            className="fixed top-24 bottom-6 right-24 z-40 transition-all duration-500"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
