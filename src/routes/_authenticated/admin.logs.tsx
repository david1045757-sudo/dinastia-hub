import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PermissionGate } from "@/components/PermissionGate";
import { formatDateTime } from "@/lib/dinastia";

export const Route = createFileRoute("/_authenticated/admin/logs")({
  head: () => ({
    meta: [
      { title: "Registros — Administración DINASTIA RP" },
      { name: "description", content: "Auditoría de acciones del staff y del sistema en DINASTIA RP." },
      { property: "og:title", content: "Registros — Administración DINASTIA RP" },
      { property: "og:description", content: "Auditoría de la plataforma." },
    ],
  }),
  component: () => (
    <PermissionGate perm="admin.logs">
      <AdminLogs />
    </PermissionGate>
  ),
});

function AdminLogs() {
  const { data: logs } = useQuery({
    queryKey: ["logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(150);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 60_000,
  });

  const ids = Array.from(new Set((logs ?? []).map((l) => l.actor_id).filter(Boolean) as string[]));

  const { data: names } = useQuery({
    queryKey: ["log-names", ids.sort().join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, username").in("id", ids);
      const map: Record<string, string> = {};
      (data ?? []).forEach((p) => {
        map[p.id] = p.username;
      });
      return map;
    },
  });

  return (
    <div className="container-page py-14">
      <PageHeader
        eyebrow="Administración"
        title="Registros"
        description="Últimas 150 acciones registradas en la plataforma."
      />

      <div className="surface-panel mt-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs tracking-wide text-muted-foreground uppercase">
            <tr className="border-b border-border">
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Autor</th>
              <th className="px-5 py-3">Acción</th>
              <th className="px-5 py-3">Detalles</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map((l) => (
              <tr key={l.id} className="border-b border-border/50 last:border-0 align-top">
                <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">
                  {formatDateTime(l.created_at)}
                </td>
                <td className="px-5 py-3">{l.actor_id ? (names?.[l.actor_id] ?? "—") : "Sistema"}</td>
                <td className="px-5 py-3 font-mono text-xs text-primary">{l.action}</td>
                <td className="px-5 py-3 font-mono text-xs break-all text-muted-foreground">
                  {JSON.stringify(l.details)}
                </td>
              </tr>
            ))}
            {(logs ?? []).length === 0 && (
              <tr>
                <td className="px-5 py-6 text-muted-foreground" colSpan={4}>
                  Sin registros todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
