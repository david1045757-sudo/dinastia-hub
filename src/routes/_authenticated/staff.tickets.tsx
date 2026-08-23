import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PermissionGate } from "@/components/PermissionGate";
import { TicketStatusBadge } from "@/components/TicketStatusBadge";
import { Button } from "@/components/ui/button";
import { CATEGORIES, STATUS_LABEL, TICKET_STATUSES, formatDateTime } from "@/lib/dinastia";

export const Route = createFileRoute("/_authenticated/staff/tickets")({
  head: () => ({
    meta: [
      { title: "Bandeja de soporte — DINASTIA RP" },
      { name: "description", content: "Gestión de tickets del equipo de staff de DINASTIA RP." },
      { property: "og:title", content: "Bandeja de soporte — DINASTIA RP" },
      { property: "og:description", content: "Panel de tickets del staff." },
    ],
  }),
  component: () => (
    <PermissionGate perm="tickets.view_all">
      <StaffTickets />
    </PermissionGate>
  ),
});

function StaffTickets() {
  const [filter, setFilter] = useState<string>("activos");

  const { data, isLoading } = useQuery({
    queryKey: ["staff-tickets", filter],
    queryFn: async () => {
      let q = supabase.from("tickets").select("*").order("updated_at", { ascending: false });
      if (filter === "activos") q = q.neq("status", "cerrado");
      else if (filter !== "todos") q = q.eq("status", filter);
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  const filters = [
    { value: "activos", label: "Activos" },
    ...TICKET_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s]! })),
    { value: "todos", label: "Todos" },
  ];

  return (
    <div className="container-page py-14">
      <PageHeader
        eyebrow="Staff"
        title="Bandeja de soporte"
        description="Todos los tickets de la comunidad."
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "default" : "outline"}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {isLoading && <p className="mt-8 text-muted-foreground">Cargando tickets…</p>}

      <div className="mt-6 space-y-3">
        {!isLoading && (data ?? []).length === 0 && (
          <div className="surface-panel p-10 text-center text-muted-foreground">
            No hay tickets en este filtro.
          </div>
        )}
        {(data ?? []).map((t) => (
          <Link
            key={t.id}
            to="/staff/tickets/$id"
            params={{ id: t.id }}
            className="surface-panel flex flex-col gap-2 p-5 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:gap-4"
          >
            <span className="font-mono text-sm text-primary">#{t.number}</span>
            <span className="flex-1 font-medium">{t.subject}</span>
            <span className="font-mono text-xs text-muted-foreground">{t.mta_identity}</span>
            <span className="text-xs text-muted-foreground">
              {CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category}
            </span>
            <span className="text-xs text-muted-foreground">{formatDateTime(t.updated_at)}</span>
            <TicketStatusBadge status={t.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
