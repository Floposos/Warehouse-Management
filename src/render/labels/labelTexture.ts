import { CanvasTexture, SRGBColorSpace } from 'three';

const cache = new Map<string, CanvasTexture>();

/**
 * Textur mit kurzem Text in einem runden Schild (z. B. „A“ oder „!“), wird je Inhalt
 * nur einmal erzeugt. Zeichnet mit Canvas 2D, funktioniert auch über file://.
 */
export function labelTexture(text: string, background: string, color: string): CanvasTexture {
  const key = `${text}|${background}|${color}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = background;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.fillStyle = color;
    // Kurze Wörter („voll“) kleiner als einzelne Zeichen.
    const fontSize = text.length > 1 ? size * 0.32 : size * 0.55;
    ctx.font = `bold ${Math.round(fontSize)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, size / 2, size / 2 + 4);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  cache.set(key, texture);
  return texture;
}
