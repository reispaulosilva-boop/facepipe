import { Landmark } from "./facialAnalysis";

/**
 * Gera uma máscara em Base64 (PNG) baseada nos landmarks da face.
 * Foca na área da pele para permitir inpainting preciso sem alterar a identidade.
 */
export function generateFaceMask(
  landmarks: Landmark[], 
  width: number, 
  height: number
): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  
  if (!ctx) return "";

  // Fundo preto (áreas que NÃO serão alteradas)
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);

  // Área Branca (área onde a IA vai atuar)
  ctx.fillStyle = "white";
  ctx.beginPath();
  
  // Contorno da Face (Landmarks simplificados do MediaPipe para o contorno do rosto)
  const faceOval = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
  
  faceOval.forEach((idx, i) => {
    const lm = landmarks[idx];
    if (!lm) return;
    if (i === 0) ctx.moveTo(lm.x * width, lm.y * height);
    else ctx.lineTo(lm.x * width, lm.y * height);
  });
  
  ctx.closePath();
  ctx.fill();

  // Opcional: Recortar buracos para os olhos e lábios para preservar ainda mais a identidade
  // (Pode ser adicionado no futuro se necessário)

  return canvas.toDataURL("image/png");
}
