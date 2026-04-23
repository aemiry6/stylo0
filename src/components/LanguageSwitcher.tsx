import { useLang } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export const LanguageSwitcher = () => {
  const { lang, setLang } = useLang();
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card/80 p-1 backdrop-blur-sm shadow-soft">
      <Languages className="ml-2 h-4 w-4 text-muted-foreground" />
      <Button
        variant={lang === "tr" ? "default" : "ghost"}
        size="sm"
        onClick={() => setLang("tr")}
        className="h-8 rounded-full px-3 text-xs font-semibold"
      >
        TR
      </Button>
      <Button
        variant={lang === "en" ? "default" : "ghost"}
        size="sm"
        onClick={() => setLang("en")}
        className="h-8 rounded-full px-3 text-xs font-semibold"
      >
        EN
      </Button>
    </div>
  );
};
