import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type WardrobeItem = {
  id: string;
  category: "top" | "bottom" | "outer" | "shoes" | "accessory" | "dress" | "underwear";
  type_en: string;
  type_tr: string;
  color_en: string;
  color_tr: string;
  color_hex: string;
  texture_en: string;
  texture_tr: string;
  weight: "light" | "medium" | "heavy";
  season_en: string;
  season_tr: string;
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
  outfit: Outfit | null;
  setOutfit: (o: Outfit | null) => void;
  resetAll: () => void;
};

const WardrobeContext = createContext<Ctx | null>(null);

export const WardrobeProvider = ({ children }: { children: ReactNode }) => {
  const [wardrobe, setWardrobeState] = useState<WardrobeItem[]>([]);
  const [outfit, setOutfit] = useState<Outfit | null>(null);

  const setWardrobe = useCallback((items: WardrobeItem[]) => {
    // Assign stable IDs if missing
    const withIds = items.map((it, i) => ({ ...it, id: it.id || `w-${Date.now()}-${i}` }));
    setWardrobeState(withIds);
  }, []);

  const resetAll = useCallback(() => {
    setWardrobeState([]);
    setOutfit(null);
  }, []);

  return (
    <WardrobeContext.Provider value={{ wardrobe, setWardrobe, outfit, setOutfit, resetAll }}>
      {children}
    </WardrobeContext.Provider>
  );
};

export const useWardrobe = () => {
  const ctx = useContext(WardrobeContext);
  if (!ctx) throw new Error("useWardrobe must be used inside WardrobeProvider");
  return ctx;
};
