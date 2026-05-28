import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  Sun, Cloud, CloudRain, Snowflake, Flame, CloudSnow, CloudDrizzle, CloudFog,
  Loader2, Sparkles, MapPin, AlertCircle, Send, RefreshCw, Mic, MicOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/i18n/LanguageProvider";
import { useWardrobe } from "@/state/WardrobeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Weather = "sunny" | "cloudy" | "rainy" | "cold" | "hot";

export type SuggestPanelHandle = { regenerate: () => Promise<void> };

type Props = { onResult: () => void };


type WeatherData = {
  key: Weather;
  temp: number;
  city: string;
  condition: string;
  conditionTr: string;
  icon: typeof Sun;
};

type ChatMsg = { role: "user" | "assistant"; content: string };

const weatherFromCode = (code: number, temp: number) => {
  if ([95, 96, 99].includes(code)) return { key: "rainy" as Weather, condition: "Thunderstorm", conditionTr: "Gök gürültülü", icon: CloudRain };
  if ([61, 63, 65, 80, 81, 82].includes(code)) return { key: "rainy" as Weather, condition: "Rainy", conditionTr: "Yağmurlu", icon: CloudRain };
  if ([51, 53, 55].includes(code)) return { key: "rainy" as Weather, condition: "Drizzle", conditionTr: "Çiseliyor", icon: CloudDrizzle };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { key: "cold" as Weather, condition: "Snowy", conditionTr: "Karlı", icon: CloudSnow };
  if ([45, 48].includes(code)) return { key: "cloudy" as Weather, condition: "Foggy", conditionTr: "Sisli", icon: CloudFog };
  if (temp <= 5) return { key: "cold" as Weather, condition: "Cold", conditionTr: "Soğuk", icon: Snowflake };
  if (temp >= 28) return { key: "hot" as Weather, condition: "Hot", conditionTr: "Sıcak", icon: Flame };
  if ([0, 1].includes(code)) return { key: "sunny" as Weather, condition: "Sunny", conditionTr: "Güneşli", icon: Sun };
  return { key: "cloudy" as Weather, condition: "Cloudy", conditionTr: "Bulutlu", icon: Cloud };
};

type WeatherStatus = "idle" | "prompting" | "loading" | "ready" | "denied" | "error";

export const SuggestPanel = ({ onResult }: Props) => {
  const { t, lang } = useLang();
  const { wardrobe, setOutfit, outfit, savedOutfits } = useWardrobe();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>("idle");
  const [manualWeather, setManualWeather] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([{ role: "assistant", content: t.suggest.chatGreeting }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Speech-to-text (Web Speech API)
  const recognitionRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const baseInputRef = useRef("");

  useEffect(() => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) setSpeechSupported(true);
  }, []);

  const langToBCP47 = (l: string) =>
    l === "tr" ? "tr-TR" : l === "de" ? "de-DE" : l === "es" ? "es-ES" : "en-US";

  const stopListening = () => {
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    setListening(false);
  };

  const toggleListening = () => {
    if (listening) { stopListening(); return; }
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error(lang === "tr" ? "Tarayıcın sesli girişi desteklemiyor" : "Your browser doesn't support voice input");
      return;
    }
    const rec = new SR();
    rec.lang = langToBCP47(lang);
    rec.continuous = true;
    rec.interimResults = true;
    baseInputRef.current = input ? input.trim() + " " : "";
    rec.onresult = (e: any) => {
      let finalText = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += transcript;
        else interim += transcript;
      }
      if (finalText) baseInputRef.current += finalText;
      setInput((baseInputRef.current + interim).replace(/\s+/g, " ").trimStart());
    };
    rec.onerror = (e: any) => {
      console.error("speech error", e);
      setListening(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        toast.error(lang === "tr" ? "Mikrofon izni gerekli" : "Microphone permission required");
      }
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch (err) {
      console.error(err);
      setListening(false);
    }
  };

  useEffect(() => () => { try { recognitionRef.current?.stop(); } catch { /* noop */ } }, []);

  // Reset greeting on language switch (only if chat is fresh)
  useEffect(() => {
    setMessages((prev) => (prev.length === 1 && prev[0].role === "assistant" ? [{ role: "assistant", content: t.suggest.chatGreeting }] : prev));
  }, [lang, t.suggest.chatGreeting]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const requestWeather = () => {
    if (!navigator.geolocation) {
      setWeatherStatus("error");
      return;
    }
    setWeatherStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const [wxRes, geoRes] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weather_code`),
            fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${coords.latitude}&longitude=${coords.longitude}&language=${lang}`).catch(() => null),
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

  useEffect(() => {
    if (weatherStatus === "idle") setWeatherStatus("prompting");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const composeOutfit = async (purposeKey: string, purposeSummary: string, formality: string) => {
    if (wardrobe.length < 2) {
      toast.error(lang === "tr" ? "Önce dolabını yükle" : "Upload your wardrobe first");
      return;
    }
    setGenerating(true);
    try {
      const compact = wardrobe.map((w) => ({
        id: w.id, category: w.category, type: w.type_en, color: w.color_en,
        material: w.material_en, pattern: w.pattern_en, fit: w.fit_en,
        style: w.style_en, weight: w.weight, season: w.season_en,
      }));
      const currentIds = outfit?.items.map((i) => i.id) ?? [];
      const savedCombinations = savedOutfits.slice(0, 10).map((s) => ({
        date: s.worn_on || s.created_at,
        item_ids: s.outfit.items.map((i) => i.id),
      }));

      const { data, error } = await supabase.functions.invoke("suggest-outfit", {
        body: {
          wardrobe: compact, purpose: purposeKey, purposeSummary, formality,
          weather: weather?.key ?? "cloudy", temperature: weather?.temp,
          weatherNote: manualWeather, lang, avoidIds: currentIds, savedCombinations,
        },
      });
      if (error) {
        toast.error(error.message || (lang === "tr" ? "Öneri başarısız" : "Suggestion failed"));
        return;
      }
      const items = (data?.item_ids || []).map((id: string) => wardrobe.find((w) => w.id === id)).filter(Boolean);
      if (items.length === 0) {
        toast.error(lang === "tr" ? "Uygun kombin bulunamadı" : "No outfit found");
        return;
      }
      setOutfit({ items, rationale_en: data.rationale_en, rationale_tr: data.rationale_tr, confidence: data.confidence ?? 0.8 });
      onResult();
    } catch (e) {
      console.error(e);
      toast.error(lang === "tr" ? "Bir şeyler ters gitti" : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || thinking || generating) return;
    if (listening) stopListening();
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    baseInputRef.current = "";
    setThinking(true);
    try {
      const weatherCtx = weather
        ? { condition: lang === "tr" ? weather.conditionTr : weather.condition, temp: weather.temp, city: weather.city }
        : (manualWeather ? { condition: manualWeather } : null);

      // Build a compact wardrobe summary grouped by category so the AI knows what the user owns
      const byCat: Record<string, { type: string; color: string }[]> = {};
      for (const w of wardrobe) {
        const cat = (w.category || "other").toLowerCase();
        (byCat[cat] ||= []).push({ type: w.type_en || "", color: w.color_en || "" });
      }
      const wardrobeSummary = Object.entries(byCat)
        .map(([cat, items]) => {
          const sample = items.slice(0, 8).map((i) => `${i.color} ${i.type}`.trim()).filter(Boolean).join(", ");
          return `- ${cat} (${items.length}): ${sample}`;
        })
        .join("\n");

      const { data, error } = await supabase.functions.invoke("chat-stylist", {
        body: { messages: next, lang, weather: weatherCtx, wardrobeSummary },
      });
      if (error) throw error;
      const reply = data?.reply || "";
      if (reply) setMessages((m) => [...m, { role: "assistant", content: reply }]);
      if (data?.ready) {
        await composeOutfit(data.ready.purpose_key, data.ready.purpose_summary, data.ready.formality);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || (lang === "tr" ? "Mesaj gönderilemedi" : "Couldn't send message"));
    } finally {
      setThinking(false);
    }
  };

  const resetChat = () => {
    setMessages([{ role: "assistant", content: t.suggest.chatGreeting }]);
    setInput("");
  };

  return (
    <section id="suggest" className="container py-20 md:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">{t.suggest.chatTitle}</h2>
          <p className="mt-3 text-lg text-muted-foreground">{t.suggest.chatSubtitle}</p>
        </div>

        <div className="space-y-6 rounded-3xl border border-border bg-card p-5 shadow-card md:p-8">
          <WeatherCard
            status={weatherStatus} weather={weather} lang={lang} t={t}
            onRetry={requestWeather} manualWeather={manualWeather}
            onManualWeatherChange={setManualWeather}
          />

          <div ref={scrollRef} className="max-h-[420px] overflow-y-auto rounded-2xl bg-muted/20 p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-soft ${
                    m.role === "user"
                      ? "bg-gradient-coral text-primary-foreground rounded-br-md"
                      : "bg-card border border-border rounded-bl-md"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {(thinking || generating) && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {generating ? t.suggest.generating : t.suggest.chatThinking}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={t.suggest.chatPlaceholder}
              className="min-h-12 flex-1 rounded-2xl bg-background"
              disabled={thinking || generating}
            />
            <div className="flex gap-2">
              {speechSupported && (
                <Button
                  onClick={toggleListening}
                  disabled={thinking || generating}
                  variant={listening ? "default" : "outline"}
                  size="lg"
                  className={`h-12 rounded-full ${listening ? "bg-gradient-coral text-primary-foreground animate-pulse" : ""}`}
                  title={listening
                    ? (lang === "tr" ? "Dinlemeyi durdur" : "Stop listening")
                    : (lang === "tr" ? "Sesli anlat" : "Speak")}
                >
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || thinking || generating}
                size="lg"
                className="h-12 rounded-full bg-gradient-coral px-6 shadow-glow"
              >
                <Send className="mr-1.5 h-4 w-4" />
                {t.suggest.chatSend}
              </Button>
              <Button onClick={resetChat} variant="outline" size="lg" className="h-12 rounded-full" title={t.suggest.chatReset}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const WeatherCard = ({
  status, weather, lang, t, onRetry, manualWeather, onManualWeatherChange,
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-5 text-primary-foreground shadow-pop">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="font-display text-2xl font-bold leading-none">{Math.round(weather.temp)}°</div>
              <div className="mt-1 text-xs font-medium opacity-90">{condition}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-xs font-medium opacity-90">
              <MapPin className="h-3.5 w-3.5" />
              <span>{weather.city || (lang === "tr" ? "Konumun" : "Your location")}</span>
            </div>
            <button onClick={onRetry} className="mt-1 text-[11px] underline-offset-2 hover:underline opacity-80">
              {lang === "tr" ? "Yenile" : "Refresh"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-4">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">{t.suggest.weatherLoading}</span>
      </div>
    );
  }

  if (status === "prompting" || status === "idle") {
    return (
      <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">{t.suggest.weatherAsk}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">{t.suggest.weatherAskDesc}</p>
            <Button onClick={onRetry} size="sm" className="mt-2 rounded-full bg-gradient-coral">
              <MapPin className="mr-1.5 h-4 w-4" />
              {t.suggest.weatherAllow}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // denied or error → manual entry
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-muted/20 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground">
            {status === "denied" ? t.suggest.weatherDenied : t.suggest.weatherError}
          </div>
          <Textarea
            value={manualWeather}
            onChange={(e) => onManualWeatherChange(e.target.value)}
            placeholder={t.suggest.weatherManualPlaceholder}
            className="mt-2 min-h-16 rounded-2xl bg-background text-sm"
          />
          <Button onClick={onRetry} variant="outline" size="sm" className="mt-2 rounded-full">
            <MapPin className="mr-1.5 h-4 w-4" />
            {t.suggest.weatherRetry}
          </Button>
        </div>
      </div>
    </div>
  );
};
