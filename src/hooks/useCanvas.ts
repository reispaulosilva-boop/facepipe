"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface CanvasState {
  width: number;
  height: number;
  scale: number;
}

export function useCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<CanvasState>({ width: 0, height: 0, scale: 1 });

  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;

    const { clientWidth, clientHeight } = containerRef.current;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    setDimensions({
      width: clientWidth,
      height: clientHeight,
      scale: dpr
    });
  }, []);

  useEffect(() => {
    updateDimensions();
    
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [updateDimensions]);

  return { containerRef, dimensions };
}
