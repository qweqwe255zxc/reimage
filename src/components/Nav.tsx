"use client";

import { useLang } from "@/lib/i18n";
import { REPO_URL } from "@/lib/site";
import { scrollToId } from "./SmoothScroll";

export function Nav() {
  const { t, lang, setLang } = useLang();
  return (
    <header className="nav">
      <button className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        ReImage<sup>®</sup>
      </button>
      <nav className="nav-links">
        <button className="link" onClick={() => scrollToId("play")}>
          {t.nav_play}
        </button>
        <button className="link hide-sm" onClick={() => scrollToId("how")}>
          {t.nav_how}
        </button>
        <a className="link hide-sm" href={REPO_URL} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <span className="lang">
          <button className={lang === "ru" ? "on" : ""} onClick={() => setLang("ru")}>
            RU
          </button>
          /
          <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>
            EN
          </button>
        </span>
      </nav>
    </header>
  );
}
