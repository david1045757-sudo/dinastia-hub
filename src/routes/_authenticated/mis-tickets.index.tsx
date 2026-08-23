import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PermissionGate";
import { TicketStatusBadge } from "@/components/TicketStatusBadge";
import { formatDateTime } from "@/lib/dinastia";

export const Route = createFileRoute("/_authenticated/mis-tickets/")({
  head: () => ({
    meta: [
      { title: "Mis tickets — DINASTIA RP" },
      { name: "description", content: "Consulta y responde tus tickets de soporte en DINASTIA RP." },
      { property: "og:title", content: "Mis tickets — DINASTIA RP" },
      { property: "og:description", content: "Tus tickets de soporte en DINASTIA RP." },
    ],
  }),
  component: MyTickets,
});

function MyTickets() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-tickets", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="container-page py-14">
      <PageHeader
        eyebrow="Soporte"
        title="Mis tickets"
        description="Solo tú y el staff podéis ver estos tickets."
        actions={
          <Button asChild>
            <Link to="/soporte">
              <Plus className="h-4 w-4" /> Abrir ticket
            </Link>
          </Button>
        }
      />

      {isLoading && <p className="mt-10 text-muted-foreground">Cargando…</p>}

      {!isLoading && (data ?? []).length === 0 && (
        <div className="surface-panel mt-10 p-10 text-center">
          <p className="text-muted-foreground">Todavía no has abierto ningún ticket.</p>
          <Button className="mt-5" asChild>
            <Link to="/soporte">Abrir mi primer ticket</Link>
          </Button>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {(data ?? []).map((t) => (
          <Link
            key={t.id}
            to="/mis-tickets/$id"
            params={{ id: t.id }}
            className="surface-panel flex flex-col gap-3 p-5 transition-colors hover:border-primary/40 sm:flex-row sm:items-center"
          >
            <span className="font-mono text-sm text-primary">#{t.number}</span>
            <span className="flex-1 font-medium">{t.subject}</span>
            <span className="text-xs text-muted-foreground">{formatDateTime(t.updated_at)}</span>
            <TicketStatusBadge status={t.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
