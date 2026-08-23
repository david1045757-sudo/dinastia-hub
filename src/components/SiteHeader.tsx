import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, LogOut, Menu, ShieldCheck, User as UserIcon, Crown } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/hooks/useDinastia";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string };

export function SiteHeader() {
  const { user, profile, rank, isStaff, isAdmin, hasPerm, signOut } = useAuth();
  const { unread } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const main: NavItem[] = [
    { to: "/", label: "Inicio" },
    { to: "/servidor", label: "Servidor" },
    { to: "/soporte", label: "Soporte" },
    { to: "/noticias", label: "Noticias" },
  ];
  if (user) main.push({ to: "/mis-tickets", label: "Mis tickets" });

  const staffItems: NavItem[] = [];
  if (hasPerm("tickets.view_all")) staffItems.push({ to: "/staff/tickets", label: "Tickets" });
  if (hasPerm("staff.activity")) staffItems.push({ to: "/staff/actividad", label: "Actividad" });
  if (isStaff) staffItems.push({ to: "/staff/historial", label: "Historial" });

  const adminItems: NavItem[] = [];
  if (hasPerm("admin.users")) adminItems.push({ to: "/admin/usuarios", label: "Usuarios" });
  if (hasPerm("admin.ranks")) adminItems.push({ to: "/admin/rangos", label: "Rangos" });
  if (hasPerm("admin.servers")) adminItems.push({ to: "/admin/servidores", label: "Servidores" });
  if (hasPerm("news.manage")) adminItems.push({ to: "/admin/noticias", label: "Noticias" });
  if (hasPerm("admin.logs")) adminItems.push({ to: "/admin/logs", label: "Registros" });

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    void navigate({ to: "/", replace: true });
  }

  const linkClass = (to: string) =>
    cn(
      "rounded-md px-3 py-2 text-sm transition-colors",
      pathname === to || (to !== "/" && pathname.startsWith(to))
        ? "text-primary bg-primary/10"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center gap-3">
        <Link to="/" className="brand-title mr-2 text-base text-foreground">
          <span className="text-primary">DINASTIA</span> RP
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {main.map((item) => (
            <Link key={item.to} to={item.to} className={linkClass(item.to)}>
              {item.label}
            </Link>
          ))}

          {staffItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(linkClass("/staff"), "flex items-center gap-1")}>
                <ShieldCheck className="h-4 w-4" /> Staff <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {staffItems.map((item) => (
                  <DropdownMenuItem key={item.to} asChild>
                    <Link to={item.to}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {adminItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(linkClass("/admin"), "flex items-center gap-1")}>
                <Crown className="h-4 w-4" /> Administración <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {adminItems.map((item) => (
                  <DropdownMenuItem key={item.to} asChild>
                    <Link to={item.to}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/notificaciones"
                className="relative rounded-md p-2 text-muted-foreground transition-colors hover:text-primary"
                aria-label="Notificaciones"
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                    <UserIcon className="h-4 w-4" />
                    <span className="max-w-28 truncate">{profile?.username ?? "Perfil"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="truncate">{profile?.username}</span>
                    <span className="text-xs" style={{ color: rank?.color }}>
                      {rank?.name}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/perfil">Mi perfil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/mis-tickets">Mis tickets</Link>
                  </DropdownMenuItem>
                  {isStaff && (
                    <DropdownMenuItem asChild>
                      <Link to="/staff/historial">Mi actividad</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void handleSignOut()}>
                    <LogOut className="h-4 w-4" /> Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Iniciar sesión</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth" search={{ modo: "registro" }}>
                  Registrarse
                </Link>
              </Button>
            </div>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Menú">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[86vw] max-w-sm overflow-y-auto">
              <SheetTitle className="brand-title text-sm">
                <span className="text-primary">DINASTIA</span> RP
              </SheetTitle>
              <div className="mt-6 flex flex-col gap-1">
                {main.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 text-base text-foreground hover:bg-secondary"
                  >
                    {item.label}
                  </Link>
                ))}

                {staffItems.length > 0 && (
                  <>
                    <p className="mt-4 px-3 text-xs tracking-widest text-muted-foreground uppercase">
                      Staff
                    </p>
                    {staffItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className="rounded-lg px-3 py-3 text-base text-foreground hover:bg-secondary"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </>
                )}

                {adminItems.length > 0 && (
                  <>
                    <p className="mt-4 px-3 text-xs tracking-widest text-muted-foreground uppercase">
                      Administración
                    </p>
                    {adminItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className="rounded-lg px-3 py-3 text-base text-foreground hover:bg-secondary"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </>
                )}

                <div className="mt-6 flex flex-col gap-2 border-t border-border pt-6">
                  {user ? (
                    <>
                      <Button variant="outline" asChild onClick={() => setOpen(false)}>
                        <Link to="/perfil">Mi perfil</Link>
                      </Button>
                      <Button variant="ghost" onClick={() => void handleSignOut()}>
                        <LogOut className="h-4 w-4" /> Cerrar sesión
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild onClick={() => setOpen(false)}>
                        <Link to="/auth" search={{ modo: "registro" }}>
                          Registrarse
                        </Link>
                      </Button>
                      <Button variant="outline" asChild onClick={() => setOpen(false)}>
                        <Link to="/auth">Iniciar sesión</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      {isAdmin && null}
    </header>
  );
}
