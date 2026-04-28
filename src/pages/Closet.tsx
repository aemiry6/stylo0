import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { UploadSection } from "@/components/UploadSection";
import { WardrobeGrid } from "@/components/WardrobeGrid";
import { SuggestPanel } from "@/components/SuggestPanel";
import { OutfitResult } from "@/components/OutfitResult";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/state/AuthContext";
import { useWardrobe } from "@/state/WardrobeContext";
import { useLang } from "@/i18n/LanguageProvider";

type Stage = "wardrobe" | "suggest" | "result";

const Closet = () => {
  const { user, profile, loading } = useAuth();
  const { wardrobe, loading: wardrobeLoading } = useWardrobe();
  const { lang } = useLang();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("wardrobe");
  const wardrobeRef = useRef<HTMLDivElement>(null);
  const suggestRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = stage === "wardrobe" ? wardrobeRef.current : stage === "suggest" ? suggestRef.current : resultRef.current;
    setTimeout(() => target?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, [stage]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) return <Navigate to="/auth" replace />;

  const name = profile?.display_name || user.email?.split("@")[0] || (lang === "tr" ? "Kullanıcı" : "User");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader onCta={() => navigate("/app")} appMode />
      <main>
        <section className="container pb-6 pt-12 md:pt-16">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-semibold text-primary">Stylo</p>
            <h1 className="mt-2 font-display text-4xl font-bold md:text-6xl">
              {lang === "tr" ? `${name} kişisinin dolabı` : `${name}'s wardrobe`}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
              {lang === "tr"
                ? "Dolabını her zaman burada gör, yeni parça ekle, yanlışları sil ve bugünkü kombinini seç."
                : "View your wardrobe anytime, add new pieces, remove mistakes, and choose today's outfit."}
            </p>
          </div>
        </section>

        {wardrobeLoading ? (
          <div className="container flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : wardrobe.length === 0 ? (
          <UploadSection onAnalyzed={() => setStage("wardrobe")} />
        ) : (
          <div ref={wardrobeRef}>
            <WardrobeGrid onNext={() => setStage("suggest")} />
          </div>
        )}

        {(stage === "suggest" || stage === "result") && wardrobe.length > 0 && (
          <div ref={suggestRef} className="animate-fade-in">
            <SuggestPanel onResult={() => setStage("result")} />
          </div>
        )}

        {stage === "result" && (
          <div ref={resultRef} className="animate-fade-in">
            <OutfitResult onRestart={() => setStage("wardrobe")} onShuffle={() => setStage("suggest")} />
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default Closet;
