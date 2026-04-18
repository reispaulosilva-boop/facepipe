/**
 * Utilities for capturing the analysis canvas (photo + SVG overlays) as an image
 */

export interface CaptureOptions {
  /** Quality for JPEG (0-1), ignored for PNG */
  quality?: number;
  /** Scale factor for higher resolution output */
  scale?: number;
  /** Background color (default: black) */
  backgroundColor?: string;
}

/**
 * Captures the face analysis area (image + SVG overlays) as a PNG blob
 */
export async function captureAnalysisAsBlob(
  options: CaptureOptions = {}
): Promise<Blob | null> {
  const { scale = 2, backgroundColor = "#000105" } = options;

  // Find the capture container
  const captureTarget = document.querySelector('[data-capture="face-table"]') as HTMLElement | null;
  if (!captureTarget) {
    console.error("[captureAnalysis] Could not find capture target element");
    return null;
  }

  const img = captureTarget.querySelector("img") as HTMLImageElement | null;
  const svg = captureTarget.querySelector("svg") as SVGSVGElement | null;

  if (!img) {
    console.error("[captureAnalysis] Could not find image element");
    return null;
  }

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  if (!width || !height) {
    console.error("[captureAnalysis] Invalid image dimensions");
    return null;
  }

  // Create a high-res canvas
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    console.error("[captureAnalysis] Could not get canvas context");
    return null;
  }

  // Scale for higher resolution
  ctx.scale(scale, scale);

  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Draw the base image
  ctx.drawImage(img, 0, 0, width, height);

  // Draw SVG overlay if present
  if (svg) {
    try {
      const svgBlob = await svgToBlob(svg, width, height);
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const svgImg = new Image();
      svgImg.crossOrigin = "anonymous";
      
      await new Promise<void>((resolve, reject) => {
        svgImg.onload = () => resolve();
        svgImg.onerror = reject;
        svgImg.src = svgUrl;
      });

      ctx.drawImage(svgImg, 0, 0, width, height);
      URL.revokeObjectURL(svgUrl);
    } catch (err) {
      console.warn("[captureAnalysis] Failed to render SVG overlay:", err);
      // Continue without SVG - still useful to get the base image
    }
  }

  // Convert canvas to blob
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      "image/png",
      1.0
    );
  });
}

/**
 * Converts an SVG element to a Blob
 */
async function svgToBlob(svg: SVGSVGElement, width: number, height: number): Promise<Blob> {
  // Clone the SVG to avoid modifying the original
  const clone = svg.cloneNode(true) as SVGSVGElement;
  
  // Ensure proper dimensions
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.setAttribute("viewBox", `0 0 ${width} ${height}`);
  
  // Inline all styles from CSS classes
  inlineStyles(clone);
  
  // Serialize to string
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clone);
  
  // Ensure proper XML declaration
  if (!svgString.startsWith("<?xml")) {
    svgString = '<?xml version="1.0" encoding="UTF-8"?>' + svgString;
  }
  
  // Add xmlns if missing
  if (!svgString.includes("xmlns=")) {
    svgString = svgString.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  return new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
}

/**
 * Recursively inlines computed styles for SVG elements
 */
function inlineStyles(element: Element): void {
  const computedStyle = window.getComputedStyle(element);
  
  // List of SVG-relevant style properties
  const svgStyleProps = [
    "fill", "fill-opacity", "stroke", "stroke-width", "stroke-opacity",
    "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin",
    "opacity", "font-family", "font-size", "font-weight", "text-anchor",
    "dominant-baseline", "visibility", "display"
  ];

  const styleObj: Record<string, string> = {};
  
  for (const prop of svgStyleProps) {
    const value = computedStyle.getPropertyValue(prop);
    if (value && value !== "none" && value !== "normal" && value !== "visible") {
      styleObj[prop] = value;
    }
  }

  // Apply inline styles
  const existingStyle = element.getAttribute("style") || "";
  const newStyles = Object.entries(styleObj)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  
  if (newStyles) {
    element.setAttribute("style", existingStyle + ";" + newStyles);
  }

  // Recurse into children
  for (const child of Array.from(element.children)) {
    inlineStyles(child);
  }
}

/**
 * Downloads the analysis as a PNG file
 */
export async function downloadAnalysisAsPNG(
  filename: string = "analise-facial",
  options: CaptureOptions = {}
): Promise<boolean> {
  const blob = await captureAnalysisAsBlob(options);
  
  if (!blob) {
    return false;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${Date.now()}.png`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
  return true;
}
