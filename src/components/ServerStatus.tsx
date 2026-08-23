import { Users } from "lucide-react";
import { StatusPill } from "@/components/StatusPill";
import { serverIsOnline } from "@/lib/dinastia";

export type ServerRow = {
  id: string;
  name: string;
  address: string | null;
  mta_version: string;
  players_online: number;
  max_players: number;
  is_open: boolean;
  closed_reason: string | null;
  last_heartbeat: string | null;
};

export function ServerBadges({ server }: { server: ServerRow | null }) {
  const online = serverIsOnline(server?.last_heartbeat);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusPill tone={online ? "online" : "offline"} pulse={online}>
        {online ? "Servidor online" : "Servidor offline"}
      </StatusPill>
      <StatusPill tone={server?.is_open ? "online" : "offline"}>
        {server?.is_open ? "Abierto" : "Cerrado"}
      </StatusPill>
    </div>
  );
}

export function PlayerCount({ server }: { server: ServerRow | null }) {
  const online = serverIsOnline(server?.last_heartbeat);
  const players = online ? (server?.players_online ?? 0) : 0;
  const max = server?.max_players ?? 100;
  const pct = Math.min(100, Math.round((players / Math.max(1, max)) * 100));

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-baseline gap-2">
        <Users className="h-4 w-4 text-primary" />
        <span className="font-mono text-3xl font-semibold text-foreground">{players}</span>
        <span className="font-mono text-lg text-muted-foreground">/ {max}</span>
        <span className="ml-auto text-xs text-muted-foreground">jugadores conectados</span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
