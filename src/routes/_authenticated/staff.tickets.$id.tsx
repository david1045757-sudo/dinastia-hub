import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PermissionGate } from "@/components/PermissionGate";
import { TicketThread, type TicketRow } from "@/components/TicketThread";

export const Route = createFileRoute("/_authenticated/staff/tickets/$id")({
  head: () => ({
    meta: [
      { title: "Ticket · Staff — DINASTIA RP" },
      { name: "description", content: "Gestión de un ticket de soporte de DINASTIA RP." },
      { property: "og:title", content: "Ticket · Staff — DINASTIA RP" },
      { property: "og:description", content: "Gestión de soporte del staff." },
    ],
  }),
  component: () => (
    <PermissionGate perm="tickets.view_all">
      <StaffTicketDetail />
    </PermissionGate>
  ),
});

function StaffTicketDetail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("tickets").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as TicketRow | null;
    },
  });

  return (
    <div className="container-page py-14">
      {isLoading && <p className="text-muted-foreground">Cargando ticket…</p>}
      {!isLoading && !data && (
        <div className="surface-panel p-10 text-center text-muted-foreground">
          Este ticket no existe.
        </div>
      )}
      {data && (
        <TicketThread
          ticket={data}
          backLink={
            <Link
              to="/staff/tickets"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Bandeja de soporte
            </Link>
          }
        />
      )}
    </div>
  );
}
