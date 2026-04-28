import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/state/AuthContext";
import type { Json } from "@/integrations/supabase/types";

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
  loading: boolean;
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

const syncWardrobe = async (userId: string, items: WardrobeItem[]) => {
  await supabase.from("wardrobe_items").delete().eq("user_id", userId);
  if (items.length === 0) return;
  await supabase.from("wardrobe_items").insert(
    items.map((item, index) => ({
      user_id: userId,
      item_data: item as unknown as Json,
      sort_order: index,
    })),
  );
};

export const WardrobeProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const loadedUserRef = useRef<string | null>(null);
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

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      loadedUserRef.current = null;
      setLoading(false);
      return;
    }
    if (loadedUserRef.current === user.id) return;

    let cancelled = false;
    setLoading(true);
    supabase
      .from("wardrobe_items")
      .select("item_data,sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .then(async ({ data, error }) => {
        if (cancelled) return;
        if (!error && data && data.length > 0) {
          setWardrobeState(data.map((row) => row.item_data as unknown as WardrobeItem));
        } else if (wardrobe.length > 0) {
          await syncWardrobe(user.id, wardrobe);
        }
        loadedUserRef.current = user.id;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, wardrobe]);

  useEffect(() => {
    if (!user || loadedUserRef.current !== user.id) return;
    void syncWardrobe(user.id, wardrobe);
  }, [user, wardrobe]);

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
      value={{ wardrobe, loading, setWardrobe, removeItem, replaceItem, addItems, outfit, setOutfit, resetAll }}
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
