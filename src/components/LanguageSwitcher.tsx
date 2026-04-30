import { useLang } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Languages, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANG_LABELS: Record<string, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  es: "Español",
};

export const LanguageSwitcher = () => {
  const { lang, setLang } = useLang();
  const languages = ["tr", "en", "de", "es"] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-full px-3 text-xs font-semibold uppercase shadow-soft"
          aria-label="Language"
        >
          <Languages className="mr-1.5 h-4 w-4 text-muted-foreground" />
          {lang}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem] rounded-2xl">
        {languages.map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLang(code)}
            className="cursor-pointer rounded-xl"
          >
            <span className="mr-2 text-[10px] font-bold uppercase opacity-60 w-6">{code}</span>
            <span className="flex-1">{LANG_LABELS[code]}</span>
            {lang === code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
