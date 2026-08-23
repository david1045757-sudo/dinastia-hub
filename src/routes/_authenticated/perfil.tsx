import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PermissionGate";
import { StatusPill } from "@/components/StatusPill";
import { formatDate, formatDateTime, formatHours } from "@/lib/dinastia";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Mi perfil — DINASTIA RP" },
      { name: "description", content: "Gestiona tu perfil, rango y actividad en DINASTIA RP." },
      { property: "og:title", content: "Mi perfil — DINASTIA RP" },
      { property: "og:description", content: "Tu cuenta en la comunidad DINASTIA RP." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, rank, isStaff, refreshProfile } = useAuth();
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBio(profile?.bio ?? "");
    setAvatar(profile?.avatar_url ?? "");
  }, [profile]);

  const { data: stats } = useQuery({
    queryKey: ["profile-stats", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const [tickets, shifts] = await Promise.all([
        supabase.from("tickets").select("status").eq("user_id", user!.id),
        isStaff
          ? supabase
              .from("shifts")
              .select("started_at, ended_at")
              .eq("user_id", user!.id)
              .not("ended_at", "is", null)
              .order("started_at", { ascending: false })
              .limit(50)
          : Promise.resolve({ data: [] as { started_at: string; ended_at: string | null }[] }),
      ]);
      const rows = tickets.data ?? [];
      const shiftRows = (shifts.data ?? []) as { started_at: string; ended_at: string | null }[];
      const totalMs = shiftRows.reduce(
        (acc, s) =>
          acc + (s.ended_at ? new Date(s.ended_at).getTime() - new Date(s.started_at).getTime() : 0),
        0,
      );
      return {
        total: rows.length,
        open: rows.filter((r) => r.status !== "cerrado").length,
        shiftCount: shiftRows.length,
        shiftMs: totalMs,
        lastShift: shiftRows[0]?.started_at ?? null,
      };
    },
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ bio: bio.trim() || null, avatar_url: avatar.trim() || null })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Perfil actualizado.");
    await refreshProfile();
  }

  return (
    <div className="container-page py-14">
      <PageHeader eyebrow="Cuenta" title="Mi perfil" />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="surface-panel h-fit p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-xl font-semibold">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
              ) : (
                (profile?.username ?? "?").slice(0, 1).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{profile?.username ?? "—"}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Rango</dt>
              <dd>
                <span
                  className="rounded-full border px-3 py-1 text-xs"
                  style={{ color: rank?.color ?? undefined, borderColor: `${rank?.color ?? "#888"}55` }}
                >
                  {rank?.name ?? "Usuario"}
                </span>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Miembro desde</dt>
              <dd>{formatDate(profile?.created_at)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Tickets abiertos</dt>
              <dd>{stats?.open ?? 0}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Tickets totales</dt>
              <dd>{stats?.total ?? 0}</dd>
            </div>
          </dl>

          {isStaff && (
            <div className="mt-6 border-t border-border pt-6">
              <div className="flex items-center gap-2">
                <StatusPill tone="sky">Staff</StatusPill>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Turnos registrados</dt>
                  <dd>{stats?.shiftCount ?? 0}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Horas acumuladas</dt>
                  <dd>{formatHours(stats?.shiftMs ?? 0)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Último turno</dt>
                  <dd>{formatDateTime(stats?.lastShift)}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        <form onSubmit={save} className="surface-panel space-y-5 p-6">
          <h2 className="text-lg font-semibold">Editar perfil</h2>
          <div className="space-y-2">
            <Label htmlFor="username">Nombre de usuario</Label>
            <Input id="username" value={profile?.username ?? ""} disabled />
            <p className="text-xs text-muted-foreground">
              El nombre es único y no se puede cambiar. Contacta con el staff si necesitas modificarlo.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar">URL del avatar</Label>
            <Input
              id="avatar"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Sobre mí</Label>
            <Textarea
              id="bio"
              rows={5}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
              placeholder="Cuéntale a la comunidad quién eres…"
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>
      </div>
    </div>
  );
}
