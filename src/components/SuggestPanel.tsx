import { useEffect, useState } from "react";
import {
  Briefcase, Heart, Coffee, Dumbbell, PartyPopper, Plane,
  Sun, Cloud, CloudRain, Snowflake, Flame, CloudSnow, CloudDrizzle, CloudFog,
  Loader2, Sparkles, MapPin, AlertCircle, GraduationCap, Camera, ShoppingBag,
  Utensils, Home, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/i18n/LanguageProvider";
import { useWardrobe } from "@/state/WardrobeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Purpose = "work" | "date" | "casual" | "sport" | "party" | "travel" | "school" | "event" | "shopping" | "dinner" | "home" | "friends";
type Weather = "sunny" | "cloudy" | "rainy" | "cold" | "hot";

type Props = { onResult: () => void };

type WeatherData = {
  key: Weather;
  temp: number;
  city: string;
  condition: string;
  conditionTr: string;
  icon: typeof Sun;
};

const weatherFromCode = (code: number, temp: number): { key: Weather; condition: string; conditionTr: string; icon: typeof Sun } => {
  // WMO weather codes (Open-Meteo)
  if ([95, 96, 99].includes(code)) return { key: "rainy", condition: "Thunderstorm", conditionTr: "Gök gürültülü", icon: CloudRain };
  if ([61, 63, 65, 80, 81, 82].includes(code)) return { key: "rainy", condition: "Rainy", conditionTr: "Yağmurlu", icon: CloudRain };
  if ([51, 53, 55].includes(code)) return { key: "rainy", condition: "Drizzle", conditionTr: "Çiseliyor", icon: CloudDrizzle };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { key: "cold", condition: "Snowy", conditionTr: "Karlı", icon: CloudSnow };
  if ([45, 48].includes(code)) return { key: "cloudy", condition: "Foggy", conditionTr: "Sisli", icon: CloudFog };
  if (temp <= 5) return { key: "cold", condition: "Cold", conditionTr: "Soğuk", icon: Snowflake };
  if (temp >= 28) return { key: "hot", condition: "Hot", conditionTr: "Sıcak", icon: Flame };
  if ([0, 1].includes(code)) return { key: "sunny", condition: "Sunny", conditionTr: "Güneşli", icon: Sun };
  return { key: "cloudy", condition: "Cloudy", conditionTr: "Bulutlu", icon: Cloud };
};

type WeatherStatus = "idle" | "prompting" | "loading" | "ready" | "denied" | "error";

export const SuggestPanel = ({ onResult }: Props) => {
  const { t, lang } = useLang();
  const { wardrobe, setOutfit, outfit, savedOutfits } = useWardrobe();
  const [purpose, setPurpose] = useState<Purpose>("casual");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>("idle");
  const [manualWeather, setManualWeather] = useState("");
  const [loading, setLoading] = useState(false);

  const requestWeather = () => {
    if (!navigator.geolocation) {
      setWeatherStatus("error");
      toast.error(lang === "tr" ? "Tarayıcı konum desteklemiyor" : "Geolocation not supported");
      return;
    }
    setWeatherStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const [wxRes, geoRes] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weather_code`,
            ),
            fetch(
              `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${coords.latitude}&longitude=${coords.longitude}&language=${lang}`,
            ).catch(() => null),
          ]);
          const wx = await wxRes.json();
          const t2 = wx?.current?.temperature_2m;
          const code = wx?.current?.weather_code;
          if (typeof t2 !== "number" || typeof code !== "number") throw new Error("invalid weather");
          const { key, condition, conditionTr, icon } = weatherFromCode(code, t2);
          let city = "";
          try {
            const gd = geoRes ? await geoRes.json() : null;
            city = gd?.results?.[0]?.name ?? "";
          } catch { /* ignore */ }
          setWeather({ key, temp: t2, city, condition, conditionTr, icon });
          setWeatherStatus("ready");
        } catch (e) {
          console.error(e);
          setWeatherStatus("error");
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setWeatherStatus("denied");
        else setWeatherStatus("error");
      },
      { timeout: 10000, enableHighAccuracy: false },
    );
  };

  // Don't auto-request location; the user explicitly chooses (especially on mobile).
  // Status starts as "prompting" so the ask-permission card is shown.
  useEffect(() => {
    if (weatherStatus === "idle") setWeatherStatus("prompting");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const purposes: { key: Purpose; icon: typeof Briefcase; gradient: string }[] = [
    { key: "work", icon: Briefcase, gradient: "bg-gradient-lavender" },
    { key: "date", icon: Heart, gradient: "bg-gradient-coral" },
    { key: "casual", icon: Coffee, gradient: "bg-gradient-sunshine" },
    { key: "sport", icon: Dumbbell, gradient: "bg-gradient-mint" },
    { key: "party", icon: PartyPopper, gradient: "bg-gradient-hero" },
    { key: "travel", icon: Plane, gradient: "bg-gradient-mint" },
    { key: "school", icon: GraduationCap, gradient: "bg-gradient-lavender" },
    { key: "event", icon: Camera, gradient: "bg-gradient-coral" },
    { key: "shopping", icon: ShoppingBag, gradient: "bg-gradient-sunshine" },
    { key: "dinner", icon: Utensils, gradient: "bg-gradient-hero" },
    { key: "home", icon: Home, gradient: "bg-gradient-mint" },
    { key: "friends", icon: Users, gradient: "bg-gradient-lavender" },
  ];

  const handleGenerate = async () => {
    if (wardrobe.length < 2) {
      toast.error(lang === "tr" ? "Önce dolabını yükle" : "Upload your wardrobe first");
      return;
    }
    setLoading(true);
    try {
      const compact = wardrobe.map((w) => ({
        id: w.id,
        category: w.category,
        type: w.type_en,
        color: w.color_en,
        material: w.material_en,
        pattern: w.pattern_en,
        fit: w.fit_en,
        style: w.style_en,
        weight: w.weight,
        season: w.season_en,
      }));

      const currentIds = outfit?.items.map((i) => i.id) ?? [];
      const savedCombinations = savedOutfits.slice(0, 12).map((saved) => saved.outfit.items.map((item) => item.id));

      const { data, error } = await supabase.functions.invoke("suggest-outfit", {
        body: {
          wardrobe: compact,
          purpose,
          weather: weather?.key ?? "cloudy",
          temperature: weather?.temp,
          weatherNote: manualWeather,
          lang,
          avoidIds: currentIds,
          savedCombinations,
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
          {/* Weather card */}
          <WeatherCard
            status={weatherStatus}
            weather={weather}
            lang={lang}
            t={t}
            onRetry={requestWeather}
            manualWeather={manualWeather}
            onManualWeatherChange={setManualWeather}
          />

          {/* Purpose */}
          <div>
            <h3 className="mb-4 font-display text-xl font-bold">{t.suggest.purpose}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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

          <Button
            onClick={handleGenerate}
            disabled={loading || weatherStatus === "loading"}
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

const WeatherCard = ({
  status,
  weather,
  lang,
  t,
  onRetry,
  manualWeather,
  onManualWeatherChange,
}: {
  status: WeatherStatus;
  weather: WeatherData | null;
  lang: "tr" | "en" | "de" | "es";
  t: ReturnType<typeof useLang>["t"];
  onRetry: () => void;
  manualWeather: string;
  onManualWeatherChange: (value: string) => void;
}) => {
  if (status === "ready" && weather) {
    const Icon = weather.icon;
    const condition = lang === "tr" ? weather.conditionTr : weather.condition;
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 text-primary-foreground shadow-pop">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Icon className="h-9 w-9" />
            </div>
            <div>
              <div className="text-4xl font-display font-bold leading-none">
                {Math.round(weather.temp)}°
              </div>
              <div className="mt-1 text-sm font-medium opacity-90">{condition}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end text-sm font-medium opacity-90">
              <MapPin className="h-3.5 w-3.5" />
              <span>{weather.city || (lang === "tr" ? "Konumun" : "Your location")}</span>
            </div>
            <button
              onClick={onRetry}
              className="mt-2 text-xs underline-offset-2 hover:underline opacity-80 hover:opacity-100"
            >
              {lang === "tr" ? "Yenile" : "Refresh"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">{t.suggest.weatherLoading}</span>
      </div>
    );
  }

  if (status === "prompting") {
    return (
      <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-6">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1">
            <div className="font-semibold text-foreground">{t.suggest.weatherAsk}</div>
            <p className="mt-1 text-sm text-muted-foreground">{t.suggest.weatherAskDesc}</p>
            <Button onClick={onRetry} size="sm" className="mt-3 rounded-full bg-gradient-coral">
              <MapPin className="mr-1.5 h-4 w-4" />
              {t.suggest.weatherAllow}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    const canSubmit = manualWeather.trim().length > 0;
    return (
      <div className="rounded-2xl border-2 border-dashed border-destructive/40 bg-destructive/5 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="flex-1">
            <div className="font-semibold text-foreground">{t.suggest.weatherDenied}</div>
            <p className="mt-1 text-sm text-muted-foreground">{t.suggest.weatherAllowDesc}</p>
            <Textarea
              value={manualWeather}
              onChange={(e) => onManualWeatherChange(e.target.value)}
              placeholder={t.suggest.weatherManualPlaceholder}
              className="mt-4 min-h-24 rounded-2xl bg-background"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                disabled={!canSubmit}
                onClick={() => toast.success(lang === "tr" ? "Hava bilgisi alındı" : lang === "de" ? "Wetter übernommen" : lang === "es" ? "Clima registrado" : "Weather noted")}
                size="sm"
                className="rounded-full bg-gradient-coral"
              >
                <Sparkles className="mr-1.5 h-4 w-4" />
                {t.suggest.weatherSend}
              </Button>
              <Button onClick={onRetry} variant="outline" size="sm" className="rounded-full">
                <MapPin className="mr-1.5 h-4 w-4" />
                {t.suggest.weatherRetry}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // error
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="flex-1">
          <div className="font-semibold text-foreground">{t.suggest.weatherError}</div>
          <Button onClick={onRetry} variant="outline" size="sm" className="mt-3 rounded-full">
            <MapPin className="mr-1.5 h-4 w-4" />
            {t.suggest.weatherRetry}
          </Button>
        </div>
      </div>
    </div>
  );
};
