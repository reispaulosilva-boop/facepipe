"use client";

import React, { useState, useCallback, useRef } from "react";
import { Toolbox } from "./Toolbox";
import { LightTable } from "./LightTable";
import { DiagnosticReport } from "./DiagnosticReport";
import { useFaceLandmarker } from "@/hooks/useFaceLandmarker";
import { useFaceStore } from "@/store/useFaceStore";
import { toPng } from "html-to-image";
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
    showAsymmetry,
    toggleAsymmetry,
    showStructural,
    toggleStructural,
    showDistances,
    toggleDistances,
    setIsAnalyzingSkin,
    isAnalyzingSkin,
    setAnalysisResults,
    toggleMelasmaOverlay,
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

  const processResult = (result: any) => {
    if (!result.text) {
      throw new Error("Resposta da IA vazia");
    }

    // Procura o primeiro '{' e o último '}' para extrair o JSON puro
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Não foi possível encontrar dados estruturados na resposta");
    }
    
    const melasmaData = JSON.parse(jsonMatch[0]);
    setAnalysisResults({ melasmaData });
    toggleMelasmaOverlay();
  };

  const analyzeMelasma = useCallback(async () => {
    if (isAnalyzingSkin || !imageFile) return;
    
    setIsAnalyzingSkin(true);
    try {
      // 1. Comprimir e redimensionar imagem para evitar HTTP 413 do Vercel (Payload Too Large)
      const base64Data = await compressImage(imageFile);

      // 2. Prompt especializado fornecido pelo usuário (com adição de coordenadas)
      const prompt = `Você é um assistente dermatológico avançado, especialista em visão computacional e análise de condições de pele, especialmente melasma. Seu objetivo é realizar uma análise automatizada do score mMASI modificado e gerar dados para uma visualização AR sobreposta.

Use a imagem de rosto frontal fornecida.

Realize os seguintes cálculos mMASI (Modified Melasma Area and Severity Index) em quatro regiões faciais: Testa (F), Malar Direita (RMR), Malar Esquerda (LMR), Queixo (C).

Para cada região, calcule:
- Área (A): 0 (0%), 1 (<10%), 2 (10-29%), 3 (30-49%), 4 (50-69%), 5 (70-89%), 6 (90-100%).
- Intensidade (D): 0-4 (0=ausente, 1=leve, 2=moderada, 3=acentuada, 4=máxima).
- Homogeneidade (H): 0-4 (0=mínima, 4=máxima).

Cálculo Final: mMASI = 0.3(A_F * (D_F + H_F)) + 0.3(A_RMR * (D_RMR + H_RMR)) + 0.3(A_LMR * (D_LMR + H_LMR)) + 0.1(A_C * (D_C + H_C)).

IMPORTANTE: Você deve retornar APENAS um JSON válido seguindo exatamente esta estrutura:
{
  "score_total": 0.0,
  "classificacao": "Leve/Moderado/Grave",
  "scores_regionais": {
    "testa": { "area": 0, "intensidade": 0, "homogeneidade": 0, "x": 50, "y": 25 },
    "malar_direita": { "area": 0, "intensidade": 0, "homogeneidade": 0, "x": 35, "y": 55 },
    "malar_esquerda": { "area": 0, "intensidade": 0, "homogeneidade": 0, "x": 65, "y": 55 },
    "queixo": { "area": 0, "intensidade": 0, "homogeneidade": 0, "x": 50, "y": 80 }
  }
}
Onde 'x' e 'y' são as coordenadas sugeridas para o marcador AR (em porcentagem de 0 a 100 da imagem).`;

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          imageParts: [{ inlineData: { mimeType: "image/jpeg", data: base64Data } }],
          model: "gemini-2.5-flash"
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      processResult(result);
      
    } catch (err: any) {
      console.error("Melasma analysis failure:", err);
      alert(`Análise falhou: ${err.message || "Erro desconhecido"}`);
    } finally {
      setIsAnalyzingSkin(false);
    }
  }, [imageFile, isAnalyzingSkin, setIsAnalyzingSkin, setAnalysisResults, toggleMelasmaOverlay]);

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
      const { thirds, lipRatio, landmarks, topographicRegions } = analysisResults;
      
      const prompt = `Você é um dermatologista especialista em harmonização facial, com profundo conhecimento da técnica AB Face do Dr. André Braz. Sua análise deve ser ética, científica e focada em proporções e suporte estrutural.
      
Analise a imagem e os seguintes dados métricos faciais:
- Terço Superior: ${thirds.upperThird.mm} mm
- Terço Médio: ${thirds.middleThird.mm} mm
- Terço Inferior: ${thirds.lowerThird.mm} mm
- Lábio Superior: ${lipRatio?.superiorMm} mm
- Lábio Inferior: ${lipRatio?.inferiorMm} mm (Proporção 1:${lipRatio?.ratio})
- Gênero do Paciente: ${patientGender}
- Idade Estimada: ${patientAge || "Não informada"}

Regiões Topográficas Detectadas: ${topographicRegions?.map(r => r.name).join(", ")}
Identifique o formato do rosto: ${analysisResults.morphology}. 
Assimetria Detectada: ${analysisResults.asymmetryScore}%.
Relação Base Nasal/Mento: ${analysisResults.structuralRatios?.noseToChin}.

Com base nestes dados, identifique desproporções faciais nos terços, quintos e lábios. Sugira intervenções de harmonização facial (ex: preenchimento com ácido hialurônico, bioestimuladores) alinhadas com a técnica AB Face, focando em suporte estrutural, projeção e contorno. 

O laudo deve ser conciso, profissional e incluir uma seção de 'Diagnóstico' e 'Plano de Tratamento Sugerido' em Markdown.`;

      // 3. Chamar API Proxy do Gemini
      console.log("Sending request to Gemini API...");
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          imageParts: [
            {
              inlineData: {
                mimeType: "image/png",
                data: base64Data
              }
            }
          ],
          facialMetrics: {
            thirds: {
              superior: thirds.upperThird.mm,
              medio: thirds.middleThird.mm,
              inferior: thirds.lowerThird.mm
            },
            lipRatio: {
              superior: lipRatio?.superiorMm,
              inferior: lipRatio?.inferiorMm,
              ratio: lipRatio?.ratio
            },
            landmarks: JSON.stringify(landmarks),
            topographicRegions: JSON.stringify(topographicRegions?.map(r => ({ name: r.name, points: r.points })))
          },
          patientInfo: {
            gender: patientGender,
            age: patientAge
          }
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
        showAsymmetry={showAsymmetry}
        toggleAsymmetry={toggleAsymmetry}
        showStructural={showStructural}
        toggleStructural={toggleStructural}
        showDistances={showDistances}
        toggleDistances={toggleDistances}
        trichionOverrideY={trichionOverrideY}
        resetTrichion={resetTrichion}
        zoomPercent={zoomPercent}
        setZoomPercent={handleZoomPercentChange}
        onGenerateReport={generateDiagnosticReport}
        isGenerating={isGeneratingReport}
        onAnalyzeSkin={(type) => {
          if (type === "Melasma") analyzeMelasma();
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
            {/* Analysis badges */}
            <div className="flex items-center gap-2">
              {showThirds && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-[8px] font-bold px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase tracking-widest"
                >
                  Terços ativos
                </motion.span>
              )}
              {showFifths && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-[8px] font-bold px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase tracking-widest"
                >
                  Quintos ativos
                </motion.span>
              )}
              {trichionOverrideY != null && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-[8px] font-bold px-2 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 uppercase tracking-widest"
                >
                  Trichion Ajustado
                </motion.span>
              )}
              {analysisResults.morphology && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[8px] font-bold px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 uppercase tracking-widest flex items-center gap-1.5"
                >
                  <div className="w-1 h-1 rounded-full bg-cyan-400" />
                  Face {analysisResults.morphology}
                </motion.span>
              )}
              {analysisResults.asymmetryScore !== null && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "text-[8px] font-bold px-2 py-1 rounded-full uppercase tracking-widest",
                    analysisResults.asymmetryScore < 15 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                    analysisResults.asymmetryScore < 30 ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                    "bg-red-500/10 border-red-500/30 text-red-400"
                  )}
                >
                  Assimetria: {analysisResults.asymmetryScore}%
                </motion.span>
              )}
            </div>

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
          showAsymmetry={showAsymmetry}
          showStructural={showStructural}
          showDistances={showDistances}
          activeTool={activeTool}
          trichionOverrideY={trichionOverrideY}
          onTrichionAdjust={setTrichionOverrideY}
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
