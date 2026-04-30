import { useState, useRef } from "react";
import { Upload, Loader2, X, AlertTriangle, Image as ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import { useWardrobe, WardrobeItem } from "@/state/WardrobeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  onAnalyzed: () => void;
  append?: boolean;
  compact?: boolean;
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

// Capture N evenly spaced frames from a video file as JPEG data URLs.
const extractVideoFrames = async (file: File, count = 6): Promise<string[]> => {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("video load failed"));
  });
  const duration = isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
  const max = 1024;
  let { videoWidth: width, videoHeight: height } = video;
  if (width > max || height > max) {
    const ratio = Math.min(max / width, max / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const frames: string[] = [];
  const n = duration > 0 ? count : 1;
  for (let i = 0; i < n; i++) {
    const t = duration > 0 ? (duration * (i + 0.5)) / n : 0;
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
      try { video.currentTime = Math.min(t, Math.max(0, duration - 0.05)); } catch { resolve(); }
    });
    ctx.drawImage(video, 0, 0, width, height);
    frames.push(canvas.toDataURL("image/jpeg", 0.82));
  }
  URL.revokeObjectURL(url);
  return frames;
};

export const UploadSection = ({ onAnalyzed, append = false, compact = false }: Props) => {
  const { t } = useLang();
  const { setWardrobe, addItems } = useWardrobe();
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [unsureNotice, setUnsureNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const want = mode === "photo" ? "image/" : "video/";
    const incoming = Array.from(list).filter((f) => f.type.startsWith(want));
    if (incoming.length === 0) {
      toast.error(
        mode === "photo"
          ? "Lütfen fotoğraf seç / Please pick photos"
          : "Lütfen bir video seç / Please pick a video",
      );
      return;
    }
    // For video mode keep only the most recent one
    const merged = mode === "video" ? [incoming[0]] : [...files, ...incoming].slice(0, 12);
    setFiles(merged);
    const newPreviews = await Promise.all(
      merged.map((f) => (f.type.startsWith("image/") ? fileToDataUrl(f) : Promise.resolve(URL.createObjectURL(f)))),
    );
    setPreviews(newPreviews);
    setUnsureNotice(null);
  };

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setAnalyzing(true);
    try {
      let images: string[] = [];
      if (mode === "video") {
        const videoFile = files.find((f) => f.type.startsWith("video/"));
        if (videoFile) {
          try {
            images = await extractVideoFrames(videoFile, 6);
          } catch (err) {
            console.error(err);
            toast.error("Video okunamadı / Could not read video");
            setAnalyzing(false);
            return;
          }
        }
      } else {
        images = await Promise.all(
          files.filter((f) => f.type.startsWith("image/")).map((f) => compress(f)),
        );
      }
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
        const msg = "Hiçbir kıyafet net algılanmadı. Daha net bir fotoğraf çeker misin? / No clothes were clearly detected — please retake with a clearer photo.";
        setUnsureNotice(msg);
        toast.error(msg);
        setAnalyzing(false);
        return;
      }
      const lowCount = items.filter((it: any) => (it.confidence ?? 1) < 0.55).length;
      if (lowCount / items.length > 0.5) {
        setUnsureNotice(
          "Bazı parçalardan emin değiliz. Daha net fotoğraflarla tekrar denersen tanıma kalitesi artar. / Some pieces are uncertain — try retaking those with clearer photos.",
        );
      }
      if (append) addItems(items);
      else setWardrobe(items);
      window.localStorage.removeItem("stylo-new-user");
      onAnalyzed();
    } catch (e) {
      console.error(e);
      toast.error("Bir şeyler ters gitti / Something went wrong");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <section id="upload" className={compact ? "py-0" : "container py-20 md:py-24"}>
      <div className="mx-auto max-w-3xl">
        {!compact && (
          <div className="mb-8 text-center">
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">{t.upload.title}</h2>
            <p className="mt-3 text-lg text-muted-foreground">{t.upload.subtitle}</p>
          </div>
        )}

        <div className={compact ? "rounded-2xl border border-border bg-muted/30 p-4" : "rounded-3xl border border-border bg-card p-6 shadow-card md:p-8"}>

          {/* Mode toggle */}
          <div className="mb-4 inline-flex rounded-full border border-border bg-muted p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode("photo");
                setFiles([]);
                setPreviews([]);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-smooth ${mode === "photo" ? "bg-background shadow-soft text-foreground" : "text-muted-foreground"}`}
            >
              <ImageIcon className="h-3.5 w-3.5" /> {t.upload.photo}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("video");
                setFiles([]);
                setPreviews([]);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-smooth ${mode === "video" ? "bg-background shadow-soft text-foreground" : "text-muted-foreground"}`}
            >
              <Video className="h-3.5 w-3.5" /> {t.upload.video}
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
              {mode === "photo" ? <Upload className="h-8 w-8 text-primary-foreground" /> : <Video className="h-8 w-8 text-primary-foreground" />}
            </div>
            <p className="text-lg font-semibold">{t.upload.drop}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.upload.hint}</p>
          </div>

          {previews.length > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {previews.map((src, i) => {
                const isVideo = files[i]?.type.startsWith("video/");
                return (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                    {isVideo ? (
                      <video src={src} className="h-full w-full object-cover" muted playsInline />
                    ) : (
                      <img src={src} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
                    )}
                    {isVideo && (
                      <span className="absolute left-1 bottom-1 inline-flex items-center gap-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-soft">
                        <Video className="h-3 w-3" /> Video
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-background/95 text-foreground shadow-soft transition-smooth opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label="Remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
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

          {unsureNotice && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-foreground">{unsureNotice}</p>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            ✨ Powered by Lovable AI · Gemini Vision
          </p>
        </div>
      </div>
    </section>
  );
};
