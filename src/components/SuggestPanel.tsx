import { useState } from "react";
import { Briefcase, Heart, Coffee, Dumbbell, PartyPopper, Plane, Sun, Cloud, CloudRain, Snowflake, Flame, Loader2, Sparkles, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import { useWardrobe } from "@/state/WardrobeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Purpose = "work" | "date" | "casual" | "sport" | "party" | "travel";
type Weather = "sunny" | "cloudy" | "rainy" | "cold" | "hot";

type Props = { onResult: () => void };

const weatherCodeToKey = (code: number, temp: number): { key: Weather; temp: string } => {
  // WMO weather codes (Open-Meteo)
  const tempStr = `${Math.round(temp)}°`;
  if ([95, 96, 99, 51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { key: "rainy", temp: tempStr };
  if ([71, 73, 75, 77, 85, 86].includes(code) || temp <= 5) return { key: "cold", temp: tempStr };
  if (temp >= 28) return { key: "hot", temp: tempStr };
  if ([0, 1].includes(code)) return { key: "sunny", temp: tempStr };
  return { key: "cloudy", temp: tempStr };
};

export const SuggestPanel = ({ onResult }: Props) => {
  const { t, lang } = useLang();
  const { wardrobe, setOutfit, outfit } = useWardrobe();
  const [purpose, setPurpose] = useState<Purpose>("casual");
  const [weather, setWeather] = useState<Weather>("cloudy");
  const [temp, setTemp] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [city, setCity] = useState<string>("");

  const purposes: { key: Purpose; icon: typeof Briefcase; gradient: string }[] = [
    { key: "work", icon: Briefcase, gradient: "bg-gradient-lavender" },
    { key: "date", icon: Heart, gradient: "bg-gradient-coral" },
    { key: "casual", icon: Coffee, gradient: "bg-gradient-sunshine" },
    { key: "sport", icon: Dumbbell, gradient: "bg-gradient-mint" },
    { key: "party", icon: PartyPopper, gradient: "bg-gradient-hero" },
    { key: "travel", icon: Plane, gradient: "bg-gradient-mint" },
  ];

  const weathers: { key: Weather; icon: typeof Sun; defaultTemp: string }[] = [
    { key: "sunny", icon: Sun, defaultTemp: "26°" },
    { key: "cloudy", icon: Cloud, defaultTemp: "19°" },
    { key: "rainy", icon: CloudRain, defaultTemp: "14°" },
    { key: "cold", icon: Snowflake, defaultTemp: "4°" },
    { key: "hot", icon: Flame, defaultTemp: "32°" },
  ];

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error(lang === "tr" ? "Tarayıcı konum desteklemiyor" : "Geolocation not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weather_code`,
          );
          const data = await res.json();
          const t2 = data?.current?.temperature_2m;
          const code = data?.current?.weather_code;
          if (typeof t2 === "number" && typeof code === "number") {
            const { key } = weatherCodeToKey(code, t2);
            setWeather(key);
            setTemp(t2);
            // Reverse geocode (best-effort)
            try {
              const geo = await fetch(
                `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${coords.latitude}&longitude=${coords.longitude}&language=${lang}`,
              );
              const gd = await geo.json();
              const name = gd?.results?.[0]?.name;
              if (name) setCity(name);
            } catch { /* ignore */ }
            toast.success(lang === "tr" ? `Hava güncellendi: ${Math.round(t2)}°` : `Weather updated: ${Math.round(t2)}°`);
          }
        } catch (e) {
          toast.error(lang === "tr" ? "Hava bilgisi alınamadı" : "Couldn't fetch weather");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast.error(lang === "tr" ? "Konum izni reddedildi" : "Location permission denied");
      },
      { timeout: 10000 },
    );
  };

  const handleGenerate = async () => {
    if (wardrobe.length < 2) {
      toast.error(lang === "tr" ? "Önce dolabını yükle" : "Upload your wardrobe first");
      return;
    }
    setLoading(true);
    try {
      // Pass a stripped wardrobe to AI to keep payload small
      const compact = wardrobe.map((w) => ({
        id: w.id,
        category: w.category,
        type: w.type_en,
        color: w.color_en,
        texture: w.texture_en,
        weight: w.weight,
        season: w.season_en,
      }));

      const avoidIds = outfit?.items.map((i) => i.id) ?? [];

      const { data, error } = await supabase.functions.invoke("suggest-outfit", {
        body: {
          wardrobe: compact,
          purpose,
          weather,
          temperature: temp,
          lang,
          avoidIds,
        },
      });

      if (error) {
        console.error(error);
        toast.error(error.message || (lang === "tr" ? "Öneri başarısız" : "Suggestion failed"));
        setLoading(false);
        return;
      }

      const items = (data?.item_ids || [])
        .map((id: string) => wardrobe.find((w) => w.id === id))
        .filter(Boolean);
      if (items.length === 0) {
        toast.error(lang === "tr" ? "Uygun kombin bulunamadı" : "No outfit found");
        setLoading(false);
        return;
      }

      setOutfit({
        items,
        rationale_en: data.rationale_en,
        rationale_tr: data.rationale_tr,
        confidence: data.confidence ?? 0.8,
      });
      onResult();
    } catch (e) {
      console.error(e);
      toast.error(lang === "tr" ? "Bir şeyler ters gitti" : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="suggest" className="container py-20 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">{t.suggest.title}</h2>
          <p className="mt-3 text-lg text-muted-foreground">{t.suggest.subtitle}</p>
        </div>

        <div className="space-y-8 rounded-3xl border border-border bg-card p-6 shadow-card md:p-10">
          {/* Purpose */}
          <div>
            <h3 className="mb-4 font-display text-xl font-bold">{t.suggest.purpose}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {purposes.map(({ key, icon: Icon, gradient }) => {
                const active = purpose === key;
                return (
                  <button
                    key={key}
                    onClick={() => setPurpose(key)}
                    className={`group flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-bounce ${
                      active
                        ? "border-primary bg-primary/5 shadow-pop -translate-y-0.5"
                        : "border-border bg-card hover:border-primary/40 hover:-translate-y-0.5"
                    }`}
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${gradient} shadow-soft`}>
                      <Icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="text-sm font-semibold">{t.suggest.purposes[key]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weather */}
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-xl font-bold">{t.suggest.weather}</h3>
              <Button
                onClick={detectLocation}
                disabled={locating}
                size="sm"
                variant="outline"
                className="rounded-full"
              >
                {locating ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="mr-1.5 h-4 w-4" />
                )}
                {lang === "tr" ? "Konumumdan al" : "Use my location"}
                {city && <span className="ml-1.5 text-muted-foreground">· {city}</span>}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {weathers.map(({ key, icon: Icon, defaultTemp }) => {
                const active = weather === key;
                const showTemp = active && temp !== undefined ? `${Math.round(temp)}°` : defaultTemp;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setWeather(key);
                      setTemp(undefined);
                    }}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-4 transition-bounce ${
                      active
                        ? "border-primary bg-primary/5 shadow-pop -translate-y-0.5"
                        : "border-border bg-muted/30 hover:border-primary/40 hover:-translate-y-0.5"
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="text-xs font-semibold">{t.weather[key]}</div>
                    <div className="text-xs text-muted-foreground">{showTemp}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            size="lg"
            className="h-14 w-full rounded-full bg-gradient-coral text-base font-semibold shadow-glow transition-bounce hover:scale-[1.01] hover:shadow-pop"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t.suggest.generating}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                {t.suggest.generate}
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
};
