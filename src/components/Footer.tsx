"use client";

import { useLang } from "@/lib/i18n";
import { AUTHOR, REPO_URL } from "@/lib/site";

export function Footer() {
  const { t } = useLang();
  const items = [...t.marquee, ...t.marquee];
  return (
    <footer className="foot">
      <div className="marquee" aria-hidden="true">
        <div className="track">
          {items.map((m, i) => (
            <span key={i}>
              {m}
              <i>✳</i>
            </span>
          ))}
        </div>
      </div>
      <div className="foot-row mono">
        <span>{t.foot_note}</span>
        <span>
          {t.credit} — {AUTHOR}
        </span>
        <a className="link" href={REPO_URL} target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
        <span>© {new Date().getFullYear()}</span>
      </div>
      <div className="wordmark" aria-hidden="true">
        Re<em>image</em>
      </div>
    </footer>
  );
}
