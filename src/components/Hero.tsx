import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import heroImage from "@/assets/hero-wardrobe.jpg";

type Props = {
  onPrimary: () => void;
  onSecondary: () => void;
};

export const Hero = ({ onPrimary, onSecondary }: Props) => {
  const { t } = useLang();
  return (
    <section id="top" className="relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-gradient-coral opacity-30 blur-3xl animate-blob" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-gradient-lavender opacity-40 blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-gradient-mint opacity-30 blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
      </div>

      <div className="container grid gap-12 py-16 md:grid-cols-2 md:items-center md:py-24 lg:py-32">
        <div className="space-y-7 animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm font-medium shadow-soft backdrop-blur-sm">
            {t.hero.badge}
          </span>

          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            <span className="text-gradient-hero">{t.hero.title1}</span>{" "}
            <span className="text-foreground">{t.hero.title2}</span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            {t.hero.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={onPrimary}
              className="group h-14 rounded-full bg-gradient-coral px-8 text-base font-semibold text-primary-foreground shadow-glow transition-bounce hover:scale-105 hover:shadow-pop"
            >
              {t.hero.cta}
              <ArrowRight className="ml-1 h-5 w-5 transition-smooth group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onSecondary}
              className="h-14 rounded-full border-2 px-7 text-base font-semibold"
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              {t.hero.ctaSecondary}
            </Button>
          </div>
        </div>

        <div className="relative animate-scale-in">
          <div className="absolute inset-4 -z-10 rounded-[3rem] bg-gradient-hero opacity-20 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-card shadow-card">
            <img
              src={heroImage}
              alt="Colorful wardrobe full of clothes organized by AI"
              width={1280}
              height={1024}
              className="h-auto w-full animate-float"
            />
          </div>
          {/* Floating chips */}
          <div className="absolute -left-3 top-10 hidden rounded-2xl border border-border bg-card px-4 py-2 text-sm font-semibold shadow-pop animate-float md:block">
            🌤️ 19°C
          </div>
          <div className="absolute -right-2 bottom-16 hidden rounded-2xl bg-gradient-sunshine px-4 py-2 text-sm font-bold text-highlight-foreground shadow-pop animate-float md:block" style={{ animationDelay: "1.5s" }}>
            ✨ AI ready
          </div>
        </div>
      </div>
    </section>
  );
};
