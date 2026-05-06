import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import type { Lang } from "@/i18n/translations";
import { ArrowRight, BadgeCheck, AlertTriangle, Pencil } from "lucide-react";
import { useWardrobe, type WardrobeItem } from "@/state/WardrobeContext";
import { ItemEditDialog } from "./ItemEditDialog";
import { UploadSection } from "./UploadSection";
import { getItemEmoji } from "@/lib/itemEmoji";

type Props = { onNext: () => void; defaultAdding?: boolean };

const LOW_CONFIDENCE = 0.7;

export const WardrobeGrid = ({ onNext, defaultAdding = false }: Props) => {
  const { t, lang } = useLang();
  const { wardrobe } = useWardrobe();
  const [editing, setEditing] = useState<WardrobeItem | null>(null);
  const [adding, setAdding] = useState(defaultAdding);

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
          <ItemCard
            key={it.id}
            item={it}
            index={i}
            lang={lang}
            t={t}
            onClick={() => setEditing(it)}
          />
        ))}
      </div>

      <div data-add-section className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-card md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-display text-2xl font-bold">{t.wardrobe.addMoreTitle}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t.wardrobe.addMoreSubtitle}</p>
          </div>
          <Button onClick={() => setAdding((v) => !v)} variant="outline" className="rounded-full font-semibold">
            {t.wardrobe.addMoreCta}
          </Button>
        </div>
        {adding && (
          <div className="mt-5 animate-fade-in">
            <UploadSection append compact onAnalyzed={() => setAdding(false)} />
          </div>
        )}
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

      <ItemEditDialog
        item={editing}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </section>
  );
};

const ItemCard = ({
  item: it,
  index,
  lang,
  t,
  onClick,
}: {
  item: WardrobeItem;
  index: number;
  lang: Lang;
  t: ReturnType<typeof useLang>["t"];
  onClick: () => void;
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
  const isLow = (it.confidence ?? 0.8) < LOW_CONFIDENCE;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full text-left rounded-3xl border bg-card p-5 shadow-card transition-bounce hover:-translate-y-1 hover:shadow-pop animate-fade-in focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        isLow ? "border-destructive/40 ring-1 ring-destructive/30" : "border-border"
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
      aria-label={`${lang === "tr" ? it.type_tr : it.type_en} — ${t.wardrobe.edit.title}`}
    >
      <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground opacity-0 shadow-soft transition-smooth group-hover:opacity-100">
        <Pencil className="h-3.5 w-3.5" />
      </span>

      <div className="mb-4 flex items-start gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-soft ring-1 ring-border/50"
          style={{ backgroundColor: it.color_hex }}
          aria-hidden
        >
          <CategoryIcon category={it.category} type={`${it.type_en} ${it.type_tr}`} hex={it.color_hex} />
        </div>
        <div className="min-w-0 flex-1 pr-8">
          <div className="font-display text-lg font-bold leading-tight truncate">
            {lang === "tr" ? it.type_tr : it.type_en}
          </div>
          <div className="text-sm text-muted-foreground truncate">
            {lang === "tr" ? it.color_tr : it.color_en}
            {hasBrand && <> · <span className="font-semibold text-foreground">{it.brand_guess}</span></>}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
            {isLow ? (
              <>
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span className="font-semibold text-destructive">{conf}%</span>
                <span className="text-muted-foreground">· {t.wardrobe.confidence}</span>
              </>
            ) : (
              <>
                <BadgeCheck className="h-3 w-3 text-primary" />
                <span className="text-muted-foreground">{t.wardrobe.confidence}: {conf}%</span>
              </>
            )}
          </div>
        </div>
      </div>

      {isLow && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-2.5 text-xs">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
          <div>
            <div className="font-semibold text-destructive">{t.wardrobe.lowConfidence}</div>
            <div className="mt-0.5 text-muted-foreground">{t.wardrobe.lowConfidenceHint}</div>
          </div>
        </div>
      )}

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
    </button>
  );
};

const weightLabel = (w: "light" | "medium" | "heavy", lang: Lang) => {
  const map = {
    light: { tr: "İnce", en: "Light", de: "Leicht", es: "Ligera" },
    medium: { tr: "Orta", en: "Medium", de: "Mittel", es: "Media" },
    heavy: { tr: "Kalın", en: "Heavy", de: "Schwer", es: "Gruesa" },
  };
  return map[w][lang];
};

const Tag = ({ label, value }: { label: string; value: string }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
    <span className="opacity-60">{label}:</span>
    <span className="text-foreground">{value}</span>
  </span>
);

// Contrast-aware icon picked from category + free-text type so a hat doesn't
// show a watch and a bag doesn't show a shirt.
const PantsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M5 3h14l-1 6-1 12h-4l-1-9-1 9H7L6 9 5 3Z" />
    <path d="M5 3h14" />
  </svg>
);
const ShortsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M5 4h14l-1 6-1 7h-4l-1-6-1 6H7l-1-7-1-6Z" />
    <path d="M5 4h14" />
  </svg>
);
const DressIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M9 3h6l1 4-2 2 4 13H6l4-13-2-2 1-4Z" />
  </svg>
);

const CategoryIcon = ({ category, type, hex }: { category: string; type?: string; hex?: string }) => {
  const isLight = isLightColor(hex);
  const cls = `h-7 w-7 ${isLight ? "text-black/70" : "text-white/90"}`;
  const t = (type || "").toLowerCase();

  // Subtype matches first — these win over the broad category bucket.
  if (/(hat|cap|beanie|şapka|sapka|bere|kasket)/.test(t)) return <Crown className={cls} />;
  if (/(glass|sunglass|gözlük|gozluk)/.test(t)) return <Glasses className={cls} />;
  if (/(bag|backpack|tote|purse|clutch|çanta|canta|sırt|sirt)/.test(t)) return <ShoppingBag className={cls} />;
  if (/(watch|saat|bracelet|necklace|ring|earring|takı|taki|kolye|yüzük|yuzuk|bileklik|küpe|kupe)/.test(t)) return <Watch className={cls} />;
  if (/(short|şort|sort|bermuda)/.test(t)) return <ShortsIcon className={cls} />;
  if (/(pant|trouser|jean|chino|legging|pantolon|kot|eşofman|esofman)/.test(t)) return <PantsIcon className={cls} />;
  if (/(skirt|etek)/.test(t)) return <DressIcon className={cls} />;
  if (/(dress|elbise|tulum|jumpsuit)/.test(t)) return <DressIcon className={cls} />;
  if (/(shoe|sneaker|boot|sandal|heel|loafer|ayakkabı|ayakkabi|bot|sandalet|topuk)/.test(t))
    return <Footprints className={cls} />;

  switch (category) {
    case "shoes":
      return <Footprints className={cls} />;
    case "accessory":
      return <Watch className={cls} />;
    case "bottom":
      return <PantsIcon className={cls} />;
    case "dress":
      return <DressIcon className={cls} />;
    case "outer":
    case "top":
    case "underwear":
    default:
      return <Shirt className={cls} />;
  }
};

const isLightColor = (hex?: string) => {
  if (!hex) return false;
  const m = hex.replace("#", "");
  if (m.length !== 6) return false;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  // Perceived luminance
  return (r * 0.299 + g * 0.587 + b * 0.114) > 170;
};
