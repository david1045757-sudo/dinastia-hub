import { createFileRoute } from "@tanstack/react-router";
import { useNews } from "@/hooks/useDinastia";
import { formatDate } from "@/lib/dinastia";

export const Route = createFileRoute("/noticias")({
  head: () => ({
    meta: [
      { title: "Noticias — DINASTIA RP" },
      {
        name: "description",
        content:
          "Anuncios oficiales, actualizaciones y eventos de la comunidad DINASTIA RP en MTA:SA.",
      },
      { property: "og:title", content: "Noticias — DINASTIA RP" },
      {
        property: "og:description",
        content: "Todas las novedades y anuncios oficiales de DINASTIA RP.",
      },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const { data, isLoading } = useNews();

  return (
    <div className="container-page py-14">
      <header className="max-w-2xl">
        <p className="text-xs tracking-[0.3em] text-primary uppercase">Comunidad</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Noticias y anuncios</h1>
        <p className="mt-3 text-muted-foreground">
          Todo lo que ocurre en DINASTIA RP, contado por el equipo oficial.
        </p>
      </header>

      {isLoading && <p className="mt-10 text-muted-foreground">Cargando…</p>}

      <div className="mt-10 space-y-5">
        {(data ?? []).map((n) => (
          <article key={n.id} className="surface-panel p-6">
            <div className="flex flex-wrap items-center gap-3">
              <time className="text-xs text-primary">{formatDate(n.created_at)}</time>
              {!n.published && (
                <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] text-warning">
                  Borrador
                </span>
              )}
            </div>
            <h2 className="mt-2 text-xl font-semibold">{n.title}</h2>
            {n.excerpt && <p className="mt-2 text-muted-foreground">{n.excerpt}</p>}
            <div className="mt-4 leading-relaxed whitespace-pre-line text-foreground/90">
              {n.body}
            </div>
          </article>
        ))}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="text-muted-foreground">Todavía no hay noticias publicadas.</p>
        )}
      </div>
    </div>
  );
}
