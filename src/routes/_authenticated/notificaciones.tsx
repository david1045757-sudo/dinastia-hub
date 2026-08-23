import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useDinastia";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PermissionGate";
import { formatDateTime } from "@/lib/dinastia";

export const Route = createFileRoute("/_authenticated/notificaciones")({
  head: () => ({
    meta: [
      { title: "Notificaciones — DINASTIA RP" },
      {
        name: "description",
        content: "Avisos en tiempo real de tickets, estado del servidor y actividad del staff.",
      },
      { property: "og:title", content: "Notificaciones — DINASTIA RP" },
      { property: "og:description", content: "Tus avisos en DINASTIA RP." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { notifications, unread, markAllRead, refetch } = useNotifications();

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    refetch();
  }

  return (
    <div className="container-page py-14">
      <PageHeader
        eyebrow="Actividad"
        title="Notificaciones"
        description={unread > 0 ? `Tienes ${unread} sin leer.` : "Estás al día."}
        actions={
          unread > 0 ? (
            <Button variant="outline" onClick={() => void markAllRead()}>
              <CheckCheck className="h-4 w-4" /> Marcar todas como leídas
            </Button>
          ) : null
        }
      />

      <div className="mt-8 space-y-3">
        {notifications.length === 0 && (
          <div className="surface-panel p-12 text-center">
            <Bell className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No tienes notificaciones todavía.</p>
          </div>
        )}

        {notifications.map((n) => {
          const inner = (
            <>
              <div className="flex flex-wrap items-center gap-3">
                {!n.read_at && <span className="h-2 w-2 rounded-full bg-primary" />}
                <span className="font-medium">{n.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatDateTime(n.created_at)}
                </span>
              </div>
              {n.body && <p className="mt-2 text-sm text-muted-foreground">{n.body}</p>}
            </>
          );

          const className = `surface-panel block p-5 transition-colors hover:border-primary/40 ${
            n.read_at ? "opacity-70" : ""
          }`;

          return n.ticket_id ? (
            <Link
              key={n.id}
              to="/mis-tickets/$id"
              params={{ id: n.ticket_id }}
              className={className}
              onClick={() => void markRead(n.id)}
            >
              {inner}
            </Link>
          ) : (
            <button
              key={n.id}
              type="button"
              className={`${className} w-full text-left`}
              onClick={() => void markRead(n.id)}
            >
              {inner}
            </button>
          );
        })}
      </div>
    </div>
  );
}
