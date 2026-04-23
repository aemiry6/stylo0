import { useState, useRef } from "react";
import { Camera, Video, Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import { useWardrobe, WardrobeItem } from "@/state/WardrobeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  onAnalyzed: () => void;
};

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Downscale to keep payload small (max 1024px on long side, ~JPEG 0.85)
const compress = async (file: File): Promise<string> => {
  if (!file.type.startsWith("image/")) return fileToDataUrl(file);
  const url = await fileToDataUrl(file);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const max = 1024;
      let { width, height } = img;
      if (width > max || height > max) {
        const ratio = Math.min(max / width, max / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
};

export const UploadSection = ({ onAnalyzed }: Props) => {
  const { t } = useLang();
  const { setWardrobe } = useWardrobe();
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).slice(0, 8);
    setFiles(arr);
    const previews = await Promise.all(
      arr.filter((f) => f.type.startsWith("image/")).map((f) => fileToDataUrl(f)),
    );
    setPreviews(previews);
  };

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setAnalyzing(true);
    try {
      const images = await Promise.all(
        files.filter((f) => f.type.startsWith("image/")).map((f) => compress(f)),
      );
      if (images.length === 0) {
        toast.error("Lütfen en az bir fotoğraf yükle / Please upload at least one image");
        setAnalyzing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("analyze-wardrobe", {
        body: { images },
      });

      if (error) {
        console.error(error);
        toast.error(error.message || "Analiz başarısız / Analysis failed");
        setAnalyzing(false);
        return;
      }
      const items: WardrobeItem[] = (data?.items || []).map((it: any, i: number) => ({
        ...it,
        id: `w-${Date.now()}-${i}`,
      }));
      if (items.length === 0) {
        toast.error("Kıyafet algılanmadı, daha net bir foto dener misin? / No clothes detected — try a clearer photo.");
        setAnalyzing(false);
        return;
      }
      setWardrobe(items);
      onAnalyzed();
    } catch (e) {
      console.error(e);
      toast.error("Bir şeyler ters gitti / Something went wrong");
    } finally {
      setAnalyzing(false);
    }
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
              disabled
              title="Coming soon"
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-smooth opacity-50 cursor-not-allowed text-muted-foreground`}
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
              multiple
              accept="image/*"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-coral shadow-glow">
              <Upload className="h-8 w-8 text-primary-foreground" />
            </div>
            <p className="text-lg font-semibold">{t.upload.drop}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.upload.hint}</p>
          </div>

          {previews.length > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {previews.map((src, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-border">
                  <img src={src} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-soft transition-smooth group-hover:opacity-100"
                    aria-label="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

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

          <p className="mt-4 text-center text-xs text-muted-foreground">
            ✨ Powered by Lovable AI · Gemini Vision
          </p>
        </div>
      </div>
    </section>
  );
};
