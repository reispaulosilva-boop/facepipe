"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import { UploadCloud, FileImage, ScanFace } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  className?: string;
}

// Small floating particle dot
function Particle({ index }: { index: number }) {
  const style: React.CSSProperties = {
    left: `${15 + (index * 17) % 70}%`,
    bottom: `${10 + (index * 13) % 30}%`,
    animationDelay: `${index * 0.45}s`,
    animationDuration: `${2.4 + (index % 3) * 0.6}s`,
  };
  return (
    <span
      className="absolute w-1 h-1 rounded-full bg-primary/50 animate-dropzone-particle pointer-events-none"
      style={style}
    />
  );
}

// Animated scan line that sweeps across the face icon
function ScanLine() {
  return (
    <span className="absolute left-1 right-1 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent animate-dropzone-scanline pointer-events-none rounded-full" />
  );
}

export function FileDropzone({ onFileSelect, className }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [pulse, setPulse] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cycle the ring pulse index to stagger concentric rings
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setPulse((p) => (p + 1) % 3);
    }, 1200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const active = isDragging || isHovered;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "glass-panel transition-all duration-500 border-dashed border-2 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer relative overflow-hidden select-none",
        isDragging
          ? "border-primary/80 bg-primary/10 scale-[1.02]"
          : isHovered
          ? "border-primary/40 bg-white/5"
          : "border-white/15",
        className
      )}
    >
      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
      />

      {/* Animated border glow that rotates when active */}
      <span
        className={cn(
          "absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500",
          active ? "opacity-100" : "opacity-0"
        )}
        style={{
          background:
            "conic-gradient(from 0deg, transparent 60%, rgba(14,165,233,0.25) 80%, transparent 100%)",
          animation: active ? "dropzone-border-spin 3s linear infinite" : "none",
        }}
      />

      {/* Concentric pulse rings */}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "absolute rounded-full border border-primary/20 pointer-events-none transition-opacity duration-700",
            pulse === i ? "animate-dropzone-ring opacity-60" : "opacity-0"
          )}
          style={{
            width: `${60 + i * 28}px`,
            height: `${60 + i * 28}px`,
          }}
        />
      ))}

      {/* Floating particles (visible when hovered or dragging) */}
      {active && [0, 1, 2, 3, 4].map((i) => <Particle key={i} index={i} />)}

      {/* Icon area */}
      <div
        className={cn(
          "relative bg-primary/15 p-4 rounded-2xl transition-all duration-500 flex items-center justify-center",
          active ? "bg-primary/25 scale-110" : "animate-dropzone-float"
        )}
      >
        {/* Scan line inside icon area */}
        <ScanLine />

        {isDragging ? (
          <FileImage className="w-7 h-7 text-primary relative z-10" />
        ) : (
          <div className="relative z-10">
            <ScanFace
              className={cn(
                "w-7 h-7 text-primary transition-all duration-300",
                active ? "opacity-100" : "opacity-70"
              )}
              strokeWidth={1.5}
            />
            {/* Small upload arrow overlay */}
            <UploadCloud
              className={cn(
                "absolute -bottom-1 -right-1 w-3.5 h-3.5 text-primary/80 transition-all duration-500",
                active ? "opacity-100 translate-y-0" : "opacity-50 translate-y-0.5"
              )}
              strokeWidth={2}
            />
          </div>
        )}
      </div>

      {/* Text */}
      <div className="text-center z-10">
        <p
          className={cn(
            "text-base font-semibold transition-colors duration-300",
            active ? "text-white" : "text-white/80"
          )}
        >
          {isDragging ? "Solte para analisar" : "Carregar Foto do Paciente"}
        </p>
        <p className="text-sm text-white/40 mt-1 max-w-[200px]">
          {isDragging
            ? "Arquivo pronto para envio"
            : "Arraste uma imagem ou clique para selecionar"}
        </p>
      </div>

      {/* Bottom label */}
      <div
        className={cn(
          "flex gap-2 items-center mt-1 transition-opacity duration-300",
          active ? "opacity-60" : "opacity-25"
        )}
      >
        <span className="text-[10px] font-mono text-white tracking-widest uppercase">
          Clinical Grade Resolution
        </span>
      </div>
    </div>
  );
}
