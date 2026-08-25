import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";
import type { Database } from "@/integrations/supabase/types";

/**
 * Endpoint público de heartbeat para el recurso Lua `dinastia_web`.
 * Ruta: POST /api/public/mta/heartbeat
 *
 * El recurso Lua envía una señal cada 30 segundos con:
 *  - el estado del servidor (jugadores online, versión, abierto/cerrado)
 *  - la lista de jugadores conectados (identidad MTA "Nombre_Apellido ID")
 *
 * Autenticación: cabecera `X-Heartbeat-Secret` con un secreto compartido
 * almacenado en MTA_HEARTBEAT_SECRET. Sin él, la petición se rechaza (401).
 *
 * Usa el cliente de servicio (service role) que bypassa RLS, porque el
 * llamador es un servidor MTA, no un usuario autenticado de la web.
 */

interface PlayerPresence {
  identity: string; // "Nombre_Apellido 123"
  username?: string | null;
}

interface HeartbeatPayload {
  server_id: string; // UUID de la fila en `servers`
  players_online: number;
  max_players?: number;
  mta_version?: string;
  is_open?: boolean;
  closed_reason?: string | null;
  players?: PlayerPresence[]; // Lista de jugadores conectados
}

export const Route = createFileRoute("/api/public/mta/heartbeat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Verificar el secreto compartido (timing-safe)
        const secret = process.env["MTA_HEARTBEAT_SECRET"];
        const provided = request.headers.get("x-heartbeat-secret");

        if (!secret || !provided) {
          return json({ error: "No autorizado." }, 401);
        }

        const a = Buffer.from(provided);
        const b = Buffer.from(secret);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return json({ error: "No autorizado." }, 401);
        }

        // 2. Parsear y validar el cuerpo
        let body: HeartbeatPayload;
        try {
          body = (await request.json()) as HeartbeatPayload;
        } catch {
          return json({ error: "JSON inválido." }, 400);
        }

        if (!body.server_id || typeof body.server_id !== "string") {
          return json({ error: "Falta server_id." }, 400);
        }
        if (typeof body.players_online !== "number") {
          return json({ error: "Falta players_online." }, 400);
        }

        // 3. Cliente de servicio (bypassa RLS)
        const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
        const supabaseUrl = process.env["SUPABASE_URL"]!;
        const admin = createClient<Database>(supabaseUrl, serviceKey, {
          auth: { persistSession: false },
        });

        // 4. Actualizar el servidor
        const nowIso = new Date().toISOString();
        const serverUpdate: Database["public"]["Tables"]["servers"]["Update"] = {
          last_heartbeat: nowIso,
          players_online: body.players_online,
          updated_at: nowIso,
        };
        if (typeof body.max_players === "number") serverUpdate.max_players = body.max_players;
        if (typeof body.mta_version === "string") serverUpdate.mta_version = body.mta_version;
        if (typeof body.is_open === "boolean") serverUpdate.is_open = body.is_open;
        if (body.closed_reason !== undefined) serverUpdate.closed_reason = body.closed_reason;

        const { error: srvErr } = await admin
          .from("servers")
          .update(serverUpdate)
          .eq("id", body.server_id);

        if (srvErr) {
          return json({ error: `Error servidor: ${srvErr.message}` }, 500);
        }

        // 5. Sincronizar presencia de jugadores (upsert por mta_identity)
        const players = Array.isArray(body.players) ? body.players : [];

        if (players.length > 0) {
          const rows = players.map((p) => ({
            mta_identity: p.identity,
            username: p.username ?? null,
            server_id: body.server_id,
            last_seen: nowIso,
          }));

          const { error: presErr } = await admin
            .from("mta_presence")
            .upsert(rows, { onConflict: "mta_identity" });

          if (presErr) {
            return json({ error: `Error presencia: ${presErr.message}` }, 500);
          }
        }

        // 6. Marcar como desconectados a los jugadores que ya no están
        const knownIdentities = players.map((p) => p.identity);
        const { data: existing } = await admin
          .from("mta_presence")
          .select("id,mta_identity")
          .eq("server_id", body.server_id);

        if (existing && existing.length > 0) {
          const toRemove = existing
            .filter((row) => !knownIdentities.includes(row.mta_identity))
            .map((row) => row.id);

          if (toRemove.length > 0) {
            await admin.from("mta_presence").delete().in("id", toRemove);
          }
        }

        return json({ ok: true, received: players.length }, 200);
      },
    },
  },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
