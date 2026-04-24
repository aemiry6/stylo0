import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { useWardrobe, type WardrobeItem } from "@/state/WardrobeContext";

type Props = { onNext: () => void };

export const WardrobeGrid = ({ onNext }: Props) => {
  const { t, lang } = useLang();
  const { wardrobe } = useWardrobe();

  if (wardrobe.length === 0) return null;

  return (
    <section id="wardrobe" className="container py-20 md:py-24">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">{t.wardrobe.title}</h2>
        <p className="mt-3 text-lg text-muted-foreground">
          {t.wardrobe.subtitle.replace("{count}", String(wardrobe.length))}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {wardrobe.map((it, i) => (
          <ItemCard key={it.id} item={it} index={i} lang={lang} t={t} />
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

const ItemCard = ({
  item: it,
  index,
  lang,
  t,
}: {
  item: WardrobeItem;
  index: number;
  lang: "tr" | "en";
  t: ReturnType<typeof useLang>["t"];
}) => {
  const tags = t.wardrobe.tags;
  const material = lang === "tr" ? it.material_tr : it.material_en;
  const pattern = lang === "tr" ? it.pattern_tr : it.pattern_en;
  const fit = lang === "tr" ? it.fit_tr : it.fit_en;
  const style = lang === "tr" ? it.style_tr : it.style_en;
  const details = lang === "tr" ? it.details_tr : it.details_en;
  const season = lang === "tr" ? it.season_tr : it.season_en;
  const hasBrand = it.brand_guess && it.brand_guess.toLowerCase() !== "unknown" && it.brand_guess !== "Bilinmiyor";
  const conf = Math.round((it.confidence ?? 0.8) * 100);

  return (
    <div
      className="group rounded-3xl border border-border bg-card p-5 shadow-card transition-bounce hover:-translate-y-1 hover:shadow-pop animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="mb-4 flex items-start gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-soft"
          style={{ backgroundColor: it.color_hex }}
        >
          <span className="drop-shadow">{it.emoji}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-bold leading-tight truncate">
            {lang === "tr" ? it.type_tr : it.type_en}
          </div>
          <div className="text-sm text-muted-foreground truncate">
            {lang === "tr" ? it.color_tr : it.color_en}
            {hasBrand && <> · <span className="font-semibold text-foreground">{it.brand_guess}</span></>}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <BadgeCheck className="h-3 w-3 text-primary" />
            <span>{t.wardrobe.confidence}: {conf}%</span>
          </div>
        </div>
      </div>

      {details && (
        <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
          {details}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {material && <Tag label={tags.material} value={material} />}
        {pattern && <Tag label={tags.pattern} value={pattern} />}
        {fit && fit !== "Yok" && fit !== "N/A" && <Tag label={tags.fit} value={fit} />}
        {style && <Tag label={tags.style} value={style} />}
        <Tag label={tags.weight} value={weightLabel(it.weight, lang)} />
        <Tag label={tags.season} value={season} />
      </div>
    </div>
  );
};

const weightLabel = (w: "light" | "medium" | "heavy", lang: "tr" | "en") => {
  const map = {
    light: { tr: "İnce", en: "Light" },
    medium: { tr: "Orta", en: "Medium" },
    heavy: { tr: "Kalın", en: "Heavy" },
  };
  return map[w][lang];
};

const Tag = ({ label, value }: { label: string; value: string }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
    <span className="opacity-60">{label}:</span>
    <span className="text-foreground">{value}</span>
  </span>
);
