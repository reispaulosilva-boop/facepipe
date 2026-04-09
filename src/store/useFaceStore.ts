import { create } from "zustand";
import { ThirdsResult, FifthsResult, LipRatioResult, TopographicRegion } from "@/utils/facialAnalysis";

interface AnalysisResults {
  thirds: ThirdsResult | null;
  fifths: FifthsResult | null;
  lipRatio: LipRatioResult | null;
  landmarks: any[] | null;
  topographicRegions: TopographicRegion[] | null;
  calibrationMm: number | null; 
  pxPerMm: number | null;
  morphology: "Oval" | "Redondo" | "Coração" | "Angular" | null;
  asymmetryScore: number | null;
  structuralRatios: {
    noseToChin: number;
    eyeWidthToFaceWidth: number;
  } | null;
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

  showAsymmetry: boolean;
  toggleAsymmetry: () => void;

  showStructural: boolean;
  toggleStructural: () => void;

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
  asymmetryScore: null,
  structuralRatios: null,
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

  showAsymmetry: false,
  toggleAsymmetry: () => set((s) => ({ showAsymmetry: !s.showAsymmetry })),

  showStructural: false,
  toggleStructural: () => set((s) => ({ showStructural: !s.showStructural })),

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
}));
