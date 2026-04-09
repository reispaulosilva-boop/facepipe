"use client";

import React, { useCallback, useState } from "react";
import { UploadCloud, FileImage } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  className?: string;
}

export function FileDropzone({ onFileSelect, className }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

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

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "glass-panel hover:bg-white/5 transition-all duration-300 border-dashed border-2 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 group cursor-pointer relative overflow-hidden",
        isDragging ? "border-primary bg-primary/10" : "border-white/20",
        className
      )}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
      />
      
      <div className={cn(
        "bg-primary/20 p-3 rounded-full transition-all duration-500",
        isDragging ? "scale-105 bg-primary/40" : "group-hover:scale-105 group-hover:bg-primary/30"
      )}>
        {isDragging ? (
          <FileImage className="w-6 h-6 text-primary animate-pulse" />
        ) : (
          <UploadCloud className="w-6 h-6 text-primary" />
        )}
      </div>

      <div className="text-center">
        <p className="text-base font-semibold text-white/90">
          {isDragging ? "Solte para analisar" : "Carregar Foto do Paciente"}
        </p>
        <p className="text-sm text-white/40 mt-1 max-w-[200px]">
          Arraste uma imagem ou clique para selecionar
        </p>
      </div>

      {/* Subtle bottom indicator */}
      <div className="flex gap-2 items-center mt-2 opacity-30 group-hover:opacity-60 transition-opacity">
        <span className="text-[10px] font-mono text-white tracking-widest uppercase">Clinical Grade Resolution</span>
      </div>
    </div>
  );
}
