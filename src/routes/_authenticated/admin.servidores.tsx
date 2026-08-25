import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useServers } from "@/hooks/useDinastia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader, PermissionGate } from "@/components/PermissionGate";
import { StatusPill } from "@/components/StatusPill";
import { formatDateTime, serverIsOnline } from "@/lib/dinastia";

export const Route = createFileRoute("/_authenticated/admin/servidores")({
  head: () => ({
    meta: [
      { title: "Servidores — Administración DINASTIA RP" },
      { name: "description", content: "Configura los servidores MTA:SA de DINASTIA RP." },
      { property: "og:title", content: "Servidores — Administración DINASTIA RP" },
      { property: "og:description", content: "Gestión de servidores MTA:SA." },
    ],
  }),
  component: () => (
    <PermissionGate perm="admin.servers">
      <AdminServers />
    </PermissionGate>
  ),
});

function AdminServers() {
  const { data: servers } = useServers();
  const queryClient = useQueryClient();

  async function update(id: string, values: Database["public"]["Tables"]["servers"]["Update"]) {
    const { error } = await supabase.from("servers").update(values).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Servidor actualizado.");
    void queryClient.invalidateQueries({ queryKey: ["servers"] });
  }

  async function createServer() {
    const { error } = await supabase.from("servers").insert({ name: "Nuevo servidor" });
    if (error) {
      toast.error(error.message);
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["servers"] });
  }

  return (
    <div className="container-page py-14">
      <PageHeader
        eyebrow="Administración"
        title="Servidores"
        description="El estado Online/Offline se sincroniza automáticamente con el recurso dinastia_web."
        actions={<Button onClick={() => void createServer()}>Añadir servidor</Button>}
      />

      <div className="mt-8 space-y-5">
        {(servers ?? []).map((s) => {
          const online = serverIsOnline(s.last_heartbeat);
          return (
            <div key={s.id} className="surface-panel p-6">
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill tone={online ? "online" : "offline"} pulse={online}>
                  {online ? "Online" : "Offline"}
                </StatusPill>
                <StatusPill tone={s.is_open ? "sky" : "warning"}>
                  {s.is_open ? "Abierto" : "Cerrado"}
                </StatusPill>
                <span className="ml-auto text-xs text-muted-foreground">
                  Última señal: {formatDateTime(s.last_heartbeat)}
                </span>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  id={`name-${s.id}`}
                  label="Nombre"
                  defaultValue={s.name}
                  onCommit={(v) => void update(s.id, { name: v })}
                />
                <Field
                  id={`addr-${s.id}`}
                  label="Dirección IP"
                  defaultValue={s.address ?? ""}
                  onCommit={(v) => void update(s.id, { address: v || null })}
                />
                <Field
                  id={`ver-${s.id}`}
                  label="Versión MTA"
                  defaultValue={s.mta_version}
                  onCommit={(v) => void update(s.id, { mta_version: v })}
                />
                <Field
                  id={`max-${s.id}`}
                  label="Slots máximos"
                  type="number"
                  defaultValue={String(s.max_players)}
                  onCommit={(v) => void update(s.id, { max_players: Number(v) })}
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`open-${s.id}`}
                    checked={s.is_open}
                    onCheckedChange={(v) => void update(s.id, { is_open: v })}
                  />
                  <Label htmlFor={`open-${s.id}`} className="text-sm text-muted-foreground">
                    Servidor abierto al público
                  </Label>
                </div>
                <div className="min-w-[240px] flex-1">
                  <Field
                    id={`reason-${s.id}`}
                    label="Motivo de cierre"
                    defaultValue={s.closed_reason ?? ""}
                    onCommit={(v) => void update(s.id, { closed_reason: v || null })}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="surface-panel mt-10 p-6">
        <h2 className="text-lg font-semibold">Integración con MTA:SA</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          El recurso <code className="text-primary">dinastia_web</code> debe enviar una señal cada 30
          segundos al endpoint:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-secondary/40 p-4 text-xs">
          POST /api/public/mta/heartbeat
        </pre>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  defaultValue,
  type = "text",
  onCommit,
}: {
  id: string;
  label: string;
  defaultValue: string;
  type?: string;
  onCommit: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        defaultValue={defaultValue}
        onBlur={(e) => {
          if (e.target.value !== defaultValue) onCommit(e.target.value);
        }}
      />
    </div>
  );
}
