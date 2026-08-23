import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/70">
      <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="brand-title text-sm">
            <span className="text-primary">DINASTIA</span> RP
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Comunidad de rol para MTA:SA. Tu historia comienza aquí.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link to="/servidor" className="hover:text-primary">
            Servidor
          </Link>
          <Link to="/soporte" className="hover:text-primary">
            Soporte
          </Link>
          <Link to="/noticias" className="hover:text-primary">
            Noticias
          </Link>
        </nav>
      </div>
      <div className="container-page pb-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} DINASTIA RP. Todos los derechos reservados.
      </div>
    </footer>
  );
}
