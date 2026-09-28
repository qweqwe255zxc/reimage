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
      // fast mouse: a close could start while the open is still running and lose to it. kill the old one first
      gsap.killTweensOf(el);
      if (open) {
        gsap.set(el, { display: "block", x: 0 });
        const r = el.getBoundingClientRect();
        const over = r.right - (window.innerWidth - 12);
        gsap.set(el, { x: over > 0 ? -over : 0 }); // keep it on screen near the right edge
        gsap.fromTo(el, { autoAlpha: 0, y: 6, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.28, ease: "power3.out" });
      } else {
        // display:none when closed, a hidden tip near the right edge still widens the page
        gsap.to(el, { autoAlpha: 0, y: 4, duration: 0.18, ease: "power2.in", onComplete: () => void gsap.set(el, { display: "none" }) });
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
        onFocus={(e) => e.currentTarget.matches(":focus-visible") && setOpen(true)} // keyboard only, a mouse click shouldn't pin it
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          // open only: focus already opened it, a toggle would close it right away on tap
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        ?
      </button>
      <span ref={tip} role="tooltip" className="tip" style={{ display: "none", visibility: "hidden", opacity: 0 }}>
        {text}
      </span>
    </span>
  );
}
