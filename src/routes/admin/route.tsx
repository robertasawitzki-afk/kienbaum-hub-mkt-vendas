import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Users, Activity, FolderOpen, History, Sparkles, ShieldAlert, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { adminExists } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const TABS = [
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/saude", label: "Saúde do Banco", icon: Activity },
  { to: "/admin/materiais", label: "Materiais", icon: FolderOpen },
  { to: "/admin/conteudo", label: "Conteúdo Gerado", icon: Sparkles },
  { to: "/admin/historico", label: "Auditoria", icon: History },
] as const;

function AdminLayout() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [adminMissing, setAdminMissing] = useState<boolean | null>(null);
  const runAdminExists = useServerFn(adminExists);

  useEffect(() => {
    if (!user || isAdmin) return;
    void runAdminExists({}).then((r: any) => setAdminMissing(!r?.exists));
  }, [user, isAdmin, runAdminExists]);

  useEffect(() => {
    if (loading || !user) return;
    if (isAdmin) return;
    if (adminMissing === false) {
      void navigate({ to: "/" });
    }
  }, [loading, user, isAdmin, adminMissing, navigate]);

  if (loading || !user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAdmin && adminMissing !== true) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao app
          </Link>
          <div className="ml-4 flex items-baseline gap-3">
            <h1 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
              Painel Admin
            </h1>
            <span className="text-xs text-muted-foreground">Kienbaum Hub de Mkt & Vendas</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5 text-primary" />
            Acesso restrito
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-6">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
