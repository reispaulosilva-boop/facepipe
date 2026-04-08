"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, FileText, CheckCircle2 } from "lucide-react";
import { useFaceStore } from "@/store/useFaceStore";
import ReactMarkdown from "react-markdown";

export function DiagnosticReport() {
  const { diagnosticReport, setDiagnosticReport, isGeneratingReport } = useFaceStore();
  const [copied, setCopied] = React.useState(false);

  if (!diagnosticReport && !isGeneratingReport) return null;

  const handleCopy = () => {
    if (diagnosticReport) {
      navigator.clipboard.writeText(diagnosticReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {(diagnosticReport || isGeneratingReport) && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          className="fixed right-6 top-24 bottom-24 w-96 z-50 flex flex-col"
        >
          <div className="flex-1 bg-[#030712]/90 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <header className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold tracking-widest uppercase">Laudo de IA</h3>
              </div>
              <button 
                onClick={() => setDiagnosticReport(null)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                disabled={isGeneratingReport}
              >
                <X className="w-4 h-4 text-white/40" />
              </button>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {isGeneratingReport ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                  <div className="relative w-12 h-12">
                     <motion.div 
                       animate={{ rotate: 360 }}
                       transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                       className="absolute inset-0 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full"
                     />
                  </div>
                  <span className="text-[10px] font-bold text-cyan-400/60 uppercase tracking-[0.3em] animate-pulse">
                    Gerando Laudo com IA...
                  </span>
                  <p className="text-[10px] text-white/20 text-center max-w-[200px] leading-relaxed">
                    Nossos algoritmos exclusivos AB Face estão processando as métricas e a topografia facial.
                  </p>
                </div>
              ) : (
                <div className="markdown-report text-white/80 leading-relaxed text-xs prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>
                    {diagnosticReport!}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Footer */}
            {!isGeneratingReport && (
              <footer className="p-4 border-t border-white/5 bg-white/5 flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all active:scale-95 group"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/40 group-hover:text-cyan-400" />
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    {copied ? "Copiado!" : "Copiar Texto"}
                  </span>
                </button>
                <button
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-all active:scale-95 font-bold text-[10px] uppercase tracking-widest"
                >
                  PDF
                </button>
              </footer>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
