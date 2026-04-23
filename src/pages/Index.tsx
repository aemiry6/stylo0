import { useEffect, useRef, useState } from "react";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { Hero } from "@/components/Hero";
import { Steps } from "@/components/Steps";
import { UploadSection } from "@/components/UploadSection";
import { WardrobeGrid } from "@/components/WardrobeGrid";
import { SuggestPanel } from "@/components/SuggestPanel";
import { OutfitResult } from "@/components/OutfitResult";
import { SiteFooter } from "@/components/SiteFooter";

type Stage = "intro" | "wardrobe" | "suggest" | "result";

const StyloApp = () => {
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

const Index = () => (
  <LanguageProvider>
    <StyloApp />
  </LanguageProvider>
);

export default Index;
