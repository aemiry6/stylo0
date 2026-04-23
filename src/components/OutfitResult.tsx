import { Heart, Shuffle, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";

type Props = { onRestart: () => void; onShuffle: () => void };

const outfit = [
  { partKey: "top" as const, emoji: "👕", labelTr: "Mercan tişört", labelEn: "Coral tee", swatch: "bg-gradient-coral" },
  { partKey: "outer" as const, emoji: "🧥", labelTr: "Lavanta ceket", labelEn: "Lavender jacket", swatch: "bg-gradient-lavender" },
  { partKey: "bottom" as const, emoji: "👖", labelTr: "İndigo kot", labelEn: "Indigo jeans", swatch: "bg-[hsl(220_60%_45%)]" },
  { partKey: "shoes" as const, emoji: "👟", labelTr: "Beyaz sneaker", labelEn: "White sneakers", swatch: "bg-card border-2 border-border" },
];

export const OutfitResult = ({ onRestart, onShuffle }: Props) => {
  const { t, lang } = useLang();
  return (
    <section id="result" className="container py-20 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-sunshine px-4 py-1.5 text-sm font-bold text-highlight-foreground shadow-soft">
            <Sparkles className="h-4 w-4" />
            AI Pick
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">{t.outfit.title}</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {outfit.map((p, i) => (
            <div
              key={p.partKey}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card transition-bounce hover:-translate-y-2 hover:shadow-pop"
              style={{ animation: `fade-in 0.5s ease-out ${i * 80}ms both` }}
            >
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t.outfit.parts[p.partKey]}
              </div>
              <div className={`mt-4 mb-4 flex h-32 w-full items-center justify-center rounded-2xl text-6xl shadow-soft ${p.swatch}`}>
                {p.emoji}
              </div>
              <div className="font-display text-lg font-bold">
                {lang === "tr" ? p.labelTr : p.labelEn}
              </div>
            </div>
          ))}
        </div>

        {/* Why */}
        <div className="mt-8 rounded-3xl border border-border bg-gradient-soft p-6 shadow-card md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-lavender shadow-glow">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold">{t.outfit.why}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{t.outfit.whyText}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" className="h-13 rounded-full bg-gradient-coral px-7 font-semibold shadow-glow transition-bounce hover:scale-105 hover:shadow-pop">
            <Heart className="mr-2 h-5 w-5 fill-current" />
            {t.outfit.like}
          </Button>
          <Button size="lg" variant="outline" onClick={onShuffle} className="h-13 rounded-full border-2 px-7 font-semibold">
            <Shuffle className="mr-2 h-5 w-5" />
            {t.outfit.shuffle}
          </Button>
          <Button size="lg" variant="ghost" onClick={onRestart} className="h-13 rounded-full px-6 font-semibold">
            <RotateCcw className="mr-2 h-5 w-5" />
            {t.outfit.restart}
          </Button>
        </div>
      </div>
    </section>
  );
};
