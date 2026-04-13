import { Landmark } from "@/utils/facialAnalysis";

export interface FeatureBreakdown {
  observed: number;
  target: number;
  deviationUnits: number; // norm_dev in Python
  weight: number;
}

export interface FaceEvaluationResult {
  score: number;
  distance: number;
  vectorVersion: string;
  breakdown: Record<string, FeatureBreakdown>;
}

export interface EvaluationFeatures {
  thirds_upper: number;
  thirds_middle: number;
  thirds_lower: number;
  fifths_eye_width_ratio: number;
  intercanthal_ratio: number;
  fwhr: number;
  face_height_width: number;
  mouth_nose_width: number;
  interpupil_mouth: number;
  mandibular_angle_deg: number;
  nasolabial_angle_deg: number;
  lip_ratio_lower_upper: number;
}
