import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getMtaServerStatus, type MtaServerStatus } from "@/lib/mtaApi";
import { ServerBadges, PlayerCount } from "@/components/ServerStatus";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/dinastia";

export const Route = createFileRoute("/servidor")({
  head: () => ({
    meta: [
      { title: "Servidor — DINASTIA RP" },
      {
        name: "description",
        content:
          "Estado en vivo del servidor DINASTIA RP: jugadores conectados, capacidad, versión de MTA:SA y disponibilidad.",
      },
      { property: "og:title", content: "Servidor — DINASTIA RP" },
      {
        property: "og:description",
        content: "Consulta el estado en vivo del servidor DINASTIA RP.",
      },
    ],
  }),
  component: ServerPage,
});

function ServerPage() {
  const [server, setServer] = useState<MtaServerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadStatus = async () => {
      try {
        const data = await getMtaServerStatus();

        if (!active) return;

        console.log("[DINASTIA] API:", data);
        setServer(data);
        setApiError(null);
      } catch (error) {
        console.error("[DINASTIA] API ERROR:", error);

        if (!active) return;
        setApiError("No se pudo conectar con la API.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadStatus();
    const interval = window.setInterval(loadStatus, 30_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const online = server?.online === true;
  const isOpen = server?.is_open === true || server?.is_open === 1;

  const serverForStatus = server
    ? {
        id: server.server_id,
        name: server.name,
        address: server.address,
        mta_version: server.mta_version,
        players_online: server.players_online,
        max_players: server.max_players,
        is_open: isOpen,
        closed_reason: server.closed_reason,
        last_heartbeat: server.last_heartbeat,
      }
    : null;

  return (
    <div className="container-page py-14">
      <header className="max-w-2xl">
        <p className="text-xs tracking-[0.3em] text-primary uppercase">Servidor</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Estado del servidor</h1>
        <p className="mt-3 text-muted-foreground">
          Consulta en tiempo real el estado del servidor DINASTIA RP, jugadores conectados y disponibilidad.
        </p>
      </header>

      <div className="mt-6">
        <StatusPill tone={online ? "online" : apiError ? "offline" : "sky"} pulse={online}>
          {apiError
            ? "API desconectada"
            : server
              ? online
                ? "Servidor online"
                : "Servidor offline"
              : "Consultando servidor…"}
        </StatusPill>
      </div>

      {isLoading && !server && (
        <p className="mt-10 text-muted-foreground">Cargando estado del servidor…</p>
      )}

      {apiError && !server && (
        <div className="mt-10 surface-panel p-6">
          <p className="text-red-400">No se pudo conectar con la API.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            El estado del MTA no puede determinarse mientras la API esté desconectada.
          </p>
        </div>
      )}

      {server && serverForStatus && (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <article className="surface-panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{server.name}</h2>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  MTA:SA {server.mta_version}
                </p>
              </div>
              <ServerBadges server={serverForStatus} />
            </div>

            <div className="mt-6">
              <PlayerCount server={serverForStatus} />
            </div>

            {!isOpen && (
              <p className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {server.closed_reason ?? "El servidor está temporalmente cerrado."}
              </p>
            )}

            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm">
              <div>
                <dt className="text-muted-foreground">Dirección</dt>
                <dd className="mt-1 font-mono break-all">{server.address ?? "No disponible"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Última señal</dt>
                <dd className="mt-1">{formatDateTime(server.last_heartbeat)}</dd>
              </div>
            </dl>

            <Button
              className="mt-6 w-full sm:w-auto"
              asChild
              disabled={!server.address || !online || !isOpen}
            >
              <a href={server.address ?? "#"}>
                {!online ? "Servidor offline" : !isOpen ? "Servidor cerrado" : "Entrar al servidor"}
              </a>
            </Button>
          </article>
        </div>
      )}
    </div>
  );
}
