"use client";

import { useEffect, useRef, useState } from "react";
import { EASE, gsap } from "@/lib/gsap";
import { useIntro } from "./Providers";

const ASSETS = ["/demo/plasma.png", "/demo/sunset.png", "/demo/orb.png", "/demo/type.png", "/demo/rings.png", "/demo/evening.jpg", "/demo/day.jpg"];

export function Preloader() {
  const { setReady } = useIntro();
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const loaded = useRef(0);
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    for (const src of ASSETS) fetch(src).finally(() => loaded.current++);
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      // never faster than ~1.2s, never ahead of the actual assets
      const time = Math.min(1, (performance.now() - t0) / 1200);
      const real = loaded.current / ASSETS.length;
      const v = Math.min(time, real * 0.9 + 0.1);
      setCount(Math.round(v * 100));
      if (v >= 1) {
        setTimeout(() => {
          setReady(true);
          gsap.to(el.current, { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: EASE, onComplete: () => setDone(true) });
        }, 180);
      } else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [setReady]);

  if (done) return null;
  return (
    <div ref={el} className="preloader">
      <span className="preloader-mark">ReImage®</span>
      <span className="preloader-count">{count}</span>
    </div>
  );
}
