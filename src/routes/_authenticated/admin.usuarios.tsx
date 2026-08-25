import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, PermissionGate } from "@/components/PermissionGate";
import { formatDate } from "@/lib/dinastia";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuarios — Administración DINASTIA RP" },
      { name: "description", content: "Gestión de usuarios y rangos de la comunidad DINASTIA RP." },
      { property: "og:title", content: "Usuarios — Administración DINASTIA RP" },
      { property: "og:description", content: "Panel de administración de usuarios." },
    ],
  }),
  component: () => (
    <PermissionGate perm="admin.users">
      <AdminUsers />
    </PermissionGate>
  ),
});

function AdminUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: ranks } = useQuery({
    queryKey: ["ranks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ranks")
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: userRanks }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: true }),
        supabase.from("user_ranks").select("user_id, rank_id"),
      ]);
      const rankMap = new Map((userRanks ?? []).map((r) => [r.user_id, r.rank_id]));
      return (profiles ?? []).map((p) => ({ ...p, rank_id: rankMap.get(p.id) ?? null }));
    },
  });

  async function changeRank(userId: string, rankId: string) {
    const { error } = await supabase
      .from("user_ranks")
      .upsert({ user_id: userId, rank_id: rankId, assigned_by: user?.id ?? null }, { onConflict: "user_id" });
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.from("logs").insert({
      actor_id: user?.id ?? null,
      action: "rank.assign",
      details: { user_id: userId, rank_id: rankId },
    });
    toast.success("Rango actualizado.");
    void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  }

  const filtered = (users ?? []).filter((u) =>
    u.username.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="container-page py-14">
      <PageHeader
        eyebrow="Administración"
        title="Usuarios"
        description="Asigna rangos y consulta las cuentas registradas."
      />

      <div className="relative mt-8 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar usuario…"
          className="pl-9"
        />
      </div>

      <div className="surface-panel mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs tracking-wide text-muted-foreground uppercase">
            <tr className="border-b border-border">
              <th className="px-5 py-3">Usuario</th>
              <th className="px-5 py-3">Registro</th>
              <th className="px-5 py-3">Rango</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-border/50 last:border-0">
                <td className="px-5 py-3 font-medium">{u.username}</td>
                <td className="px-5 py-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                <td className="px-5 py-3">
                  <Select
                    {...(u.rank_id ? { value: u.rank_id } : {})}
                    onValueChange={(v) => void changeRank(u.id, v)}
                  >
                    <SelectTrigger className="w-52">
                      <SelectValue placeholder="Sin rango" />
                    </SelectTrigger>
                    <SelectContent>
                      {(ranks ?? []).map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-5 py-6 text-muted-foreground" colSpan={3}>
                  No se han encontrado usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
