import { LogIn, Shirt, Sparkles, Camera } from "lucide-react";
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
        <Link to={user ? "/app" : "/"} className="flex items-center gap-2 group">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-coral shadow-glow transition-bounce group-hover:scale-110">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="font-display text-2xl font-bold tracking-tight">{t.brand}</span>
        </Link>
        <div className="flex items-center gap-2 md:gap-3">
          {user ? (
            <>
              {/* Closet (wardrobe) */}
              <Link
                to="/app"
                className="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground sm:px-3 sm:text-sm sm:font-medium"
                aria-label={t.nav.closet}
                title={t.nav.closet}
              >
                <Shirt className="h-5 w-5 sm:hidden" />
                <span className="hidden sm:inline">{t.nav.closet}</span>
              </Link>
              {/* Outfits */}
              <Link
                to="/outfits"
                className="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground sm:px-3 sm:text-sm sm:font-medium"
                aria-label={t.nav.outfits}
                title={t.nav.outfits}
              >
                <Sparkles className="h-5 w-5 sm:hidden" />
                <span className="hidden sm:inline">{t.nav.outfits}</span>
              </Link>
              {/* Add new clothes (camera) */}
              <Link
                to="/app?add=1"
                className="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground sm:px-3 sm:text-sm sm:font-medium"
                aria-label={t.nav.addClothes}
                title={t.nav.addClothes}
              >
                <Camera className="h-5 w-5 sm:hidden" />
                <span className="hidden sm:inline">{t.nav.addClothes}</span>
              </Link>
              <Button onClick={() => void signOut()} variant="ghost" className="hidden rounded-full px-4 sm:inline-flex" size="sm">
                {t.nav.logout}
              </Button>
            </>
          ) : (
            <>
              {!appMode && (
                <a
                  href="#how"
                  className="text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground"
                >
                  {t.nav.how}
                </a>
              )}
              <Link
                to="/auth"
                className="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground sm:px-3 sm:text-sm sm:font-medium"
                aria-label={t.nav.login}
                title={t.nav.login}
              >
                <LogIn className="h-5 w-5 sm:hidden" />
                <span className="hidden sm:inline">{t.nav.login}</span>
              </Link>
              <Button onClick={onCta} className="hidden rounded-full px-5 sm:inline-flex" size="sm">
                {t.nav.try}
              </Button>
            </>
          )}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};
