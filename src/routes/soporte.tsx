import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { NewTicketForm } from "@/components/NewTicketForm";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/soporte")({
  head: () => ({
    meta: [
      { title: "Soporte — DINASTIA RP" },
      {
        name: "description",
        content:
          "Abre un ticket de soporte en DINASTIA RP. El staff responde tus dudas, reportes y apelaciones.",
      },
      { property: "og:title", content: "Soporte — DINASTIA RP" },
      { property: "og:description", content: "Sistema de tickets de soporte de DINASTIA RP." },
    ],
  }),
  component: SupportPage,
});

const guidelines = [
  "Usa el formato Nombre_Apellido ID tal y como aparece dentro del servidor.",
  "Describe el problema con detalle: qué pasó, cuándo y qué esperabas.",
  "Solo tú y el staff podréis ver tu ticket.",
  "Recibirás una notificación cuando el staff responda.",
];

function SupportPage() {
  const { user } = useAuth();

  return (
    <div className="container-page py-14">
      <header className="max-w-2xl">
        <p className="text-xs tracking-[0.3em] text-primary uppercase">Soporte</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">¿Necesitas ayuda?</h1>
        <p className="mt-3 text-muted-foreground">
          Abre un ticket y nuestro equipo te atenderá lo antes posible.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="surface-panel p-6">
          {user ? (
            <NewTicketForm />
          ) : (
            <div className="py-8 text-center">
              <h2 className="text-xl font-semibold">Inicia sesión para abrir un ticket</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Crear una cuenta es gratis y te permite seguir tus tickets y recibir notificaciones.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild>
                  <Link to="/auth" search={{ modo: "registro" }}>
                    Registrarse
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/auth">Iniciar sesión</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        <aside className="surface-panel h-fit p-6">
          <h2 className="text-lg font-semibold">Antes de enviar</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {guidelines.map((g) => (
              <li key={g} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
