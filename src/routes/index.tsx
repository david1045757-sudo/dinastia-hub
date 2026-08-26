import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const API_URL = "https://api.nyrox.store";
const SERVER_ID = "530ecf45-1330-449c-9de7-0ed8bd57e355";

type ServerStatus = {
  success: boolean;
  online: boolean;
  server_id: string;
  name: string;
  players_online: number;
  max_players: number;
  mta_version: string;
  is_open: boolean | number;
  seconds_since_heartbeat: number;
};

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [server, setServer] = useState<ServerStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkServer() {
      try {
        const response = await fetch(
          `${API_URL}/api/mta/status/${SERVER_ID}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: ServerStatus = await response.json();

        console.log("[DINASTIA] API:", data);

        if (active) {
          setServer(data);
          setError(null);
        }
      } catch (err) {
        console.error("[DINASTIA] API ERROR:", err);

        if (active) {
          setError("No se pudo conectar con la API.");
        }
      }
    }

    checkServer();

    const interval = setInterval(checkServer, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold">DINASTIA RP</h1>
          <p className="mt-4 text-red-400">{error}</p>
        </div>
      </main>
    );
  }

  if (!server) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <h1 className="text-2xl">Consultando servidor...</h1>
      </main>
    );
  }

  // "online" representa que el servidor MTA está activo.
  // "is_open" es un estado independiente: puede estar online pero cerrado.
  const online = server.online === true;

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">

      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-8">

        <h1 className="text-4xl font-black text-center">
          DINASTIA RP
        </h1>

        <p className="mt-2 text-center text-slate-400">
          Tu historia comienza aquí.
        </p>

        <div className="mt-8 rounded-2xl bg-slate-950 p-6">

          <div className="flex items-center gap-4">

            <div
              className={`h-4 w-4 rounded-full ${
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
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                {online
                  ? "Servidor online"
                  : "Servidor offline"}
              </p>
            </div>

          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">

            <div className="rounded-xl bg-slate-900 p-4">
              <p className="text-sm text-slate-400">
                Jugadores
              </p>

              <p className="text-2xl font-bold">
                {server.players_online}
                <span className="text-slate-500 text-base">
                  {" "}
                  / {server.max_players}
                </span>
              </p>
            </div>

            <div className="rounded-xl bg-slate-900 p-4">
              <p className="text-sm text-slate-400">
                Versión
              </p>

              <p className="text-lg font-bold">
                {server.mta_version}
              </p>
            </div>

          </div>

          <div className="mt-6 text-xs text-slate-500">

            <p>
              API online:{" "}
              <span className="text-white">
                {String(server.online)}
              </span>
            </p>

            <p>
              Servidor abierto:{" "}
              <span className="text-white">
                {String(server.is_open)}
              </span>
            </p>

            <p>
              Último heartbeat:{" "}
              <span className="text-white">
                {server.seconds_since_heartbeat}s
              </span>
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}
