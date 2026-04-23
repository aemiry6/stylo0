import { useState } from "react";
import { Briefcase, Heart, Coffee, Dumbbell, PartyPopper, Plane, Sun, Cloud, CloudRain, Snowflake, Flame, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";

type Purpose = "work" | "date" | "casual" | "sport" | "party" | "travel";
type Weather = "sunny" | "cloudy" | "rainy" | "cold" | "hot";

type Props = { onResult: () => void };

export const SuggestPanel = ({ onResult }: Props) => {
  const { t } = useLang();
  const [purpose, setPurpose] = useState<Purpose>("casual");
  const [weather, setWeather] = useState<Weather>("cloudy");
  const [loading, setLoading] = useState(false);

  const purposes: { key: Purpose; icon: typeof Briefcase; gradient: string }[] = [
    { key: "work", icon: Briefcase, gradient: "bg-gradient-lavender" },
    { key: "date", icon: Heart, gradient: "bg-gradient-coral" },
    { key: "casual", icon: Coffee, gradient: "bg-gradient-sunshine" },
    { key: "sport", icon: Dumbbell, gradient: "bg-gradient-mint" },
    { key: "party", icon: PartyPopper, gradient: "bg-gradient-hero" },
    { key: "travel", icon: Plane, gradient: "bg-gradient-mint" },
  ];

  const weathers: { key: Weather; icon: typeof Sun; temp: string }[] = [
    { key: "sunny", icon: Sun, temp: "26°" },
    { key: "cloudy", icon: Cloud, temp: "19°" },
    { key: "rainy", icon: CloudRain, temp: "14°" },
    { key: "cold", icon: Snowflake, temp: "4°" },
    { key: "hot", icon: Flame, temp: "32°" },
  ];

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onResult();
    }, 1800);
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
            <h3 className="mb-4 font-display text-xl font-bold">{t.suggest.weather}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {weathers.map(({ key, icon: Icon, temp }) => {
                const active = weather === key;
                return (
                  <button
                    key={key}
                    onClick={() => setWeather(key)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-4 transition-bounce ${
                      active
                        ? "border-primary bg-primary/5 shadow-pop -translate-y-0.5"
                        : "border-border bg-muted/30 hover:border-primary/40 hover:-translate-y-0.5"
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="text-xs font-semibold">{t.weather[key]}</div>
                    <div className="text-xs text-muted-foreground">{temp}</div>
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
