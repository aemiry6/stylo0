import { useLang } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export const LanguageSwitcher = () => {
  const { lang, setLang } = useLang();
  const languages = ["tr", "en", "de", "es"] as const;

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card/80 p-1 backdrop-blur-sm shadow-soft">
      <Languages className="ml-2 h-4 w-4 text-muted-foreground" />
      {languages.map((code) => (
        <Button
          key={code}
          variant={lang === code ? "default" : "ghost"}
          size="sm"
          onClick={() => setLang(code)}
          className="h-8 rounded-full px-2.5 text-xs font-semibold uppercase"
        >
          {code}
        </Button>
      ))}
    </div>
  );
};
