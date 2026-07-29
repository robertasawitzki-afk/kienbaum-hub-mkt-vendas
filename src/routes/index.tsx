import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { NAV } from "@/lib/nav";
import { useAuth } from "@/lib/auth-context";
import logoKienbaum from "@/assets/logo-kienbaum.png.asset.json";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kienbaum Hub de Mkt & Vendas" },
      { name: "description", content: "Plataforma interna de capacitação e operação dos Client Partners da Kienbaum." },
      { property: "og:title", content: "Kienbaum Hub de Mkt & Vendas" },
      { property: "og:description", content: "Capacitação, rotina e operação dos Client Partners." },
    ],
  }),
  component: Index,
});

function Index() {
  const { canAccessGestao } = useAuth();
  const groups = NAV.filter((g) => (g.requireGestao ? canAccessGestao : true));

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="mb-12">
        <div className="mb-8 flex items-center justify-center rounded-[4px] bg-primary px-8 py-6">
          <img src={logoKienbaum.url} alt="Kienbaum" className="h-10 w-auto" />
        </div>
        <p className="text-xs uppercase tracking-[0.22em] text-accent">Kienbaum Porto Alegre</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
          Hub de Marketing e Vendas
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Escolha uma área para acessar os conteúdos e ferramentas da Kienbaum.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => {
          const Icon = group.icon;
          const visibleItems = group.items.filter((i) => (i.requireGestao ? canAccessGestao : true));
          return (
            <Link
              key={group.slug}
              to="/grupo/$slug"
              params={{ slug: group.slug }}
              className="group flex flex-col rounded-[4px] border-[0.5px] border-border bg-card p-6 transition-colors hover:border-accent"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="text-sm font-semibold text-foreground">{group.label}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {group.description}
              </p>
              <p className="mt-4 text-[10px] uppercase tracking-[0.16em] text-accent">
                {visibleItems.length} {visibleItems.length === 1 ? "item" : "itens"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
