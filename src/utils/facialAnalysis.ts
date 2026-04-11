/**
 * Facepipe — Facial Proportions Engine
 * Motor de cálculo de Terços e Quintos faciais com calibração em milímetros via íris.
 * Zero-Storage: all calculations are ephemeral, in memory only.
 */

export interface Landmark {
  x: number;
  y: number;
  z?: number;
}

export interface ThirdsResult {
  /** Trichion (10) → Glabela (168) */
  upperThird: { label: string; px: number; mm: number };
  /** Glabela (168) → Subnasale (4) */
  middleThird: { label: string; px: number; mm: number };
  /** Subnasale (4) → Menton (152) */
  lowerThird: { label: string; px: number; mm: number };
  /** Razão de harmonia (ideal = 1.0 para terços iguais) */
  harmonyRatio: { upperToMiddle: number; middleToLower: number };
  /** Pixels por milímetro da calibração atual */
  pxPerMm: number;
}

export interface FifthsResult {
  /** Limite R (454) → Exocanthion R (33) */
  outerRight: { label: string; px: number; mm: number };
  /** Exocanthion R (33) → Endocanthion R (133) */
  rightEye: { label: string; px: number; mm: number };
  /** Endocanthion R (133) → Endocanthion L (362) */
  interalar: { label: string; px: number; mm: number };
  /** Endocanthion L (362) → Exocanthion L (263) */
  leftEye: { label: string; px: number; mm: number };
  /** Exocanthion L (263) → Limite L (234) */
  outerLeft: { label: string; px: number; mm: number };
  /** Pixels por milímetro da calibração atual */
  pxPerMm: number;
}

export interface LipRatioResult {
  superiorPx: number;
  superiorMm: number;
  inferiorPx: number;
  inferiorMm: number;
  ratio: number; // superior / inferior
}

export interface TopographicRegion {
  name: string;
  points: Landmark[];
  indices: number[];
}

export interface DistanceMeasurement {
  label: string;
  px: number;
  mm: number;
}

/**
 * Calcula a distância euclidiana em pixels entre dois landmarks normalizados.
 * Os landmarks têm coordenadas [0, 1] relativas à dimensão da imagem.
 */
export function distancePx(
  a: Landmark,
  b: Landmark,
  imageWidth: number,
  imageHeight: number
): number {
  const dx = (a.x - b.x) * imageWidth;
  const dy = (a.y - b.y) * imageHeight;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcula a distância vertical (eixo Y) em pixels entre dois landmarks.
 */
export function verticalDistancePx(
  a: Landmark,
  b: Landmark,
  imageHeight: number
): number {
  return Math.abs((b.y - a.y) * imageHeight);
}

/**
 * Calcula a distância horizontal (eixo X) em pixels entre dois landmarks.
 */
export function horizontalDistancePx(
  a: Landmark,
  b: Landmark,
  imageWidth: number
): number {
  return Math.abs((b.x - a.x) * imageWidth);
}

/**
 * Calibração via diâmetro horizontal da íris esquerda.
 * Pontos MediaPipe da íris esquerda: 474 (medial) e 476 (lateral).
 * Diâmetro médio da íris humana = 11.7mm (valor clínico padrão).
 *
 * @returns pixels por milímetro, ou null se os pontos forem inválidos
 */
export const IRIS_DIAMETER_MM = 11.7;

export function calcPixelsPerMm(
  landmarks: Landmark[],
  imageWidth: number,
  imageHeight: number
): number | null {
  const iris474 = landmarks[474];
  const iris476 = landmarks[476];

  if (!iris474 || !iris476) return null;

  const irisWidthPx = distancePx(iris474, iris476, imageWidth, imageHeight);
  if (irisWidthPx <= 0) return null;

  return irisWidthPx / IRIS_DIAMETER_MM;
}

/**
 * Converte pixels em milímetros usando a calibração da íris.
 */
export function pxToMm(px: number, pxPerMm: number): number {
  return parseFloat((px / pxPerMm).toFixed(1));
}

/**
 * Calcula os Terços Faciais (análise vertical).
 *
 * Referências anatômicas:
 * - Trichion:   índice 10  (topo da testa — limite superior do mesh MediaPipe)
 * - Glabela:    índice 168 (raiz nasal, entre as sobrancelhas)
 * - Subnasale:  índice 2   (base da columela, junção nariz-lábio)
 * - Menton:     índice 152 (ponto mais inferior do queixo)
 *
 * @param trichionYOverride — coordenada Y normalizada (0–1) para substituir o landmark 10
 *                            quando o médico ajusta manualmente a linha de implantação capilar.
 */
export function calcThirds(
  landmarks: Landmark[],
  imageWidth: number,
  imageHeight: number,
  trichionYOverride?: number | null
): ThirdsResult | null {
  const trichionLm = landmarks[10];
  const glabela = landmarks[168];
  const subnasale = landmarks[2];
  const menton = landmarks[152];

  if (!trichionLm || !glabela || !subnasale || !menton) return null;

  // Usar override do médico se fornecido, senão o landmark automático
  const trichion: Landmark = trichionYOverride != null
    ? { x: trichionLm.x, y: trichionYOverride }
    : trichionLm;

  const pxPerMm = calcPixelsPerMm(landmarks, imageWidth, imageHeight) ?? 1;

  const upperPx = verticalDistancePx(trichion, glabela, imageHeight);
  const middlePx = verticalDistancePx(glabela, subnasale, imageHeight);
  const lowerPx = verticalDistancePx(subnasale, menton, imageHeight);

  return {
    upperThird: {
      label: "Terço Superior",
      px: upperPx,
      mm: pxToMm(upperPx, pxPerMm),
    },
    middleThird: {
      label: "Terço Médio",
      px: middlePx,
      mm: pxToMm(middlePx, pxPerMm),
    },
    lowerThird: {
      label: "Terço Inferior",
      px: lowerPx,
      mm: pxToMm(lowerPx, pxPerMm),
    },
    harmonyRatio: {
      upperToMiddle: parseFloat((upperPx / middlePx).toFixed(2)),
      middleToLower: parseFloat((middlePx / lowerPx).toFixed(2)),
    },
    pxPerMm,
  };
}

/**
 * Calcula os Quintos Faciais (análise horizontal).
 *
 * Referências anatômicas (da direita para a esquerda no frame):
 * - Limite R:        índice 454
 * - Exocanthion R:   índice 33
 * - Endocanthion R:  índice 133
 * - Endocanthion L:  índice 362
 * - Exocanthion L:   índice 263
 * - Limite L:        índice 234
 */
export function calcFifths(
  landmarks: Landmark[],
  imageWidth: number,
  imageHeight: number
): FifthsResult | null {
  const limiteR = landmarks[454];
  const exoR = landmarks[33];
  const endoR = landmarks[133];
  const endoL = landmarks[362];
  const exoL = landmarks[263];
  const limiteL = landmarks[234];

  if (!limiteR || !exoR || !endoR || !endoL || !exoL || !limiteL) return null;

  const pxPerMm = calcPixelsPerMm(landmarks, imageWidth, imageHeight) ?? 1;

  const outerRightPx = horizontalDistancePx(limiteR, exoR, imageWidth);
  const rightEyePx = horizontalDistancePx(exoR, endoR, imageWidth);
  const interalarPx = horizontalDistancePx(endoR, endoL, imageWidth);
  const leftEyePx = horizontalDistancePx(endoL, exoL, imageWidth);
  const outerLeftPx = horizontalDistancePx(exoL, limiteL, imageWidth);

  return {
    outerRight: {
      label: "Lateral D",
      px: outerRightPx,
      mm: pxToMm(outerRightPx, pxPerMm),
    },
    rightEye: {
      label: "Olho Direito",
      px: rightEyePx,
      mm: pxToMm(rightEyePx, pxPerMm),
    },
    interalar: {
      label: "Intercantal",
      px: interalarPx,
      mm: pxToMm(interalarPx, pxPerMm),
    },
    leftEye: {
      label: "Olho Esquerdo",
      px: leftEyePx,
      mm: pxToMm(leftEyePx, pxPerMm),
    },
    outerLeft: {
      label: "Lateral E",
      px: outerLeftPx,
      mm: pxToMm(outerLeftPx, pxPerMm),
    },
    pxPerMm,
  };
}

/**
 * Calcula a Proporção Labial Vertical.
 * Referências AB Face: Vermelhão superior vs inferior (ideal ~1:1.6).
 *
 * Landmarks:
 * 0:  Labial Superior (ponto mais alto)
 * 13: Labial Médio (contato entre lábios)
 * 14: Labial Médio (contato inferior)
 * 17: Labial Inferior (ponto mais baixo)
 */
export function calcLipRatio(
  landmarks: Landmark[],
  imageHeight: number,
  pxPerMm: number
): LipRatioResult | null {
  const top = landmarks[0];
  const mid = landmarks[13];
  const bot = landmarks[17];

  if (!top || !mid || !bot) return null;

  const superiorPx = verticalDistancePx(top, mid, imageHeight);
  const inferiorPx = verticalDistancePx(mid, bot, imageHeight);

  return {
    superiorPx,
    superiorMm: pxToMm(superiorPx, pxPerMm),
    inferiorPx,
    inferiorMm: pxToMm(inferiorPx, pxPerMm),
    ratio: parseFloat((superiorPx / inferiorPx).toFixed(2)),
  };
}

/**
 * Define as regiões anatômicas baseadas no mapeamento clínico do Dr. Paulo.
 * Perspectiva: R/L referem-se ao lado do PACIENTE (Anatômico).
 */
export const TOPOGRAPHIC_INDICES: { [key: string]: number[] } = {
  // 1. FRONTAL (F) - Manual Clinical Correction (v3.2)
  frontal: [105, 104, 103, 67, 109, 10, 338, 297, 332, 333, 334, 296, 336, 9, 107, 66, 105, 63],

  // 2. GLABELA (G) - Manual Clinical Precision (v3.1)
  glabela: [107, 9, 336, 285, 351, 6, 122, 193, 55, 107],

  // 3. TEMPORAL (T) - Manual Clinical Precision (v3.1)
  temporal_r: [156, 139, 162, 21, 54, 103, 104, 105, 63, 70, 156],
  temporal_l: [332, 333, 334, 293, 300, 383, 368, 389, 251, 284, 332],

  // 4. (REMOVED)

  // 5. INFRAPALPEBRAL - Lower eyelid and tear trough
  infrapalpebral_r: [156, 143, 111, 117, 118, 119, 120, 121, 128, 245, 244, 112, 26, 22, 23, 24, 226, 156],
  infrapalpebral_l: [383, 372, 340, 346, 347, 348, 349, 350, 357, 465, 464, 341, 256, 252, 253, 254, 446, 383],

  // 6. MALAR LATERAL (ML) - External cheekbone
  malar_lateral_r: [162, 139, 156, 143, 111, 117, 118, 50, 187, 147, 93, 234, 127, 162],
  malar_lateral_l: [389, 368, 383, 372, 340, 346, 347, 280, 411, 376, 323, 454, 356, 389],

  // 6.1 MALAR MEDIAL (MM) - Mid-face zone
  malar_medial_r: [118, 50, 187, 206, 98, 64, 49, 217, 188, 121, 120, 119, 118],
  malar_medial_l: [347, 280, 411, 426, 327, 294, 279, 437, 412, 350, 349, 348, 347],

  // 7. SUBMALAR (SM) - Inner cheek hollows
  submalar_r: [93, 147, 187, 206, 98, 165, 92, 186, 57, 202, 192, 215, 132, 93],
  submalar_l: [323, 376, 411, 426, 327, 391, 322, 410, 287, 422, 416, 435, 361, 323],

  // 8. MANDIBULAR (Ma) - Jawline
  mandibular_r: [215, 138, 172, 136, 150, 149, 176, 140, 32, 194, 204, 215],
  mandibular_l: [435, 367, 397, 365, 379, 378, 400, 369, 262, 418, 424, 435],
  
  // 9. LABIAL (Lb) - Standard lip unit
  labial: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61],

  // 9.1 SUBNASAL (SN) - Base of the nose to upper lip
  subnasal: [98, 97, 2, 326, 327, 391, 393, 164, 167, 165, 98],

  // 10. PERIORAL (POr) - Skin around the mouth
  perioral: [
    57, 202, 204, 194, 201, 200, 421, 418, 424, 422, 287, 410, 322, 391, 393, 164, 167, 165, 92, 186, 57, // Outer
    61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61 // Inner hole
  ],

  // 10. MENTO (Me) - Chin
  mento: [32, 194, 201, 200, 421, 418, 262, 369, 400, 377, 152, 148, 176, 140, 32],

  // 11. NARIZ (N) - Nasal unit
  nariz: [188, 122, 6, 351, 412, 437, 429, 279, 294, 327, 326, 2, 97, 98, 64, 49, 209, 217, 188]
};


/**
 * Pontos anatômicos individuais para cálculos de proporções.
 */
export const ANATOMICAL_POINTS = {
  TRICHION: 10,
  GLABELLA: 9,
  NASION: 168,
  NASAL_TIP: 1,
  SUBNASALE: 2,
  STOMION_UPPER: 13,
  STOMION_LOWER: 14,
  MENTON: 152,
  CANTHI_MEDIAL_R: 133,
  CANTHI_LATERAL_R: 33,
  CANTHI_MEDIAL_L: 362,
  CANTHI_LATERAL_L: 263,
  IRIS_CENTER_R: 468,
  IRIS_CENTER_L: 473,
  COMMISSURE_R: 61,
  COMMISSURE_L: 291,
  GONION_R: 172,
  GONION_L: 397
};

export function getTopographicRegions(landmarks: Landmark[]): TopographicRegion[] {
  return Object.entries(TOPOGRAPHIC_INDICES).map(([name, indices]) => ({
    name: name.toUpperCase(),
    indices,
    points: indices.map(idx => landmarks[idx]).filter(Boolean),
  }));
}

/**
 * Detecta o formato do rosto (Morfologia) com base em razões de largura.
 */
export function calcMorphology(
  landmarks: Landmark[],
  imageWidth: number
): "Oval" | "Redondo" | "Coração" | "Angular" {
  const forehead = horizontalDistancePx(landmarks[21], landmarks[251], imageWidth);
  const cheekbones = horizontalDistancePx(landmarks[234], landmarks[454], imageWidth);
  const jaw = horizontalDistancePx(landmarks[172], landmarks[397], imageWidth);
  const height = verticalDistancePx(landmarks[10], landmarks[152], imageWidth); // approximate height

  // Ratios
  const fwToCb = forehead / cheekbones;
  const jToCb = jaw / cheekbones;
  const hToW = height / cheekbones;

  if (hToW < 1.3 && fwToCb < 0.9 && jToCb < 0.8) return "Coração";
  if (hToW < 1.25 && fwToCb > 0.9 && jToCb > 0.9) return "Redondo";
  if (jToCb > 0.92) return "Angular";
  return "Oval"; // Default common shape
}


/**
 * Calcula a distância Bizigomática (Largura Facial máxima).
 * Pontos: 234 (Esquerdo) e 454 (Direito).
 */
export function calcBizygomatic(
  landmarks: Landmark[],
  imageWidth: number,
  pxPerMm: number
): DistanceMeasurement | null {
  const left = landmarks[234];
  const right = landmarks[454];
  if (!left || !right) return null;

  const px = horizontalDistancePx(left, right, imageWidth);
  return {
    label: "Distância Bizigomática",
    px,
    mm: pxToMm(px, pxPerMm),
  };
}

/**
 * Calcula a distância Bigonial (Largura da Mandíbula).
 * Pontos: 172 (Esquerdo) e 397 (Direito).
 */
export function calcBigonial(
  landmarks: Landmark[],
  imageWidth: number,
  pxPerMm: number
): DistanceMeasurement | null {
  const left = landmarks[172];
  const right = landmarks[397];
  if (!left || !right) return null;

  const px = horizontalDistancePx(left, right, imageWidth);
  return {
    label: "Distância Bigonial",
    px,
    mm: pxToMm(px, pxPerMm),
  };
}

/**
 * Calcula a distância Bitemporal (Largura da Testa).
 * Pontos: 54 (Esquerdo) e 284 (Direito).
 */
export function calcBitemporal(
  landmarks: Landmark[],
  imageWidth: number,
  pxPerMm: number
): DistanceMeasurement | null {
  const left = landmarks[54];
  const right = landmarks[284];
  if (!left || !right) return null;

  const px = horizontalDistancePx(left, right, imageWidth);
  return {
    label: "Distância Bitemporal",
    px,
    mm: pxToMm(px, pxPerMm),
  };
}

/**
 * Calcula a distância Mentoniana (Largura do Queixo).
 * Pontos: 148 (Esquerdo) e 377 (Direito).
 */
export function calcMentonian(
  landmarks: Landmark[],
  imageWidth: number,
  pxPerMm: number
): DistanceMeasurement | null {
  const left = landmarks[148];
  const right = landmarks[377];
  if (!left || !right) return null;

  const px = horizontalDistancePx(left, right, imageWidth);
  return {
    label: "Distância Mentoniana",
    px,
    mm: pxToMm(px, pxPerMm),
  };
}


/**
 * Retorna as coordenadas absolutas (em pixels) de um landmark normalizado.
 */
export function landmarkToPixel(
  lm: Landmark,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } {
  return { x: lm.x * imageWidth, y: lm.y * imageHeight };
}
