import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLang } from "@/i18n/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/state/AuthContext";
import { toast } from "sonner";

type Mode = "signin" | "signup";

const Auth = () => {
  const { t, lang } = useLang();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate("/app", { replace: true });
  }, [authLoading, navigate, user]);

  const copy = lang === "tr" ? t.auth : translationsFallback.tr.auth;

  const handleEmail = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        localStorage.setItem("stylo-new-user", "1");
        toast.success(copy.signupSuccess);
        navigate("/", { replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/app", { replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.error);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/app" });
    setBusy(false);
    if (result.error) toast.error(result.error.message || copy.error);
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-coral shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="font-display text-2xl font-bold">{t.brand}</span>
        </Link>
      </header>

      <main className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
        <section className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
          <div className="mb-6 text-center">
            <h1 className="font-display text-3xl font-bold">{mode === "signin" ? copy.signinTitle : copy.signupTitle}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>

          <Button onClick={handleGoogle} disabled={busy} variant="outline" className="h-12 w-full rounded-full font-semibold">
            <Sparkles className="mr-2 h-4 w-4" />
            {copy.google}
          </Button>

          <div className="my-5 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">{copy.or}</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="displayName">{copy.name}</Label>
                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{copy.email}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{copy.password}</Label>
              <Input id="password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button disabled={busy} className="h-12 w-full rounded-full bg-gradient-coral font-semibold shadow-glow">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              {mode === "signin" ? copy.signin : copy.signup}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-5 w-full text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {mode === "signin" ? copy.toSignup : copy.toSignin}
          </button>
        </section>
      </main>
    </div>
  );
};

const translationsFallback = {
  tr: {
    auth: {
      signinTitle: "Giriş yap",
      signupTitle: "Profil oluştur",
      subtitle: "Dolabını güvenle kaydet ve her gün aynı parçaları gör.",
      google: "Google ile devam et",
      or: "veya",
      name: "Adın",
      email: "E-posta",
      password: "Şifre",
      signin: "Giriş yap",
      signup: "Profil oluştur",
      toSignup: "Hesabın yok mu? Profil oluştur",
      toSignin: "Zaten hesabın var mı? Giriş yap",
      signupSuccess: "Profil oluşturuldu. E-postanı doğruladıktan sonra giriş yapabilirsin.",
      error: "Giriş işlemi tamamlanamadı",
    },
  },
};

export default Auth;
