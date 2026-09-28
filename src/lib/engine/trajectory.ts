export const EASES = ["smooth", "snap", "linear", "spring"] as const;
export type Ease = (typeof EASES)[number];

export interface Trajectory {
  spread: number; // 0 = everyone at once, 0.9 = one after another
  arc: number; // how much paths bend
  bias: number; // -1 all counter-clockwise, 0 mixed, 1 all clockwise
  swirl: number; // turns around the center mid-flight
  burst: number; // blow outwards mid-flight
  wobble: number; // jitter along the way
  lift: number; // particles brighten while flying
  ease: Ease;
}

export const PRESETS: Record<string, Trajectory> = {
  smooth: { spread: 0.55, arc: 0.35, bias: 0, swirl: 0, burst: 0, wobble: 0, lift: 0.6, ease: "smooth" },
  vortex: { spread: 0.35, arc: 0.1, bias: 0, swirl: 1.1, burst: 0, wobble: 0, lift: 0.8, ease: "smooth" },
  burst: { spread: 0.15, arc: 0.1, bias: 0, swirl: 0, burst: 0.75, wobble: 0, lift: 1.2, ease: "snap" },
  river: { spread: 0.7, arc: 0.9, bias: 1, swirl: 0, burst: 0, wobble: 0, lift: 0.4, ease: "smooth" },
  chaos: { spread: 0.45, arc: 0.6, bias: 0, swirl: 0.35, burst: 0.3, wobble: 0.8, lift: 1, ease: "spring" },
};

export const DEFAULT_TRAJ = PRESETS.smooth;

export function randomTrajectory(): Trajectory {
  const r = Math.random;
  const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  return {
    spread: +(0.1 + r() * 0.7).toFixed(2),
    arc: +(r() * 1.1).toFixed(2),
    bias: pick([-1, 0, 0, 1]),
    swirl: +((r() - 0.5) * 2.4 * (r() < 0.5 ? 1 : 0)).toFixed(2),
    burst: +(r() < 0.4 ? r() * 0.8 : 0).toFixed(2),
    wobble: +(r() < 0.3 ? r() * 0.8 : 0).toFixed(2),
    lift: +(0.3 + r() * 1.1).toFixed(2),
    ease: pick(EASES),
  };
}

function ease(p: number, e: Ease) {
  if (e === "linear") return p;
  if (e === "snap") return p >= 1 ? 1 : 1 - Math.pow(2, -10 * p);
  if (e === "spring") {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
  }
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

// js twin of the vertex shader, used for the path preview. keep in sync with renderer.ts
export function pathPoint(
  tr: Trajectory,
  n: number,
  start: [number, number],
  end: [number, number],
  curl: number,
  rand: number,
  p: number,
): [number, number] {
  const e = ease(p, tr.ease);
  const arc = Math.sin(Math.PI * Math.min(1, Math.max(0, e)));
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const dir = curl + (Math.abs(curl) * Math.sign(tr.bias || 1) - curl) * Math.abs(tr.bias);
  let x = start[0] + dx * e - dy * arc * dir * tr.arc;
  let y = start[1] + dy * e + dx * arc * dir * tr.arc;
  const c = (n - 1) / 2;
  let qx = x - c;
  let qy = y - c;
  const a = tr.swirl * Math.PI * 2 * arc;
  [qx, qy] = [qx * Math.cos(a) - qy * Math.sin(a), qx * Math.sin(a) + qy * Math.cos(a)];
  const len = Math.hypot(qx, qy) + 1e-3;
  const push = tr.burst * arc * n * 0.35 * (0.5 + rand);
  x = c + qx + (qx / len) * push;
  y = c + qy + (qy / len) * push;
  const w = tr.wobble * arc * n * 0.04;
  x += Math.sin(e * 19 + rand * 6.283) * w;
  y += Math.cos(e * 23 + rand * 9.1) * w;
  return [x, y];
}
