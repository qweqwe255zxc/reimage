"use client";

import { useEffect, useRef, useState } from "react";
import { Assigner } from "@/lib/engine/client";
import { loadBitmap, toGrid } from "@/lib/engine/image";
import { buildMorph, type Mode } from "@/lib/engine/morph";
import { PixelRenderer } from "@/lib/engine/renderer";
import { PAPER } from "@/lib/site";

const N = 96;
const CHAIN = ["sunset", "orb", "type", "rings"];
const MODES: Mode[] = ["contrast", "wave", "brightness", "distance"];
const HOLD = 1.6;
const FLY = 3.4;

// one set of plasma pixels hopping from picture to picture forever
export function HeroCanvas({ onStep }: { onStep: (from: string, to: string, i: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const stepCb = useRef(onStep);
  stepCb.current = onStep;

  useEffect(() => {
    let renderer: PixelRenderer;
    try {
      renderer = new PixelRenderer(canvas.current!, PAPER);
    } catch (e) {
      console.error(e);
      setFailed(true);
      return;
    }
    const assigner = new Assigner();
    let alive = true;
    let visible = true;
    let raf = 0;

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas.current!);

    (async () => {
      const src = toGrid(await loadBitmap("/demo/plasma.png"), N);
      const targets = await Promise.all(CHAIN.map(async (id) => toGrid(await loadBitmap(`/demo/${id}.png`), N)));
      const perms: (Int32Array | undefined)[] = [];
      const want = (i: number) => {
        if (perms[i] || !alive) return;
        assigner.run(src, targets[i], N, i).then((r) => r && (perms[i] = r.perm));
      };
      CHAIN.forEach((_, i) => want(i));

      const identity = new Int32Array(N * N).map((_, i) => i);
      let morph = buildMorph({ n: N, src, perm: identity, mode: "random", seed: 0 });
      renderer.setMorph(morph);

      let step = -1;
      let phase: "hold" | "fly" = "hold";
      let clock = 0;
      let last = performance.now();
      let prev = "plasma";

      const tick = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (visible) {
          clock += dt;
          if (phase === "hold" && clock > HOLD) {
            const next = (step + 1) % CHAIN.length;
            if (perms[next]) {
              step = next;
              morph = buildMorph({ n: N, src, perm: perms[next]!, mode: MODES[next], seed: next, start: morph.end });
              renderer.setMorph(morph);
              stepCb.current(prev, CHAIN[next], next);
              prev = CHAIN[next];
              phase = "fly";
              clock = 0;
            }
          } else if (phase === "fly" && clock > FLY) {
            phase = "hold";
            clock = 0;
          }
          renderer.draw(phase === "fly" ? clock / FLY : step < 0 ? 0 : 1, { lift: 0.8, glow: 0.15 });
        }
        if (alive) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      assigner.dispose();
      renderer.dispose();
    };
  }, []);

  if (failed) return <img className="hero-canvas" src="/demo/sunset.png" alt="" />;
  return <canvas ref={canvas} className="hero-canvas" />;
}
