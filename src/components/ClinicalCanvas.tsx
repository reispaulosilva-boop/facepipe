"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useCanvas } from "@/hooks/useCanvas";
import { useFaceLandmarker } from "@/hooks/useFaceLandmarker";
import { ScanFace, Activity } from "lucide-react";
import { FaceLandmarker } from "@mediapipe/tasks-vision";

interface ClinicalCanvasProps {
  imageFile: File | null;
}

export function ClinicalCanvas({ imageFile }: ClinicalCanvasProps) {
  const { containerRef, dimensions } = useCanvas();
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const uiCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { isLoaded: landmarkerLoaded, detectFace } = useFaceLandmarker();

  // Load image when file changes
  useEffect(() => {
    // Reset state when file is cleared
    if (!imageFile) {
      setImage(null);
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setLoading(true);

    const img = new Image();
    // crossOrigin needed to avoid canvas taint when running locally
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      setImage(img);
      setLoading(false);
    };

    img.onerror = () => {
      console.error("Failed to load image from object URL");
      setLoading(false);
    };
    
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  // NOTE: `image` intentionally NOT in deps — adding it causes an infinite loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageFile]);

  // Drawing helper for the face mesh
  const drawFaceMesh = useCallback((
    ctx: CanvasRenderingContext2D, 
    landmarks: { x: number; y: number; z: number }[], 
    width: number, 
    height: number,
    offsetX: number,
    offsetY: number,
    drawW: number,
    drawH: number
  ) => {
    if (!landmarks || landmarks.length === 0) return;

    // Premium Colors
    const COLOR_TESSELATION = "rgba(0, 255, 204, 0.15)"; // Soft Cyan
    const COLOR_CONTOURS = "rgba(0, 255, 204, 0.5)";    // Stronger Cyan
    const COLOR_POINTS = "rgba(255, 255, 255, 0.4)";     // Subtle White dots

    ctx.save();
    
    // Tesselation (The 3D Mesh)
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = COLOR_TESSELATION;
    
    // MediaPipe connections for tesselation
    const tesselation = FaceLandmarker.FACE_LANDMARKS_TESSELATION;
    
    ctx.beginPath();
    for (const connection of tesselation) {
      const from = landmarks[connection.start];
      const to = landmarks[connection.end];
      
      ctx.moveTo(offsetX + from.x * drawW, offsetY + from.y * drawH);
      ctx.lineTo(offsetX + to.x * drawW, offsetY + to.y * drawH);
    }
    ctx.stroke();

    // Specific Contours (Eyes, Lips, Face Oval) for clinical precision
    ctx.lineWidth = 1;
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
        
        ctx.moveTo(offsetX + from.x * drawW, offsetY + from.y * drawH);
        ctx.lineTo(offsetX + to.x * drawW, offsetY + to.y * drawH);
      }
      ctx.stroke();
    }

    // Points (Landmarks)
    ctx.fillStyle = COLOR_POINTS;
    for (const landmark of landmarks) {
      ctx.beginPath();
      ctx.arc(offsetX + landmark.x * drawW, offsetY + landmark.y * drawH, 0.8, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.restore();
  }, []);

  // Main Draw loop
  useEffect(() => {
    if (!bgCanvasRef.current || !uiCanvasRef.current || !image || dimensions.width === 0) return;

    const bgCanvas = bgCanvasRef.current;
    const uiCanvas = uiCanvasRef.current;
    const bgCtx = bgCanvas.getContext("2d", { alpha: false });
    const uiCtx = uiCanvas.getContext("2d");

    if (!bgCtx || !uiCtx) return;

    // Set internal size based on DPR for sharpness
    const w = dimensions.width * dimensions.scale;
    const h = dimensions.height * dimensions.scale;
    
    [bgCanvas, uiCanvas].forEach(c => {
      c.width = w;
      c.height = h;
    });
    
    // Clear Background
    bgCtx.fillStyle = "#050505";
    bgCtx.fillRect(0, 0, w, h);

    // Calculate aspect ratio fit (Contain)
    const imgRatio = image.width / image.height;
    const canvasRatio = w / h;
    
    let drawW, drawH, drawX, drawY;

    if (imgRatio > canvasRatio) {
      drawW = w;
      drawH = w / imgRatio;
      drawX = 0;
      drawY = (h - drawH) / 2;
    } else {
      drawW = h * imgRatio;
      drawH = h;
      drawX = (w - drawW) / 2;
      drawY = 0;
    }

    // Draw the image
    bgCtx.imageSmoothingEnabled = true;
    bgCtx.imageSmoothingQuality = "high";
    bgCtx.drawImage(image, drawX, drawY, drawW, drawH);

    // Process Detection
    if (landmarkerLoaded) {
      let cancelled = false;
      setIsProcessing(true);
      
      detectFace(image).then(result => {
        if (cancelled) return;
        if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
          // Clear UI Canvas before drawing
          uiCtx.clearRect(0, 0, w, h);
          drawFaceMesh(uiCtx, result.faceLandmarks[0] as { x: number; y: number; z: number }[], w, h, drawX, drawY, drawW, drawH);
        } else {
          // No face found — clear any previous landmarks
          uiCtx.clearRect(0, 0, w, h);
        }
        setIsProcessing(false);
      }).catch(err => {
        if (!cancelled) {
          console.error("Detection failed:", err);
          setIsProcessing(false);
        }
      });

      return () => { cancelled = true; setIsProcessing(false); };
    }

  }, [dimensions, image, landmarkerLoaded, detectFace, drawFaceMesh]);

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black/20 rounded-xl border border-white/5">
      {/* Background Layer: Image */}
      <canvas
        ref={bgCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      />
      
      {/* UI Overlay Layer: Landmarks / Interaction */}
      <canvas
        ref={uiCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Placeholder / Empty State */}
      {!image && !loading && (
        <div className="text-center z-20 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-700">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            <ScanFace className="w-20 h-20 text-white/10 relative" strokeWidth={1} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-medium text-white/80 tracking-tight">Espaço de Análise</h3>
            <p className="text-white/30 text-sm max-w-[280px] leading-relaxed">
              Arraste ou selecione uma imagem para iniciar a malha biométrica facial.
            </p>
          </div>
        </div>
      )}

      {/* Loading/Processing State */}
      {(loading || (image && !landmarkerLoaded) || isProcessing) && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-500">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 border-b-2 border-primary rounded-full animate-spin" />
            <Activity className="absolute w-6 h-6 text-primary animate-pulse" />
          </div>
          <div className="mt-6 flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">
              {loading ? "Carregando Imagem" : !landmarkerLoaded ? "Iniciando IA" : "Mapeando Face"}
            </span>
            <div className="w-24 h-[1px] bg-primary/20 overflow-hidden">
               <div className="w-full h-full bg-primary animate-progress-slide" />
            </div>
          </div>
        </div>
      )}

      {/* Status Indicators */}
      {image && landmarkerLoaded && (
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 animate-in slide-in-from-right-4 duration-500">
          <div className="glass-panel px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-bold text-white/70 uppercase">Biometric Engine Active</span>
          </div>
          <div className="glass-panel px-3 py-1.5 rounded-lg border border-white/10">
             <span className="text-[10px] font-bold text-white/50 uppercase">{image.width}x{image.height} PX • 478 LANDMARKS</span>
          </div>
        </div>
      )}
    </div>
  );
}
