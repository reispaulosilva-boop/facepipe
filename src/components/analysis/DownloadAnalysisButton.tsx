"use client";

import React, { useState, useCallback } from "react";
import { Download, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadAnalysisAsPNG } from "@/utils/captureAnalysis";

interface DownloadAnalysisButtonProps {
  className?: string;
  disabled?: boolean;
}

type DownloadState = "idle" | "loading" | "success" | "error";

export function DownloadAnalysisButton({ 
  className,
  disabled = false 
}: DownloadAnalysisButtonProps) {
  const [state, setState] = useState<DownloadState>("idle");

  const handleDownload = useCallback(async () => {
    if (state === "loading" || disabled) return;

    setState("loading");

    try {
      // Small delay to ensure all animations are complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const success = await downloadAnalysisAsPNG("visagemed-analise", { scale: 2 });
      
      if (success) {
        setState("success");
        // Reset to idle after showing success
        setTimeout(() => setState("idle"), 2000);
      } else {
        setState("error");
        setTimeout(() => setState("idle"), 2000);
      }
    } catch (err) {
      console.error("[DownloadAnalysisButton] Download failed:", err);
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  }, [state, disabled]);

  const getIcon = () => {
    switch (state) {
      case "loading":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "success":
        return <Check className="w-4 h-4" />;
      default:
        return <Download className="w-4 h-4" />;
    }
  };

  const getLabel = () => {
    switch (state) {
      case "loading":
        return "Capturando...";
      case "success":
        return "Baixado!";
      case "error":
        return "Erro";
      default:
        return "Baixar PNG";
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || state === "loading"}
      title="Baixar foto com análise sobreposta"
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
        "border transition-all duration-300 active:scale-[0.97]",
        // State-based styling
        state === "idle" && "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20",
        state === "loading" && "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 cursor-wait",
        state === "success" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        state === "error" && "bg-red-500/10 border-red-500/20 text-red-400",
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
    >
      {getIcon()}
      <span className="hidden sm:inline">{getLabel()}</span>
    </button>
  );
}
