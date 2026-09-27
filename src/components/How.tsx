"use client";

import { useLang } from "@/lib/i18n";
import { Fade, Line } from "./Reveal";

// tiny pictograms, one per step
function Glyph({ i }: { i: number }) {
  const cells = Array.from({ length: 36 }, (_, k) => k);
  if (i === 0)
    return (
      <svg viewBox="0 0 60 60" className="glyph">
        {cells.map((k) => (
          <rect key={k} x={(k % 6) * 10 + 1} y={Math.floor(k / 6) * 10 + 1} width={8} height={8} opacity={0.25 + ((k * 37) % 11) / 14} />
        ))}
      </svg>
    );
  if (i === 1)
    return (
      <svg viewBox="0 0 60 60" className="glyph">
        {cells.map((k) => (
          <rect key={k} x={(k % 6) * 10 + 1} y={Math.floor(k / 6) * 10 + 1} width={8} height={8} opacity={0.12 + (k / 36) * 0.88} />
        ))}
      </svg>
    );
  if (i === 2)
    return (
      <svg viewBox="0 0 60 60" className="glyph">
        <rect x={4} y={22} width={16} height={16} />
        <rect x={40} y={22} width={16} height={16} className="hot" />
        <path d="M12 18 C 20 4, 40 4, 48 18" fill="none" strokeWidth={1.5} />
        <path d="M48 42 C 40 56, 20 56, 12 42" fill="none" strokeWidth={1.5} />
      </svg>
    );
  return (
    <svg viewBox="0 0 60 60" className="glyph">
      <path d="M6 52 C 10 10, 50 10, 54 8" fill="none" strokeWidth={1.5} strokeDasharray="2 3" />
      <rect x={2} y={48} width={8} height={8} opacity={0.3} />
      <rect x={24} y={17} width={9} height={9} />
      <rect x={48} y={2} width={10} height={10} className="hot" />
    </svg>
  );
}

export function How() {
  const { t } = useLang();
  return (
    <section id="how" className="how">
      <header className="section-head">
        <span className="mono idx">{t.how_idx}</span>
        <h2 className="section-title">
          <Line>{t.how_title_1}</Line>
          <Line delay={0.08}>
            <em>{t.how_title_2}</em>
          </Line>
        </h2>
      </header>
      <ol className="steps">
        {t.steps.map(([title, body], i) => (
          <li key={i} className="step">
            <Fade className="step-inner" delay={i * 0.06}>
              <span className="step-num">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
              <Glyph i={i} />
            </Fade>
          </li>
        ))}
      </ol>
    </section>
  );
}
