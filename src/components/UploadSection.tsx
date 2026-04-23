import { useState, useRef } from "react";
import { Camera, Video, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";

type Props = {
  onAnalyzed: () => void;
};

export const UploadSection = ({ onAnalyzed }: Props) => {
  const { t } = useLang();
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles(Array.from(list));
  };

  const handleAnalyze = () => {
    setAnalyzing(true);
    // Mock analyze delay
    setTimeout(() => {
      setAnalyzing(false);
      onAnalyzed();
    }, 2200);
  };

  return (
    <section id="upload" className="container py-20 md:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">{t.upload.title}</h2>
          <p className="mt-3 text-lg text-muted-foreground">{t.upload.subtitle}</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
          {/* Mode switcher */}
          <div className="mb-6 inline-flex rounded-full bg-muted p-1">
            <button
              onClick={() => setMode("photo")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-smooth ${
                mode === "photo" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
              }`}
            >
              <Camera className="h-4 w-4" />
              {t.upload.photo}
            </button>
            <button
              onClick={() => setMode("video")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-smooth ${
                mode === "video" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
              }`}
            >
              <Video className="h-4 w-4" />
              {t.upload.video}
            </button>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={`relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-10 text-center transition-smooth md:p-14 ${
              dragActive
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border bg-muted/30 hover:border-primary/60 hover:bg-primary/5"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              hidden
              multiple={mode === "photo"}
              accept={mode === "photo" ? "image/*" : "video/*"}
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-coral shadow-glow">
              <Upload className="h-8 w-8 text-primary-foreground" />
            </div>
            <p className="text-lg font-semibold">{t.upload.drop}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.upload.hint}</p>

            {files.length > 0 && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
                ✓ {files.length} {mode === "photo" ? "📷" : "🎥"}
              </div>
            )}
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={files.length === 0 || analyzing}
            size="lg"
            className="mt-6 h-14 w-full rounded-full bg-gradient-coral text-base font-semibold shadow-glow transition-bounce hover:scale-[1.02] hover:shadow-pop disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t.upload.analyzing}
              </>
            ) : (
              t.upload.analyze
            )}
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">{t.mock}</p>
        </div>
      </div>
    </section>
  );
};
