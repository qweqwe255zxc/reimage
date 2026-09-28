// srgb rgba bytes -> lab, packed [L, a, b, L, a, b, ...]
export function rgbaToLab(rgba: Uint8ClampedArray | Uint8Array): Float32Array {
  const m = rgba.length / 4;
  const out = new Float32Array(m * 3);
  const lin = (c: number) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  for (let i = 0; i < m; i++) {
    const r = lin(rgba[i * 4]);
    const g = lin(rgba[i * 4 + 1]);
    const b = lin(rgba[i * 4 + 2]);
    const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047; // d65 white
    const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
    const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
    const fx = f(x);
    const fy = f(y);
    const fz = f(z);
    out[i * 3] = 116 * fy - 16;
    out[i * 3 + 1] = 500 * (fx - fy);
    out[i * 3 + 2] = 200 * (fy - fz);
  }
  return out;
}

// share of pixels within +-6 of the median lightness. ui screenshots and flat logos score ~0.8, photos ~0.1-0.3
export function flatness(lab: Float32Array): number {
  const m = lab.length / 3;
  const L = new Float32Array(m);
  for (let i = 0; i < m; i++) L[i] = lab[i * 3];
  const sorted = L.slice().sort();
  const med = sorted[m >> 1];
  let near = 0;
  for (let i = 0; i < m; i++) if (Math.abs(L[i] - med) < 6) near++;
  return near / m;
}

// sobel on lightness, normalized to 0..1
export function contrastMap(lab: Float32Array, n: number): Float32Array {
  const L = (x: number, y: number) => {
    x = Math.min(n - 1, Math.max(0, x));
    y = Math.min(n - 1, Math.max(0, y));
    return lab[(y * n + x) * 3];
  };
  const out = new Float32Array(n * n);
  let max = 1e-6;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const gx = L(x + 1, y - 1) + 2 * L(x + 1, y) + L(x + 1, y + 1) - L(x - 1, y - 1) - 2 * L(x - 1, y) - L(x - 1, y + 1);
      const gy = L(x - 1, y + 1) + 2 * L(x, y + 1) + L(x + 1, y + 1) - L(x - 1, y - 1) - 2 * L(x, y - 1) - L(x + 1, y - 1);
      const g = Math.hypot(gx, gy);
      out[y * n + x] = g;
      if (g > max) max = g;
    }
  }
  for (let i = 0; i < out.length; i++) out[i] /= max;
  return out;
}
