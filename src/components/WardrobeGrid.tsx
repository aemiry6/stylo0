import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import { ArrowRight } from "lucide-react";

const items = [
  { emoji: "👕", color: "Mercan", type: "Tişört", texture: "Pamuk", weight: "İnce", season: "Yaz", swatch: "bg-gradient-coral", colorEn: "Coral", typeEn: "T-shirt", textureEn: "Cotton", weightEn: "Light", seasonEn: "Summer" },
  { emoji: "👖", color: "İndigo", type: "Kot", texture: "Denim", weight: "Orta", season: "4 mevsim", swatch: "bg-[hsl(220_60%_45%)]", colorEn: "Indigo", typeEn: "Jeans", textureEn: "Denim", weightEn: "Medium", seasonEn: "All season" },
  { emoji: "🧥", color: "Lavanta", type: "Ceket", texture: "Yün", weight: "Kalın", season: "Sonbahar", swatch: "bg-gradient-lavender", colorEn: "Lavender", typeEn: "Jacket", textureEn: "Wool", weightEn: "Heavy", seasonEn: "Autumn" },
  { emoji: "👟", color: "Beyaz", type: "Sneaker", texture: "Deri", weight: "—", season: "4 mevsim", swatch: "bg-card border", colorEn: "White", typeEn: "Sneaker", textureEn: "Leather", weightEn: "—", seasonEn: "All season" },
  { emoji: "👗", color: "Sarı", type: "Elbise", texture: "Keten", weight: "İnce", season: "Yaz", swatch: "bg-gradient-sunshine", colorEn: "Yellow", typeEn: "Dress", textureEn: "Linen", weightEn: "Light", seasonEn: "Summer" },
  { emoji: "🧶", color: "Mint", type: "Kazak", texture: "Örme", weight: "Orta", season: "Kış", swatch: "bg-gradient-mint", colorEn: "Mint", typeEn: "Sweater", textureEn: "Knit", weightEn: "Medium", seasonEn: "Winter" },
];

type Props = { onNext: () => void };

export const WardrobeGrid = ({ onNext }: Props) => {
  const { t, lang } = useLang();
  return (
    <section id="wardrobe" className="container py-20 md:py-24">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">{t.wardrobe.title}</h2>
        <p className="mt-3 text-lg text-muted-foreground">
          {t.wardrobe.subtitle.replace("{count}", String(items.length))}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => (
          <div
            key={i}
            className="group rounded-3xl border border-border bg-card p-5 shadow-card transition-bounce hover:-translate-y-1 hover:shadow-pop"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="mb-4 flex items-center gap-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-soft ${it.swatch}`}>
                {it.emoji}
              </div>
              <div>
                <div className="font-display text-xl font-bold">
                  {lang === "tr" ? it.type : it.typeEn}
                </div>
                <div className="text-sm text-muted-foreground">
                  {lang === "tr" ? it.color : it.colorEn}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Tag label={t.wardrobe.tags.texture} value={lang === "tr" ? it.texture : it.textureEn} />
              <Tag label={t.wardrobe.tags.weight} value={lang === "tr" ? it.weight : it.weightEn} />
              <Tag label={t.wardrobe.tags.season} value={lang === "tr" ? it.season : it.seasonEn} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Button
          onClick={onNext}
          size="lg"
          className="group h-14 rounded-full bg-gradient-coral px-8 text-base font-semibold shadow-glow transition-bounce hover:scale-105 hover:shadow-pop"
        >
          {t.wardrobe.next}
          <ArrowRight className="ml-1 h-5 w-5 transition-smooth group-hover:translate-x-1" />
        </Button>
      </div>
    </section>
  );
};

const Tag = ({ label, value }: { label: string; value: string }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
    <span className="opacity-60">{label}:</span>
    <span className="text-foreground">{value}</span>
  </span>
);
