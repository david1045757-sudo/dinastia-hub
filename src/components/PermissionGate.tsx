import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function PermissionGate({
  perm,
  anyOf,
  children,
}: {
  perm?: string;
  anyOf?: string[];
  children: React.ReactNode;
}) {
  const { hasPerm, loading } = useAuth();

  if (loading) {
    return <div className="container-page py-20 text-muted-foreground">Cargando…</div>;
  }

  const allowed = perm ? hasPerm(perm) : (anyOf ?? []).some((p) => hasPerm(p));
  if (!allowed) {
    return (
      <div className="container-page py-24 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 text-2xl font-semibold">Acceso restringido</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Tu rango no tiene permiso para acceder a esta sección.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs tracking-[0.3em] text-primary uppercase">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </header>
  );
}
