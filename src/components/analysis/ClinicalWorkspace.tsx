"use client";

import React, { useState, useCallback, useRef } from "react";
import { Toolbox } from "./Toolbox";
import { LightTable } from "./LightTable";
import { DiagnosticReport } from "./DiagnosticReport";
import { useFaceLandmarker } from "@/hooks/useFaceLandmarker";
import { useFaceStore } from "@/store/useFaceStore";
import { toPng } from "html-to-image";
import { buildDiagnosticReportPrompt } from "@/lib/prompts/diagnosticReport";
import { motion } from "framer-motion";
import { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { cn } from "@/lib/utils";

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
    setDiagnosticReport,
    setIsGeneratingReport,
    isGeneratingReport,
    patientGender,
    patientAge,
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
    showRegions,
    toggleRegions,
    setIsAnalyzingSkin,
    isAnalyzingSkin,
    setAnalysisResults,
  } = useFaceStore();

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

  // Load and analyze image
  React.useEffect(() => {
    if (!imageFile || !landmarkerLoaded) return;
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
    console.log("Exporting analysis...");
    
    try {
      const captureTarget = document.querySelector('[data-capture="face-table"]') as HTMLElement;
      if (!captureTarget) {
        console.error("Capture target not found");
        return;
      }

      const dataUrl = await toPng(captureTarget, {
        quality: 1.0,
        pixelRatio: 2,
      });
      
      const link = document.createElement('a');
      link.download = `facepipe-analysis-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed", err);
    }
  }, []);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          // Redimensionar se for maior que 1600px para economizar banda e evitar HTTP 413
          const MAX_SIZE = 1600;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Exportar como JPEG com 80% de qualidade
          const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
          resolve(dataUrl.split(",")[1]);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };


  const generateDiagnosticReport = useCallback(async () => {
    if (isGeneratingReport) return;
    
    const captureTarget = document.querySelector('[data-capture="face-table"]') as HTMLElement;
    if (!captureTarget || !analysisResults.thirds) {
      alert("Por favor, realize a análise facial primeiro.");
      return;
    }

    setIsGeneratingReport(true);
    setDiagnosticReport(null);
    try {
      // 1. Capturar imagem com overlays usando toPng (que suporta oklch)
      console.log("Capturing screen for AI with toPng...");
      
      const dataUrl = await toPng(captureTarget, {
        quality: 0.85,
        pixelRatio: 1.5,
        cacheBust: true,
      });
      
      if (!dataUrl || !dataUrl.includes(",")) {
        throw new Error("Falha ao capturar imagem da análise.");
      }

      const base64Data = dataUrl.split(",")[1];

      // 2. Construir prompt especializado (AB Face)
      const { thirds, lipRatio, topographicRegions } = analysisResults;

      const prompt = buildDiagnosticReportPrompt({
        thirds: thirds!,
        lipRatio,
        topographicRegions: topographicRegions ?? [],
        analysisResults,
        patientGender,
        patientAge,
      });

      // 3. Chamar API Proxy do Gemini
      console.log("Sending request to Gemini API...");
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          imageParts: [{ inlineData: { mimeType: "image/png", data: base64Data } }],
          model: "gemini-2.5-flash",
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido no servidor" }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.text) {
        throw new Error("A IA não retornou um texto válido.");
      }
      
      setDiagnosticReport(result.text);
    } catch (err: any) {
      console.error("Detailed error generating report:", err);
      let errorMessage = "Erro desconhecido";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && err.type) {
        // Provavelmente um ErrorEvent do html-to-image
        errorMessage = `Erro de renderização (Event: ${err.type})`;
        if (err.target) console.log("Erro no alvo:", err.target);
      } else {
        errorMessage = String(err);
      }
      
      alert(`Erro ao gerar laudo: ${errorMessage}`);
    } finally {
      setIsGeneratingReport(false);
    }
  }, [analysisResults, isGeneratingReport, patientGender, patientAge, setDiagnosticReport, setIsGeneratingReport]);

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
        showRegions={showRegions}
        toggleRegions={toggleRegions}
        trichionOverrideY={trichionOverrideY}
        resetTrichion={resetTrichion}
        zoomPercent={zoomPercent}
        setZoomPercent={handleZoomPercentChange}
        onGenerateReport={generateDiagnosticReport}
        isGenerating={isGeneratingReport}
        onAnalyzeSkin={(type) => {
          if (type === "Melasma") {
            alert("Melasma: Em desenvolvimento / Aguardando implementação");
          }
        }}
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Branding */}
        <header className="h-16 flex items-center justify-between px-10 border-b border-white/5 bg-[#000105]/40 backdrop-blur-md z-30">
          <div className="flex flex-col">
            <h2 className="text-white/90 font-semibold tracking-tight leading-none mb-1">Análise de Proporções</h2>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/20">
                <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                {isProcessing ? "Processando Geometria..." : "Diagnóstico Pronto"}
              </span>
              <span className="text-[10px] text-white/30 font-medium">Ref: 480 Pontos Mapeados</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Status</span>
              <span className={isProcessing ? "text-amber-500 text-xs font-medium" : "text-emerald-500 text-xs font-medium"}>
                {isProcessing ? "ANALISANDO TECIDOS..." : "DIAGNÓSTICO PRONTO"}
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
          showRegions={showRegions}
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

        {/* DiagnosticReport removido por hora */}
        {/* <DiagnosticReport /> */}
      </main>
    </div>
  );
}
