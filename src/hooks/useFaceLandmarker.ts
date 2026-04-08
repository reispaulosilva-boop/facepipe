"use client";

import { useEffect, useState, useCallback } from "react";
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from "@mediapipe/tasks-vision";

export function useFaceLandmarker() {
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let landmarkerInstance: FaceLandmarker | null = null;

    async function initialize() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        landmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "IMAGE",
          numFaces: 1
        });

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

  const detectFace = useCallback(async (imageElement: HTMLImageElement): Promise<FaceLandmarkerResult | null> => {
    if (!faceLandmarker) return null;
    
    try {
      const results = faceLandmarker.detect(imageElement);
      return results;
    } catch (err) {
      console.error("Face detection error:", err);
      return null;
    }
  }, [faceLandmarker]);

  return { isLoaded, error, detectFace };
}
