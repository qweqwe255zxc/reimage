"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { LangProvider } from "@/lib/i18n";

const IntroCtx = createContext<{ ready: boolean; setReady: (v: boolean) => void }>({ ready: false, setReady: () => {} });

export function Providers({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  return (
    <LangProvider>
      <IntroCtx.Provider value={{ ready, setReady }}>{children}</IntroCtx.Provider>
    </LangProvider>
  );
}

// flips to true once the preloader curtain is gone
export const useIntro = () => useContext(IntroCtx);
