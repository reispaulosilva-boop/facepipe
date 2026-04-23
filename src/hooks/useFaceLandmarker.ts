"use client";

import { useEffect, useState, useCallback } from "react";
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from "@mediapipe/tasks-vision";

// Using CDN to ensure matching WASM and JS bundle versions
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm";
const MODEL_URL = "/mediapipe/face_landmarker.task";

async function createLandmarker(delegate: "GPU" | "CPU"): Promise<FaceLandmarker> {
  console.log(`Creating FilesetResolver for ${delegate}...`);
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  
  console.log(`Instantiating FaceLandmarker with ${delegate} delegate...`);
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate,
    },
    outputFaceBlendshapes: true,
    runningMode: "IMAGE",
    numFaces: 1,
  });
}

// Global singleton to prevent multiple instances and disposal crashes
let sharedLandmarker: FaceLandmarker | null = null;
let initializationPromise: Promise<FaceLandmarker | null> | null = null;
let isInitializing = false;

export function useFaceLandmarker() {
  const [isLoaded, setIsLoaded] = useState(!!sharedLandmarker);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function initialize() {
      if (sharedLandmarker) {
        if (active) setIsLoaded(true);
        return;
      }

      if (initializationPromise) {
        try {
          await initializationPromise;
          if (active) setIsLoaded(true);
        } catch (_err) {
          if (active) setError("Falha ao carregar o motor facial.");
        }
        return;
      }

      if (isInitializing) return;
      isInitializing = true;

      initializationPromise = (async () => {
        try {
          console.log("Initializing shared FaceLandmarker...");
          let instance: FaceLandmarker | null = null;
          
          try {
            instance = await createLandmarker("GPU");
          } catch (_gpuErr) {
            console.warn("GPU failed, attempting CPU fallback...");
            instance = await createLandmarker("CPU");
          }

          sharedLandmarker = instance;
          return instance;
        } catch (err) {
          console.error("Critical AI failure:", err);
          throw err;
        } finally {
          isInitializing = false;
        }
      })();

      try {
        await initializationPromise;
        if (active) setIsLoaded(true);
      } catch (_err) {
        if (active) setError("Falha ao carregar o motor facial.");
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, []);

  const detectFace = useCallback(
    async (imageElement: HTMLImageElement): Promise<FaceLandmarkerResult | null> => {
      if (!sharedLandmarker) {
        console.warn("detectFace: Shared instance not ready.");
        return null;
      }
      
      try {
        if (!imageElement || !imageElement.complete || imageElement.naturalWidth === 0) {
          return null;
        }

        const canvas = document.createElement("canvas");
        canvas.width = imageElement.naturalWidth;
        canvas.height = imageElement.naturalHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        
        if (!ctx) return sharedLandmarker.detect(imageElement);

        ctx.drawImage(imageElement, 0, 0);
        const result = sharedLandmarker.detect(canvas);
        
        canvas.width = 0;
        canvas.height = 0;
        return result;
      } catch (err) {
        console.error("AI execution error:", err);
        return null;
      }
    },
    []
  );

  return { isLoaded, error, detectFace };
}
