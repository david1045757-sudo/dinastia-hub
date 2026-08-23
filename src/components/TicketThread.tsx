import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketStatusBadge } from "@/components/TicketStatusBadge";
import { CATEGORIES, PRIORITIES, STATUS_LABEL, TICKET_STATUSES, formatDateTime } from "@/lib/dinastia";

export type TicketRow = {
  id: string;
  number: number;
  user_id: string;
  subject: string;
  category: string;
  mta_identity: string;
  status: string;
  priority: string;
  claimed_by: string | null;
  created_at: string;
  updated_at: string;
};

export function TicketThread({ ticket, backLink }: { ticket: TicketRow; backLink: React.ReactNode }) {
  const { user, hasPerm } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);

  const isOwner = ticket.user_id === user?.id;
  const isStaffAgent = hasPerm("tickets.reply");
  const canInternal = hasPerm("tickets.internal");
  const closed = ticket.status === "cerrado";

  const { data: messages } = useQuery({
    queryKey: ["ticket-messages", ticket.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: people } = useQuery({
    queryKey: ["ticket-people", ticket.id, messages?.length ?? 0],
    queryFn: async () => {
      const ids = new Set<string>([ticket.user_id]);
      (messages ?? []).forEach((m) => ids.add(m.user_id));
      if (ticket.claimed_by) ids.add(ticket.claimed_by);
      const { data } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", Array.from(ids));
      const map: Record<string, string> = {};
      (data ?? []).forEach((p) => {
        map[p.id] = p.username;
      });
      return map;
    },
    enabled: Boolean(messages),
  });

  useEffect(() => {
    const channel = supabase
      .channel(`ticket-${ticket.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_messages",
          filter: `ticket_id=eq.${ticket.id}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["ticket-messages", ticket.id] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [ticket.id, queryClient]);

  function invalidateTicket() {
    void queryClient.invalidateQueries({ queryKey: ["ticket", ticket.id] });
    void queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
    void queryClient.invalidateQueries({ queryKey: ["staff-tickets"] });
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !body.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("ticket_messages").insert({
      ticket_id: ticket.id,
      user_id: user.id,
      body: body.trim(),
      is_internal: internal,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBody("");
    void queryClient.invalidateQueries({ queryKey: ["ticket-messages", ticket.id] });
    invalidateTicket();
  }

  async function patch(values: Record<string, unknown>, successMsg: string) {
    const { error } = await supabase.from("tickets").update(values).eq("id", ticket.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(successMsg);
    invalidateTicket();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <div className="mb-4">{backLink}</div>

        <div className="surface-panel p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm text-primary">#{ticket.number}</span>
            <TicketStatusBadge status={ticket.status} />
          </div>
          <h1 className="mt-3 text-2xl font-semibold">{ticket.subject}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Abierto por {people?.[ticket.user_id] ?? "…"} · {formatDateTime(ticket.created_at)}
          </p>
        </div>

        <div className="mt-5 space-y-3">
          {(messages ?? []).map((m) => (
            <article
              key={m.id}
              className={
                m.is_internal
                  ? "rounded-xl border border-warning/30 bg-warning/5 p-5"
                  : "surface-panel p-5"
              }
            >
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{people?.[m.user_id] ?? "Usuario"}</span>
                {m.user_id === ticket.user_id ? (
                  <span className="text-xs text-muted-foreground">Autor</span>
                ) : (
                  <span className="text-xs text-primary">Staff</span>
                )}
                {m.is_internal && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 px-2 py-0.5 text-[11px] text-warning">
                    <Lock className="h-3 w-3" /> Nota interna
                  </span>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatDateTime(m.created_at)}
                </span>
              </div>
              <p className="mt-3 leading-relaxed whitespace-pre-line text-foreground/90">{m.body}</p>
            </article>
          ))}
        </div>

        {closed ? (
          <p className="surface-panel mt-5 p-5 text-sm text-muted-foreground">
            Este ticket está cerrado.
            {isOwner && " Si necesitas más ayuda, abre uno nuevo."}
          </p>
        ) : (
          (isOwner || isStaffAgent) && (
            <form onSubmit={sendMessage} className="surface-panel mt-5 space-y-4 p-5">
              <Label htmlFor="reply">Responder</Label>
              <Textarea
                id="reply"
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escribe tu respuesta…"
                required
              />
              <div className="flex flex-wrap items-center gap-4">
                {canInternal && (
                  <div className="flex items-center gap-2">
                    <Switch id="internal" checked={internal} onCheckedChange={setInternal} />
                    <Label htmlFor="internal" className="text-sm text-muted-foreground">
                      Nota interna (solo staff)
                    </Label>
                  </div>
                )}
                <Button type="submit" className="ml-auto" disabled={busy}>
                  {busy ? "Enviando…" : "Enviar respuesta"}
                </Button>
              </div>
            </form>
          )
        )}
      </div>

      <aside className="space-y-5">
        <div className="surface-panel p-5">
          <h2 className="text-sm font-semibold tracking-wide uppercase">Detalles</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="MTA" value={<span className="font-mono">{ticket.mta_identity}</span>} />
            <Row
              label="Categoría"
              value={CATEGORIES.find((c) => c.value === ticket.category)?.label ?? ticket.category}
            />
            <Row label="Estado" value={STATUS_LABEL[ticket.status] ?? ticket.status} />
            <Row label="Prioridad" value={ticket.priority} />
            <Row
              label="Reclamado por"
              value={ticket.claimed_by ? (people?.[ticket.claimed_by] ?? "Staff") : "Sin reclamar"}
            />
            <Row label="Actualizado" value={formatDateTime(ticket.updated_at)} />
          </dl>
        </div>

        {isStaffAgent && (
          <div className="surface-panel space-y-4 p-5">
            <h2 className="text-sm font-semibold tracking-wide uppercase">Gestión de staff</h2>

            {hasPerm("tickets.close") && (
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={ticket.status}
                  onValueChange={(v) =>
                    void patch(
                      {
                        status: v,
                        closed_at: v === "cerrado" ? new Date().toISOString() : null,
                        closed_by: v === "cerrado" ? user?.id : null,
                      },
                      "Estado actualizado",
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select
                value={ticket.priority}
                onValueChange={(v) => void patch({ priority: v }, "Prioridad actualizada")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasPerm("tickets.claim") &&
              (ticket.claimed_by === user?.id ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => void patch({ claimed_by: null }, "Ticket liberado")}
                >
                  Liberar ticket
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() =>
                    void patch(
                      { claimed_by: user?.id, status: ticket.status === "abierto" ? "en_proceso" : ticket.status },
                      "Ticket reclamado",
                    )
                  }
                >
                  Reclamar ticket
                </Button>
              ))}
          </div>
        )}

        {isOwner && !closed && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              void patch(
                { status: "cerrado", closed_at: new Date().toISOString(), closed_by: user?.id },
                "Ticket cerrado",
              )
            }
          >
            Cerrar mi ticket
          </Button>
        )}
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
