import { Camera, Wand2, Shirt } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";

export const Steps = () => {
  const { t } = useLang();
  const items = [
    { icon: Camera, ...t.steps.one, gradient: "bg-gradient-coral" },
    { icon: Wand2, ...t.steps.two, gradient: "bg-gradient-lavender" },
    { icon: Shirt, ...t.steps.three, gradient: "bg-gradient-mint" },
  ];

  return (
    <section id="how" className="container py-20 md:py-28">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">{t.steps.title}</h2>
        <p className="mt-4 text-lg text-muted-foreground">{t.steps.subtitle}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <div
              key={i}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-card transition-bounce hover:-translate-y-1 hover:shadow-pop"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-0 blur-2xl transition-smooth group-hover:opacity-40 group-hover:bg-primary" />
              <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${it.gradient} shadow-glow`}>
                <Icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="mb-2 text-sm font-bold text-muted-foreground">0{i + 1}</div>
              <h3 className="mb-2 font-display text-2xl font-bold">{it.t}</h3>
              <p className="text-base text-muted-foreground">{it.d}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
