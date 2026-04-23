import { Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "@/components/ui/button";

type Props = {
  onCta: () => void;
};

export const SiteHeader = ({ onCta }: Props) => {
  const { t } = useLang();
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2 group">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-coral shadow-glow transition-bounce group-hover:scale-110">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="font-display text-2xl font-bold tracking-tight">{t.brand}</span>
        </a>
        <div className="flex items-center gap-2 md:gap-3">
          <a
            href="#how"
            className="hidden text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground sm:inline-block"
          >
            {t.nav.how}
          </a>
          <LanguageSwitcher />
          <Button onClick={onCta} className="hidden rounded-full px-5 sm:inline-flex" size="sm">
            {t.nav.try}
          </Button>
        </div>
      </div>
    </header>
  );
};
