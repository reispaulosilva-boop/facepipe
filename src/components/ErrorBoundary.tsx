"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[FacePipe] Uncaught error in component tree:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#020617] text-white gap-6 px-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white/90 mb-1">Erro na análise facial</h2>
            <p className="text-xs text-white/40 max-w-xs leading-relaxed">
              Ocorreu um erro inesperado. Tente recarregar a página ou selecionar uma nova imagem.
            </p>
            {this.state.error && (
              <p className="mt-3 text-[10px] font-mono text-red-400/60 max-w-sm break-all">
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-xs font-semibold bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            Recarregar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
