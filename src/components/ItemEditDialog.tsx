import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import { useWardrobe, type WardrobeItem } from "@/state/WardrobeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  item: WardrobeItem | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
};

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const compress = async (file: File): Promise<string> => {
  if (!file.type.startsWith("image/")) return fileToDataUrl(file);
  const url = await fileToDataUrl(file);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const max = 1024;
      let { width, height } = img;
      if (width > max || height > max) {
        const r = Math.min(max / width, max / height);
        width = Math.round(width * r);
        height = Math.round(height * r);
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

export const ItemEditDialog = ({ item, open, onOpenChange }: Props) => {
  const { t, lang } = useLang();
  const { removeItem, replaceItem } = useWardrobe();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!item) return null;
  const tx = t.wardrobe.edit;

  const handleRemove = () => {
    removeItem(item.id);
    toast.success(tx.removed);
    onOpenChange(false);
  };

  const handleRetake = () => inputRef.current?.click();

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await compress(file);
      const { data, error } = await supabase.functions.invoke("analyze-wardrobe", {
        body: { images: [dataUrl] },
      });
      if (error) {
        toast.error(error.message || "Analysis failed");
        return;
      }
      const next = (data?.items || [])[0];
      if (!next) {
        toast.error(tx.noDetected);
        return;
      }
      replaceItem(item.id, next);
      toast.success(tx.replaced);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{tx.title}</DialogTitle>
          <DialogDescription>{tx.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="my-2 flex items-center gap-4 rounded-2xl border border-border bg-muted/40 p-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-soft"
            style={{ backgroundColor: item.color_hex }}
          >
            <span>{item.emoji}</span>
          </div>
          <div className="min-w-0">
            <div className="font-display text-base font-bold truncate">
              {lang === "tr" ? item.type_tr : item.type_en}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {lang === "tr" ? item.color_tr : item.color_en}
            </div>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button
            onClick={handleRetake}
            disabled={busy}
            size="lg"
            className="h-12 w-full rounded-full bg-gradient-coral font-semibold shadow-glow transition-bounce hover:scale-[1.02]"
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tx.replacing}
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                {tx.retake}
              </>
            )}
          </Button>
          <Button
            onClick={handleRemove}
            disabled={busy}
            variant="outline"
            size="lg"
            className="h-12 w-full rounded-full font-semibold"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {tx.remove}
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            disabled={busy}
            variant="ghost"
            className="w-full rounded-full"
          >
            {tx.cancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
