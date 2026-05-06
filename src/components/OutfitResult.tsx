import { useState } from "react";
import { Heart, Shuffle, RotateCcw, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import { useWardrobe } from "@/state/WardrobeContext";
import { getItemEmoji } from "@/lib/itemEmoji";
import { useAuth } from "@/state/AuthContext";
import { toast } from "sonner";

type Props = { onRestart: () => void; onShuffle: () => void };

const categoryToPartKey: Record<string, "top" | "bottom" | "shoes" | "outer" | "accessory"> = {
  top: "top",
  dress: "top",
  bottom: "bottom",
  shoes: "shoes",
  outer: "outer",
  accessory: "accessory",
  underwear: "top",
};

export const OutfitResult = ({ onRestart, onShuffle }: Props) => {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const { outfit, saveCurrentOutfit } = useWardrobe();
  const [saving, setSaving] = useState(false);

  if (!outfit) return null;

  const handleSave = async () => {
    if (!user) {
      toast.error(t.outfit.loginToSave);
      return;
    }
    setSaving(true);
    try {
      await saveCurrentOutfit();
      toast.success(t.outfit.saved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.outfit.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="result" className="container py-20 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">{t.outfit.title}</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {outfit.items.map((p, i) => {
            const partKey = categoryToPartKey[p.category] || "accessory";
            return (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card transition-bounce hover:-translate-y-2 hover:shadow-pop"
                style={{ animation: `fade-in 0.5s ease-out ${i * 80}ms both` }}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t.outfit.parts[partKey]}
                </div>
                <div
                  className="mt-4 mb-4 flex h-32 w-full items-center justify-center rounded-2xl text-6xl shadow-soft"
                  style={{ backgroundColor: p.color_hex }}
                >
                  <span className="drop-shadow">{p.emoji}</span>
                </div>
                <div className="font-display text-lg font-bold">
                  {lang === "tr" ? p.type_tr : p.type_en}
                </div>
                <div className="text-sm text-muted-foreground">
                  {lang === "tr" ? p.color_tr : p.color_en}
                </div>
              </div>
            );
          })}
        </div>

        {/* Why */}
        <div className="mt-8 rounded-3xl border border-border bg-gradient-soft p-6 shadow-card md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-lavender shadow-glow">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold">{t.outfit.why}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {lang === "tr" ? outfit.rationale_tr : outfit.rationale_en}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={handleSave} disabled={saving} size="lg" className="h-13 rounded-full bg-gradient-coral px-7 font-semibold shadow-glow transition-bounce hover:scale-105 hover:shadow-pop">
            {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Heart className="mr-2 h-5 w-5 fill-current" />}
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
