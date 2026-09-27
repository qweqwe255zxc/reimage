import { contrastMap, rgbaToLab } from "./color";
import { argsortInto, mulberry32 } from "./random";

export const MODES = ["contrast", "brightness", "distance", "wave", "random"] as const;
export type Mode = (typeof MODES)[number];

// everything is indexed by source pixel, so particles keep identity across chained morphs
export interface Morph {
  n: number;
  count: number;
  start: Float32Array; // cell coords, xy pairs
  end: Float32Array;
  delay: Float32Array;
  curl: Float32Array;
  color: Uint8Array; // rgb
  spread: number;
}

export function homeCells(n: number) {
  const out = new Float32Array(n * n * 2);
  for (let i = 0; i < n * n; i++) {
    out[i * 2] = i % n;
    out[i * 2 + 1] = Math.floor(i / n);
  }
  return out;
}

export function buildMorph(opts: {
  n: number;
  src: Uint8ClampedArray;
  perm: Int32Array;
  mode: Mode;
  seed: number;
  start?: Float32Array;
  spread?: number;
  curl?: number;
}): Morph {
  const { n, src, perm, mode, seed, spread = 0.55, curl = 0.35 } = opts;
  const m = n * n;
  const rnd = mulberry32(seed * 31 + 7);
  const start = opts.start ?? homeCells(n);

  const end = new Float32Array(m * 2);
  for (let k = 0; k < m; k++) {
    const s = perm[k];
    end[s * 2] = k % n;
    end[s * 2 + 1] = Math.floor(k / n);
  }

  const color = new Uint8Array(m * 3);
  for (let s = 0; s < m; s++) {
    color[s * 3] = src[s * 4];
    color[s * 3 + 1] = src[s * 4 + 1];
    color[s * 3 + 2] = src[s * 4 + 2];
  }

  const lab = rgbaToLab(src);
  const edges = mode === "contrast" ? contrastMap(lab, n) : null;
  const c = (n - 1) / 2;
  const key = (s: number) => {
    const dx = end[s * 2] - start[s * 2];
    const dy = end[s * 2 + 1] - start[s * 2 + 1];
    switch (mode) {
      case "contrast":
        return -edges![s]; // edges leave first
      case "brightness":
        return lab[s * 3]; // dark first
      case "distance":
        return -Math.hypot(dx, dy); // long trips first
      case "wave":
        return Math.hypot(start[s * 2] - c, start[s * 2 + 1] - c);
      default:
        return rnd();
    }
  };

  const order = new Int32Array(m);
  argsortInto(order, new Float64Array(m), m, key);
  const delay = new Float32Array(m);
  const curls = new Float32Array(m);
  for (let i = 0; i < m; i++) {
    const s = order[i];
    const rank = i / Math.max(1, m - 1) + (rnd() - 0.5) * 0.16;
    delay[s] = Math.min(1, Math.max(0, rank)) * spread;
  }
  for (let s = 0; s < m; s++) curls[s] = (rnd() * 2 - 1) * curl;

  return { n, count: m, start, end, delay, curl: curls, color, spread };
}
