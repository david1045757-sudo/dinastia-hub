import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getMtaServerStatus, type MtaServerStatus } from "@/lib/mtaApi";
import { ServerBadges, PlayerCount } from "@/components/MtaServerStatus";

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
        content: "Consulta el estado del servidor DINASTIA RP y abre tu ticket de soporte.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [server, setServer] = useState<MtaServerStatus | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;

    async function checkServer() {
      try {
        const data = await getMtaServerStatus();
        console.log("[DINASTIA] API:", data);
        if (!active) return;
        setServer(data);
        setApiConnected(true);
        setLastChecked(new Date());
      } catch (err) {
        console.error("[DINASTIA] API ERROR:", err);
        if (!active) return;
        setApiConnected(false);
        setLastChecked(new Date());
      }
    }

    void checkServer();
    const interval = setInterval(() => void checkServer(), POLL_INTERVAL);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const open = Boolean(server?.is_open);
  const heartbeat = server?.seconds_since_heartbeat ?? null;

  return (
    <main className="container-page py-14">
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-xs tracking-[0.3em] text-primary uppercase">Comunidad MTA:SA</p>
        <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">DINASTIA RP</h1>
        <p className="mt-3 text-muted-foreground">Tu historia comienza aquí.</p>

        <div className="mt-8 flex justify-center">
          {/* Estado 3: no hay conexión con la API — no equivale a "servidor offline" */}
          {apiConnected === false ? (
            <div className="flex items-center gap-3 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-sm font-medium text-amber-400">
                No se pudo conectar con la API del servidor
              </span>
            </div>
          ) : (
            <ServerBadges server={apiConnected ? server : null} />
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <PlayerCount server={apiConnected ? server : null} />
        </div>

        {apiConnected && server && (
          <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-3">
            <div className="surface-panel p-4">
              <dt className="text-muted-foreground">Estado administrativo</dt>
              <dd className="mt-1 font-medium">{open ? "Abierto" : "Cerrado"}</dd>
            </div>
            <div className="surface-panel p-4">
              <dt className="text-muted-foreground">Última señal</dt>
              <dd className="mt-1 font-medium">
                {heartbeat == null ? "Sin datos" : `hace ${heartbeat}s`}
              </dd>
            </div>
            <div className="surface-panel p-4">
              <dt className="text-muted-foreground">Última comprobación</dt>
              <dd className="mt-1 font-medium">{lastChecked?.toLocaleTimeString() ?? "—"}</dd>
            </div>
          </dl>
        )}

        {!open && apiConnected && server?.closed_reason && (
          <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {server.closed_reason}
          </p>
        )}
      </section>
    </main>
  );
}
