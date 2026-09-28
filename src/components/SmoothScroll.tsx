"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { ScrollTrigger } from "@/lib/gsap";

let lenis: Lenis | null = null;

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth" });
}

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    lenis = new Lenis({ autoRaf: true, lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    return () => {
      lenis?.destroy();
      lenis = null;
    };
  }, []);
  return null;
}
