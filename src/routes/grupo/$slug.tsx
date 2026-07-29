import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { NAV } from "@/lib/nav";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/grupo/$slug")({
  head: ({ params }) => {
    const group = NAV.find((g) => g.slug === params.slug);
    return {
      meta: [
        { title: group ? `${group.shortLabel} - Kienbaum Hub de Mkt & Vendas` : "Kienbaum Hub de Mkt & Vendas" },
      ],
    };
  },
  loader: ({ params }) => {
    const group = NAV.find((g) => g.slug === params.slug);
    if (!group) throw notFound();
    return { slug: params.slug };
  },
  component: GroupPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-muted-foreground">Grupo não encontrado.</p>
      <Link to="/" className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
    </div>
  ),
});

function GroupPage() {
  const { slug } = Route.useLoaderData();
  const { canAccessGestao } = useAuth();
  const group = NAV.find((g) => g.slug === slug)!;
  const items = group.items.filter((i) => (i.requireGestao ? canAccessGestao : true));
  const GroupIcon = group.icon;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Início
      </Link>
      <header className="mt-6 mb-10 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[4px] bg-primary text-primary-foreground">
          <GroupIcon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-accent">Área</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            {group.label}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {group.description}
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="group flex items-center gap-4 rounded-[4px] border-[0.5px] border-border bg-card p-5 transition-colors hover:border-accent"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-secondary text-accent">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-accent" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
