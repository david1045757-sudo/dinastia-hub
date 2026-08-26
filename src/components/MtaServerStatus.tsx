import type { MtaServerStatus } from "@/lib/mtaApi";

interface ServerBadgesProps {
  server: MtaServerStatus | null;
}

interface PlayerCountProps {
  server: MtaServerStatus | null;
}

export function ServerBadges({ server }: ServerBadgesProps) {
  if (!server) {
    return (
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 rounded-full bg-yellow-500" />
        <span className="text-sm font-medium text-yellow-400">
          Consultando servidor...
        </span>
      </div>
    );
  }

  const online = server.online === true && Boolean(server.is_open);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <div
        className={`flex items-center gap-2 rounded-full border px-4 py-2 ${
          online
            ? "border-green-500/30 bg-green-500/10"
            : "border-red-500/30 bg-red-500/10"
        }`}
      >
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            online
              ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"
              : "bg-red-500"
          }`}
        />

        <span
          className={`text-sm font-medium ${
            online ? "text-green-400" : "text-red-400"
          }`}
        >
          {online ? "Servidor online" : "Servidor offline"}
        </span>
      </div>

      <div className="rounded-full border border-border bg-secondary/50 px-4 py-2">
        <span className="text-sm text-muted-foreground">
          {server.name}
        </span>
      </div>

      <div className="rounded-full border border-border bg-secondary/50 px-4 py-2">
        <span className="text-sm text-muted-foreground">
          MTA:SA {server.mta_version}
        </span>
      </div>
    </div>
  );
}

export function PlayerCount({ server }: PlayerCountProps) {
  if (!server) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-6 py-4">
        <span className="text-2xl font-bold">...</span>
        <span className="text-sm text-muted-foreground">
          jugadores conectados
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-secondary/40 px-6 py-4">
      <div className="text-center">
        <span className="text-3xl font-bold text-foreground">
          {server.players_online}
        </span>

        <span className="ml-1 text-lg text-muted-foreground">
          / {server.max_players}
        </span>
      </div>

      <div className="text-left">
        <p className="text-sm font-medium text-foreground">
          jugadores conectados
        </p>

        <p className="text-xs text-muted-foreground">
          {server.online
            ? "Servidor funcionando correctamente"
            : "Servidor desconectado"}
        </p>
      </div>
    </div>
  );
}
