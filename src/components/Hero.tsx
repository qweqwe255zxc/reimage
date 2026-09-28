"use client";

import { useRef, useState } from "react";
import { EASE, gsap, useGSAP } from "@/lib/gsap";
import { useLang } from "@/lib/i18n";
import { HeroCanvas } from "./HeroCanvas";
import { useIntro } from "./Providers";
import { Line } from "./Reveal";
import { scrollToId } from "./SmoothScroll";

export function Hero() {
  const { t } = useLang();
  const { ready } = useIntro();
  const [step, setStep] = useState({ from: "plasma", to: "sunset", i: -1, style: "smooth" });
  const art = useRef<HTMLElement>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ready) return;
      gsap.fromTo(art.current, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 1.4, ease: EASE, delay: 0.2 });
      gsap.fromTo(bottom.current, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1, ease: EASE, delay: 0.45 });
    },
    { dependencies: [ready] },
  );

  return (
    <section className="hero">
      <h1 className="hero-title">
        <Line show={ready}>{t.hero_1}</Line>
        <Line show={ready} delay={0.08}>
          {t.hero_2a} <em>{t.hero_2b}</em>
        </Line>
        <Line show={ready} delay={0.16}>
          {t.hero_3}
        </Line>
      </h1>

      <figure ref={art} className="hero-art">
        <HeroCanvas onStep={(from, to, i, style) => setStep({ from, to, i, style })} />
        <figcaption className="mono hero-caption">
          <span>
            <i className="dot" /> {t.live}
          </span>
          <span>
            {step.from} → {step.to} · {t.presets_traj[step.style as keyof typeof t.presets_traj]}
          </span>
          <span>{String(Math.max(0, step.i) + 1).padStart(2, "0")}/04</span>
        </figcaption>
      </figure>

      <div ref={bottom} className="hero-bottom">
        <p className="hero-lede">{t.hero_lede}</p>
        <button className="cta" onClick={() => scrollToId("play")}>
          {t.hero_cta} <span>↘</span>
        </button>
        <dl className="facts">
          <div>
            <dt className="mono">{t.fact_px}</dt>
            <dd>9 216</dd>
          </div>
          <div>
            <dt className="mono">{t.fact_lost}</dt>
            <dd>0</dd>
          </div>
          <div>
            <dt className="mono">{t.fact_recolored}</dt>
            <dd>0</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
