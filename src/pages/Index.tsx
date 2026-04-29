import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { Hero } from "@/components/Hero";
import { Steps } from "@/components/Steps";
import { UploadSection } from "@/components/UploadSection";
import { WardrobeGrid } from "@/components/WardrobeGrid";
import { SuggestPanel } from "@/components/SuggestPanel";
import { OutfitResult } from "@/components/OutfitResult";
import { SiteFooter } from "@/components/SiteFooter";
import { useWardrobe } from "@/state/WardrobeContext";
import { useAuth } from "@/state/AuthContext";

type Stage = "intro" | "wardrobe" | "suggest" | "result";

const StyloApp = () => {
  const { wardrobe } = useWardrobe();
  const { user, loading } = useAuth();
  const [stage, setStage] = useState<Stage>("intro");
  const wardrobeRef = useRef<HTMLDivElement>(null);
  const suggestRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);

  const scrollTo = (el: HTMLElement | null) =>
    el && el.scrollIntoView({ behavior: "smooth", block: "start" });

  useEffect(() => {
    if (stage === "wardrobe") setTimeout(() => scrollTo(wardrobeRef.current), 100);
    if (stage === "suggest") setTimeout(() => scrollTo(suggestRef.current), 100);
    if (stage === "result") setTimeout(() => scrollTo(resultRef.current), 100);
  }, [stage]);

  useEffect(() => {
    if (wardrobe.length > 0 && stage === "intro") setStage("wardrobe");
  }, [wardrobe.length, stage]);

  if (!loading && user && localStorage.getItem("stylo-new-user") !== "1") {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader onCta={() => scrollTo(uploadRef.current)} />

      <main>
        <Hero
          onPrimary={() => scrollTo(uploadRef.current)}
          onSecondary={() => scrollTo(document.getElementById("how"))}
        />

        <Steps />

        <div ref={uploadRef}>
          <UploadSection onAnalyzed={() => setStage("wardrobe")} />
        </div>

        {stage !== "intro" && (
          <div ref={wardrobeRef} className="animate-fade-in">
            <WardrobeGrid onNext={() => setStage("suggest")} />
          </div>
        )}

        {(stage === "suggest" || stage === "result") && (
          <div ref={suggestRef} className="animate-fade-in">
            <SuggestPanel onResult={() => setStage("result")} />
          </div>
        )}

        {stage === "result" && (
          <div ref={resultRef} className="animate-fade-in">
            <OutfitResult
              onRestart={() => {
                setStage("intro");
                setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
              }}
              onShuffle={() => {
                setStage("suggest");
              }}
            />
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
};

const Index = () => <StyloApp />;

export default Index;
