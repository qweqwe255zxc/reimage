"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { Info } from "./Info";
import { EASES, pathPoint, PRESETS, randomTrajectory, type Trajectory } from "@/lib/engine/trajectory";

const N = 20;
const W = 320;
const H = 160;
const SAMPLES = 16;

type Knob = { key: keyof Omit<Trajectory, "ease">; min: number; max: number; step: number };
const KNOBS: Knob[] = [
  { key: "spread", min: 0, max: 0.9, step: 0.01 },
  { key: "arc", min: 0, max: 1.5, step: 0.01 },
  { key: "bias", min: -1, max: 1, step: 0.05 },
  { key: "swirl", min: -1.5, max: 1.5, step: 0.05 },
  { key: "burst", min: 0, max: 1, step: 0.01 },
  { key: "wobble", min: 0, max: 1, step: 0.01 },
  { key: "lift", min: 0, max: 2, step: 0.01 },
];

// fixed fake particles for the preview, left cluster flies to the right cluster
const particles = Array.from({ length: SAMPLES }, (_, i) => {
  const r = (k: number) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;
  return {
    start: [2 + r(1) * 5, 2 + r(2) * 16] as [number, number],
    end: [13 + r(3) * 5, 2 + r(4) * 16] as [number, number],
    curl: r(5) * 2 - 1,
    rand: r(6),
    rank: i / (SAMPLES - 1),
  };
});

const same = (a: Trajectory, b: Trajectory) => (Object.keys(a) as (keyof Trajectory)[]).every((k) => a[k] === b[k]);

export function TrajectoryEditor({ value, onChange, disabled }: { value: Trajectory; onChange: (t: Trajectory) => void; disabled?: boolean }) {
  const { t } = useLang();
  const svg = useRef<SVGSVGElement>(null);
  const dots = useRef<(SVGRectElement | null)[]>([]);
  const live = useRef(value);
  live.current = value;
  // paths only on the client: server and browser sin() differ in the last digits -> hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const paths = useMemo(
    () =>
      !mounted ? [] : particles.map((pt) => {
        let d = "";
        for (let k = 0; k <= 48; k++) {
          const [x, y] = pathPoint(value, N, pt.start, pt.end, pt.curl, pt.rand, k / 48);
          d += `${k ? "L" : "M"}${((x + 0.5) / N) * W},${((y + 0.5) / N) * H} `;
        }
        return d;
      }),
    [value, mounted],
  );

  useEffect(() => {
    let raf = 0;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(svg.current!);
    const t0 = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      const tr = live.current;
      const cycle = ((now - t0) / 2600) % 1.35; // a short pause at the end
      const g = Math.min(1, cycle);
      particles.forEach((pt, i) => {
        const p = Math.min(1, Math.max(0, (g - pt.rank * tr.spread) / (1 - Math.min(0.95, tr.spread))));
        const [x, y] = pathPoint(tr, N, pt.start, pt.end, pt.curl, pt.rand, p);
        const el = dots.current[i];
        if (el) {
          el.setAttribute("x", String(((x + 0.5) / N) * W - 4));
          el.setAttribute("y", String(((y + 0.5) / N) * H - 4));
        }
      });
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  const fmt = (k: Knob["key"], v: number) => (k === "bias" ? (v === 0 ? "±" : v < 0 ? `↺ ${Math.abs(v).toFixed(2)}` : `↻ ${v.toFixed(2)}`) : v.toFixed(2));

  return (
    <div className="traj">
      <svg ref={svg} className="traj-preview" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
        {particles.map((_, i) => (
          <rect key={i} ref={(el) => void (dots.current[i] = el)} width={8} height={8} className={i % 5 === 0 ? "hot" : ""} />
        ))}
      </svg>

      <div className="seg">
        {Object.entries(PRESETS).map(([id, p]) => (
          <button key={id} className={same(p, value) ? "on" : ""} disabled={disabled} onClick={() => onChange(p)}>
            {t.presets_traj[id as keyof typeof t.presets_traj]}
          </button>
        ))}
        <button className="dice" disabled={disabled} onClick={() => onChange(randomTrajectory())}>
          {t.random} ↻
        </button>
      </div>

      <div className="knobs">
        {KNOBS.map((k) => (
          <label key={k.key} className="knob">
            <span className="mono">
              <span>
                {t.knobs[k.key]} <Info text={t.tips[k.key]} />
              </span>
              <b>{fmt(k.key, value[k.key])}</b>
            </span>
            <input
              type="range"
              min={k.min}
              max={k.max}
              step={k.step}
              value={value[k.key]}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, [k.key]: +e.target.value })}
            />
          </label>
        ))}
      </div>

      <div className="seg small">
        <span className="mono idx seg-label">
          {t.ease} <Info text={t.tips.ease} />
        </span>
        {EASES.map((e) => (
          <button key={e} className={value.ease === e ? "on" : ""} disabled={disabled} onClick={() => onChange({ ...value, ease: e })}>
            {t.eases[e]}
          </button>
        ))}
      </div>
    </div>
  );
}
