"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

// "?" next to a label. popup lives only while hovered / focused, tap toggles it on touch
export function Info({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const tip = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = tip.current!;
      if (open) {
        gsap.set(el, { x: 0 });
        const r = el.getBoundingClientRect();
        const over = r.right - (window.innerWidth - 12);
        gsap.set(el, { x: over > 0 ? -over : 0 }); // keep it on screen near the right edge
        gsap.fromTo(el, { autoAlpha: 0, y: 6, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.28, ease: "power3.out" });
      } else {
        gsap.to(el, { autoAlpha: 0, y: 4, duration: 0.18, ease: "power2.in" });
      }
    },
    { dependencies: [open] },
  );

  return (
    <span className="info-wrap" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="info"
        aria-label="?"
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        ?
      </button>
      <span ref={tip} role="tooltip" className="tip" style={{ visibility: "hidden", opacity: 0 }}>
        {text}
      </span>
    </span>
  );
}
