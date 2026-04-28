import { Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/state/AuthContext";

type Props = {
  onCta: () => void;
  appMode?: boolean;
};

export const SiteHeader = ({ onCta, appMode = false }: Props) => {
  const { t } = useLang();
  const { user, signOut } = useAuth();
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
          {!appMode && (
            <a
              href="#how"
              className="hidden text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground sm:inline-block"
            >
              {t.nav.how}
            </a>
          )}
          {user ? (
            <>
              {!appMode && <Link to="/app" className="hidden text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground sm:inline-block">{t.nav.closet}</Link>}
              <Button onClick={() => void signOut()} variant="ghost" className="hidden rounded-full px-4 sm:inline-flex" size="sm">{t.nav.logout}</Button>
            </>
          ) : (
            <Link to="/auth" className="hidden text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground sm:inline-block">{t.nav.login}</Link>
          )}
          <LanguageSwitcher />
          <Button onClick={onCta} className="hidden rounded-full px-5 sm:inline-flex" size="sm">
            {t.nav.try}
          </Button>
        </div>
      </div>
    </header>
  );
};
