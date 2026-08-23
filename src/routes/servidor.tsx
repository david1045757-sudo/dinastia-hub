import { createFileRoute } from "@tanstack/react-router";
import { useServers } from "@/hooks/useDinastia";
import { ServerBadges, PlayerCount } from "@/components/ServerStatus";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { formatDateTime, serverIsOnline } from "@/lib/dinastia";

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
        content: "Consulta el estado técnico y administrativo del servidor DINASTIA RP.",
      },
    ],
  }),
  component: ServerPage,
});

function ServerPage() {
  const { data: servers, isLoading } = useServers();
  const list = servers ?? [];
  const onlineCount = list.filter((s) => serverIsOnline(s.last_heartbeat)).length;

  return (
    <div className="container-page py-14">
      <header className="max-w-2xl">
        <p className="text-xs tracking-[0.3em] text-primary uppercase">Servidor</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Estado del servidor</h1>
        <p className="mt-3 text-muted-foreground">
          El estado técnico indica si el servidor está funcionando. El estado administrativo indica
          si está abierto al público.
        </p>
      </header>

      <div className="mt-6">
        <StatusPill tone="sky">
          {onlineCount} de {list.length} servidores online
        </StatusPill>
      </div>

      {isLoading && <p className="mt-10 text-muted-foreground">Cargando…</p>}

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {list.map((server) => {
          const online = serverIsOnline(server.last_heartbeat);
          return (
            <article key={server.id} className="surface-panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{server.name}</h2>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {server.mta_version}
                  </p>
                </div>
                <ServerBadges server={server} />
              </div>

              <div className="mt-6">
                <PlayerCount server={server} />
              </div>

              {!server.is_open && (
                <p className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {server.closed_reason ?? "El servidor está temporalmente cerrado."}
                </p>
              )}

              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm">
                <div>
                  <dt className="text-muted-foreground">Dirección</dt>
                  <dd className="mt-1 font-mono break-all">{server.address ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Última señal</dt>
                  <dd className="mt-1">{formatDateTime(server.last_heartbeat)}</dd>
                </div>
              </dl>

              <Button className="mt-6 w-full sm:w-auto" asChild disabled={!server.address || !online}>
                <a href={server.address ?? "#"}>Conectar al servidor</a>
              </Button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
