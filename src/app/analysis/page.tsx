"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Activity,
  ScanFace,
  Layers,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { useFaceStore } from "@/store/useFaceStore";
import { useFaceLandmarker } from "@/hooks/useFaceLandmarker";
import { FaceLandmarker } from "@mediapipe/tasks-vision";

// ─── Zoom Controls Toolbar (uses the internal context) ────────────────────────
function ZoomControls({ onReset }: { onReset: () => void }) {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => zoomIn()}
        title="Zoom +"
        className="toolbar-btn"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        onClick={() => zoomOut()}
        title="Zoom -"
        className="toolbar-btn"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          resetTransform();
          onReset();
        }}
        title="Resetar"
        className="toolbar-btn"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Face Mesh Drawing Helper ─────────────────────────────────────────────────
function drawFaceMesh(
  ctx: CanvasRenderingContext2D,
  landmarks: { x: number; y: number; z: number }[],
  drawW: number,
  drawH: number
) {
  if (!landmarks || landmarks.length === 0) return;

  const COLOR_TESSELATION = "rgba(0, 255, 204, 0.12)";
  const COLOR_CONTOURS = "rgba(0, 255, 204, 0.55)";
  const COLOR_IRIS = "rgba(99, 179, 255, 0.7)";
  const COLOR_POINTS = "rgba(255, 255, 255, 0.35)";

  ctx.save();

  // Tesselation mesh
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = COLOR_TESSELATION;
  ctx.beginPath();
  for (const c of FaceLandmarker.FACE_LANDMARKS_TESSELATION) {
    const f = landmarks[c.start];
    const t = landmarks[c.end];
    ctx.moveTo(f.x * drawW, f.y * drawH);
    ctx.lineTo(t.x * drawW, t.y * drawH);
  }
  ctx.stroke();

  // Clinical contours
  const contourGroups = [
    { connections: FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, color: COLOR_CONTOURS, width: 1.2 },
    { connections: FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, color: COLOR_CONTOURS, width: 1 },
    { connections: FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, color: COLOR_CONTOURS, width: 1 },
    { connections: FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, color: COLOR_IRIS, width: 1.5 },
    { connections: FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, color: COLOR_IRIS, width: 1.5 },
    { connections: FaceLandmarker.FACE_LANDMARKS_LIPS, color: COLOR_CONTOURS, width: 1 },
    { connections: FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, color: COLOR_CONTOURS, width: 0.8 },
    { connections: FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, color: COLOR_CONTOURS, width: 0.8 },
  ];

  for (const group of contourGroups) {
    ctx.strokeStyle = group.color;
    ctx.lineWidth = group.width;
    ctx.beginPath();
    for (const c of group.connections) {
      const f = landmarks[c.start];
      const t = landmarks[c.end];
      ctx.moveTo(f.x * drawW, f.y * drawH);
      ctx.lineTo(t.x * drawW, t.y * drawH);
    }
    ctx.stroke();
  }

  // Landmark dots
  ctx.fillStyle = COLOR_POINTS;
  for (const lm of landmarks) {
    ctx.beginPath();
    ctx.arc(lm.x * drawW, lm.y * drawH, 0.9, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.restore();
}

// ─── Main Analysis Page ───────────────────────────────────────────────────────
export default function AnalysisPage() {
  const router = useRouter();
  const { imageFile } = useFaceStore();

  const imgRef = useRef<HTMLImageElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [htmlImage, setHtmlImage] = useState<HTMLImageElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasFace, setHasFace] = useState<boolean | null>(null);
  const [landmarkCount, setLandmarkCount] = useState(0);
  const [resetKey, setResetKey] = useState(0); // force TransformWrapper reset

  const { isLoaded: landmarkerLoaded, detectFace } = useFaceLandmarker();

  // Redirect to home if no file is stored
  useEffect(() => {
    if (!imageFile) {
      router.replace("/");
    }
  }, [imageFile, router]);

  // Build object URL & HTMLImageElement once
  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImageUrl(url);

    const img = new Image();
    img.onload = () => {
      setHtmlImage(img);
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  // Run landmark detection
  const runDetection = useCallback(async () => {
    if (!htmlImage || !overlayCanvasRef.current || !landmarkerLoaded) return;

    setIsProcessing(true);
    const result = await detectFace(htmlImage);
    setIsProcessing(false);

    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
      setHasFace(true);
      setLandmarkCount(result.faceLandmarks[0].length);

      if (showLandmarks) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawFaceMesh(ctx, result.faceLandmarks[0] as { x: number; y: number; z: number }[], canvas.width, canvas.height);
      }
    } else {
      setHasFace(false);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [htmlImage, landmarkerLoaded, detectFace, showLandmarks]);

  // Re-run detection when the image or landmarker becomes ready
  useEffect(() => {
    if (htmlImage && landmarkerLoaded) {
      runDetection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlImage, landmarkerLoaded]);

  // Toggle landmarks visibility
  useEffect(() => {
    if (!overlayCanvasRef.current) return;
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!showLandmarks) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else if (htmlImage && landmarkerLoaded) {
      runDetection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLandmarks]);

  // Set canvas size to match image natural dimensions
  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    const canvas = overlayCanvasRef.current;
    if (!img || !canvas) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
  }, []);

  if (!imageFile || !imageUrl) return null;

  return (
    <>
      {/* Inject toolbar-btn style locally */}
      <style>{`
        .toolbar-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          color: rgba(255,255,255,0.7);
          transition: all 0.2s;
          cursor: pointer;
        }
        .toolbar-btn:hover {
          background: rgba(14,165,233,0.18);
          border-color: rgba(14,165,233,0.4);
          color: #fff;
        }
        .landmark-toggle-active {
          background: rgba(14,165,233,0.25) !important;
          border-color: rgba(14,165,233,0.5) !important;
          color: #0ea5e9 !important;
        }
      `}</style>

      <div className="w-screen h-screen overflow-hidden bg-[#030712] flex flex-col" style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(14,165,233,0.12) 0%, #030712 55%)" }}>

        {/* ── Top Nav Bar ─────────────────────────────────────────────────── */}
        <nav className="flex items-center justify-between px-5 py-3 z-50 relative"
          style={{ background: "rgba(3,7,18,0.8)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(16px)" }}>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/8 transition-all text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>

            <div className="h-5 w-px bg-white/10" />

            <div className="flex items-center gap-2">
              <div className="bg-primary/20 p-1.5 rounded-lg">
                <ScanFace className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-semibold text-white/80 tracking-tight">Facepipe</span>
              <ChevronRight className="w-3 h-3 text-white/30" />
              <span className="text-sm text-white/40">Análise Clínica</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Landmark Toggle */}
            <button
              onClick={() => setShowLandmarks((v) => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 toolbar-btn ${showLandmarks ? "landmark-toggle-active" : ""}`}
              style={{ width: "auto" }}
              title={showLandmarks ? "Ocultar Landmarks" : "Mostrar Landmarks"}
            >
              {showLandmarks ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="hidden sm:inline">{showLandmarks ? "Landmarks" : "Sem Mesh"}</span>
            </button>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {isProcessing ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest">Mapeando</span>
                </>
              ) : hasFace === true ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
                  <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest">{landmarkCount} Landmarks</span>
                </>
              ) : hasFace === false ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-[10px] font-bold text-red-400/80 uppercase tracking-widest">Sem Face</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Aguardando IA</span>
                </>
              )}
            </div>

            {/* Image info */}
            {htmlImage && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Layers className="w-3 h-3 text-white/30" />
                <span className="text-[10px] font-mono text-white/40">{htmlImage.naturalWidth}×{htmlImage.naturalHeight}</span>
              </div>
            )}
          </div>
        </nav>

        {/* ── Canvas Area ──────────────────────────────────────────────────── */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">

          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 50%, rgba(14,165,233,0.04) 0%, transparent 70%)" }} />

          <TransformWrapper
            key={resetKey}
            initialScale={1}
            minScale={0.2}
            maxScale={10}
            centerOnInit
            doubleClick={{ mode: "toggle", animationTime: 200 }}
            wheel={{ step: 0.1 }}
            panning={{ velocityDisabled: false }}
          >
            {() => (
              <>
                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "100%", overflow: "hidden", cursor: "grab" }}
                  contentStyle={{ position: "relative" }}
                >
                  {/* The patient photo */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={imageUrl}
                    alt="Patient analysis"
                    onLoad={handleImageLoad}
                    draggable={false}
                    style={{
                      display: "block",
                      maxWidth: "90vw",
                      maxHeight: "calc(100vh - 120px)",
                      objectFit: "contain",
                      borderRadius: "12px",
                      userSelect: "none",
                      boxShadow: "0 0 80px rgba(14,165,233,0.08), 0 32px 64px rgba(0,0,0,0.7)",
                    }}
                  />

                  {/* Landmark overlay — perfectly aligned over the same img */}
                  <canvas
                    ref={overlayCanvasRef}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      borderRadius: "12px",
                    }}
                  />
                </TransformComponent>

                {/* ── Side Toolbar ─────────────────────────────────────────── */}
                <div className="absolute right-5 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 p-2 rounded-2xl"
                  style={{ background: "rgba(3,7,18,0.7)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}>
                  <ZoomControls onReset={() => setResetKey((k) => k + 1)} />
                  <div className="h-px bg-white/10 my-1" />
                  <button
                    onClick={() => setResetKey((k) => k + 1)}
                    title="Reset View"
                    className="toolbar-btn"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </TransformWrapper>

          {/* Processing overlay */}
          {isProcessing && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-3 px-6 py-4 rounded-2xl"
                style={{ background: "rgba(3,7,18,0.85)", border: "1px solid rgba(14,165,233,0.2)", backdropFilter: "blur(20px)" }}>
                <div className="relative flex items-center justify-center">
                  <div className="w-10 h-10 border-b-2 border-primary rounded-full animate-spin" />
                  <Activity className="absolute w-4 h-4 text-primary animate-pulse" />
                </div>
                <span className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">Mapeando Face</span>
              </div>
            </div>
          )}

          {/* IA Loading overlay */}
          {!landmarkerLoaded && htmlImage && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.25)", backdropFilter: "blur(12px)" }}>
                <div className="w-3 h-3 border-b border-primary rounded-full animate-spin" />
                <span className="text-xs font-semibold text-primary/80 tracking-wider">Iniciando motor de IA…</span>
              </div>
            </div>
          )}

          {/* Hint de arrastar */}
          {htmlImage && !isProcessing && (
            <div className="absolute bottom-6 left-6 z-30 pointer-events-none">
              <p className="text-[10px] text-white/25 font-medium">
                Scroll para zoom · Arraste para pan · Duplo-clique para zoom rápido
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
