# Dinastia Connect

# DINASTIA RP — Plataforma comunitaria, soporte y gestión de Staff

Quiero desarrollar una **plataforma web oficial para mi servidor MTA:SA DINASTIA RP**.

IMPORTANTE: **NO quiero que la web sea principalmente un panel administrativo.**

La web debe ser principalmente una **plataforma para los jugadores y la comunidad de DINASTIA RP**, con una sección adicional de Staff/Administración que solamente sea visible y accesible para usuarios con los permisos correspondientes.

La experiencia principal debe estar orientada a:

* Jugadores.
* Comunidad.
* Información del servidor.
* Soporte.
* Tickets.
* Perfil de usuario.
* Notificaciones.

El área administrativa debe existir, pero debe estar separada y protegida por rangos.

---

# 1. CONCEPTO GENERAL

La web debe funcionar de esta manera:

```text
                    DINASTIA RP
                         │
          ┌──────────────┴──────────────┐
          │                             │
      COMUNIDAD                       STAFF
          │                             │
   Jugadores normales          Usuarios con rango
          │                             │
   ├── Inicio                  ├── Tickets
   ├── Servidor                ├── Actividad
   ├── Soporte                 ├── Usuarios
   ├── Mis tickets             ├── Servidores
   ├── Perfil                  ├── Logs
   └── Notificaciones          └── Administración
```

La parte pública/comunitaria debe ser el centro de la experiencia.

---

# 2. DISEÑO VISUAL

Quiero una interfaz:

* Moderna.
* Limpia.
* Elegante.
* Minimalista.
* Profesional.
* Rápida.
* Muy responsive.
* Fácil de utilizar.

El color principal de DINASTIA RP debe ser:

**AZUL CIELO CLARO**

El azul cielo debe utilizarse como color de identidad, especialmente en:

* Botones.
* Links.
* Estados activos.
* Iconos.
* Elementos destacados.
* Indicadores.
* Bordes/accentos.

No quiero que toda la página sea azul.

Utilizar un fondo oscuro elegante con diferentes tonos neutros.

La combinación debe sentirse moderna y premium.

Evitar:

* Interfaces saturadas.
* Demasiadas tarjetas.
* Demasiados gráficos.
* Gradientes exagerados.
* Efectos luminosos excesivos.
* Diseño genérico de panel administrativo.

La regla visual debe ser:

**MENOS ES MÁS.**

---

# 3. PÁGINA PRINCIPAL

La página principal debe ser para cualquier persona, incluso sin cuenta.

Debe mostrar:

```text id="3b4q4h"
DINASTIA RP

Inicio
Servidor
Soporte

[ INICIAR SESIÓN ]
[ REGISTRARSE ]
```

En el centro:

```text id="9v6w0u"
DINASTIA RP

Tu historia comienza aquí.

🟢 SERVIDOR ONLINE

47 / 100 jugadores

🟢 SERVIDOR ABIERTO

[ JUGAR AHORA ]
[ ABRIR TICKET ]
```

También mostrar información básica del servidor.

No llenar la página de estadísticas innecesarias.

---

# 4. ESTADO DEL SERVIDOR

La web debe estar conectada al servidor MTA.

Debe mostrar:

### Estado técnico

```text id="px3w2a"
🟢 ONLINE
```

o:

```text id="5t9h0m"
🔴 OFFLINE
```

### Estado administrativo

```text id="0x7w4f"
🟢 ABIERTO
```

o:

```text id="j8q1mz"
🔴 CERRADO
```

Estos estados son independientes.

Ejemplo:

```text id="v9y3m2"
🟢 ONLINE
🔴 CERRADO
```

significa que el servidor está funcionando pero está cerrado al público.

Mostrar también:

* Jugadores conectados.
* Capacidad.
* Nombre del servidor.
* Versión de MTA.
* Cantidad de servidores online.

---

# 5. REGISTRO DE USUARIOS

Cualquier persona debe poder registrarse en la plataforma.

El usuario debe elegir:

* Nombre de usuario único.
* Correo electrónico.
* Contraseña.

El **nombre de usuario debe ser único**.

Ejemplo:

```text id="3j7d9e"
Nombre de usuario:
Johan_David

Correo:
usuario@email.com

Contraseña:
************

[ CREAR CUENTA ]
```

No permitir dos usuarios con el mismo nombre.

---

# 6. PRIMER USUARIO

Hay una excepción importante.

Si la plataforma todavía no tiene ningún usuario registrado:

**el primer usuario registrado automáticamente será el Dueño.**

Ejemplo:

```text id="y8c3vb"
Johan_David
👑 Dueño
```

El primer usuario tendrá todos los permisos.

Después de crear ese usuario:

* Ningún usuario nuevo podrá elegir ser Dueño.
* Ningún usuario podrá elegir su propio rango.
* Los rangos solo podrán ser asignados desde la administración.
* El Dueño será quien controle los rangos y permisos.

Los usuarios posteriores serán:

```text id="p1x5z8"
Usuario
```

por defecto.

---

# 7. USUARIO NORMAL

Cualquier usuario registrado debe tener acceso a:

```text id="k7r3qa"
Inicio
Servidor
Mis Tickets
Notificaciones
Perfil
```

Puede:

* Ver el estado del servidor.
* Ver jugadores conectados.
* Registrarse.
* Iniciar sesión.
* Abrir tickets.
* Ver sus propios tickets.
* Responder sus propios tickets.
* Cerrar sus propios tickets.
* Recibir notificaciones.
* Gestionar su perfil.

No puede:

* Ver tickets de otras personas.
* Responder tickets de otras personas.
* Ver notas internas.
* Ver actividad Staff.
* Ver usuarios administrativos.
* Gestionar servidores.
* Gestionar rangos.
* Ver logs administrativos.

---

# 8. SISTEMA DE TICKETS

Este será uno de los sistemas principales de la plataforma.

**Cualquier usuario registrado puede abrir un ticket.**

No necesita tener rango.

Debe existir un botón:

```text id="9r4w2v"
[ ABRIR TICKET ]
```

El ticket debe solicitar:

### Nombre e ID de MTA

Formato obligatorio:

```text id="f4m8x1"
Nombre_Apellido ID
```

Ejemplo:

```text id="g5v2nz"
Johan_David 1
```

El formato debe validarse tanto en frontend como en backend.

### Válidos

```text id="q7k2m9"
Johan_David 1
Carlos_Perez 25
Maria_Gomez 103
```

### Inválidos

```text id="r6y8pq"
Johan David 1
Johan_David
Johan_David abc
JohanDavid 1
Johan_David-1
```

No permitir crear el ticket si el formato es incorrecto.

El nombre e ID introducidos deben quedar registrados permanentemente en el ticket.

El usuario no debe poder modificarlos posteriormente.

---

# 9. VISIBILIDAD DE LOS TICKETS

Este punto es MUY IMPORTANTE.

### Usuario normal

Puede ver exclusivamente:

```text id="c6t4pq"
MIS TICKETS
```

Nunca debe poder ver tickets de otras personas.

Por ejemplo:

```text id="n4y8zm"
Johan_David

#1042 — Problema con cuenta
#1038 — Problema con vehículo
```

Pero no:

```text id="x3q7va"
Todos los tickets
```

### Staff

Los usuarios con un rango que tenga permiso de soporte podrán:

* Ver tickets de todos.
* Responder tickets.
* Reclamar tickets.
* Liberar tickets.
* Cambiar estados.
* Cerrar tickets.
* Añadir notas internas.

---

# 10. RANGOS

Crear un sistema de rangos y permisos.

Rangos iniciales:

```text id="p6d2kf"
Usuario
Soporte
Moderador
Administrador
Dueño
```

El sistema debe permitir posteriormente crear rangos personalizados.

Cada rango debe tener permisos independientes.

Por ejemplo:

### Usuario

```text id="x2c8ra"
Crear tickets
Ver sus tickets
Responder sus tickets
```

### Soporte

```text id="a7v5qn"
Ver tickets
Responder tickets
Reclamar tickets
Cerrar tickets
```

### Moderador

```text id="m4p9zx"
Todo lo anterior
+ permisos de moderación
```

### Administrador

```text id="b8n2cy"
Todo lo anterior
+ gestionar usuarios
+ gestionar servidores
+ ver logs
```

### Dueño

```text id="k5w7sd"
CONTROL TOTAL
```

El Dueño podrá crear, editar y eliminar rangos y configurar sus permisos.

---

# 11. ÁREA DE STAFF

La sección Staff **NO debe aparecer para usuarios normales**.

Cuando un usuario tenga un rango con permisos Staff, aparecerá una sección adicional:

```text id="z6x3w8"
Staff
```

Dentro:

```text id="d2p7vm"
Tickets
Actividad
Historial
```

Si además tiene permisos administrativos:

```text id="q8y4nb"
Administración
Usuarios
Servidores
Rangos
Logs
```

Las opciones deben aparecer dinámicamente según los permisos.

---

# 12. SISTEMA DE ACTIVIDAD DEL STAFF

Todo usuario que tenga un rango Staff podrá indicar si está trabajando.

Cuando el Staff entre al servidor MTA debe entrar también a la web con sus credenciales.

En su panel:

```text id="r3x8vp"
MI ACTIVIDAD

🔴 NO TRABAJANDO

[ INICIAR TURNO ]
```

Cuando pulse:

**INICIAR TURNO**

mostrar:

```text id="t7m4zk"
🟢 TRABAJANDO

Inicio:
15:30

Tiempo:
01:24:32

Finaliza automáticamente:
17:30

MTA:
🟢 CONECTADO

[ FINALIZAR TURNO ]
```

Cada turno debe tener una duración máxima de:

**2 HORAS**

Después de 2 horas debe finalizar automáticamente.

---

# 13. PRESENCIA DEL STAFF EN MTA

La web debe utilizar la conexión existente con el recurso Lua de MTA.

Debe poder saber si el Staff está realmente conectado al servidor.

Ejemplo:

```text id="v5p8qs"
Johan_David
Administrador

🟢 TURNO ACTIVO
🟢 CONECTADO AL MTA

01:24:32
```

Si tiene turno activo pero abandonó el servidor:

```text id="n9c4wy"
Johan_David
Administrador

🟢 TURNO ACTIVO
🔴 NO CONECTADO AL MTA
```

Esto permitirá a los administradores saber quién realmente está dentro del servidor.

No finalizar automáticamente el turno solo porque se desconecte, a menos que posteriormente se configure esa opción.

---

# 14. PANEL DE ACTIVIDAD STAFF

Los usuarios con permisos suficientes podrán ver:

```text id="j7m2vc"
ACTIVIDAD DEL STAFF

🟢 Johan_David
Administrador
01:24:32
MTA conectado

🟢 Carlos_Perez
Moderador
00:45:20
MTA conectado

🔴 Maria_Gomez
Soporte
No trabajando
```

Mostrar:

```text id="x8q5vn"
18 Staff

6 trabajando
12 no trabajando
```

---

# 15. HISTORIAL DE ACTIVIDAD

Cada Staff podrá consultar sus propios turnos.

Los administradores podrán consultar los turnos del Staff.

Mostrar:

```text id="w4m7kp"
Johan_David

Hoy

12:00 — 14:00
2 horas

15:30 — 17:30
2 horas

Total:
4 horas
```

Filtros:

* Hoy.
* Ayer.
* Últimos 7 días.
* Últimos 30 días.
* Personalizado.

Registrar:

* Inicio.
* Finalización.
* Duración.
* Finalización automática/manual.
* Usuario.
* Rango.
* Servidor.

---

# 16. PERFIL DEL USUARIO

Cada usuario tendrá un perfil.

Ejemplo:

```text id="c8v2qm"
Johan_David

Miembro desde:
23/08/2026

Rango:
Usuario

Tickets:
16
```

Para Staff:

```text id="p7x4na"
Johan_David

👑 Administrador

Miembro desde:
23/08/2026

Tickets atendidos:
42

Horas Staff:
36h 24m
```

El perfil debe ser limpio y no mostrar información sensible.

---

# 17. NOTIFICACIONES

Crear un sistema de notificaciones.

Mostrar una campana:

```text id="k9v3wq"
🔔
```

Con contador cuando existan notificaciones.

Para jugadores:

* Respuesta a ticket.
* Ticket cerrado.
* Cambio de estado.
* Avisos importantes.

Para Staff:

* Nuevo ticket.
* Nueva respuesta.
* Ticket reclamado.
* Ticket cerrado.
* Turno terminado.
* Avisos administrativos.

Para administradores:

* Cambios administrativos.
* Servidor offline.
* Servidor online.
* Acciones importantes.

Las notificaciones deben actualizarse en tiempo real cuando sea posible.

---

# 18. NOTICIAS / ANUNCIOS

La página también debe poder tener una sección de noticias o anuncios de DINASTIA RP.

Ejemplo:

```text id="u6m4bx"
Noticias

Nueva actualización del servidor
23/08/2026

Nuevo sistema de trabajos
20/08/2026

Nueva tienda
18/08/2026
```

Los usuarios normales pueden leer las noticias.

Los usuarios con permiso administrativo podrán crearlas, editarlas y eliminarlas.

---

# 19. SECCIÓN DE SERVIDOR

Crear una página:

**Servidor**

Mostrar:

```text id="q4x8zm"
DINASTIA RP

🟢 ONLINE

47 / 100

🟢 ABIERTO

MTA:SA 1.6

[ CONECTAR AL SERVIDOR ]
```

Si está cerrado:

```text id="p8y2vc"
🟢 ONLINE

🔴 CERRADO

El servidor está temporalmente cerrado.
```

---

# 20. ÁREA ADMINISTRATIVA

La administración debe ser una **sección secundaria**, no el centro de la web.

Solo usuarios con los permisos adecuados podrán verla.

Puede incluir:

```text id="m5q9xk"
Administración

Usuarios
Rangos
Servidores
Actividad Staff
Logs
Configuración
```

Cada sección debe estar protegida individualmente mediante permisos.

---

# 21. LOGS

Registrar acciones importantes:

* Registro de usuario.
* Cambios de rango.
* Cambios de permisos.
* Creación de tickets.
* Respuestas.
* Cierres.
* Inicio de turnos.
* Finalización de turnos.
* Cambios de servidor.
* Apertura/cierre del servidor.
* Acciones administrativas.

Ejemplo:

```text id="n7c3vp"
23/08/2026 15:30

Johan_David
Administrador

Inició turno Staff

Servidor:
DINASTIA RP
```

---

# 22. SEGURIDAD

Los permisos deben estar implementados realmente en backend.

Nunca confiar solamente en el frontend.

Un usuario normal no debe poder obtener información de otros usuarios simplemente llamando una API directamente.

Ejemplo:

```text id="q8m4zx"
GET /api/tickets/all
```

Si no tiene permiso:

```text id="r5y7vn"
403 Forbidden
```

Esto aplica a:

* Tickets.
* Mensajes.
* Notas internas.
* Usuarios.
* Rangos.
* Logs.
* Actividad Staff.
* Servidores.
* Administración.

---

# 23. INTEGRACIÓN MTA

Mantener la integración existente:

```text id="a4z8mc"
/api/public/mta/heartbeat
```

y el recurso:

```text id="w6q2vp"
dinastia_web
```

El recurso MTA debe enviar al backend la información necesaria para:

* Estado del servidor.
* Jugadores conectados.
* Capacidad.
* Estado del servidor.
* Presencia de Staff.
* Verificación de jugadores.

No romper la integración existente.

---

# 24. RESPONSIVE

La plataforma debe estar diseñada para funcionar perfectamente en:

* PC.
* Laptop.
* Tablet.
* Android.
* iPhone.

En móvil:

* Menú compacto.
* Navegación sencilla.
* Tickets fáciles de utilizar.
* Botones grandes.
* Formularios cómodos.
* Notificaciones accesibles.
* Perfil adaptado.
* Área Staff adaptada.
* Sin scroll horizontal innecesario.

---

# 25. NAVEGACIÓN

Para un usuario normal:

```text id="z5x7qp"
DINASTIA RP

Inicio
Servidor
Soporte
Mis Tickets
Noticias

🔔
Perfil

[ Cerrar sesión ]
```

Para Staff:

```text id="j3v8mc"
DINASTIA RP

Inicio
Servidor
Soporte
Mis Tickets
Noticias

Staff
  Tickets
  Actividad
  Historial

🔔
Perfil
```

Para Administradores/Dueño:

```text id="p9w4zk"
DINASTIA RP

Inicio
Servidor
Soporte
Mis Tickets
Noticias

Staff
  Tickets
  Actividad
  Historial

Administración
  Usuarios
  Rangos
  Servidores
  Logs

🔔
Perfil
```

Las opciones deben aparecer según los permisos del usuario.

---

# 26. EXPERIENCIA GENERAL

La plataforma debe sentirse como:

**"La página oficial de la comunidad de DINASTIA RP"**

y NO como:

**"Un panel administrativo al que casualmente pueden entrar jugadores."**

El jugador debe sentir que la web está hecha para él.

El Staff debe tener herramientas adicionales.

Los administradores deben tener todavía más herramientas.

El Dueño debe tener control total.

La jerarquía debe ser:

```text
👤 JUGADOR
    ↓
👮 STAFF
    ↓
🛡️ ADMINISTRADOR
    ↓
👑 DUEÑO
```

Cada nivel hereda las funciones del anterior y obtiene permisos adicionales.

---

# 27. OBJETIVO FINAL

Crear una plataforma web oficial de DINASTIA RP donde:

* Cualquier persona pueda registrarse.
* Cada usuario tenga un nombre único.
* El primer usuario sea automáticamente Dueño.
* Los usuarios normales puedan abrir tickets.
* Los usuarios normales solo puedan ver sus propios tickets.
* Los usuarios con rango puedan ver y responder tickets.
* El Staff pueda gestionar su actividad.
* Los turnos duren máximo 2 horas.
* La web pueda comprobar la presencia del Staff en MTA.
* Existan notificaciones.
* Existan noticias.
* Existan perfiles.
* Se pueda consultar el estado del servidor.
* Exista una sección administrativa separada.
* Los rangos controlen los permisos.
* El backend proteja realmente todos los permisos.
* La integración con MTA funcione en tiempo real.
* La plataforma sea rápida y completamente responsive.

**La prioridad absoluta del diseño debe ser que la web se sienta como una comunidad de DINASTIA RP, no como un panel administrativo.**

Diseño:

**Azul cielo claro + fondo oscuro + limpio + minimalista + moderno + profesional + responsive.**

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://dinastia-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/486c1a6a-489d-4451-9655-d140ffa01a31).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
