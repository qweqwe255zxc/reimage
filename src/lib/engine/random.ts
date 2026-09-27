export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// cheap bell-ish noise, sd ~ 1
export const bell = (rnd: () => number) => (rnd() + rnd() + rnd() - 1.5) * 2;

// argsort for up to 65536 items: pack (quantized key, index) into one float64 and use native sort
export function argsortInto(order: Int32Array, keys: Float64Array, count: number, key: (i: number) => number) {
  let min = Infinity;
  let max = -Infinity;
  const raw = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    const k = key(i);
    raw[i] = k;
    if (k < min) min = k;
    if (k > max) max = k;
  }
  const scale = 1e9 / (max - min || 1);
  for (let i = 0; i < count; i++) keys[i] = Math.floor((raw[i] - min) * scale) * 65536 + i;
  const view = keys.subarray(0, count);
  view.sort();
  for (let i = 0; i < count; i++) order[i] = view[i] % 65536;
}
