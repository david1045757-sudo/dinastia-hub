import type { MtaServerStatus as MtaServerStatusType } from "@/lib/mtaApi";

export function ServerBadges({
  server,
}: {
  server: MtaServerStatusType | null;
}) {
  if (!server) {
    return (
      <div className="flex flex-wrap justify-center gap-2">
        <span className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">
          Consultando servidor...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <span
        className={`rounded-full border px-3 py-1 text-sm ${
          server.online
            ? "border-green-500/30 text-green-500"
            : "border-red-500/30 text-red-500"
        }`}
      >
        {server.online ? "Servidor online" : "Servidor offline"}
      </span>

      <span className="rounded-full border border-border px-3 py-1 text-sm">
        {server.is_open ? "Abierto" : "Cerrado"}
      </span>
    </div>
  );
}

export function PlayerCount({
  server,
}: {
  server: MtaServerStatusType | null;
}) {
  if (!server) {
    return (
      <div className="text-center text-muted-foreground">
        Consultando jugadores...
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-4xl font-bold">
        {server.players_online}
        <span className="text-muted-foreground">
          {" "}
          / {server.max_players}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        jugadores conectados
      </p>
    </div>
  );
}

export function MtaServerStatus({
  server,
}: {
  server?: MtaServerStatusType | null;
}) {
  if (!server) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-muted-foreground">
          Consultando servidor...
        </p>
      </div>
    );
  }

  const online = server.online;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${
              online ? "bg-green-500" : "bg-red-500"
            }`}
          />

          <div>
            <h2 className="text-xl font-bold">
              {server.name}
            </h2>

            <p
              className={
                online
                  ? "text-sm text-green-500"
                  : "text-sm text-red-500"
              }
            >
              {online ? "Servidor online" : "Servidor offline"}
            </p>
          </div>
        </div>

        <span className="rounded-lg bg-secondary px-3 py-1 text-xs text-muted-foreground">
          MTA:SA
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-secondary p-4">
          <p className="text-sm text-muted-foreground">
            Jugadores
          </p>

          <p className="mt-1 text-2xl font-bold">
            {server.players_online}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              / {server.max_players}
            </span>
          </p>
        </div>

        <div className="rounded-xl bg-secondary p-4">
          <p className="text-sm text-muted-foreground">
            Versión
          </p>

          <p className="mt-1 text-lg font-semibold">
            {server.mta_version}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">
            Jugadores conectados
          </h3>

          <span className="text-sm text-muted-foreground">
            {server.players.length}
          </span>
        </div>

        {server.players.length === 0 ? (
          <div className="rounded-xl bg-secondary p-4 text-center text-sm text-muted-foreground">
            No hay jugadores conectados.
          </div>
        ) : (
          <div className="space-y-2">
            {server.players.map((player) => (
              <div
                key={player.identity}
                className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

                  <span className="font-medium">
                    {player.identity}
                  </span>
                </div>

                {player.username &&
                  player.username !== player.identity && (
                    <span className="text-sm text-muted-foreground">
                      {player.username}
                    </span>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 text-xs text-muted-foreground">
        Última actualización hace{" "}
        {server.seconds_since_heartbeat} segundos
      </div>
    </div>
  );
}
