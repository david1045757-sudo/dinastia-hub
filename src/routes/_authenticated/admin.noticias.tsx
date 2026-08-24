import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useNews } from "@/hooks/useDinastia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, PermissionGate } from "@/components/PermissionGate";
import { formatDateTime, slugify } from "@/lib/dinastia";

export const Route = createFileRoute("/_authenticated/admin/noticias")({
  head: () => ({
    meta: [
      { title: "Noticias — Administración DINASTIA RP" },
      { name: "description", content: "Publica y edita los comunicados oficiales de DINASTIA RP." },
      { property: "og:title", content: "Noticias — Administración DINASTIA RP" },
      { property: "og:description", content: "Gestión de noticias de la comunidad." },
    ],
  }),
  component: () => (
    <PermissionGate perm="news.manage">
      <AdminNews />
    </PermissionGate>
  ),
});

function AdminNews() {
  const { user } = useAuth();
  const { data: news } = useNews();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["news"] });
  }

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("news").insert({
      title: title.trim(),
      slug: `${slugify(title)}-${Date.now().toString(36).slice(-4)}`,
      excerpt: excerpt.trim() || null,
      body: body.trim(),
      author_id: user?.id ?? null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTitle("");
    setExcerpt("");
    setBody("");
    toast.success("Noticia publicada.");
    invalidate();
  }

  async function togglePublished(id: string, published: boolean) {
    const { error } = await supabase.from("news").update({ published }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    invalidate();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("news").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Noticia eliminada.");
    invalidate();
  }

  return (
    <div className="container-page py-14">
      <PageHeader
        eyebrow="Administración"
        title="Noticias"
        description="Comunicados oficiales visibles en la web."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={publish} className="surface-panel space-y-5 p-6">
          <h2 className="text-lg font-semibold">Nueva noticia</h2>
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt">Resumen</Label>
            <Input
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              maxLength={180}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Contenido</Label>
            <Textarea
              id="body"
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Publicando…" : "Publicar"}
          </Button>
        </form>

        <div className="space-y-3">
          {(news ?? []).map((n) => (
            <div key={n.id} className="surface-panel p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium">{n.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatDateTime(n.created_at)}
                </span>
              </div>
              {n.excerpt && <p className="mt-2 text-sm text-muted-foreground">{n.excerpt}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`pub-${n.id}`}
                    checked={n.published}
                    onCheckedChange={(v) => void togglePublished(n.id, v)}
                  />
                  <Label htmlFor={`pub-${n.id}`} className="text-xs text-muted-foreground">
                    Publicada
                  </Label>
                </div>
                <Button variant="outline" size="sm" onClick={() => void remove(n.id)}>
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
          {(news ?? []).length === 0 && (
            <div className="surface-panel p-10 text-center text-muted-foreground">
              Todavía no hay noticias.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
