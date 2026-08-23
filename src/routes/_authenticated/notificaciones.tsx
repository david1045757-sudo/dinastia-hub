import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  const { data, unread, refetch } = useNotifications();
  const navigate = useNavigate();
  const notifications = data ?? [];

  async function open(id: string, link: string | null) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    void refetch();
    if (link) void navigate({ to: link });
  }

  async function markAllRead() {
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    void refetch();
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

        {notifications.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => void open(n.id, n.link)}
            className={`surface-panel block w-full p-5 text-left transition-colors hover:border-primary/40 ${
              n.read ? "opacity-60" : ""
            }`}
          >
            <div className="flex flex-wrap items-center gap-3">
              {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
              <span className="font-medium">{n.title}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {formatDateTime(n.created_at)}
              </span>
            </div>
            {n.body && <p className="mt-2 text-sm text-muted-foreground">{n.body}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}
