--[[
  dinastia_web — Recurso Lua para MTA:SA
  Envía el estado del servidor y la lista de jugadores a la plataforma DINASTIA RP.

  Instalación:
    1. Copia esta carpeta a: <mta-server>/mods/deathmatch/resources/dinastia_web
    2. Edita las variables WEB_URL, SERVER_ID y HEARTBEAT_SECRET abajo.
    3. Añade el recurso a server.cfg:  start dinastia_web
    4. Reinicia el servidor MTA.

  El recurso envía un heartbeat cada 30 segundos a:
    POST  WEB_URL/api/public/mta/heartbeat
    Header: X-Heartbeat-Secret: <HEARTBEAT_SECRET>
    Body (JSON):
      {
        "server_id":     "UUID del servidor en la web",
        "players_online": 42,
        "max_players":    100,
        "mta_version":    "1.6.0",
        "is_open":        true,
        "players": [
          { "identity": "Nombre_Apellido 123", "username": "nick_jugador" }
        ]
      }
]]

local WEB_URL = "https://TU-WEB.lovable.app"  -- Sin barra final
local SERVER_ID = "530ecf45-1330-449c-9de7-0ed8bd57e355"  -- UUID de tu servidor
local HEARTBEAT_SECRET = "PEGA_AQUI_EL_SECRETO"  -- MTA_HEARTBEAT_SECRET de la web

local HEARTBEAT_INTERVAL = 30000  -- 30 segundos (ms)
local HEARTBEAT_ENDPOINT = "/api/public/mta/heartbeat"

-- ============================================================
--  Utilidades
-- ============================================================

-- Devuelve el identity "Nombre_Apellido ID" si el jugador tiene cuenta
-- dinámica; si no, usa el nick de MTA.
local function getPlayerIdentity(player)
    local account = getPlayerAccount(player)
    if account and not isGuestAccount(account) then
        local name = getAccountName(account)
        -- Si la cuenta ya tiene formato "Nombre_Apellido" úsala
        if string.match(name, "^[%aáéíóúñÁÉÍÓÚÑ]+_[%aáéíóúñÁÉÍÓÚÑ]+$") then
            local id = getElementData(player, "player:id") or getPlayerSerial(player)
            return name .. " " .. tostring(id)
        end
    end
    return getPlayerName(player)
end

local function buildPayload()
    local players = getElementsByType("player")
    local online = 0
    local presence = {}

    for _, plr in ipairs(players) do
        online = online + 1
        table.insert(presence, {
            identity = getPlayerIdentity(plr),
            username = getPlayerName(plr),
        })
    end

    local maxSlots = getMaxPlayers()
    local version = getVersion().sortable or "unknown"

    return {
        server_id = SERVER_ID,
        players_online = online,
        max_players = maxSlots,
        mta_version = tostring(version),
        is_open = true,  -- o usa tu variable de servidor_abierto
        closed_reason = nil,
        players = presence,
    }
end

local function sendHeartbeat()
    local payload = buildPayload()
    local body = toJSON(payload, true)  -- JSON compacto

    fetchRemote(WEB_URL .. HEARTBEAT_ENDPOINT, {
        method = "POST",
        headers = {
            ["Content-Type"] = "application/json",
            ["X-Heartbeat-Secret"] = HEARTBEAT_SECRET,
        },
        postData = body,
    }, function(responseData, errno)
        if errno ~= 0 then
            outputDebugString("[dinastia_web] Heartbeat fallido (errno=" .. tostring(errno) .. ")", 2)
        else
            outputDebugString("[dinastia_web] Heartbeat OK: " .. tostring(responseData), 3)
        end
    end)
end

-- ============================================================
--  Bucle principal
-- ============================================================

local heartbeatTimer

addEventHandler("onResourceStart", resourceRoot, function()
    outputDebugString("[dinastia_web] Recurso iniciado. Enviando heartbeat cada " ..
        tostring(HEARTBEAT_INTERVAL / 1000) .. "s", 3)
    sendHeartbeat()  -- envío inmediato
    heartbeatTimer = setTimer(sendHeartbeat, HEARTBEAT_INTERVAL, 0)
end)

addEventHandler("onResourceStop", resourceRoot, function()
    if isTimer(heartbeatTimer) then
        killTimer(heartbeatTimer)
    end
end)

-- ============================================================
--  Comando manual de prueba (solo admins)
-- ============================================================

addCommand("webping", function(player, command)
    if not hasObjectPermissionTo(player, "command.ban", false) then
        return  -- solo administradores
    end
    sendHeartbeat()
    outputChatBox("[dinastia_web] Heartbeat enviado manualmente.", player, 0, 200, 100)
end)
