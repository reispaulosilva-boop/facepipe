"use client";

import { useEffect, useState, useCallback } from "react";
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from "@mediapipe/tasks-vision";

const WASM_URL = "/mediapipe/wasm";
const MODEL_URL = "/mediapipe/face_landmarker.task";

async function createLandmarker(delegate: "GPU" | "CPU"): Promise<FaceLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
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

export function useFaceLandmarker() {
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let landmarkerInstance: FaceLandmarker | null = null;

    async function initialize() {
      try {
        // Tenta GPU primeiro; recai em CPU se WebGL não estiver disponível
        // (modo incógnito, VMs, dispositivos sem aceleração de hardware).
        try {
          landmarkerInstance = await createLandmarker("GPU");
        } catch (gpuErr) {
          console.warn("GPU delegate indisponível, usando CPU:", gpuErr);
          landmarkerInstance = await createLandmarker("CPU");
        }

        if (active) {
          setFaceLandmarker(landmarkerInstance);
          setIsLoaded(true);
        } else {
          landmarkerInstance.close();
        }
      } catch (err) {
        console.error("Failed to initialize FaceLandmarker:", err);
        if (active) {
          setError("Falha ao carregar o motor de inteligência artificial.");
        }
      }
    }

    initialize();

    return () => {
      active = false;
      if (landmarkerInstance) {
        landmarkerInstance.close();
      }
    };
  }, []);

  const detectFace = useCallback(
    async (imageElement: HTMLImageElement): Promise<FaceLandmarkerResult | null> => {
      if (!faceLandmarker) return null;
      try {
        return faceLandmarker.detect(imageElement);
      } catch (err) {
        console.error("Face detection error:", err);
        return null;
      }
    },
    [faceLandmarker]
  );

  return { isLoaded, error, detectFace };
}
