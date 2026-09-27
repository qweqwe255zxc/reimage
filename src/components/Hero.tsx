"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { HeroCanvas } from "./HeroCanvas";
import { useIntro } from "./Providers";
import { Line } from "./Reveal";
import { scrollToId } from "./SmoothScroll";

export function Hero() {
  const { t } = useLang();
  const { ready } = useIntro();
  const [step, setStep] = useState({ from: "plasma", to: "sunset", i: -1 });

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

      <motion.figure
        className="hero-art"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={ready ? { opacity: 1, scale: 1 } : undefined}
        transition={{ duration: 1.4, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
      >
        <HeroCanvas onStep={(from, to, i) => setStep({ from, to, i })} />
        <figcaption className="mono hero-caption">
          <span>
            <i className="dot" /> {t.live}
          </span>
          <span>
            {step.from} → {step.to}
          </span>
          <span>{String(Math.max(0, step.i) + 1).padStart(2, "0")}/04</span>
        </figcaption>
      </motion.figure>

      <motion.div
        className="hero-bottom"
        initial={{ opacity: 0, y: 20 }}
        animate={ready ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 1, ease: [0.76, 0, 0.24, 1], delay: 0.45 }}
      >
        <p className="hero-lede">{t.hero_lede}</p>
        <button className="cta" data-cursor="↓" onClick={() => scrollToId("play")}>
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
      </motion.div>
    </section>
  );
}
