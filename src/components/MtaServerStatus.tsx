import { useEffect, useState } from "react";
import {
  getMtaServerStatus,
  type MtaServerStatus,
} from "@/lib/mtaApi";

export function MtaServerStatus() {
  const [server, setServer] = useState<MtaServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadServer() {
    try {
      const data = await getMtaServerStatus();

      setServer(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServer();

    const interval = setInterval(loadServer, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <p className="text-slate-400">
          Consultando servidor...
        </p>
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-6">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-red-500" />

          <div>
            <h3 className="font-semibold text-white">
              DINASTIA RP
            </h3>

            <p className="text-sm text-red-400">
              Servidor desconectado
            </p>
          </div>
        </div>
      </div>
    );
  }

  const online =
    server.online && server.is_open;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
      
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${
              online
                ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]"
                : "bg-red-500"
            }`}
          />

          <div>
            <h2 className="text-xl font-bold text-white">
              {server.name}
            </h2>

            <p
              className={`text-sm ${
                online
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {online ? "Servidor online" : "Servidor offline"}
            </p>
          </div>
        </div>

        <span className="rounded-lg bg-slate-900 px-3 py-1 text-xs text-slate-400">
          MTA:SA
        </span>
      </div>

      {/* Estadisticas */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        
        <div className="rounded-xl bg-slate-900 p-4">
          <p className="text-sm text-slate-400">
            Jugadores
          </p>

          <p className="mt-1 text-2xl font-bold text-white">
            {server.players_online}
            <span className="text-base font-normal text-slate-500">
              {" "}
              / {server.max_players}
            </span>
          </p>
        </div>

        <div className="rounded-xl bg-slate-900 p-4">
          <p className="text-sm text-slate-400">
            Version
          </p>

          <p className="mt-1 text-lg font-semibold text-white">
            {server.mta_version}
          </p>
        </div>

      </div>

      {/* Jugadores */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-white">
            Jugadores conectados
          </h3>

          <span className="text-sm text-slate-500">
            {server.players.length}
          </span>
        </div>

        {server.players.length === 0 ? (
          <div className="rounded-xl bg-slate-900 p-4 text-center text-sm text-slate-500">
            No hay jugadores conectados.
          </div>
        ) : (
          <div className="space-y-2">
            {server.players.map((player) => (
              <div
                key={player.identity}
                className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

                  <span className="font-medium text-white">
                    {player.identity}
                  </span>
                </div>

                {player.username &&
                  player.username !== player.identity && (
                    <span className="text-sm text-slate-500">
                      {player.username}
                    </span>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ultimo heartbeat */}
      <div className="mt-5 text-xs text-slate-600">
        Ultima actualizacion hace{" "}
        {server.seconds_since_heartbeat} segundos
      </div>
    </div>
  );
}
