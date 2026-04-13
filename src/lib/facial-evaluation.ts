/**
 * Facial Evaluation Engine
 * Ported 1:1 from beauty_vector.py logic.
 * Calculates adherence to a geometric pattern using weighted normalized Euclidean distance.
 */

import { Landmark } from "@/utils/facialAnalysis";
import { EvaluationFeatures, FaceEvaluationResult, FeatureBreakdown } from "@/types/facial-evaluation";

// =============================================================================
// 1. VETOR-ALVO (Miss Universe Reference - placeholder for versioning)
// =============================================================================
export const DEFAULT_TARGET_VECTOR: EvaluationFeatures = {
  thirds_upper:          0.34,
  thirds_middle:         0.34,
  thirds_lower:          0.32,
  fifths_eye_width_ratio:0.20,
  intercanthal_ratio:    1.00,
  fwhr:                  1.90,
  face_height_width:     1.60,
  mouth_nose_width:      1.55,
  interpupil_mouth:      1.40,
  mandibular_angle_deg:  123.0,
  nasolabial_angle_deg:  100.0,
  lip_ratio_lower_upper: 1.40,
};

export const WEIGHTS: Record<keyof EvaluationFeatures, number> = {
  thirds_upper:          0.07,
  thirds_middle:         0.07,
  thirds_lower:          0.08,
  fifths_eye_width_ratio:0.10,
  intercanthal_ratio:    0.10,
  fwhr:                  0.12,
  face_height_width:     0.10,
  mouth_nose_width:      0.08,
  interpupil_mouth:      0.08,
  mandibular_angle_deg:  0.08,
  nasolabial_angle_deg:  0.06,
  lip_ratio_lower_upper: 0.06,
};

export const TOLERANCE: Record<keyof EvaluationFeatures, number> = {
  thirds_upper:          0.03,
  thirds_middle:         0.03,
  thirds_lower:          0.03,
  fifths_eye_width_ratio:0.02,
  intercanthal_ratio:    0.10,
  fwhr:                  0.15,
  face_height_width:     0.12,
  mouth_nose_width:      0.15,
  interpupil_mouth:      0.15,
  mandibular_angle_deg:  6.0,
  nasolabial_angle_deg:  8.0,
  lip_ratio_lower_upper: 0.20,
};

// =============================================================================
// 2. GEOMETRIC UTILS
// =============================================================================

function dist(a: Landmark, b: Landmark, w: number, h: number): number {
  const dx = (a.x - b.x) * w;
  const dy = (a.y - b.y) * h;
  return Math.sqrt(dx * dx + dy * dy);
}

function angleDeg(a: Landmark, vertex: Landmark, c: Landmark, w: number, h: number): number {
  const v1 = { x: (a.x - vertex.x) * w, y: (a.y - vertex.y) * h };
  const v2 = { x: (c.x - vertex.x) * w, y: (c.y - vertex.y) * h };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const n1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const n2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  if (n1 === 0 || n2 === 0) return 0;
  const cosT = Math.max(-1, Math.min(1, dot / (n1 * n2)));
  return (Math.acos(cosT) * 180) / Math.PI;
}

// =============================================================================
// 3. FEATURE EXTRACTION
// =============================================================================

export function extractEvaluationFeatures(
  landmarks: Landmark[],
  w: number,
  h: number
): EvaluationFeatures | null {
  // Mapping MediaPipe indices to semantic points
  const lm = (idx: number) => landmarks[idx];
  
  const getP = (indices: { [key: string]: number }) => {
    const res: Record<string, Landmark> = {};
    for (const [key, idx] of Object.entries(indices)) {
      const p = lm(idx);
      if (!p) return null;
      res[key] = p;
    }
    return res;
  };

  const p = getP({
    hairline: 10, glabella: 9, subnasale: 2, menton: 152,
    eyeOuterL: 33, eyeInnerL: 133, eyeInnerR: 362, eyeOuterR: 263,
    pupilL: 468, pupilR: 473,
    zygomaticL: 234, zygomaticR: 454,
    noseL: 129, noseR: 358, noseTip: 4, columellaBase: 94,
    mouthL: 61, mouthR: 291,
    lipUpperTop: 0, lipUpperBot: 13, lipLowerTop: 14, lipLowerBot: 17,
    upperLipApex: 0,
    gonionL: 172, ramusL: 132
  });

  if (!p) return null;

  const faceH = dist(p.hairline, p.menton, w, h);
  const faceW = dist(p.zygomaticL, p.zygomaticR, w, h);
  const eyeW = dist(p.eyeOuterL, p.eyeInnerL, w, h);
  const intercanthal = dist(p.eyeInnerL, p.eyeInnerR, w, h);
  const noseW = dist(p.noseL, p.noseR, w, h);
  const mouthW = dist(p.mouthL, p.mouthR, w, h);
  const interpupil = dist(p.pupilL, p.pupilR, w, h);
  const midFaceH = dist(p.glabella, p.subnasale, w, h);
  const lipUpperH = dist(p.lipUpperTop, p.lipUpperBot, w, h);
  const lipLowerH = dist(p.lipLowerTop, p.lipLowerBot, w, h);

  return {
    thirds_upper:           dist(p.hairline, p.glabella, w, h) / faceH,
    thirds_middle:          dist(p.glabella, p.subnasale, w, h) / faceH,
    thirds_lower:           dist(p.subnasale, p.menton, w, h) / faceH,
    fifths_eye_width_ratio: eyeW / faceW,
    intercanthal_ratio:     intercanthal / eyeW,
    fwhr:                   faceW / midFaceH,
    face_height_width:      faceH / faceW,
    mouth_nose_width:       mouthW / noseW,
    interpupil_mouth:       interpupil / mouthW,
    mandibular_angle_deg:   angleDeg(p.ramusL, p.gonionL, p.menton, w, h),
    nasolabial_angle_deg:   angleDeg(p.noseTip, p.columellaBase, p.upperLipApex, w, h),
    lip_ratio_lower_upper:  lipUpperH > 0 ? lipLowerH / lipUpperH : 0,
  };
}

// =============================================================================
// 4. SCORING
// =============================================================================

export function evaluateFace(
  features: EvaluationFeatures,
  target: EvaluationFeatures = DEFAULT_TARGET_VECTOR,
  version: string = "mu-2023-v1"
): FaceEvaluationResult {
  let sqSum = 0;
  const breakdown: Record<string, FeatureBreakdown> = {};

  const keys = Object.keys(target) as (keyof EvaluationFeatures)[];
  
  for (const key of keys) {
    const observed = features[key];
    const targetVal = target[key];
    const tol = TOLERANCE[key];
    const weight = WEIGHTS[key];
    
    const normDev = (observed - targetVal) / tol;
    breakdown[key] = {
      observed,
      target: targetVal,
      deviationUnits: normDev,
      weight
    };
    
    sqSum += weight * Math.pow(normDev, 2);
  }

  const distance = Math.sqrt(sqSum);
  // score = 100 * exp(-distance / 2.0)
  const score = 100 * Math.exp(-distance / 2.0);

  return {
    score,
    distance,
    vectorVersion: version,
    breakdown
  };
}
