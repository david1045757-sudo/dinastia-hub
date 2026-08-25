import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Search = { modo?: "registro" | "login" | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    modo: search["modo"] === "registro" ? "registro" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Acceder — DINASTIA RP" },
      {
        name: "description",
        content:
          "Inicia sesión o crea tu cuenta en DINASTIA RP para abrir tickets de soporte y seguir la comunidad.",
      },
      { property: "og:title", content: "Acceder — DINASTIA RP" },
      { property: "og:description", content: "Crea tu cuenta de la comunidad DINASTIA RP." },
    ],
  }),
  component: AuthPage,
});

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

function AuthPage() {
  const { modo } = Route.useSearch();
  const [tab, setTab] = useState<"login" | "registro">(modo === "registro" ? "registro" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/", replace: true });
  }, [user, loading, navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("Invalid login")
          ? "Correo o contraseña incorrectos."
          : error.message,
      );
      return;
    }
    toast.success("Sesión iniciada");
    void navigate({ to: "/", replace: true });
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!USERNAME_RE.test(username)) {
      toast.error("El nombre de usuario debe tener 3-20 caracteres (letras, números o _).");
      return;
    }
    setBusy(true);

    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", username)
      .maybeSingle();
    if (taken) {
      setBusy(false);
      toast.error("Ese nombre de usuario ya está en uso.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { username },
      },
    });
    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("¡Cuenta creada! Bienvenido a DINASTIA RP.");
      void navigate({ to: "/perfil", replace: true });
    } else {
      toast.success("Cuenta creada. Revisa tu correo para confirmarla.");
      setTab("login");
    }
  }

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className="brand-title text-sm">
            <span className="text-primary">DINASTIA</span> RP
          </p>
          <h1 className="mt-3 text-2xl font-semibold">
            {tab === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tab === "login"
              ? "Accede para gestionar tus tickets y notificaciones."
              : "Elige un nombre de usuario único para la comunidad."}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-1 rounded-lg border border-border bg-secondary/40 p-1">
          {(["login", "registro"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={
                tab === value
                  ? "rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                  : "rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              }
            >
              {value === "login" ? "Iniciar sesión" : "Registrarse"}
            </button>
          ))}
        </div>

        <form
          onSubmit={tab === "login" ? handleLogin : handleRegister}
          className="surface-panel mt-5 space-y-4 p-6"
        >
          {tab === "registro" && (
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de usuario</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Johan_David"
                autoComplete="username"
                required
              />
              <p className="text-xs text-muted-foreground">Único e irrepetible en la plataforma.</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              required
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? "Procesando…" : tab === "login" ? "Entrar" : "Crear cuenta"}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Al continuar aceptas las normas de la comunidad.{" "}
          <Link to="/" className="text-primary hover:underline">
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
