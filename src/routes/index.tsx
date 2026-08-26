import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LifeBuoy, Newspaper, Server } from "lucide-react";
import { useEffect, useState } from "react";

import {
  getMtaServerStatus,
  type MtaServerStatus,
} from "@/lib/mtaApi";

import { useNews } from "@/hooks/useDinastia";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dinastia";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "DINASTIA RP — Tu historia comienza aquí",
      },
      {
        name: "description",
        content:
          "Web oficial de DINASTIA RP para MTA:SA. Consulta el estado del servidor, abre tickets de soporte y sigue las noticias de la comunidad.",
      },
      {
        property: "og:title",
        content: "DINASTIA RP — Tu historia comienza aquí",
      },
      {
        property: "og:description",
        content:
          "Estado del servidor en vivo, soporte por tickets y noticias de la comunidad.",
      },
    ],
  }),

  component: Home,
});

function Home() {
  const [server, setServer] = useState<MtaServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  const { data: news } = useNews(3);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    const loadServer = async () => {
      try {
        const data = await getMtaServerStatus();

        console.log("[DINASTIA API] Respuesta:", data);
        console.log("[DINASTIA API] online:", data.online);
        console.log("[DINASTIA API] jugadores:", data.players_online);

        if (!mounted) return;

        setServer(data);
        setApiError(false);
      } catch (error) {
        console.error("[DINASTIA API] Error:", error);

        if (!mounted) return;

        setServer(null);
        setApiError(true);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadServer();

    const interval = setInterval(loadServer, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  /*
   * IMPORTANTE:
   *
   * La API ya nos dice si el servidor está online.
   *
   * No usamos players_online.
   * No usamos is_open.
   * No usamos last_heartbeat.
   *
   * Si la API devuelve:
   *
   * online: true
   *
   * entonces el servidor está ONLINE.
   */
  const online = server?.online === true;

  return (
    <div>
      {/* HERO */}

      <section className="relative overflow-hidden border-b border-border/70">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(1000px 420px at 50% -10%, oklch(0.8 0.115 227 / 14%), transparent 70%)",
          }}
        />

        <div className="container-page relative flex flex-col items-center py-20 text-center sm:py-28">
          <p className="text-xs tracking-[0.4em] text-primary uppercase">
            Comunidad MTA:SA
          </p>

          <h1 className="brand-title mt-5 text-4xl sm:text-6xl">
            <span className="text-gradient-sky">
              DINASTIA RP
            </span>
          </h1>

          <p className="mt-4 max-w-lg text-lg text-muted-foreground">
            Tu historia comienza aquí.
          </p>

          {/* ESTADO DEL SERVIDOR */}

          <div className="mt-8 w-full max-w-md">
            <div className="surface-panel rounded-2xl p-6">
              
              <div className="flex items-center justify-between">
                
                <div className="flex items-center gap-3">
                  
                  <span
                    className={`h-3 w-3 rounded-full ${
                      loading
                        ? "animate-pulse bg-yellow-400"
                        : apiError
                          ? "bg-red-500"
                          : online
                            ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]"
                            : "bg-red-500"
                    }`}
                  />

                  <div className="text-left">
                    
                    <h2 className="font-semibold">
                      {server?.name ?? "DINASTIA RP"}
                    </h2>

                    <p
                      className={`text-sm ${
                        loading
                          ? "text-yellow-400"
                          : apiError
                            ? "text-red-400"
                            : online
                              ? "text-green-400"
                              : "text-red-400"
                      }`}
                    >
                      {loading
                        ? "Consultando servidor..."
                        : apiError
                          ? "Error de conexión"
                          : online
                            ? "Servidor online"
                            : "Servidor offline"}
                    </p>

                  </div>
                </div>

                <span className="rounded-lg bg-secondary px-3 py-1 text-xs text-muted-foreground">
                  MTA:SA
                </span>

              </div>

              {/* ESTADÍSTICAS */}

              <div className="mt-6 grid grid-cols-2 gap-3">
                
                <div className="rounded-xl bg-secondary/60 p-4 text-left">
                  
                  <p className="text-xs text-muted-foreground">
                    Jugadores
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {server?.players_online ?? 0}

                    <span className="text-base font-normal text-muted-foreground">
                      {" "}
                      / {server?.max_players ?? 150}
                    </span>
                  </p>

                </div>

                <div className="rounded-xl bg-secondary/60 p-4 text-left">
                  
                  <p className="text-xs text-muted-foreground">
                    Versión
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {server?.mta_version ?? "MTA:SA"}
                  </p>

                </div>

              </div>

              {/* HEARTBEAT */}

              {server && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Última actualización hace{" "}
                  {server.seconds_since_heartbeat ?? 0} segundos
                </p>
              )}

            </div>
          </div>

          {/* BOTONES */}

          <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            
            <Button
              size="lg"
              asChild
              disabled={!server?.address}
            >
              <a href={server?.address ?? "#"}>
                Jugar ahora
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>

            <Button
              size="lg"
              variant="outline"
              asChild
            >
              <Link to={user ? "/soporte" : "/auth"}>
                Abrir ticket
              </Link>
            </Button>

          </div>
        </div>
      </section>

      {/* TARJETAS */}

      <section className="container-page grid gap-4 py-14 md:grid-cols-3">
        
        <InfoCard
          icon={<Server className="h-5 w-5" />}
          title="Estado del servidor"
          text={
            online
              ? `${server?.name ?? "DINASTIA RP"} está funcionando en ${
                  server?.mta_version ?? "MTA:SA"
                }.`
              : "El servidor no está enviando señal en este momento."
          }
          to="/servidor"
          cta="Ver servidor"
        />

        <InfoCard
          icon={<LifeBuoy className="h-5 w-5" />}
          title="Soporte"
          text="Abre un ticket y el staff te responderá. Solo tú puedes ver tus tickets."
          to="/soporte"
          cta="Ir a soporte"
        />

        <InfoCard
          icon={<Newspaper className="h-5 w-5" />}
          title="Noticias"
          text="Actualizaciones, eventos y anuncios oficiales de la comunidad."
          to="/noticias"
          cta="Leer noticias"
        />

      </section>

      {/* NOTICIAS */}

      {news && news.length > 0 && (
        <section className="container-page pb-16">
          
          <div className="flex items-end justify-between">
            
            <h2 className="text-2xl font-semibold">
              Últimas noticias
            </h2>

            <Link
              to="/noticias"
              className="text-sm text-primary hover:underline"
            >
              Ver todas
            </Link>

          </div>

          <div className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border">
            
            {news.map((n) => (
              <Link
                key={n.id}
                to="/noticias"
                className="flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-secondary/60 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium">
                  {n.title}
                </span>

                <span className="text-sm text-muted-foreground">
                  {formatDate(n.created_at)}
                </span>
              </Link>
            ))}

          </div>

        </section>
      )}

    </div>
  );
}

function InfoCard({
  icon,
  title,
  text,
  to,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  to: string;
  cta: string;
}) {
  return (
    <div className="surface-panel flex flex-col p-6">
      
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>

      <h3 className="mt-4 text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-2 flex-1 text-sm text-muted-foreground">
        {text}
      </p>

      <Link
        to={to}
        className="mt-4 text-sm text-primary hover:underline"
      >
        {cta} →
      </Link>

    </div>
  );
}
