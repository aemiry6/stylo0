import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  style_preferences: Record<string, unknown>;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const displayNameFromUser = (user: User) =>
  (user.user_metadata?.full_name as string | undefined) ||
  (user.user_metadata?.name as string | undefined) ||
  user.email?.split("@")[0] ||
  "Stylo User";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = useCallback(async (user: User) => {
    const fallbackName = displayNameFromUser(user);
    const { data: existing } = await supabase
      .from("profiles")
      .select("id,user_id,display_name,avatar_url,style_preferences")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      setProfile(existing as Profile);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .insert({ user_id: user.id, display_name: fallbackName })
      .select("id,user_id,display_name,avatar_url,style_preferences")
      .single();

    setProfile((data as Profile) ?? null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const currentUser = session?.user;
    if (!currentUser) {
      setProfile(null);
      return;
    }
    await ensureProfile(currentUser);
  }, [ensureProfile, session?.user]);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        setTimeout(() => void ensureProfile(nextSession.user), 0);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) void ensureProfile(data.session.user);
      else setProfile(null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, [ensureProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user: session?.user ?? null, session, profile, loading, refreshProfile, signOut }),
    [loading, profile, refreshProfile, session, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
