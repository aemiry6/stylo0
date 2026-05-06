import { Navigate, useNavigate } from "react-router-dom";
import { CalendarDays, Loader2, Shirt, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/state/AuthContext";
import { useWardrobe } from "@/state/WardrobeContext";
import { useLang } from "@/i18n/LanguageProvider";
import { getItemEmoji } from "@/lib/itemEmoji";

const SavedOutfits = () => {
  const { user, loading } = useAuth();
  const { savedOutfits } = useWardrobe();
  const { t, lang } = useLang();
  const navigate = useNavigate();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader onCta={() => navigate("/app")} appMode />
      <main className="container py-12 md:py-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold text-primary">Stylo</p>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-6xl">{t.outfit.historyTitle}</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{t.outfit.historySubtitle}</p>
          <Button onClick={() => navigate("/app")} className="mt-6 rounded-full bg-gradient-coral font-semibold shadow-glow">
            <Sparkles className="mr-2 h-4 w-4" />
            {t.wardrobe.next}
          </Button>

          {savedOutfits.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-card">
              <Shirt className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 font-semibold text-muted-foreground">{t.outfit.emptyHistory}</p>
              <Button onClick={() => navigate("/app")} className="mt-5 rounded-full bg-gradient-coral font-semibold shadow-glow">
                {t.wardrobe.next}
              </Button>
            </div>
          ) : (
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {savedOutfits.map((saved) => (
                <article key={saved.id} className="rounded-3xl border border-border bg-card p-5 shadow-card">
                  <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <time dateTime={saved.created_at}>{new Date(saved.created_at).toLocaleDateString(lang)}</time>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {saved.outfit.items.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-muted/40 p-3">
                        <div className="flex h-16 items-center justify-center rounded-xl text-3xl shadow-soft" style={{ backgroundColor: item.color_hex }}>
                          {item.emoji}
                        </div>
                        <div className="mt-2 truncate text-sm font-bold">{lang === "tr" ? item.type_tr : item.type_en}</div>
                        <div className="truncate text-xs text-muted-foreground">{lang === "tr" ? item.color_tr : item.color_en}</div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {lang === "tr" ? saved.outfit.rationale_tr : saved.outfit.rationale_en}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default SavedOutfits;