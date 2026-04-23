import { create } from "zustand";
import {
  calcThirds, calcFifths, calcPixelsPerMm, calcLipRatio,
  calcMorphology, calcBizygomatic, calcBigonial, calcBitemporal, calcMentonian,
  calcInterpupillary, calcInteralar, calcIntercommissural,
  getTopographicRegions, calcTopographicAreas,
  ThirdsResult, FifthsResult, LipRatioResult, TopographicRegion,
  DistanceMeasurement, TopographicAreaResult, Landmark
} from "@/utils/facialAnalysis";

import { generateFaceMask } from "@/utils/maskUtils";



export interface AnalysisResults {
  thirds: ThirdsResult | null;
  fifths: FifthsResult | null;
  lipRatio: LipRatioResult | null;
  landmarks: Landmark[] | null;
  topographicRegions: TopographicRegion[] | null;
  calibrationMm: number | null; 
  pxPerMm: number | null;
  morphology: "Oval" | "Redondo" | "Coração" | "Angular" | null;
  bizygomatic: DistanceMeasurement | null;
  bigonial: DistanceMeasurement | null;
  bitemporal: DistanceMeasurement | null;
  mentonian: DistanceMeasurement | null;
  interpupillary: DistanceMeasurement | null;
  interalar: DistanceMeasurement | null;
  intercommissural: DistanceMeasurement | null;
  topographicAreas: TopographicAreaResult[] | null;
  dimensions: { width: number; height: number } | null;
  regions: {
    frontal: boolean;
    temporal_r: boolean;
    temporal_l: boolean;
    glabela: boolean;
    labial: boolean;
    subnasal: boolean;
    perioral: boolean;
    malar_lateral_r: boolean;
    malar_lateral_l: boolean;
    malar_medial_r: boolean;
    malar_medial_l: boolean;
    infrapalpebral_r: boolean;
    infrapalpebral_l: boolean;
    submalar_r: boolean;
    submalar_l: boolean;
    mandibular_r: boolean;
    mandibular_l: boolean;
    mento: boolean;
    nariz: boolean;
  };
}

interface FaceStore {
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  clearImageFile: () => void;

  // Toggles de visualização de proporções
  showThirds: boolean;
  setShowThirds: (v: boolean) => void;
  toggleThirds: () => void;

  showFifths: boolean;
  setShowFifths: (v: boolean) => void;
  toggleFifths: () => void;


  showDistances: boolean;
  toggleDistances: () => void;
  showDistancesSubmenu: boolean;
  setShowDistancesSubmenu: (v: boolean) => void;
  toggleDistancesSubmenu: () => void;

  showBitemporal: boolean;
  toggleBitemporal: () => void;
  showBizygomatic: boolean;
  toggleBizygomatic: () => void;
  showBigonial: boolean;
  toggleBigonial: () => void;
  showMentonian: boolean;
  toggleMentonian: () => void;
  showInterpupillary: boolean;
  toggleInterpupillary: () => void;
  showInteralar: boolean;
  toggleInteralar: () => void;
  showIntercommissural: boolean;
  toggleIntercommissural: () => void;
  showFacialShape: boolean;
  toggleFacialShape: () => void;
  showFacialContour: boolean;
  toggleFacialContour: () => void;

  showRegions: boolean;
  toggleRegions: () => void;
  showRegionsSubmenu: boolean;
  setShowRegionsSubmenu: (v: boolean) => void;
  toggleRegionsSubmenu: () => void;
  toggleSpecificRegion: (region: keyof AnalysisResults["regions"]) => void;
  setAllRegions: (v: boolean) => void;

  // Ajuste manual do Trichion (normalizado 0–1, null = usar landmark 10)
  trichionOverrideY: number | null;
  setTrichionOverrideY: (y: number | null) => void;
  resetTrichion: () => void;

  // Resultados calculados (ephemeral — zero storage)
  analysisResults: AnalysisResults;
  setAnalysisResults: (results: Partial<AnalysisResults>) => void;
  clearAnalysisResults: () => void;

  // Painel de Áreas Topográficas
  showAreasPanel: boolean;
  toggleAreasPanel: () => void;

  // Landmark Numbering
  showLandmarkNumbers: boolean;
  toggleLandmarkNumbers: () => void;

  // Ação centralizada de cálculo
  setLandmarksAndCompute: (landmarks: Landmark[], width: number, height: number) => void;
}

const defaultAnalysisResults: AnalysisResults = {
  thirds: null,
  fifths: null,
  lipRatio: null,
  landmarks: null,
  topographicRegions: null,
  calibrationMm: null,
  pxPerMm: null,
  morphology: null,
  bizygomatic: null,
  bigonial: null,
  bitemporal: null,
  mentonian: null,
  interpupillary: null,
  interalar: null,
  intercommissural: null,
  topographicAreas: null,
  dimensions: null,
  regions: {
    frontal: false,
    temporal_r: false,
    temporal_l: false,
    glabela: false,
    labial: false,
    subnasal: false,
    perioral: false,
    malar_lateral_r: false,
    malar_lateral_l: false,
    malar_medial_r: false,
    malar_medial_l: false,
    infrapalpebral_r: false,
    infrapalpebral_l: false,
    submalar_r: false,
    submalar_l: false,
    mandibular_r: false,
    mandibular_l: false,
    mento: false,
    nariz: false,
  },
};



export const useFaceStore = create<FaceStore>((set) => ({
  imageFile: null,
  setImageFile: (file) => set({ imageFile: file }),
  clearImageFile: () =>
    set({ 
      imageFile: null, 
      analysisResults: defaultAnalysisResults, 
      trichionOverrideY: null,
    }),

  showThirds: false,
  setShowThirds: (v) => set({ showThirds: v }),
  toggleThirds: () => set((s) => ({ showThirds: !s.showThirds })),

  showFifths: false,
  setShowFifths: (v) => set({ showFifths: v }),
  toggleFifths: () => set((s) => ({ showFifths: !s.showFifths })),


  showDistances: false,
  toggleDistances: () => set((s) => ({ showDistances: !s.showDistances })),

  showDistancesSubmenu: false,
  setShowDistancesSubmenu: (v) => set({ showDistancesSubmenu: v }),
  toggleDistancesSubmenu: () => set((s) => ({ showDistancesSubmenu: !s.showDistancesSubmenu })),

  showBitemporal: false,
  toggleBitemporal: () => set((s) => ({ showBitemporal: !s.showBitemporal })),
  showBizygomatic: false,
  toggleBizygomatic: () => set((s) => ({ showBizygomatic: !s.showBizygomatic })),
  showBigonial: false,
  toggleBigonial: () => set((s) => ({ showBigonial: !s.showBigonial })),
  showMentonian: false,
  toggleMentonian: () => set((s) => ({ showMentonian: !s.showMentonian })),
  showInterpupillary: false,
  toggleInterpupillary: () => set((s) => ({ showInterpupillary: !s.showInterpupillary })),
  showInteralar: false,
  toggleInteralar: () => set((s) => ({ showInteralar: !s.showInteralar })),
  showIntercommissural: false,
  toggleIntercommissural: () => set((s) => ({ showIntercommissural: !s.showIntercommissural })),
  showFacialShape: false,
  toggleFacialShape: () => set((s) => ({ showFacialShape: !s.showFacialShape })),
  showFacialContour: false,
  toggleFacialContour: () => set((s) => ({ showFacialContour: !s.showFacialContour })),

  showRegions: false,
  toggleRegions: () => set((s) => ({ showRegions: !s.showRegions })),
  
  showRegionsSubmenu: false,
  setShowRegionsSubmenu: (v) => set({ showRegionsSubmenu: v }),
  toggleRegionsSubmenu: () => set((s) => ({ showRegionsSubmenu: !s.showRegionsSubmenu })),
  toggleSpecificRegion: (region) => set((s) => ({
    analysisResults: {
      ...s.analysisResults,
      regions: {
        ...s.analysisResults.regions,
        [region]: !s.analysisResults.regions[region]
      }
    }
  })),

  setAllRegions: (v) => set((s) => {
    const newRegions = { ...s.analysisResults.regions };
    (Object.keys(newRegions) as Array<keyof AnalysisResults["regions"]>).forEach((k) => {
      newRegions[k] = v;
    });
    return {
      analysisResults: {
        ...s.analysisResults,
        regions: newRegions
      }
    };
  }),

  trichionOverrideY: null,
  setTrichionOverrideY: (y) => {
    set({ trichionOverrideY: y });
    const state = useFaceStore.getState();
    if (state.analysisResults.landmarks) {
      state.setLandmarksAndCompute(
        state.analysisResults.landmarks,
        state.analysisResults.dimensions?.width || 0,
        state.analysisResults.dimensions?.height || 0
      );
    }
  },
  resetTrichion: () => {
    set({ trichionOverrideY: null });
    const state = useFaceStore.getState();
    if (state.analysisResults.landmarks) {
      state.setLandmarksAndCompute(
        state.analysisResults.landmarks,
        state.analysisResults.dimensions?.width || 0,
        state.analysisResults.dimensions?.height || 0
      );
    }
  },

  analysisResults: defaultAnalysisResults,
  setAnalysisResults: (results) =>
    set((s) => ({
      analysisResults: { ...s.analysisResults, ...results },
    })),
  clearAnalysisResults: () =>
    set({ analysisResults: defaultAnalysisResults }),

  showAreasPanel: false,
  toggleAreasPanel: () => set((s) => ({ showAreasPanel: !s.showAreasPanel })),

  showLandmarkNumbers: false,
  toggleLandmarkNumbers: () => set((s) => ({ showLandmarkNumbers: !s.showLandmarkNumbers })),

  setLandmarksAndCompute: (landmarks, width, height) => {
    if (!landmarks.length || !width || !height) return;

    set((s) => {
      const thirds = calcThirds(landmarks, width, height, s.trichionOverrideY);
      const fifths = calcFifths(landmarks, width, height);
      const pxPerMm = thirds.pxPerMm;
      const lipRatio = calcLipRatio(landmarks, height, pxPerMm);
      const topographicRegions = getTopographicRegions(landmarks);
      const morphology = calcMorphology(landmarks, width, height);
      
      const bizygomatic = calcBizygomatic(landmarks, width, pxPerMm);
      const bigonial = calcBigonial(landmarks, width, pxPerMm);
      const bitemporal = calcBitemporal(landmarks, width, pxPerMm);
      const mentonian = calcMentonian(landmarks, width, pxPerMm);
      const interpupillary = calcInterpupillary(landmarks, width, pxPerMm);
      const interalar = calcInteralar(landmarks, width, pxPerMm);
      const intercommissural = calcIntercommissural(landmarks, width, pxPerMm);
      const topographicAreas = calcTopographicAreas(landmarks, width, height, pxPerMm);

      return {
        analysisResults: {
          ...s.analysisResults,
          landmarks,
          thirds,
          fifths,
          lipRatio,
          topographicRegions,
          pxPerMm,
          morphology,
          bizygomatic,
          bigonial,
          bitemporal,
          mentonian,
          interpupillary,
          interalar,
          intercommissural,
          topographicAreas,
          dimensions: { width, height },
        }
      };
    });
  },
}));
