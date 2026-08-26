const API_URL = "https://api.nyrox.store";

export const DINASTIA_SERVER_ID =
  "530ecf45-1330-449c-9de7-0ed8bd57e355";

export interface MtaPlayer {
  identity: string;
  username: string | null;
  last_seen: string;
}

export interface MtaServerStatus {
  success: boolean;
  online: boolean;
  server_id: string;
  name: string;
  address: string | null;
  players_online: number;
  max_players: number;
  mta_version: string;
  is_open: boolean;
  closed_reason: string | null;
  players: MtaPlayer[];
  last_heartbeat: string;
  seconds_since_heartbeat: number;
}

export async function getMtaServerStatus(): Promise<MtaServerStatus> {
  const response = await fetch(
    `${API_URL}/api/mta/status/${DINASTIA_SERVER_ID}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Error consultando API MTA: ${response.status}`
    );
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(
      data.error || "La API no devolvio un estado valido"
    );
  }

  return data;
}
