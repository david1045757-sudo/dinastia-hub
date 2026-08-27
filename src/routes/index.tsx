import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Ticket, Users, Power, ArrowRight } from "lucide-react";
import { getMtaServerStatus, type MtaServerStatus } from "@/lib/mtaApi";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL = 30000;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DINASTIA RP — Comunidad de rol MTA:SA" },
      {
        name: "description",
        content:
          "Estado en vivo del servidor DINASTIA RP: jugadores conectados, disponibilidad y soporte para la comunidad MTA:SA.",
      },
      { property: "og:title", content: "DINASTIA RP — Comunidad de rol MTA:SA" },
      {
        property: "og:description",
        content:
          "Consulta el estado del servidor DINASTIA RP y abre tu ticket de soporte.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [server, setServer] = useState<MtaServerStatus | null>(null);

  useEffect(() => {
    let active = true;

    async function checkServer() {
      try {
        const data = await getMtaServerStatus();
        // Diagnóstico interno — no se muestra en la interfaz.
        console.log("[DINASTIA] API:", data);
        if (!active) return;
        setServer(data);
      } catch (err) {
        console.error("[DINASTIA] API ERROR:", err);
        if (!active) return;
        setServer(null);
      }
    }

    void checkServer();
    const interval = setInterval(() => void checkServer(), POLL_INTERVAL);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const isOnline = server?.online === true;
  const isOpen = Boolean(server?.is_open);
  const playersOnline = server?.players_online ?? 0;
  const maxPlayers = server?.max_players ?? 0;
  const playerPercentage =
    maxPlayers > 0 ? Math.min((playersOnline / maxPlayers) * 100, 100) : 0;

  const loading = server === null;

  return (
    <main className="relative overflow-hidden">
      {/* Glow de fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(60%_60%_at_50%_0%,oklch(0.8_0.115_227/0.18),transparent_70%)]"
      />

      {/* HERO */}
      <section className="container-page pt-20 pb-10 text-center sm:pt-28">
        <p className="text-xs tracking-[0.3em] text-primary uppercase">
          Comunidad MTA:SA
        </p>
        <h1 className="mt-4 text-5xl font-bold sm:text-7xl">
          <span className="text-gradient-sky">DINASTIA</span>{" "}
          <span className="text-foreground">RP</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
          Tu historia comienza aquí.
        </p>

        {/* Estado del servidor */}
        <div className="mt-8 flex items-center justify-center">
          <ServerStatusPill loading={loading} isOnline={isOnline} />
        </div>

        {/* Botones principales */}
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 px-7 text-base">
            <Link to="/soporte">
              <Ticket className="h-5 w-5" />
              Abrir ticket
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 px-7 text-base"
          >
            <Link to="/servidor">
              <Power className="h-5 w-5" />
              Entrar al servidor
            </Link>
          </Button>
        </div>
      </section>

      {/* TARJETA DE JUGADORES + BARRA DE OCUPACIÓN */}
      <section className="container-page pb-24">
        <div className="mx-auto max-w-2xl">
          <div className="surface-panel overflow-hidden p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </span>
                <div className="text-left">
                  <p className="text-sm font-medium text-muted-foreground">
                    Jugadores conectados
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {isOnline
                      ? "En vivo desde el servidor"
                      : "Servidor desconectado"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-4xl font-bold tabular-nums text-foreground">
                    {loading ? "—" : playersOnline}
                  </span>
                  <span className="text-xl text-muted-foreground">
                    / {loading ? "—" : maxPlayers}
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de ocupación */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Ocupación del servidor</span>
                <span className="font-medium tabular-nums text-foreground">
                  {loading ? "—" : `${Math.round(playerPercentage)}%`}
                </span>
              </div>
              <div
                className="relative h-3 w-full overflow-hidden rounded-full bg-secondary"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={loading ? undefined : Math.round(playerPercentage)}
                aria-label="Ocupación del servidor"
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-700 ease-out"
                  style={{ width: `${loading ? 0 : playerPercentage}%` }}
                />
              </div>
            </div>

            {/* Estado administrativo discreto */}
            {!loading && isOnline && (
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-5 text-xs">
                <span className="text-muted-foreground">Estado administrativo:</span>
                {isOpen ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 font-medium text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    Abierto
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 font-medium text-warning">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                    Cerrado
                  </span>
                )}
                {server?.closed_reason && !isOpen && (
                  <span className="text-muted-foreground/80">
                    · {server.closed_reason}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Acceso rápido a la página de servidor */}
          <div className="mt-4 flex justify-center">
            <Button asChild variant="link" className="text-muted-foreground">
              <Link to="/servidor">
                Ver detalle técnico del servidor
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function ServerStatusPill({
  loading,
  isOnline,
}: {
  loading: boolean;
  isOnline: boolean;
}) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-2.5 rounded-full border border-border bg-secondary/60 px-4 py-2 text-sm font-medium text-muted-foreground">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-warning opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-warning" />
        </span>
        Consultando servidor…
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-medium ${
        isOnline
          ? "border-success/30 bg-success/10 text-success"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      }`}
    >
      <span className="relative flex h-2.5 w-2.5">
        {isOnline && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
            isOnline
              ? "bg-success shadow-[0_0_10px_oklch(0.72_0.16_155/0.8)]"
              : "bg-destructive"
          }`}
        />
      </span>
      {isOnline ? "Servidor online" : "Servidor offline"}
    </span>
  );
}
