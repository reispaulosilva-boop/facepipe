/**
 * Computes a SHA-256 hex digest of a base64-encoded image string.
 * Uses the Web Crypto API (available in all modern browsers and Node.js 20+).
 */
export async function hashBase64Image(base64: string): Promise<string> {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
