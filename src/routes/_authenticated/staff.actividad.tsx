import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock, Radio, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useMyActiveShift, useNow, usePrimaryServer } from "@/hooks/useDinastia";
import { Button } from "@/components/ui/button";
import { PageHeader, PermissionGate } from "@/components/PermissionGate";
import { StatusPill } from "@/components/StatusPill";
import { SHIFT_MAX_MS, formatDateTime, formatDuration, formatHours, formatTime } from "@/lib/dinastia";

export const Route = createFileRoute("/_authenticated/staff/actividad")({
  head: () => ({
    meta: [
      { title: "Actividad del staff — DINASTIA RP" },
      {
        name: "description",
        content: "Turnos, horas y presencia en el servidor del equipo de staff de DINASTIA RP.",
      },
      { property: "og:title", content: "Actividad del staff — DINASTIA RP" },
      { property: "og:description", content: "Control de turnos del staff de DINASTIA RP." },
    ],
  }),
  component: () => (
    <PermissionGate anyOf={["staff.shift", "staff.activity"]}>
      <StaffActivity />
    </PermissionGate>
  ),
});

function StaffActivity() {
  const { user, profile, rank, hasPerm } = useAuth();
  const queryClient = useQueryClient();
  const now = useNow();
  const { server } = usePrimaryServer();
  const { data: activeShift } = useMyActiveShift();

  const { data: openShifts } = useQuery({
    queryKey: ["shifts-open"],
    enabled: hasPerm("staff.activity"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .is("ended_at", null)
        .order("started_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  const { data: history } = useQuery({
    queryKey: ["shifts-history", hasPerm("staff.history_all"), user?.id],
    queryFn: async () => {
      let q = supabase
        .from("shifts")
        .select("*")
        .not("ended_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(40);
      if (!hasPerm("staff.history_all")) q = q.eq("user_id", user!.id);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(user),
  });

  const ids = new Set<string>();
  (openShifts ?? []).forEach((s) => ids.add(s.user_id));
  (history ?? []).forEach((s) => ids.add(s.user_id));

  const { data: names } = useQuery({
    queryKey: ["shift-names", Array.from(ids).sort().join(",")],
    enabled: ids.size > 0,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, username").in("id", Array.from(ids));
      const map: Record<string, string> = {};
      (data ?? []).forEach((p) => {
        map[p.id] = p.username;
      });
      return map;
    },
  });

  const { data: presence } = useQuery({
    queryKey: ["mta-presence"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mta_presence")
        .select("*")
        .order("last_seen", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 20_000,
  });

  const onlineNow = (presence ?? []).filter(
    (p) => now - new Date(p.last_seen).getTime() < 120_000,
  );

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["shift-active"] });
    void queryClient.invalidateQueries({ queryKey: ["shifts-open"] });
    void queryClient.invalidateQueries({ queryKey: ["shifts-history"] });
  }

  async function startShift() {
    if (!user) return;
    const startedAt = new Date();
    const { error } = await supabase.from("shifts").insert({
      user_id: user.id,
      server_id: server?.id ?? null,
      rank_name: rank?.name ?? null,
      started_at: startedAt.toISOString(),
      ends_at: new Date(startedAt.getTime() + SHIFT_MAX_MS).toISOString(),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Turno iniciado. Duración máxima: 2 horas.");
    invalidate();
  }

  async function endShift(reason: string) {
    if (!activeShift) return;
    const { error } = await supabase
      .from("shifts")
      .update({ ended_at: new Date().toISOString(), end_reason: reason })
      .eq("id", activeShift.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Turno finalizado.");
    invalidate();
  }

  const elapsed = activeShift ? now - new Date(activeShift.started_at).getTime() : 0;
  const remaining = activeShift ? new Date(activeShift.ends_at).getTime() - now : 0;
  const expired = activeShift ? remaining <= 0 : false;
  const progress = Math.min(100, (elapsed / SHIFT_MAX_MS) * 100);

  const myPresence = (presence ?? []).find(
    (p) => p.username && profile?.username && p.username.toLowerCase() === profile.username.toLowerCase(),
  );
  const inGame = myPresence ? now - new Date(myPresence.last_seen).getTime() < 120_000 : false;

  return (
    <div className="container-page py-14">
      <PageHeader
        eyebrow="Staff"
        title="Actividad y turnos"
        description="Registra tu turno de servicio. Cada turno dura un máximo de 2 horas."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="surface-panel p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Mi turno</h2>
            <StatusPill tone={inGame ? "online" : "neutral"} pulse={inGame}>
              {inGame ? "Conectado en MTA" : "Fuera del servidor"}
            </StatusPill>
          </div>

          {activeShift ? (
            <div className="mt-6">
              <p className="font-mono text-4xl font-semibold tracking-tight">
                {formatDuration(elapsed)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Inicio {formatTime(activeShift.started_at)} · Fin automático{" "}
                {formatTime(activeShift.ends_at)}
              </p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full ${expired ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {expired && (
                <p className="mt-3 text-sm text-destructive">
                  Has superado el límite de 2 horas. Finaliza el turno.
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => void endShift("manual")}>Finalizar turno</Button>
                <Button variant="outline" onClick={() => void endShift("pausa")}>
                  Finalizar por pausa
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground">
                No tienes ningún turno activo. Inicia uno cuando entres de servicio.
              </p>
              <Button
                className="mt-5"
                size="lg"
                disabled={!hasPerm("staff.shift")}
                onClick={() => void startShift()}
              >
                Iniciar turno
              </Button>
            </div>
          )}
        </div>

        <div className="surface-panel p-6">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Staff en servicio</h2>
          </div>
          {(openShifts ?? []).length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">Ahora mismo no hay nadie de servicio.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {(openShifts ?? []).map((s) => {
                const ms = now - new Date(s.started_at).getTime();
                return (
                  <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium">{names?.[s.user_id] ?? "Staff"}</p>
                      <p className="text-xs text-muted-foreground">{s.rank_name ?? "—"}</p>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatDuration(ms)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-6 border-t border-border pt-5">
            <div className="flex items-center gap-3">
              <Radio className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold tracking-wide uppercase">Presencia MTA</h3>
            </div>
            {onlineNow.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Sin jugadores reportados.</p>
            ) : (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {onlineNow.slice(0, 12).map((p) => (
                  <li key={p.id} className="font-mono text-xs text-muted-foreground">
                    {p.mta_identity}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">
          {hasPerm("staff.history_all") ? "Historial de turnos" : "Mi historial"}
        </h2>
        <div className="surface-panel mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs tracking-wide text-muted-foreground uppercase">
              <tr className="border-b border-border">
                <th className="px-5 py-3">Staff</th>
                <th className="px-5 py-3">Inicio</th>
                <th className="px-5 py-3">Fin</th>
                <th className="px-5 py-3">Duración</th>
                <th className="px-5 py-3">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {(history ?? []).map((s) => (
                <tr key={s.id} className="border-b border-border/50 last:border-0">
                  <td className="px-5 py-3">{names?.[s.user_id] ?? "Staff"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDateTime(s.started_at)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDateTime(s.ended_at)}</td>
                  <td className="px-5 py-3">
                    {formatHours(
                      new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime(),
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{s.end_reason ?? "—"}</td>
                </tr>
              ))}
              {(history ?? []).length === 0 && (
                <tr>
                  <td className="px-5 py-6 text-muted-foreground" colSpan={5}>
                    Aún no hay turnos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
