import { useLang } from "@/i18n/LanguageProvider";
import { Sparkles } from "lucide-react";

export const SiteFooter = () => {
  const { t } = useLang();
  return (
    <footer className="border-t border-border bg-gradient-soft">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-coral shadow-soft">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="font-display text-lg font-bold">{t.brand}</span>
        </div>
        <p className="text-sm text-muted-foreground">{t.footer}</p>
      </div>
    </footer>
  );
};
