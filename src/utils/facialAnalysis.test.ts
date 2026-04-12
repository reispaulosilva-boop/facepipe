import { describe, it, expect } from "vitest";
import {
  distancePx,
  verticalDistancePx,
  horizontalDistancePx,
  calcPixelsPerMm,
  pxToMm,
  calcThirds,
  calcFifths,
  calcLipRatio,
  calcBizygomatic,
  calcBigonial,
  calcBitemporal,
  calcMentonian,
  IRIS_DIAMETER_MM,
  TOPOGRAPHIC_INDICES,
  getTopographicRegions,
  type Landmark,
} from "./facialAnalysis";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Creates a sparse landmark array with only the requested indices filled. */
function makeLandmarks(entries: Record<number, Landmark>): Landmark[] {
  const arr: Landmark[] = [];
  const maxIdx = Math.max(...Object.keys(entries).map(Number));
  for (let i = 0; i <= maxIdx; i++) {
    arr[i] = entries[i] ?? { x: 0, y: 0 };
  }
  return arr;
}

const W = 1000;
const H = 1000;

// ── distancePx ────────────────────────────────────────────────────────────────

describe("distancePx", () => {
  it("returns 0 for the same point", () => {
    const p = { x: 0.5, y: 0.5 };
    expect(distancePx(p, p, W, H)).toBe(0);
  });

  it("computes Pythagorean distance (3-4-5 triangle)", () => {
    // dx = 0.3 * 1000 = 300, dy = 0.4 * 1000 = 400 → 500
    const a = { x: 0, y: 0 };
    const b = { x: 0.3, y: 0.4 };
    expect(distancePx(a, b, W, H)).toBeCloseTo(500, 1);
  });

  it("is symmetric", () => {
    const a = { x: 0.1, y: 0.2 };
    const b = { x: 0.8, y: 0.9 };
    expect(distancePx(a, b, W, H)).toBeCloseTo(distancePx(b, a, W, H), 5);
  });

  it("uses imageWidth and imageHeight independently", () => {
    const a = { x: 0, y: 0 };
    const b = { x: 1, y: 0 };
    expect(distancePx(a, b, 500, 1000)).toBeCloseTo(500, 1);
    expect(distancePx(a, b, 200, 1000)).toBeCloseTo(200, 1);
  });
});

// ── verticalDistancePx ────────────────────────────────────────────────────────

describe("verticalDistancePx", () => {
  it("returns absolute vertical distance", () => {
    const a = { x: 0.5, y: 0.1 };
    const b = { x: 0.5, y: 0.4 };
    expect(verticalDistancePx(a, b, H)).toBeCloseTo(300, 1);
  });

  it("is always non-negative (absolute value)", () => {
    const a = { x: 0, y: 0.9 };
    const b = { x: 0, y: 0.1 };
    expect(verticalDistancePx(a, b, H)).toBeCloseTo(800, 1);
  });

  it("ignores X differences", () => {
    const a = { x: 0.0, y: 0.2 };
    const b = { x: 1.0, y: 0.5 };
    expect(verticalDistancePx(a, b, H)).toBeCloseTo(300, 1);
  });
});

// ── horizontalDistancePx ──────────────────────────────────────────────────────

describe("horizontalDistancePx", () => {
  it("returns absolute horizontal distance", () => {
    const a = { x: 0.2, y: 0.5 };
    const b = { x: 0.7, y: 0.5 };
    expect(horizontalDistancePx(a, b, W)).toBeCloseTo(500, 1);
  });

  it("is always non-negative", () => {
    const a = { x: 0.8, y: 0 };
    const b = { x: 0.1, y: 0 };
    expect(horizontalDistancePx(a, b, W)).toBeCloseTo(700, 1);
  });

  it("ignores Y differences", () => {
    const a = { x: 0.1, y: 0.0 };
    const b = { x: 0.6, y: 1.0 };
    expect(horizontalDistancePx(a, b, W)).toBeCloseTo(500, 1);
  });
});

// ── calcPixelsPerMm ───────────────────────────────────────────────────────────

describe("calcPixelsPerMm", () => {
  it("returns null when iris landmarks are missing", () => {
    expect(calcPixelsPerMm([], W, H)).toBeNull();
  });

  it("returns px/mm based on IRIS_DIAMETER_MM (11.7 mm)", () => {
    // Iris width = 0.117 * 1000 = 117px → 117 / 11.7 = 10 px/mm
    const landmarks = makeLandmarks({
      474: { x: 0.0,   y: 0.5 },
      476: { x: 0.117, y: 0.5 },
    });
    const result = calcPixelsPerMm(landmarks, W, H);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(10, 1);
  });

  it("returns null when both iris points coincide (zero width)", () => {
    const landmarks = makeLandmarks({
      474: { x: 0.5, y: 0.5 },
      476: { x: 0.5, y: 0.5 },
    });
    expect(calcPixelsPerMm(landmarks, W, H)).toBeNull();
  });

  it("IRIS_DIAMETER_MM constant is 11.7", () => {
    expect(IRIS_DIAMETER_MM).toBe(11.7);
  });
});

// ── pxToMm ───────────────────────────────────────────────────────────────────

describe("pxToMm", () => {
  it("converts pixels to millimetres at 10 px/mm", () => {
    expect(pxToMm(100, 10)).toBe(10);
  });

  it("returns one decimal place", () => {
    // 55 / 3 = 18.333... → rounds to 18.3
    expect(pxToMm(55, 3)).toBe(18.3);
  });

  it("handles fractional pxPerMm", () => {
    expect(pxToMm(11.7, 1)).toBeCloseTo(11.7, 1);
  });
});

// ── calcThirds ────────────────────────────────────────────────────────────────

describe("calcThirds", () => {
  // Perfect thirds: each third = 0.2 * 1000 = 200px
  // iris width = 0.117 * 1000 = 117px → 10 px/mm
  const perfectLandmarks = makeLandmarks({
    10:  { x: 0.5, y: 0.1 },  // trichion
    168: { x: 0.5, y: 0.3 },  // glabela (nasion)
    2:   { x: 0.5, y: 0.5 },  // subnasale
    152: { x: 0.5, y: 0.7 },  // menton
    474: { x: 0.0, y: 0.5 },  // iris medial
    476: { x: 0.117, y: 0.5 }, // iris lateral → 117px → 10 px/mm
  });

  it("returns null when required landmarks are absent", () => {
    expect(calcThirds([], W, H)).toBeNull();
  });

  it("computes three equal thirds of 200px each", () => {
    const result = calcThirds(perfectLandmarks, W, H);
    expect(result).not.toBeNull();
    expect(result!.upperThird.px).toBeCloseTo(200, 1);
    expect(result!.middleThird.px).toBeCloseTo(200, 1);
    expect(result!.lowerThird.px).toBeCloseTo(200, 1);
  });

  it("harmony ratios are 1.0 for perfect thirds", () => {
    const result = calcThirds(perfectLandmarks, W, H);
    expect(result!.harmonyRatio.upperToMiddle).toBeCloseTo(1.0, 2);
    expect(result!.harmonyRatio.middleToLower).toBeCloseTo(1.0, 2);
  });

  it("converts px to mm correctly at 10 px/mm", () => {
    const result = calcThirds(perfectLandmarks, W, H);
    expect(result!.upperThird.mm).toBe(20);
    expect(result!.pxPerMm).toBeCloseTo(10, 1);
  });

  it("respects trichionYOverride", () => {
    // Override trichion to y=0.0 → upper third becomes 300px instead of 200
    const result = calcThirds(perfectLandmarks, W, H, 0.0);
    expect(result!.upperThird.px).toBeCloseTo(300, 1);
    expect(result!.middleThird.px).toBeCloseTo(200, 1); // unaffected
  });
});

// ── calcFifths ────────────────────────────────────────────────────────────────

describe("calcFifths", () => {
  // Five equal fifths of 0.1 width each (100px)
  const fifthsLandmarks = makeLandmarks({
    454: { x: 0.0, y: 0.5 },  // limite R
    33:  { x: 0.1, y: 0.5 },  // exocanthion R
    133: { x: 0.2, y: 0.5 },  // endocanthion R
    362: { x: 0.3, y: 0.5 },  // endocanthion L
    263: { x: 0.4, y: 0.5 },  // exocanthion L
    234: { x: 0.5, y: 0.5 },  // limite L
    474: { x: 0.0, y: 0.5 },
    476: { x: 0.117, y: 0.5 },
  });

  it("returns null when required landmarks are absent", () => {
    expect(calcFifths([], W, H)).toBeNull();
  });

  it("computes five equal fifths of 100px each", () => {
    const result = calcFifths(fifthsLandmarks, W, H);
    expect(result).not.toBeNull();
    expect(result!.outerRight.px).toBeCloseTo(100, 1);
    expect(result!.rightEye.px).toBeCloseTo(100, 1);
    expect(result!.interalar.px).toBeCloseTo(100, 1);
    expect(result!.leftEye.px).toBeCloseTo(100, 1);
    expect(result!.outerLeft.px).toBeCloseTo(100, 1);
  });

  it("result contains pxPerMm from iris calibration", () => {
    const result = calcFifths(fifthsLandmarks, W, H);
    expect(result!.pxPerMm).toBeCloseTo(10, 1);
  });
});

// ── calcLipRatio ──────────────────────────────────────────────────────────────

describe("calcLipRatio", () => {
  it("returns null when lip landmarks are absent", () => {
    expect(calcLipRatio([], H, 10)).toBeNull();
  });

  it("computes 1:2 ratio when inferior is twice superior", () => {
    // superior: 0 → 0.1 (100px), inferior: 0.1 → 0.3 (200px)
    const landmarks = makeLandmarks({
      0:  { x: 0.5, y: 0.0 },
      13: { x: 0.5, y: 0.1 },
      17: { x: 0.5, y: 0.3 },
    });
    const result = calcLipRatio(landmarks, H, 10);
    expect(result).not.toBeNull();
    expect(result!.superiorPx).toBeCloseTo(100, 1);
    expect(result!.inferiorPx).toBeCloseTo(200, 1);
    expect(result!.ratio).toBeCloseTo(0.5, 2);
  });

  it("converts px to mm at given pxPerMm", () => {
    const landmarks = makeLandmarks({
      0:  { x: 0.5, y: 0.0 },
      13: { x: 0.5, y: 0.1 }, // 100px superior
      17: { x: 0.5, y: 0.2 }, // 100px inferior
    });
    const result = calcLipRatio(landmarks, H, 10);
    expect(result!.superiorMm).toBe(10);
    expect(result!.inferiorMm).toBe(10);
  });
});

// ── Distance measurements (Bizygomatic, Bigonial, Bitemporal, Mentonian) ─────

describe("calcBizygomatic", () => {
  it("returns null when landmarks are absent", () => {
    expect(calcBizygomatic([], W, 10)).toBeNull();
  });

  it("measures horizontal distance between landmarks 234 and 454", () => {
    const landmarks = makeLandmarks({
      234: { x: 0.2, y: 0.5 },
      454: { x: 0.8, y: 0.5 },
    });
    const result = calcBizygomatic(landmarks, W, 10);
    expect(result).not.toBeNull();
    expect(result!.px).toBeCloseTo(600, 1);
    expect(result!.mm).toBe(60);
    expect(result!.label).toBe("Distância Bizigomática");
  });
});

describe("calcBigonial", () => {
  it("returns null when landmarks are absent", () => {
    expect(calcBigonial([], W, 10)).toBeNull();
  });

  it("measures horizontal distance between landmarks 172 and 397", () => {
    const landmarks = makeLandmarks({
      172: { x: 0.25, y: 0.8 },
      397: { x: 0.75, y: 0.8 },
    });
    const result = calcBigonial(landmarks, W, 10);
    expect(result).not.toBeNull();
    expect(result!.px).toBeCloseTo(500, 1);
    expect(result!.mm).toBe(50);
    expect(result!.label).toBe("Distância Bigonial");
  });
});

describe("calcBitemporal", () => {
  it("returns null when landmarks are absent", () => {
    expect(calcBitemporal([], W, 10)).toBeNull();
  });

  it("measures horizontal distance between landmarks 54 and 284", () => {
    const landmarks = makeLandmarks({
      54:  { x: 0.1, y: 0.2 },
      284: { x: 0.9, y: 0.2 },
    });
    const result = calcBitemporal(landmarks, W, 10);
    expect(result).not.toBeNull();
    expect(result!.px).toBeCloseTo(800, 1);
    expect(result!.mm).toBe(80);
    expect(result!.label).toBe("Distância Bitemporal");
  });
});

describe("calcMentonian", () => {
  it("returns null when landmarks are absent", () => {
    expect(calcMentonian([], W, 10)).toBeNull();
  });

  it("measures horizontal distance between landmarks 148 and 377", () => {
    const landmarks = makeLandmarks({
      148: { x: 0.35, y: 0.9 },
      377: { x: 0.65, y: 0.9 },
    });
    const result = calcMentonian(landmarks, W, 10);
    expect(result).not.toBeNull();
    expect(result!.px).toBeCloseTo(300, 1);
    expect(result!.mm).toBe(30);
    expect(result!.label).toBe("Distância Mentoniana");
  });
});

// ── TOPOGRAPHIC_INDICES ───────────────────────────────────────────────────────

describe("TOPOGRAPHIC_INDICES", () => {
  it("contains 19 anatomical regions", () => {
    expect(Object.keys(TOPOGRAPHIC_INDICES)).toHaveLength(19);
  });

  it("all region names are present", () => {
    const expected = [
      "frontal", "glabela", "temporal_r", "temporal_l",
      "infrapalpebral_r", "infrapalpebral_l",
      "malar_lateral_r", "malar_lateral_l",
      "malar_medial_r", "malar_medial_l",
      "submalar_r", "submalar_l",
      "mandibular_r", "mandibular_l",
      "labial", "subnasal", "perioral", "mento", "nariz",
    ];
    for (const name of expected) {
      expect(TOPOGRAPHIC_INDICES).toHaveProperty(name);
    }
  });

  it("all index arrays are non-empty", () => {
    for (const [name, indices] of Object.entries(TOPOGRAPHIC_INDICES)) {
      expect(indices.length, `${name} must have at least one index`).toBeGreaterThan(0);
    }
  });

  it("all indices are valid MediaPipe landmark indices (0–477)", () => {
    for (const [name, indices] of Object.entries(TOPOGRAPHIC_INDICES)) {
      for (const idx of indices) {
        expect(idx, `${name}[${idx}] out of range`).toBeGreaterThanOrEqual(0);
        expect(idx, `${name}[${idx}] out of range`).toBeLessThanOrEqual(477);
      }
    }
  });
});

// ── getTopographicRegions ─────────────────────────────────────────────────────

describe("getTopographicRegions", () => {
  it("returns one region per TOPOGRAPHIC_INDICES entry", () => {
    const dummy = new Array(478).fill(null).map((_, i) => ({ x: i / 478, y: i / 478 }));
    const regions = getTopographicRegions(dummy);
    expect(regions).toHaveLength(Object.keys(TOPOGRAPHIC_INDICES).length);
  });

  it("region names are uppercased", () => {
    const dummy = new Array(478).fill({ x: 0, y: 0 });
    const regions = getTopographicRegions(dummy);
    for (const region of regions) {
      expect(region.name).toBe(region.name.toUpperCase());
    }
  });

  it("filters out missing landmarks gracefully", () => {
    const sparse = makeLandmarks({ 0: { x: 0, y: 0 } });
    const regions = getTopographicRegions(sparse);
    // Should not throw, all regions present
    expect(regions.length).toBeGreaterThan(0);
    // Every region's points array should only contain defined landmarks
    for (const r of regions) {
      for (const pt of r.points) {
        expect(pt).toBeDefined();
      }
    }
  });
});
