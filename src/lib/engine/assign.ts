import { argsortInto, bell, mulberry32 } from "./random";

// perm[k] = source pixel that lands on target cell k
// cost = |lab_src - lab_tgt|^2 + lam * |pos_src - pos_tgt|^2  (pos in 0..1)
// same idea as reimage/assign.py: brightness rank -> rank, then batches of disjoint swaps

export interface AssignResult {
  perm: Int32Array;
  errSorted: number;
  errFinal: number;
}

export function assign(
  src: Float32Array,
  tgt: Float32Array,
  n: number,
  opts: { lam?: number; iters?: number; seed?: number } = {},
  onProgress?: (p: number) => void,
): AssignResult {
  const { lam = 200, iters = 1500, seed = 0 } = opts;
  const m = n * n;
  const rnd = mulberry32(seed * 7919 + 1);

  const px = new Float32Array(m);
  const py = new Float32Array(m);
  for (let i = 0; i < m; i++) {
    px[i] = (i % n) / n;
    py[i] = Math.floor(i / n) / n;
  }

  const order = new Int32Array(m);
  const order2 = new Int32Array(m);
  const keys = new Float64Array(m);
  const perm = new Int32Array(m);

  argsortInto(order, keys, m, (k) => tgt[k * 3] + bell(rnd) * 1e-3);
  argsortInto(order2, keys, m, (s) => src[s * 3] + bell(rnd) * 1e-3);
  for (let i = 0; i < m; i++) perm[order[i]] = order2[i];

  const cost = (k: number, s: number) => {
    const dl = tgt[k * 3] - src[s * 3];
    const da = tgt[k * 3 + 1] - src[s * 3 + 1];
    const db = tgt[k * 3 + 2] - src[s * 3 + 2];
    const dx = px[k] - px[s];
    const dy = py[k] - py[s];
    return dl * dl + da * da + db * db + lam * (dx * dx + dy * dy);
  };

  const colorErr = () => {
    let sum = 0;
    for (let k = 0; k < m; k++) {
      const s = perm[k];
      const dl = tgt[k * 3] - src[s * 3];
      const da = tgt[k * 3 + 1] - src[s * 3 + 1];
      const db = tgt[k * 3 + 2] - src[s * 3 + 2];
      sum += Math.sqrt(dl * dl + da * da + db * db);
    }
    return sum / m;
  };

  const cur = new Float64Array(m);
  for (let k = 0; k < m; k++) cur[k] = cost(k, perm[k]);
  const errSorted = colorErr();

  const trySwap = (a: number, b: number) => {
    const sa = perm[a];
    const sb = perm[b];
    const na = cost(a, sb);
    const nb = cost(b, sa);
    if (na + nb < cur[a] + cur[b] - 1e-6) {
      perm[a] = sb;
      perm[b] = sa;
      cur[a] = na;
      cur[b] = nb;
    }
  };

  for (let it = 0; it < iters; it++) {
    const kind = it % 4;
    if (kind === 3) {
      // neighbours, horizontal or vertical, random parity
      const off = rnd() < 0.5 ? 0 : 1;
      if (rnd() < 0.5) {
        for (let y = 0; y < n; y++) for (let x = off; x + 1 < n; x += 2) trySwap(y * n + x, y * n + x + 1);
      } else {
        for (let y = off; y + 1 < n; y += 2) for (let x = 0; x < n; x++) trySwap(y * n + x, (y + 1) * n + x);
      }
    } else {
      if (kind === 0) {
        for (let i = 0; i < m; i++) order[i] = i;
        for (let i = m - 1; i > 0; i--) {
          const j = Math.floor(rnd() * (i + 1));
          const t = order[i];
          order[i] = order[j];
          order[j] = t;
        }
      } else {
        // pair up similar colours via a random projection in lab
        const d0 = bell(rnd);
        const d1 = bell(rnd);
        const d2 = bell(rnd);
        const lab = kind === 1 ? tgt : src;
        argsortInto(order, keys, m, (k) => {
          const i = (kind === 1 ? k : perm[k]) * 3;
          return lab[i] * d0 + lab[i + 1] * d1 + lab[i + 2] * d2 + bell(rnd) * 2;
        });
      }
      for (let i = rnd() < 0.5 ? 0 : 1; i + 1 < m; i += 2) trySwap(order[i], order[i + 1]);
    }
    if (onProgress && it % 50 === 0) onProgress(it / iters);
  }
  onProgress?.(1);

  return { perm, errSorted, errFinal: colorErr() };
}
