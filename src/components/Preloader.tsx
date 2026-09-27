"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useIntro } from "./Providers";

const ASSETS = ["/demo/plasma.png", "/demo/sunset.png", "/demo/orb.png", "/demo/type.png", "/demo/rings.png"];

export function Preloader() {
  const { setReady } = useIntro();
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const loaded = useRef(0);

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
          setDone(true);
          setReady(true);
        }, 180);
      } else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [setReady]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="preloader"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          <span className="preloader-mark">ReImage®</span>
          <span className="preloader-count">{count}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
