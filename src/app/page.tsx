"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScanFace, Stethoscope, User, Settings, Play, Sparkles } from "lucide-react";
import { FileDropzone } from "@/components/FileDropzone";
import { useFaceStore } from "@/store/useFaceStore";

export default function Home() {
  const router = useRouter();
  const { imageFile, setImageFile } = useFaceStore();

  const handleFileSelect = useCallback(
    (file: File) => {
      setImageFile(file);
    },
    [setImageFile]
  );

  // Create preview URL from the stored file
  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : null;

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg">
            <ScanFace className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-lg tracking-tight text-white/90">Facepipe</h1>
            <p className="text-xs text-white/40 font-medium">Estúdio de Análise Clínica</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-all border border-white/5 hover:border-white/20 text-white/70 hover:text-white/90">
            <Settings className="w-4 h-4" />
            Configurações
          </button>
          <button className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center cursor-pointer hover:bg-primary/30 hover:border-primary/50 transition-all duration-200">
            <User className="w-5 h-5 text-primary" />
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 p-6 flex flex-col gap-6 lg:flex-row max-w-[1600px] w-full mx-auto overflow-hidden">

        {/* Sidebar / Tools */}
        <aside className="w-full lg:w-80 flex flex-col gap-4 lg:overflow-y-auto lg:max-h-[calc(100vh-8rem)] pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg flex-shrink-0">
                <Stethoscope className="w-5 h-5 text-white/70" />
              </div>
              <h2 className="font-semibold text-white/90 text-base">Análise Facial</h2>
            </div>

            <p className="text-sm text-white/50 leading-relaxed">
              Realize o upload de uma foto frontal do paciente para iniciar o processamento local (Zero-Storage).{" "}
              Nenhuma imagem é salva na nuvem.
            </p>

            <FileDropzone onFileSelect={handleFileSelect} />

            {imageFile && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-[10px] text-primary uppercase font-bold tracking-widest mb-2">Arquivo Selecionado</p>
                <p className="text-xs text-white/80 font-medium truncate">{imageFile.name}</p>
                <p className="text-[10px] text-white/40 mt-1">{(imageFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
          </div>
        </aside>

        {/* Canvas / Preview Area */}
        <section className="flex-1 glass-panel rounded-2xl flex items-center justify-center relative overflow-hidden min-h-[500px]">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

          {/* Static image preview (no landmark processing here) */}
          {previewUrl ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Patient photo preview"
                className="max-w-full max-h-full object-contain rounded-xl"
                style={{ maxHeight: "calc(100vh - 250px)" }}
              />

              {/* Floating Gradient Overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 to-transparent rounded-b-xl pointer-events-none" />

              {/* Floating 'Iniciar Análise' CTA Link */}
              <Link
                href="/analysis"
                className="absolute bottom-8 left-1/2 -translate-x-1/2 group flex items-center gap-3 px-7 py-4 rounded-2xl font-semibold text-base text-white transition-all duration-300 z-30"
                style={{
                  background: "linear-gradient(135deg, rgba(14,165,233,0.9) 0%, rgba(99,102,241,0.9) 100%)",
                  boxShadow: "0 0 40px rgba(14,165,233,0.4), 0 8px 32px rgba(0,0,0,0.4)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {/* Glow pulse ring */}
                <span className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"
                  style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.3), rgba(99,102,241,0.3))", filter: "blur(8px)" }}
                />
                <span className="relative flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-white/90 group-hover:scale-110 transition-transform duration-300" />
                  Iniciar Análise
                  <Play className="w-4 h-4 text-white/80 fill-white/80 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Link>

              {/* Zero-storage badge */}
              <div className="absolute top-4 left-4 glass-panel px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/10 z-20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Zero-Storage</span>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="text-center z-20 flex flex-col items-center gap-5 animate-in fade-in zoom-in duration-700">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <ScanFace className="w-24 h-24 text-white/15 relative" strokeWidth={1.2} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-medium text-white/80 tracking-tight">Espaço de Análise</h3>
                <p className="text-white/30 text-sm max-w-[280px] leading-relaxed">
                  Arraste ou selecione uma imagem para habilitar a análise clínica detalhada.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
