import { StatusPill } from "@/components/StatusPill";
import { STATUS_LABEL } from "@/lib/dinastia";

export function TicketStatusBadge({ status }: { status: string }) {
  const tone =
    status === "abierto"
      ? "online"
      : status === "en_proceso"
        ? "sky"
        : status === "esperando"
          ? "warning"
          : "neutral";
  return <StatusPill tone={tone}>{STATUS_LABEL[status] ?? status}</StatusPill>;
}
