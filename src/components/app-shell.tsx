import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronRight, LogOut, User as UserIcon, Loader2 } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { NAV_INDEX } from "@/lib/nav";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { logActivity } from "@/lib/activity";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppShellInner>{children}</AppShellInner>
    </AuthProvider>
  );
}

function AppShellInner({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const isAuthRoute = pathname === "/auth";
  const isAdminRoute = pathname.startsWith("/admin");
  // Gerador de propostas de Competence Check: sub-app com layout próprio.
  const isPropostaPublica = pathname.startsWith("/proposta/");
  const isPropostasRoute = pathname === "/propostas" || pathname === "/nova-proposta";
  const isPublicRoute = isAuthRoute || isPropostaPublica;

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      void navigate({ to: "/auth", search: { redirect: pathname } as never });
    }
  }, [loading, user, isPublicRoute, pathname, navigate]);

  useEffect(() => {
    if (!user || isPublicRoute) return;
    const meta = NAV_INDEX[pathname as keyof typeof NAV_INDEX];
    const title = meta?.label ?? pathname;
    void logActivity({ userId: user.id, kind: "view", title, route: pathname });
  }, [user, pathname, isPublicRoute]);

  if (isPublicRoute) return <>{children}</>;
  if (loading || !user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (isAdminRoute || isPropostasRoute) return <>{children}</>;

  const crumbs = buildCrumbs(pathname);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <SidebarInset className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold uppercase tracking-[0.18em] text-foreground">
                Kienbaum
              </span>
              <span className="text-xs text-muted-foreground">|</span>
              <span className="text-sm font-medium text-muted-foreground">Hub de Mkt &amp; Vendas</span>
            </div>
            <nav className="ml-6 hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
              {crumbs.map((c, i) => (
                <span key={c.to ?? c.label} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="h-3 w-3" />}
                  {c.to && i < crumbs.length - 1 ? (
                    <Link to={c.to} className="hover:text-foreground">
                      {c.label}
                    </Link>
                  ) : (
                    <span className={i === crumbs.length - 1 ? "text-foreground" : ""}>
                      {c.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <UserIcon className="h-3.5 w-3.5" />
                {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={() => void signOut()}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function buildCrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; to?: string }[] = [{ label: "Início", to: "/" }];
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    const meta = NAV_INDEX[acc as keyof typeof NAV_INDEX];
    crumbs.push({ label: meta?.label ?? humanize(seg), to: meta ? acc : undefined });
  }
  return crumbs;
}

function humanize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ");
}