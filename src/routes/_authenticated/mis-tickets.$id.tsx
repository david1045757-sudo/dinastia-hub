import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TicketThread, type TicketRow } from "@/components/TicketThread";

export const Route = createFileRoute("/_authenticated/mis-tickets/$id")({
  head: () => ({
    meta: [
      { title: "Detalle del ticket — DINASTIA RP" },
      { name: "description", content: "Conversación de tu ticket de soporte en DINASTIA RP." },
      { property: "og:title", content: "Detalle del ticket — DINASTIA RP" },
      { property: "og:description", content: "Conversación de soporte en DINASTIA RP." },
    ],
  }),
  component: TicketDetail,
});

function TicketDetail() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
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
      {(error || (!isLoading && !data)) && (
        <div className="surface-panel p-10 text-center">
          <h1 className="text-xl font-semibold">Ticket no disponible</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No existe o no tienes permiso para verlo.
          </p>
          <Link to="/mis-tickets" className="mt-5 inline-block text-sm text-primary">
            Volver a mis tickets
          </Link>
        </div>
      )}
      {data && (
        <TicketThread
          ticket={data}
          backLink={
            <Link
              to="/mis-tickets"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Mis tickets
            </Link>
          }
        />
      )}
    </div>
  );
}
