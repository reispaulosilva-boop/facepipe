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
 * - Trichion:   índice 10
 * - Glabela:    índice 168
 * - Subnasale:  índice 4
 * - Menton:     índice 152
 */
export function calcThirds(
  landmarks: Landmark[],
  imageWidth: number,
  imageHeight: number
): ThirdsResult | null {
  const trichion = landmarks[10];
  const glabela = landmarks[168];
  const subnasale = landmarks[4];
  const menton = landmarks[152];

  if (!trichion || !glabela || !subnasale || !menton) return null;

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
 * Retorna as coordenadas absolutas (em pixels) de um landmark normalizado.
 */
export function landmarkToPixel(
  lm: Landmark,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } {
  return { x: lm.x * imageWidth, y: lm.y * imageHeight };
}
