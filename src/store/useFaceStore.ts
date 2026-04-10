import { create } from "zustand";
import { ThirdsResult, FifthsResult, LipRatioResult, TopographicRegion, DistanceMeasurement } from "@/utils/facialAnalysis";

export interface AnalysisResults {
  thirds: ThirdsResult | null;
  fifths: FifthsResult | null;
  lipRatio: LipRatioResult | null;
  landmarks: any[] | null;
  topographicRegions: TopographicRegion[] | null;
  calibrationMm: number | null; 
  pxPerMm: number | null;
  morphology: "Oval" | "Redondo" | "Coração" | "Angular" | null;
  bizygomatic: DistanceMeasurement | null;
  bigonial: DistanceMeasurement | null;
  bitemporal: DistanceMeasurement | null;
  mentonian: DistanceMeasurement | null;
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
  showFacialShape: boolean;
  toggleFacialShape: () => void;

  showRegions: boolean;
  toggleRegions: () => void;

  // Ajuste manual do Trichion (normalizado 0–1, null = usar landmark 10)
  trichionOverrideY: number | null;
  setTrichionOverrideY: (y: number | null) => void;
  resetTrichion: () => void;

  // Resultados calculados (ephemeral — zero storage)
  analysisResults: AnalysisResults;
  setAnalysisResults: (results: Partial<AnalysisResults>) => void;
  clearAnalysisResults: () => void;

  // AI Diagnostic Report
  diagnosticReport: string | null;
  isGeneratingReport: boolean;
  setDiagnosticReport: (report: string | null) => void;
  setIsGeneratingReport: (v: boolean) => void;

  // Patient Info
  patientGender: string;
  patientAge: string;
  setPatientInfo: (info: { gender?: string; age?: string }) => void;

  // Skin Quality Analysis State
  activeSkinAnalysis: string | null;
  setActiveSkinAnalysis: (v: string | null) => void;
  showSkinAnalysisSubmenu: boolean;
  setShowSkinAnalysisSubmenu: (v: boolean) => void;
  toggleSkinAnalysisSubmenu: () => void;
  
  isAnalyzingSkin: boolean;
  setIsAnalyzingSkin: (v: boolean) => void;
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
};

export const useFaceStore = create<FaceStore>((set) => ({
  imageFile: null,
  setImageFile: (file) => set({ imageFile: file }),
  clearImageFile: () =>
    set({ imageFile: null, analysisResults: defaultAnalysisResults, trichionOverrideY: null }),

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
  showFacialShape: false,
  toggleFacialShape: () => set((s) => ({ showFacialShape: !s.showFacialShape })),

  showRegions: false,
  toggleRegions: () => set((s) => ({ showRegions: !s.showRegions })),

  trichionOverrideY: null,
  setTrichionOverrideY: (y) => set({ trichionOverrideY: y }),
  resetTrichion: () => set({ trichionOverrideY: null }),

  analysisResults: defaultAnalysisResults,
  setAnalysisResults: (results) =>
    set((s) => ({
      analysisResults: { ...s.analysisResults, ...results },
    })),
  clearAnalysisResults: () =>
    set({ analysisResults: defaultAnalysisResults }),

  diagnosticReport: null,
  isGeneratingReport: false,
  setDiagnosticReport: (report) => set({ diagnosticReport: report }),
  setIsGeneratingReport: (v) => set({ isGeneratingReport: v }),

  patientGender: "Feminino",
  patientAge: "",
  setPatientInfo: (info) => set((s) => ({ 
    patientGender: info.gender ?? s.patientGender, 
    patientAge: info.age ?? s.patientAge 
  })),

  // Skin Quality Analysis State
  activeSkinAnalysis: null,
  setActiveSkinAnalysis: (v) => set({ activeSkinAnalysis: v }),
  showSkinAnalysisSubmenu: false,
  setShowSkinAnalysisSubmenu: (v) => set({ showSkinAnalysisSubmenu: v }),
  toggleSkinAnalysisSubmenu: () => set((s) => ({ showSkinAnalysisSubmenu: !s.showSkinAnalysisSubmenu })),

  isAnalyzingSkin: false,
  setIsAnalyzingSkin: (v) => set({ isAnalyzingSkin: v }),
}));
