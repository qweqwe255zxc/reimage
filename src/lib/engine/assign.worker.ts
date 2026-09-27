import { assign } from "./assign";
import { rgbaToLab } from "./color";

export interface AssignRequest {
  id: number;
  src: Uint8ClampedArray;
  tgt: Uint8ClampedArray;
  n: number;
  seed: number;
}

self.onmessage = (e: MessageEvent<AssignRequest>) => {
  const { id, src, tgt, n, seed } = e.data;
  const t0 = performance.now();
  const r = assign(rgbaToLab(src), rgbaToLab(tgt), n, { seed }, (p) => self.postMessage({ id, type: "progress", p }));
  self.postMessage(
    { id, type: "done", perm: r.perm, errSorted: r.errSorted, errFinal: r.errFinal, ms: performance.now() - t0 },
    { transfer: [r.perm.buffer] },
  );
};
