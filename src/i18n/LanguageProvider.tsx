import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { translations, Lang, Translation } from "./translations";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translation;
};

const LanguageContext = createContext<Ctx | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "tr";
    const saved = window.localStorage.getItem("stylo-lang") as Lang | null;
    if (saved === "tr" || saved === "en") return saved;
    return navigator.language.startsWith("tr") ? "tr" : "en";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    window.localStorage.setItem("stylo-lang", l);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
};
