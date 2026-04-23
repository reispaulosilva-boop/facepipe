/**
 * Facepipe — Facial Proportions Engine
 * Motor de cálculo de Terços e Quintos faciais com calibração em milímetros via íris.
 * Zero-Storage: all calculations are ephemeral, in memory only.
 */

import topographicIndicesData from "@/data/topographicIndices.json";

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
 * Calcula o ângulo em graus formado por três pontos (A, B, C) no vértice B.
 */
export function calcAngle(a: Landmark, b: Landmark, c: Landmark): number {
  if (!a || !b || !c) return 0;
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (mag1 === 0 || mag2 === 0) return 0;

  const angleRad = Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2))));
  return parseFloat(((angleRad * 180) / Math.PI).toFixed(1));
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
  const limiteR = landmarks[234];
  const exoR    = landmarks[33];
  const endoR   = landmarks[133];
  const endoL   = landmarks[362];
  const exoL    = landmarks[263];
  const limiteL = landmarks[454];

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
 * Os índices são mantidos em src/data/topographicIndices.json para facilitar
 * manutenção clínica sem necessidade de alterar código TypeScript.
 */
export const TOPOGRAPHIC_INDICES: { [key: string]: number[] } = topographicIndicesData as { [key: string]: number[] };


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
  GONION_L: 397,
  FRONTOTEMPORAL_R: 21,
  FRONTOTEMPORAL_L: 251,
  ALARE_R: 129,
  ALARE_L: 358
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
  imageWidth: number,
  imageHeight: number
): "Oval" | "Redondo" | "Coração" | "Angular" {
  const forehead = horizontalDistancePx(landmarks[21], landmarks[251], imageWidth);
  const cheekbones = horizontalDistancePx(landmarks[234], landmarks[454], imageWidth);
  const jaw = horizontalDistancePx(landmarks[172], landmarks[397], imageWidth);
  const height = verticalDistancePx(landmarks[10], landmarks[152], imageHeight); // approximate height

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

export function calcBitemporal(
  landmarks: Landmark[],
  imageWidth: number,
  pxPerMm: number
): DistanceMeasurement | null {
  const left = landmarks[21];
  const right = landmarks[251];
  if (!left || !right) return null;

  const px = horizontalDistancePx(left, right, imageWidth);
  return {
    label: "Largura Bitemporal",
    px,
    mm: pxToMm(px, pxPerMm),
  };
}

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
    label: "Largura do Mento",
    px,
    mm: pxToMm(px, pxPerMm),
  };
}

/**
 * Calcula a Distância Interpupilar (estabilidade aos 6-8 anos).
 * Pontos: 468 (L) e 473 (R).
 */
export function calcInterpupillary(
  landmarks: Landmark[],
  imageWidth: number,
  pxPerMm: number
): DistanceMeasurement | null {
  const left = landmarks[468];
  const right = landmarks[473];
  if (!left || !right) return null;

  const px = horizontalDistancePx(left, right, imageWidth);
  return {
    label: "Distância Interpupilar",
    px,
    mm: pxToMm(px, pxPerMm),
  };
}

/**
 * Calcula a Distância Interalar (largura nasal).
 * Pontos: 129 (R) e 358 (L).
 */
export function calcInteralar(
  landmarks: Landmark[],
  imageWidth: number,
  pxPerMm: number
): DistanceMeasurement | null {
  const right = landmarks[129];
  const left = landmarks[358];
  if (!left || !right) return null;

  const px = horizontalDistancePx(left, right, imageWidth);
  return {
    label: "Distância Interalar",
    px,
    mm: pxToMm(px, pxPerMm),
  };
}

/**
 * Calcula a Distância Intercomissural (largura da boca).
 * Pontos: 61 (R) e 291 (L).
 */
export function calcIntercommissural(
  landmarks: Landmark[],
  imageWidth: number,
  pxPerMm: number
): DistanceMeasurement | null {
  const right = landmarks[61];
  const left = landmarks[291];
  if (!left || !right) return null;

  const px = horizontalDistancePx(left, right, imageWidth);
  return {
    label: "Distância Intercomissural",
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

// ─────────────────────────────────────────────────────────────────────────────
// Cálculo de Áreas Topográficas
// ─────────────────────────────────────────────────────────────────────────────

export type TopographicGroup = "Superior" | "Médio" | "Inferior";

export interface TopographicAreaResult {
  name: string;
  label: string;
  code: string;
  group: TopographicGroup;
  areaPx2: number;
  areaMm2: number;
  percent: number;
}

/**
 * Metadados de exibição para cada região anatômica.
 * Fonte de verdade para label clínico, código abreviado e terço.
 */
export const REGION_META: Record<string, { label: string; code: string; group: TopographicGroup }> = {
  frontal:          { label: "Frontal",             code: "F",    group: "Superior"  },
  glabela:          { label: "Glabela",             code: "G",    group: "Superior"  },
  temporal_r:       { label: "Temporal Dir.",        code: "T-D",  group: "Superior"  },
  temporal_l:       { label: "Temporal Esq.",        code: "T-E",  group: "Superior"  },
  nariz:            { label: "Nariz",               code: "N",    group: "Médio"     },
  malar_lateral_r:  { label: "Malar Lateral Dir.",  code: "ML-D", group: "Médio"     },
  malar_lateral_l:  { label: "Malar Lateral Esq.",  code: "ML-E", group: "Médio"     },
  malar_medial_r:   { label: "Malar Medial Dir.",   code: "MM-D", group: "Médio"     },
  malar_medial_l:   { label: "Malar Medial Esq.",   code: "MM-E", group: "Médio"     },
  infrapalpebral_r: { label: "Infrapalpebral Dir.", code: "IP-D", group: "Médio"     },
  infrapalpebral_l: { label: "Infrapalpebral Esq.", code: "IP-E", group: "Médio"     },
  subnasal:         { label: "Subnasal",            code: "SN",   group: "Inferior"  },
  labial:           { label: "Labial",              code: "Lb",   group: "Inferior"  },
  perioral:         { label: "Perioral",            code: "POr",  group: "Inferior"  },
  submalar_r:       { label: "Submalar Dir.",        code: "SM-D", group: "Inferior"  },
  submalar_l:       { label: "Submalar Esq.",        code: "SM-E", group: "Inferior"  },
  mandibular_r:     { label: "Mandibular Dir.",      code: "Ma-D", group: "Inferior"  },
  mandibular_l:     { label: "Mandibular Esq.",      code: "Ma-E", group: "Inferior"  },
  mento:            { label: "Mento",               code: "Me",   group: "Inferior"  },
};

/**
 * Separa um array linear de índices em sub-caminhos.
 * Um sub-caminho é encerrado quando o índice atual repete o primeiro índice
 * do sub-caminho corrente (convenção MediaPipe para polígonos fechados).
 *
 * Ex.: [A, B, C, A, D, E, D] → [[A, B, C], [D, E]]
 */
export function extractPolygonPaths(indices: number[]): number[][] {
  const paths: number[][] = [];
  if (indices.length === 0) return paths;

  let start = 0;
  let i = 1;

  while (i < indices.length) {
    if (indices[i] === indices[start]) {
      paths.push(indices.slice(start, i));
      start = i + 1;
      i = start + 1;
    } else {
      i++;
    }
  }

  if (start < indices.length) {
    const tail = indices.slice(start);
    // Remove closing vertex se repete o início
    if (tail.length > 1 && tail[tail.length - 1] === tail[0]) {
      tail.pop();
    }
    paths.push(tail);
  }

  return paths;
}

/**
 * Algoritmo de Shoelace (Gauss) — área assinada de um polígono simples.
 * Recebe índices de landmarks, converte para pixels e calcula.
 */
function shoelaceAreaPx(
  indices: number[],
  landmarks: Landmark[],
  W: number,
  H: number
): number {
  let area = 0;
  const n = indices.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a = landmarks[indices[i]];
    const b = landmarks[indices[j]];
    if (!a || !b) continue;
    area += (a.x * W) * (b.y * H);
    area -= (b.x * W) * (a.y * H);
  }
  return Math.abs(area) / 2;
}

/**
 * Calcula a área em pixels² e mm² de cada região topográfica.
 *
 * Tratamento especial para "perioral":
 *   O array de índices codifica dois sub-caminhos (outer + labial como furo).
 *   Área = |shoelace(outer)| − |shoelace(furo)|
 *
 * @param pxPerMm  Calibração da íris (pixels por mm). Use 1 se não disponível.
 */
export function calcTopographicAreas(
  landmarks: Landmark[],
  imageWidth: number,
  imageHeight: number,
  pxPerMm: number
): TopographicAreaResult[] {
  const pxPerMm2 = pxPerMm * pxPerMm;

  const results: TopographicAreaResult[] = [];

  for (const [name, indices] of Object.entries(TOPOGRAPHIC_INDICES)) {
    const meta = REGION_META[name];
    if (!meta) continue;

    const paths = extractPolygonPaths(indices);
    if (paths.length === 0) continue;

    let areaPx2 = shoelaceAreaPx(paths[0], landmarks, imageWidth, imageHeight);

    // Sub-caminhos adicionais são furos — subtrair suas áreas (evenodd)
    for (let p = 1; p < paths.length; p++) {
      areaPx2 -= shoelaceAreaPx(paths[p], landmarks, imageWidth, imageHeight);
    }
    areaPx2 = Math.max(0, areaPx2);

    results.push({
      name,
      label: meta.label,
      code:  meta.code,
      group: meta.group,
      areaPx2,
      areaMm2: pxPerMm2 > 0 ? areaPx2 / pxPerMm2 : 0,
      percent: 0, // calculado após somar o total
    });
  }

  const total = results.reduce((sum, r) => sum + r.areaPx2, 0);

  for (const r of results) {
    r.percent = total > 0 ? (r.areaPx2 / total) * 100 : 0;
  }

  return results;
}
