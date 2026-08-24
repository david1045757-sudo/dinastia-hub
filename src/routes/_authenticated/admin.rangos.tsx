import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader, PermissionGate } from "@/components/PermissionGate";
import { ALL_PERMISSIONS, slugify } from "@/lib/dinastia";

export const Route = createFileRoute("/_authenticated/admin/rangos")({
  head: () => ({
    meta: [
      { title: "Rangos — Administración DINASTIA RP" },
      { name: "description", content: "Configura rangos y permisos del staff de DINASTIA RP." },
      { property: "og:title", content: "Rangos — Administración DINASTIA RP" },
      { property: "og:description", content: "Gestión de rangos y permisos." },
    ],
  }),
  component: () => (
    <PermissionGate perm="admin.ranks">
      <AdminRanks />
    </PermissionGate>
  ),
});

type RankRow = {
  id: string;
  slug: string;
  name: string;
  color: string;
  priority: number;
  is_staff: boolean;
  is_system: boolean;
  permissions: string[];
};

function AdminRanks() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");

  const { data: ranks } = useQuery({
    queryKey: ["ranks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ranks")
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RankRow[];
    },
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["ranks"] });
  }

  async function update(id: string, values: Partial<RankRow>) {
    const { error } = await supabase.from("ranks").update(values).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    invalidate();
  }

  async function createRank(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const { error } = await supabase.from("ranks").insert({
      name: newName.trim(),
      slug: slugify(newName),
      priority: 10,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewName("");
    toast.success("Rango creado.");
    invalidate();
  }

  async function removeRank(id: string) {
    const { error } = await supabase.from("ranks").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Rango eliminado.");
    invalidate();
  }

  const groups = Array.from(new Set(ALL_PERMISSIONS.map((p) => p.group)));

  return (
    <div className="container-page py-14">
      <PageHeader
        eyebrow="Administración"
        title="Rangos y permisos"
        description="Define qué puede hacer cada rango dentro de la plataforma."
      />

      <form onSubmit={createRank} className="surface-panel mt-8 flex flex-wrap items-end gap-4 p-5">
        <div className="min-w-[220px] flex-1 space-y-2">
          <Label htmlFor="rank-name">Nuevo rango</Label>
          <Input
            id="rank-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ej. Soporte Senior"
          />
        </div>
        <Button type="submit">Crear rango</Button>
      </form>

      <div className="mt-8 space-y-5">
        {(ranks ?? []).map((r) => (
          <div key={r.id} className="surface-panel p-6">
            <div className="flex flex-wrap items-center gap-4">
              <span
                className="rounded-full border px-3 py-1 text-sm"
                style={{ color: r.color, borderColor: `${r.color}55` }}
              >
                {r.name}
              </span>
              <div className="flex items-center gap-2">
                <Label htmlFor={`color-${r.id}`} className="text-xs text-muted-foreground">
                  Color
                </Label>
                <input
                  id={`color-${r.id}`}
                  type="color"
                  value={r.color}
                  onChange={(e) => void update(r.id, { color: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`prio-${r.id}`} className="text-xs text-muted-foreground">
                  Prioridad
                </Label>
                <Input
                  id={`prio-${r.id}`}
                  type="number"
                  defaultValue={r.priority}
                  className="w-20"
                  onBlur={(e) => void update(r.id, { priority: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id={`staff-${r.id}`}
                  checked={r.is_staff}
                  onCheckedChange={(v) => void update(r.id, { is_staff: v })}
                />
                <Label htmlFor={`staff-${r.id}`} className="text-xs text-muted-foreground">
                  Es staff
                </Label>
              </div>
              {!r.is_system && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={() => void removeRank(r.id)}
                >
                  Eliminar
                </Button>
              )}
            </div>

            {r.permissions.includes("*") ? (
              <p className="mt-5 text-sm text-primary">
                Este rango tiene acceso total a la plataforma.
              </p>
            ) : (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {groups.map((g) => (
                  <div key={g}>
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {g}
                    </p>
                    <div className="mt-3 space-y-2">
                      {ALL_PERMISSIONS.filter((p) => p.group === g).map((p) => (
                        <label key={p.key} className="flex items-start gap-2 text-sm">
                          <Checkbox
                            checked={r.permissions.includes(p.key)}
                            onCheckedChange={(v) => {
                              const next = v
                                ? [...r.permissions, p.key]
                                : r.permissions.filter((x) => x !== p.key);
                              void update(r.id, { permissions: next });
                            }}
                          />
                          <span className="text-muted-foreground">{p.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
