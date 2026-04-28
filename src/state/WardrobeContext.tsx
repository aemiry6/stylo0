import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type WardrobeItem = {
  id: string;
  category: "top" | "bottom" | "outer" | "shoes" | "accessory" | "dress" | "underwear";
  type_en: string;
  type_tr: string;
  color_en: string;
  color_tr: string;
  color_hex: string;
  // Legacy texture fields (kept optional for backward compatibility)
  texture_en?: string;
  texture_tr?: string;
  // Detailed analysis
  material_en: string;
  material_tr: string;
  pattern_en: string;
  pattern_tr: string;
  fit_en: string;
  fit_tr: string;
  style_en: string;
  style_tr: string;
  details_en: string;
  details_tr: string;
  brand_guess: string;
  weight: "light" | "medium" | "heavy";
  season_en: string;
  season_tr: string;
  confidence: number;
  emoji: string;
};

export type Outfit = {
  items: WardrobeItem[];
  rationale_en: string;
  rationale_tr: string;
  confidence: number;
};

type Ctx = {
  wardrobe: WardrobeItem[];
  setWardrobe: (items: WardrobeItem[]) => void;
  removeItem: (id: string) => void;
  replaceItem: (id: string, next: Omit<WardrobeItem, "id">) => void;
  addItems: (items: Omit<WardrobeItem, "id">[]) => void;
  outfit: Outfit | null;
  setOutfit: (o: Outfit | null) => void;
  resetAll: () => void;
};

const WardrobeContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "stylo-wardrobe-v1";

export const WardrobeProvider = ({ children }: { children: ReactNode }) => {
  const [wardrobe, setWardrobeState] = useState<WardrobeItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [outfit, setOutfit] = useState<Outfit | null>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(wardrobe));
  }, [wardrobe]);

  const setWardrobe = useCallback((items: WardrobeItem[]) => {
    const withIds = items.map((it, i) => ({ ...it, id: it.id || `w-${Date.now()}-${i}` }));
    setWardrobeState(withIds);
  }, []);

  const removeItem = useCallback((id: string) => {
    setWardrobeState((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const replaceItem = useCallback((id: string, next: Omit<WardrobeItem, "id">) => {
    setWardrobeState((prev) => prev.map((it) => (it.id === id ? { ...next, id } : it)));
  }, []);

  const addItems = useCallback((items: Omit<WardrobeItem, "id">[]) => {
    setWardrobeState((prev) => [
      ...prev,
      ...items.map((it, i) => ({ ...it, id: `w-${Date.now()}-${prev.length + i}` })),
    ]);
  }, []);

  const resetAll = useCallback(() => {
    setWardrobeState([]);
    setOutfit(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <WardrobeContext.Provider
      value={{ wardrobe, setWardrobe, removeItem, replaceItem, addItems, outfit, setOutfit, resetAll }}
    >
      {children}
    </WardrobeContext.Provider>
  );
};

export const useWardrobe = () => {
  const ctx = useContext(WardrobeContext);
  if (!ctx) throw new Error("useWardrobe must be used inside WardrobeProvider");
  return ctx;
};
