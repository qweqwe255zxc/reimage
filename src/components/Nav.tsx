"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { REPO_URL } from "@/lib/site";
import { scrollToId } from "./SmoothScroll";

export function Nav() {
  const { t, lang, setLang } = useLang();
  const [hidden, setHidden] = useState(false);

  // hide while scrolling down so it doesn't sit on top of the content, back on scroll up
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return;
      setHidden(y > 120 && y > last);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav ${hidden ? "is-hidden" : ""}`}>
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
