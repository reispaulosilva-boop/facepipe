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
  showFacialShape: boolean;
  toggleFacialShape: () => void;

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
