export const MTA_IDENTITY_REGEX = /^[A-Za-zÁÉÍÓÚÑáéíóúñ]+_[A-Za-zÁÉÍÓÚÑáéíóúñ]+ \d+$/;

export const SHIFT_MAX_MS = 2 * 60 * 60 * 1000;

export const TICKET_STATUSES = ["abierto", "en_proceso", "esperando", "cerrado"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const STATUS_LABEL: Record<string, string> = {
  abierto: "Abierto",
  en_proceso: "En proceso",
  esperando: "Esperando respuesta",
  cerrado: "Cerrado",
};

export const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "cuenta", label: "Cuenta" },
  { value: "bug", label: "Error / Bug" },
  { value: "reporte", label: "Reporte de jugador" },
  { value: "apelacion", label: "Apelación de sanción" },
  { value: "donacion", label: "Donaciones" },
];

export const PRIORITIES = [
  { value: "baja", label: "Baja" },
  { value: "normal", label: "Normal" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

export const ALL_PERMISSIONS: { key: string; label: string; group: string }[] = [
  { key: "tickets.create", label: "Crear tickets", group: "Tickets" },
  { key: "tickets.own", label: "Ver y responder sus tickets", group: "Tickets" },
  { key: "tickets.view_all", label: "Ver todos los tickets", group: "Tickets" },
  { key: "tickets.reply", label: "Responder tickets", group: "Tickets" },
  { key: "tickets.claim", label: "Reclamar tickets", group: "Tickets" },
  { key: "tickets.close", label: "Cerrar y cambiar estado", group: "Tickets" },
  { key: "tickets.internal", label: "Notas internas", group: "Tickets" },
  { key: "staff.shift", label: "Iniciar turnos", group: "Staff" },
  { key: "staff.activity", label: "Ver actividad del staff", group: "Staff" },
  { key: "staff.history_all", label: "Ver historial de todo el staff", group: "Staff" },
  { key: "news.manage", label: "Gestionar noticias", group: "Contenido" },
  { key: "admin.users", label: "Gestionar usuarios", group: "Administración" },
  { key: "admin.ranks", label: "Gestionar rangos", group: "Administración" },
  { key: "admin.servers", label: "Gestionar servidores", group: "Administración" },
  { key: "admin.logs", label: "Ver registros", group: "Administración" },
];

export function serverIsOnline(lastHeartbeat: string | null | undefined) {
  if (!lastHeartbeat) return false;
  return Date.now() - new Date(lastHeartbeat).getTime() < 90_000;
}

export function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function formatHours(ms: number) {
  const total = Math.floor(ms / 60000);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
