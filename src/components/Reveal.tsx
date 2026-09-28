"use client";

import { useRef, type ReactNode } from "react";
import { EASE, gsap, useGSAP } from "@/lib/gsap";

// text line slides up out of a mask. `show` drives it by hand, otherwise it plays when scrolled into view
export function Line({ children, delay = 0, show }: { children: ReactNode; delay?: number; show?: boolean }) {
  const mask = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (show === false) return;
      gsap.fromTo(inner.current, { y: 0, yPercent: 110 }, {
        yPercent: 0,
        duration: 1.1,
        ease: EASE,
        delay,
        // the mask is the trigger: the clipped inner text never counts as visible
        scrollTrigger: show === undefined ? { trigger: mask.current, start: "top 92%", once: true } : undefined,
      });
    },
    { dependencies: [show] },
  );

  return (
    <span ref={mask} className="line">
      <span ref={inner} className="line-inner">
        {children}
      </span>
    </span>
  );
}

export function Fade({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const el = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.fromTo(el.current, { autoAlpha: 0, y: 24 }, {
      autoAlpha: 1,
      y: 0,
      duration: 0.9,
      ease: EASE,
      delay,
      scrollTrigger: { trigger: el.current, start: "top 92%", once: true },
    });
  });
  return (
    <div ref={el} className={`fade ${className ?? ""}`}>
      {children}
    </div>
  );
}

// keeps the node mounted and fades it in / out
export function Presence({ show, className, children }: { show: boolean; className?: string; children: ReactNode }) {
  const el = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.to(el.current, { autoAlpha: show ? 1 : 0, duration: show ? 0.3 : 0.45, ease: "power2.out" });
    },
    { dependencies: [show] },
  );
  return (
    <div ref={el} className={className} style={{ visibility: "hidden", opacity: 0 }} aria-hidden={!show}>
      {children}
    </div>
  );
}
